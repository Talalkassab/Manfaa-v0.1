import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Log all cookies
    console.log('=== DEBUG COOKIES ===');
    console.log('All cookies found:', allCookies.map(c => ({ name: c.name, valuePeek: c.value.substring(0, 20) + '...' })));
    
    // Look specifically for Supabase cookies
    const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
    console.log('Supabase cookies:', supabaseCookies.map(c => c.name));
    
    // Extract project reference from URL
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)\./)?.[1];
    console.log('Project reference:', projectRef);
    
    // Get specific cookie formats
    const sbAccessToken = cookieStore.get('sb-access-token')?.value;
    const sbRefreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    // Get project-specific cookies if applicable
    const projectToken = projectRef ? cookieStore.get(`sb-${projectRef}-auth-token`)?.value : null;
    
    return NextResponse.json({
      message: 'Cookie debug information',
      cookieCount: allCookies.length,
      supabaseCookieCount: supabaseCookies.length,
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      hasAccessToken: !!sbAccessToken,
      hasRefreshToken: !!sbRefreshToken,
      hasProjectToken: !!projectToken,
      projectRef
    });
  } catch (error) {
    console.error('Error in debug cookies endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to debug cookies: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 