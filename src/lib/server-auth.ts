import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Type for the authenticated user response
export interface AuthResult {
  user: any | null;
  error: string | null;
}

/**
 * Parse Supabase cookie value to extract the token
 * Handles multiple possible formats of Supabase cookies
 */
function parseSupabaseCookieValue(cookieValue: string): string | null {
  try {
    // Handle empty or undefined values
    if (!cookieValue || cookieValue === 'undefined' || cookieValue === 'null') {
      console.warn('Empty or null cookie value');
      return null;
    }
    
    // Handle base64 prefix format (common in Supabase cookies)
    if (cookieValue.startsWith('base64-')) {
      // Remove 'base64-' prefix
      const base64Value = cookieValue.substring(7);
      
      try {
        // Attempt to parse the value as JSON (it might contain the full token structure)
        const jsonStr = Buffer.from(base64Value, 'base64').toString('utf-8');
        
        try {
          const parsed = JSON.parse(jsonStr);
          
          // If it parsed as JSON and has an access_token field, use that
          if (parsed && typeof parsed === 'object') {
            if (parsed.access_token) {
              console.log('Successfully extracted access_token from base64 JSON structure');
              return parsed.access_token;
            } else if (parsed.token) {
              console.log('Successfully extracted token from base64 JSON structure');
              return parsed.token;
            }
          } else if (parsed && typeof parsed === 'string') {
            // If the parsed result is a string, it might be the token itself
            return parsed;
          }
        } catch (jsonError) {
          // If it's not valid JSON after decoding, the decoded value might be the token itself
          console.log('Decoded base64 value is not JSON, using as token');
          return jsonStr;
        }
        
        // Otherwise return the original base64 value for Supabase to handle
        console.log('Returning original base64 value after prefix removal');
        return base64Value;
      } catch (parseError) {
        // If base64 decoding fails, just return the base64 value
        console.error('Base64 decoding failed:', parseError);
        return base64Value;
      }
    }
    
    // Handle JSON format (sometimes used by Supabase)
    if (cookieValue.startsWith('{')) {
      try {
        const parsed = JSON.parse(cookieValue);
        if (parsed.access_token) {
          return parsed.access_token;
        } else if (parsed.token) {
          return parsed.token;
        }
      } catch (e) {
        // Not valid JSON, continue with other approaches
      }
    }
    
    // For JWT tokens, they typically have a specific format with two dots
    if (cookieValue.includes('.') && cookieValue.split('.').length === 3) {
      // This looks like a JWT, return as-is
      return cookieValue;
    }
    
    // Return as-is if no special format detected
    return cookieValue;
  } catch (error) {
    console.error('Error parsing Supabase cookie value:', error);
    return null;
  }
}

/**
 * Get all Supabase cookie names from the cookie store
 * This helps identify which cookie contains the auth token
 */
async function getSupabaseCookieNames(): Promise<string[]> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    return allCookies
      .filter(c => c.name.startsWith('sb-'))
      .map(c => c.name);
  } catch (error) {
    console.error('Error getting Supabase cookie names:', error);
    return [];
  }
}

/**
 * Get the authenticated user from cookies using server-side approach
 * This function properly handles the async nature of cookies() in Next.js 15+
 * and has fallbacks for various cookie formats
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    // Create a server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // In Next.js 15+, cookies() is an async function that must be awaited
    const cookieStore = await cookies();
    
    // Debug: Log all available cookies
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    console.log('All cookie names found:', cookieNames);
    
    // Try several possible Supabase cookie formats
    let accessToken = null;
    let cookieValue = null;
    
    // Extract project reference from URL - typically like 'cjfbcpofgrphrhfinohl'
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/\/\/([^.]+)\./)?.[1];
    
    // Try all possible Supabase cookie names
    const possibleCookieNames = [
      'sb-access-token',
      projectRef ? `sb-${projectRef}-auth-token` : null,
      'sb-auth-token',
      ...cookieNames.filter(name => name.startsWith('sb-')),
    ].filter(Boolean) as string[];
    
    // Remove duplicates
    const uniqueCookieNames = [...new Set(possibleCookieNames)];
    console.log('Trying these cookie names:', uniqueCookieNames);
    
    // Try each cookie name
    for (const cookieName of uniqueCookieNames) {
      cookieValue = cookieStore.get(cookieName)?.value;
      
      if (cookieValue) {
        console.log(`Found cookie value for ${cookieName}`);
        accessToken = parseSupabaseCookieValue(cookieValue);
        
        if (accessToken) {
          console.log(`Parsed token from ${cookieName} (first 10 chars): ${accessToken.substring(0, 10)}...`);
          break;
        } else {
          console.log(`Failed to parse token from ${cookieName}`);
        }
      }
    }
    
    if (!accessToken) {
      console.log('No access token found in cookies, tried all possible names');
      return { user: null, error: 'Authentication required' };
    }
    
    console.log('Found access token. Verifying with Supabase...');
    
    // Use the admin API to get user by JWT
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      console.error('Error getting user with token:', error);
      
      // If token is expired, provide a specific message
      if (error?.message?.includes('expired')) {
        return { 
          user: null, 
          error: 'Session expired, please log in again'
        };
      }
      
      return { 
        user: null, 
        error: error?.message || 'Invalid session'
      };
    }
    
    console.log('Successful authentication for user:', data.user.id);
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Unexpected authentication error:', error);
    return { user: null, error: 'Authentication failed: ' + (error?.message || 'Unknown error') };
  }
}

/**
 * Check if the authenticated user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const { user } = await getAuthenticatedUser();
  return user?.user_metadata?.role === 'admin';
}

/**
 * Verify that the user is authenticated and has required role
 * Returns the user if authenticated, or null if not
 */
export async function requireAuth(requiredRole?: string): Promise<AuthResult> {
  const result = await getAuthenticatedUser();
  
  if (!result.user) {
    return result; // Already has error message
  }
  
  // If a specific role is required, check for it
  if (requiredRole) {
    const userRole = result.user.user_metadata?.role;
    if (userRole !== requiredRole) {
      return {
        user: null,
        error: `Access denied: ${requiredRole} role required, but you have ${userRole || 'no role'}`
      };
    }
  }
  
  return result;
}

/**
 * Refreshes a user's session if the token is about to expire
 * This is mainly for background API operations
 */
export async function refreshSessionIfNeeded(accessToken: string): Promise<string | null> {
  try {
    // Skip if no token provided
    if (!accessToken) return null;
    
    // Create admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );
    
    // Check token expiration by decoding it (JWT tokens are base64 encoded)
    // Format: header.payload.signature
    const parts = accessToken.split('.');
    if (parts.length !== 3) return accessToken; // Not a valid JWT
    
    try {
      // Get payload part (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      
      // Check if token is about to expire (exp is in seconds)
      const expiresAt = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      
      // If token expires in less than 15 minutes, refresh it
      if (expiresAt && expiresAt - now < 900) {
        console.log('Token expiring soon, refreshing...');
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: payload.refresh_token });
        
        if (error || !data.session) {
          console.error('Error refreshing token:', error);
          return accessToken; // Return original token as fallback
        }
        
        return data.session.access_token;
      }
    } catch (decodeError) {
      console.error('Error decoding JWT token:', decodeError);
    }
    
    // Token is still valid, return it
    return accessToken;
  } catch (error) {
    console.error('Error in refreshSessionIfNeeded:', error);
    return accessToken;
  }
} 