# Manfaa V0.1 - Saudi Business Marketplace Documentation

## Project Overview

Manfaa is a comprehensive business marketplace targeting the Saudi Arabian market. The platform allows business owners to list their businesses for sale with customizable privacy controls, enables potential buyers to discover businesses and access information after signing NDAs, facilitates direct communication between parties, and provides robust administrative controls for moderation and oversight.

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Next.js API routes (serverless architecture), Supabase
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth with JWT-based authentication
- **Storage**: Supabase Storage with bucket policies
- **Deployment**: Vercel (recommended)

## Project Structure

```
manfaa/
├── .env.local                   # Environment variables (local development)
├── .env.development             # Development-specific variables
├── .env.production              # Production-specific variables
├── middleware.ts                # Next.js middleware for auth protection
├── src/
│   ├── app/                     # Next.js App Router components
│   │   ├── layout.tsx           # Root layout component
│   │   ├── page.tsx             # Homepage component
│   │   └── globals.css          # Global styles
│   ├── components/              # Reusable UI components
│   │   └── FileUpload.tsx       # File upload component with privacy controls
│   └── lib/                     # Utility functions
│       ├── auth.ts              # Authentication utilities
│       └── database.ts          # Database operations
└── supabase/                    # Supabase configuration
    ├── schema.sql               # Database schema
    └── rls.sql                  # Row Level Security policies
```

## Core Features

### 1. Authentication System

The authentication system is built using Supabase Auth, providing:

- **User Registration**: Email/password registration with metadata for user type
- **Login**: Secure login with email/password
- **Password Reset**: Email-based password reset flow
- **Protected Routes**: Middleware protection for authenticated routes
- **Role-Based Access**: Different access levels for buyers, sellers, and admins

### 2. Database Structure

The database is structured with the following tables:

- **Users**: Store user profiles with types (buyer, seller, admin)
- **Businesses**: Business listings with details, pricing, and status
- **Business Files**: Files associated with businesses with visibility controls
- **Business Interests**: Track user interest in businesses
- **NDAs**: Manage Non-Disclosure Agreements between buyers and sellers
- **Messages**: Direct messaging between users

### 3. Row Level Security (RLS)

Comprehensive RLS policies ensure data security:

- Users can only access their own profiles
- Public business listings are visible to everyone
- Users can only manage their own businesses
- File visibility is controlled based on privacy settings
- NDAs are only visible to relevant parties
- Messages are only visible to senders and recipients

### 4. File Upload with Privacy Controls

The `FileUpload` component provides:

- Drag and drop file uploads
- Preview for image files
- File description input
- Privacy controls:
  - **Public**: Visible to all users
  - **NDA**: Only visible after signing an NDA
  - **Private**: Only visible to the business owner

## Implementation Status

### Completed Items

1. **Project Setup**
   - Next.js 14 project initialization with TypeScript and TailwindCSS
   - Environment configuration for development and production
   - Project documentation (README, CHANGELOG)

2. **Supabase Integration**
   - Authentication utilities for user management
   - Database schema design for all required tables
   - Row Level Security (RLS) policies for data protection
   - Database utility functions for common operations

3. **Basic UI Components**
   - Home page with responsive design
   - FileUpload component with privacy controls

4. **Security**
   - Authentication middleware for protected routes
   - Row Level Security for database access control

### Next Steps

1. **Authentication Implementation (Priority: High)**
   - [ ] Create login page (`/auth/login`)
   - [ ] Create registration page (`/auth/register`)
   - [ ] Implement password reset flow (`/auth/reset-password`)
   - [ ] Create auth callback handler (`/auth/callback`)
   - [ ] Add user profile page (`/profile`)

2. **User Dashboard (Priority: High)**
   - [ ] Create dashboard layout with navigation
   - [ ] Implement dashboard home page (`/dashboard`)
   - [ ] Add user profile management section
   - [ ] Create activity feed for recent interactions

3. **Business Listing Features (Priority: High)**
   - [ ] Create multi-step form for business creation (`/businesses/create`)
   - [ ] Implement business listing page (`/businesses`)
   - [ ] Create business detail page (`/businesses/[id]`)
   - [ ] Add search and filtering functionality
   - [ ] Implement business editing functionality

4. **NDA Management (Priority: Medium)**
   - [ ] Create NDA request flow
   - [ ] Implement NDA signing interface
   - [ ] Add NDA approval process for business owners
   - [ ] Build NDA-protected file access control

5. **Messaging System (Priority: Medium)**
   - [ ] Create conversation list page (`/messages`)
   - [ ] Implement conversation detail page (`/messages/[id]`)
   - [ ] Add real-time message updates

6. **Admin Dashboard (Priority: Low)**
   - [ ] Create admin layout with navigation (`/admin`)
   - [ ] Implement business approval workflow
   - [ ] Add user management interface
   - [ ] Build reporting and analytics dashboards

7. **Deployment and Testing (Priority: Medium)**
   - [ ] Set up Vercel deployment
   - [ ] Implement automated testing
   - [ ] Perform security audit
   - [ ] Optimize performance

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd manfaa
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials

4. Set up the Supabase database:
   - Create a new project in Supabase
   - Run the SQL scripts in `supabase/schema.sql` and `supabase/rls.sql`

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Database Setup Instructions

1. **Create Tables**:
   - Log in to your Supabase dashboard
   - Go to the SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL to create tables and indexes

2. **Configure Row Level Security**:
   - Stay in the SQL Editor
   - Copy and paste the contents of `supabase/rls.sql`
   - Execute the SQL to enable RLS and create policies

3. **Create Storage Buckets**:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `business-files`
   - Set up appropriate bucket policies as follows:
     - Public files: Allow read access to all
     - NDA files: Check NDA status before allowing access
     - Private files: Only allow access to the business owner

## Authentication Flow

1. **Registration**:
   - User submits registration form
   - Account is created in Supabase Auth
   - User profile is created in the users table
   - Verification email is sent

2. **Login**:
   - User submits login form
   - JWT token is generated and stored
   - User is redirected to dashboard

3. **Protected Routes**:
   - Middleware checks for valid session
   - Redirects to login if no session exists
   - Checks role for admin routes

## Development Roadmap

### Phase 1: Authentication and Core UI (Weeks 1-2)
- Complete authentication pages
- Implement dashboard UI
- Set up profile management

### Phase 2: Business Listings (Weeks 3-4)
- Implement business creation form
- Build business listing and detail pages
- Create search and filtering

### Phase 3: NDA and Messaging (Weeks 5-6)
- Implement NDA management
- Build messaging system
- Add real-time updates

### Phase 4: Admin Features and Deployment (Weeks 7-8)
- Create admin dashboard
- Implement moderation tools
- Deploy to production

## Conclusion

The Manfaa V0.1 project is set up with a solid foundation for a comprehensive business marketplace. The core infrastructure is in place, including authentication, database schema, and security policies. The next steps focus on implementing the user interface and business logic for the key features.

By following the roadmap outlined above, the development team can systematically build out the platform's functionality, starting with the high-priority authentication and business listing features before moving on to more complex features like NDA management and messaging. 