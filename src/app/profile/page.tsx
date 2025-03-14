"use client";

import React, { useState, FormEvent, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, updateUserProfile, signOut } from '../../lib/auth';

interface ProfileFormData {
  fullName: string;
  phoneNumber: string;
  company: string;
  position: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    phoneNumber: '',
    company: '',
    position: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await getUser();
        
        if (error) {
          throw error;
        }

        if (data.user) {
          setUser(data.user);
          
          // Load user metadata into form
          const { user_metadata } = data.user;
          setFormData({
            fullName: user_metadata?.full_name || '',
            phoneNumber: user_metadata?.phone_number || '',
            company: user_metadata?.company || '',
            position: user_metadata?.position || '',
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        // Redirect to login if user can't be fetched
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await updateUserProfile({
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        company: formData.company,
        position: formData.position,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      
      // Update local user state with new metadata
      if (data.user) {
        setUser(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
      
      // Hide success message after 3 seconds
      if (success) {
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign Out
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
              Your profile has been updated successfully.
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-sm text-gray-600">Email: {user?.email}</p>
            <p className="text-sm text-gray-600">Account type: {user?.user_metadata?.role || 'User'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                id="position"
                name="position"
                type="text"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 