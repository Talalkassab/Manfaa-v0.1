import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/server-auth';

// Mapping of file extensions to content types
const contentTypeMap: Record<string, string> = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Text
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  
  // Archives
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  
  // Audio/Video
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  wav: 'audio/wav',
  avi: 'video/x-msvideo',
  
  // Other
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
};

// List of buckets to search in order of priority
const bucketPriorities = ['business-files', 'businesses', 'documents'];

// Check if the request has permissions to access this file
async function checkFilePermissions(bucket: string, filePath: string): Promise<{ allowed: boolean; error?: string; }> {
  try {
    // Extract business ID from the file path
    // Paths could be:
    // - businesses/123456/file.jpg
    // - 123456/file.jpg
    // - documents/123456/file.jpg
    
    let businessId;
    const parts = filePath.split('/');
    
    if (parts.length >= 2) {
      // If format is businesses/123456/file.jpg, business ID is the second part
      if (parts[0] === 'businesses') {
        businessId = parts[1];
      } else {
        // If format is 123456/file.jpg, business ID is the first part
        businessId = parts[0];
      }
    } else {
      // Can't determine business ID
      return { allowed: true }; // Default to allow for non-business files
    }
    
    // If we can't determine a business ID, allow access
    if (!businessId) {
      return { allowed: true };
    }
    
    // Get authenticated user
    const { user } = await getAuthenticatedUser();
    
    // If no user, only allow public files
    if (!user) {
      // Check if this file is in the business_files table with public visibility
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const normalizedPath = filePath.replace(/^businesses\//, '');
      
      // Try to find this file in the business_files table
      const { data: fileData, error: fileError } = await supabase
        .from('business_files')
        .select('visibility')
        .or(`file_path.eq.${filePath},file_path.eq.${normalizedPath}`)
        .limit(1);
        
      if (fileError) {
        console.error('Error checking file permissions:', fileError);
        return { allowed: false, error: 'Error checking file permissions' };
      }
      
      // If file not found in table or visibility is public, allow access
      if (!fileData || fileData.length === 0 || fileData[0].visibility === 'public') {
        return { allowed: true };
      }
      
      return { allowed: false, error: 'Authentication required to access this file' };
    }
    
    // Get the business to check if user is owner
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('user_id, owner_id')
      .eq('id', businessId)
      .single();
      
    if (businessError) {
      console.error('Error fetching business for permission check:', businessError);
      return { allowed: false, error: 'Error checking business ownership' };
    }
    
    // If user is owner, allow access
    const ownerId = business.user_id || business.owner_id;
    if (user.id === ownerId) {
      return { allowed: true };
    }
    
    // Check if file exists in business_files table and check its visibility
    const { data: fileData, error: fileError } = await supabase
      .from('business_files')
      .select('visibility')
      .or(`file_path.eq.${filePath},file_path.eq.${filePath.replace(/^businesses\//, '')}`)
      .limit(1);
      
    if (fileError) {
      console.error('Error checking file permissions:', fileError);
      return { allowed: false, error: 'Error checking file permissions' };
    }
    
    if (!fileData || fileData.length === 0) {
      // If file not found in table, default to allowing access for authenticated users
      return { allowed: true };
    }
    
    const visibility = fileData[0].visibility;
    
    // Check visibility rules
    if (visibility === 'public') {
      return { allowed: true };
    } else if (visibility === 'private') {
      // Only owner can access private files
      return { allowed: false, error: 'You do not have permission to access this file' };
    } else if (visibility === 'nda') {
      // Check if user has signed an NDA for this business
      const { data: ndaData, error: ndaError } = await supabase
        .from('ndas')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .limit(1);
        
      if (ndaError) {
        console.error('Error checking NDA status:', ndaError);
        return { allowed: false, error: 'Error checking NDA status' };
      }
      
      if (!ndaData || ndaData.length === 0) {
        return { allowed: false, error: 'NDA required to access this file' };
      }
      
      return { allowed: true };
    }
    
    // Default to deny if visibility is unknown
    return { allowed: false, error: 'Unknown file visibility rule' };
  } catch (error) {
    console.error('Error in permission check:', error);
    return { allowed: false, error: 'Error checking permissions' };
  }
}

// Try to download file from multiple buckets in order of priority
async function tryDownloadFromMultipleBuckets(filePath: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  let lastError = null;
  
  // First, check if buckets exist
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();
    
  if (bucketsError) {
    throw new Error(`Error fetching storage buckets: ${bucketsError.message}`);
  }
  
  const existingBuckets = buckets.map(bucket => bucket.name);
  console.log('Available buckets:', existingBuckets);
  
  // Try each bucket in priority order
  for (const bucket of bucketPriorities) {
    // Skip if bucket doesn't exist
    if (!existingBuckets.includes(bucket)) continue;
    
    console.log(`Trying bucket: ${bucket}, path: ${filePath}`);
    
    try {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .download(filePath);
        
      if (!error && data) {
        console.log(`File found in bucket: ${bucket}`);
        return { data, bucket };
      }
      
      lastError = error;
    } catch (error) {
      console.error(`Error accessing ${bucket}/${filePath}:`, error);
      lastError = error;
    }
    
    // Try alternative path formats if business-related
    if (bucket === 'business-files' && filePath.includes('/')) {
      // Try with and without 'businesses/' prefix
      const alternativePath = filePath.startsWith('businesses/') 
        ? filePath.substring('businesses/'.length) 
        : `businesses/${filePath}`;
        
      console.log(`Trying alternative path: ${alternativePath} in bucket: ${bucket}`);
      
      try {
        const { data, error } = await supabase
          .storage
          .from(bucket)
          .download(alternativePath);
          
        if (!error && data) {
          console.log(`File found with alternative path in bucket: ${bucket}`);
          return { data, bucket };
        }
      } catch (error) {
        console.error(`Error accessing alternative path in ${bucket}:`, error);
      }
    }
  }
  
  // If we get here, file was not found in any bucket
  throw lastError || new Error('File not found in any storage bucket');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { bucket: string; path: string[] } }
) {
  try {
    const { bucket, path } = params;
    const filePath = path.join('/');
    
    console.log(`Storage API accessing bucket: ${bucket}, path: ${filePath}`);
    
    // Check permissions first
    const permissionCheck = await checkFilePermissions(bucket, filePath);
    
    if (!permissionCheck.allowed) {
      return NextResponse.json(
        { error: permissionCheck.error || 'Access denied' },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*', // CORS for error responses
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Try to download the file from the specified bucket first, then try alternatives
    let fileData;
    let downloadBucket = bucket;
    
    try {
      // Try primary bucket first (the one specified in the URL)
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .download(filePath);
        
      if (error) {
        // If not found, try with multi-bucket search
        console.log(`File not found in ${bucket}, trying alternative buckets...`);
        const multiResult = await tryDownloadFromMultipleBuckets(filePath);
        fileData = multiResult.data;
        downloadBucket = multiResult.bucket;
      } else {
        fileData = data;
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Final attempt - try multi-bucket search
      try {
        const multiResult = await tryDownloadFromMultipleBuckets(filePath);
        fileData = multiResult.data;
        downloadBucket = multiResult.bucket;
      } catch (fallbackError) {
        console.error('All download attempts failed:', fallbackError);
        return NextResponse.json(
          { error: 'File not found in any storage bucket' },
          { 
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*', // CORS for error responses
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
    }
    
    if (!fileData) {
      return NextResponse.json(
        { error: 'File not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    console.log(`Successfully retrieved file from bucket: ${downloadBucket}`);
    
    // Process and return the file with proper content type
    return processFileAndReturn(fileData, filePath);
  } catch (error: any) {
    console.error('Error processing storage request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error.message || 'Unknown error') },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

function processFileAndReturn(data: Blob, filePath: string) {
  // Get content type - default to application/octet-stream if not known
  let contentType = 'application/octet-stream';
  
  // Try to infer content type from file extension
  const fileExtension = filePath.split('.').pop()?.toLowerCase();
  if (fileExtension && fileExtension in contentTypeMap) {
    contentType = contentTypeMap[fileExtension];
  }
  
  // Convert Blob to ArrayBuffer
  return data.arrayBuffer().then(arrayBuffer => {
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // CORS headers for file access
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  });
} 