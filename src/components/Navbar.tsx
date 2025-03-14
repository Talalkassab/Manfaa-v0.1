'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser, signOut } from '../lib/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/i18n/TranslationProvider';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getUser();
        setUser(data?.user || null);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-teal-100 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-teal-600">{t('common.appName')}</span>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link href="/browse" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
              {t('businesses.browse')}
            </Link>
            <Link href="/services" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
              Services
            </Link>
            <Link href="/sell" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
              {t('businesses.listYourBusiness')}
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
              Pricing
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
              Blog
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {!loading && (
              user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                    {t('nav.dashboard')}
                  </Link>
                  {user?.user_metadata?.role === 'admin' && (
                    <Link href="/admin" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                      {t('nav.admin')}
                    </Link>
                  )}
                  <Link href="/profile" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-red-600 px-3 py-2 text-sm font-medium"
                  >
                    {t('auth.signOut')}
                  </button>
                  <LanguageSwitcher type="button" className="ml-4" />
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-600 hover:text-teal-600 px-3 py-2 text-sm font-medium">
                    {t('auth.signIn')}
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {t('auth.signUp')}
                  </Link>
                  <LanguageSwitcher type="button" className="ml-4" />
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 