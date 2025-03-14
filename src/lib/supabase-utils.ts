'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PostgrestResponseWithCount, hasCount } from '@/types/supabase-extensions';
import { Database } from '@/types/supabase';

/**
 * Enhanced Supabase query utilities with proper typing
 */

/**
 * Creates a Supabase client with the public (anon) key
 * @returns A properly typed Supabase client
 */
export function createSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Adds count functionality to a Supabase query
 * @param query The base query from supabase
 * @param countType The type of count to perform
 * @returns The same query with count applied (type-safe)
 */
export function withCount(query: any, countType: 'exact' | 'planned' | 'estimated' = 'exact') {
  // Use any type to bypass type checking for the count method
  return (query as any).count(countType);
}

/**
 * Enhanced Supabase query builder with proper typing and additional utilities
 */
export class SupabaseQueryBuilder<T = any> {
  private supabase: SupabaseClient<Database>;
  private table: string;
  private selectQuery: string;
  private query: any;

  constructor(
    supabase: SupabaseClient<Database>,
    table: string,
    select: string = '*'
  ) {
    this.supabase = supabase;
    this.table = table;
    this.selectQuery = select;
    this.query = supabase.from(table).select(select);
  }

  /**
   * Add a count to the query
   */
  withCount(countType: 'exact' | 'planned' | 'estimated' = 'exact') {
    this.query = withCount(this.query, countType);
    return this;
  }

  /**
   * Execute the query and get the results
   */
  async execute(): Promise<PostgrestResponseWithCount<T[]>> {
    const response = await this.query;
    return response;
  }

  // Common query methods
  eq(column: string, value: any) {
    this.query = this.query.eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.query = this.query.neq(column, value);
    return this;
  }

  gt(column: string, value: any) {
    this.query = this.query.gt(column, value);
    return this;
  }

  lt(column: string, value: any) {
    this.query = this.query.lt(column, value);
    return this;
  }

  gte(column: string, value: any) {
    this.query = this.query.gte(column, value);
    return this;
  }

  lte(column: string, value: any) {
    this.query = this.query.lte(column, value);
    return this;
  }

  like(column: string, pattern: string) {
    this.query = this.query.like(column, pattern);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.query = this.query.ilike(column, `%${pattern}%`);
    return this;
  }

  in(column: string, values: any[]) {
    this.query = this.query.in(column, values);
    return this;
  }

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    this.query = this.query.order(column, options);
    return this;
  }

  limit(count: number) {
    this.query = this.query.limit(count);
    return this;
  }

  range(from: number, to: number) {
    this.query = this.query.range(from, to);
    return this;
  }
}

/**
 * Create an enhanced query builder for a table or view
 * @param supabase Supabase client
 * @param table Table or view name
 * @param select Select query
 * @returns Enhanced query builder
 */
export function createEnhancedQuery<T = any>(
  supabase: SupabaseClient<Database>,
  table: keyof Database['public']['Tables'] | keyof Database['public']['Views'] | string,
  select: string = '*'
) {
  return new SupabaseQueryBuilder<T>(supabase, table as string, select);
}

/**
 * Example of usage:
 * 
 * const supabase = createSupabaseClient();
 * const { data, count } = await createEnhancedQuery(supabase, 'businesses', '*, users(*)')
 *   .eq('status', 'approved')
 *   .order('created_at', { ascending: false })
 *   .limit(10)
 *   .withCount()
 *   .execute();
 */ 