import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Footer from '../Footer/Footer';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Shield, ArrowLeft } from 'lucide-react';

interface PasswordStrength {
  score: number;
  feedback: string;
  color: string;
}

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5006/api';

  // Memoize validateToken to prevent useEffect dependency warning
  const validateToken = useCallback(async () => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      setIsValidating(false);
      return;
    }

    try {
      const response = await fetch(`${api_baseUrl}/users/validate-reset-token/${token}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setIsTokenValid(true);
      } else {
        setError(data.message || 'Invalid or expired reset link. Please request a new password reset.');
      }
    } catch (err) {
      setError('Failed to validate reset link. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }, [token, api_baseUrl]);

  // Validate token on component mount
  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    let feedback = '';
    let color = '';

    if (password.length === 0) {
      return { score: 0, feedback: '', color: '' };
    }

    // Length check
    if (password.length >= 8) score += 1;
    else return { score: 0, feedback: 'At least 8 characters required', color: 'text-red-400' };

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;

    // Lowercase check  
    if (/[a-z]/.test(password)) score += 1;

    // Number check
    if (/\d/.test(password)) score += 1;

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very weak password';
        color = 'text-red-400';
        break;
      case 2:
        feedback = 'Weak password';
        color = 'text-orange-400';
        break;
      case 3:
        feedback = 'Fair password';
        color = 'text-yellow-400';
        break;
      case 4:
        feedback = 'Good password';
        color = 'text-blue-400';
        break;
      case 5:
        feedback = 'Strong password';
        color = 'text-green-400';
        break;
      default:
        feedback = 'Password strength unknown';
        color = 'text-gray-400';
    }

    return { score, feedback, color };
  };

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPasswords(prev => ({ ...prev, [field]: value }));

      // Clear errors when user starts typing
      if (error) setError('');
      if (passwordErrors[field]) {
        setPasswordErrors(prev => ({ ...prev, [field]: '' }));
      }

      // Validate password requirements
      if (field === 'newPassword') {
        if (value && value.length < 6) {
          setPasswordErrors(prev => ({ 
            ...prev, 
            newPassword: 'Password must be at least 6 characters long' 
          }));
        }
      }

      // Validate password confirmation
      if (field === 'confirmPassword') {
        if (value && value !== passwords.newPassword) {
          setPasswordErrors(prev => ({ 
            ...prev, 
            confirmPassword: 'Passwords do not match' 
          }));
        }
      }

      // Also check confirm password when new password changes
      if (field === 'newPassword' && passwords.confirmPassword) {
        if (passwords.confirmPassword !== value) {
          setPasswordErrors(prev => ({ 
            ...prev, 
            confirmPassword: 'Passwords do not match' 
          }));
        } else {
          setPasswordErrors(prev => ({ 
            ...prev, 
            confirmPassword: '' 
          }));
        }
      }
    };

  const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const errors = { newPassword: '', confirmPassword: '' };
    let isValid = true;

    if (!passwords.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwords.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (!passwords.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${api_baseUrl}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: passwords.newPassword,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      // Remove unused data variable assignment
      await response.json();
      setIsSuccess(true);

    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-md space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Validating Reset Link</h1>
              <p className="text-white/80">Please wait while we verify your reset token...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Invalid token state
  if (!isTokenValid) {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-md space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Invalid Reset Link</h1>
              <p className="text-white/80 mb-6">{error}</p>

              <div className="rounded-xl bg-red-500/20 border border-red-400/30 p-4 backdrop-blur-sm mb-8">
                <div className="flex items-start text-red-200">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-left text-sm">
                    <p className="font-medium mb-1">This reset link has expired or is invalid.</p>
                    <p>Please request a new password reset to continue.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Link
                to="/forgot-password"
                className="w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Shield className="w-5 h-5" />
                <span>Request New Reset Link</span>
              </Link>
              
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
        <Footer />
      </div>
    );
  }

  // Success state
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
              
              <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Password Reset Successful!</h1>
              <p className="text-white/80 mb-6">
                Your password has been updated successfully. You can now log in with your new password.
              </p>
              
              <div className="rounded-xl bg-green-500/20 border border-green-400/30 p-4 backdrop-blur-sm mb-8">
                <div className="flex items-start text-green-200">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium mb-2">Password updated successfully!</p>
                    <p className="text-xs text-green-300">
                      For security, you'll need to log in again with your new password.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Continue to Login</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const passwordStrength = calculatePasswordStrength(passwords.newPassword);

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-2xl space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Set New Password</h1>
            <p className="text-white/80 mb-6">
              Choose a strong password to keep your OPPZ AI account secure.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-100">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPasswords.newPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange('newPassword')}
                  placeholder="Enter your new password"
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border ${
                    passwordErrors.newPassword ? 'border-red-400' : 'border-white/20'
                  } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                >
                  {showPasswords.newPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwords.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={passwordStrength.color}>{passwordStrength.feedback}</span>
                    <span className="text-white/50">{passwordStrength.score}/5</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 mt-1">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength.score === 1 ? 'bg-red-400 w-1/5' :
                        passwordStrength.score === 2 ? 'bg-orange-400 w-2/5' :
                        passwordStrength.score === 3 ? 'bg-yellow-400 w-3/5' :
                        passwordStrength.score === 4 ? 'bg-blue-400 w-4/5' :
                        passwordStrength.score === 5 ? 'bg-green-400 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
              
              {passwordErrors.newPassword && (
                <p className="text-red-300 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-100">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange('confirmPassword')}
                  placeholder="Confirm your new password"
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border ${
                    passwordErrors.confirmPassword ? 'border-red-400' : 'border-white/20'
                  } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                >
                  {showPasswords.confirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-red-300 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {passwordErrors.confirmPassword}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!passwordErrors.newPassword || !!passwordErrors.confirmPassword}
              className="w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center">
            <Link 
              to="/login" 
              className="text-indigo-200 hover:text-indigo-100 font-medium text-sm flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
