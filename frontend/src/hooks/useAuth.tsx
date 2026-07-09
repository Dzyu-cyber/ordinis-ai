import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (payload: any) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and check current user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch (err: any) {
        // Safe to ignore on initial load (simply means user is unauthenticated)
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(payload);
      setUser(loggedUser);
    } catch (err: any) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(payload);
      setUser(newUser);
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed. Please try again.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
