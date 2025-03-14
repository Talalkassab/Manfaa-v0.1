# File Management System - Comprehensive Testing Guide

This document provides a structured approach to testing the file management system to ensure all components are working correctly.

## Prerequisites

Before starting the tests, ensure:

1. You have admin access to run the database migration
2. The Next.js server is running locally
3. You have a test Supabase project configured correctly

## 1. Database Setup Testing

### Run Database Migration

1. Log in as an admin user
2. Navigate to `/admin/migrations`
3. Click "Run Migration" for the Business Files table
4. Verify you see a success message
5. Check Supabase to confirm the business_files table was created
6. Verify the storage buckets 'businesses' and 'business-files' exist

**Expected Result:** Migration completes successfully, table and storage buckets are created

## 2. File Manager Access Testing

### Access File Manager

1. Log in as a business owner
2. Create a new business or navigate to an existing business
3. Go to the edit page for the business
4. Click on the "File Manager" tab

**Expected Result:** File Manager interface loads with empty state or existing files

## 3. File Upload Testing

### Basic Upload

1. In the File Manager, click "Upload Files"
2. Select 2-3 image files
3. Add a description
4. Keep default category "Images" and visibility "Public"
5. Click "Upload Files"

**Expected Result:** Files upload successfully, progress bar updates, files appear in the list after upload

### Different Categories

1. Click "Upload Files" again
2. Select a PDF file
3. Change category to "Financial"
4. Add a description
5. Click "Upload Files"

**Expected Result:** File uploads successfully and appears under the "Financial" category

### Different Visibility Levels

1. Click "Upload Files" again
2. Select any file
3. Change visibility to "NDA"
4. Add a description
5. Click "Upload Files"

**Expected Result:** File uploads with NDA visibility setting

### Error Handling

1. Try uploading a very large file (>10MB)

**Expected Result:** Error message appears, upload fails gracefully

## 4. File Management Testing

### File Categorization

1. Click on different category tabs (All, Images, Financial, Legal, Other)

**Expected Result:** List filters correctly to show only files in the selected category

### File Metadata Editing

1. Find a file and click the edit (pencil) icon
2. Change the description
3. Change the visibility level
4. Change the category
5. Save changes

**Expected Result:** Changes are saved and reflected in the file list

### File Deletion

1. Find a file and click the delete (trash) icon
2. Confirm deletion in the dialog

**Expected Result:** File is removed from the list and deleted from storage

## 5. Business Details Page Testing

### Public File Visibility

1. Log out
2. Browse to the business details page
3. Check the photos tab

**Expected Result:** Only public files are visible

### NDA Protected Files

1. Log in as a buyer
2. Browse to a business with NDA-protected files
3. Sign an NDA for the business
4. Verify NDA-protected files become visible

**Expected Result:** After signing NDA, previously hidden files become visible

### Private Files

1. Log in as a business owner
2. Create files with "Private" visibility
3. Log in as a different user
4. View the business

**Expected Result:** Private files are not visible to other users

## 6. Edge Case Testing

### Empty States

1. Create a new business with no files
2. Check the File Manager and business details page

**Expected Result:** Empty state messages are displayed correctly

### Concurrent Uploads

1. Try uploading multiple files simultaneously
2. Check if all uploads complete correctly

**Expected Result:** All uploads succeed without conflicts

### File Type Handling

1. Upload various file types (.jpg, .png, .pdf, .doc, .xls, etc.)
2. Verify correct icons and previews are shown

**Expected Result:** Different file types are displayed with appropriate icons and previews

## 7. Performance Testing

### Large Number of Files

1. Upload 20+ files to a single business
2. Test the performance of the file manager

**Expected Result:** File manager loads and operates efficiently even with many files

## 8. Regression Testing

After completing all tests above, perform a quick regression test:

1. Create a new business with files
2. Edit the business details
3. Check that file management hasn't affected other functionality

**Expected Result:** All other business functionality works correctly alongside file management

## Test Reporting

For any issues found, please document:

1. Test case that failed
2. Expected vs. actual behavior
3. Steps to reproduce
4. Browser and environment details
5. Screenshots or console errors if applicable

## Conclusion

This testing guide covers all aspects of the file management system. After completing these tests, the file management functionality should be thoroughly validated and ready for production use.