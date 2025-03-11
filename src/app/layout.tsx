import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manfaa - Saudi Business Marketplace',
  description: 'A marketplace for buying and selling businesses in Saudi Arabia',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen bg-background font-sans antialiased">
        <main className="relative flex min-h-screen flex-col">
          {children}
        </main>
      </body>
    </html>
  );
} 