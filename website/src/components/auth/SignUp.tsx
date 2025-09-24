import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Footer from '../Footer/Footer';
import { Eye, EyeOff, Mail, CheckCircle, Lock, User, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface SignUpFormData {
  firstname: string;
  lastname: string;
  Phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisteredUser {
  id: string;
  firstname: string;
  lastname: string;
  Phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface UserResponse {
  token: string;
  user: RegisteredUser;
}

// ✅ Extension messaging helpers
const EXTENSION_ID = 'gkjemnmlpgdngnchlgnhacembojdfnbm';
 
const api_baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5006';

const isChromeExtensionAvailable = (): boolean =>
  typeof chrome !== 'undefined' &&
  chrome.runtime &&
  typeof chrome.runtime.sendMessage === 'function';

const sendMessageToExtension = (message: any, callback?: (res: any) => void) => {
  if (isChromeExtensionAvailable()) {
    try {
      chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Extension messaging error:', chrome.runtime.lastError.message);
        } else {
          callback?.(response);
        }
      });
    } catch (err) {
      console.warn('Failed to send message to extension:', err);
    }
  } else {
    console.info('chrome.runtime not available — skipping extension message.');
  }
};

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
 React.useEffect(() => {
    const socket = new WebSocket(process.env.REACT_APP_WS_URL as string);


    socket.onopen = () => console.log('✅ WebSocket connected');
    socket.onmessage = (event) => console.log('📩 Message from server:', event.data);
    socket.onclose = () => console.log('❌ WebSocket closed');
    socket.onerror = (err) => console.error('⚠️ WebSocket error', err);

    return () => socket.close();
  }, []);
  const [formData, setFormData] = useState<SignUpFormData>({
    firstname: '',
    lastname: '',
    Phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showOTPScreen, setShowOTPScreen] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  // Timer effect for OTP countdown
  React.useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Validation
    if (!formData.firstname || !formData.lastname || !formData.Phone || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${api_baseUrl}/users/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          Phone: formData.Phone,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server error: ${response.status}`);
        } else {
          throw new Error(`Server error: ${response.status}. Please check if the API server is running.`);
        }
      }

       
      setSuccessMessage(`OTP sent successfully to ${formData.email}`);
      setShowOTPScreen(true);
      setOtpTimer(60); // 1 minute

    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${api_baseUrl}/users/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
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

      const data: UserResponse = await response.json();

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Login user
      login(data.token, data.user);
      localStorage.setItem('userEmail', data.user.email);

      // ✅ Send message to Chrome extension after successful signup
      sendMessageToExtension({ from: 'website', action: 'userLoggedIn', user: data.user });

      setSuccessMessage('Email verified successfully! Account created.');
      
      if (window.opener) {
        window.close();
      }

      navigate('/profile');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');
    
    try {
      const response = await fetch(`${api_baseUrl}/users/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend OTP');
      }

      setSuccessMessage('New OTP sent successfully!');
      setOtpTimer(60); // Reset timer to 1 minute
      setOtp(''); // Clear current OTP input
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToForm = () => {
    setShowOTPScreen(false);
    setOtp('');
    setOtpTimer(0);
    setError('');
    setSuccessMessage('');
  };

  if (showOTPScreen) {
    return (
      <div>
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
          <div className="w-full max-w-md space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mail className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-100 mb-2">Verify Your Email</h1>
              <p className="text-white/80 mb-6">
                We've sent a 6-digit verification code to <br />
                <span className="font-semibold text-white">{formData.email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-100 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-white/10 border rounded-xl text-white text-center text-2xl tracking-widest placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  maxLength={6}
                  required
                />
              </div>

              {/* Timer */}
              {otpTimer > 0 && (
                <div className="flex items-center justify-center text-white/70">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">Code expires in {formatTime(otpTimer)}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="rounded-xl bg-green-500/20 border border-green-400/30 p-4 backdrop-blur-sm">
                  <div className="flex items-center text-green-200">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{successMessage}</span>
                  </div>
                </div>
              )}

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
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-white/70 text-sm">Didn't receive the code?</p>
              
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isResending || otpTimer > 540} // Disable if less than 1 minute passed
                  className="text-indigo-200 hover:text-indigo-100 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                  <span>{isResending ? 'Sending...' : 'Resend Code'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToForm}
                  className="text-white/70 hover:text-white font-medium text-sm"
                >
                  ← Back to signup form
                </button>
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
      <div className="min-h-screen/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white flex items-center justify-center px-4 py-4">
        <div className="flex flex-col md:flex-row items-center md:items-start p-4 gap-10 max-w-7xl w-full">

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
                    Join
                    <span className="block bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                      OPPZ AI
                    </span>
                  </h1>
                  <p className="text-xl text-white/80 max-w-md">
                    Start automating your LinkedIn job applications with cutting-edge AI technology
                  </p>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Smart Job Matching</h3>
                      <p className="text-white/70">AI-powered job recommendations tailored to your profile</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Automated Applications</h3>
                      <p className="text-white/70">Apply to hundreds of jobs with just one click</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Real-time Analytics</h3>
                      <p className="text-white/70">Track your application success and optimize your approach</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xl space-y-8 bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/30">

            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-100">Sign-Up</h1>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstname" className="block text-sm font-medium text-gray-100">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        placeholder="Enter your Firstname"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="lastname" className="block text-sm font-medium text-gray-100">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        placeholder="Enter your Lastname"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="Phone" className="block text-sm font-medium text-gray-100">Phone Number</label>
                    
                    <PhoneInput
                      country={'us'} // or 'in' for default India
                      value={formData.Phone}
                      placeholder="Enter your Phonenumber"
                      onChange={(phone) =>
                        setFormData((prev) => ({ ...prev, Phone: phone }))
                      }
                      inputProps={{
                        name: 'Phone',
                        required: true,
                        autoFocus: false,
                      }}
                      inputStyle={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '0.5rem',
                        border: '1px solid #D1D5DB',
                        paddingLeft: '48px',
                        fontSize: '0.875rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#f6f7faff',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                      buttonStyle={{
                        border: 'none',
                        backgroundColor: 'transparent',
                      }}
                      containerStyle={{
                        width: '100%',
                        borderRadius: '0.5rem',
                        border: '1px solid transparent',
                        color:'black', 
                      }}
                      dropdownStyle={{
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>
                  <div className="relative">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-100">Email/Username</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange} 
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-100">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter Password"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
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
                  </div>
                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-100">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Enter ConfirmPassword"
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
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
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-100">
                  I agree to the{' '}
                  <a
                    href="./PrivacyPolicy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-200 hover:text-indigo-400"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="rounded-xl bg-green-500/20 border border-green-400/30 p-4 backdrop-blur-sm">
                  <div className="flex items-center text-green-200">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{successMessage}</span>
                  </div>
                </div>
              )}

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
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-indigo-700 to-purple-600 hover:from-blue-700 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Sending OTP...' : 'Create Account'}
              </button>
            </form>

            <div className="text-center text-white text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-200 hover:text-indigo-100">
                Log in
              </Link>
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
      <Footer />
    </div>
  );
};

export default SignUp;
