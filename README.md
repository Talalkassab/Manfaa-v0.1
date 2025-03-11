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

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Internationalization**: next-intl

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

## Project Structure

```
src/
├── app/                # Next.js App Router
├── components/         # Reusable UI components
├── lib/                # Utility functions and hooks
├── middleware.ts       # Next.js middleware for auth protection
└── ...
```

## Database Setup

The database schema and RLS policies are defined in the `/supabase` directory. Use the Supabase CLI or web interface to apply these schemas.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed implementation information and development roadmap.

## Development Guidelines

For development tips and troubleshooting, see [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE). 