import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the user is an admin
    const { user, error: authError } = await requireAuth('admin');
    
    if (!user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authError || 'Admin access required'}` },
        { status: 401 }
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

    // Get the deletion request
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('deletion_requests')
      .select('*')
      .eq('id', params.id)
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

    // Start a transaction to update both tables
    const { error: updateError } = await supabase.rpc('approve_deletion_request', {
      request_id: params.id
    });

    if (updateError) {
      console.error('Error approving deletion request:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve deletion request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Deletion request approved' });
  } catch (error) {
    console.error('Unexpected error in approve deletion request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 