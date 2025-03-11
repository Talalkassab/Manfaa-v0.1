import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-primary-900 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Manfaa Business Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              The premier marketplace for buying and selling businesses in Saudi Arabia.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href="/businesses"
                className="bg-white text-primary-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition"
              >
                Browse Businesses
              </Link>
              <Link
                href="/auth/register"
                className="bg-secondary text-white px-6 py-3 rounded-md font-medium hover:bg-secondary-600 transition"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Manfaa Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">List Your Business</h3>
              <p className="text-gray-600">
                Create your business listing with detailed information and privacy controls.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect with Buyers</h3>
              <p className="text-gray-600">
                Receive interest from potential buyers and control access to sensitive information.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Your Sale</h3>
              <p className="text-gray-600">
                Negotiate terms and finalize the deal with confidence and security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-16 bg-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the leading platform for business transactions in Saudi Arabia.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              href="/businesses/create"
              className="bg-white text-primary-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition"
            >
              Sell Your Business
            </Link>
            <Link
              href="/businesses"
              className="bg-transparent text-white px-6 py-3 rounded-md font-medium border border-white hover:bg-primary-700 transition"
            >
              Find a Business
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Manfaa</h3>
              <p className="text-gray-400">
                The premier marketplace for buying and selling businesses in Saudi Arabia.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/businesses" className="text-gray-400 hover:text-white">Browse Businesses</Link></li>
                <li><Link href="/businesses/create" className="text-gray-400 hover:text-white">Sell a Business</Link></li>
                <li><Link href="/how-it-works" className="text-gray-400 hover:text-white">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link href="/faqs" className="text-gray-400 hover:text-white">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Manfaa. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 