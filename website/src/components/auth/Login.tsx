// Improved Login.tsx - Enhanced UI/UX without disturbing backend
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import from AuthContext
import Footer from '../Footer/Footer'; 
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Use auth context
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5006/api";

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
    
    // Clear general error when user makes changes
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Attempting login...');
      const response = await fetch(`${api_baseUrl}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data: LoginResponse = await response.json();
      console.log('Login successful:', data);

      // Use auth context login method
      login(data.token, data.user);
      localStorage.setItem('userEmail', data.user.email);
      
      // Navigate to profile
      navigate('/profile');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
       <div className="min-h-screen/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
  <div className="flex flex-col md:flex-row items-center md:items-start p-4 gap-10 max-w-7xl w-full">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-20 w-32 h-32 bg-white/5 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-white/5 to-transparent rounded-full"></div>
        </div>

        <div className="relative z-10 flex items-center w-full justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-xl w-full rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
                <div className="relative mx-auto w-20 h-20 mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <img 
                      className="w-14 h-14 rounded-xl" 
                      src="/OPPZ_Ai_Logo.png" 
                      alt="OPPZ AI Logo"
                      onError={(e) => {
                        // Fallback if logo doesn't load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.innerHTML = '<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
                          parent.appendChild(icon);
                        }
                      }}
                    />
                    <Sparkles className="w-8 h-8 text-white absolute opacity-0" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 mt-4">OPPZ AI</h1>
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-white/70">“Let’s pick up where inspiration meets automation and continue building a smarter tomorrow — sign in to resume.”</p>
              </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center w-full justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Login Card */}
            <div className="bg-white/10 backdrop-blur-xl w-full rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-1">Log in</h1>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white/90">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${
                        fieldErrors.email ? 'border-red-400' : 'border-white/20'
                      } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-300 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-white/90">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 bg-white/10 border ${
                        fieldErrors.password ? 'border-red-400' : 'border-white/20'
                      } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-red-300 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-400 focus:ring-purple-400 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-white/70">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-purple-300 hover:text-purple-200 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-500/20 border border-red-400/30 p-4 backdrop-blur-sm">
                    <div className="flex items-center text-red-200">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-white/70">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-purple-300 hover:text-purple-200 font-semibold transition-colors hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              {/* Divider */}
              <div className="mt-6 flex items-center">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-white/50 text-sm">or continue with</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              {/* Social Login Options */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-200 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="white" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;