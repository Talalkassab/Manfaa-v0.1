import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    // Authenticate the user
    const authResult = await getAuthenticatedUser();
    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const role = authResult.user.user_metadata?.role;
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = [];

    // Check if table exists already
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('business_files')
      .select('id')
      .limit(1);

    if (tableCheckError && tableCheckError.code !== '42P01') {
      // There was an error other than "table doesn't exist"
      results.push({ 
        action: 'Check if business_files table exists', 
        success: false,
        error: tableCheckError.message
      });
    } else if (!tableCheckError) {
      // Table already exists
      results.push({ 
        action: 'Check business_files table', 
        success: true,
        note: 'Table already exists' 
      });
    } else {
      // Table doesn't exist, so we'll try to create it manually in the Supabase dashboard
      results.push({ 
        action: 'Check business_files table', 
        success: false,
        note: 'Table does not exist, must be created manually' 
      });
    }

    // Create storage buckets if they don't exist
    try {
      await supabase.storage.createBucket('businesses', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      results.push({ action: 'Create businesses bucket', success: true });
    } catch (bucketError: any) {
      results.push({ 
        action: 'Create businesses bucket', 
        success: false,
        note: 'Bucket may already exist',
        error: bucketError.message 
      });
    }

    try {
      await supabase.storage.createBucket('business-files', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      results.push({ action: 'Create business-files bucket', success: true });
    } catch (bucketError: any) {
      results.push({ 
        action: 'Create business-files bucket', 
        success: false,
        note: 'Bucket may already exist',
        error: bucketError.message 
      });
    }

    // Check if there were any errors
    const hasErrors = results.some(r => !r.success);

    const SQL_SCRIPT = `
-- Create the business_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  visibility TEXT DEFAULT 'public',
  category TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies if table was just created
ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;

-- Allow business owners to see their own files
CREATE POLICY IF NOT EXISTS business_files_owner_select
  ON business_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_files.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Allow business owners to insert files
CREATE POLICY IF NOT EXISTS business_files_owner_insert
  ON business_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_files.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Allow business owners to update their files
CREATE POLICY IF NOT EXISTS business_files_owner_update
  ON business_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_files.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Allow business owners to delete their files
CREATE POLICY IF NOT EXISTS business_files_owner_delete
  ON business_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_files.business_id
      AND businesses.user_id = auth.uid()
    )
  );

-- Allow admins to access all files
CREATE POLICY IF NOT EXISTS business_files_admin_all
  ON business_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );

-- Allow users with signed NDAs to view files for the business
CREATE POLICY IF NOT EXISTS business_files_nda_select
  ON business_files FOR SELECT
  USING (
    (visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM ndas
      WHERE ndas.business_id = business_files.business_id
      AND ndas.user_id = auth.uid()
      AND ndas.status = 'approved'
    ))
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS business_files_business_id_idx ON business_files(business_id);
CREATE INDEX IF NOT EXISTS business_files_uploaded_by_idx ON business_files(uploaded_by);
`;

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors 
        ? 'Storage buckets created, but manual SQL execution is needed' 
        : 'Storage buckets created successfully',
      details: results,
      manualInstructions: `
        To complete the migration, please execute the following SQL in your Supabase SQL Editor:
        
        ${SQL_SCRIPT}
        
        Steps:
        1. Log in to your Supabase dashboard
        2. Go to the SQL Editor (Table Editor > SQL)
        3. Copy and paste the SQL above
        4. Click "Run" to execute the script
      `
    });
  } catch (error: any) {
    console.error('Unexpected error running migration:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error.message,
        manualInstructions: `
          Please run the following SQL manually in the Supabase SQL Editor:
          
          CREATE TABLE IF NOT EXISTS business_files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            visibility TEXT DEFAULT 'public',
            category TEXT,
            description TEXT, 
            uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;
          
          -- Then add the necessary policies (see the full script in the logs)
        `
      },
      { status: 500 }
    );
  }
} 