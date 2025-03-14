"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBusinessById, updateBusiness } from '../../../../../lib/database';
import FileUpload from '../../../../../components/FileUpload';
import FileManager from './file-manager';
import { BUSINESS_SCHEMA } from '../../../../../lib/database-schema';

// Icons (reusing from create page)
const BusinessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const MoneyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ConfirmIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface Step {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface FormData {
  // Basic Info
  title: string;
  category: string;
  description: string;
  location: string;
  establishedYear: string;
  employees: string;
  
  // Financial Info
  askingPrice: string;
  revenue: string;
  profit: string;
  inventory: string;
  assets: string;
  reason: string;
  
  // Images
  images: any[];
  
  // Privacy
  privacyLevel: 'public' | 'nda' | 'private';
}

export default function EditBusinessPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  const [formData, setFormData] = useState<FormData>({
    // Basic Info
    title: '',
    category: '',
    description: '',
    location: '',
    establishedYear: '',
    employees: '',
    
    // Financial Info
    askingPrice: '',
    revenue: '',
    profit: '',
    inventory: '',
    assets: '',
    reason: '',
    
    // Images
    images: [],
    
    // Privacy
    privacyLevel: 'public',
  });
  
  const steps: Step[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      icon: <BusinessIcon />,
    },
    {
      id: 'financial-info',
      title: 'Financial Information',
      icon: <MoneyIcon />,
    },
    {
      id: 'images',
      title: 'Images & Files',
      icon: <ImageIcon />,
    },
    {
      id: 'confirm',
      title: 'Review & Update',
      icon: <ConfirmIcon />,
    },
  ];
  
  // Fetch business data when the component loads
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const { data, error } = await getBusinessById(businessId);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Transform database data to form data structure using our schema mapper
          setFormData(BUSINESS_SCHEMA.toForm(data) as FormData);
        }
      } catch (err: any) {
        console.error('Error fetching business:', err);
        setError('Failed to load business data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusiness();
  }, [businessId]);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleNext = () => {
    // Validate current step
    if (currentStep === 0) {
      // Validate basic info
      if (!formData.title) {
        setError('Business title is required');
        return;
      }
      if (!formData.category) {
        setError('Category is required');
        return;
      }
      if (!formData.description) {
        setError('Description is required');
        return;
      }
      if (!formData.location) {
        setError('Location is required');
        return;
      }
    } else if (currentStep === 1) {
      // Validate financial info
      if (!formData.askingPrice) {
        setError('Asking price is required');
        return;
      }
      if (!formData.revenue) {
        setError('Annual revenue is required');
        return;
      }
      if (!formData.profit) {
        setError('Net profit is required');
        return;
      }
    }
    
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };
  
  const handlePrevious = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  
  const handlePrivacyChange = (level: 'public' | 'nda' | 'private') => {
    setFormData((prev) => ({
      ...prev,
      privacyLevel: level,
    }));
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Validate the form data first
      const validation = BUSINESS_SCHEMA.validate(formData);
      if (!validation.valid) {
        throw new Error(`Please fill in all required fields: ${validation.errors.missing.join(', ')}`);
      }
      
      // Transform form data to database structure using our schema mapper
      const businessData = BUSINESS_SCHEMA.toDatabase(formData);
      
      const { data, error } = await updateBusiness(businessId, businessData);
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
      // Navigate back to the business detail page after success
      setTimeout(() => {
        router.push(`/dashboard/businesses/${businessId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error updating business:', err);
      setError(err.message || 'Failed to update business listing');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Business Title*
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Coffee Shop in Riyadh"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Retail">Retail</option>
                <option value="Technology">Technology</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Education">Education</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide a detailed description of your business..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Describe your business in detail. Include information about products/services, customers, and unique selling points.
              </p>
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location*
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Riyadh, Saudi Arabia"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700 mb-1">
                  Year Established
                </label>
                <input
                  id="establishedYear"
                  name="establishedYear"
                  type="number"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>
              
              <div>
                <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Employees
                </label>
                <input
                  id="employees"
                  name="employees"
                  type="number"
                  value={formData.employees}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5"
                />
              </div>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="askingPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Asking Price (SAR)*
              </label>
              <input
                id="askingPrice"
                name="askingPrice"
                type="number"
                value={formData.askingPrice}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 500000"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the asking price in Saudi Riyal (SAR) - Numbers only, without commas or currency symbol.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Revenue (SAR)*
                </label>
                <input
                  id="revenue"
                  name="revenue"
                  type="number"
                  value={formData.revenue}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1000000"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="profit" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Net Profit (SAR)*
                </label>
                <input
                  id="profit"
                  name="profit"
                  type="number"
                  value={formData.profit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 300000"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Value (SAR)
                </label>
                <input
                  id="inventory"
                  name="inventory"
                  type="number"
                  value={formData.inventory}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100000"
                />
              </div>
              
              <div>
                <label htmlFor="assets" className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Value (SAR)
                </label>
                <input
                  id="assets"
                  name="assets"
                  type="number"
                  value={formData.assets}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200000"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Selling
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Why are you selling this business?"
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Business Images & Files</h3>
              <p className="text-sm text-gray-500 mb-4">
                Update existing images or upload new ones for your business. You can also manage document privacy settings.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-md font-medium text-gray-700 mb-2">Privacy Settings</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Choose who can see the files you upload.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="privacy-public"
                      name="privacy"
                      type="radio"
                      checked={formData.privacyLevel === 'public'}
                      onChange={() => handlePrivacyChange('public')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="privacy-public" className="ml-2 block text-sm text-gray-700">
                      <span className="font-medium">Public</span> - Visible to all users
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="privacy-nda"
                      name="privacy"
                      type="radio"
                      checked={formData.privacyLevel === 'nda'}
                      onChange={() => handlePrivacyChange('nda')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="privacy-nda" className="ml-2 block text-sm text-gray-700">
                      <span className="font-medium">NDA</span> - Only visible after signing an NDA
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="privacy-private"
                      name="privacy"
                      type="radio"
                      checked={formData.privacyLevel === 'private'}
                      onChange={() => handlePrivacyChange('private')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="privacy-private" className="ml-2 block text-sm text-gray-700">
                      <span className="font-medium">Private</span> - Only visible to you
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <FileUpload
                  onFilesChange={(files) => {
                    setFormData(prev => ({
                      ...prev,
                      images: files
                    }));
                  }}
                  maxFiles={10}
                  maxSize={10} // 10MB
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
                  value={formData.images}
                />
              </div>
              
              {/* Display existing files/images (in a real app, you would display them here) */}
              {formData.images.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Existing Images</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={image.url || '#'}
                          alt={image.description || `Image ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute top-0 right-0 p-1">
                          <button 
                            type="button"
                            className="bg-red-600 text-white rounded-full p-1"
                            onClick={() => {
                              // In a real app, you would implement delete functionality
                              alert(`Delete image ${index + 1}`);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-2 bg-gray-100">
                          <p className="text-xs text-gray-700 truncate">{image.description || `Image ${index + 1}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Your Business Listing</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please review your updated business information before saving changes. You can go back to make further adjustments if needed.
            </p>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">{formData.title || 'Untitled Business'}</h4>
                <p className="text-sm text-gray-500">{formData.location || 'No location specified'}</p>
              </div>
              
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Category:</span>
                  <span className="text-sm text-gray-900">{formData.category || 'Not specified'}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Asking Price:</span>
                  <span className="text-sm text-gray-900">
                    {formData.askingPrice ? `SAR ${Number(formData.askingPrice).toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Annual Revenue:</span>
                  <span className="text-sm text-gray-900">
                    {formData.revenue ? `SAR ${Number(formData.revenue).toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Annual Profit:</span>
                  <span className="text-sm text-gray-900">
                    {formData.profit ? `SAR ${Number(formData.profit).toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">Established:</span>
                  <span className="text-sm text-gray-900">{formData.establishedYear || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Employees:</span>
                  <span className="text-sm text-gray-900">{formData.employees || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="px-6 py-4 border-b border-gray-200">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Description:</h5>
                <p className="text-sm text-gray-900 whitespace-pre-line">
                  {formData.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="px-6 py-4">
                <h5 className="text-sm font-medium text-gray-500 mb-2">Privacy Level:</h5>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    formData.privacyLevel === 'public'
                      ? 'bg-green-100 text-green-800'
                      : formData.privacyLevel === 'nda'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.privacyLevel === 'public'
                      ? 'Public'
                      : formData.privacyLevel === 'nda'
                      ? 'NDA Required'
                      : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Business</h1>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'details'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Business Details
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'files'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          File Manager
        </button>
      </div>
      
      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="max-w-4xl mx-auto pb-12">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Edit Business Listing</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update your business information below. All fields marked with * are required.
            </p>
          </div>
          
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {/* Step Circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                      index < currentStep
                        ? 'bg-blue-600 text-white'
                        : index === currentStep
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index < currentStep ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className={`ml-3 ${index === steps.length - 1 ? 'flex-grow' : ''}`}>
                    <p className={`text-sm font-medium ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-grow border-t-2 ${index < currentStep ? 'border-blue-600' : 'border-gray-200'} mx-2`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Form Content */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            {error && (
              <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                Business listing updated successfully! Redirecting to business details...
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {renderStep()}
            </form>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'files' && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <FileManager businessId={params.id as string} />
        </div>
      )}
    </div>
  );
} 