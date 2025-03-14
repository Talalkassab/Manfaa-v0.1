# Manfaa - Saudi Business Marketplace

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=flat&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)

Manfaa is a comprehensive business marketplace targeting the Saudi Arabian market. The platform allows business owners to list their businesses for sale with customizable privacy controls, enables potential buyers to discover businesses and access information after signing NDAs, facilitates direct communication between parties, and provides robust administrative controls for moderation and oversight.

## Features

- **Business Listings**: Create, browse, and manage business listings with detailed information
- **Privacy Controls**: Configure document visibility (public, NDA-required, private)
- **NDA Management**: Request, sign, and manage NDAs between buyers and sellers
- **Messaging System**: Direct messaging between buyers and sellers
- **Admin Dashboard**: Comprehensive administrative tools for platform management
- **Business Management**: Edit and request deletion of business listings with admin approval workflow
- **Authentication**: Secure authentication with role-based access control and proper cookie handling
- **File Management**: Comprehensive file organization system with categorization, metadata, and privacy controls
- **Multilingual Support**: Full Arabic and English language support with RTL layout for Arabic

## Recent Updates

### Database Schema Update (2024-03-14)
We've added several new columns to the businesses table to support additional features:

- Added JSONB fields for structured data storage:
  - `financial_info`: Stores financial data like revenue, profit, inventory value, etc.
  - `general_info`: Stores general business information like established year
  - `operational_info`: Stores operational data like number of employees

- Added standard columns:
  - `location`: Business location (city, country)
  - `asking_price`: Asking price for the business
  - `reason_for_selling`: Reason for selling the business
  - `privacy_level`: Privacy level for business listing (public, nda, private)
  - `owner_id`: User ID of the business owner (references users.id)
  - `slug`: Unique identifier for business URLs (auto-generated from title)

### Schema Mapping System (2024-03-14)
We've implemented a robust schema mapping system to handle the translation between frontend form fields and database columns:

- `BUSINESS_SCHEMA` in `src/lib/database-schema.ts` defines mappings between form fields and database columns
- The schema includes validation, transformation functions, and error handling utilities
- Form fields use camelCase (e.g., `establishedYear`) while database columns use snake_case (e.g., `established_year`)
- Special handling for JSONB fields with nested properties through dot notation (e.g., `financial_info.revenue`)

When updating the database schema, always ensure that the corresponding schema mapping in `database-schema.ts` is updated accordingly to maintain data consistency.

To apply this migration:

```bash
# Start Docker Desktop first, then run:
npx supabase start
npx supabase migration up
```

If you're using a remote Supabase instance, you can either:

1. Apply the migration manually using the SQL Editor in the Supabase Dashboard with the SQL from the following files:
   - `supabase/migrations/20240320000002_add_business_fields.sql`
   - `supabase/migrations/20240320000003_add_slug_column.sql`

2. Use our migration script:
```bash
# Install dependencies if needed
npm install

# Run the migration script
node scripts/apply-migration.js
```
The script will prompt for your Supabase URL and service role key, then apply the migration to your remote instance.

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with server-side validation
- **Storage**: Supabase Storage
- **Internationalization**: Custom translation system with React Context

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

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Creating an Admin User

To access the admin dashboard, you need an account with admin privileges. You can create one by running:

```bash
# Install tsx if not already installed
npm install -D tsx

# Create the admin user
npm run create-admin
```

This will create an admin user with the following credentials:
- Email: admin@admin.com
- Password: admin123

Alternatively, you can promote an existing user to admin through the admin dashboard (if you already have admin access) or through the Supabase dashboard:

1. Log in to your Supabase project dashboard
2. Navigate to "Authentication" > "Users"
3. Find the user you want to promote
4. Click on "Edit" or the user's entry
5. Under "User Metadata", add or update the role field to `{ "role": "admin" }`
6. Save the changes

## Project Structure

```
src/
├── app/                # Next.js App Router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── admin/          # Admin dashboard
│   └── ...
├── components/         # Reusable UI components
├── lib/                # Utility functions and hooks
│   ├── auth.ts         # Client-side auth utilities
│   ├── server-auth.ts  # Server-side auth utilities
│   └── ...
├── middleware.ts       # Next.js middleware for auth protection
└── ...
```

## Authentication

The application uses Supabase Authentication with both client-side and server-side validation:

- **Client-side**: Uses `@supabase/ssr` for browser-based authentication
- **Server-side**: Uses a custom authentication utility in `src/lib/server-auth.ts` that properly handles cookies in Next.js API routes
- **Role-based access**: Admin routes are protected with role verification

## Database Setup

The database schema and RLS policies are defined in the `/supabase` directory. Use the Supabase CLI or web interface to apply these schemas.

### Running Migrations

To apply the latest database migrations (like creating the messages table):

1. Using the Supabase CLI:
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link your project
   supabase link --project-ref <your-project-ref>

   # Push the migrations
   supabase db push
   ```

2. Or, manually apply SQL migrations through the Supabase Dashboard:
   - Login to your Supabase project dashboard
   - Navigate to the "SQL Editor" section
   - Copy the contents of the migration file `/supabase/migrations/20240530000000_create_messages_tables.sql`
   - Paste into the SQL Editor and run the query

After running the migrations, restart your Next.js server:
```bash
npm run dev
```

## File Management System

### Features

The file management system provides a comprehensive solution for organizing and managing business-related files:

#### File Organization
- **Categorization**: Organize files into categories (images, financial, legal, other)
- **Metadata**: Add descriptions, visibility settings, and custom metadata to files
- **Multi-Bucket Storage**: Redundant storage across multiple buckets for reliability

#### Privacy Controls
- **Public Files**: Visible to all users browsing the marketplace
- **NDA-Protected Files**: Only visible after a buyer signs an NDA
- **Private Files**: Only visible to the business owner

#### User Interface
- **File Manager**: Dedicated interface for organizing, categorizing, and managing business files
- **Bulk Operations**: Upload multiple files with shared settings
- **Edit Functionality**: Update file metadata and privacy settings after upload
- **Deletion**: Remove files with confirmation dialog to prevent accidental deletion

### Database Structure

File metadata is stored in the `business_files` table with the following structure:
- `id`: Unique identifier
- `business_id`: Associated business
- `file_path`: Storage path
- `file_name`: Original filename
- `file_type`: MIME type
- `file_size`: File size in bytes
- `visibility`: Privacy level (public, nda, private)
- `category`: File category
- `description`: User-provided description
- `uploaded_by`: User who uploaded the file
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Setup Instructions

1. Run the SQL migration script to create the business_files table:
   ```sql
   -- From supabase/migrations/business_files_table.sql
   CREATE TABLE IF NOT EXISTS business_files (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
     -- other fields...
   );
   ```

2. Create the required storage buckets:
   - `businesses`: Primary bucket for business files
   - `business-files`: Backup bucket for redundancy

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed implementation information and development roadmap.

## Development Guidelines

For development tips and troubleshooting, see [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Localization

Manfaa supports both English and Arabic languages with full RTL (Right-to-Left) layout support for Arabic.

### Features

- Complete translation system for all UI elements
- Automatic language detection based on user preferences
- Language persistence using localStorage
- RTL layout support for Arabic language
- Specialized components for handling bidirectional text and numbers
- Language switcher with multiple display options (dropdown, toggle, button)

### Usage

```tsx
// Using translations in components
import { useTranslation } from '@/i18n/TranslationProvider';

function MyComponent() {
  const { t, lang, isRTL } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <p>{t('home.hero.subtitle')}</p>
      
      {/* Conditional rendering based on language direction */}
      {isRTL ? (
        <div className="rtl-specific-layout">...</div>
      ) : (
        <div className="ltr-layout">...</div>
      )}
    </div>
  );
}
```

### RTL Utilities

The project includes specialized components for handling RTL-specific layout challenges:

- `RTLWrapper`: A container component that applies RTL-specific styles
- `RTLText`: For text content that may need special handling in RTL mode
- `RTLIcon`: For icons that should be flipped in RTL mode

Visit the localization demo page at `/localization-demo` to see the multilingual capabilities in action.

## Database Query Utilities

### Supabase Utilities

The project includes enhanced utilities for working with Supabase in a type-safe manner:

#### Type Extensions

Located in `src/types/supabase-extensions.d.ts`, these type definitions extend the Supabase client to provide better TypeScript support:

- `PostgrestResponseWithCount<T>`: Type for responses that include a count property
- `hasCount`: Type guard to check if a response includes a count property

#### Enhanced Query Builder

Located in `src/lib/supabase-utils.ts`, this utility provides:

```typescript
// Create a Supabase client
const supabase = createSupabaseClient();

// Create an enhanced query builder
const query = createEnhancedQuery(supabase, 'businesses', '*, users(*)');

// Build and execute a query with type safety
const { data, count } = await query
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(10)
  .withCount()
  .execute();
```

#### useSupabaseQuery Hook

Located in `src/hooks/useSupabaseQuery.ts`, this hook provides a convenient way to query Supabase with caching and optimistic updates:

```typescript
const { data, count, error, isLoading, refetch, mutate } = useSupabaseQuery(supabase, {
  table: 'businesses',
  select: '*, users(*)',
  filters: {
    status: 'approved',
    created_at: { gt: '2023-01-01' }
  },
  order: {
    column: 'created_at',
    ascending: false
  },
  pagination: {
    page: 1,
    pageSize: 10
  },
  count: 'exact'
});

// Perform a mutation with optimistic updates
await mutate({
  table: 'businesses',
  type: 'update',
  data: { status: 'rejected' },
  match: { id: '123' },
  returning: '*'
});
```

## SEO Features

The application includes several SEO optimizations:

- **Enhanced Metadata**: Comprehensive metadata configuration in the root layout
- **OpenGraph and Twitter Cards**: Social media sharing optimizations
- **Sitemap Generation**: Dynamic sitemap.xml generation using Next.js App Router
- **Robots.txt**: Configurable robots.txt using Next.js App Router
- **Structured Data**: JSON-LD structured data for rich search results
- **Internationalization**: Support for both English and Arabic with proper RTL handling

### Structured Data Implementation

The application uses JSON-LD structured data to enhance search results:

```tsx
// Example usage in a page component
import { BusinessPageJsonLd } from '@/lib/structured-data';

export default function BusinessPage({ business }) {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Businesses', url: '/businesses' },
    { name: business.title, url: `/businesses/${business.id}` },
  ];
  
  return (
    <div>
      <BusinessPageJsonLd business={business} breadcrumbs={breadcrumbs} />
      {/* Rest of the component */}
    </div>
  );
}
``` 