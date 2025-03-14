"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser } from '../../lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data, error } = await getUser();
        
        if (error) {
          throw error;
        }
        
        // Check if user is admin
        const userRole = data?.user?.user_metadata?.role;
        if (userRole === 'admin') {
          setIsAdmin(true);
        } else {
          setError('You do not have permission to access this area.');
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError('Authentication error. Please log in and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <svg className="h-12 w-12 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-center text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-center mb-6">
            {error || 'You do not have permission to access this area.'}
          </p>
          <div className="flex justify-center">
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ) },
    { name: 'Deletion Requests', href: '/admin/deletion-requests', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ) },
    { name: 'Business Approvals', href: '/admin/business-approvals', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) },
    { name: 'User Management', href: '/admin/users', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) },
    { name: 'Promote User', href: '/admin/promote-user', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
      </svg>
    ) },
    { name: 'Settings', href: '/admin/settings', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 min-h-screen">
          <div className="flex items-center justify-center h-16 bg-gray-900">
            <span className="text-white font-bold text-lg">Manfaa Admin</span>
          </div>
          <nav className="mt-5">
            <ul>
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname?.startsWith(item.href));
                
                return (
                  <li key={item.name} className="mb-2">
                    <Link
                      href={item.href}
                      className={`flex items-center px-6 py-3 text-sm ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow">
            <div className="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <Link href="/dashboard" className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Main Site
              </Link>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 