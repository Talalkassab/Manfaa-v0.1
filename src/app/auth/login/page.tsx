"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log(`Attempting to login with email: ${email.substring(0, 3)}...`);

    try {
      console.log('Calling signIn function...');
      const { data, error } = await signIn(email, password);
      
      console.log('SignIn function returned', { hasData: !!data, hasError: !!error });
      
      if (error) {
        console.error('Auth error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        if (error.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.');
        } else {
          setError(`Authentication error: ${error.message}`);
        }
        return;
      }

      if (data?.user) {
        console.log('Login successful, redirecting to dashboard...');
        router.push('/dashboard');
        router.refresh();
      } else {
        console.error('No user data received from auth response', data);
        setError('No user data received. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error caught in try/catch:', err);
      console.error('Error type:', typeof err);
      console.error('Error properties:', Object.keys(err).join(', '));
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In to Manfaa</h1>
        
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              autoComplete="current-password"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link 
                href="/auth/reset-password" 
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 