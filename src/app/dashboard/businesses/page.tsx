"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUser } from '../../../lib/auth';

// Business card component
const BusinessCard = ({ 
  title, 
  category, 
  location, 
  price, 
  id, 
  imageUrl,
  status,
  statusBadge
}: { 
  title: string; 
  category: string; 
  location: string; 
  price: string;
  id: string;
  imageUrl?: string;
  status?: string;
  statusBadge?: {
    color: string;
    label: string;
  };
}) => {
  // Get background color class based on status
  const getStatusBgColor = () => {
    if (!statusBadge) return '';
    
    switch (statusBadge.color) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden transition-transform hover:shadow-lg">
      <div className="h-40 bg-gray-200 relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
          {category}
        </div>
        
        {/* Status badge for sellers */}
        {statusBadge && (
          <div className={`absolute top-2 left-2 ${getStatusBgColor()} text-white px-2 py-1 rounded text-xs font-medium`}>
            {statusBadge.label}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-2">{location}</p>
        <div className="flex justify-between items-center">
          <span className="text-blue-600 font-bold">{price}</span>
          <Link href={`/dashboard/businesses/${id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function BusinessesPage() {
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('approved');
  const [error, setError] = useState<string | null>(null);
  
  // Categories and locations for filtering
  const categories = ['All Categories', 'Technology', 'Food', 'Retail', 'Services', 'Manufacturing', 'E-commerce'];
  const locations = ['All Locations', 'Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'];
  const statusOptions = [
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Function to fetch businesses
  const fetchBusinesses = async (
    page: number = currentPage,
    searchText: string = searchTerm,
    categoryFilter: string = selectedCategory,
    locationFilter: string = selectedLocation,
    statusFilter: string = selectedStatus
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchText) {
        params.append('search', searchText);
      }

      if (categoryFilter && categoryFilter !== 'All Categories') {
        params.append('category', categoryFilter);
      }

      if (locationFilter && locationFilter !== 'All Locations') {
        params.append('location', locationFilter);
      }

      // If the user is a seller, only show their businesses
      const isSeller = user?.user_metadata?.role === 'seller';
      if (isSeller) {
        params.append('userId', user.id);
        params.append('status', statusFilter);
      } else {
        // Buyers only see approved businesses
        params.append('status', 'approved');
      }

      const response = await fetch(`/api/businesses?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(`Error fetching businesses: ${err.message}. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data, error } = await getUser();
        if (error) {
          console.error('Error fetching user:', error);
          return;
        }
        
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch businesses when user data is loaded or filters change
  useEffect(() => {
    if (user) {
      fetchBusinesses(currentPage);
    }
  }, [currentPage, selectedStatus, user]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchBusinesses(1, searchTerm, selectedCategory, selectedLocation, selectedStatus);
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    setCurrentPage(1);
    fetchBusinesses(1, searchTerm, value, selectedLocation, selectedStatus);
  };

  // Handle location change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocation(value);
    setCurrentPage(1);
    fetchBusinesses(1, searchTerm, selectedCategory, value, selectedStatus);
  };

  // Handle status change (for sellers only)
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStatus(value);
    setCurrentPage(1);
    fetchBusinesses(1, searchTerm, selectedCategory, selectedLocation, value);
  };

  if (loading && !user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const isSeller = user?.user_metadata?.role === 'seller';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Business Listings</h1>
          <p className="text-gray-600">
            {isSeller ? 'Manage your business listings' : 'Discover businesses for sale'}
          </p>
        </div>
        
        {isSeller && (
          <Link href="/dashboard/businesses/create" className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Create New Listing
          </Link>
        )}
      </div>
      
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search input */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by business name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Location filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={handleLocationChange}
                className="w-full border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            {/* Status filter for sellers */}
            {isSeller && (
              <select
                value={selectedStatus}
                onChange={handleStatusChange}
                className="w-40 border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            <button
              type="submit"
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Businesses grid */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : businesses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  id={business.id}
                  title={business.name || business.title}
                  category={business.category || 'Uncategorized'}
                  location={business.address || business.location || 'Unknown location'}
                  price={business.askingPrice || business.asking_price || 'Contact for price'}
                  imageUrl={business.imageUrl}
                  status={business.status}
                  statusBadge={business.statusBadge}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="inline-flex space-x-1">
                  <button
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`px-3 py-1 rounded-md ${
                        i + 1 === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-500">
              {isSeller
                ? 'You haven\'t created any businesses yet. Create your first business listing!'
                : 'No businesses match your search criteria. Try adjusting your filters.'}
            </p>
            
            {isSeller && (
              <Link href="/dashboard/businesses/create" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Create Business Listing
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 