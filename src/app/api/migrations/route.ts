import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiMiddleware,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/api-middleware';

// Migration SQL for business table with all required columns
const BUSINESS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  address TEXT,
  established_year INTEGER,
  employees INTEGER,
  asking_price DECIMAL(12,2),
  annual_revenue DECIMAL(12,2),
  profit DECIMAL(12,2),
  inventory_value DECIMAL(12,2),
  asset_value DECIMAL(12,2),
  reason_for_selling TEXT,
  privacy_level TEXT DEFAULT 'public',
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS businesses_user_id_idx ON businesses(user_id);
CREATE INDEX IF NOT EXISTS businesses_status_idx ON businesses(status);
CREATE INDEX IF NOT EXISTS businesses_category_idx ON businesses(category);
CREATE INDEX IF NOT EXISTS businesses_address_idx ON businesses(address);

-- Add owner_id as an alias for user_id if it doesn't exist
DO $$
BEGIN
  BEGIN
    ALTER TABLE businesses ADD COLUMN owner_id UUID;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'Column owner_id already exists in businesses';
  END;
END $$;

-- Add RLS policies
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS businesses_select_policy ON businesses;
DROP POLICY IF EXISTS businesses_insert_policy ON businesses;
DROP POLICY IF EXISTS businesses_update_policy ON businesses;
DROP POLICY IF EXISTS businesses_delete_policy ON businesses;
DROP POLICY IF EXISTS businesses_admin_policy ON businesses;

-- Create RLS policies
CREATE POLICY businesses_select_policy ON businesses
  FOR SELECT USING (
    status = 'approved' OR
    user_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY businesses_insert_policy ON businesses
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY businesses_update_policy ON businesses
  FOR UPDATE USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY businesses_delete_policy ON businesses
  FOR DELETE USING (
    user_id = auth.uid() OR
    auth.jwt() ->> 'role' = 'admin'
  );
`;

// Migration SQL for business_files table
const BUSINESS_FILES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS business_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  visibility TEXT DEFAULT 'public',
  category TEXT DEFAULT 'other',
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS business_files_business_id_idx ON business_files(business_id);
CREATE INDEX IF NOT EXISTS business_files_visibility_idx ON business_files(visibility);
CREATE INDEX IF NOT EXISTS business_files_category_idx ON business_files(category);

-- Add RLS policies
ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS business_files_select_policy ON business_files;
DROP POLICY IF EXISTS business_files_insert_policy ON business_files;
DROP POLICY IF EXISTS business_files_update_policy ON business_files;
DROP POLICY IF EXISTS business_files_delete_policy ON business_files;

-- Create RLS policies
CREATE POLICY business_files_select_policy ON business_files
  FOR SELECT USING (
    -- Public files are visible to everyone
    visibility = 'public' OR
    -- File owner can always see their files
    uploaded_by = auth.uid() OR
    -- Business owner can see all files for their business
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_files.business_id 
      AND businesses.user_id = auth.uid()
    ) OR
    -- NDA files are visible if user has approved NDA
    (
      visibility = 'nda' AND
      EXISTS (
        SELECT 1 FROM ndas
        WHERE ndas.business_id = business_files.business_id
        AND ndas.user_id = auth.uid()
        AND ndas.status = 'approved'
      )
    ) OR
    -- Admins can see everything
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY business_files_insert_policy ON business_files
  FOR INSERT WITH CHECK (
    -- File uploader must be the business owner or admin
    uploaded_by = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = business_files.business_id
        AND businesses.user_id = auth.uid()
      ) OR
      auth.jwt() ->> 'role' = 'admin'
    )
  );

CREATE POLICY business_files_update_policy ON business_files
  FOR UPDATE USING (
    -- Only file uploader, business owner, or admin can update
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_files.business_id
      AND businesses.user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY business_files_delete_policy ON business_files
  FOR DELETE USING (
    -- Only file uploader, business owner, or admin can delete
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_files.business_id
      AND businesses.user_id = auth.uid()
    ) OR
    auth.jwt() ->> 'role' = 'admin'
  );
`;

// Migration SQL for NDAs table
const NDAS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ndas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  message TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ndas_business_id_idx ON ndas(business_id);
CREATE INDEX IF NOT EXISTS ndas_user_id_idx ON ndas(user_id);
CREATE INDEX IF NOT EXISTS ndas_status_idx ON ndas(status);

-- Add RLS policies
ALTER TABLE ndas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS ndas_select_policy ON ndas;
DROP POLICY IF EXISTS ndas_insert_policy ON ndas;
DROP POLICY IF EXISTS ndas_update_policy ON ndas;

-- Create RLS policies
CREATE POLICY ndas_select_policy ON ndas
  FOR SELECT USING (
    -- User can see their own NDAs
    user_id = auth.uid() OR
    -- Business owner can see NDAs for their business
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = ndas.business_id
      AND businesses.user_id = auth.uid()
    ) OR
    -- Admin can see all NDAs
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY ndas_insert_policy ON ndas
  FOR INSERT WITH CHECK (
    -- User can create NDA requests for businesses they don't own
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = ndas.business_id
      AND businesses.user_id = auth.uid()
    )
  );

CREATE POLICY ndas_update_policy ON ndas
  FOR UPDATE USING (
    -- Business owner can update NDA status
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = ndas.business_id
      AND businesses.user_id = auth.uid()
    ) OR
    -- Admin can update any NDA
    auth.jwt() ->> 'role' = 'admin'
  );
`;

// Migration SQL for messages table
const MESSAGES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message queries
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_business_id_idx ON messages(business_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Add RLS policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS messages_select_policy ON messages;
DROP POLICY IF EXISTS messages_insert_policy ON messages;
DROP POLICY IF EXISTS messages_update_policy ON messages;
DROP POLICY IF EXISTS messages_delete_policy ON messages;

-- Create RLS policies
CREATE POLICY messages_select_policy ON messages
  FOR SELECT USING (
    -- User can see messages they've sent or received
    sender_id = auth.uid() OR
    recipient_id = auth.uid() OR
    -- Admin can see all messages
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY messages_insert_policy ON messages
  FOR INSERT WITH CHECK (
    -- User can only send messages as themselves
    sender_id = auth.uid()
  );

CREATE POLICY messages_update_policy ON messages
  FOR UPDATE USING (
    -- User can only update the read status of messages they've received
    (recipient_id = auth.uid() AND (OLD.read IS DISTINCT FROM NEW.read)) OR
    -- Admin can update any message
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY messages_delete_policy ON messages
  FOR DELETE USING (
    -- Only admin can delete messages
    auth.jwt() ->> 'role' = 'admin'
  );
`;

// Storage buckets creation
const CREATE_STORAGE_BUCKETS = `
-- This function will create storage buckets if they don't exist
CREATE OR REPLACE FUNCTION create_storage_buckets() 
RETURNS void AS $$
DECLARE
  supabase_storage_owner text := 'supabase_storage_admin';
BEGIN
  -- We need to use dynamic SQL since storage API calls aren't directly in SQL
  -- This would typically be done via the Supabase JS client instead
  RAISE NOTICE 'Creating storage buckets must be done via the Supabase client, not direct SQL';
END;
$$ LANGUAGE plpgsql;

-- Call the function to display the notice
SELECT create_storage_buckets();
`;

// Map of migration commands by name
const MIGRATIONS = {
  'businesses': BUSINESS_TABLE_SQL,
  'business_files': BUSINESS_FILES_TABLE_SQL,
  'ndas': NDAS_TABLE_SQL,
  'messages': MESSAGES_TABLE_SQL,
  'storage': CREATE_STORAGE_BUCKETS,
  'all': `
    -- Run all migrations in sequence
    ${BUSINESS_TABLE_SQL}
    ${BUSINESS_FILES_TABLE_SQL}
    ${NDAS_TABLE_SQL}
    ${MESSAGES_TABLE_SQL}
    ${CREATE_STORAGE_BUCKETS}
  `
};

// Handler for the migrations API
const handler = async (req: NextRequest, params: any, { user, supabase, isAdmin }) => {
  // Only POST requests are supported for running migrations
  if (req.method !== 'POST' && req.method !== 'GET') {
    return createErrorResponse('Method not allowed. Only POST and GET requests are supported.', 405);
  }

  // GET request returns available migrations
  if (req.method === 'GET') {
    return createSuccessResponse({
      availableMigrations: Object.keys(MIGRATIONS),
      description: 'These are the available database migrations that can be run'
    });
  }

  try {
    // Parse request to get migration name
    const body = await req.json();
    const { migration } = body;

    if (!migration) {
      return createErrorResponse('Migration name is required', 400);
    }

    if (!MIGRATIONS[migration]) {
      return createErrorResponse(
        `Invalid migration name. Available migrations: ${Object.keys(MIGRATIONS).join(', ')}`,
        400
      );
    }

    // Get the SQL for the requested migration
    const sql = MIGRATIONS[migration];

    // For safety, we'll return the SQL in development mode without executing
    if (process.env.NODE_ENV === 'development') {
      // Execute the migration
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error('Migration error:', error);
        return createErrorResponse('Error running migration', 500, {
          error: error.message,
          sql
        });
      }

      return createSuccessResponse({
        message: `Migration '${migration}' completed successfully`,
        migrationName: migration
      });
    } else {
      // In production, don't run SQL directly via API
      return createErrorResponse(
        'Direct SQL execution via API is disabled in production for security. Please use database migration tools.', 
        403,
        { sql }
      );
    }
  } catch (error: any) {
    console.error('Migration API error:', error);
    return createErrorResponse('Error processing migration request', 500, error.message);
  }
};

// Export the handler with middleware that requires admin authentication
export const GET = withApiMiddleware(handler, { requireAuth: true, requireAdmin: true });
export const POST = withApiMiddleware(handler, { requireAuth: true, requireAdmin: true }); 