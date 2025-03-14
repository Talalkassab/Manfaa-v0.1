import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { businessId, approved } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

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

    // Update business status
    const { error } = await supabase
      .from('businesses')
      .update({
        status: approved ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error updating business status:', error);
      return NextResponse.json(
        { error: 'Failed to update business status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: approved ? 'Business approved successfully' : 'Business rejected successfully'
    });
  } catch (error) {
    console.error('Error in business approval endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 