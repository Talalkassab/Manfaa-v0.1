import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  owner?: Profile | null;
}

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
    const status = searchParams.get('status') || 'pending';
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

    // Get total count of businesses with the specified status
    const { count: total, error: countError } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (countError) {
      console.error('Error counting businesses:', countError);
      return NextResponse.json(
        { error: 'Failed to count businesses' },
        { status: 500 }
      );
    }

    // Get paginated businesses
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', status)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching businesses:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch businesses' },
        { status: 500 }
      );
    }

    // If we have businesses, fetch their owners' information
    if (businesses && businesses.length > 0) {
      const ownerIds = businesses
        .filter(business => business.owner_id) // Filter out businesses with no owner_id
        .map(business => business.owner_id);
      
      // Only proceed with fetching owners if we have valid owner IDs
      if (ownerIds.length > 0) {
        try {
          // First try to get user data from profiles
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', ownerIds);

          if (!profilesError && profiles) {
            // Create a map of user data
            const ownerMap = new Map<string, Profile>();
            profiles.forEach((profile: Profile) => {
              ownerMap.set(profile.id, profile);
            });
            
            // Attach owner data to businesses
            businesses.forEach((business: Business) => {
              business.owner = business.owner_id ? ownerMap.get(business.owner_id) || null : null;
            });
          } else {
            console.error('Error fetching profiles:', profilesError);
            
            // If profiles fetch fails, try to get basic user data from auth.users
            try {
              const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
              
              if (!usersError && users) {
                const ownerMap = new Map<string, Profile>();
                users.users.forEach((user: User) => {
                  ownerMap.set(user.id, {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || 'Unknown'
                  });
                });

                businesses.forEach((business: Business) => {
                  business.owner = business.owner_id ? ownerMap.get(business.owner_id) || null : null;
                });
              } else {
                console.error('Error fetching users:', usersError);
                // Set all owner properties to null when we can't get user data
                businesses.forEach((business: Business) => {
                  business.owner = null;
                });
              }
            } catch (userFetchError) {
              console.error('Exception fetching users:', userFetchError);
              // Set all owner properties to null when we can't get user data
              businesses.forEach((business: Business) => {
                business.owner = null;
              });
            }
          }
        } catch (error) {
          console.error('Exception while getting owner information:', error);
          // Set all owner properties to null when we can't get user data
          businesses.forEach((business: Business) => {
            business.owner = null;
          });
        }
      } else {
        // Set null for businesses with no owner_id
        businesses.forEach((business: Business) => {
          if (!business.owner_id) {
            business.owner = null;
          }
        });
      }
    }

    return NextResponse.json({
      businesses,
      total,
      page,
      limit,
      totalPages: Math.ceil((total || 0) / limit)
    });
  } catch (error) {
    console.error('Unexpected error in admin businesses API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 