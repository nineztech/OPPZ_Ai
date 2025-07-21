import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
 import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Footer from '../Footer/Footer';

interface SignUpFormData {
  firstname: string;
  lastname: string;
  Phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface User {
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
  user: User;
}

// ✅ Extension messaging helpers
const EXTENSION_ID = ' gkjemnmlpgdngnchlgnhacembojdfnbm';
const api_baseUrl= process.env.REACT_APP_API_BASE_URL || 'http://localhost:5006';

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

  const [formData, setFormData] = useState<SignUpFormData>({
    firstname: '',
    lastname: '',
    Phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    setIsLoading(true);

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
      const response = await fetch(`${api_baseUrl}/users/register`, {
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned unexpected response format');
      }

      const data: UserResponse = await response.json();

      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }

      login(data.token, data.user);
      localStorage.setItem('userEmail', data.user.email);

      // ✅ Send message to Chrome extension after successful signup
      sendMessageToExtension({ from: 'website', action: 'userLoggedIn', user: data.user });

      if (window.opener) {
        window.close();
      }

      navigate('/profile');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
     <div className="max-w-md w-full space-y-8 bg-white/30 backdrop-blur-md p-8 rounded-lg shadow-md border border-white/20">
     <div className="text-center">
          <img className="mx-auto h-16 w-16 text-black" src="/OPPZ_Ai_Logo.png" alt="Logo" />
          <h1 className="text-3xl font-extrabold text-gray-100">OPPZ Ai</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-100">Create Account</h2>
          <p className="mt-2 text-sm text-gray-100">
            Start automating your LinkedIn job applications today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-100">First Name</label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-100">Last Name</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="Phone" className="block text-sm font-medium text-gray-100">Phone Number</label>
                <PhoneInput
  country={'us'} // or 'in' for default India
  value={formData.Phone}
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
    height: '42px',
    borderRadius: '0.5rem',
    border: '1px solid #D1D5DB', // gray-300
    paddingLeft: '48px',
    fontSize: '0.875rem',
    backgroundColor: 'white',
    color: '#111827', // gray-900
  }}
  buttonStyle={{
    border: 'none',
    backgroundColor: 'transparent',
  }}
  containerStyle={{
    width: '100%',
    borderRadius: '0.5rem',
    border: '1px solid transparent',
    backgroundColor: 'white',
  }}
  dropdownStyle={{
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
  }}
/>

              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-100">Email/Username</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-100">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-100">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
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

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-white text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-200 hover:text-indigo-100">
            Log in
          </Link>
        </div>
      </div>
    </div>
        <Footer />
    </div>
  );
};

export default SignUp;
