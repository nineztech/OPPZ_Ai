import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FieldConfig {
  placeholderIncludes: string;
  defaultValue: string;
  count: number;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SelectiveUnansweredPopupProps {
  userEmail?: string;
  enabled?: boolean;
  onNavigateToInputs?: () => void;
}

const SelectiveUnansweredPopup: React.FC<SelectiveUnansweredPopupProps> = ({ 
  userEmail, 
  enabled = false,
  onNavigateToInputs 
}) => {
  const [configs, setConfigs] = useState<FieldConfig[]>([]);
  const [showUnansweredPopup, setShowUnansweredPopup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastDismissedTime, setLastDismissedTime] = useState<number>(0);
  
  const popupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  
  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5006";

  // Calculate unanswered questions
  const getUnansweredCount = useCallback(() => {
    return configs.filter(config => !config.defaultValue || config.defaultValue.trim() === '').length;
  }, [configs]);

  // Load configs from backend
  const loadConfigsFromBackend = useCallback(async () => {
    if (!userEmail || !enabled) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${api_baseUrl}/api/inputs/get-inputconfigs?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfigs(data.configs || []);
          lastCheckRef.current = Date.now();
        }
      }
    } catch (error) {
      console.error('Error loading configs from backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api_baseUrl, userEmail, enabled]);

  // Function to check and show popup if there are unanswered questions
  const checkAndShowPopup = useCallback(() => {
    if (!userEmail || !enabled || isLoading) return;
    
    const unansweredCount = configs.filter(
      config => !config.defaultValue || config.defaultValue.trim() === ''
    ).length;
    
    // Only show popup if there are unanswered questions AND it's been at least 30 minutes since last dismissal
    const timeSinceLastDismissed = Date.now() - lastDismissedTime;
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (unansweredCount > 0 && timeSinceLastDismissed > thirtyMinutes) {
      setShowUnansweredPopup(true);
    }
  }, [configs, userEmail, enabled, isLoading, lastDismissedTime]);



  // Handle dismissing the popup (remind me later or X button)
  const handleDismissPopup = useCallback(() => {
    setShowUnansweredPopup(false);
    setLastDismissedTime(Date.now()); // Record when popup was dismissed
  }, []);

  // Setup interval and initial load
  useEffect(() => {
    // Clear existing interval
    if (popupIntervalRef.current) {
      clearInterval(popupIntervalRef.current);
      popupIntervalRef.current = null;
    }

    // Only setup if enabled on this page
    if (userEmail && enabled) {
      // Load configs initially
      loadConfigsFromBackend();
      
      // Set up interval to check every 30 minutes (fixed the timing)
      popupIntervalRef.current = setInterval(() => {
        // Reload configs first to get latest data
        loadConfigsFromBackend().then(() => {
          // Then check if popup should be shown
          setTimeout(checkAndShowPopup, 1000);
        });
      }, 30 * 60 * 1000); // 30 minutes
    }

    // Cleanup function
    return () => {
      if (popupIntervalRef.current) {
        clearInterval(popupIntervalRef.current);
        popupIntervalRef.current = null;
      }
    };
  }, [userEmail, enabled, loadConfigsFromBackend, checkAndShowPopup]);

  // Show popup initially when configs are loaded and have unanswered questions
  useEffect(() => {
    if (configs.length > 0 && userEmail && enabled) {
      const timeSinceLastCheck = Date.now() - lastCheckRef.current;
      const timeSinceLastDismissed = Date.now() - lastDismissedTime;
      const thirtyMinutes = 30 * 60 * 1000;
      
      // Only show popup if it's been less than 5 minutes since loading (initial load)
      // AND it's been more than 30 minutes since last dismissal
      if (timeSinceLastCheck < 5 * 60 * 1000 && timeSinceLastDismissed > thirtyMinutes) {
        checkAndShowPopup();
      }
    }
  }, [configs, userEmail, enabled, checkAndShowPopup, lastDismissedTime]);

  const unansweredCount = getUnansweredCount();

  // Don't render anything if disabled, no user email, or no unanswered questions
  if (!enabled || !userEmail || unansweredCount === 0) {
    return null;
  }

  return (
    <>
      {/* Floating notification indicator */}
      {unansweredCount > 0 && !showUnansweredPopup && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowUnansweredPopup(true)}
            className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="bg-white text-red-500 px-2 py-1 rounded-full text-xs font-bold">
              {unansweredCount}
            </span>
          </button>
        </div>
      )}

      {/* Main Popup Modal */}
      {showUnansweredPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-800">Unanswered Questions</h2>
              </div>
              <button
                onClick={() => {
                  handleDismissPopup();
                  setLastDismissedTime(Date.now());
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                You have <span className="font-bold text-red-600">{unansweredCount}</span> unanswered question{unansweredCount !== 1 ? 's' : ''} in your Quotation Library Input Configuration.
              </p>
              <p className="text-sm text-gray-500">
                Complete your form configurations to improve your auto-fill experience with OPPZ-Ai auto Application.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowUnansweredPopup(false);
                  setLastDismissedTime(Date.now());
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Remind me later
              </button>
              <button
                onClick={() => {
                  setShowUnansweredPopup(false);
                  setLastDismissedTime(Date.now());
                  if (onNavigateToInputs) {
                    onNavigateToInputs();
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Complete Now
              </button>
            </div>

             
          </div>
        </div>
      )}
    </>
  );
};

// Hook for easy usage in specific pages
export const useUnansweredPopup = (enableOnThisPage: boolean = false) => {
  const [userEmail, setUserEmail] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserEmail(userData.email);
    }
  }, []);

  const handleNavigateToInputs = () => {
    // Hide popup-related state changes happen in the popup itself
    navigate('/MainPage');
  };

  return {
    userEmail,
    enabled: enableOnThisPage,
    onNavigateToInputs: handleNavigateToInputs,
  };
};

   

// Example usage: Profile Page WITH popup
export const ProfilePageWithPopup: React.FC = () => {
  const popupProps = useUnansweredPopup(true);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profile Page (With Popup)</h1>
      <p className="mb-4 text-green-600 font-medium">✅ This page WILL show the unanswered questions popup</p>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
        <p>Your profile content goes here...</p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
        </div>
      </div>

      {/* Add the popup component */}
      <SelectiveUnansweredPopup {...popupProps} />
    </div>
  );
};

// Example usage: Dashboard Page WITHOUT popup
export const DashboardPageWithoutPopup: React.FC = () => {
  const popupProps = useUnansweredPopup(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard (No Popup)</h1>
      <p className="mb-4 text-red-600 font-medium">❌ This page will NOT show the popup</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-semibold">Widget 1</h3>
          <p>Dashboard content...</p>
        </div>
        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-semibold">Widget 2</h3>
          <p>More dashboard content...</p>
        </div>
      </div>

      <SelectiveUnansweredPopup {...popupProps} />
    </div>
  );
};

// Example usage: Settings Page WITH popup
export const SettingsPageWithPopup: React.FC = () => {
  const popupProps = useUnansweredPopup(true);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings Page (With Popup)</h1>
      <p className="mb-4 text-green-600 font-medium">✅ This page WILL show the unanswered questions popup</p>
      
      <div className="space-y-6 mt-8">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Account Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Enable notifications
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Auto-save changes
            </label>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Privacy Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Make profile public
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Allow data collection
            </label>
          </div>
        </div>
      </div>

      <SelectiveUnansweredPopup {...popupProps} />
    </div>
  );
};

// Component to demonstrate all pages together
export const PageDemonstration: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'profile' | 'dashboard' | 'settings'>('profile');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'profile':
        return <ProfilePageWithPopup />;
      case 'dashboard':
        return <DashboardPageWithoutPopup />;
      case 'settings':
        return <SettingsPageWithPopup />;
      default:
        return <ProfilePageWithPopup />;
    }
  };

  return (
    <div>
      {/* Navigation */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setCurrentPage('profile')}
            className={`px-4 py-2 rounded transition-colors ${
              currentPage === 'profile' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            Profile (With Popup)
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-4 py-2 rounded transition-colors ${
              currentPage === 'dashboard' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            Dashboard (No Popup)
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className={`px-4 py-2 rounded transition-colors ${
              currentPage === 'settings' ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            Settings (With Popup)
          </button>
        </div>
      </div>

      {/* Current Page Content */}
      {renderCurrentPage()}
    </div>
  );
};

export default SelectiveUnansweredPopup;