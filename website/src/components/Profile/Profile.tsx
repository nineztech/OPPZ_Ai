import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Check, UserCog, Upload, User, Save } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import FilterSettingsConfigs from './FilterSettingsConfig';
import SkillsManager from './Skills';
import ExperienceManager from './Experiance';

// Types
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

interface ExtensionSyncResult {
  success: boolean;
  totalFields: number;
  successCount: number;
  failedCount: number;
  failedFields: string[];
  results: Array<{
    field: string;
    success: boolean;
    error?: string;
  }>;
}

// Constants
const EXTENSION_ID = 'hmjkmddeonifkflejbicnapamlfejdim';
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUEST_TIMEOUT = 30000; // 30 seconds

const placeholderMap: Record<string, string> = {
  YearsOfExperience: 'Years of Experience',
  FirstName: 'First Name',
  LastName: 'Last Name',
  PhoneNumber: 'Phone Number',
  City: 'City',
  Email: 'Email',
};

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

// Utility Functions
const isChromeExtension = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.chrome !== 'undefined' &&
    window.chrome.runtime &&
    typeof window.chrome.runtime.sendMessage === 'function'
  );
};

const isExtensionAvailable = async (extensionId: string): Promise<boolean> => {
  if (!isChromeExtension()) {
    console.log('❌ Chrome extension API not available');
    return false;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      chrome.runtime.sendMessage(
        extensionId,
        { action: 'ping', from: 'website' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log('❌ Extension not responding:', chrome.runtime.lastError.message);
            reject(chrome.runtime.lastError);
          } else {
            console.log('✅ Extension is available and responding');
            resolve();
          }
        }
      );
    });
    return true;
  } catch (error) {
    console.log('❌ Extension availability check failed:', error);
    return false;
  }
};

const sendDataToExtension = async (profileData: ProfileData): Promise<ExtensionSyncResult> => {
  console.log('🚀 === STARTING EXTENSION SYNC ===');
  console.log('📦 Profile data to send:', profileData);

  if (!isChromeExtension()) {
    console.warn('❌ Not in Chrome Extension environment');
    return { success: false, totalFields: 0, successCount: 0, failedCount: 0, failedFields: [], results: [] };
  }

  const extensionAvailable = await isExtensionAvailable(EXTENSION_ID);
  if (!extensionAvailable) {
    console.warn('❌ Extension not available or not responding');
    return { success: false, totalFields: 0, successCount: 0, failedCount: 0, failedFields: [], results: [] };
  }

  const defaultFieldData = {
    FirstName: profileData.firstName || '',
    LastName: profileData.lastName || '',
    Email: profileData.email || '',
    PhoneNumber: profileData.phone || '',
    City: profileData.city || '',
    YearsOfExperience: profileData.experience || '',
  };

  console.log('📤 Sending data to extension:', defaultFieldData);

  // Store in chrome storage if available
  try {
    if (chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ defaultFields: defaultFieldData });
      console.log('✅ Data saved to chrome storage');
    }
  } catch (storageError) {
    console.warn('⚠️ Chrome storage not available:', storageError);
  }

  const results: Array<{ field: string; success: boolean; error?: string }> = [];

  // Process each field sequentially
  for (const [key, value] of Object.entries(defaultFieldData)) {
    const placeholderIncludes = placeholderMap[key];
    
    if (!value || value.trim() === '') {
      console.log(`⏭️ Skipping empty field: ${key}`);
      results.push({ field: key, success: false, error: 'Empty value' });
      continue;
    }

    const fieldConfig = {
      placeholder: placeholderIncludes,
      value: value.toString().trim(),
      fieldName: key
    };

    console.log(`📤 [${key}] Sending to extension:`, fieldConfig);

    try {
      const response = await new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Extension request timeout'));
        }, 5000);

        chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            from: 'website',
            action: 'updateInputFieldValue',
            data: fieldConfig,
            timestamp: Date.now()
          },
          (response) => {
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
              console.error(`❌ [${key}] Extension error:`, chrome.runtime.lastError.message);
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              console.log(`✅ [${key}] Extension response:`, response);
              resolve(response);
            }
          }
        );
      });

      const success = response && (response.success === true || response.status === 'success');
      results.push({ field: key, success });
      
      console.log(`${success ? '✅' : '❌'} [${key}] Field ${success ? 'sent successfully' : 'failed'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ field: key, success: false, error: errorMessage });
      console.error(`❌ [${key}] Error sending field:`, errorMessage);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  const successCount = results.filter(r => r.success).length;
  const failedFields = results.filter(r => !r.success);
  
  console.log(`📊 Extension sync summary: ${successCount}/${results.length} fields sent successfully`);
  
  if (failedFields.length > 0) {
    console.warn('❌ Failed fields:', failedFields.map(f => `${f.field}: ${f.error}`));
  }

  return {
    success: successCount > 0,
    totalFields: results.length,
    successCount,
    failedCount: failedFields.length,
    results,
    failedFields: failedFields.map(f => f.field)
  };
};

// Custom Hooks
const useApiBaseUrl = () => {
  return useMemo(() => {
    const envUrl = process.env.REACT_APP_API_BASE_URL;
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }
    
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return "http://localhost:5006";
    }
    
    const isProduction = protocol === 'https:';
    if (isProduction) {
  console.log('Running in production environment');
}
    const productionPatterns = [
      `${protocol}//api.${currentHost}`,
      `${protocol}//${currentHost}/api`,
      `${protocol}//backend.${currentHost}`,
      `${protocol}//${currentHost.replace('www.', 'api.')}`,
    ];
    
    return productionPatterns[0];
  }, []);
};

const useLocalStorage = (key: string, defaultValue: any = null) => {
  const getValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  }, [key, defaultValue]);

  const setValue = useCallback((value: any) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [getValue, setValue] as const;
};

// API Helper
const makeApiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'string') {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Content-Type': 'application/json',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log('Making API request:', { url, method: options.method || 'GET' });

    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('API response received:', { status: response.status, url: response.url });
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API request failed:', { url, error: error instanceof Error ? error.message : error });
    throw error;
  }
};

// Validation Helpers
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Please select a PDF, DOC, or DOCX file.' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size must be less than 5MB.' };
  }
  
  return { isValid: true };
};

const isFieldFilled = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return !isNaN(value);
  return Boolean(value);
};

// Components
const SyncButton: React.FC<{
  isExtensionSyncing: boolean;
  profileStatus: ProfileStatus;
  onSync: () => void;
}> = ({ isExtensionSyncing, profileStatus, onSync }) => {
  if (!isChromeExtension()) return null;
  
  return (
    <button
      onClick={onSync}
      disabled={isExtensionSyncing || !profileStatus.requiredFieldsFilled}
      className={`w-18 p-2 mt-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
        profileStatus.requiredFieldsFilled && !isExtensionSyncing
          ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white'
          : 'bg-gray-400 text-gray-700 cursor-not-allowed'
      }`}
    >
      {isExtensionSyncing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Syncing...
        </>
      ) : (
        <>
          <Upload className="w-4 h-4" />
          Sync with Extension
        </>
      )}
    </button>
  );
};
 

// const ExtensionSyncStatus: React.FC<{
//   status: string;
//   isExtensionSyncing: boolean;
// }> = ({ status, isExtensionSyncing }) => {
//   if (!status) return null;

//   return (
//     <div className="mt-4 mx-8 text-sm text-blue-800 bg-blue-100 border border-blue-300 rounded p-3">
//       {isExtensionSyncing ? (
//         <span className="flex items-center gap-2">
//           <span className="animate-spin w-4 h-4 border-b-2 border-blue-600 rounded-full" />
//           Syncing with extension...
//         </span>
//       ) : (
//         status
//       )}
//     </div>
//   );
// };

// const ProfileProgress: React.FC<{ progress: number }> = ({ progress }) => (
//   <div className="relative w-32 h-32">
//     <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
//       <circle cx="50%" cy="50%" r="45" stroke="#4B5563" strokeWidth="10" fill="none" />
//       <circle
//         cx="50%"
//         cy="50%"
//         r="45"
//         stroke="url(#gradient)"
//         strokeWidth="10"
//         fill="none"
//         strokeDasharray="283"
//         strokeDashoffset={`${283 - (progress / 100) * 283}`}
//         strokeLinecap="round"
//       />
//       <defs>
//         <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor="#a855f7" />
//           <stop offset="100%" stopColor="#ec4899" />
//         </linearGradient>
//       </defs>
//     </svg>
//     <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
//       <span className="text-xs text-gray-300">Profile</span>
//       <span className="text-xs text-gray-300">Completion</span>
//       <span className="text-xl font-bold">{progress}%</span>
//     </div>
//   </div>
// );

// Main Component
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
  const [emailInitial, setEmailInitial] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    completed: false,
    timestamp: 0,
    lastUpdated: '',
    requiredFieldsFilled: false,
    resumeUploaded: false,
    submitted: false
  });
  const [extensionSyncStatus, setExtensionSyncStatus] = useState<string>('');
  const [isExtensionSyncing, setIsExtensionSyncing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const api_baseUrl = useApiBaseUrl();
  const [getStoredStatus, setStoredStatus] = useLocalStorage('profileStatus');
  const [getStoredUser] = useLocalStorage('user');

  const requiredFields = useMemo(() => [
    'firstName', 'lastName', 'email', 'experience', 'city', 'phone', 'currentSalary', 'expectedSalary'
  ], []);

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
    setStoredStatus(statusData);

    // Dispatch custom event
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('profileStatusChanged', { detail: statusData }));
      }
    } catch (error) {
      console.warn('Custom event dispatch failed:', error);
    }

    return statusData;
  }, [data, resumeFile, selectedFile, profileExists, isSubmitted, requiredFields, setStoredStatus]);

  const handleExtensionSync = useCallback(async () => {
    console.log('🔄 Starting extension sync...');
    
    setIsExtensionSyncing(true);
    setExtensionSyncStatus('Checking extension availability...');
    
    try {
      if (!isChromeExtension()) {
        setExtensionSyncStatus('❌ Chrome extension environment not detected');
        return;
      }

      setExtensionSyncStatus('Connecting to extension...');
      
      const extensionAvailable = await isExtensionAvailable(EXTENSION_ID);
      if (!extensionAvailable) {
        setExtensionSyncStatus('❌ Extension not installed or not responding');
        return;
      }

      setExtensionSyncStatus('Syncing profile data...');
      
      const results = await sendDataToExtension(data);
      
      if (results.success) {
        if (results.failedCount === 0) {
          setExtensionSyncStatus('✅ All fields synced successfully with extension!');
        } else {
          setExtensionSyncStatus(
            `⚠️ ${results.successCount}/${results.totalFields} fields synced. Failed: ${results.failedFields.join(', ')}`
          );
        }
      } else {
        setExtensionSyncStatus('❌ Failed to sync any fields with extension');
      }
    } catch (error) {
      console.error('❌ Extension sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setExtensionSyncStatus(`❌ Extension sync failed: ${errorMessage}`);
    } finally {
      setIsExtensionSyncing(false);
      
      // Clear status after 8 seconds
      setTimeout(() => {
        setExtensionSyncStatus('');
      }, 8000);
    }
  }, [data]);

  const loadProfile = useCallback(async () => {
    console.log('🔄 Starting profile load process...');
    setLoading(true);
    setError(null);
    
    try {
      // Load from localStorage
      const storedStatus = getStoredStatus();
      if (storedStatus) {
        setProfileStatus(storedStatus);
        console.log('📦 Loaded status from localStorage:', storedStatus);
      }

      // Get user email
      const storedUser = getStoredUser();
      const userEmail = storedUser?.email;
      
      if (!userEmail) {
        console.log("❌ No user email found in localStorage");
        setProfileExists(false);
        setProfileId(null);
        setIsSubmitted(false);
        return;
      }

      console.log("🔍 Loading profile for email:", userEmail);
      
      const encodedEmail = encodeURIComponent(userEmail);
      const profileUrl = `${api_baseUrl}/api/profile/email/${encodedEmail}`;
      
      const response = await makeApiRequest(profileUrl, { method: 'GET' });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
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
          
          console.log("✅ Profile loaded successfully");
        } else {
          console.log("❌ Profile not found in response");
          setProfileExists(false);
          setProfileId(null);
          setIsSubmitted(false);
        }
      } else if (response.status === 404) {
        console.log("ℹ️ Profile not found (404)");
        setProfileExists(false);
        setProfileId(null);
        setIsSubmitted(false);
      } else {
        let errorText = response.statusText;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          // Use default error text
        }
        
        console.error("❌ Profile fetch failed:", { status: response.status, errorText });
        setError(`Failed to load profile: ${response.status} ${errorText}`);
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
  }, [api_baseUrl, getStoredStatus, getStoredUser]);

  // Load profile on component mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Set initial email
  useEffect(() => {
    const storedUser = getStoredUser();
    const email = storedUser?.email;
    if (email) {
      setEmailInitial(email);
      setData(prev => ({ ...prev, email }));
    }
  }, [getStoredUser]);

  // Update status when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateProfileStatus();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [data, resumeFile, selectedFile, profileExists, isSubmitted, updateProfileStatus]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  }, []);

   const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("📎 File upload handler called, file:", file);
    
    if (file) {
      const validation = validateFile(file);
      if (!validation.isValid) {
        alert(`⚠️ ${validation.error}`);
        e.target.value = '';
        setSelectedFile(null);
        setResumeFile(null);
        return;
      }
      
      setSelectedFile(file);
      setResumeFile(file.name);
      console.log("✅ File set successfully:", file.name);
    } else {
      console.log("❌ No file selected");
      setSelectedFile(null);
      setResumeFile(null);
    }
  }, []);

   const calculateProgress = useCallback(() => {
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
    
    const totalFields = requiredFields.length + optionalFields.length + 1;
    return Math.round((filled / totalFields) * 100);
  }, [data, resumeFile, selectedFile, profileExists, requiredFields]);

 const handleSubmit = useCallback(async () => {
  console.log("🚀 === STARTING PROFILE SUBMISSION ===");
  
  setLoading(true);
  setError(null);
  
  // Enhanced validation with detailed error messages
  const validationErrors = [];
  
  // Check required fields
  const missingFields = requiredFields.filter(field => {
    const value = data[field as keyof ProfileData];
    return !isFieldFilled(value);
  });
  
  if (missingFields.length > 0) {
    validationErrors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Enhanced resume validation
  if (!resumeFile) {
    validationErrors.push('Resume is required');
  } else if (!selectedFile && !profileExists) {
    validationErrors.push('Please upload your resume');
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    validationErrors.push('Please enter a valid email address');
  }
  
  // Phone validation (basic check)
  if (data.phone && data.phone.length < 10) {
    validationErrors.push('Please enter a valid phone number');
  }
  
  // Experience validation
  if (data.experience) {
    const experienceNum = parseInt(data.experience);
    if (isNaN(experienceNum) || experienceNum < 0 || experienceNum > 50) {
      validationErrors.push('Experience must be a number between 0 and 50');
    }
  }
  
  // Age validation
  if (data.age) {
    const ageNum = parseInt(data.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      validationErrors.push('Age must be a number between 18 and 100');
    }
  }
  
  // Notice period validation
  if (data.noticePeriod) {
    const noticePeriodNum = parseInt(data.noticePeriod);
    if (isNaN(noticePeriodNum) || noticePeriodNum < 0 || noticePeriodNum > 365) {
      validationErrors.push('Notice period must be a number between 0 and 365 days');
    }
  }
  
  // Salary validation
  if (data.currentSalary) {
    const currentSalaryNum = parseInt(data.currentSalary.replace(/[^\d]/g, ''));
    if (isNaN(currentSalaryNum) || currentSalaryNum < 0) {
      validationErrors.push('Current salary must be a valid positive number');
    }
  }
  
  if (data.expectedSalary) {
    const expectedSalaryNum = parseInt(data.expectedSalary.replace(/[^\d]/g, ''));
    if (isNaN(expectedSalaryNum) || expectedSalaryNum < 0) {
      validationErrors.push('Expected salary must be a valid positive number');
    }
  }
  
  // Display validation errors
  if (validationErrors.length > 0) {
    const errorMessage = validationErrors.join('\n• ');
    setError(`Please fix the following issues:\n• ${errorMessage}`);
    setLoading(false);
    return;
  }
  
  // File validation if new file selected
  if (selectedFile) {
    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error!);
      setLoading(false);
      return;
    }
  }
  
  // Prepare form data
  const formData = new FormData();
  
  // Clean and prepare data
  const cleanedData = {
    ...data,
    // Ensure email is lowercase and trimmed
    email: data.email.toLowerCase().trim(),
    // Ensure phone is properly formatted
    phone: data.phone.replace(/\D/g, ''), // Remove non-digits
    // Ensure numeric fields are properly formatted
    experience: data.experience ? parseInt(data.experience).toString() : '',
    age: data.age ? parseInt(data.age).toString() : '',
    noticePeriod: data.noticePeriod ? parseInt(data.noticePeriod).toString() : '',
    // Clean salary fields
    currentSalary: data.currentSalary.replace(/[^\d]/g, ''),
    expectedSalary: data.expectedSalary.replace(/[^\d]/g, ''),
    // Trim text fields
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    city: data.city.trim(),
    additionalInfo: data.additionalInfo.trim(),
  };
  
  formData.append('data', JSON.stringify(cleanedData));
  
  // Add file if selected
  if (selectedFile) {
    formData.append('resume', selectedFile);
  }
  
  // Add metadata
  formData.append('metadata', JSON.stringify({
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    source: 'web-app',
    version: '1.0.0'
  }));
  
  try {
    // Determine endpoint and method
    const url = profileExists && profileId 
      ? `${api_baseUrl}/api/profile/${profileId}`
      : `${api_baseUrl}/api/profile`;
    const method = profileExists && profileId ? 'PUT' : 'POST';
    
    console.log(`${profileExists ? '🔄 Updating' : '🆕 Creating'} profile at ${url}`);
    console.log('📦 Sending data:', Object.keys(cleanedData));
    console.log('📎 File attached:', !!selectedFile);
    
    // Make API request with enhanced error handling
    const response = await makeApiRequest(url, {
      method,
      body: formData,
    });
    
    // Handle response
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const result = await response.json();
      console.log("✅ Success response:", result);
      
      // Validate response structure
      if (!result.success) {
        throw new Error(result.message || 'Server returned unsuccessful response');
      }
      
      if (!result.profile) {
        throw new Error('Profile data not returned from server');
      }
      
      // Update component state with response data
      const profile: ExistingProfile = result.profile;
      const { id, resume, resumeUrl, createdAt, updatedAt, ...profileData } = profile;
      
      // Update all state
      setData(profileData);
      setResumeFile(resume);
      setProfileId(id);
      setIsSubmitted(true);
      setProfileExists(true);
      
      // Clear file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Success feedback
      const action = profileExists ? 'updated' : 'created';
      setError(null);
      
      // Show success message
      const successMessage = `✅ Profile ${action} successfully!`;
      alert(successMessage);
      
      // Update profile status
      setTimeout(() => {
        updateProfileStatus();
      }, 100);
      
      // Auto-sync with extension if available
      if (isChromeExtension()) {
  const fieldsToSend = {
    FirstName: cleanedData.firstName,
    LastName: cleanedData.lastName,
    Email: cleanedData.email,
    PhoneNumber: cleanedData.phone,
    City: cleanedData.city,
    YearsOfExperience: cleanedData.experience
  };

  const placeholderMap = {
    FirstName: 'First Name',
    LastName: 'Last Name',
    Email: 'Email',
    PhoneNumber: 'Phone Number',
    City: 'City',
    YearsOfExperience: 'Years of Experience'
  };

  const EXTENSION_ID = 'hmjkmddeonifkflejbicnapamlfejdim';

  console.log('📤 Sending fields to extension:', fieldsToSend);

  for (const [key, value] of Object.entries(fieldsToSend)) {
    const fieldConfig = {
      placeholder: placeholderMap[key as keyof typeof placeholderMap],
      value
    };

    try {
      await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          {
            from: 'website',
            action: 'updateInputFieldValue',
            data: fieldConfig
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(`❌ [${key}] Failed to sync:`, chrome.runtime.lastError.message);
              reject(chrome.runtime.lastError);
            } else {
              console.log(`✅ [${key}] Synced with extension`, response);
              resolve();
            }
          }
        );
      });

      await new Promise(res => setTimeout(res, 100));
    } catch (err) {
      console.error(`❌ Extension error for ${key}:`, err);
    }
  }

  console.log('✅ All available fields sent to extension');
}

      
      console.log(`✅ Profile ${action} completed successfully`);
      
    } else {
      // Handle HTTP errors
      let errorMessage = 'Unknown error occurred';
      let serverResponse = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          serverResponse = await response.json();
          errorMessage = serverResponse.message || serverResponse.error || 'Server error';
        } else {
          errorMessage = await response.text() || response.statusText;
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      console.error("❌ Error response:", {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        serverResponse
      });
      
      // Handle specific HTTP status codes
      switch (response.status) {
        case 400:
          setError(`Validation Error: ${errorMessage}`);
          break;
        case 401:
          setError('Authentication failed. Please login again.');
          break;
        case 403:
          setError('Access denied. You don\'t have permission to perform this action.');
          break;
        case 404:
          if (profileExists) {
            setError('Profile not found. It may have been deleted. Please create a new profile.');
            setProfileExists(false);
            setProfileId(null);
          } else {
            setError('API endpoint not found. Please check your connection.');
          }
          break;
        case 409:
          setError('Profile already exists with this email. Please try updating instead.');
          break;
        case 413:
          setError('File too large. Please upload a smaller resume file.');
          break;
        case 422:
          setError(`Data validation failed: ${errorMessage}`);
          break;
        case 429:
          setError('Too many requests. Please wait a moment and try again.');
          break;
        case 500:
          setError('Server error occurred. Please try again later.');
          break;
        case 502:
        case 503:
        case 504:
          setError('Server is temporarily unavailable. Please try again later.');
          break;
        default:
          setError(`Error ${response.status}: ${errorMessage}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Network/Request error:", error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection and ensure the API is running.');
      } else if (error.message.includes('NetworkError')) {
        setError('Network error occurred. Please check your connection.');
      } else if (error.message.includes('CORS')) {
        setError('Cross-origin request blocked. Please contact support.');
      } else {
        setError(`Request failed: ${error.message}`);
      }
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
    console.log("🏁 Profile submission process completed");
  }
}, [
  data,
  resumeFile,
  selectedFile,
  profileExists,
  profileId,
  requiredFields,
  api_baseUrl,
  updateProfileStatus,
  fileInputRef
]
); 

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
          {/* <p className="text-sm text-gray-500 mt-2">API URL: {api_baseUrl}</p> */}
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
                {/* {emailInitial && <p>Email from login/signup: {emailInitial}</p>} */}
              </h1>
              <p className="text-sm justify-center items-center ml-8">Customize and optimize your job application preferences to match your dream role.</p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-8 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <div className="flex items-center">
                  <span className="font-medium">Error:</span>
                  <span className="ml-2">{error}</span>
                   <p>Logged in as: {emailInitial}</p>
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
                  {['firstName', 'lastName', 'email/Username','experience', 'city', 'age', 'noticePeriod'].map((field) => (
                    <div key={field} className="flex flex-col">
                      <label className="mb-2 text-sm font-medium text-black">
                        {field === 'experience' ? 'Experience (Years)' : field === 'noticePeriod' ? 'Notice Period (In Days)' : field.charAt(0).toUpperCase() + field.slice(1)}{' '}
                        {requiredFields.includes(field) && <span className="text-red-400">*</span>}
                      </label>
                     {field === 'email/Username' ? (
                       <input
                       id={field}
                       name={field}
                       type="email"
                       value={data.email} // coming from useState
                       readOnly
                       className="bg-gray-100 border border-black/35 rounded-lg px-4 py-3 text-black cursor-not-allowed"
                      />
                    ) : (
                      <input
                      id={field}
                      name={field}
                      type="text"
                      value={data[field as keyof ProfileData]}
                      onChange={handleChange}
                     className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                     disabled={loading}
                       />
             )}

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
                {/* Extension Sync Button */}
<SyncButton
  isExtensionSyncing={isExtensionSyncing}
  profileStatus={profileStatus}
  onSync={handleExtensionSync}
/>

                {extensionSyncStatus && (
  <div className="mt-4 mx-8 text-sm text-blue-800 bg-blue-100 border border-blue-300 rounded p-3">
    {isExtensionSyncing ? (
      <span className="flex items-center gap-2">
        <span className="animate-spin w-4 h-4 border-b-2 border-blue-600 rounded-full" />
        Syncing with extension...
      </span>
    ) : (
      extensionSyncStatus
    )}
  </div>
)}

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