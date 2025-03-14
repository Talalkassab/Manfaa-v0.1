import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Update the deletion request status to rejected
    const { error: updateError } = await supabase
      .from('deletion_requests')
      .update({ status: 'rejected' })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error rejecting deletion request:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject deletion request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Deletion request rejected' });
  } catch (error) {
    console.error('Unexpected error in reject deletion request API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 