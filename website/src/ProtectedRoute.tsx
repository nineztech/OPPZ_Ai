import React from 'react';
import { useAuth } from './components/AuthContext';
import Login from './components/auth/Login';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Login />;
  
  return <>{children}</>;
};

export default ProtectedRoute;
