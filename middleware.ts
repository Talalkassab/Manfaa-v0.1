import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Auth check for protected routes
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/businesses/create') ||
    req.nextUrl.pathname.startsWith('/messages')
  )) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin check
  if (
    req.nextUrl.pathname.startsWith('/admin') && 
    session?.user?.user_metadata?.role !== 'admin'
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/businesses/create:path*',
    '/messages/:path*',
    '/admin/:path*',
    '/auth/callback',
  ],
}; 