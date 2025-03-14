import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import '../styles/rtl.css'; // Import RTL styles
import Navbar from '../components/Navbar';
import SupabaseProvider from '../components/providers/SupabaseProvider';
import TranslationProvider from '../i18n/TranslationProvider';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://manfaa.com'),
  title: 'Manfaa - Saudi Business Marketplace',
  description: 'A marketplace for buying and selling businesses in Saudi Arabia',
  keywords: ['business marketplace', 'Saudi Arabia', 'buy business', 'sell business', 'Manfaa'],
  authors: [{ name: 'Manfaa Team' }],
  creator: 'Manfaa',
  publisher: 'Manfaa',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    title: 'Manfaa - Saudi Business Marketplace',
    description: 'A marketplace for buying and selling businesses in Saudi Arabia',
    siteName: 'Manfaa',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Manfaa - Saudi Business Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manfaa - Saudi Business Marketplace',
    description: 'A marketplace for buying and selling businesses in Saudi Arabia',
    images: ['/images/twitter-image.jpg'],
    creator: '@manfaa',
    site: '@manfaa',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SupabaseProvider>
          <TranslationProvider>
            <Navbar />
            <main className="relative flex min-h-screen flex-col">
              {children}
            </main>
          </TranslationProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
} 