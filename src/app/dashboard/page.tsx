"use client";

import React, { useEffect, useState } from 'react';
import { getUser } from '../../lib/auth';

// Components for dashboard sections
const StatCard = ({ title, value, icon, color }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: string;
}) => {
  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${color}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-600', '-100')} text-${color.replace('border-', '').replace('-600', '-500')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ 
  title, 
  description, 
  time, 
  icon 
}: { 
  title: string; 
  description: string; 
  time: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex space-x-3 py-3">
      <div className="flex-shrink-0">
        <div className="bg-blue-100 rounded-full p-2 text-blue-500">
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
        {time}
      </div>
    </div>
  );
};

// Icons
const BusinessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const NDAIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ActivityFeedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getUser();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const userRole = user?.user_metadata?.role || 'buyer';
  
  // Mock data - in a real app, this would come from the database
  const stats = userRole === 'seller' 
    ? [
        { title: 'Your Businesses', value: 3, icon: <BusinessIcon />, color: 'border-blue-600' },
        { title: 'Total Views', value: 245, icon: <ViewIcon />, color: 'border-green-600' },
        { title: 'Active NDAs', value: 8, icon: <NDAIcon />, color: 'border-purple-600' },
        { title: 'New Messages', value: 12, icon: <MessageIcon />, color: 'border-yellow-600' },
      ]
    : [
        { title: 'Viewed Businesses', value: 15, icon: <ViewIcon />, color: 'border-blue-600' },
        { title: 'Interested In', value: 5, icon: <BusinessIcon />, color: 'border-green-600' },
        { title: 'Signed NDAs', value: 3, icon: <NDAIcon />, color: 'border-purple-600' },
        { title: 'New Messages', value: 8, icon: <MessageIcon />, color: 'border-yellow-600' },
      ];
      
  // Mock activity feed
  const activities = [
    {
      title: userRole === 'seller' ? 'New business view' : 'You viewed a business',
      description: userRole === 'seller' 
        ? 'A potential buyer viewed your "Coffee Shop in Riyadh" listing' 
        : 'You viewed "Coffee Shop in Riyadh" business listing',
      time: '2 hours ago',
      icon: <ViewIcon />,
    },
    {
      title: userRole === 'seller' ? 'NDA signed' : 'You signed an NDA',
      description: userRole === 'seller' 
        ? 'A buyer signed an NDA for your "Tech Startup" listing' 
        : 'You signed an NDA for "Tech Startup" business listing',
      time: '1 day ago',
      icon: <NDAIcon />,
    },
    {
      title: 'New message',
      description: userRole === 'seller' 
        ? 'You received a message about your "Restaurant" listing' 
        : 'You received a reply about "Restaurant" listing',
      time: '2 days ago',
      icon: <MessageIcon />,
    },
  ];
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Greeting */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold">Welcome back, {user?.user_metadata?.full_name || user?.email}</h2>
        <p className="text-gray-500 mt-1">
          {userRole === 'seller' 
            ? 'Manage your business listings and communicate with potential buyers.' 
            : 'Discover businesses for sale and connect with sellers.'}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
      
      {/* Activity Feed */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ActivityFeedIcon />
          <h2 className="text-lg font-semibold ml-2">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {activities.map((activity, index) => (
            <ActivityItem 
              key={index}
              title={activity.title}
              description={activity.description}
              time={activity.time}
              icon={activity.icon}
            />
          ))}
        </div>
        
        {activities.length === 0 && (
          <p className="text-gray-500 text-center py-4">No recent activity to display.</p>
        )}
      </div>
      
      {/* Quick Links */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userRole === 'seller' ? (
            <>
              <a href="/dashboard/businesses/create" className="block bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
                <BusinessIcon />
                <span className="block mt-2 font-medium">Create New Business Listing</span>
              </a>
              <a href="/dashboard/businesses" className="block bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors">
                <BusinessIcon />
                <span className="block mt-2 font-medium">Manage Your Listings</span>
              </a>
              <a href="/dashboard/messages" className="block bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition-colors">
                <MessageIcon />
                <span className="block mt-2 font-medium">View Messages</span>
              </a>
            </>
          ) : (
            <>
              <a href="/dashboard/businesses" className="block bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
                <BusinessIcon />
                <span className="block mt-2 font-medium">Browse Businesses</span>
              </a>
              <a href="/dashboard/ndas" className="block bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors">
                <NDAIcon />
                <span className="block mt-2 font-medium">View Signed NDAs</span>
              </a>
              <a href="/dashboard/messages" className="block bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition-colors">
                <MessageIcon />
                <span className="block mt-2 font-medium">Check Messages</span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 