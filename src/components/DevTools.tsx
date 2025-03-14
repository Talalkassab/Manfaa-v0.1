'use client';

import { useState } from 'react';

/**
 * DevTools component for development debugging
 * Only displays in development mode and helps diagnose common issues
 */
export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) return null;

  // Helper function to clear cache and refresh
  const clearCacheAndRefresh = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Cache cleared');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded-full shadow-lg"
      >
        🛠️ DevTools
      </button>

      {isOpen && (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-xl mt-2 w-80">
          <h3 className="text-lg font-bold mb-2">Next.js DevTools</h3>
          
          <div className="space-y-2">
            <div className="text-xs">
              <strong>Environment:</strong> {process.env.NODE_ENV}
            </div>
            <div className="text-xs">
              <strong>Next.js:</strong> {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}
            </div>
            
            <div className="border-t border-gray-600 my-2 pt-2">
              <button 
                onClick={clearCacheAndRefresh}
                className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
              >
                Clear Browser Cache & Refresh
              </button>
            </div>
            
            <div className="border-t border-gray-600 my-2 pt-2">
              <h4 className="font-bold text-sm mb-1">Quick Links</h4>
              <div className="flex flex-wrap gap-1">
                <a href="/api/health" target="_blank" className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded">
                  Health Check
                </a>
                <a href="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded">
                  Dashboard
                </a>
                <a href="/admin" className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded">
                  Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 