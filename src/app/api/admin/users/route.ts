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

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit value' },
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

    // Get total count of users
    const { count: total, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting users:', countError);
      return NextResponse.json(
        { error: 'Failed to count users', details: countError.message },
        { status: 500 }
      );
    }

    // Get paginated users with their metadata
    const { data: users, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        role,
        created_at,
        updated_at
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      total: total || 0,
      page,
      limit,
      totalPages: Math.ceil((total || 0) / limit)
    });
  } catch (error) {
    console.error('Unexpected error in admin users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 