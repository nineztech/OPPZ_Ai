// Fixed App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import SignUp from './components/auth/SignUp';
import Login from './components/auth/Login';
import { Home } from './components/Home/components/Hero';
import AppliedJob from './components/AppliedJob/AppliedJob';
import Profile from './components/Profile/Profile';
import UserProfile from './components/UserProfile/UserProfile';
import { Feature } from './components/Home/components/Features';
import { Pricing } from './components/Home/components/Pricing';
import { Sidebar } from './components/Sidebar/Sidebar';
import MainPage from './components/Quotations/MainPage';
import './App.css';

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  console.log('AppContent render - isAuthenticated:', isAuthenticated, 'user:', user);

  return (
    <div className="App flex">
      {/* Sidebar - only show when authenticated */}
      {isAuthenticated && (
        <div className="fixed left-0  top-0 h-full w-52 z-30">
          <Sidebar />
        </div>
      )}

      {/* Main content area */}
      <div className={`flex-1 min-h-screen bg-[#f4ffee] transition-all duration-300 ${isAuthenticated ? 'ml-52' : ''}`}>
        {/* Navbar */}
        <nav className=" bg-gradient-to-r from-blue-800 to-purple-900 shadow-md py-4 px-6 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div 
              className="flex items-center ml-8 space-x-2 cursor-pointer" 
              // onClick={() => navigate('/')}
            >
              <img src="/OPPZ_Ai_Logo.png" alt="Logo" width="40" height="40" />
              <span className="text-xl font-bold ml-8 text-gray-100">Easy Apply LinkedIn</span>
            </div>

            {/* Navigation Links - only for non-authenticated users */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/" className="text-gray-100 hover:text-blue-100 transition-colors">
                  Home
                </Link>
                <Link to="/features" className="text-gray-100 hover:text-blue-100 transition-colors">
                  Features
                </Link>
                <Link to="/pricing" className="text-gray-100 hover:text-blue-100 transition-colors">
                  Pricing
                </Link>
              </div>
            )}

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm text-gray-100">Welcome back,</p>
                      <p className="text-sm font-semibold text-gray-100">{user?.firstname}!</p>
                    </div>
                     <Link 
                      to="/UserProfile" 
                     className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user?.firstname?.[0]?.toUpperCase() || 'U'}
                    
                    </Link>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                     
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/features" element={<Feature />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <Profile />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/UserProfile" 
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <UserProfile />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
                    <p>Start Applying for Jobs</p>
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/AppliedJob" 
              element={
                <ProtectedRoute>
                  <div className="p-6">
                     <AppliedJob />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/MainPage" 
              element={
                <ProtectedRoute>
                  <div className="p-6">
                     <MainPage />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Subscription</h1>
                    <p>Manage your subscription</p>
                  </div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;