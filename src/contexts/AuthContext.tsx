/**
 * @fileoverview Authentication Context
 *
 * Provides authentication state and user profile to all components.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Profile } from '@/types/profile';

interface AuthContextType {
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (token: string) => {
    // Token is set in HTTP-only cookie by the server
    await fetchProfile();
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setProfile(null);
    } catch (error) {
      console.error('[AuthContext] Error logging out:', error);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const value: AuthContextType = {
    profile,
    isLoading,
    isAuthenticated: profile !== null,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
