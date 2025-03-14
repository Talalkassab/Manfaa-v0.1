import { Search } from 'lucide-react';
import Link from 'next/link';
import { HomePageJsonLd } from '@/lib/structured-data';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Add JSON-LD structured data */}
      <HomePageJsonLd />
      
      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Buy and sell <br />
            businesses with <br />
            <span className="text-teal-600">growth potential</span>
          </h1>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Saas, Amazon Store, AdSense, Ecommerce"
                className="w-full px-4 py-3 pl-12 pr-16 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="bg-teal-600 text-white px-4 py-1 rounded-md hover:bg-teal-700 transition-colors">
                  Search
                </span>
              </button>
            </div>
          </div>

          {/* Trending Tags */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="text-gray-500">Trending:</span>
            {['Shopify', 'AdSense', 'Travel Blog', 'Ecommerce'].map((tag) => (
              <Link
                key={tag}
                href={`/browse?tag=${tag.toLowerCase()}`}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
            The easiest way to <br />
            become an entrepreneur
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Find the perfect business</h3>
              <p className="text-gray-600">Browse through our curated selection of established businesses ready for new ownership.</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Due diligence made easy</h3>
              <p className="text-gray-600">Access detailed financial reports, analytics, and business metrics to make informed decisions.</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">Quick and secure transfer</h3>
              <p className="text-gray-600">Complete your business acquisition with our secure and streamlined transfer process.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 