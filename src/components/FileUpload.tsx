'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';

type VisibilityType = 'public' | 'nda' | 'private';

interface FileWithPreview extends File {
  id: string;
  preview: string;
  visibility: VisibilityType;
  description: string;
}

interface FileUploadProps {
  onFilesChange: (files: FileWithPreview[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  value?: FileWithPreview[];
}

export default function FileUpload({
  onFilesChange,
  maxFiles = 10,
  maxSize = 5, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  value = []
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>(value);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const isImage = file.type?.startsWith('image/') || false;
      return {
        ...file,
        id: uuidv4(),
        preview: isImage ? URL.createObjectURL(file) : '',
        visibility: 'public' as VisibilityType,
        description: '',
      };
    });
    
    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  }, [files, maxFiles, onFilesChange]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    maxFiles: maxFiles - files.length,
  });
  
  const removeFile = (id: string) => {
    const updatedFiles = files.filter(file => file.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };
  
  const updateFileVisibility = (id: string, visibility: VisibilityType) => {
    const updatedFiles = files.map(file => 
      file.id === id ? { ...file, visibility } : file
    );
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };
  
  const updateFileDescription = (id: string, description: string) => {
    const updatedFiles = files.map(file => 
      file.id === id ? { ...file, description } : file
    );
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };
  
  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: {acceptedTypes.join(', ')} (Max: {maxSize}MB)
        </p>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Uploaded Files ({files.length}/{maxFiles})</h3>
          
          {files.map(file => (
            <div key={file.id} className="flex flex-col sm:flex-row sm:items-center border rounded-lg p-3 gap-3">
              {/* File preview/icon */}
              <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                {file.preview ? (
                  <img src={file.preview} alt={file.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    {file.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </div>
                )}
              </div>
              
              {/* File info */}
              <div className="flex-grow min-w-0">
                <div className="text-sm font-medium truncate">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
                
                {/* Description input */}
                <input
                  type="text"
                  placeholder="Add description (optional)"
                  className="mt-1 w-full text-sm p-1 border rounded"
                  value={file.description}
                  onChange={(e) => updateFileDescription(file.id, e.target.value)}
                />
              </div>
              
              {/* Privacy controls */}
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button 
                  type="button"
                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1
                    ${file.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => updateFileVisibility(file.id, 'public')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Public
                </button>
                <button 
                  type="button"
                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1
                    ${file.visibility === 'nda' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => updateFileVisibility(file.id, 'nda')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  NDA
                </button>
                <button 
                  type="button"
                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1
                    ${file.visibility === 'private' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => updateFileVisibility(file.id, 'private')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private
                </button>
                
                {/* Remove button */}
                <button 
                  type="button" 
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 p-1 hover:bg-red-50 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 