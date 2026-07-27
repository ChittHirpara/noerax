import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  provider?: 'local' | 'google';
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loginWithEmail: (name: string, email: string, password: string, isSignUp: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('noerax_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('noerax_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Verify token on initial load
  useEffect(() => {
    if (token && !user) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('noerax_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const loginWithEmail = async (name: string, email: string, password: string, isSignUp: boolean) => {
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('noerax_token', data.token);
      localStorage.setItem('noerax_user', JSON.stringify(data.user));

      return { success: true };
    } catch (err) {
      console.error('Auth error:', err);
      return { success: false, error: 'Server connection failed.' };
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Google Login failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('noerax_token', data.token);
      localStorage.setItem('noerax_user', JSON.stringify(data.user));

      return { success: true };
    } catch (err) {
      console.error('Google Auth Error:', err);
      return { success: false, error: 'Google sign-in connection failed.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('noerax_token');
    localStorage.removeItem('noerax_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithEmail, loginWithGoogle, logout }}>
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
