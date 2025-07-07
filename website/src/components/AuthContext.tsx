// AuthContext.tsx - Auth context with safe chrome extension communication
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sendExtensionMessage } from '../utils/extensionUtils'; // adjust the path as needed

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        const userStr = localStorage.getItem('user');

        if (token && tokenExpiration && userStr) {
          const expirationTime = parseInt(tokenExpiration, 10);
          const currentTime = new Date().getTime();

          if (currentTime < expirationTime) {
            const userData = JSON.parse(userStr);
            console.log('Found valid auth, setting user:', userData);
            setUser(userData);
          } else {
            console.log('Token expired, clearing auth');
            clearAuth();
          }
        } else {
          console.log('No valid auth found');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('user');
    setUser(null);
  };

  const login = (token: string, userData: User) => {
    console.log('Logging in user:', userData);

    const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours

    localStorage.setItem('token', token);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);

    // Notify Chrome Extension
    sendExtensionMessage({
      action: 'updateAuthState',
      data: {
        isAuthenticated: true,
        user: {
          id: userData.id,
          fullName: `${userData.firstname} ${userData.lastname}`,
          email: userData.email,
          createdAt: userData.createdAt,
        },
      },
    });
  };

  const logout = () => {
    console.log('Logging out user');

    clearAuth();

    // Notify Chrome Extension
    sendExtensionMessage({
      action: 'updateAuthState',
      data: {
        isAuthenticated: false,
        user: {
          id: '',
          fullName: '',
          email: '',
          createdAt: new Date().toISOString(),
        },
      },
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
