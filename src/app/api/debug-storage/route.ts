import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const businessId = '08df79a2-e3f9-4093-88d5-e51fc2307be7';
    
    // Check if the buckets exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketsError) {
      return NextResponse.json(
        { error: 'Failed to list buckets', details: bucketsError },
        { status: 500 }
      );
    }
    
    // Check for files in the 'businesses' bucket
    const { data: businessFiles, error: businessError } = await supabase
      .storage
      .from('businesses')
      .list(businessId);
    
    // Check for files in the 'business-files' bucket  
    const { data: businessFilesAlt, error: businessErrorAlt } = await supabase
      .storage
      .from('business-files')
      .list(`businesses/${businessId}`);
    
    // Check for direct files in business-files bucket
    const { data: businessFilesDir, error: businessErrorDir } = await supabase
      .storage
      .from('business-files')
      .list();
      
    // Check if the document subfolder exists in businesses bucket
    const { data: docFiles, error: docError } = await supabase
      .storage
      .from('businesses')
      .list(`${businessId}/documents`);
    
    // Check the database record for this business
    const { data: business, error: businessDbError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    
    // Check if there are any file records in the business_files table
    const { data: fileRecords, error: fileRecordsError } = await supabase
      .from('business_files')
      .select('*')
      .eq('business_id', businessId);
    
    return NextResponse.json({
      buckets: buckets,
      business_data: business,
      business_db_error: businessDbError,
      business_files: businessFiles || [],
      business_error: businessError,
      business_files_alt: businessFilesAlt || [],
      business_error_alt: businessErrorAlt,
      business_files_dir: businessFilesDir || [],
      business_error_dir: businessErrorDir,
      document_files: docFiles || [],
      document_error: docError,
      file_records: fileRecords || [],
      file_records_error: fileRecordsError
    });
  } catch (error: any) {
    console.error('Error checking storage:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 