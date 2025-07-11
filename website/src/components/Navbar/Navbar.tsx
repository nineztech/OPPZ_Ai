// src/components/Navbar/Navbar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../../utils/auth';

interface User {
  firstname: string;
  // Add other user fields if needed
}

interface NavbarProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Navbar: React.FC<NavbarProps> = ({ user, setUser }) => {
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-bold text-gray-800">Easy Apply LinkedIn</span>
        </div>

        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
          <Link to="/features" className="text-gray-700 hover:text-blue-600 font-medium">Features</Link>
          <Link to="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">Pricing</Link>
 <Link to="/login" className="text-gray-100 hover:text-blue-100">Login</Link>
                <Link to="/signup" className="text-gray-100 hover:text-blue-100">Signup</Link>
          {user ? (
            <>
              <span className="text-gray-700">Welcome, <strong>{user.firstname}</strong>!</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 rounded transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
