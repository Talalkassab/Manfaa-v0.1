# Manfaa V0.1 - Project Health Check

*Project status documentation and technical overview - Last updated: March 2024*

## Table of Contents
1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Technical Stack](#technical-stack)
4. [Database Structure](#database-structure)
5. [Authentication System](#authentication-system)
6. [Workflow & Development Process](#workflow--development-process)
7. [Current Issues & Challenges](#current-issues--challenges)
8. [Recent Fixes & Solutions](#recent-fixes--solutions)
9. [Deployment Process](#deployment-process)
10. [Performance Considerations](#performance-considerations)
11. [Future Improvements](#future-improvements)

## Project Overview

Manfaa is a comprehensive business marketplace targeting the Saudi Arabian market. The platform allows business owners to list their businesses for sale with customizable privacy controls, enables potential buyers to discover businesses and access information after signing NDAs, facilitates direct communication between parties, and provides robust administrative controls for moderation and oversight.

### Key Features:
- **Business Listings**: Create, edit, and manage business listings with multiple privacy levels
- **NDA Management**: Request, sign, and manage NDAs to access protected content
- **Messaging System**: Direct communication between buyers and sellers
- **File Management**: Upload and manage business-related files with privacy controls
- **Administrative Controls**: Admin dashboard for user management and business approvals
- **Database Migration System**: Admin tools for managing database schema changes
- **Multilingual Support**: Full Arabic and English language support with RTL layout for Arabic

## Project Structure

The project follows Next.js 14+ App Router architecture:

```
manfaa/
├── .env.local                   # Environment variables (local development)
├── .env.development             # Development-specific variables
├── .env.production              # Production-specific variables
├── middleware.ts                # Next.js middleware for auth protection
├── CHANGELOG.md                 # Detailed change history
├── src/
│   ├── app/                     # Next.js App Router components
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Homepage component
│   │   ├── api/                 # API routes
│   │   │   ├── businesses/      # Business-related endpoints
│   │   │   ├── storage/         # File storage access endpoints
│   │   │   ├── messages/        # Messaging endpoints
│   │   │   ├── ndas/            # NDA management endpoints
│   │   │   └── migrations/      # Database migration endpoints (NEW)
│   │   ├── auth/                # Authentication pages
│   │   ├── dashboard/           # User dashboard
│   │   ├── admin/               # Admin dashboard
│   │   └── globals.css          # Global styles
│   ├── components/              # Reusable UI components
│   │   └── FileUpload.tsx       # File upload component with privacy controls
│   └── lib/                     # Utility functions
│       ├── auth.ts              # Authentication utilities (UPDATED)
│       ├── server-auth.ts       # Server-side authentication helpers (UPDATED)
│       ├── database.ts          # Database operations
│       ├── database-schema.ts   # Schema mapping between frontend and database (UPDATED)
│       └── api-middleware.ts    # API middleware for common operations (NEW)
└── supabase/                    # Supabase configuration
    ├── schema.sql               # Database schema
    ├── migrations/              # Migration files
    └── rls.sql                  # Row Level Security policies
```

Key Directories and Files:
- `/src/app/api` - Serverless API routes handling data operations
- `/src/app/dashboard` - User dashboard for managing businesses and messages
- `/src/app/admin` - Admin dashboard for platform oversight
- `/src/lib/database-schema.ts` - Central schema mapping system for field transformations
- `/src/lib/api-middleware.ts` - Standardized API middleware for error handling and authentication
- `/supabase/migrations` - Database migrations for schema changes

## Technical Stack

- **Frontend**:
  - Next.js 14+
  - TypeScript
  - TailwindCSS
  - Shadcn UI
  - React Hooks for state management

- **Backend**:
  - Next.js API routes (serverless)
  - Supabase Client SDK
  - Standardized API middleware system

- **Database**:
  - PostgreSQL via Supabase
  - Row Level Security (RLS) for granular data access control
  - Schema mapping system for field transformations

- **Authentication**:
  - Supabase Auth with JWT-based cookies
  - Enhanced cookie parsing for base64-encoded tokens
  - Automatic token refresh handling
  - Role-based access control

- **Storage**:
  - Supabase Storage with bucket policies
  - Multi-bucket strategies for file organization
  - File access API with permission controls and CORS support

- **Deployment**:
  - Vercel (recommended)

## Database Structure

### Primary Tables

1. **users** (auth.users + profiles)
   - `id` - Primary key, linked to auth.users
   - `email` - User email
   - `full_name` - User's full name
   - `user_type` - Buyer, seller, or admin
   - `avatar_url` - Profile image URL
   - `created_at` - Account creation timestamp
   - `metadata` - JSON field for additional user data

2. **businesses**
   - `id` - Primary key (UUID)
   - `user_id` - Foreign key to users table (primary owner reference)
   - `owner_id` - Alternative foreign key to users table (for backward compatibility)
   - `name` - Business name (mapped to 'title' in frontend)
   - `description` - Business description
   - `category` - Business category
   - `address` - Business location (mapped to 'location' in frontend)
   - `asking_price` - Requested selling price
   - `annual_revenue` - Annual revenue figure
   - `profit` - Annual profit (correct mapping implemented)
   - `inventory_value` - Value of business inventory
   - `asset_value` - Value of business assets
   - `established_year` - Year business was established
   - `employees` - Number of employees
   - `reason_for_selling` - Reason for selling the business
   - `privacy_level` - Privacy level setting (public, limited, private)
   - `status` - Approval status (pending, approved, rejected)
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp

3. **business_files**
   - `id` - Primary key (UUID)
   - `business_id` - Foreign key to businesses table
   - `file_path` - Path in storage bucket
   - `file_name` - Original file name
   - `file_type` - MIME type
   - `file_size` - File size in bytes
   - `visibility` - Privacy level (public, nda, private)
   - `category` - File category (image, document, financial)
   - `description` - Optional file description
   - `uploaded_by` - Foreign key to users table
   - `created_at` - Upload timestamp
   - `updated_at` - Last modification timestamp

4. **ndas**
   - `id` - Primary key (UUID)
   - `business_id` - Foreign key to businesses table
   - `user_id` - Foreign key to users table
   - `status` - NDA status (pending, approved, rejected)
   - `message` - Optional message with the NDA request
   - `signed_at` - Signing timestamp
   - `created_at` - Creation timestamp
   - `updated_at` - Last update timestamp

5. **messages**
   - `id` - Primary key (UUID)
   - `sender_id` - Foreign key to users table (sender)
   - `recipient_id` - Foreign key to users table (recipient)
   - `business_id` - Optional reference to businesses
   - `content` - Message content
   - `read` - Boolean indicating if message has been read
   - `created_at` - Sending timestamp

### Row Level Security (RLS)

The database uses Supabase Row Level Security for fine-grained access control:

- Users can only view their own profiles
- Buyers can only see approved business listings or those they own
- Sellers can only manage their own businesses
- Files have visibility controls based on NDA status and privacy level
- Messages are only visible to senders and recipients
- Admins have elevated access to all records

## Authentication System

The authentication system is built with Supabase Auth with recent enhancements:

1. **Registration Flow**:
   - Email/password registration
   - User type selection (buyer/seller)
   - Profile data collection
   - Verification email

2. **Login Process**:
   - Email/password authentication
   - JWT token generation with PKCE flow for better security
   - Enhanced cookie storage with domain-specific settings
   - Automatic session refresh with token expiration detection

3. **Enhanced Cookie Handling**:
   - Robust parsing of Supabase's base64-encoded cookies
   - Multiple fallback mechanisms for different cookie formats
   - Support for various cookie naming patterns
   - Better error handling for invalid token formats

4. **Authorization**:
   - Role-based access via JWT claims
   - Middleware protection for authenticated routes
   - Component-level access control
   - Automatic token refresh when approaching expiration

## Workflow & Development Process

### Feature Development Workflow

1. **Planning & Design**:
   - Requirements gathering
   - Schema planning
   - Component design
   - API endpoint planning

2. **Implementation Process**:
   - Database schema changes and migrations
   - API endpoint implementation
   - Frontend component development
   - Schema mapping updates

3. **Enhanced Schema Mapping System**:
   - Typed interface for better TypeScript support
   - Comprehensive field mappings between frontend and database
   - Robust transformation functions with proper handling of:
     - Numeric values (parsing currency symbols, handling null values)
     - Date fields
     - String fields
   - Advanced error handling with helpful suggestions

4. **Standardized API Structure**:
   - Reusable middleware for common operations
   - Consistent error handling across endpoints
   - Standard response formats
   - Automatic CORS handling

5. **Testing & Validation**:
   - API endpoint testing
   - UI component validation
   - Error scenario testing
   - Schema validation testing

6. **Documentation**:
   - CHANGELOG updates
   - Projectcheck.md updates
   - Code comments for complex logic
   - Schema documentation

### Current Development Areas

1. **File Management System** - Complete
   - Multi-bucket file storage with privacy controls
   - Enhanced permission controls based on visibility settings
   - Improved file categorization and metadata management
   - Direct file access with CORS support

2. **Database Migration System** - Complete
   - Admin interface for running migrations
   - SQL script display and execution
   - Comprehensive table creation scripts
   - RLS policy management

3. **Business Management** - Complete
   - Full CRUD operations for business listings
   - Multi-step forms with validation
   - Enhanced field mapping between frontend and database
   - Proper error handling for schema mismatches

## Current Issues & Challenges

### Resolved Issues

1. **Schema Mismatches**:
   - ✅ Fixed inconsistencies between frontend field names and database column names
   - ✅ Implemented robust schema mapping system with type support
   - ✅ Corrected field mappings:
     - 'title' → 'name'
     - 'location' → 'address'
     - 'profit' → 'profit'
     - 'owner_id' → 'owner_id'
   - ✅ Added validation and error handling for schema-related database errors
   - ✅ Fixed schema cache errors related to missing field mappings
   - ✅ Enhanced error messaging for schema-related issues

2. **Authentication Cookie Handling**:
   - ✅ Enhanced cookie parsing with fallbacks for various Supabase cookie formats
   - ✅ Fixed session persistence across page refreshes
   - ✅ Implemented token refresh handling
   - ✅ Improved error handling for invalid tokens

3. **Storage Access Issues**:
   - ✅ Added CORS support for cross-origin file access
   - ✅ Implemented comprehensive permission checking for file access
   - ✅ Created multi-bucket storage strategy with fallbacks
   - ✅ Added proper content type detection for file downloads

4. **API Route Structure**:
   - ✅ Standardized API route implementation with reusable middleware
   - ✅ Fixed inconsistent response formats across endpoints
   - ✅ Improved error handling with detailed messages
   - ✅ Added comprehensive logging for debugging

5. **Database Structure Inconsistencies**:
   - ✅ Created comprehensive database migration system
   - ✅ Fixed table structure inconsistencies across environments
   - ✅ Added proper indexes for common query patterns
   - ✅ Implemented RLS policies for data security

6. **Localization and RTL Support**:
   - ✅ Implemented comprehensive translation system with English and Arabic support
   - ✅ Added RTL (Right-to-Left) styling for Arabic language
   - ✅ Created specialized components for proper RTL layout handling
   - ✅ Implemented language persistence and automatic detection
   - ✅ Added proper handling of numbers and dates in RTL context

7. **Business Creation Issues**:
   - ✅ Fixed "owner_id" schema cache error during business creation
   - ✅ Enhanced error handling in business creation workflow
   - ✅ Improved error reporting for database schema mismatches
   - ✅ Fixed port conflict issues with development server

### Remaining Issues

1. **NextJS Issues**:
   - Webpack caching errors with `.next/cache`
   - Port conflicts with development server (partially resolved)
   - Webpack devtool warning in development mode

2. **Database Query Optimization**:
   - Some query patterns could benefit from additional indexes
   - Potential for optimizing complex joins
   - Consider adding query caching for frequent operations

3. **Frontend Component Structure**:
   - Opportunity to refactor larger components
   - Standardize state management patterns

## Recent Fixes & Solutions

### 1. Enhanced Database Schema Mapping System

**Problem**: Inconsistent field naming between frontend and database caused errors and data mismatches.

**Solution**:
- Significantly improved the schema mapping system in `src/lib/database-schema.ts`:
  - Created typed interface `SchemaMapping` for better TypeScript support
  - Implemented comprehensive field mappings for all tables:
    - `BUSINESS_SCHEMA` - Business listings
    - `BUSINESS_FILES_SCHEMA` - Business files
    - `NDA_SCHEMA` - NDA agreements
  - Enhanced transformation functions:
    - Improved handling of numeric fields with proper parsing of currency symbols
    - Added better null value handling for empty form fields
    - Fixed transformation of date fields between frontend and database
  - Added helper functions:
    - `isColumnNotFoundError()` - Detects schema-related errors
    - `handleColumnNotFoundError()` - Suggests correct field mappings
    - `getDbColumnName()` / `getFormFieldName()` - Utility functions for schema mapping
    - `safeTransform()` - Safe data transformation with error handling

**Benefits**:
- Consistent data handling across the application
- Clear error messages with helpful suggestions
- Reduced bugs related to field mismatches
- Better TypeScript support for form validation

### 2. Fixed Business Creation Schema Cache Error

**Problem**: Users encountered a "Could not find the 'owner_id' column of 'businesses' in the schema cache" error when trying to create a business listing.

**Solution**:
- Added missing `owner_id` field to `BUSINESS_SCHEMA.fields` in `src/lib/database-schema.ts`
- Enhanced error handling in the `createBusiness` function with proper JSON stringification
- Improved handling of owner_id assignment with schema validation:
  ```typescript
  // Set the owner_id from the authenticated user - check if it's in the schema
  if (BUSINESS_SCHEMA.fields.owner_id) {
    mappedData.owner_id = userData.user.id;
  } else {
    console.warn('Warning: owner_id field is not defined in the schema but is required by the database');
    mappedData.owner_id = userData.user.id; // Set it anyway as it's required
  }
  ```
- Enhanced error object creation with better details for debugging
- Improved error display in the business creation form with detailed diagnostic information
- Added systematic checks for schema column mismatches with helpful error messages

**Benefits**:
- Fixed critical business creation workflow
- Improved developer and user experience with better error messages
- Enhanced schema validation for field mappings
- Better diagnostic information for troubleshooting
- More robust handling of schema cache errors

### 3. Fixed Next.js Development Server Port Conflicts

**Problem**: Development server would fail to start with "Error: listen EADDRINUSE: address already in use" error.

**Solution**:
- Implemented port conflict resolution by:
  - Detecting and killing conflicting processes using the same port
  - Using alternative ports (3002, 3003) when primary port is unavailable
  - Added better error handling in server startup process

**Benefits**:
- More reliable development workflow
- Reduced time lost to server restart issues
- Clear error messages for port conflicts

### 4. Improved Authentication System

**Problem**: Authentication issues with cookie parsing, token refresh, and session persistence.

**Solution**:
- Enhanced client-side authentication in `src/lib/auth.ts`:
  - Improved cookie parsing with better handling of base64-encoded tokens
  - Added `getAllSupabaseCookies()` helper for debugging
  - Enhanced `getSupabaseClient()` with better cookie configuration
  - Implemented automatic token refresh when approaching expiration
  - Added session expiration checking with `isSessionExpired()`
  - Improved error handling throughout authentication flow

- Enhanced server-side authentication in `src/lib/server-auth.ts`:
  - Created robust `parseSupabaseCookieValue()` with multiple fallback mechanisms
  - Added dynamic cookie name detection for different Supabase formats
  - Implemented token refresh functionality
  - Enhanced error messages for authentication failures
  - Improved role-based access control

**Benefits**:
- More reliable authentication across the application
- Eliminated "logged out" issues during user sessions
- Better error handling for authentication failures
- Improved security with automatic token refresh

### 5. Standardized API Middleware System

**Problem**: Inconsistent API routes with duplicate code and varying error handling approaches.

**Solution**:
- Created new API middleware system in `src/lib/api-middleware.ts`:
  - Implemented `withApiMiddleware()` wrapper for standardizing API routes
  - Added consistent error handling across all endpoints
  - Added table validation to prevent errors with missing tables
  - Implemented CORS support with OPTIONS request handling
  - Created helper functions:
    - `validateRequiredFields()` - Form validation
    - `parseRequestBody()` - Safe JSON parsing
    - `tableExists()` - Database table checking
    - `createSuccessResponse()` / `createErrorResponse()` - Standard response formats

**Benefits**:
- Reduced duplicate code across API routes
- Consistent error handling and response formats
- Simplified implementation of new API endpoints
- Better security with standardized authentication checks

### 6. Enhanced File Storage System

**Problem**: CORS limitations and permission issues with file access.

**Solution**:
- Enhanced storage API in `src/app/api/storage/[bucket]/[...path]/route.ts`:
  - Added comprehensive permission checking based on file visibility
  - Implemented multi-bucket file retrieval with fallbacks
  - Added CORS headers for cross-origin access
  - Enhanced content type detection with improved file extension mapping
  - Added OPTIONS handler for CORS preflight requests
  - Improved error handling with detailed messages

**Benefits**:
- Solved CORS issues for file access from different domains
- Properly enforced privacy controls for business files
- More reliable file access with multi-bucket strategy
- Better user experience with proper content types

### 7. Database Migration System

**Problem**: Inconsistent database structures across environments.

**Solution**:
- Created database migration system in `src/app/api/migrations/route.ts`:
  - Implemented admin-only API for running migrations
  - Created comprehensive SQL scripts for all tables:
    - `BUSINESS_TABLE_SQL` - Business table with indexes and RLS
    - `BUSINESS_FILES_TABLE_SQL` - Files table with privacy controls
    - `NDAS_TABLE_SQL` - NDA management table
    - `MESSAGES_TABLE_SQL` - Messaging system table
  - Added security controls to prevent unauthorized access
  - Provided production safety measures

**Benefits**:
- Easy database setup and maintenance
- Consistent table structures across environments
- Proper indexes for common query patterns
- Comprehensive RLS policies for data security

### 8. Localization and RTL Support System

**Problem**: Lack of Arabic language support and RTL layout for the Saudi Arabian market.

**Solution**:
- Created comprehensive localization system:
  - Implemented `TranslationProvider` with React Context in `src/i18n/TranslationProvider.tsx`
  - Created language configuration in `src/i18n/config.ts` with locale settings
  - Added complete translation files for English (`src/i18n/translations/en.ts`) and Arabic (`src/i18n/translations/ar.ts`)
  - Specialized components for RTL handling in `src/components/RTLWrapper.tsx`:
    - `RTLWrapper` - Container component for RTL-specific styling
    - `RTLText` - For text content with RTL considerations
    - `RTLIcon` - For icons that need to be flipped in RTL mode
  - Custom CSS for RTL layouts in `src/styles/rtl.css`
  - Versatile language switcher in `src/components/LanguageSwitcher.tsx`
  - Arabic font integration with Tajawal font
  - Demo page at `/localization-demo` showcasing multilingual capabilities

**Key Features**:
- Context-based translation system with React hooks
- Type-safe translation keys with TypeScript
- Proper RTL layout handling with specialized CSS
- Automatic language detection based on user preferences
- Language persistence using localStorage
- Proper handling of bidirectional text and numbers
- Three language switcher modes: dropdown, toggle, and button

**Benefits**:
- Full accessibility for Arabic-speaking users
- Proper RTL layout handling for all components
- Improved user experience for the Saudi Arabian market
- Easily extensible to support additional languages
- Consistent typography with appropriate Arabic fonts
- Type-safe translations with proper fallbacks

## Deployment Process

### Development Environment
- Local Next.js development server
- Local or remote Supabase instance
- Environment variables in `.env.local`

### Production Deployment
- Vercel for Next.js hosting
- Production Supabase instance
- Environment variables configured in Vercel

### Database Migrations
- Comprehensive SQL migration files in `/app/api/migrations`
- Admin interface for running migrations
- Enhanced security with admin-only access

## Performance Considerations

### Current Optimizations
- Efficient database queries with proper indexes
- Lazy loading of images and heavy components
- Pagination for large data sets
- Component-level code splitting
- Multi-bucket file retrieval with fallbacks
- Proper caching headers for file storage

### Future Optimizations
- Implement server-side caching for common queries
- Optimize image loading and processing
- Reduce client-side JavaScript bundle size
- Add real-time updates with WebSockets

## Future Improvements

### Planned Features
1. **Enhanced Analytics Dashboard**
   - Business listing performance metrics
   - User engagement statistics
   - Admin oversight dashboards

2. **Improved File Management**
   - Bulk upload and management
   - In-browser file preview
   - Advanced categorization and tagging

3. **Advanced Search & Discovery**
   - Faceted search for businesses
   - Machine learning-based recommendations
   - Saved searches and alerts

4. **Internationalization**
   - Arabic language support
   - Region-specific features
   - Multi-currency support

### Technical Improvements
1. **Rate Limiting Implementation**
   - Add rate limiting to API endpoints
   - Protect against abuse and scraping
   - Implement tiered access levels

2. **Database Optimization**
   - Further indexing improvements
   - Query optimization for complex operations
   - Implement caching layer

3. **Testing Framework**
   - Unit tests for utilities
   - Integration tests for API routes
   - E2E tests for critical user flows

7. **Enhanced Localization Features**
   - Add support for additional languages beyond English and Arabic
   - Implement locale-specific formatting for dates, times, and currencies
   - Create specialized RTL-aware component variants for complex UI elements
   - Add automatic language detection based on browser settings
   - Implement SEO improvements for multilingual content

---

*This document was last updated on March 14, 2024, with comprehensive details about recent improvements to the schema mapping system, authentication handling, API middleware, file storage access, and database migration system.* 