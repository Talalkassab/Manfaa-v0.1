"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Business {
  id: string;
  name: string;
  description: string;
  created_at: string;
  owner_id: string;
  status: string;
  owner: {
    email: string;
    user_metadata: {
      full_name?: string;
    };
  };
}

export default function BusinessApprovals() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingBusinesses();
  }, [currentPage]);

  const fetchPendingBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/businesses?page=${currentPage}&limit=${itemsPerPage}&status=pending`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch pending businesses');
      }
      const data = await response.json();
      setBusinesses(data.businesses);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError('Failed to load pending businesses');
      toast.error('Failed to load pending businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (businessId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/admin/businesses/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          approved,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update business status');
      }

      toast.success(
        approved ? 'Business approved successfully' : 'Business rejected successfully'
      );
      fetchPendingBusinesses(); // Refresh the list
    } catch (error) {
      console.error('Error updating business status:', error);
      toast.error('Failed to update business status');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Business Approvals</h1>
          <p className="mt-2 text-sm text-gray-700">
            Review and manage pending business listings that require approval.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8">
                          Business Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Owner
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Submitted
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Description
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {businesses.map((business) => (
                        <tr key={business.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                            {business.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {business.owner?.user_metadata?.full_name || business.owner?.email || 'Unknown Owner'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(business.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {business.description}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 lg:pr-8">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApproval(business.id, true)}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval(business.id, false)}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 