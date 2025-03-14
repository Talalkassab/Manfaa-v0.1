import { createClient as createClientBase } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * Create a Supabase client for server-side operations
 * This creates a new client for each request
 */
export function createClient() {
  const cookieStore = cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create client with service role key
  return createClientBase<Database>(
    supabaseUrl, 
    supabaseKey, 
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          // Pass cookies for auth context
          cookie: cookieStore.toString(),
        },
      },
    }
  );
}

/**
 * Create a Supabase client using the user's auth token
 * This creates a client with the user's permissions
 */
export function createClientWithAuth() {
  const cookieStore = cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create client with anon key but pass the user's cookies
  return createClientBase<Database>(
    supabaseUrl, 
    supabaseAnonKey, 
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );
}

/**
 * Helper function to check if a table exists in the database
 */
export async function tableExists(tableName: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .single();
  
  if (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
  
  return !!data;
}

/**
 * Helper function to run raw SQL
 */
export async function runSQL(sql: string) {
  const supabase = createClient();
  
  // Make sure you have this function created in your database
  // CREATE OR REPLACE FUNCTION run_sql(sql text) RETURNS void AS $$
  // BEGIN
  //   EXECUTE sql;
  // END;
  // $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  const { error } = await supabase.rpc('run_sql', { sql });
  
  if (error) {
    throw new Error(`Error running SQL: ${error.message}`);
  }
  
  return true;
} 