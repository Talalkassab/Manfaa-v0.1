-- Create the business_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS business_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  visibility TEXT DEFAULT 'public',
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
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