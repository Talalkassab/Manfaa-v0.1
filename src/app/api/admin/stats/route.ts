import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';

export async function GET() {
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

    // Fetch total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch total businesses count
    const { count: totalBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    // Fetch pending deletions count
    const { count: pendingDeletions } = await supabase
      .from('deletion_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Fetch pending approvals count
    const { count: pendingApprovals } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const stats = {
      totalUsers: totalUsers || 0,
      totalBusinesses: totalBusinesses || 0,
      pendingDeletions: pendingDeletions || 0,
      pendingApprovals: pendingApprovals || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
} 