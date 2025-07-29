import React from 'react';
import { useAuth } from './components/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar/Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="App flex">
      {isAuthenticated && <div className="fixed left-0 top-0 h-full w-52 z-30"><Sidebar /></div>}

      <div className={`flex-1 min-h-screen bg-[#f0f0ff] transition-all duration-300 ${isAuthenticated ? 'ml-52' : ''}`}>
        <nav className="bg-gradient-to-r from-blue-800 to-purple-900 shadow-md py-4 px-6 sticky top-0 z-20">
          <div className="flex justify-between items-center">
             

            {!isAuthenticated ? (
             <div className="flex items-center justify-between w-full">
    {/* Logo Section */}
    <div className="flex items-center ml-8 space-x-2 cursor-pointer">
      <img src="/OPPZ_Ai_Logo.png" alt="Logo" width="40" height="40" />
      <span className="text-xl font-bold ml-8 text-gray-100">OPPZ Ai</span>
    </div>

    {/* Links Section */}
    <div className="hidden md:flex items-center space-x-6 mr-8">
      <Link to="/" className="text-gray-100 hover:text-blue-100 hover:border-b-2 border-white">Home</Link>
      {/* <Link to="/features" className="text-gray-100 hover:text-blue-100 hover:border-b-2 border-white">Features</Link> */}
      <Link to="/FAQ" className="text-gray-100 hover:text-blue-100 hover:border-b-2 border-white">FAQ</Link>
      <Link to="/Pricing" className="text-gray-100 hover:text-blue-100 hover:border-b-2 border-white">Pricing</Link>
      <Link to="/login" className="text-gray-100 hover:text-blue-100 hover:border-b-2 border-white">Login</Link>
      <Link to="/signup" className="text-gray-100 hover:text-blue-100 hover:border-b-2 border-white">Signup</Link>
    </div>
  </div>
              
            ) : (
             <div className="w-full flex justify-end items-center space-x-4">
  <div className="hidden sm:block text-right">
    <p className="text-sm text-gray-100">Welcome back,</p>
    <p className="text-sm font-semibold text-gray-100">{user?.firstname}!</p>
  </div>

  <Link
    to="/UserProfile"
    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
  >
    {user?.firstname?.[0]?.toUpperCase() || 'U'}
  </Link>

  <button
    onClick={handleLogout}
    className="px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded"
  >
    Logout
  </button>
</div>

            )}
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
