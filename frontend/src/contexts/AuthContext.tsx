'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      // Try localStorage first, then cookie as fallback
      let token = localStorage.getItem('auth_token');
      
      if (!token) {
        // Check cookie as fallback
        const cookieMatch = document.cookie.match(/auth_token=([^;]+)/);
        token = cookieMatch ? cookieMatch[1] : null;
        
        // Sync localStorage with cookie if found
        if (token) {
          localStorage.setItem('auth_token', token);
        }
      }

      console.log('Checking auth token:', token ? 'found' : 'not found');

      if (!token) {
        console.log('No auth token found');
        setUser(null);
        authService.setAuthHeader(null);
        return;
      }

      authService.setAuthHeader(token);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      console.log('Auth check successful:', currentUser.email);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear both localStorage and cookie on auth failure
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      authService.setAuthHeader(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setActionLoading(true);
    try {
      const authResponse = await authService.login({ email, password });
      
      // Set token in localStorage and cookie
      localStorage.setItem('auth_token', authResponse.access_token);
      document.cookie = `auth_token=${authResponse.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      authService.setAuthHeader(authResponse.access_token);
      
      // Get user info after successful login
      const user = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      console.log('Login successful:', user.email);
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw so login page can handle the error
    } finally {
      setActionLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setActionLoading(true);
    try {
      // First register the user
      const user = await authService.register({ username, email, password });
      
      // Then login to get the token
      const authResponse = await authService.login({ email, password });
      
      // Set token in localStorage and cookie
      localStorage.setItem('auth_token', authResponse.access_token);
      document.cookie = `auth_token=${authResponse.access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      localStorage.setItem('user', JSON.stringify(user));
      
      authService.setAuthHeader(authResponse.access_token);
      setUser(user);
      
      console.log('Registration successful:', user.email);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Re-throw so register page can handle the error
    } finally {
      setActionLoading(false);
    }
  };

  const logout = async () => {
    setActionLoading(true);
    try {
      // Clear local state immediately
      setUser(null);
      localStorage.removeItem('auth_token');
      
      // Clear cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      authService.setAuthHeader(null);
      
      // Call server logout in background
      try {
        await authService.logout();
      } catch (error) {
        console.error('Server logout failed:', error);
        // Continue with local logout even if server fails
      }
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure we still clear state even on error
      setUser(null);
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      authService.setAuthHeader(null);
    } finally {
      setActionLoading(false);
    }
  };

  const value = {
    user,
    loading: loading || actionLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
