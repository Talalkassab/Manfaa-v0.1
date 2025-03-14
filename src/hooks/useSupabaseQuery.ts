'use client';

import { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { createEnhancedQuery } from '@/lib/supabase-utils';
import { PostgrestResponseWithCount } from '@/types/supabase-extensions';

type Table = keyof Database['public']['Tables'] | keyof Database['public']['Views'] | string;

export type QueryOptions<T = any> = {
  table: Table;
  select?: string;
  filters?: Record<string, any>;
  match?: Record<string, any>;
  order?: {
    column: string;
    ascending?: boolean;
    nullsFirst?: boolean;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
  count?: boolean | 'exact' | 'planned' | 'estimated';
  // Added relations option to handle foreign keys and nested objects
  relations?: Record<string, string>;
};

export type MutationOptions<T = any> = {
  table: Table;
  type: 'insert' | 'update' | 'delete' | 'upsert';
  data: T | T[] | Partial<T> | Partial<T>[]; 
  match?: Record<string, any>;
  returning?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

export type QueryState<T = any> = {
  data: T[] | null;
  count: number;
  error: Error | null;
  isLoading: boolean;
  isRefetching: boolean;
};

/**
 * A hook for querying Supabase tables with built-in caching and optimistic updates
 */
export function useSupabaseQuery<T = any>(
  supabase: SupabaseClient<Database>,
  options: QueryOptions<T>
) {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    count: 0,
    error: null,
    isLoading: true,
    isRefetching: false,
  });

  const getCacheKey = useCallback(() => {
    // Generate a unique key based on query options
    return JSON.stringify({
      table: options.table,
      select: options.select,
      filters: options.filters,
      match: options.match,
      order: options.order,
      pagination: options.pagination,
      count: options.count,
      relations: options.relations,
    });
  }, [options]);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
    } else {
      setState(prev => ({ ...prev, isRefetching: true }));
    }

    try {
      const select = options.select || '*';
      
      // Use our enhanced query builder for type safety
      const query = createEnhancedQuery<T>(supabase, options.table, select);

      // Apply filters if provided
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            if ('gt' in value) query.gt(key, value.gt);
            if ('gte' in value) query.gte(key, value.gte);
            if ('lt' in value) query.lt(key, value.lt);
            if ('lte' in value) query.lte(key, value.lte);
            if ('not' in value) query.neq(key, value.not);
            if ('like' in value) query.like(key, value.like);
            if ('ilike' in value) query.ilike(key, value.ilike);
          } else {
            query.eq(key, value);
          }
        });
      }

      // Apply match for object equality if provided
      if (options.match) {
        Object.entries(options.match).forEach(([key, value]) => {
          query.eq(key, value);
        });
      }

      // Apply ordering if provided
      if (options.order) {
        query.order(options.order.column, {
          ascending: options.order.ascending,
          nullsFirst: options.order.nullsFirst,
        });
      }

      // Apply pagination if provided
      if (options.pagination) {
        const { page, pageSize } = options.pagination;
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        query.range(start, end);
      }

      // Apply count if requested
      if (options.count) {
        const countType = typeof options.count === 'string' 
          ? options.count 
          : 'exact';
        query.withCount(countType);
      }

      // Execute the query and handle the response
      const response = await query.execute();
      
      // Safe extraction of data and count from response
      const responseData = response && 'data' in response ? response.data : null;
      const responseCount = response && 'count' in response ? response.count : 0;

      setState({
        data: Array.isArray(responseData) ? responseData : (responseData ? [responseData] : null),
        count: responseCount,
        error: null,
        isLoading: false,
        isRefetching: false,
      });
    } catch (error) {
      setState({
        data: null,
        count: 0,
        error: error as Error,
        isLoading: false,
        isRefetching: false,
      });
    }
  }, [supabase, options]);

  // Refetch data (with loading indicator)
  const refetch = useCallback(() => fetchData(true), [fetchData]);

  // Refetch data (without full loading indicator)
  const refresh = useCallback(() => fetchData(false), [fetchData]);

  // Handle mutations with optimistic updates
  const mutate = useCallback(
    async (mutationOptions: MutationOptions<T>) => {
      try {
        const { table, type, data, match, returning } = mutationOptions;
        let query: any;

        // Optimistic update for UI
        if (type === 'insert' || type === 'upsert') {
          setState(prev => ({
            ...prev,
            // Add new items to the existing data array
            data: prev.data 
              ? Array.isArray(data)
                ? [...prev.data, ...data as T[]]
                : [...prev.data, data as T]
              : Array.isArray(data) 
                ? [...data as T[]] 
                : [data as T],
            count: prev.count + (Array.isArray(data) ? data.length : 1),
          }));
        } else if (type === 'update' && match) {
          setState(prev => ({
            ...prev,
            // Update existing items
            data: prev.data?.map(item => {
              // Check if this item matches the criteria for update
              let matches = true;
              for (const [key, value] of Object.entries(match)) {
                if ((item as any)[key] !== value) {
                  matches = false;
                  break;
                }
              }
              if (matches) {
                return { ...item, ...data };
              }
              return item;
            }) || null,
          }));
        } else if (type === 'delete' && match) {
          setState(prev => {
            const filtered = prev.data?.filter(item => {
              // Check if this item matches the criteria for deletion
              let matches = true;
              for (const [key, value] of Object.entries(match)) {
                if ((item as any)[key] !== value) {
                  matches = false;
                  break;
                }
              }
              return !matches;
            }) || null;
            
            return {
              ...prev,
              // Remove deleted items
              data: filtered,
              count: prev.count - (prev.data?.length || 0) + (filtered?.length || 0),
            };
          });
        }

        // Perform the actual mutation
        switch (type) {
          case 'insert':
            query = supabase.from(table as string).insert(data);
            break;
          case 'update':
            query = supabase.from(table as string).update(data);
            if (match) {
              Object.entries(match).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            }
            break;
          case 'delete':
            query = supabase.from(table as string).delete();
            if (match) {
              Object.entries(match).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            }
            break;
          case 'upsert':
            query = supabase.from(table as string).upsert(data);
            break;
        }

        if (returning) {
          query = query.select(returning);
        }

        const { data: responseData, error } = await query;
        
        if (error) throw error;
        
        if (mutationOptions.onSuccess) {
          mutationOptions.onSuccess(responseData);
        }
        
        // Refetch to ensure data consistency
        refresh();
        
        return responseData;
      } catch (error) {
        if (mutationOptions.onError) {
          mutationOptions.onError(error as Error);
        }
        // Refetch to revert optimistic updates
        refresh();
        throw error;
      }
    },
    [supabase, refresh]
  );

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [getCacheKey()]);

  return {
    ...state,
    refetch,
    refresh,
    mutate,
  };
} 