'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, loginClient, registerClient, logoutClient, getCurrentUserClient, syncFollowsFromServer } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual (localStorage)
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUserClient();
        setUser(currentUser);
        if (currentUser) await syncFollowsFromServer(currentUser.id);
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loggedUser = await loginClient(email, password);
      if (loggedUser) {
        setUser(loggedUser);
        await syncFollowsFromServer(loggedUser.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string, name: string): Promise<boolean> => {
    try {
      const newUser = await registerClient(email, password, username, name);
      if (newUser) {
        setUser(newUser);
        await syncFollowsFromServer(newUser.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutClient();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
