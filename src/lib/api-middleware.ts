import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAuthenticatedUser, refreshSessionIfNeeded, requireAuth } from './server-auth';
import { isColumnNotFoundError, handleColumnNotFoundError } from './database-schema';

// Standard response headers for all API endpoints
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// CORS headers for API responses
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Type definitions
export type ApiHandler = (
  req: NextRequest,
  params: Record<string, any>,
  context: ApiContext
) => Promise<NextResponse>;

export interface ApiContext {
  user: any;
  supabase: any;
  isAdmin: boolean;
}

interface ApiMiddlewareOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  corsEnabled?: boolean;
  validateTable?: string;
  enableRateLimiting?: boolean;
}

/**
 * Wrap an API route handler with standard middleware for error handling,
 * authentication, and other common operations
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: ApiMiddlewareOptions = {}
) {
  return async function middleware(
    req: NextRequest,
    { params = {} }: { params?: Record<string, any> } = {}
  ) {
    // Set default options
    const {
      requireAuth: authRequired = false,
      requireAdmin = false,
      corsEnabled = true,
      validateTable = '',
      enableRateLimiting = false,
    } = options;

    // Set standard headers including CORS if enabled
    const headers = {
      ...DEFAULT_HEADERS,
      ...(corsEnabled ? CORS_HEADERS : {})
    };

    // Handle OPTIONS requests for CORS preflight
    if (corsEnabled && req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          ...CORS_HEADERS,
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }

    try {
      // Create Supabase client with service role for admin operations
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
          },
        }
      );

      // Check authentication if required
      let user = null;
      let isAdmin = false;

      if (authRequired || requireAdmin) {
        const authResult = requireAdmin
          ? await requireAuth('admin')
          : await getAuthenticatedUser();

        if (!authResult.user) {
          return NextResponse.json(
            {
              error: authResult.error || 'Authentication required',
            },
            { status: 401, headers }
          );
        }

        user = authResult.user;
        isAdmin = user.user_metadata?.role === 'admin';

        // If admin is required but user is not admin
        if (requireAdmin && !isAdmin) {
          return NextResponse.json(
            {
              error: 'Admin privileges required',
            },
            { status: 403, headers }
          );
        }
      }

      // Validate table exists if specified
      if (validateTable) {
        try {
          // Check if the table exists by trying to count rows
          const { count, error } = await supabase
            .from(validateTable)
            .select('*', { count: 'exact', head: true })
            .limit(0);

          if (error) {
            console.error(`Error validating table '${validateTable}':`, error);
            return NextResponse.json(
              {
                error: `Database table '${validateTable}' not found or not accessible`,
                details: error.message,
              },
              { status: 500, headers }
            );
          }
        } catch (tableError: any) {
          console.error(`Error validating table '${validateTable}':`, tableError);
          return NextResponse.json(
            {
              error: `Database table '${validateTable}' not found or not accessible`,
              details: tableError.message,
            },
            { status: 500, headers }
          );
        }
      }

      // Apply rate limiting if enabled
      if (enableRateLimiting) {
        // TODO: Implement rate limiting
        // This would typically involve checking request counts in Redis or similar
      }

      // Call the handler with the context
      const context: ApiContext = {
        user,
        supabase,
        isAdmin,
      };

      const response = await handler(req, params, context);

      // Add standard headers to the response
      for (const [key, value] of Object.entries(headers)) {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      }

      return response;
    } catch (error: any) {
      console.error('API route error:', error);

      // Handle specific database errors
      if (error.code === '42P01') {
        // Table doesn't exist error
        return NextResponse.json(
          {
            error: 'Database table not found',
            details: error.message,
          },
          { status: 500, headers }
        );
      }

      if (isColumnNotFoundError(error, 'unknown')) {
        // Column doesn't exist error
        return NextResponse.json(
          {
            error: 'Database schema mismatch',
            details: handleColumnNotFoundError(error),
          },
          { status: 500, headers }
        );
      }

      // Generic error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message || 'An unexpected error occurred',
          code: error.code,
        },
        { status: 500, headers }
      );
    }
  };
}

/**
 * Helper to validate required fields in a request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  if (!body) {
    return { valid: false, missing: requiredFields };
  }

  const missing = requiredFields.filter(field => body[field] === undefined);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Helper to safely parse JSON from a request
 */
export async function parseRequestBody(
  req: NextRequest
): Promise<any> {
  try {
    return await req.json();
  } catch (error) {
    console.error('Error parsing request body:', error);
    return null;
  }
}

/**
 * Helper to check if a table exists in the database
 */
export async function tableExists(
  supabase: any,
  tableName: string
): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .limit(0);
      
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Helper to create a successful response
 */
export function createSuccessResponse(
  data: any,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    { success: true, data },
    {
      status,
      headers: {
        ...DEFAULT_HEADERS,
        ...CORS_HEADERS,
        ...additionalHeaders,
      },
    }
  );
}

/**
 * Helper to create an error response
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details ? { details } : {}),
    },
    {
      status,
      headers: {
        ...DEFAULT_HEADERS,
        ...CORS_HEADERS,
        ...additionalHeaders,
      },
    }
  );
} 