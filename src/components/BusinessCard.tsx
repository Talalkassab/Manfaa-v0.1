'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '../lib/formatters';
import { getFormFieldName } from '@/lib/database-schema';

// Type definitions
type BusinessCardProps = {
  business: Business;
  hideActions?: boolean;
  isSellerView?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

type Business = {
  id: string;
  // We support both name and title due to schema mapping variations
  name?: string;
  title?: string;
  // We support both address and location due to schema mapping variations
  address?: string;
  location?: string;
  description?: string;
  category?: string;
  asking_price?: number | string;
  status?: 'pending' | 'approved' | 'rejected';
  // Optional counts from materialized views
  image_count?: number;
  document_count?: number;
  nda_count?: number;
  // Owner details
  owner_name?: string;
  created_at?: string;
};

/**
 * Reusable business card component with proper field mapping
 * Handles inconsistencies between frontend and database field names
 */
export default function BusinessCard({
  business,
  hideActions = false,
  isSellerView = false,
  onEdit,
  onDelete,
}: BusinessCardProps) {
  // Handle field mappings - support both name/title and address/location
  const businessName = business.name || business.title || 'Unnamed Business';
  const businessLocation = business.address || business.location || 'Location not specified';
  
  // Format currency values properly
  const askingPrice = formatCurrency(business.asking_price);
  
  // Format the creation date
  const createdDate = business.created_at 
    ? new Date(business.created_at).toLocaleDateString()
    : 'Unknown date';
  
  // Determine status badge color
  const getStatusBadgeClass = () => {
    switch (business.status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative h-48 bg-gray-200">
        {/* Use a placeholder if no image count */}
        {(business.image_count === undefined || business.image_count === 0) ? (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <svg 
              className="w-16 h-16 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
          </div>
        ) : (
          <Link href={`/businesses/${business.id}`}>
            <Image
              src={`/api/storage/business-files/${business.id}/thumbnail.jpg`}
              alt={businessName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                // Fallback on error
                (e.target as HTMLImageElement).src = '/images/placeholder-business.jpg';
              }}
            />
          </Link>
        )}
        
        {/* Status badge for seller view */}
        {isSellerView && business.status && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
            {business.status}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <Link 
            href={`/businesses/${business.id}`} 
            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
          >
            {businessName}
          </Link>
          
          {business.asking_price && (
            <div className="text-lg font-bold text-green-600">
              {askingPrice}
            </div>
          )}
        </div>
        
        <div className="mt-1 flex items-center text-sm text-gray-500">
          <svg 
            className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          {businessLocation}
        </div>
        
        {business.category && (
          <div className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Category:</span> {business.category}
          </div>
        )}
        
        {business.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {business.description}
          </p>
        )}
        
        <div className="mt-4 flex items-center text-xs text-gray-500">
          <span>Listed on {createdDate}</span>
          {business.owner_name && (
            <>
              <span className="mx-1">•</span>
              <span>by {business.owner_name}</span>
            </>
          )}
        </div>
        
        {/* File counts summary */}
        <div className="mt-3 flex space-x-4 text-xs text-gray-500">
          {business.image_count !== undefined && (
            <div className="flex items-center">
              <svg 
                className="w-4 h-4 mr-1 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              {business.image_count} photos
            </div>
          )}
          
          {business.document_count !== undefined && (
            <div className="flex items-center">
              <svg 
                className="w-4 h-4 mr-1 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              {business.document_count} docs
            </div>
          )}
          
          {business.nda_count !== undefined && (
            <div className="flex items-center">
              <svg 
                className="w-4 h-4 mr-1 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
              {business.nda_count} NDAs
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        {!hideActions && (
          <div className="mt-4 flex justify-end space-x-2">
            <Link
              href={`/businesses/${business.id}`}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
            >
              View
            </Link>
            
            {isSellerView && onEdit && (
              <button
                onClick={() => onEdit(business.id)}
                className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition"
              >
                Edit
              </button>
            )}
            
            {isSellerView && onDelete && (
              <button
                onClick={() => onDelete(business.id)}
                className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 