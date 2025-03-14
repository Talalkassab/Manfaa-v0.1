import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    // Get the authenticated user
    const authResult = await getAuthenticatedUser();
    
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
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    
    // Check if the ndas table exists
    const { error: tableCheckError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'ndas')
      .single();
    
    // If the table doesn't exist, return an empty array
    if (tableCheckError) {
      console.log('The ndas table does not exist in the database. Returning empty data.');
      return NextResponse.json([]);
    }
    
    let query = supabase
      .from('ndas')
      .select(`
        *,
        business:business_id(
          id,
          name,
          category,
          description,
          owner_id
        )
      `)
      .eq('user_id', authResult.user.id);
    
    // If a businessId is provided, filter by it
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
    const { data: ndas, error } = await query;
    
    if (error) {
      console.error('Error fetching NDAs:', error);
      // Check if error is about table not existing
      if (error.code === '42P01') { // PostgreSQL error code for undefined table
        console.log('NDAs table does not exist. Returning empty array.');
        return NextResponse.json([]);
      }
      return NextResponse.json(
        { error: 'Failed to fetch NDAs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(ndas);
  } catch (error) {
    console.error('Unexpected error in NDAs GET API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authResult.error || 'You must be logged in'}` },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const { businessId, terms = {} } = await request.json();
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }
    
    // Create a Supabase client for DB operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if the ndas table exists
    const { error: tableCheckError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'ndas')
      .single();
    
    // If the table doesn't exist, return a specific error with instructions
    if (tableCheckError) {
      console.log('The ndas table does not exist in the database.');
      return NextResponse.json(
        { 
          error: 'The NDAs feature is currently unavailable. Please run the database migration to enable this feature.',
          details: 'Missing required database table: ndas'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    // Verify business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', businessId)
      .single();
    
    if (businessError || !business) {
      console.error('Error finding business:', businessError);
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Check if an NDA already exists for this user and business
    try {
      const { data: existingNda, error: existingNdaError } = await supabase
        .from('ndas')
        .select('id, status')
        .eq('business_id', businessId)
        .eq('user_id', authResult.user.id)
        .single();
      
      if (existingNdaError && !existingNdaError.message.includes('No rows found')) {
        // Check if the error is due to missing table
        if (existingNdaError.code === '42P01') {
          throw new Error('NDAs table does not exist');
        }
        
        console.error('Error checking existing NDA:', existingNdaError);
        return NextResponse.json(
          { error: 'Failed to check existing NDA' },
          { status: 500 }
        );
      }
      
      // If an NDA already exists and is approved, return it
      if (existingNda?.status === 'approved') {
        return NextResponse.json({
          ...existingNda,
          message: 'NDA already signed and approved'
        });
      }
      
      // Prepare NDA data
      const now = new Date().toISOString();
      const ndaData = {
        business_id: businessId,
        user_id: authResult.user.id,
        signed_at: now,
        status: 'pending',
        terms: {
          ...terms,
          agreed_at: now,
          user_email: authResult.user.email,
          user_id: authResult.user.id
        },
        validity_period: 90 // 90 days by default
      };
      
      let result;
      
      // Update existing NDA or create a new one
      if (existingNda) {
        console.log(`Updating existing NDA (${existingNda.id}) for business ${businessId}`);
        const { data, error } = await supabase
          .from('ndas')
          .update(ndaData)
          .eq('id', existingNda.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating NDA:', error);
          return NextResponse.json(
            { error: 'Failed to update NDA' },
            { status: 500 }
          );
        }
        
        result = data;
      } else {
        console.log(`Creating new NDA for business ${businessId} and user ${authResult.user.id}`);
        const { data, error } = await supabase
          .from('ndas')
          .insert(ndaData)
          .select()
          .single();
        
        if (error) {
          console.error('Error creating NDA:', error);
          return NextResponse.json(
            { error: 'Failed to create NDA' },
            { status: 500 }
          );
        }
        
        result = data;
      }
      
      // Also update business_interests if the table exists
      try {
        // Check if business_interests table exists before trying to use it
        const { error: interestsTableError } = await supabase
          .from('pg_tables')
          .select('*')
          .eq('schemaname', 'public')
          .eq('tablename', 'business_interests')
          .single();
          
        if (!interestsTableError) {
          await supabase
            .from('business_interests')
            .upsert({
              business_id: businessId,
              user_id: authResult.user.id,
              status: 'nda_signed',
              updated_at: now
            })
            .select();
        }
      } catch (interestError) {
        console.error('Error updating business interest:', interestError);
        // Don't fail the request if this part fails
      }
      
      // For seller's NDAs, auto-approve
      if (business.owner_id === authResult.user.id) {
        const { data: approvedNda, error: approvalError } = await supabase
          .from('ndas')
          .update({
            status: 'approved',
            approved_at: now,
            approved_by: authResult.user.id,
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', result.id)
          .select()
          .single();
        
        if (!approvalError) {
          result = approvedNda;
        }
      }
      
      return NextResponse.json(result);
    } catch (error: any) {
      console.error('Error in NDA processing:', error);
      
      // Handle case where tables don't exist
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        return NextResponse.json(
          { 
            error: 'The NDAs feature is currently unavailable. Please run the database migration to enable this feature.',
            details: 'Missing required database tables' 
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to process NDA' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in NDAs POST API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 