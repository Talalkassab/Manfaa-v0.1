import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type AuthError, type AuthResponse, type UserResponse } from '@supabase/supabase-js';

export async function signUp(email: string, password: string, metadata: any): Promise<AuthResponse> {
  const supabase = createClientComponentClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const supabase = createClientComponentClient();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createClientComponentClient();
  return supabase.auth.signOut();
}

export async function getUser() {
  const supabase = createClientComponentClient();
  return supabase.auth.getUser();
}

export async function resetPassword(email: string) {
  const supabase = createClientComponentClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });
}

export async function updatePassword(password: string): Promise<UserResponse> {
  const supabase = createClientComponentClient();
  return supabase.auth.updateUser({
    password,
  });
}

export async function updateUserProfile(profile: any): Promise<UserResponse> {
  const supabase = createClientComponentClient();
  return supabase.auth.updateUser({
    data: profile,
  });
} 