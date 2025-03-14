/**
 * Type extensions for Supabase PostgrestFilterBuilder
 * These declarations extend the existing types from @supabase/supabase-js
 * to include missing methods without modifying the original types
 */

import { PostgrestFilterBuilder, PostgrestSingleResponse, GenericSchema } from '@supabase/supabase-js';

/**
 * Extends the PostgrestFilterBuilder type to include the count method
 * which is not properly typed in some versions of Supabase's type definitions
 */
declare module '@supabase/supabase-js' {
  interface PostgrestFilterBuilder<
    Schema extends GenericSchema,
    Row extends Record<string, unknown>,
    QueryResponseType = unknown,
    RelationName = unknown,
    Relationships = unknown
  > {
    /**
     * Performs a count operation on the query
     * @param count The type of count to perform
     */
    count(count: 'exact' | 'planned' | 'estimated'): PostgrestFilterBuilder<
      Schema,
      Row,
      QueryResponseType,
      RelationName,
      Relationships
    >;
  }
}

/**
 * Type declaration for Supabase query responses with count
 */

/**
 * Represents a PostgrestResponse that includes a count property
 */
export interface PostgrestResponseWithCount<T> extends PostgrestSingleResponse<T> {
  data: T;
  count: number;
  error: null | {
    message: string;
    details: string;
    hint: string;
    code: string;
  };
  status: number;
  statusText: string;
}

/**
 * Type guard to check if a response includes a count property
 */
export function hasCount(response: any): response is PostgrestResponseWithCount<any> {
  return response && typeof response.count === 'number';
} 