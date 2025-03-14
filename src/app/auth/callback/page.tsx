"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const code = searchParams.get('code');
      
      if (code) {
        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code);
        
        // Get the redirect URL or default to dashboard
        const redirectTo = localStorage.getItem('redirectTo') || '/dashboard';
        localStorage.removeItem('redirectTo');
        
        // Redirect the user
        router.push(redirectTo);
      } else {
        // No code found, redirect to login
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-6">Processing Authentication</h1>
        <p className="text-gray-600 mb-4">Please wait while we complete your authentication...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
} 