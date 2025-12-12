'use client';

import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: {
    tier: string;
    status: string;
    currentPeriodEnd: string;
  };
  limits: {
    monthlyConversions: number;
    monthlyBenchmarks: number;
    monthlyDataFiles: number;
    maxFileSize: number;
  };
  stats: {
    codeConversions: number;
    benchmarksRun: number;
    dataFilesProcessed: number;
  };
  // Optional profile fields used by Settings/Profile
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: { email?: boolean; push?: boolean };
  };
  phone?: string;
  location?: string;
  bio?: string;
  company?: string;
  createdAt?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use relative API paths (handled by Next.js)
  const API_BASE_URL = '';

  useEffect(() => {
    // Detect development mode - check multiple sources
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';
    
    console.log('AuthProvider: Current environment:', process.env.NODE_ENV);
    console.log('AuthProvider: Hostname:', window.location.hostname);
    console.log('AuthProvider: Is development mode:', isDevelopment);
    console.log('AuthProvider: Starting authentication setup...');

    // Always first try to restore an existing real session (works in dev and prod)
    const storedToken = localStorage.getItem('qorscend_token');
    const storedUser = localStorage.getItem('qorscend_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        verifyToken(storedToken);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('qorscend_token');
        localStorage.removeItem('qorscend_user');
      }
    }

    // No stored session → do not inject any placeholder token
    // Leave unauthenticated so protected pages can redirect
    setIsLoading(false);
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Token invalid');
      }

      const data = await response.json();
      const userFromApi = data?.data?.user || data?.user;
      if (userFromApi) {
        setUser(userFromApi);
        localStorage.setItem('qorscend_user', JSON.stringify(userFromApi));
      }
    } catch (error) {
      console.error('Token verification failed (non-fatal):', error);
      // Do not force logout on network or non-401 errors to avoid loops in dev
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const base = API_BASE_URL || '';
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Login failed (HTTP ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const tokenValue = data?.data?.token || data?.token;
      const userValue = data?.data?.user || data?.user;
      if (data.success && tokenValue) {
        setToken(tokenValue);
        setUser(userValue);
        localStorage.setItem('qorscend_token', tokenValue);
        localStorage.setItem('qorscend_user', JSON.stringify(userValue));
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const base = API_BASE_URL || '';
      const response = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Registration failed (HTTP ${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const tokenValue = data?.data?.token || data?.token;
      const userValue = data?.data?.user || data?.user;
      if (data.success && tokenValue) {
        setToken(tokenValue);
        setUser(userValue);
        localStorage.setItem('qorscend_token', tokenValue);
        localStorage.setItem('qorscend_user', JSON.stringify(userValue));
        return true;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('qorscend_token');
    localStorage.removeItem('qorscend_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('qorscend_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
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

// Utility function to make authenticated API calls
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('qorscend_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('qorscend_token');
    localStorage.removeItem('qorscend_user');
    window.location.href = '/auth';
    throw new Error('Authentication expired');
  }

  return response;
}
