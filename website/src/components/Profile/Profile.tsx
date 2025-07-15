import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Check, UserCog, Upload, User, Save } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import FilterSettingsConfigs from './FilterSettingsConfig';
import SkillsManager from './Skills';
import ExperienceManager from './Experiance';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  experience: string;
  city: string;
  phone: string;
  currentSalary: string;
  expectedSalary: string;
  gender: string;
  military: string;
  citizenship: string;
  age: string;
  noticePeriod: string;
  additionalInfo: string;
}

interface ProfileStatus {
  completed: boolean;
  timestamp: number;
  lastUpdated: string;
  requiredFieldsFilled: boolean;
  resumeUploaded: boolean;
  submitted: boolean;
}

interface ExistingProfile extends ProfileData {
  id: number;
  resume: string | null;
  resumeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const initialState: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  experience: '',
  city: '',
  phone: '',
  currentSalary: '',
  expectedSalary: '',
  gender: '',
  military: '',
  citizenship: '',
  age: '',
  noticePeriod: '',
  additionalInfo: '',
};

const ProfileBuilder: React.FC = () => {
  const [data, setData] = useState<ProfileData>(initialState);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('Personal Details');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    completed: false,
    timestamp: 0,
    lastUpdated: '',
    requiredFieldsFilled: false,
    resumeUploaded: false,
    submitted: false
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // FIXED: More robust API base URL detection for production
  const getApiBaseUrl = () => {
    // Priority 1: Environment variable (most reliable for production)
    const envUrl = process.env.REACT_APP_API_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // Priority 2: Local development
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return "http://localhost:5006";
    }
    
    // Priority 3: Production - more robust detection
    // Check if we're on HTTPS (production) or HTTP (staging)
    const isProduction = protocol === 'https:';
    
    // Common production patterns
    const productionPatterns = [
      `${protocol}//api.${currentHost}`, // api.yourdomain.com
      `${protocol}//${currentHost}/api`, // yourdomain.com/api
      `${protocol}//backend.${currentHost}`, // backend.yourdomain.com
      `${protocol}//${currentHost.replace('www.', 'api.')}`, // Replace www with api
    ];
    
    // For staging/development with specific ports
    const stagingPatterns = [
      `${protocol}//${currentHost}:5006`, // Same domain with port
      `${protocol}//${currentHost}:3001`, // Common backend port
      `${protocol}//${currentHost}${port ? `:${port}` : ''}/api`, // Current port with /api
    ];
    
    const patterns = isProduction ? productionPatterns : [...productionPatterns, ...stagingPatterns];
    
    // Return the first pattern - you might want to make this configurable
    return patterns[0];
  };

  const api_baseUrl = getApiBaseUrl();

  // Required fields for profile completion
  const requiredFields = useMemo(() => ['firstName', 'lastName', 'email', 'experience', 'city', 'phone', 'currentSalary', 'expectedSalary'], []);

  // Helper function to safely check if a field value is filled
  const isFieldFilled = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value);
    return Boolean(value);
  };

  // Function to update profile status
  const updateProfileStatus = useCallback((): ProfileStatus => {
    const requiredFieldsStatus = requiredFields.every(field => {
      const value = data[field as keyof ProfileData];
      return isFieldFilled(value);
    });

    const resumeStatus = !!(resumeFile && (selectedFile || profileExists));
    const complete = requiredFieldsStatus && resumeStatus && isSubmitted;

    const statusData: ProfileStatus = {
      completed: complete,
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString(),
      requiredFieldsFilled: requiredFieldsStatus,
      resumeUploaded: resumeStatus,
      submitted: isSubmitted
    };

    console.log('Updating profile status:', statusData);
    setProfileStatus(statusData);

    // Safe localStorage usage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('profileStatus', JSON.stringify(statusData));
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }

    // Dispatch custom event
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('profileStatusChanged', {
          detail: statusData
        }));
      }
    } catch (error) {
      console.warn('Custom event dispatch failed:', error);
    }

    return statusData;
  }, [data, resumeFile, selectedFile, profileExists, isSubmitted, requiredFields]);

  // Enhanced API request function with better error handling and CORS support
  const makeApiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const defaultOptions: RequestInit = {
      credentials: 'include', // Include cookies for CORS
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Only add Content-Type for JSON requests
    if (options.body && typeof options.body === 'string') {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Content-Type': 'application/json',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      console.log('Making API request:', {
        url,
        method: options.method || 'GET',
        headers: defaultOptions.headers,
        hasBody: !!options.body
      });

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API request failed:', {
        url,
        error: error instanceof Error ? error.message : error,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      throw error;
    }
  };

  // Enhanced profile loading with better error handling and debugging
  const loadProfile = useCallback(async () => {
    console.log('🔄 Starting profile load process...');
    setLoading(true);
    setError(null);
    
    try {
      // Load from localStorage if available
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedStatus = localStorage.getItem('profileStatus');
          if (storedStatus) {
            const parsedStatus = JSON.parse(storedStatus);
            setProfileStatus(parsedStatus);
            console.log('📦 Loaded status from localStorage:', parsedStatus);
          }
        }
      } catch (storageError) {
        console.warn('⚠️ Error loading from localStorage:', storageError);
      }

      // Get user email from localStorage
      let userEmail: string | null = null;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userEmail = parsedUser?.email;
            console.log('👤 Found user email:', userEmail);
          }
        }
      } catch (userError) {
        console.warn('⚠️ Error loading user from localStorage:', userError);
      }

      if (!userEmail) {
        console.log("❌ No user email found in localStorage");
        setProfileExists(false);
        setProfileId(null);
        setIsSubmitted(false);
        return;
      }

      console.log("🔍 Loading profile for email:", userEmail);
      console.log("🌐 API Base URL:", api_baseUrl);

      const encodedEmail = encodeURIComponent(userEmail);
      const profileUrl = `${api_baseUrl}/api/profile/email/${encodedEmail}`;
      
      console.log("📡 Making request to:", profileUrl);

      const response = await makeApiRequest(profileUrl, {
        method: 'GET',
      });

      console.log("📡 Profile fetch response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Response is not JSON:', contentType);
          throw new Error('Server returned non-JSON response');
        }

        const result = await response.json();
        console.log("✅ Profile fetch result:", result);
        
        if (result.success && result.profile) {
          const profile: ExistingProfile = result.profile;
          const { id, resume, resumeUrl, createdAt, updatedAt, ...profileData } = profile;
          
          setData(profileData);
          setResumeFile(resume);
          setProfileExists(true);
          setProfileId(id);
          setIsSubmitted(true);
          
          console.log("✅ Profile loaded successfully:", {
            id,
            email: profileData.email,
            resumeFile: resume,
            hasData: Object.keys(profileData).length > 0
          });
        } else {
          console.log("❌ Profile not found in response:", result);
          setProfileExists(false);
          setProfileId(null);
          setIsSubmitted(false);
        }
      } else if (response.status === 404) {
        console.log("ℹ️ Profile not found (404) - user needs to create profile");
        setProfileExists(false);
        setProfileId(null);
        setIsSubmitted(false);
      } else {
        // Try to get error details
        let errorText = '';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = response.statusText || 'Unknown error';
        }
        
        console.error("❌ Profile fetch failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: response.url
        });
        
        setError(`Failed to load profile: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
        setProfileExists(false);
        setProfileId(null);
        setIsSubmitted(false);
      }
    } catch (fetchError) {
      console.error("❌ Network error fetching profile:", fetchError);
      
      let errorMessage = 'Network error occurred while loading profile';
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timed out - please check your connection';
        } else if (fetchError.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to server - please check if the API is running';
        } else {
          errorMessage = `Network error: ${fetchError.message}`;
        }
      }
      
      setError(errorMessage);
      setProfileExists(false);
      setProfileId(null);
      setIsSubmitted(false);
    } finally {
      setLoading(false);
    }
  }, [api_baseUrl]);

  // Load existing profile data and status
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Update status whenever relevant data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateProfileStatus();
    }, 300); // Debounce to avoid too many updates

    return () => clearTimeout(timeoutId);
  }, [data, resumeFile, selectedFile, profileExists, isSubmitted, updateProfileStatus]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("📎 File upload handler called");
    console.log("📎 Selected file:", file);
    
    if (file) {
      console.log("📎 File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('⚠️ Please select a PDF, DOC, or DOCX file.');
        e.target.value = '';
        setSelectedFile(null);
        setResumeFile(null);
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ File size must be less than 5MB.');
        e.target.value = '';
        setSelectedFile(null);
        setResumeFile(null);
        return;
      }
      
      // Store both the file object and the filename
      setSelectedFile(file);
      setResumeFile(file.name);
      console.log("✅ File set successfully:", file.name);
    } else {
      console.log("❌ No file selected");
      setSelectedFile(null);
      setResumeFile(null);
    }
  };

  const calculateProgress = () => {
    let filled = 0;
    
    // Count filled required fields
    requiredFields.forEach(field => {
      const value = data[field as keyof ProfileData];
      if (isFieldFilled(value)) {
        filled++;
      }
    });
    
    // Count optional fields
    const optionalFields = ['gender', 'citizenship', 'age', 'noticePeriod', 'additionalInfo'];
    optionalFields.forEach(field => {
      const value = data[field as keyof ProfileData];
      if (isFieldFilled(value)) {
        filled++;
      }
    });
    
    // Add resume
    if (resumeFile && (selectedFile || profileExists)) filled++;
    
    // Total fields = required + optional + resume
    const totalFields = requiredFields.length + optionalFields.length + 1;
    return Math.round((filled / totalFields) * 100);
  };

  const handleSubmit = async () => {
    console.log("🚀 === DEBUGGING FRONTEND SUBMISSION ===");
    console.log("🔍 Profile exists:", profileExists);
    console.log("🔍 Profile ID:", profileId);
    console.log("🌐 API Base URL:", api_baseUrl);
    
    setLoading(true);
    setError(null);
    
    // Check if all required fields are filled
    const allRequiredFieldsFilled = requiredFields.every(field => {
      const value = data[field as keyof ProfileData];
      return isFieldFilled(value);
    });

    console.log("✅ Required fields filled:", allRequiredFieldsFilled);
    console.log("📎 Resume file:", resumeFile);
    console.log("📎 Selected file object:", selectedFile);

    if (!allRequiredFieldsFilled) {
      setError('Please fill all required fields before submitting.');
      setLoading(false);
      return;
    }

    if (!resumeFile || (!selectedFile && !profileExists)) {
      setError('Please upload your resume before submitting.');
      setLoading(false);
      return;
    }

    // Validate selected file if provided
    if (selectedFile) {
      console.log("📎 Selected file details:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      });

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a PDF, DOC, or DOCX file.');
        setLoading(false);
        return;
      }

      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    
    // Only append file if a new one is selected
    if (selectedFile) {
      formData.append('resume', selectedFile);
    }

    console.log("📦 FormData created:");
    console.log("📦 Data:", JSON.stringify(data));
    if (selectedFile) {
      console.log("📦 File:", selectedFile);
    }

    try {
      let url: string;
      let method: string;
      
      if (profileExists && profileId) {
        // Update existing profile
        url = `${api_baseUrl}/api/profile/${profileId}`;
        method = 'PUT';
        console.log("🔄 Updating existing profile");
      } else {
        // Create new profile
        url = `${api_baseUrl}/api/profile`;
        method = 'POST';
        console.log("🆕 Creating new profile");
      }
      
      console.log("🌐 Making API request to:", url);
      console.log("🌐 Method:", method);
      
      const response = await makeApiRequest(url, {
        method: method,
        body: formData,
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Submit response is not JSON:', contentType);
          throw new Error('Server returned non-JSON response');
        }

        const result = await response.json();
        console.log("✅ Success response:", result);
        
        if (result.success && result.profile) {
          const profile: ExistingProfile = result.profile;
          const { id, resume, resumeUrl, createdAt, updatedAt, ...profileData } = profile;
          
          // Update local state with response data
          setData(profileData);
          setResumeFile(resume);
          setProfileId(id);
          setIsSubmitted(true);
          setProfileExists(true);
          
          // Clear selected file after successful submission
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Show success message
          const action = profileExists ? 'updated' : 'created';
          setError(null);
          alert(`✅ Profile ${action} successfully!`);
          
          // Force status update immediately
          setTimeout(() => {
            updateProfileStatus();
          }, 100);
        } else {
          console.error("❌ Invalid response format:", result);
          setError('Invalid response from server');
        }
      } else {
        let errorText = '';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = response.statusText || 'Unknown error';
        }
        
        console.error("❌ Error response:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Handle specific error cases
        if (response.status === 409) {
          setError('Profile already exists. Please try updating instead.');
        } else if (response.status === 404) {
          setError('Profile not found. Please try creating a new profile.');
        } else if (response.status === 400) {
          setError(`Validation Error: ${errorText}`);
        } else if (response.status === 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError(`Error: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
        }
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to server. Please check if the API is running.');
        } else {
          setError(`Network error: ${error.message}`);
        }
      } else {
        setError('Network error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user can access certain features
  const canAccessFeature = (feature: string): boolean => {
    switch (feature) {
      case 'exclusions':
        return profileStatus.requiredFieldsFilled;
      case 'skills':
        return profileStatus.requiredFieldsFilled && profileStatus.resumeUploaded;
      case 'experience':
        return profileStatus.completed;
      default:
        return true;
    }
  };

  // Function to handle tab switching with restrictions
  const handleTabChange = (tab: string) => {
    const featureMap: { [key: string]: string } = {
      'Exclusions': 'exclusions',
      'Skills': 'skills',
      'Experience': 'experience'
    };

    if (featureMap[tab] && !canAccessFeature(featureMap[tab])) {
      alert(`⚠️ Please complete your profile to access ${tab}. Fill required fields, upload resume, and submit your profile.`);
      return;
    }

    setActiveTab(tab);
  };

  const calculateGrowthExpectation = (current: string, expected: string) => {
    const currentNum = parseInt(current.replace(/[^\d]/g, ''));
    const expectedNum = parseInt(expected.replace(/[^\d]/g, ''));
    if (currentNum > 0) {
      return Math.round(((expectedNum - currentNum) / currentNum) * 100);
    }
    return 0;
  };

  // Show loading state
  if (loading && !data.email) {
    return (
      <div className="min-h-screen rounded-xl p-4 ml-6 -mt-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
          <p className="text-sm text-gray-500 mt-2">API URL: {api_baseUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen rounded-xl p-4 ml-6 -mt-2 flex">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl backdrop-blur-md">
            <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl text-white py-8">
              <h1 className="text-3xl ml-8 font-bold flex justify-center items-center gap-2">
                <UserCog className="w-10 h-10" /> Shape Your Job Profile
              </h1>
              <p className="text-sm justify-center items-center ml-8">Customize and optimize your job application preferences to match your dream role.</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-8 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <div className="flex items-center">
                  <span className="font-medium">Error:</span>
                  <span className="ml-2">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="mx-8 mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span>Processing...</span>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 m-8">
              <div className="flex space-x-6">
                {['Personal Details', 'Exclusions', 'Skills', 'Experience'].map((tab) => {
                  const isLocked = tab !== 'Personal Details' && !canAccessFeature(tab.toLowerCase());
                  return (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      disabled={isLocked}
                      className={`px-4 py-2 font-semibold transition-all relative ${
                        activeTab === tab
                          ? 'border-b-2 border-blue-500 text-blue-700'
                          : isLocked
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:text-blue-500'
                      }`}
                    >
                      {tab}
                      {isLocked && (
                        <span className="ml-1 text-xs">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Display */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-sm m-8 border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-gray-800">Profile Status:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    profileStatus.completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {profileStatus.completed ? 'Complete' : 'Incomplete'}
                  </span>
                  {profileExists && (
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Profile ID: {profileId}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-gray-600">
                  {profileStatus.lastUpdated && (
                    <div>Last updated: {new Date(profileStatus.lastUpdated).toLocaleString()}</div>
                  )}
                   
                </div>
              </div>
            </div>

            {activeTab === 'Personal Details' && (
              <div className="p-6 space-y-6">
                {/* Resume Upload */}
                {!resumeFile ? (
                  <div className="p-6 border rounded-xl border-blue-900 border-dashed">
                    <Upload className="w-12 h-12 text-blue-900 mx-auto mb-4" />
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                    <label htmlFor="resume-upload" className="cursor-pointer text-blue-400 hover:text-blue-900 font-medium text-center block">
                      Click to upload your resume
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gradient-to-r from-indigo-800 to-purple-800 p-4 rounded-xl text-white">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{resumeFile}</p>
                        <p className="text-sm text-blue-200">
                          {selectedFile ? 'New file selected' : 'Previously uploaded'} • Ready to submit
                        </p>
                      </div>
                    </div>
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <Upload className="w-5 h-5 opacity-60 hover:opacity-100" />
                    </label>
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                  </div>
                )}

                {/* Input Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {['firstName', 'lastName', 'email', 'experience', 'city', 'age', 'noticePeriod'].map((field) => (
                    <div key={field} className="flex flex-col">
                      <label className="mb-2 text-sm font-medium text-black">
                        {field === 'experience' ? 'Experience (Years)' : field === 'noticePeriod' ? 'Notice Period (In Days)' : field.charAt(0).toUpperCase() + field.slice(1)}{' '}
                        {requiredFields.includes(field) && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        id={field}
                        name={field}
                        type={field === 'email' ? 'email' : 'text'}
                        value={data[field as keyof ProfileData]}
                        onChange={handleChange}
                        className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                        disabled={loading}
                      />
                    </div>
                  ))}

                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Phone <span className="text-red-400">*</span></label>
                    <PhoneInput
                      country={'us'}
                      value={data.phone}
                      onChange={(phone) => setData(prev => ({ ...prev, phone }))}
                      disabled={loading}
                      inputStyle={{ 
                        width: '100%', 
                        height: '48px', 
                        borderRadius: '8px', 
                        border: '1px solid #00000055', 
                        paddingLeft: '48px',
                        opacity: loading ? 0.5 : 1
                      }}
                      containerStyle={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Salaries + Growth Expectation */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {['currentSalary', 'expectedSalary'].map((field) => (
                    <div key={field} className="flex-1 flex flex-col">
                      <label className="mb-2 text-sm font-medium text-black">
                        {field === 'currentSalary' ? 'Current Salary' : 'Expected Salary'} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={data[field as keyof ProfileData]}
                        onChange={handleChange}
                        className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                      />
                    </div>
                  ))}
                  <div className="w-24 h-14 rounded-xl bg-gray-200 flex flex-col items-center justify-center shadow text-orange-600 font-semibold text-xs text-center mt-[34px]">
                    <span className="text-xs flex-row text-orange-800 font-medium">Growth EX.</span>
                    <span className="text-xl font-bold">
                      {calculateGrowthExpectation(data.currentSalary, data.expectedSalary)}%
                    </span>
                  </div>
                </div>

                {/* Gender + Citizenship */}
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                  <div className="flex-1 flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Gender</label>
                    <select name="gender" value={data.gender} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Citizenship</label>
                    <select name="citizenship" value={data.citizenship} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black">
                      <option value="">Select citizenship status</option>
                      <option value="citizen">Citizen</option>
                      <option value="visa">Visa</option>
                      <option value="permanent-resident">Permanent Resident</option>
                    </select>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-medium text-black">Additional Information</label>
                  <textarea name="additionalInfo" value={data.additionalInfo} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black min-h-[100px]" />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit} 
                  disabled={!profileStatus.requiredFieldsFilled || !profileStatus.resumeUploaded}
                  className={`w-full mt-6 py-3 rounded-lg font-bold transition-all ${
                    profileStatus.requiredFieldsFilled && profileStatus.resumeUploaded
                      ? 'bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  {profileExists ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            )}

            {activeTab === 'Exclusions' && (
              <div className="text-gray-700">
                {canAccessFeature('exclusions') ? (
                  <FilterSettingsConfigs />
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-semibold mb-2">Feature Locked</h3>
                    <p className="text-gray-600">Complete your basic profile to access exclusion settings.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Skills' && (
              <div className="text-gray-700">
                {canAccessFeature('skills') ? (
                  <SkillsManager />
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-semibold mb-2">Feature Locked</h3>
                    <p className="text-gray-600">Complete your profile and upload resume to access skills management.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'Experience' && (
              <div className="text-gray-700">
                {canAccessFeature('experience') ? (
                  <ExperienceManager />
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-semibold mb-2">Feature Locked</h3>
                    <p className="text-gray-600">Complete and submit your entire profile to access experience management.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar with Profile Status */}
      <div className="w-90 h-[50%] rounded-2xl mr-4 mt-8 bg-gradient-to-r from-indigo-600 to-purple-800 backdrop-blur-md border-lg border-gray-700/50 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Job Profile Status</h2>
          <p className="text-gray-300 text-sm">Access full features after completing your profile.</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profileStatus.requiredFieldsFilled ? 'bg-green-500' : 'bg-white'}`}>
              {profileStatus.requiredFieldsFilled ? <Check className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Fill required fields</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profileStatus.resumeUploaded ? 'bg-green-500' : 'bg-white'}`}>
              {profileStatus.resumeUploaded ? <Check className="w-4 h-4 text-white" /> : <Upload className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Upload resume</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profileStatus.submitted ? 'bg-green-500' : 'bg-white'}`}>
              {profileStatus.submitted ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Submit your profile</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profileStatus.completed ? 'bg-green-500' : 'bg-white'}`}>
              {profileStatus.completed ? <Check className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Profile Complete</span>
          </div>
        </div>

        <div className="flex justify-end mb-6 -mt-40">
          <div className="relative w-32 h-32">
            <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45"
                stroke="#4B5563"
                strokeWidth="10"
                fill="none"
              />
              {/* Progress Circle */}
              <circle
                cx="50%"
                cy="50%"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="10"
                fill="none"
                strokeDasharray="283"
                strokeDashoffset={`${283 - (calculateProgress() / 100) * 283}`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-xs text-gray-300">Profile</span>
              <span className="text-xs text-gray-300">Completion</span>
              <span className="text-xl font-bold">{calculateProgress()}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBuilder;