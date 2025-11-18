'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  phone: string;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isVerified: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook para obter o usuário autenticado e seu perfil
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!authUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(authUser);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = not found
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData as UserProfile);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao buscar usuário');
      setError(error);
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Refetch profile on auth state change
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as UserProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    isAdmin: profile?.is_admin ?? false,
    isVerified: profile?.is_verified ?? false,
    refetch: fetchUser,
  };
}

/**
 * Hook para verificar se o usuário é administrador
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useUser();
  return isAdmin;
}

/**
 * Hook para verificar autenticação e redirecionar se não autenticado
 */
export function useRequireAuth(redirectTo: string = '/login'): boolean {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, redirectTo, router]);

  return !loading && !!user;
}

/**
 * Hook para verificar se é admin e redirecionar se não for
 */
export function useRequireAdmin(redirectTo: string = '/'): boolean {
  const { user, loading, isAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push(redirectTo);
    }
  }, [user, loading, isAdmin, redirectTo, router]);

  return !loading && !!user && isAdmin;
}
