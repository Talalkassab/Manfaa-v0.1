"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    pendingDeletions: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load dashboard statistics');
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      change: "Platform Users",
      positive: true,
      link: "/admin/users",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: "Total Businesses",
      value: stats.totalBusinesses,
      change: "Registered Businesses",
      positive: true,
      link: "/admin/businesses",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Pending Deletions",
      value: stats.pendingDeletions,
      change: "Requires attention",
      positive: false,
      link: "/admin/deletion-requests",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      change: "Requires review",
      positive: false,
      link: "/admin/business-approvals",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to the Manfaa admin dashboard. Here you can manage businesses, users, and platform settings.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-md ${card.positive ? 'bg-green-500' : 'bg-yellow-500'} bg-opacity-10`}>
                        {React.cloneElement(card.icon, { 
                          className: `h-6 w-6 ${card.positive ? 'text-green-500' : 'text-yellow-500'}` 
                        })}
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          card.positive ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {card.change}
                        </div>
                      </dd>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href={card.link} className="font-medium text-blue-600 hover:text-blue-500">
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Manage Deletion Requests</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Review and process business deletion requests from sellers.</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/admin/deletion-requests" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      View Requests
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Manage Business Listings</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Review, approve, or reject new business listings.</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/admin/business-approvals" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Review Listings
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>View and manage user accounts, roles, and permissions.</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/admin/users" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Manage Users
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Generate Reports</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Generate and download platform analytics and reports.</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/admin/reports" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 