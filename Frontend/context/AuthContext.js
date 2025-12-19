'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = auth.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          // First, try to get user from sessionStorage immediately (synchronous)
          const cachedUser = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              setUser(parsedUser);
              console.log('✅ User loaded from sessionStorage:', parsedUser);
            } catch (e) {
              console.error('Failed to parse cached user:', e);
            }
          }

          // If no cached user, try to get from token
          if (!cachedUser) {
            const tokenUser = auth.getUserFromToken();
            if (tokenUser) {
              console.log('✅ User loaded from token:', tokenUser);
              setUser(tokenUser);
              // Cache it for next time
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('user', JSON.stringify(tokenUser));
              }
            }
          }

          // Then fetch fresh user data (this might update state if data changed)
          const userData = await auth.getCurrentUser();
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const result = await auth.login(identifier, password);
      console.log('🔐 Login successful, setting user:', result.user);
      setUser(result.user);
      setIsAuthenticated(true);
      console.log('✅ User state updated in AuthContext');
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      return await auth.register(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Use Next.js router for better UX
    router.push('/');
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};