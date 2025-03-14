import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/server-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get business ID from route params - ensure it's awaited properly
    const businessId = params?.id;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: `Unauthorized - ${authResult.error || 'You must be logged in'}` },
        { status: 401 }
      );
    }
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log(`Fetching business with ID: ${businessId}`);
    
    // Query the database for the business
    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    
    if (error) {
      console.error('Error fetching business:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business' },
        { status: 500 }
      );
    }
    
    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the owner or if the business is approved
    const isOwner = business.user_id === authResult.user.id || business.owner_id === authResult.user.id;
    const isApproved = business.status === 'approved';
    const isAdmin = authResult.user.user_metadata?.role === 'admin';
    
    if (!isOwner && !isApproved && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this business' },
        { status: 403 }
      );
    }
    
    // If we have owner data, fetch it
    let ownerData = null;
    if (business.user_id || business.owner_id) {
      try {
        const ownerId = business.user_id || business.owner_id;
        // First try to get from profiles table
        let { data: owner, error: ownerError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('id', ownerId)
          .single();
          
        if (ownerError || !owner) {
          // Fallback to auth.users
          const { data: authUser, error: authError } = await supabase
            .from('auth.users')
            .select('id, email, user_metadata')
            .eq('id', ownerId)
            .single();
            
          if (!authError && authUser) {
            owner = {
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email,
              avatar_url: authUser.user_metadata?.avatar_url
            };
          }
        }
        
        if (owner) {
          ownerData = owner;
        }
      } catch (ownerError) {
        console.error('Error fetching owner data:', ownerError);
      }
    }
    
    // Add owner data to the business
    const businessWithOwner = {
      ...business,
      owner: ownerData,
      // Add defaults for numeric fields
      asking_price: business.asking_price || 0,
      revenue: business.revenue || 0,
      profit: business.profit || 0,
      established_year: business.established_year || new Date().getFullYear(),
      employees: business.employees || 0,
    };
    
    // Get business images if any
    try {
      console.log(`Attempting to fetch documents for business ID: ${businessId}`);
      
      // First, check if buckets exist
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error('Error fetching storage buckets:', bucketsError);
      } else {
        console.log('Available buckets:', buckets.map(bucket => bucket.name));
        
        // Check for images in businesses bucket
        const businessesBucketExists = buckets.some(bucket => bucket.name === 'businesses');
        const businessFilesBucketExists = buckets.some(bucket => bucket.name === 'business-files');
        
        if (businessesBucketExists) {
          const { data: images, error: imagesError } = await supabase
            .storage
            .from('businesses')
            .list(businessId);
            
          if (imagesError) {
            console.error(`Error fetching images for business ${businessId}:`, imagesError);
          } else if (images && images.length > 0) {
            console.log(`Found ${images.length} images for business ID ${businessId} in businesses bucket`);
            
            // Filter out document folder if it exists
            const imageFiles = images.filter(img => img.name !== 'documents');
            
            if (imageFiles.length > 0) {
              const formattedImages = imageFiles.map(img => ({
                id: img.id,
                name: img.name,
                url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/businesses/${businessId}/${img.name}`,
                isPublic: true,
                type: img.metadata?.mimetype || 'image/jpeg'
              }));
              
              businessWithOwner.images = formattedImages;
            } else {
              businessWithOwner.images = [];
            }
          } else {
            console.log(`No images found for business ID ${businessId} in businesses bucket`);
            businessWithOwner.images = [];
          }
        }
        
        // Check for images in business-files bucket as well
        if (businessFilesBucketExists && (!businessWithOwner.images || businessWithOwner.images.length === 0)) {
          // Try the nested path first
          const { data: businessFilesImages, error: businessFilesImagesError } = await supabase
            .storage
            .from('business-files')
            .list(`businesses/${businessId}`);
            
          if (businessFilesImagesError) {
            console.error(`Error fetching images from business-files/businesses/${businessId}:`, businessFilesImagesError);
          } else if (businessFilesImages && businessFilesImages.length > 0) {
            console.log(`Found ${businessFilesImages.length} images in business-files/businesses/${businessId}`);
            
            const formattedImages = businessFilesImages.map(img => ({
              id: img.id,
              name: img.name,
              url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/business-files/businesses/${businessId}/${img.name}`,
              isPublic: true,
              type: img.metadata?.mimetype || 'image/jpeg'
            }));
            
            businessWithOwner.images = formattedImages;
          } else {
            // Try direct path
            const { data: directFilesImages, error: directFilesImagesError } = await supabase
              .storage
              .from('business-files')
              .list(businessId);
              
            if (directFilesImagesError) {
              console.error(`Error fetching images from business-files/${businessId}:`, directFilesImagesError);
            } else if (directFilesImages && directFilesImages.length > 0) {
              console.log(`Found ${directFilesImages.length} images in business-files/${businessId}`);
              
              // Filter out document folder if it exists
              const imageFiles = directFilesImages.filter(img => img.name !== 'documents');
              
              if (imageFiles.length > 0) {
                const formattedImages = imageFiles.map(img => ({
                  id: img.id,
                  name: img.name,
                  url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/business-files/${businessId}/${img.name}`,
                  isPublic: true,
                  type: img.metadata?.mimetype || 'image/jpeg'
                }));
                
                businessWithOwner.images = formattedImages;
              } else {
                businessWithOwner.images = [];
              }
            } else {
              businessWithOwner.images = [];
            }
          }
        }
        
        // See if 'documents' bucket exists
        const documentsBucketExists = buckets.some(bucket => bucket.name === 'documents');
        
        if (documentsBucketExists) {
          const { data: documents, error: documentsError } = await supabase
            .storage
            .from('documents')
            .list(`${businessId}`);
            
          if (documentsError) {
            console.error(`Error fetching documents for business ${businessId}:`, documentsError);
            businessWithOwner.documents = [];
          } else if (documents && documents.length > 0) {
            console.log(`Found ${documents.length} documents for business ID ${businessId}`);
            const formattedDocuments = documents.map(doc => ({
              id: doc.id,
              name: doc.name,
              url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${businessId}/${doc.name}`,
              isPublic: true,
              type: doc.metadata?.mimetype || 'application/pdf'
            }));
            
            businessWithOwner.documents = formattedDocuments;
          } else {
            console.log(`No documents found for business ID ${businessId} in 'documents' bucket`);
            
            // Try to find documents in 'businesses' bucket as a fallback
            try {
              const { data: businessDocs, error: businessDocsError } = await supabase
                .storage
                .from('businesses')
                .list(`${businessId}/documents`);
                
              if (!businessDocsError && businessDocs && businessDocs.length > 0) {
                console.log(`Found ${businessDocs.length} documents in 'businesses/${businessId}/documents'`);
                const formattedBusinessDocs = businessDocs.map(doc => ({
                  id: doc.id,
                  name: doc.name,
                  url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/businesses/${businessId}/documents/${doc.name}`,
                  isPublic: true,
                  type: doc.metadata?.mimetype || 'application/pdf'
                }));
                
                businessWithOwner.documents = formattedBusinessDocs;
              } else {
                businessWithOwner.documents = [];
              }
            } catch (nestedError) {
              console.error('Error fetching documents from businesses bucket:', nestedError);
              businessWithOwner.documents = [];
            }
          }
        } else {
          console.log('Documents bucket does not exist, trying businesses bucket');
          
          // Try to find documents in 'businesses' bucket
          try {
            const { data: businessDocs, error: businessDocsError } = await supabase
              .storage
              .from('businesses')
              .list(`${businessId}/documents`);
              
            if (!businessDocsError && businessDocs && businessDocs.length > 0) {
              console.log(`Found ${businessDocs.length} documents in 'businesses/${businessId}/documents'`);
              const formattedBusinessDocs = businessDocs.map(doc => ({
                id: doc.id,
                name: doc.name,
                url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/businesses/${businessId}/documents/${doc.name}`,
                isPublic: true,
                type: doc.metadata?.mimetype || 'application/pdf'
              }));
              
              businessWithOwner.documents = formattedBusinessDocs;
            } else {
              businessWithOwner.documents = [];
            }
          } catch (nestedError) {
            console.error('Error fetching documents from businesses bucket:', nestedError);
            businessWithOwner.documents = [];
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching business documents:', error);
      // Continue without documents rather than failing the request
      businessWithOwner.documents = [];
    }
    
    return NextResponse.json(businessWithOwner);
  } catch (error) {
    console.error('Unexpected error fetching business:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 