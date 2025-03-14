'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// Icons
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const BusinessesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
  </svg>
);

const MigrationsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const SignOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
  </svg>
);

export default function AdminSidebar() {
  const pathname = usePathname();
  
  const linkClasses = "flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900";
  const activeLinkClasses = "bg-gray-100 text-gray-900";

  return (
    <div className="flex h-screen flex-col justify-between border-r bg-white">
      <div className="px-4 py-6">
        <span className="flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white">
          Manfaa Admin
        </span>
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul className="flex flex-1 flex-col gap-y-4 pt-6">
          <li>
            <Link href="/admin" className={`${linkClasses} ${pathname === '/admin' ? activeLinkClasses : ''}`}>
              <span className="shrink-0">
                <DashboardIcon />
              </span>
              <span>Dashboard</span>
            </Link>
          </li>
          
          <li>
            <Link href="/admin/users" className={`${linkClasses} ${pathname === '/admin/users' ? activeLinkClasses : ''}`}>
              <span className="shrink-0">
                <UsersIcon />
              </span>
              <span>Users</span>
            </Link>
          </li>
          
          <li>
            <Link href="/admin/businesses" className={`${linkClasses} ${pathname === '/admin/businesses' ? activeLinkClasses : ''}`}>
              <span className="shrink-0">
                <BusinessesIcon />
              </span>
              <span>Businesses</span>
            </Link>
          </li>
          
          <li>
            <Link href="/admin/migrations" className={`${linkClasses} ${pathname === '/admin/migrations' ? activeLinkClasses : ''}`}>
              <span className="shrink-0">
                <MigrationsIcon />
              </span>
              <span>Migrations</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="sticky inset-x-0 bottom-0 border-t border-gray-100">
        <a href="/auth/signout" className="flex items-center gap-3 p-4 hover:bg-gray-100">
          <div className="shrink-0">
            <SignOutIcon />
          </div>
          <div>
            <p className="text-sm">
              <strong className="block font-medium">Sign out</strong>
            </p>
          </div>
        </a>
      </div>
    </div>
  );
} 