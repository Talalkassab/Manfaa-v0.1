import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getUser } from './auth';
import { BUSINESS_SCHEMA, isColumnNotFoundError } from './database-schema';

// Client-side database operations
export function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server-side admin operations (using service role key)
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL or Service Role Key is missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Business-related database operations
export async function getBusinesses({ 
  page = 1, 
  limit = 10, 
  category = null, 
  minPrice = null, 
  maxPrice = null,
  location = null,
  sortBy = 'created_at',
  sortOrder = 'desc'
} = {}) {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('businesses')
    .select('*', { count: 'exact' })
    .eq('status', 'approved');
  
  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }
  
  if (minPrice) {
    query = query.gte('asking_price', minPrice);
  }
  
  if (maxPrice) {
    query = query.lte('asking_price', maxPrice);
  }
  
  if (location) {
    query = query.ilike('location', `%${location}%`);
  }
  
  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Execute query with pagination
  return query.range(from, to);
}

export async function getBusinessById(id: string) {
  const supabase = getSupabaseClient();
  return supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single();
}

// Define the BusinessFormData type if it doesn't exist elsewhere
export interface BusinessFormData {
  title: string;
  category: string;
  description?: string;
  location?: string;
  establishedYear?: number;
  employees?: number;
  askingPrice?: number;
  revenue?: number;
  profit?: number;
  inventory?: number;
  assets?: number;
  reason?: string;
  privacyLevel?: string;
  status?: string;
  [key: string]: any; // Allow for additional fields
}

// Helper functions for error handling
function handleColumnNotFoundError(error: any) {
  const columnMatch = error.message.match(/"([^"]+)"/);
  const cacheMatch = error.message.match(/Could not find the '([^']+)' column/);
  const columnName = columnMatch ? columnMatch[1] : (cacheMatch ? cacheMatch[1] : 'unknown');
  
  return {
    message: `Schema error: The column "${columnName}" does not exist in the database.`,
    suggestedFix: `Please check your database schema and ensure the column exists, or update your form data structure.`
  };
}

export async function createBusiness(businessData: BusinessFormData) {
  const supabase = getSupabaseClient();
  
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw {
        type: 'auth',
        message: 'Authentication failed. Please log in again.',
        details: userError
      };
    }
    
    if (!userData.user) {
      throw {
        type: 'auth',
        message: 'User not authenticated. Please log in to create a business.',
        details: null
      };
    }

    // Ensure all required fields are present
    if (!businessData.title || !businessData.category) {
      throw {
        type: 'validation',
        message: 'Missing required fields',
        details: { ...(!businessData.title && { title: 'Title is required' }), ...(!businessData.category && { category: 'Category is required' }) }
      };
    }

    // Deep copy the data to avoid mutating the original
    const formData = JSON.parse(JSON.stringify(businessData));
    console.log('Submitting business data:', JSON.stringify(formData, null, 2));

    // First, check available columns in the database to detect schema issues early
    const { data: columnInfo, error: columnError } = await supabase
      .from('businesses')
      .select('*')
      .limit(0);
    
    if (columnError) {
      console.error('Error fetching schema info:', columnError);
      throw {
        type: 'database',
        message: 'Failed to connect to database',
        details: columnError
      };
    }
    
    // Log available columns for debugging - ensure proper type checking
    let availableColumns: string[] = [];
    if (columnInfo && typeof columnInfo === 'object') {
      // Extract column names from the returned info - this may vary based on Supabase version
      if ('columns' in columnInfo && columnInfo.columns) {
        availableColumns = Object.keys(columnInfo.columns);
      } else if (Array.isArray(columnInfo) && columnInfo.length > 0) {
        // If columnInfo is an array, use the first item's keys
        availableColumns = columnInfo[0] ? Object.keys(columnInfo[0]) : [];
      } else if (!Array.isArray(columnInfo)) {
        // If it's a non-array object, use its keys
        availableColumns = Object.keys(columnInfo);
      }
    }
    
    console.log('Available columns in businesses table:', JSON.stringify(availableColumns, null, 2));
    
    // Check if JSONB fields exist in the schema
    const hasFinancialInfo = availableColumns.includes('financial_info');
    const hasGeneralInfo = availableColumns.includes('general_info');
    const hasOperationalInfo = availableColumns.includes('operational_info');
    
    console.log('JSONB fields available:', JSON.stringify({
      financial_info: hasFinancialInfo,
      general_info: hasGeneralInfo,
      operational_info: hasOperationalInfo
    }, null, 2));

    // Convert form data to database structure using schema mapping
    const mappedData: Record<string, any> = {};
    
    // Initialize JSONB fields as empty objects if they exist in the schema
    if (hasFinancialInfo) {
      mappedData.financial_info = {};
    }
    if (hasGeneralInfo) {
      mappedData.general_info = {};
    }
    if (hasOperationalInfo) {
      mappedData.operational_info = {};
    }
    
    // Map form fields to database columns based on schema
    for (const [formField, dbField] of Object.entries(BUSINESS_SCHEMA.fields)) {
      if (formData[formField] !== undefined) {
        // Handle JSONB fields
        if (typeof dbField === 'string' && dbField.includes('.')) {
          const [jsonbField, nestedField] = dbField.split('.');
          
          // Check if the JSONB field exists in the schema
          if (
            (jsonbField === 'financial_info' && hasFinancialInfo) ||
            (jsonbField === 'general_info' && hasGeneralInfo) ||
            (jsonbField === 'operational_info' && hasOperationalInfo)
          ) {
            // Initialize the JSONB field if it doesn't exist
            mappedData[jsonbField] = mappedData[jsonbField] || {};
            mappedData[jsonbField][nestedField] = formData[formField];
          } else {
            // If JSONB field doesn't exist, log a warning and flatten structure
            console.log(`No ${jsonbField} JSONB field found, flattening structure...`);
            
            // Try to use the nested field directly
            const columnName = nestedField;
            if (availableColumns.includes(columnName)) {
              mappedData[columnName] = formData[formField];
            } else {
              console.warn(`Column '${columnName}' not found in database schema, skipping`);
            }
          }
        } else {
          // For non-JSONB fields, check if the column exists before mapping
          const columnName = dbField as string;
          
          if (availableColumns.includes(columnName)) {
            mappedData[columnName] = formData[formField];
          } else {
            console.warn(`Column '${columnName}' not found in database schema, skipping`);
          }
        }
      }
    }

    // Generate a slug if not provided
    if (!mappedData.slug && formData.title) {
      mappedData.slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    
    // Add timestamps
    mappedData.updated_at = new Date().toISOString();
    
    // Set the owner_id from the authenticated user - check if it's in the schema
    if (BUSINESS_SCHEMA.fields.owner_id) {
      mappedData.owner_id = userData.user.id;
    } else {
      console.warn('Warning: owner_id field is not defined in the schema but is required by the database');
      mappedData.owner_id = userData.user.id; // Set it anyway as it's required
    }
    
    console.log('Final business data for insertion:', JSON.stringify(mappedData, null, 2));

    // Insert the business
    const response = await supabase
      .from('businesses')
      .insert(mappedData)
      .select();
    
    // Log the raw response for debugging
    console.log('Raw Supabase response:', JSON.stringify(response, null, 2));
    
    const { data, error } = response;

    if (error) {
      console.error('Error inserting business:', JSON.stringify(error, null, 2));
      
      // Create structured error object
      const errorObj: any = {
        type: 'database',
        message: `Error inserting business: ${error.message || JSON.stringify(error)}`,
        details: error
      };
      
      // Check for schema-related errors
      if (isColumnNotFoundError(error)) {
        errorObj.type = 'schema_cache';
        
        // Extract the column name from the error message
        const match = error.message.match(/"([^"]+)"|'([^']+)'|Could not find the '([^']+)' column/);
        const columnName = match ? (match[1] || match[2] || match[3]) : 'unknown';
        
        // Map back from DB column to form field for better error messaging
        const formFieldMapping = Object.entries(BUSINESS_SCHEMA.fields)
          .find(([_, dbField]) => dbField === columnName || (typeof dbField === 'string' && dbField.includes('.') && dbField.split('.')[0] === columnName));
        
        const formField = formFieldMapping ? formFieldMapping[0] : columnName;
        
        // Enhanced error message with schema mapping details
        errorObj.message = `The '${columnName}' column is mapped to the frontend field '${formField}'. Make sure you're using the correct field name and that the database schema matches.`;
        errorObj.details = {
          columnName,
          tableName: 'businesses',
          formField,
          schemaMapping: BUSINESS_SCHEMA.fields,
          originalError: error.message
        };
      }
      
      return { error: errorObj };
    }

    return { data };
  } catch (error: any) {
    // Improve error logging by explicitly extracting properties
    console.error('Exception in createBusiness:', JSON.stringify(error, null, 2));
    
    // Log additional error details to help with debugging
    if (error) {
      console.error('Error details:', JSON.stringify({
        message: error.message || 'No message',
        type: error.type || typeof error,
        name: error.name,
        code: error.code,
        stack: error.stack,
        details: error.details ? JSON.stringify(error.details, null, 2) : 'No details'
      }, null, 2));
    }
    
    // Format the caught exception into a structured error object
    const errorObj = {
      type: error.type || 'unknown',
      message: error.message || 'An unknown error occurred',
      details: error.details || error
    };
    
    return { error: errorObj };
  }
}

export async function updateBusiness(id: string, businessData: any) {
  const supabase = getSupabaseClient();
  
  try {
    return await supabase
      .from('businesses')
      .update(businessData)
      .eq('id', id)
      .select()
      .single();
  } catch (error: any) {
    console.error('Error updating business:', error);
    
    // Check if this is a column not found error
    if (error.message && error.message.includes('column')) {
      const columnMatch = error.message.match(/column ['"]([^'"]+)['"]/);
      if (columnMatch && columnMatch[1]) {
        const columnName = columnMatch[1];
        throw new Error(`Database schema mismatch: Column '${columnName}' not found. Please check field mappings in database-schema.ts.`);
      }
    }
    
    throw error;
  }
}

// File-related database operations
export async function uploadBusinessFile(businessId: string, file: File, metadata: any) {
  const supabase = getSupabaseClient();
  
  // Upload file to storage
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `businesses/${businessId}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('business-files')
    .upload(filePath, file);
  
  if (uploadError) {
    throw uploadError;
  }
  
  // Create file record in database
  return supabase
    .from('business_files')
    .insert({
      business_id: businessId,
      file_path: filePath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      visibility: metadata.visibility || 'public',
      description: metadata.description || '',
    })
    .select()
    .single();
}

export async function getBusinessFiles(businessId: string) {
  const supabase = getSupabaseClient();
  return supabase
    .from('business_files')
    .select('*')
    .eq('business_id', businessId);
}

// NDA-related database operations
export async function requestNda(businessId: string, message: string) {
  const supabase = getSupabaseClient();
  
  // First, create an interest record
  const { data: interest, error: interestError } = await supabase
    .from('business_interests')
    .insert({
      business_id: businessId,
      status: 'pending_nda',
      message,
    })
    .select()
    .single();
  
  if (interestError) {
    throw interestError;
  }
  
  // Then, create an NDA record
  return supabase
    .from('ndas')
    .insert({
      business_id: businessId,
      status: 'pending',
      terms: {
        message,
        requested_at: new Date().toISOString(),
      },
      validity_period: 90, // 90 days by default
    })
    .select()
    .single();
}

export async function approveNda(ndaId: string) {
  const supabase = getSupabaseClient();
  
  // Get the NDA record
  const { data: nda, error: ndaError } = await supabase
    .from('ndas')
    .select('*')
    .eq('id', ndaId)
    .single();
  
  if (ndaError) {
    throw ndaError;
  }
  
  // Update the NDA status
  const { data: updatedNda, error: updateError } = await supabase
    .from('ndas')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + nda.validity_period * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', ndaId)
    .select()
    .single();
  
  if (updateError) {
    throw updateError;
  }
  
  // Update the corresponding interest record
  await supabase
    .from('business_interests')
    .update({
      status: 'nda_signed',
    })
    .eq('business_id', nda.business_id)
    .eq('user_id', nda.user_id);
  
  return updatedNda;
}

// Messaging-related database operations
export async function sendMessage(recipientId: string, businessId: string | null, content: string, attachments: any[] = []) {
  const supabase = getSupabaseClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Create a unique conversation ID
  const participants = [user.id, recipientId].sort();
  const conversationId = `${participants[0]}_${participants[1]}`;
  
  // Send the message
  return supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      business_id: businessId,
      conversation_id: conversationId,
      content,
      attachments,
    })
    .select()
    .single();
}

export async function getConversations() {
  const supabase = getSupabaseClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Get all conversations where the user is a participant
  return supabase
    .from('messages')
    .select(`
      conversation_id,
      sender_id,
      recipient_id,
      content,
      sent_at,
      read_at,
      users!sender_id(full_name, avatar_url),
      businesses(id, name)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })
    .limit(1000); // Get the last 1000 messages
}

export async function getConversationMessages(conversationId: string) {
  const supabase = getSupabaseClient();
  
  return supabase
    .from('messages')
    .select(`
      *,
      users!sender_id(full_name, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true });
}

export async function markMessagesAsRead(conversationId: string) {
  const supabase = getSupabaseClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Mark all messages in the conversation as read
  return supabase
    .from('messages')
    .update({
      read_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('recipient_id', user.id)
    .is('read_at', null);
}

// Deletion request operations
export async function submitDeletionRequest(businessId: string, reason: string) {
  try {
    const supabase = getSupabaseClient();
    // Ensure user is authenticated
    const { data: userData, error: userError } = await getUser();
    
    if (userError) {
      return { data: null, error: { message: 'You must be logged in to submit a deletion request' } };
    }
    
    const userId = userData?.user?.id;
    
    if (!userId) {
      return { data: null, error: { message: 'User ID not found' } };
    }
    
    // Check if the user owns the business
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', userId)
      .single();
    
    if (businessError) {
      return { data: null, error: { message: 'Failed to find business' } };
    }
    
    if (!businessData) {
      return { data: null, error: { message: 'You can only request deletion for businesses you own' } };
    }
    
    // Check if there's already a pending deletion request
    const { data: existingRequest, error: checkError } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .single();
    
    if (existingRequest) {
      return { data: null, error: { message: 'A deletion request is already pending for this business' } };
    }
    
    // Create a new deletion request
    const { data, error } = await supabase
      .from('deletion_requests')
      .insert([
        {
          business_id: businessId,
          user_id: userId,
          reason: reason,
          status: 'pending'
        }
      ])
      .select();
    
    if (error) {
      return { data: null, error: { message: 'Failed to submit deletion request' } };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error in submitDeletionRequest:', err);
    return { data: null, error: { message: 'An unexpected error occurred' } };
  }
}

export async function getDeletionRequests(status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending') {
  try {
    const supabase = getSupabaseClient();
    // Ensure user is authenticated and is an admin
    const { data: userData, error: userError } = await getUser();
    
    if (userError) {
      return { data: null, error: { message: 'You must be logged in to view deletion requests' } };
    }
    
    const userRole = userData?.user?.user_metadata?.role;
    
    if (userRole !== 'admin') {
      return { data: null, error: { message: 'Only administrators can view deletion requests' } };
    }
    
    // Get deletion requests with business and user info
    let query = supabase
      .from('deletion_requests')
      .select(`
        *,
        businesses:business_id (
          id, 
          title
        ),
        profiles:user_id (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    // Filter by status if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return { data: null, error: { message: 'Failed to fetch deletion requests' } };
    }
    
    // Format the data to match the expected structure in the admin dashboard
    const formattedData = data.map(request => ({
      id: request.id,
      business_id: request.business_id,
      business_name: request.businesses?.title || `Business #${request.business_id}`,
      reason: request.reason,
      status: request.status,
      created_at: request.created_at,
      user_id: request.user_id,
      user_email: request.profiles?.email || `User #${request.user_id}`,
      rejection_reason: request.rejection_reason
    }));
    
    return { data: formattedData, error: null };
  } catch (err) {
    console.error('Error in getDeletionRequests:', err);
    return { data: null, error: { message: 'An unexpected error occurred' } };
  }
}

export async function approveDeletionRequest(requestId: string) {
  try {
    const supabase = getSupabaseClient();
    // Ensure user is authenticated and is an admin
    const { data: userData, error: userError } = await getUser();
    
    if (userError) {
      return { data: null, error: { message: 'You must be logged in to approve deletion requests' } };
    }
    
    const userRole = userData?.user?.user_metadata?.role;
    
    if (userRole !== 'admin') {
      return { data: null, error: { message: 'Only administrators can approve deletion requests' } };
    }
    
    // Get the deletion request
    const { data: requestData, error: requestError } = await supabase
      .from('deletion_requests')
      .select('business_id, status')
      .eq('id', requestId)
      .single();
    
    if (requestError) {
      return { data: null, error: { message: 'Failed to find deletion request' } };
    }
    
    if (!requestData) {
      return { data: null, error: { message: 'Deletion request not found' } };
    }
    
    if (requestData.status !== 'pending') {
      return { data: null, error: { message: 'This request has already been processed' } };
    }
    
    // Begin a transaction to update the request and delete the business
    // NOTE: Supabase doesn't directly support transactions through the JS client, 
    // so we'll do these operations in sequence
    
    // 1. Update the deletion request status
    const { error: updateError } = await supabase
      .from('deletion_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (updateError) {
      return { data: null, error: { message: 'Failed to update deletion request status' } };
    }
    
    // 2. Delete the business
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', requestData.business_id);
    
    if (deleteError) {
      // If business deletion fails, revert the request status
      await supabase
        .from('deletion_requests')
        .update({
          status: 'pending',
          processed_at: null
        })
        .eq('id', requestId);
        
      return { data: null, error: { message: 'Failed to delete the business' } };
    }
    
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('Error in approveDeletionRequest:', err);
    return { data: null, error: { message: 'An unexpected error occurred' } };
  }
}

export async function rejectDeletionRequest(requestId: string, rejectionReason: string) {
  try {
    const supabase = getSupabaseClient();
    // Ensure user is authenticated and is an admin
    const { data: userData, error: userError } = await getUser();
    
    if (userError) {
      return { data: null, error: { message: 'You must be logged in to reject deletion requests' } };
    }
    
    const userRole = userData?.user?.user_metadata?.role;
    
    if (userRole !== 'admin') {
      return { data: null, error: { message: 'Only administrators can reject deletion requests' } };
    }
    
    // Check if the rejection reason is provided
    if (!rejectionReason.trim()) {
      return { data: null, error: { message: 'A reason for rejection is required' } };
    }
    
    // Get the deletion request
    const { data: requestData, error: requestError } = await supabase
      .from('deletion_requests')
      .select('status')
      .eq('id', requestId)
      .single();
    
    if (requestError) {
      return { data: null, error: { message: 'Failed to find deletion request' } };
    }
    
    if (!requestData) {
      return { data: null, error: { message: 'Deletion request not found' } };
    }
    
    if (requestData.status !== 'pending') {
      return { data: null, error: { message: 'This request has already been processed' } };
    }
    
    // Update the deletion request status
    const { error: updateError } = await supabase
      .from('deletion_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (updateError) {
      return { data: null, error: { message: 'Failed to update deletion request status' } };
    }
    
    return { data: { success: true }, error: null };
  } catch (err) {
    console.error('Error in rejectDeletionRequest:', err);
    return { data: null, error: { message: 'An unexpected error occurred' } };
  }
} 