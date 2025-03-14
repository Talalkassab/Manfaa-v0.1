import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    // Verify the user is an admin
    const { user, error: authError } = await requireAuth('admin');
    
    if (!user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authError || 'Admin access required'}` },
        { status: 401 }
      );
    }
    
    const { requestId, approved } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Start a transaction by getting the deletion request with its business
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('deletion_requests')
      .select('*, business:businesses(*)')
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching deletion request:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch deletion request' },
        { status: 500 }
      );
    }

    if (!deletionRequest) {
      return NextResponse.json(
        { error: 'Deletion request not found' },
        { status: 404 }
      );
    }

    // If approved, delete the business and update the request status
    if (approved) {
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', deletionRequest.business_id);

      if (deleteError) {
        console.error('Error deleting business:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete business' },
          { status: 500 }
        );
      }
    }

    // Update the deletion request status
    const { error: updateError } = await supabase
      .from('deletion_requests')
      .update({
        status: approved ? 'approved' : 'rejected',
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating deletion request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update deletion request status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Deletion request ${approved ? 'approved' : 'rejected'}`
    });
  } catch (error) {
    console.error('Unexpected error in process deletion request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 