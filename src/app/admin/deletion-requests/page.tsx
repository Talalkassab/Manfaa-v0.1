"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface DeletionRequest {
  id: string;
  business_id: string;
  reason: string;
  status: string;
  created_at: string;
  business: {
    name: string;
    owner: {
      email: string;
      user_metadata: {
        full_name?: string;
      };
    };
  } | null;
}

export default function DeletionRequests() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDeletionRequests();
  }, [currentPage]);

  const fetchDeletionRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `/api/admin/deletion-requests?page=${currentPage}&limit=${itemsPerPage}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch deletion requests');
      }
      
      const data = await response.json();
      setRequests(data.requests);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
      const message = error instanceof Error ? error.message : 'Failed to load deletion requests';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/deletion-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve deletion request');
      }

      toast.success('Deletion request approved');
      fetchDeletionRequests();
    } catch (error) {
      console.error('Error approving deletion request:', error);
      const message = error instanceof Error ? error.message : 'Failed to approve deletion request';
      toast.error(message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/deletion-requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject deletion request');
      }

      toast.success('Deletion request rejected');
      fetchDeletionRequests();
    } catch (error) {
      console.error('Error rejecting deletion request:', error);
      const message = error instanceof Error ? error.message : 'Failed to reject deletion request';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Deletion Requests</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Deletion Requests</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <button
                onClick={() => fetchDeletionRequests()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Deletion Requests</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center text-gray-600">
              <p>No deletion requests found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Deletion Requests</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.business?.name || 'Unknown Business'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {request.business?.owner?.user_metadata?.full_name || 'Unknown Owner'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.business?.owner?.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
} 