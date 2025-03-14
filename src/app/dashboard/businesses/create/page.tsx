"use client";

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBusiness } from '../../../../lib/database';
import FileUpload from '../../../../components/FileUpload';
import { BUSINESS_SCHEMA, isColumnNotFoundError } from '../../../../lib/database-schema';

// Icons
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

export default function CreateBusinessPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, { message: string; columnName?: string; tableName?: string; hint?: string }>>({});
  
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
      title: 'Review & Publish',
      icon: <ConfirmIcon />,
    },
  ];
  
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
    setSubmitting(true);
    setError(null);
    
    // Enhanced validation for required fields
    const requiredFields = {
      title: 'Business Title',
      category: 'Business Category',
      description: 'Business Description',
      location: 'Business Location',
      askingPrice: 'Asking Price',
      revenue: 'Annual Revenue'
    };
    
    const missingFields: string[] = [];
    
    // Check for missing required fields
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field as keyof FormData]) {
        missingFields.push(label);
      }
    });
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setSubmitting(false);
      return;
    }
    
    try {
      // Prepare business data
      const businessData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        employees: formData.employees ? parseInt(formData.employees) : undefined,
        askingPrice: formData.askingPrice ? parseFloat(formData.askingPrice) : undefined,
        revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
        profit: formData.profit ? parseFloat(formData.profit) : undefined,
        inventory: formData.inventory ? parseFloat(formData.inventory) : undefined,
        assets: formData.assets ? parseFloat(formData.assets) : undefined,
        reason: formData.reason,
        privacyLevel: formData.privacyLevel
      };
      
      console.log('Submitting business data:', JSON.stringify(businessData, null, 2));
      
      const result = await createBusiness(businessData);
      console.log('Business creation result:', JSON.stringify(result, null, 2));
      
      if (result.error) {
        // Improved error handling with detailed logging
        const errorInfo = result.error;
        
        // Log the full error object with detailed properties
        console.error('Business creation error details:', {
          message: errorInfo.message || 'Unknown error',
          type: errorInfo.type || 'unknown_error',
          details: typeof errorInfo.details === 'object' ? JSON.stringify(errorInfo.details || {}, null, 2) : errorInfo.details,
          fullError: JSON.stringify(errorInfo, null, 2)
        });
        
        // Show a more detailed error message
        let errorMessage = errorInfo.message || 'An unknown error occurred';
        
        // Handle specific error types
        if (errorInfo.type === 'schema' || errorInfo.type === 'schema_cache') {
          errorMessage = `Database schema error: ${errorInfo.message}`;
          
          // For schema cache errors, display more detailed information
          if (errorInfo.type === 'schema_cache' && errorInfo.details) {
            setErrorType('schema');
            setValidationErrors({
              schema: {
                message: errorMessage,
                columnName: errorInfo.details.columnName,
                tableName: errorInfo.details.tableName || 'businesses',
                hint: 'This is likely a database configuration issue. The schema mapping might need to be updated.'
              }
            });
            
            // Set main error for UI display
            setError(`Database schema error: ${errorInfo.message}. Please contact support with error details.`);
            setSubmitting(false);
            return;
          }
        } else if (errorInfo.type === 'validation') {
          errorMessage = `Validation error: ${errorInfo.message}`;
          
          // If there are specific field errors, show them
          if (errorInfo.details && typeof errorInfo.details === 'object') {
            const fieldErrors = Object.entries(errorInfo.details)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
            
            if (fieldErrors) {
              errorMessage += ` (${fieldErrors})`;
            }
          }
        }
        
        setError(errorMessage);
        setSubmitting(false);
        return;
      }
      
      if (result.data) {
        // Safeguard against incorrect data structure
        let businessId: string | null = null;
        
        if (Array.isArray(result.data) && result.data.length > 0) {
          businessId = result.data[0]?.id || null;
        } else if (result.data && typeof result.data === 'object') {
          businessId = (result.data as any).id || null;
        }
        
        if (businessId) {
          router.push(`/dashboard/businesses/${businessId}`);
        } else {
          setError('Business was created but the ID was not returned. Check your database.');
          setSubmitting(false);
        }
      } else {
        // Handle case where neither error nor data is returned
        console.error('Business creation returned neither data nor error');
        setError('Failed to create business listing. The operation did not return any result.');
        setSubmitting(false);
      }
    } catch (err: any) {
      // Improved error logging for caught exceptions
      console.error('Error creating business:', err);
      console.error('Error details:', {
        message: err?.message || 'Unknown error',
        type: err?.type || typeof err,
        name: err?.name || 'Error',
        stack: err?.stack || 'No stack trace',
        code: err?.code
      });
      
      // Enhanced error message based on error type
      let errorMessage = 'Failed to create business listing';
      
      if (err?.type === 'validation') {
        errorMessage = err.message || 'Validation error';
        
        // Show field-specific errors
        if (err.details && typeof err.details === 'object') {
          const fieldErrors = Object.entries(err.details)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          
          if (fieldErrors) {
            errorMessage += `: ${fieldErrors}`;
          }
        }
      } else {
        // For non-validation errors, use the message if available
        errorMessage = err?.message || errorMessage;
      }
      
      setError(errorMessage);
      setSubmitting(false);
    }
  };
  
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Business Images & Files</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload images of your business, equipment, products, etc. You can also upload relevant documents like licenses and financial statements.
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
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Your Business Listing</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please review your business information before publishing. You can go back to make changes if needed.
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
            
            <div className="bg-yellow-50 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      By publishing this listing, you confirm that all provided information is accurate and that you have the authority to sell this business. Your listing will be reviewed by our team before becoming visible to potential buyers.
                    </p>
                  </div>
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
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Business Listing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill out the form below to create a new business listing. All fields marked with * are required.
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
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        )}
      </div>
    </div>
  );
} 