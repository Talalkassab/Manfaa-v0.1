import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Client-side database operations
export function getSupabaseClient() {
  return createClientComponentClient();
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

export async function createBusiness(businessData: any) {
  const supabase = getSupabaseClient();
  return supabase
    .from('businesses')
    .insert(businessData)
    .select()
    .single();
}

export async function updateBusiness(id: string, businessData: any) {
  const supabase = getSupabaseClient();
  return supabase
    .from('businesses')
    .update(businessData)
    .eq('id', id)
    .select()
    .single();
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