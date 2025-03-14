'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FileManagerProps {
  businessId: string;
}

type FileCategory = 'images' | 'financial' | 'legal' | 'other';
type FileVisibility = 'public' | 'nda' | 'private';

interface BusinessFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  category: FileCategory;
  visibility: FileVisibility;
  uploadedAt: string;
  description?: string;
}

export default function FileManager({ businessId }: FileManagerProps) {
  const [files, setFiles] = useState<BusinessFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | 'all'>('all');
  const [selectedFile, setSelectedFile] = useState<BusinessFile | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [newDescription, setNewDescription] = useState('');
  const [newVisibility, setNewVisibility] = useState<FileVisibility>('public');
  const [newCategory, setNewCategory] = useState<FileCategory>('images');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadVisibility, setUploadVisibility] = useState<FileVisibility>('public');
  const [uploadCategory, setUploadCategory] = useState<FileCategory>('images');
  const [uploadDescription, setUploadDescription] = useState('');
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    fetchFiles();
  }, [businessId]);
  
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get from business_files table
      const { data: dbFiles, error: dbError } = await supabase
        .from('business_files')
        .select('*')
        .eq('business_id', businessId);
        
      if (dbError) {
        console.warn('Error fetching from database, will try storage directly:', dbError);
      }
      
      // Then get files from storage in both buckets
      const files: BusinessFile[] = [];
      
      // Try primary bucket (businesses)
      const { data: primaryFiles, error: primaryError } = await supabase
        .storage
        .from('businesses')
        .list(businessId);
        
      if (primaryError) {
        console.warn('Error fetching from primary bucket:', primaryError);
      } else if (primaryFiles) {
        // Add files to the list, matching with DB records if possible
        primaryFiles.forEach(file => {
          const matchingDbFile = dbFiles?.find(dbFile => 
            dbFile.file_name === file.name && 
            dbFile.file_path.includes(`${businessId}/${file.name}`)
          );
          
          if (file.name !== 'documents') { // Skip the documents folder
            files.push({
              id: matchingDbFile?.id || file.id,
              name: file.name,
              url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/businesses/${businessId}/${file.name}`,
              type: file.metadata?.mimetype || 'application/octet-stream',
              size: file.metadata?.size || 0,
              category: (matchingDbFile?.category as FileCategory) || guessCategory(file.name, file.metadata?.mimetype),
              visibility: (matchingDbFile?.visibility as FileVisibility) || 'public',
              uploadedAt: matchingDbFile?.created_at || file.created_at || new Date().toISOString(),
              description: matchingDbFile?.description || ''
            });
          }
        });
      }
      
      // Try backup bucket (business-files)
      const { data: backupFiles, error: backupError } = await supabase
        .storage
        .from('business-files')
        .list(`businesses/${businessId}`);
        
      if (backupError) {
        console.warn('Error fetching from backup bucket:', backupError);
      } else if (backupFiles) {
        // Add files to the list, matching with DB records if possible
        backupFiles.forEach(file => {
          const matchingDbFile = dbFiles?.find(dbFile => 
            dbFile.file_name === file.name && 
            dbFile.file_path.includes(`${businessId}/${file.name}`)
          );
          
          files.push({
            id: matchingDbFile?.id || file.id,
            name: file.name,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/business-files/businesses/${businessId}/${file.name}`,
            type: file.metadata?.mimetype || 'application/octet-stream',
            size: file.metadata?.size || 0,
            category: (matchingDbFile?.category as FileCategory) || guessCategory(file.name, file.metadata?.mimetype),
            visibility: (matchingDbFile?.visibility as FileVisibility) || 'public',
            uploadedAt: matchingDbFile?.created_at || file.created_at || new Date().toISOString(),
            description: matchingDbFile?.description || ''
          });
        });
      }
      
      // Check for document folders in both buckets
      const { data: primaryDocs, error: primaryDocsError } = await supabase
        .storage
        .from('businesses')
        .list(`${businessId}/documents`);
        
      if (!primaryDocsError && primaryDocs) {
        primaryDocs.forEach(file => {
          const matchingDbFile = dbFiles?.find(dbFile => 
            dbFile.file_name === file.name && 
            dbFile.file_path.includes(`${businessId}/documents/${file.name}`)
          );
          
          files.push({
            id: matchingDbFile?.id || file.id,
            name: file.name,
            url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/businesses/${businessId}/documents/${file.name}`,
            type: file.metadata?.mimetype || 'application/octet-stream',
            size: file.metadata?.size || 0,
            category: (matchingDbFile?.category as FileCategory) || guessCategory(file.name, file.metadata?.mimetype),
            visibility: (matchingDbFile?.visibility as FileVisibility) || 'public',
            uploadedAt: matchingDbFile?.created_at || file.created_at || new Date().toISOString(),
            description: matchingDbFile?.description || ''
          });
        });
      }
      
      setFiles(files);
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const guessCategory = (fileName: string, mimeType?: string): FileCategory => {
    const lowerFileName = fileName.toLowerCase();
    const extension = lowerFileName.split('.').pop();
    
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'images';
    } else if (['pdf', 'doc', 'docx'].includes(extension || '') && lowerFileName.includes('financ')) {
      return 'financial';
    } else if (['pdf', 'doc', 'docx'].includes(extension || '') && 
               (lowerFileName.includes('legal') || lowerFileName.includes('contract') || lowerFileName.includes('agreement'))) {
      return 'legal';
    } else {
      return 'other';
    }
  };
  
  const handleDeleteFile = async (file: BusinessFile) => {
    setSelectedFile(file);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedFile) return;
    
    try {
      // Try to delete from both storage locations
      let deletedFromStorage = false;
      
      if (selectedFile.url.includes('/businesses/')) {
        // File is in the 'businesses' bucket
        const path = selectedFile.url.split('/public/businesses/')[1];
        const { error } = await supabase.storage.from('businesses').remove([path]);
        deletedFromStorage = !error;
      } else if (selectedFile.url.includes('/business-files/')) {
        // File is in the 'business-files' bucket
        const path = selectedFile.url.split('/public/business-files/')[1];
        const { error } = await supabase.storage.from('business-files').remove([path]);
        deletedFromStorage = !error;
      }
      
      // Also delete the database record if it exists
      const { error: dbError } = await supabase
        .from('business_files')
        .delete()
        .eq('id', selectedFile.id);
        
      if (dbError) {
        console.warn('Error deleting file record from database:', dbError);
      }
      
      if (deletedFromStorage) {
        // Update the UI
        setFiles(files.filter(f => f.id !== selectedFile.id));
        setDeleteConfirmOpen(false);
        setSelectedFile(null);
      } else {
        setError('Failed to delete file. Please try again later.');
      }
    } catch (err: any) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file. Please try again later.');
    }
  };
  
  const handleEditDescription = (file: BusinessFile) => {
    setSelectedFile(file);
    setNewDescription(file.description || '');
    setNewVisibility(file.visibility);
    setNewCategory(file.category);
    setEditDescriptionOpen(true);
  };
  
  const saveFileChanges = async () => {
    if (!selectedFile) return;
    
    try {
      // Update the record in the database if it exists
      const { error: dbError } = await supabase
        .from('business_files')
        .update({
          description: newDescription,
          visibility: newVisibility,
          category: newCategory,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedFile.id);
        
      if (dbError) {
        // If the record doesn't exist, try to create it
        if (dbError.code === '42P01' || dbError.message?.includes('does not exist')) {
          // Table doesn't exist - create the table first
          console.warn('business_files table does not exist');
          setError('Unable to update file metadata. The database schema needs to be updated.');
        } else if (dbError.code === 'PGRST116') {
          // No rows updated - record might not exist yet
          const { error: insertError } = await supabase
            .from('business_files')
            .insert({
              id: selectedFile.id,
              business_id: businessId,
              file_path: selectedFile.url.split('/public/')[1],
              file_name: selectedFile.name,
              file_type: selectedFile.type,
              file_size: selectedFile.size,
              visibility: newVisibility,
              category: newCategory,
              description: newDescription,
              created_at: selectedFile.uploadedAt,
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('Error creating file record:', insertError);
            setError('Failed to update file metadata. Please try again later.');
            return;
          }
        } else {
          console.error('Error updating file record:', dbError);
          setError('Failed to update file metadata. Please try again later.');
          return;
        }
      }
      
      // Update the UI
      setFiles(files.map(f => {
        if (f.id === selectedFile.id) {
          return {
            ...f,
            description: newDescription,
            visibility: newVisibility,
            category: newCategory
          };
        }
        return f;
      }));
      
      setEditDescriptionOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error updating file metadata:', err);
      setError('Failed to update file metadata. Please try again later.');
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFiles(Array.from(e.target.files));
      setShowUploadModal(true);
    }
  };
  
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      
      // Upload each file
      const results = [];
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setUploadProgress(Math.round((i / uploadFiles.length) * 100));
        
        // Generate a unique filename
        const timestamp = Date.now();
        const originalName = file.name;
        const extension = originalName.split('.').pop() || '';
        const uniqueFileName = `${timestamp}-${originalName}`;
        
        // Choose the path based on category
        let path = '';
        if (uploadCategory === 'images') {
          path = `${businessId}/${uniqueFileName}`;
        } else {
          path = `${businessId}/documents/${uniqueFileName}`;
        }
        
        // Try to upload to primary bucket first
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('businesses')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.warn('Error uploading to primary bucket, trying backup bucket:', uploadError);
          
          // Try backup bucket
          const backupPath = `businesses/${path}`;
          const { data: backupData, error: backupError } = await supabase.storage
            .from('business-files')
            .upload(backupPath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (backupError) {
            throw new Error(`Failed to upload file ${file.name}: ${backupError.message}`);
          }
          
          // Success with backup bucket
          const { data: fileData } = await supabase.storage
            .from('business-files')
            .getPublicUrl(backupPath);
            
          // Create entry in business_files table
          const { error: dbError } = await supabase
            .from('business_files')
            .insert({
              business_id: businessId,
              file_path: backupPath,
              file_name: originalName,
              file_type: file.type,
              file_size: file.size,
              visibility: uploadVisibility,
              category: uploadCategory,
              description: uploadDescription,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (dbError && dbError.code !== '42P01') {
            console.warn('Error creating file record:', dbError);
          }
          
          results.push({
            name: originalName,
            url: fileData.publicUrl,
            type: file.type,
            size: file.size,
            category: uploadCategory,
            visibility: uploadVisibility,
            description: uploadDescription
          });
        } else {
          // Success with primary bucket
          const { data: fileData } = await supabase.storage
            .from('businesses')
            .getPublicUrl(path);
            
          // Create entry in business_files table
          const { error: dbError } = await supabase
            .from('business_files')
            .insert({
              business_id: businessId,
              file_path: path,
              file_name: originalName,
              file_type: file.type,
              file_size: file.size,
              visibility: uploadVisibility,
              category: uploadCategory,
              description: uploadDescription,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (dbError && dbError.code !== '42P01') {
            console.warn('Error creating file record:', dbError);
          }
          
          results.push({
            name: originalName,
            url: fileData.publicUrl,
            type: file.type,
            size: file.size,
            category: uploadCategory,
            visibility: uploadVisibility,
            description: uploadDescription
          });
        }
      }
      
      setUploadProgress(100);
      
      // Update the files state with new files
      await fetchFiles();
      
      // Reset upload state
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFiles([]);
        setUploadProgress(0);
        setIsUploading(false);
        setUploadDescription('');
      }, 500);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload files');
      setIsUploading(false);
    }
  };
  
  const cancelUpload = () => {
    setShowUploadModal(false);
    setUploadFiles([]);
    setUploadVisibility('public');
    setUploadCategory('images');
    setUploadDescription('');
    setUploadError(null);
  };
  
  const filteredFiles = selectedCategory === 'all' 
    ? files 
    : files.filter(file => file.category === selectedCategory);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">File Manager</h2>
        <div className="flex space-x-2">
          <label 
            htmlFor="file-upload"
            className="cursor-pointer px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Upload Files
            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <button 
            onClick={fetchFiles}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden rounded-md">
        <div className="flex border-b border-gray-200 bg-gray-50 p-4">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`mr-4 px-3 py-1 rounded-md ${selectedCategory === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All
          </button>
          <button 
            onClick={() => setSelectedCategory('images')}
            className={`mr-4 px-3 py-1 rounded-md ${selectedCategory === 'images' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Images
          </button>
          <button 
            onClick={() => setSelectedCategory('financial')}
            className={`mr-4 px-3 py-1 rounded-md ${selectedCategory === 'financial' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Financial
          </button>
          <button 
            onClick={() => setSelectedCategory('legal')}
            className={`mr-4 px-3 py-1 rounded-md ${selectedCategory === 'legal' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Legal
          </button>
          <button 
            onClick={() => setSelectedCategory('other')}
            className={`px-3 py-1 rounded-md ${selectedCategory === 'other' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Other
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No files found in this category
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredFiles.map(file => (
              <li key={file.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} className="h-10 w-10 object-cover rounded-md" />
                      ) : file.type.includes('pdf') ? (
                        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : file.type.includes('word') || file.type.includes('doc') ? (
                        <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="ml-4 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <div className="flex items-center text-xs text-gray-500 space-x-1">
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={`px-1.5 rounded ${getVisibilityBadgeColor(file.visibility)}`}>
                          {file.visibility}
                        </span>
                        <span>•</span>
                        <span>{file.category}</span>
                      </div>
                      {file.description && (
                        <p className="mt-1 text-xs text-gray-600 truncate max-w-md">{file.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Download"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button 
                      onClick={() => handleEditDescription(file)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                      title="Edit"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteFile(file)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete File</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-medium">{selectedFile.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Description Modal */}
      {editDescriptionOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit File Metadata</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Add a description for this file..."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={newVisibility === 'public'}
                    onChange={() => setNewVisibility('public')}
                  />
                  <span className="ml-2 text-gray-700">Public</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={newVisibility === 'nda'}
                    onChange={() => setNewVisibility('nda')}
                  />
                  <span className="ml-2 text-gray-700">NDA</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={newVisibility === 'private'}
                    onChange={() => setNewVisibility('private')}
                  />
                  <span className="ml-2 text-gray-700">Private</span>
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as FileCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="images">Images</option>
                <option value="financial">Financial</option>
                <option value="legal">Legal</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditDescriptionOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveFileChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Files</h3>
            
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p className="text-sm">{uploadError}</p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Selected files: {uploadFiles.length}
              </p>
              <ul className="text-xs text-gray-500 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                {uploadFiles.map((file, i) => (
                  <li key={i} className="mb-1">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">File Description</label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Add a description for these files..."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as FileCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="images">Images</option>
                <option value="financial">Financial</option>
                <option value="legal">Legal</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={uploadVisibility === 'public'}
                    onChange={() => setUploadVisibility('public')}
                  />
                  <span className="ml-2 text-gray-700">Public</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={uploadVisibility === 'nda'}
                    onChange={() => setUploadVisibility('nda')}
                  />
                  <span className="ml-2 text-gray-700">NDA</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-blue-600"
                    checked={uploadVisibility === 'private'}
                    onChange={() => setUploadVisibility('private')}
                  />
                  <span className="ml-2 text-gray-700">Private</span>
                </label>
              </div>
            </div>
            
            {isUploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}%</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelUpload}
                disabled={isUploading}
                className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || uploadFiles.length === 0}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                  isUploading || uploadFiles.length === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-700'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getVisibilityBadgeColor(visibility: FileVisibility) {
  switch (visibility) {
    case 'public':
      return 'bg-green-100 text-green-800';
    case 'nda':
      return 'bg-blue-100 text-blue-800';
    case 'private':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 