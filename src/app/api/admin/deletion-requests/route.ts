import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    // Verify the user is an admin
    const { user, error: authError } = await requireAuth('admin');
    
    if (!user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authError || 'Admin access required'}` },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Get total count of deletion requests
    const { count: total, error: countError } = await supabase
      .from('deletion_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (countError) {
      console.error('Error counting deletion requests:', countError);
      return NextResponse.json(
        { error: 'Failed to count deletion requests' },
        { status: 500 }
      );
    }

    // Get paginated deletion requests with their associated businesses
    const { data: requests, error: requestsError } = await supabase
      .from('deletion_requests')
      .select(`
        *,
        business:businesses (
          name,
          user_id
        )
      `)
      .eq('status', 'pending')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching deletion requests:', requestsError);
      return NextResponse.json(
        { error: 'Failed to fetch deletion requests' },
        { status: 500 }
      );
    }

    // If no requests found, return empty array
    if (!requests || requests.length === 0) {
      return NextResponse.json({
        requests: [],
        total: 0,
        page,
        limit
      });
    }

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Unexpected error in admin deletion requests API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 