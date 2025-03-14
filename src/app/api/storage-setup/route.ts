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
      bucketsBefore: [],
      createdBuckets: [],
      errors: [],
      bucketsAfter: []
    };
    
    // List existing buckets
    const { data: existingBuckets, error: listError } = await supabase
      .storage
      .listBuckets();
      
    if (listError) {
      results.errors.push({ operation: 'list_buckets', error: listError });
    } else {
      results.bucketsBefore = existingBuckets;
    }
    
    // Check if businesses bucket exists, create if not
    if (!existingBuckets || !existingBuckets.some(bucket => bucket.name === 'businesses')) {
      const { data: businessesBucket, error: businessesBucketError } = await supabase
        .storage
        .createBucket('businesses', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
        
      if (businessesBucketError) {
        results.errors.push({ operation: 'create_businesses_bucket', error: businessesBucketError });
      } else {
        results.createdBuckets.push('businesses');
      }
    }
    
    // Check if business-files bucket exists, create if not
    if (!existingBuckets || !existingBuckets.some(bucket => bucket.name === 'business-files')) {
      const { data: businessFilesBucket, error: businessFilesBucketError } = await supabase
        .storage
        .createBucket('business-files', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
        
      if (businessFilesBucketError) {
        results.errors.push({ operation: 'create_business_files_bucket', error: businessFilesBucketError });
      } else {
        results.createdBuckets.push('business-files');
      }
    }
    
    // List buckets after creation
    const { data: bucketsAfter, error: listAfterError } = await supabase
      .storage
      .listBuckets();
      
    if (listAfterError) {
      results.errors.push({ operation: 'list_buckets_after', error: listAfterError });
    } else {
      results.bucketsAfter = bucketsAfter;
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error setting up storage:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
} 