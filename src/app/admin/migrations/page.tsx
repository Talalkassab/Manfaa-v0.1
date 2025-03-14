'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function MigrationsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sqlScript, setSqlScript] = useState<string | null>(null);
  const router = useRouter();
  
  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  React.useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      const role = session.user.user_metadata?.role;
      if (role !== 'admin') {
        setError('You must be an admin to access this page');
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
      
      setIsLoading(false);
    };
    
    checkAdmin();
  }, [router]);
  
  const runMigration = async (migrationName: string) => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    setSqlScript(null);
    
    try {
      const response = await fetch(`/api/migrations/${migrationName}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run migration');
      }
      
      setResult(data);
      
      // If there are manual instructions, extract the SQL script
      if (data.manualInstructions) {
        const sqlMatches = data.manualInstructions.match(/```sql\n([\s\S]*?)\n```/) || 
                         data.manualInstructions.match(/```\n([\s\S]*?)\n```/) ||
                         data.manualInstructions.match(/CREATE TABLE[\s\S]*/);
        
        if (sqlMatches && sqlMatches[1]) {
          setSqlScript(sqlMatches[1].trim());
        } else {
          // Extract SQL from the instructions if no code block is found
          const lines = data.manualInstructions.split('\n');
          let capturedSQL = '';
          let capturing = false;
          
          for (const line of lines) {
            if (line.includes('CREATE TABLE') || line.includes('ALTER TABLE')) {
              capturing = true;
            }
            
            if (capturing) {
              capturedSQL += line + '\n';
            }
            
            if (line.includes('Steps:')) {
              capturing = false;
            }
          }
          
          if (capturedSQL) {
            setSqlScript(capturedSQL.trim());
          }
        }
      }
    } catch (err: any) {
      console.error('Error running migration:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsRunning(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('SQL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy. Please select and copy manually.');
      });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Access denied'}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Migrations</h1>
      <p className="text-gray-600 mb-6">
        This page allows you to run database migrations and setup tasks. Use with caution as these operations
        modify the database schema.
      </p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {result && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 w-full">
              <p className="text-sm text-green-700">{result.message}</p>
              
              {result.details && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-green-800">Results:</h4>
                  <ul className="mt-1 text-xs text-green-700 list-disc pl-5">
                    {result.details.map((detail: any, i: number) => (
                      <li key={i} className="mb-1">
                        {detail.action || detail.statement}: 
                        {detail.success ? ' Success' : ' Failed'} 
                        {detail.note && ` (${detail.note})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {sqlScript && (
                <div className="mt-3 border border-green-200 rounded-md bg-green-50">
                  <div className="flex justify-between items-center px-3 py-2 bg-green-100 text-green-800 text-xs font-medium rounded-t-md">
                    <span>SQL Script to Execute Manually</span>
                    <button 
                      onClick={() => copyToClipboard(sqlScript)}
                      className="px-2 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-800 transition-colors"
                    >
                      Copy SQL
                    </button>
                  </div>
                  <div className="p-3 overflow-auto max-h-60">
                    <pre className="text-xs text-green-800 whitespace-pre-wrap">{sqlScript}</pre>
                  </div>
                  <div className="px-3 py-2 bg-green-100 rounded-b-md">
                    <p className="text-xs text-green-800">
                      <strong>Next steps:</strong> Please paste this SQL into your Supabase SQL Editor and execute it.
                    </p>
                  </div>
                </div>
              )}
              
              {result.manualInstructions && !sqlScript && (
                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                  <p className="font-medium">Manual instructions:</p>
                  <p className="whitespace-pre-wrap">{result.manualInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Available Migrations</h3>
        </div>
        
        <ul className="divide-y divide-gray-200">
          <li className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-medium text-gray-900">Business Files Table</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Creates the business_files table for tracking file metadata and sets up RLS policies.
                  Also creates necessary storage buckets if they don't exist.
                </p>
              </div>
              <button
                onClick={() => runMigration('run')}
                disabled={isRunning}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isRunning
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRunning ? 'Running...' : 'Run Migration'}
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
} 