import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const results = {
      tablesChecked: [],
      tablesCreated: [],
      errors: []
    };
    
    // Check if the business_files table exists by trying a simple query
    const { data: fileCheck, error: fileCheckError } = await supabase
      .from('business_files')
      .select('count')
      .limit(1);
      
    const businessFilesExists = !fileCheckError || !fileCheckError.message.includes('does not exist');
    
    results.tablesChecked.push({
      table: 'business_files',
      exists: businessFilesExists,
      error: fileCheckError
    });
    
    // Create the business_files table if it doesn't exist
    if (!businessFilesExists) {
      // We need to use rpc to execute SQL directly
      const { data: createTableResult, error: createTableError } = await supabase.rpc(
        'create_business_files_table',
        {}
      );
      
      if (createTableError) {
        // If the RPC function doesn't exist, we need to create it first
        if (createTableError.message.includes('function') && createTableError.message.includes('does not exist')) {
          // Create the function that will create our table
          const { data: createFnResult, error: createFnError } = await supabase.rpc(
            'admin_create_function',
            {
              function_name: 'create_business_files_table',
              function_sql: `
                CREATE OR REPLACE FUNCTION create_business_files_table()
                RETURNS void AS $$
                BEGIN
                  -- Create the business_files table
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
                  CREATE POLICY business_files_owner_select
                    ON business_files FOR SELECT
                    USING (
                      EXISTS (
                        SELECT 1 FROM businesses 
                        WHERE businesses.id = business_files.business_id
                        AND businesses.user_id = auth.uid()
                      )
                    );
                  
                  -- Allow business owners to insert files
                  CREATE POLICY business_files_owner_insert
                    ON business_files FOR INSERT
                    WITH CHECK (
                      EXISTS (
                        SELECT 1 FROM businesses 
                        WHERE businesses.id = business_files.business_id
                        AND businesses.user_id = auth.uid()
                      )
                    );
                  
                  -- Allow business owners to update their files
                  CREATE POLICY business_files_owner_update
                    ON business_files FOR UPDATE
                    USING (
                      EXISTS (
                        SELECT 1 FROM businesses 
                        WHERE businesses.id = business_files.business_id
                        AND businesses.user_id = auth.uid()
                      )
                    );
                  
                  -- Allow business owners to delete their files
                  CREATE POLICY business_files_owner_delete
                    ON business_files FOR DELETE
                    USING (
                      EXISTS (
                        SELECT 1 FROM businesses 
                        WHERE businesses.id = business_files.business_id
                        AND businesses.user_id = auth.uid()
                      )
                    );
                  
                  -- Allow admins to access all files
                  CREATE POLICY business_files_admin_all
                    ON business_files FOR ALL
                    USING (
                      EXISTS (
                        SELECT 1 FROM auth.users
                        WHERE auth.users.id = auth.uid()
                        AND auth.users.role = 'admin'
                      )
                    );
                  
                  -- Allow users with signed NDAs to view files for the business
                  CREATE POLICY business_files_nda_select
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
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
              `
            }
          );
          
          if (createFnError) {
            results.errors.push({
              operation: 'create_function',
              error: createFnError
            });
          } else {
            // Now try to call the function we just created
            const { data: callFnResult, error: callFnError } = await supabase.rpc(
              'create_business_files_table',
              {}
            );
            
            if (callFnError) {
              results.errors.push({
                operation: 'call_create_table_function',
                error: callFnError
              });
            } else {
              results.tablesCreated.push('business_files');
            }
          }
        } else {
          results.errors.push({
            operation: 'create_table',
            error: createTableError
          });
        }
      } else {
        results.tablesCreated.push('business_files');
      }
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 