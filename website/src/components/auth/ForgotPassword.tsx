import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../Footer/Footer';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');

  // Fixed API base URL - should match your backend configuration
  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5006/api';

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (emailError) setEmailError('');
    
    // Real-time email validation
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Sending request to:', `${api_baseUrl}/users/forgot-password`);
      console.log('Request data:', { email });

      const response = await fetch(`${api_baseUrl}/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.log('Error response data:', errorData);
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } else {
          // Try to get text response for debugging
          const textResponse = await response.text();
          console.log('Non-JSON error response:', textResponse);
          throw new Error(`Server error: ${response.status}. Please check if the API server is running.`);
        }
      }

      const data = await response.json();
      console.log('Success response data:', data);
      setIsSuccess(true);

    } catch (err) {
      console.error('Forgot password error:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process password reset request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-md space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Check Your Email!</h1>
              <p className="text-white/80 mb-6">
                We've sent a password reset link to <br />
                <span className="font-semibold text-white">{email}</span>
              </p>
              
              <div className="rounded-xl bg-green-500/20 border border-green-400/30 p-4 backdrop-blur-sm mb-8">
                <div className="flex items-start text-green-200">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium mb-2">Email sent successfully!</p>
                    <p className="text-xs text-green-300">
                      Please check your inbox (and spam folder) for the password reset link.
                      The link will expire in 1 hour for security reasons.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center text-white/70 text-sm">
                <p>Didn't receive the email?</p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail('');
                  }}
                  className="text-indigo-200 hover:text-indigo-100 font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Try a different email</span>
                </button>
                
                <Link
                  to="/login"
                  className="text-white/70 hover:text-white font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
        <div className="flex flex-col md:flex-row items-center md:items-start p-4 gap-10 max-w-7xl w-full">

          {/* Left Side - Information */}
          <div className="relative z-10 flex w-full justify-start min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="backdrop-blur-xl w-full max-w-3xl rounded-3xl p-8 text-left">
              <div className="mb-8">
                <div className="relative w-20 h-20 mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <img 
                      className="w-14 h-14 rounded-xl" 
                      src="/OPPZ_Ai_Logo.png" 
                      alt="OPPZ AI Logo"
                      onError={(e) => {
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
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                    Forgot Your
                    <span className="block bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                      Password?
                    </span>
                  </h1>
                  <p className="text-xl text-white/80 max-w-md">
                    No worries! We'll help you get back into your OPPZ AI account quickly and securely.
                  </p>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center mt-1">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Enter Your Email</h3>
                      <p className="text-white/70">We'll send you a secure reset link</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Check Your Inbox</h3>
                      <p className="text-white/70">Click the reset link in your email</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Create New Password</h3>
                      <p className="text-white/70">Set a strong new password for your account</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-xl mt-12 space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Reset Password</h1>
              <p className="text-white/80 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-100">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email address to reset password for your account"
                    className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${
                      emailError ? 'border-red-400' : 'border-white/20'
                    } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200`}
                    required
                    disabled={isLoading}
                  />
                </div>
                {emailError && (
                  <p className="text-red-300 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                    {emailError}
                  </p>
                )}
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

              <button
                type="submit"
                disabled={isLoading || !!emailError || !email}
                className="w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center space-y-4">
              <div className="flex items-center">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-white/50 text-sm">or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Link 
                  to="/login" 
                  className="text-indigo-200 hover:text-indigo-100 font-medium text-sm flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </Link>
                
                <p className="text-white/70 text-sm">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-purple-300 hover:text-purple-200 font-semibold">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
