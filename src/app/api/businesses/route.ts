import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const location = searchParams.get('location') || '';
    const userId = searchParams.get('userId') || '';
    const status = searchParams.get('status') || 'approved'; // Default to approved businesses

    console.log(`Fetching businesses with filters:`, {
      page, limit, search, category, location, userId, status
    });

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Start building the query - modified to handle schema issues
    let query = supabase
      .from('businesses')
      .select('*', { count: 'exact' }); // Removed the foreign key reference that was causing issues

    // Filter by status
    query = query.eq('status', status);

    // Apply filters if provided
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (location) {
      query = query.eq('location', location);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    // Execute the query
    const { data: businesses, error, count } = await query;

    if (error) {
      console.error('Error fetching businesses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / limit);

    // Add status badges for UI display
    const businessesWithBadges = businesses.map(business => {
      let statusBadge = {
        color: 'gray',
        label: 'Unknown'
      };

      switch (business.status) {
        case 'approved':
          statusBadge = {
            color: 'green',
            label: 'Approved'
          };
          break;
        case 'pending':
          statusBadge = {
            color: 'yellow',
            label: 'Pending'
          };
          break;
        case 'rejected':
          statusBadge = {
            color: 'red',
            label: 'Rejected'
          };
          break;
      }

      return {
        ...business,
        statusBadge
      };
    });

    // If we need owner data, fetch it separately (only if there are businesses)
    if (businesses.length > 0) {
      try {
        // Get unique user IDs from businesses
        const userIds = [...new Set(businesses.filter(b => b.user_id).map(b => b.user_id))];
        
        if (userIds.length > 0) {
          // Fetch user data for these IDs
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, user_metadata')
            .in('id', userIds);
            
          if (!usersError && users) {
            // Create a map of user data by ID for easy lookup
            const userMap = users.reduce((map, user) => {
              map[user.id] = user;
              return map;
            }, {});
            
            // Add owner data to each business
            businessesWithBadges.forEach(business => {
              if (business.user_id && userMap[business.user_id]) {
                business.owner = userMap[business.user_id];
              }
            });
          } else {
            console.log('Could not fetch owner data:', usersError);
          }
        }
      } catch (ownerError) {
        console.error('Error fetching owner data:', ownerError);
        // Continue without owner data rather than failing the request
      }
    }

    return NextResponse.json({
      businesses: businessesWithBadges,
      totalPages,
      currentPage: page,
      total: count || 0
    });
  } catch (error) {
    console.error('Unexpected error fetching businesses:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the request body
    const data = await request.json();
    const { images, ...businessData } = data;
    
    // Get user using our improved authentication helper
    const authResult = await getAuthenticatedUser();
    
    console.log("Auth check result:", { 
      hasUser: !!authResult.user, 
      userId: authResult.user?.id, 
      error: authResult.error
    });
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authResult.error || 'You must be logged in'}` },
        { status: 401 }
      );
    }
    
    // Create a Supabase client for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('Creating business for authenticated user:', authResult.user.id);
    
    // First check the database schema to ensure we're using the correct column names
    const { data: tableInfo, error: schemaError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.error('Error checking business table schema:', schemaError);
      // If the table doesn't exist at all, this is a more serious setup issue
      if (schemaError.code === '42P01') { // relation does not exist
        return NextResponse.json(
          { error: 'The businesses table does not exist in the database. Please run the initial database setup.' },
          { status: 500 }
        );
      }
    }
    
    // Get columns from the tableInfo if available to verify schema
    const availableColumns = tableInfo && tableInfo[0] ? Object.keys(tableInfo[0]) : [];
    console.log('Available columns in businesses table:', availableColumns);
    
    // Check if financial_info exists as a column (JSONB field)
    const hasFinancialInfoColumn = availableColumns.includes('financial_info');
    console.log('Has financial_info JSONB column:', hasFinancialInfoColumn);
    
    // Generate a slug based on the business name/title
    const slug = businessData.title || businessData.name
      ? (businessData.title || businessData.name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : `business-${Date.now()}`;
    
    // Create a flexible data object that can handle different database schemas
    let finalBusinessData: Record<string, any> = {
      // Basic required fields
      name: businessData.title || businessData.name,
      category: businessData.category,
      description: businessData.description,
      location: businessData.location,
      owner_id: authResult.user.id,
      user_id: authResult.user.id, // Include both for flexibility
      slug: slug,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Handle financial fields - either in financial_info JSONB or as separate columns
    if (hasFinancialInfoColumn) {
      // If financial_info exists as a JSONB column, structure the financial data there
      finalBusinessData.financial_info = {
        asking_price: parseNumericField(businessData.askingPrice),
        revenue: parseNumericField(businessData.revenue),
        profit: parseNumericField(businessData.profit),
        inventory_value: parseNumericField(businessData.inventory),
        asset_value: parseNumericField(businessData.assets)
      };
      
      // Remove any potential top-level fields that should be in the JSONB
      ['asking_price', 'revenue', 'profit', 'inventory_value', 'asset_value', 'annual_revenue'].forEach(field => {
        if (finalBusinessData[field] !== undefined) {
          delete finalBusinessData[field];
        }
      });
    } else {
      // Fall back to using individual columns if financial_info doesn't exist
      if (availableColumns.includes('asking_price')) {
        finalBusinessData.asking_price = parseNumericField(businessData.askingPrice);
      }
      
      if (availableColumns.includes('revenue')) {
        finalBusinessData.revenue = parseNumericField(businessData.revenue);
      } else if (availableColumns.includes('annual_revenue')) {
        finalBusinessData.annual_revenue = parseNumericField(businessData.revenue);
      }
      
      if (availableColumns.includes('profit')) {
        finalBusinessData.profit = parseNumericField(businessData.profit);
      }
      
      if (availableColumns.includes('inventory_value')) {
        finalBusinessData.inventory_value = parseNumericField(businessData.inventory);
      }
      
      if (availableColumns.includes('asset_value')) {
        finalBusinessData.asset_value = parseNumericField(businessData.assets);
      }
    }
    
    // Handle general and operational info fields
    if (availableColumns.includes('general_info')) {
      finalBusinessData.general_info = {
        established_year: parseInt(businessData.establishedYear) || null
      };
    } else if (availableColumns.includes('established_year')) {
      finalBusinessData.established_year = parseInt(businessData.establishedYear) || null;
    }
    
    if (availableColumns.includes('operational_info')) {
      finalBusinessData.operational_info = {
        employees: parseInt(businessData.employees) || null
      };
    } else if (availableColumns.includes('employees')) {
      finalBusinessData.employees = parseInt(businessData.employees) || null;
    }
    
    // Handle privacy level
    if (availableColumns.includes('privacy_level')) {
      finalBusinessData.privacy_level = businessData.privacyLevel || 'public';
    }
    
    // Log the insert operation with all data to help debug
    console.log('Attempting to insert business with data:', finalBusinessData);
    
    // Insert the business
    const { data: business, error: insertError } = await supabase
      .from('businesses')
      .insert(finalBusinessData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating business:', insertError);
      return NextResponse.json(
        { error: 'Failed to create business: ' + insertError.message },
        { status: 500 }
      );
    }

    console.log('Business created successfully with ID:', business.id);

    // Upload files if any
    if (images && images.length > 0) {
      console.log(`Uploading ${images.length} files for business ${business.id}`);
      
      // Check if the business_files table exists before attempting to insert records
      let businessFilesTableExists = true;
      try {
        const { error: tableCheckError } = await supabase
          .from('business_files')
          .select('id')
          .limit(1);
          
        if (tableCheckError && tableCheckError.message.includes('does not exist')) {
          console.warn('business_files table does not exist - file metadata will not be saved');
          businessFilesTableExists = false;
        }
      } catch (tableCheckError) {
        console.error('Error checking business_files table:', tableCheckError);
        businessFilesTableExists = false;
      }
      
      // For storage operations, use the same service client
      const uploadResults = await Promise.all(images.map(async (file: any, index: number) => {
        try {
          // Handle base64 encoded files
          let fileBlob = file;
          let fileType = file.type || '';
          let fileName = file.name || `file-${index}`;
          let fileSize = file.size || 0;
          
          if (typeof file === 'string' && file.startsWith('data:')) {
            // Extract type from data URL
            const dataUrlParts = file.split(';');
            if (dataUrlParts[0].includes('data:')) {
              fileType = dataUrlParts[0].split(':')[1] || 'image/png';
            }
            
            // Create a more sensible filename with the correct extension
            const extension = fileType.split('/')[1] || 'png';
            fileName = `file-${Date.now()}-${index}.${extension}`;
            
            // Convert data URL to blob
            const response = await fetch(file);
            fileBlob = await response.blob();
            fileSize = fileBlob.size;
          }

          // Generate a unique filename with timestamp and extension
          const timestamp = Date.now();
          const extension = fileName.split('.').pop() || 'png';
          const uniqueFileName = `${timestamp}-${index}.${extension}`;
          
          // Define file paths for both buckets to ensure consistency
          const primaryBucket = 'businesses';
          const backupBucket = 'business-files';
          const primaryPath = `${business.id}/${uniqueFileName}`;
          const backupPath = `businesses/${business.id}/${uniqueFileName}`;
          
          console.log(`Processing file ${index+1}/${images.length}:`, { 
            name: fileName, 
            type: fileType,
            size: fileSize,
            primaryPath,
            backupPath
          });
          
          // First try to upload to the primary bucket (businesses)
          let uploadSuccess = false;
          let uploadPath = '';
          let usedBucket = '';
          
          // Try primary bucket first
          const { data: primaryData, error: primaryError } = await supabase.storage
            .from(primaryBucket)
            .upload(primaryPath, fileBlob, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileType
            });
          
          if (primaryError) {
            console.warn(`Primary bucket upload failed, trying backup bucket. Error:`, primaryError);
            
            // Try backup bucket next
            const { data: backupData, error: backupError } = await supabase.storage
              .from(backupBucket)
              .upload(backupPath, fileBlob, {
                cacheControl: '3600',
                upsert: false,
                contentType: fileType
              });
              
            if (backupError) {
              console.error(`Both bucket uploads failed for file ${index+1}:`, backupError);
              return { 
                success: false, 
                error: backupError,
                fileName,
                fileType,
                fileSize
              };
            } else {
              uploadSuccess = true;
              uploadPath = backupPath;
              usedBucket = backupBucket;
            }
          } else {
            uploadSuccess = true;
            uploadPath = primaryPath;
            usedBucket = primaryBucket;
          }
          
          if (!uploadSuccess) {
            return { success: false, error: 'Failed to upload to either bucket' };
          }
          
          console.log(`File ${index+1} successfully uploaded to ${usedBucket}:`, uploadPath);
          
          // Get public URL
          const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${usedBucket}/${uploadPath}`;
          
          // Record in database if table exists
          if (businessFilesTableExists) {
            // Create file record in database
            const { error: fileRecordError } = await supabase
              .from('business_files')
              .insert({
                business_id: business.id,
                file_path: uploadPath,
                file_name: fileName,
                file_type: fileType,
                file_size: fileSize,
                visibility: file.visibility || 'public',
                description: file.description || '',
                uploaded_by: authResult.user.id
              });
              
            if (fileRecordError) {
              console.error(`File ${index+1} record error:`, fileRecordError);
              // Continue with upload success but note the record failure
              return { 
                success: true, 
                path: uploadPath, 
                url: publicUrl,
                bucket: usedBucket,
                recordError: fileRecordError 
              };
            }
          }

          return { 
            success: true, 
            path: uploadPath, 
            url: publicUrl,
            bucket: usedBucket,
            type: fileType,
            name: fileName,
            size: fileSize
          };
        } catch (error) {
          console.error(`File ${index+1} processing error:`, error);
          return { success: false, error };
        }
      }));

      // Return business data with upload results
      return NextResponse.json({
        ...business,
        file_uploads: uploadResults
      });
    }

    // Return just the business data if no files
    return NextResponse.json(business);
  } catch (error) {
    console.error('Unexpected error in business creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to parse and clean numeric input fields
function parseNumericField(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove currency symbols and commas before parsing
    const cleanValue = value.replace(/[$,]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  }
  
  return null;
} 