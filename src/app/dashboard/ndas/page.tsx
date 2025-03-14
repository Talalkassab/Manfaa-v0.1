"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';

// NDA item card component
const NdaCard = ({
  id,
  business,
  signedAt,
  status,
  expiresAt
}: {
  id: string;
  business: {
    id: string;
    name: string;
    category: string;
  };
  signedAt: string;
  status: string;
  expiresAt?: string;
}) => {
  const formattedSignedDate = new Date(signedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedExpiryDate = expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Pending approval';
  
  // Calculate days until expiry
  const daysUntilExpiry = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  
  return (
    <div className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">
            <Link href={`/dashboard/businesses/${business.id}`} className="hover:text-blue-600">
              {business.name}
            </Link>
          </h3>
          <p className="text-sm text-gray-500">{business.category}</p>
        </div>
        <div className={`px-2 py-1 text-xs font-medium rounded-full 
          ${status === 'approved' ? 'bg-green-100 text-green-800' : 
            status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'}`}>
          {status === 'approved' ? 'Approved' : 
           status === 'pending' ? 'Pending' : 'Rejected'}
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-3 mt-2">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-500">Signed on</p>
            <p className="font-medium">{formattedSignedDate}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Valid until</p>
            <p className={`font-medium ${daysUntilExpiry !== null && daysUntilExpiry < 10 ? 'text-red-600' : ''}`}>
              {formattedExpiryDate}
              {daysUntilExpiry !== null && daysUntilExpiry < 10 && ` (${daysUntilExpiry} days left)`}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <Link href={`/dashboard/businesses/${business.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View Business
        </Link>
      </div>
    </div>
  );
};

export default function NdaPage() {
  const [user, setUser] = useState<any>(null);
  const [ndas, setNdas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user data
        const { data } = await getUser();
        if (data?.user) {
          setUser(data.user);
        }
        
        // Fetch NDAs
        const response = await fetch('/api/ndas');
        
        if (!response.ok) {
          throw new Error(`Error fetching NDAs: ${response.statusText}`);
        }
        
        const ndaData = await response.json();
        setNdas(ndaData);
      } catch (err: any) {
        console.error('Error in NDA page:', err);
        setError(err.message || 'Failed to load NDAs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Signed NDAs</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {ndas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ndas.map(nda => (
            <NdaCard
              key={nda.id}
              id={nda.id}
              business={nda.business}
              signedAt={nda.signed_at}
              status={nda.status}
              expiresAt={nda.expires_at}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No NDAs found</h3>
          <p className="mt-1 text-gray-500">
            You haven't signed any Non-Disclosure Agreements yet. When you sign NDAs for businesses, they will appear here.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/businesses" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Browse Businesses
            </Link>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">About NDAs</h2>
        <div className="bg-blue-50 rounded-lg p-4 text-blue-800">
          <ul className="list-disc list-inside space-y-2">
            <li>NDAs (Non-Disclosure Agreements) protect sensitive business information.</li>
            <li>Once signed, you're legally bound to keep the information confidential.</li>
            <li>NDAs typically have an expiration date, after which you're no longer bound by the agreement.</li>
            <li>Signing an NDA gives you access to protected business documents and information.</li>
            <li>Always review NDA terms carefully before signing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 