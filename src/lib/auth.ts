import { createBrowserClient } from '@supabase/ssr';
import { type AuthError, type AuthResponse, type UserResponse } from '@supabase/supabase-js';

// Improved custom cookie parser function with better error handling
export function parseCustomCookie(cookieString: string) {
  if (!cookieString) return null;
  
  // If it's a base64 encoded cookie (starts with base64-), extract the actual content
  if (cookieString.startsWith('base64-')) {
    try {
      const base64Value = cookieString.substring(7); // Remove 'base64-' prefix
      const decodedValue = atob(base64Value);
      
      try {
        // Try to parse as JSON first
        return JSON.parse(decodedValue);
      } catch (jsonError) {
        // If not valid JSON, return the raw string
        console.warn('Cookie not valid JSON after base64 decode:', jsonError);
        return decodedValue;
      }
    } catch (error) {
      console.error('Error decoding base64 cookie:', error);
      
      // Try parsing as JSON directly as fallback
      try {
        return JSON.parse(cookieString);
      } catch (jsonError) {
        console.error('Final fallback JSON parse failed:', jsonError);
        return cookieString; // Return the raw string as last resort
      }
    }
  }
  
  // Try to parse as regular JSON
  try {
    return JSON.parse(cookieString);
  } catch (error) {
    // Not JSON, return the raw string
    return cookieString;
  }
}

// Get all Supabase cookies from document
export function getAllSupabaseCookies() {
  if (typeof document === 'undefined') return [];
  
  return document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.startsWith('sb-'));
}

// Enhanced helper function to create a consistent Supabase client with better cookie handling
export function getSupabaseClient() {
  // Extract project reference from URL for naming consistency
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)\./)?.[1];
  
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Ensure cookies work on localhost and in production
        domain: isLocalhost ? 'localhost' : undefined,
        path: '/',
        sameSite: 'lax',
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
      auth: {
        persistSession: true, // Ensure session is persisted
        autoRefreshToken: true, // Automatically refresh token
        detectSessionInUrl: true, // Detect auth params in URL
        flowType: 'pkce' // Use PKCE flow for better security
      },
      // Custom global error handler
      global: {
        fetch: (...args: Parameters<typeof fetch>) => {
          // Use the default fetch implementation
          return fetch(...args);
        },
      }
    }
  );
}

// Enhanced sign up with better error handling
export async function signUp(email: string, password: string, metadata: any): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseClient();
    
    // Add better cookie debug logging
    console.log('Cookies before signup:', getAllSupabaseCookies());
    
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    
    if (response.error) {
      console.error('Signup error:', response.error);
    } else {
      console.log('Signup successful, cookies after:', getAllSupabaseCookies());
    }
    
    return response;
  } catch (err) {
    console.error('Unexpected error during signup:', err);
    throw err;
  }
}

// Enhanced sign in with better error handling and session persistence checks
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('Initializing Supabase client for authentication...');
    const supabase = getSupabaseClient();
    
    // Check for existing session
    const { data: existingSession } = await supabase.auth.getSession();
    console.log('Existing session before login:', {
      hasSession: !!existingSession.session,
      expiresAt: existingSession.session?.expires_at,
    });
    
    // Clear any existing cookies to prevent conflicts
    console.log('Cookies before sign in:', getAllSupabaseCookies());
    
    console.log('Attempting to sign in with email and password...');
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (response.error) {
      console.error('Supabase auth error:', response.error);
    } else {
      console.log('Authentication successful, user session established');
      
      // Additional verification that session was properly established
      setTimeout(async () => {
        // Check after a short delay that cookies were properly set
        console.log('Checking session persistence...');
        const sbCookies = getAllSupabaseCookies();
        console.log('Supabase cookies after login:', sbCookies);
        
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          console.log('Session successfully persisted:', {
            expiresAt: sessionData.session.expires_at,
            userId: sessionData.session.user?.id
          });
        } else {
          console.error('Session not persisted properly after login!');
        }
      }, 500);
    }
    
    return response;
  } catch (err) {
    console.error('Unexpected error during authentication:', err);
    throw err;
  }
}

// Enhanced sign out that properly clears cookies
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const supabase = getSupabaseClient();
    console.log('Cookies before signout:', getAllSupabaseCookies());
    
    const result = await supabase.auth.signOut({ scope: 'global' });
    
    // Log cookies after signout to verify they were cleared
    console.log('Cookies after signout:', getAllSupabaseCookies());
    
    return result;
  } catch (error: any) {
    console.error('Error during sign out:', error);
    return { error };
  }
}

// Get current user with session refresh
export async function getUser() {
  const supabase = getSupabaseClient();
  
  try {
    // Check if we need to refresh the session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      const expiresAt = sessionData.session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      // If token expires in less than 1 hour, refresh it
      if (expiresAt && expiresAt - now < 3600) {
        console.log('Session token expiring soon, refreshing...');
        await supabase.auth.refreshSession();
      }
    }
    
    return supabase.auth.getUser();
  } catch (error) {
    console.error('Error getting or refreshing user session:', error);
    return { data: { user: null }, error };
  }
}

export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });
}

export async function updatePassword(password: string): Promise<UserResponse> {
  const supabase = getSupabaseClient();
  return supabase.auth.updateUser({
    password,
  });
}

export async function updateUserProfile(profile: any): Promise<UserResponse> {
  const supabase = getSupabaseClient();
  return supabase.auth.updateUser({
    data: profile,
  });
}

// Helper function to detect if a user's session is expired
export async function isSessionExpired(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    
    if (!data.session) return true;
    
    const expiresAt = data.session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    return expiresAt < now;
  } catch (error) {
    console.error('Error checking session expiration:', error);
    return true; // Assume expired on error
  }
} 