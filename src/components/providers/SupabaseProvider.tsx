'use client';

import React, { ReactNode, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface SupabaseProviderProps {
  children: ReactNode;
}

/**
 * Custom provider that sets up client-side cookie parsing for Supabase authentication
 */
export default function SupabaseProvider({ children }: SupabaseProviderProps) {
  useEffect(() => {
    // Add custom cookie parser to handle base64-encoded JSON
    if (typeof window !== 'undefined') {
      // Patch the JSON.parse method used by Supabase's cookie parser
      const originalJSONParse = JSON.parse;
      
      // @ts-ignore - we're patching the global JSON.parse method
      JSON.parse = function customJsonParse(text: string, ...args: any[]) {
        // If it looks like our special base64 cookie format
        if (typeof text === 'string' && text.startsWith('base64-')) {
          try {
            const base64Value = text.substring(7); // Remove 'base64-' prefix
            const decodedValue = atob(base64Value);
            return originalJSONParse(decodedValue, ...args);
          } catch (error) {
            console.error('Error parsing base64 cookie:', error);
            // Fall back to the original implementation
            return originalJSONParse(text, ...args);
          }
        }
        
        // For all other cases, use the original implementation
        return originalJSONParse(text, ...args);
      };
      
      // Cleanup function to restore original JSON.parse
      return () => {
        // @ts-ignore - restoring the global method
        JSON.parse = originalJSONParse;
      };
    }
  }, []);
  
  return <>{children}</>;
} 