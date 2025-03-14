"use client";

import React, { useState, useEffect, JSX } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '../../../../lib/auth';
import { submitDeletionRequest } from '../../../../lib/database';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Helper components
const InfoItem = ({ label, value }: { label: string; value: string | number | JSX.Element }) => (
  <div className="mb-4">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-base text-gray-900">{value}</p>
  </div>
);

const TabButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode 
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md ${
      active 
        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

// Mock data for NDA
const ndaSigned = false;

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  const supabase = createClientComponentClient();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showingImageFullscreen, setShowingImageFullscreen] = useState<string | null>(null);
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [deleteRequestSuccess, setDeleteRequestSuccess] = useState(false);
  const [error, setError] = useState('');
  const [ndaSigned, setNdaSigned] = useState(false);
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [isSigningNda, setIsSigningNda] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [directImages, setDirectImages] = useState<any[]>([]);
  const [directDocuments, setDirectDocuments] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user
        const { data } = await getUser();
        if (data?.user) {
          setUser(data.user);
          
          // Check if user has already signed an NDA for this business
          try {
            const ndaResponse = await fetch(`/api/ndas?businessId=${businessId}`);
            if (ndaResponse.ok) {
              const ndaData = await ndaResponse.json();
              setNdaSigned(ndaData && ndaData.length > 0 && ndaData.some((nda: any) => nda.status === 'approved'));
            }
          } catch (err) {
            console.error('Error checking NDA status:', err);
          }
          
          // Fetch the actual business data from the API
          try {
            // We won't try to manually include auth headers - the fetch API will automatically 
            // include cookies which will be read by the server-side auth utility
            const businessResponse = await fetch(`/api/businesses/${businessId}`, {
              credentials: 'include' // Include cookies in the request
            });
            
            if (businessResponse.ok) {
              const businessData = await businessResponse.json();
              console.log('Fetched business data:', businessData);
              
              // Log image and document data specifically
              console.log('Images found:', businessData.images?.length || 0, businessData.images);
              console.log('Documents found:', businessData.documents?.length || 0, businessData.documents);
              
              // Transform API data to match component's expected format
              setBusiness({
                id: businessData.id,
                title: businessData.name,
                description: businessData.description,
                category: businessData.category,
                location: businessData.address,
                askingPrice: businessData.asking_price,
                revenue: businessData.revenue,
                profit: businessData.profit,
                establishedYear: businessData.established_year,
                employees: businessData.employees,
                reason: businessData.reason_for_selling,
                sellerName: businessData.owner?.full_name || 'Owner',
                images: businessData.images || [],
                documents: businessData.documents || [],
                financials: businessData.financials || {
                  inventory: 0,
                  assets: 0,
                  liabilities: 0
                },
                status: businessData.status,
                owner: businessData.owner,
                user_id: businessData.user_id
              });
            } else {
              throw new Error(`Failed to fetch business: ${businessResponse.statusText}`);
            }
          } catch (err) {
            console.error('Error fetching business details:', err);
            setError('Failed to load business details. Please try again later.');
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    // Function to fetch images directly from Supabase
    const fetchDirectStorage = async () => {
      try {
        console.log("Starting direct storage fetch for business ID:", businessId);
        
        // First try the 'businesses' bucket
        const { data: imagesData, error: imagesError } = await supabase
          .storage
          .from('businesses')
          .list(businessId as string);
        
        if (imagesError) {
          console.error('Error fetching images from businesses bucket:', imagesError);
        } else if (imagesData && imagesData.length > 0) {
          console.log('Direct images found in businesses bucket:', imagesData.length);
          const formattedImages = imagesData.map(img => ({
            id: img.id,
            name: img.name,
            url: `${window.location.origin}/api/storage/businesses/${businessId}/${img.name}`,
            isPublic: true,
            type: img.metadata?.mimetype || 'image/jpeg'
          }));
          setDirectImages(formattedImages);
        } else {
          console.log('No images found in businesses bucket, trying business-files bucket');
          
          // Try the 'business-files' bucket with nested path
          const { data: businessFilesData, error: businessFilesError } = await supabase
            .storage
            .from('business-files')
            .list(`businesses/${businessId}`);
          
          if (businessFilesError) {
            console.error('Error fetching from business-files/businesses path:', businessFilesError);
          } else if (businessFilesData && businessFilesData.length > 0) {
            console.log('Images found in business-files/businesses path:', businessFilesData.length);
            const formattedImages = businessFilesData.map(img => ({
              id: img.id,
              name: img.name,
              url: `${window.location.origin}/api/storage/business-files/businesses/${businessId}/${img.name}`,
              isPublic: true,
              type: img.metadata?.mimetype || 'image/jpeg'
            }));
            setDirectImages(formattedImages);
          } else {
            // Try direct folder in business-files
            const { data: directFilesData, error: directFilesError } = await supabase
              .storage
              .from('business-files')
              .list(businessId as string);
            
            if (directFilesError) {
              console.error('Error fetching from direct business-files path:', directFilesError);
            } else if (directFilesData && directFilesData.length > 0) {
              console.log('Images found in direct business-files path:', directFilesData.length);
              const formattedImages = directFilesData.map(img => ({
                id: img.id,
                name: img.name,
                url: `${window.location.origin}/api/storage/business-files/${businessId}/${img.name}`,
                isPublic: true,
                type: img.metadata?.mimetype || 'image/jpeg'
              }));
              setDirectImages(formattedImages);
            } else {
              console.log('No images found in any bucket');
            }
          }
        }
        
        // Try to fetch documents
        const { data: docsData, error: docsError } = await supabase
          .storage
          .from('businesses')
          .list(`${businessId}/documents`);
        
        if (docsError) {
          console.error('Error fetching documents from businesses bucket:', docsError);
          
          // Try documents in business-files bucket
          const { data: altDocsData, error: altDocsError } = await supabase
            .storage
            .from('business-files')
            .list(`${businessId}/documents`);
          
          if (altDocsError) {
            console.error('Error fetching documents from business-files bucket:', altDocsError);
          } else if (altDocsData && altDocsData.length > 0) {
            console.log('Documents found in business-files bucket:', altDocsData.length);
            const formattedDocs = altDocsData.map(doc => ({
              id: doc.id,
              name: doc.name,
              url: `${window.location.origin}/api/storage/business-files/${businessId}/documents/${doc.name}`,
              isPublic: true,
              type: doc.metadata?.mimetype || 'application/pdf'
            }));
            setDirectDocuments(formattedDocs);
          }
        } else if (docsData && docsData.length > 0) {
          console.log('Direct documents found in businesses bucket:', docsData.length);
          const formattedDocs = docsData.map(doc => ({
            id: doc.id,
            name: doc.name,
            url: `${window.location.origin}/api/storage/businesses/${businessId}/documents/${doc.name}`,
            isPublic: true,
            type: doc.metadata?.mimetype || 'application/pdf'
          }));
          setDirectDocuments(formattedDocs);
        }
      } catch (error) {
        console.error('Error in fetchDirectStorage:', error);
      }
    };
    
    // Call the direct storage fetch function after the component mounts
    fetchDirectStorage();
    
    fetchData();
  }, [businessId, supabase]);
  
  // Function to handle signing NDA
  const handleSignNda = async () => {
    if (!ndaAgreed || !business) return;
    
    try {
      setIsSigningNda(true);
      setError('');
      
      // Call the API to sign the NDA
      const response = await fetch('/api/ndas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          terms: "Standard NDA terms for " + business.title
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to sign NDA: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update state to reflect signed NDA
      setNdaSigned(true);
      setShowNdaModal(false);
      
      // Show success alert
      alert('NDA signed successfully! You now have access to protected business information.');
      
    } catch (err: any) {
      console.error('Error signing NDA:', err);
      setError(err.message || 'Failed to sign NDA. Please try again.');
    } finally {
      setIsSigningNda(false);
    }
  };
  
  // Function to handle sending a message to the seller
  const handleSendMessage = async () => {
    if (!message.trim() || !business) return;
    
    try {
      setIsSendingMessage(true);
      setMessageError('');
      
      // Call the API to send the message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id,
          message: message.trim(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to send message: ${response.statusText}`);
      }
      
      // Update state to reflect sent message
      setMessageSuccess(true);
      setMessage('');
      
      // Auto-close the modal after success
      setTimeout(() => {
        setShowContactModal(false);
        setMessageSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessageError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  if (loading || !business) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const userRole = user?.user_metadata?.role || 'buyer';
  
  // Image processing
  // Make sure images exist before filtering
  const images = directImages.length > 0 ? directImages : (business?.images || []);
  console.log('Processing images:', images);
  const publicImages = images.filter((img: any) => img?.isPublic !== false);
  const ndaProtectedImages = images.filter((img: any) => img?.isPublic === false);

  // Document processing
  // Make sure documents exist before filtering
  const documents = directDocuments.length > 0 ? directDocuments : (business?.documents || []);
  console.log('Processing documents:', documents);
  const publicDocuments = documents.filter((doc: any) => doc?.isPublic !== false);
  const ndaProtectedDocuments = documents.filter((doc: any) => doc?.isPublic === false);
  
  const isSeller = userRole === 'seller';
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Business Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{business.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <InfoItem label="Category" value={business.category} />
                    <InfoItem label="Location" value={business.location} />
                    <InfoItem label="Established" value={business.establishedYear} />
                    <InfoItem label="Employees" value={business.employees} />
                    <InfoItem label="Reason for Selling" value={business.reason} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <InfoItem 
                      label="Asking Price" 
                      value={<span className="text-lg font-semibold text-blue-600">SAR {(business.askingPrice || 0).toLocaleString()}</span>} 
                    />
                    <InfoItem label="Annual Revenue" value={`SAR ${(business.revenue || 0).toLocaleString()}`} />
                    <InfoItem label="Annual Net Profit" value={`SAR ${(business.profit || 0).toLocaleString()}`} />
                    
                    {/* Only show additional financial data if NDA is signed or user is seller */}
                    {(ndaSigned || isSeller) && (
                      <>
                        <InfoItem label="Inventory Value" value={`SAR ${(business.financials?.inventory || 0).toLocaleString()}`} />
                        <InfoItem label="Assets Value" value={`SAR ${(business.financials?.assets || 0).toLocaleString()}`} />
                        <InfoItem label="Liabilities" value={`SAR ${(business.financials?.liabilities || 0).toLocaleString()}`} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'photos':
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Photos</h3>
            
            {publicImages.length > 0 ? (
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-2">Public Photos</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publicImages.map((image: any, index: number) => (
                    <div 
                      key={image.id || `image-${index}`} 
                      className="group relative rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer"
                      onClick={() => setShowingImageFullscreen(image.url)}
                    >
                      <img 
                        src={image.url} 
                        alt={image.description || `Business image ${index + 1}`} 
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          console.error(`Failed to load image: ${image.url}`);
                          // Set a placeholder image on error
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                        <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-100">
                        <p className="text-sm text-gray-700 truncate">{image.name || `Image ${index + 1}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8 bg-gray-50 p-4 rounded-md text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mb-1">No images available</p>
                  <p className="text-gray-400 text-sm">The business owner has not uploaded any images yet</p>
                </div>
              </div>
            )}
            
            {ndaProtectedImages.length > 0 && (
              <div>
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-md font-medium text-gray-900">
                    NDA Protected Images ({ndaProtectedImages.length})
                  </h4>
                </div>
                
                {ndaSigned || isSeller ? (
                  // Show NDA-protected images
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ndaProtectedImages.map(image => (
                      <div 
                        key={image.id} 
                        className="group relative rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setShowingImageFullscreen(image.url)}
                      >
                        <img 
                          src={image.url} 
                          alt={image.description} 
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-100">
                          <p className="text-sm text-gray-700 truncate">{image.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show NDA sign prompt
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-700 mb-2">
                      These images are only visible after signing a non-disclosure agreement.
                    </p>
                    <button
                      onClick={() => setShowNdaModal(true)}
                      className="text-sm font-medium text-yellow-700 hover:text-yellow-600 bg-yellow-200 hover:bg-yellow-300 px-3 py-1 rounded-md transition-colors"
                    >
                      Sign NDA to View
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Fullscreen image viewer */}
            {showingImageFullscreen && (
              <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                <div className="relative max-w-5xl max-h-screen p-4">
                  <button
                    onClick={() => setShowingImageFullscreen(null)}
                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <img
                    src={showingImageFullscreen}
                    alt="Fullscreen view"
                    className="max-h-screen max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        );
      
      case 'documents':
        return (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Documents</h3>
            
            {publicDocuments.length > 0 ? (
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-2">Public Documents</h4>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {publicDocuments.map((doc: any, index: number) => (
                    <div key={doc.id || `doc-${index}`} className={`flex items-center p-4 ${index !== publicDocuments.length - 1 ? 'border-b border-gray-200' : ''}`}>
                      <div className="flex-shrink-0 text-gray-400">
                        {getDocumentIcon(doc.type || 'application/pdf')}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                        <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          if (!doc.url) {
                            e.preventDefault();
                            alert('Document URL is not available');
                          }
                        }}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-8 bg-gray-50 p-4 rounded-md text-center">
                <div className="flex flex-col items-center justify-center py-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 mb-1">No documents available</p>
                  <p className="text-gray-400 text-sm">The business owner has not uploaded any documents yet</p>
                </div>
              </div>
            )}
            
            {ndaProtectedDocuments.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-md font-medium text-gray-900">
                    NDA Protected Documents ({ndaProtectedDocuments.length})
                  </h4>
                </div>
                
                {ndaSigned || isSeller ? (
                  // Show NDA-protected documents
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {ndaProtectedDocuments.map((doc, index) => (
                      <div key={doc.id || index} className={`flex items-center p-4 ${index !== ndaProtectedDocuments.length - 1 ? 'border-b border-gray-200' : ''}`}>
                        <div className="flex-shrink-0 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type || 'Document'}</p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            if (!doc.url) {
                              e.preventDefault();
                              alert('Document URL is not available');
                            }
                          }}
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show NDA sign prompt
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-700 mb-2">
                      These documents are only visible after signing a non-disclosure agreement.
                    </p>
                    <button
                      onClick={() => setShowNdaModal(true)}
                      className="text-sm font-medium text-yellow-700 hover:text-yellow-600 bg-yellow-200 hover:bg-yellow-300 px-3 py-1 rounded-md transition-colors"
                    >
                      Sign NDA to View
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Function to handle deletion request submission
  const handleDeleteRequest = async () => {
    if (!deleteReason.trim()) {
      // Require a reason for deletion
      return;
    }
    
    setIsSubmittingRequest(true);
    
    try {
      // Submit deletion request to the backend
      const { error } = await submitDeletionRequest(businessId, deleteReason);
      
      if (error) {
        throw error;
      }
      
      setDeleteRequestSuccess(true);
      
      // Auto-close the modal after success
      setTimeout(() => {
        setShowDeleteRequestModal(false);
        // Refresh the page or update UI to show pending deletion status
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting deletion request:', err);
      // Show error message in UI
      setError(err.message || 'Failed to submit deletion request. Please try again.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Business Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{business.title}</h1>
          {isSeller && (
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/businesses/${businessId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Business
              </Link>
              <button
                onClick={() => setShowDeleteRequestModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Request Deletion
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-500">Asking Price</p>
            <p className="text-2xl font-bold text-blue-600">SAR {(business.askingPrice || 0).toLocaleString()}</p>
          </div>
          
          {userRole === 'buyer' ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowContactModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                Contact Seller
              </button>
              
              {!ndaSigned && (
                <button
                  onClick={() => setShowNdaModal(true)}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Sign NDA
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href={`/dashboard/businesses/${businessId}/edit`}>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Edit Listing
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-2 overflow-x-auto">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabButton>
          <TabButton
            active={activeTab === 'photos'}
            onClick={() => setActiveTab('photos')}
          >
            Photos ({publicImages.length + (ndaSigned || isSeller ? ndaProtectedImages.length : 0)})
          </TabButton>
          <TabButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
          >
            Documents ({publicDocuments.length + (ndaSigned || isSeller ? ndaProtectedDocuments.length : 0)})
          </TabButton>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {renderTabContent()}
      </div>
      
      {/* NDA Modal */}
      {showNdaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Non-Disclosure Agreement</h3>
              <button onClick={() => setShowNdaModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p>{error}</p>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                By signing this Non-Disclosure Agreement (NDA), you agree to keep all confidential information about this business private. This includes financial data, operating procedures, and other sensitive information.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto text-sm text-gray-700 mb-4">
                <p className="mb-4">
                  <strong>NON-DISCLOSURE AGREEMENT</strong>
                </p>
                <p className="mb-4">
                  This Non-Disclosure Agreement (the "Agreement") is entered into between the seller of the business listed as "{business.title}" (the "Disclosing Party") and the user interested in this business (the "Receiving Party").
                </p>
                <p className="mb-4">
                  1. The Receiving Party agrees not to disclose any confidential information about the business to any third party.
                </p>
                <p className="mb-4">
                  2. Confidential information includes, but is not limited to, financial data, business operations, customer lists, and any other non-public information.
                </p>
                <p className="mb-4">
                  3. The Receiving Party agrees to use the confidential information solely for the purpose of evaluating a potential purchase of the business.
                </p>
                <p className="mb-4">
                  4. This agreement shall remain in effect for a period of 2 years from the date of acceptance.
                </p>
                <p>
                  5. Any breach of this agreement may result in legal action.
                </p>
              </div>
              
              <div className="flex items-center mb-4">
                <input
                  id="agree-to-nda"
                  name="agree-to-nda"
                  type="checkbox"
                  checked={ndaAgreed}
                  onChange={(e) => setNdaAgreed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="agree-to-nda" className="ml-2 block text-sm text-gray-700">
                  I have read and agree to the terms of the Non-Disclosure Agreement
                </label>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowNdaModal(false)}
                className="mr-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignNda}
                disabled={!ndaAgreed || isSigningNda}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                {isSigningNda ? 'Signing...' : 'Sign Agreement'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Seller</h3>
              <button onClick={() => setShowContactModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              {messageError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p>{messageError}</p>
                </div>
              )}
              
              {messageSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  <p>Message sent successfully! The seller will be notified.</p>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                Send a message to the seller to express your interest or ask questions about this business.
              </p>
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSendingMessage || messageSuccess}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Hi, I'm interested in your business and would like to learn more about..."
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Note: By contacting the seller, you agree to communicate in a professional manner and respect the confidentiality of any information shared.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowContactModal(false)}
                className="mr-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {messageSuccess ? 'Close' : 'Cancel'}
              </button>
              
              {!messageSuccess && (
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSendingMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {isSendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Deletion Request Modal */}
      {showDeleteRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Business Deletion</h3>
              <button onClick={() => setShowDeleteRequestModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {deleteRequestSuccess ? (
              <div className="mb-6">
                <div className="rounded-md bg-green-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Your deletion request has been submitted successfully!
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  An administrator will review your request. You will be notified when a decision has been made.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <div className="rounded-md bg-yellow-50 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Requesting deletion will:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li>Mark your business as pending deletion</li>
                          <li>Require admin approval before final deletion</li>
                          <li>Cannot be undone once approved by admin</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Deletion (Required)
                  </label>
                  <textarea
                    id="deleteReason"
                    name="deleteReason"
                    rows={4}
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Please explain why you want to delete this business listing..."
                    required
                  />
                  {deleteReason.trim() === '' && (
                    <p className="mt-1 text-xs text-red-600">
                      Please provide a reason for deletion.
                    </p>
                  )}
                </div>
                
                <div className="flex items-center mb-4">
                  <input
                    id="confirm-delete"
                    name="confirm-delete"
                    type="checkbox"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="confirm-delete" className="ml-2 block text-sm text-gray-700">
                    I understand that this action requires admin approval and cannot be undone once approved.
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteRequestModal(false)}
                className="mr-3 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {deleteRequestSuccess ? 'Close' : 'Cancel'}
              </button>
              
              {!deleteRequestSuccess && (
                <button
                  onClick={handleDeleteRequest}
                  disabled={deleteReason.trim() === '' || isSubmittingRequest}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getDocumentIcon(mimeType: string) {
  const type = mimeType.toLowerCase();
  
  if (type.includes('pdf')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  } else if (type.includes('word') || type.includes('doc')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  } else if (type.includes('excel') || type.includes('sheet') || type.includes('csv')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  } else {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
} 