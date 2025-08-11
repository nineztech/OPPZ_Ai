import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SendHorizonal, Trash2, ArrowUp, ArrowDown, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface FieldConfig {
  placeholderIncludes: string;
  defaultValue: string;
  count: number;
  email: string; // Added email field
  createdAt?: string;
  updatedAt?: string;
}

const EXTENSION_ID = 'edejolphacgbhddjeoomiadkgfaocjcj'; // Replace with your actual extension ID

const isChromeExtension = () =>
  typeof chrome !== 'undefined' &&
  chrome.runtime !== undefined &&
  typeof chrome.runtime.sendMessage === 'function';

const InputFieldConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<FieldConfig[]>([]);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [updated, setUpdated] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated-newest' | 'updated-oldest'>('newest');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [extensionStatus, setExtensionStatus] = useState<'checking' | 'available' | 'not-responding' | 'not-installed'>('checking');
  const [showUnansweredPopup, setShowUnansweredPopup] = useState<boolean>(false);
  const [hasShownPopupForCurrentSession, setHasShownPopupForCurrentSession] = useState<boolean>(false);
  
  const popupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUnansweredCountRef = useRef<number>(0);
  
  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5006";

  // Calculate unanswered questions (red line questions - without default values)
  const getUnansweredCount = useCallback(() => {
    return configs.filter(config => !config.defaultValue || config.defaultValue.trim() === '').length;
  }, [configs]);

  // Function to show popup if there are unanswered questions (only once per session)
  const checkAndShowPopup = useCallback(() => {
    const unansweredCount = configs.filter(
      config => !config.defaultValue || config.defaultValue.trim() === ''
    ).length;
    
    // Only show popup if:
    // 1. There are unanswered questions
    // 2. We haven't shown the popup for this session yet
    // 3. The number of unanswered questions has increased (new questions added)
    if (unansweredCount > 0 && 
        (!hasShownPopupForCurrentSession || unansweredCount > previousUnansweredCountRef.current)) {
      setShowUnansweredPopup(true);
      setHasShownPopupForCurrentSession(true);
      previousUnansweredCountRef.current = unansweredCount;
    }
  }, [configs, hasShownPopupForCurrentSession]);

  // Setup 30-minute interval for popup
  useEffect(() => {
    // Clear existing interval
    if (popupIntervalRef.current) {
      clearInterval(popupIntervalRef.current);
      popupIntervalRef.current = null;
    }

    // Only set up interval if user is logged in and has configs
    if (userEmail && configs.length > 0) {
      const unansweredCount = configs.filter(
        config => !config.defaultValue || config.defaultValue.trim() === ''
      ).length;

      // Show popup immediately only if we haven't shown it for this session
      if (unansweredCount > 0 && !hasShownPopupForCurrentSession) {
        setShowUnansweredPopup(true);
        setHasShownPopupForCurrentSession(true);
        previousUnansweredCountRef.current = unansweredCount;
      }

      // Set up interval to check every 30 minutes (but still respecting the one-time rule)
      if (unansweredCount > 0) {
        popupIntervalRef.current = setInterval(() => {
          checkAndShowPopup();
        }, 30 * 60 * 1000); // 30 minutes in milliseconds
      }
    }

    // Cleanup function
    return () => {
      if (popupIntervalRef.current) {
        clearInterval(popupIntervalRef.current);
        popupIntervalRef.current = null;
      }
    };
  }, [userEmail, configs, checkAndShowPopup, hasShownPopupForCurrentSession]);

  // Reset popup session state when configs change significantly (like on refresh)
  useEffect(() => {
    const currentUnansweredCount = getUnansweredCount();
    
    // If all questions are now answered, reset the session state
    if (currentUnansweredCount === 0) {
      setHasShownPopupForCurrentSession(false);
      previousUnansweredCountRef.current = 0;
    }
  }, [configs, getUnansweredCount]);

  // Memoize the loadConfigsFromBackend function
  const loadConfigsFromBackend = useCallback(async () => {
    if (!userEmail) return;
    
    try {
      const response = await fetch(`${api_baseUrl}/api/inputs/get-inputconfigs?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConfigs(data.configs || []);
        }
      }
    } catch (error) {
      console.error('Error loading configs from backend:', error);
    }
  }, [api_baseUrl, userEmail]);

  // Memoize the syncConfigsWithBackend function
  const syncConfigsWithBackend = useCallback(async (extensionConfigs: FieldConfig[]) => {
    try {
      const response = await fetch(`${api_baseUrl}/api/inputs/save-inputconfigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extensionConfigs),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfigs(extensionConfigs);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }, [api_baseUrl]);

  // Memoize the checkExtensionStatus function
  const checkExtensionStatus = useCallback(() => {
    if (!userEmail) return;
    
    if (!isChromeExtension()) {
      setExtensionStatus('not-installed');
      return;
    }

    // Set a timeout to detect if extension doesn't respond
    const timeoutId = setTimeout(() => {
      setExtensionStatus('not-responding');
    }, 3000); // 3 second timeout

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { from: 'website', action: 'getFormControlData' },
      (response) => {
        clearTimeout(timeoutId);
        
        if (chrome.runtime.lastError) {
          console.error('Extension Error:', chrome.runtime.lastError.message);
          setExtensionStatus('not-responding');
          return;
        }

        if (response?.success) {
          setExtensionStatus('available');
          const enrichedData = (response.data.inputFieldConfigs || []).map(
            (config: Omit<FieldConfig, 'email'>) => {
              const now = new Date().toISOString();
              return {
                ...config,
                email: userEmail, // Add email field
                createdAt: config.createdAt || now,
                updatedAt: config.updatedAt || config.createdAt || now,
              };
            }
          );
          
          // Sync with backend
          syncConfigsWithBackend(enrichedData);
        } else {
          setExtensionStatus('not-responding');
        }
      }
    );
  }, [userEmail, syncConfigsWithBackend]);

  useEffect(() => {
    // Load user email from local storage or auth system
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserEmail(userData.email);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadConfigsFromBackend();
      checkExtensionStatus();
    }
  }, [userEmail, loadConfigsFromBackend, checkExtensionStatus]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Reset popup session state on refresh to allow popup to show again if there are still unanswered questions
    setHasShownPopupForCurrentSession(false);
    previousUnansweredCountRef.current = 0;
    
    try {
      // First try to load from backend
      await loadConfigsFromBackend();
      
      // Then check extension status and try to sync
      if (isChromeExtension()) {
        const timeoutId = setTimeout(() => {
          setExtensionStatus('not-responding');
          setIsRefreshing(false);
        }, 3000);

        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { from: 'website', action: 'getFormControlData' },
          (response) => {
            clearTimeout(timeoutId);
            
            if (chrome.runtime.lastError) {
              console.error('Extension Error:', chrome.runtime.lastError.message);
              setExtensionStatus('not-responding');
              setIsRefreshing(false);
              return;
            }

            if (response?.success) {
              setExtensionStatus('available');
              const enrichedData = (response.data.inputFieldConfigs || []).map(
                (config: Omit<FieldConfig, 'email'>) => {
                  const now = new Date().toISOString();
                  return {
                    ...config,
                    email: userEmail,
                    createdAt: config.createdAt || now,
                    updatedAt: config.updatedAt || config.createdAt || now,
                  };
                }
              );
              
              // Sync with backend
              syncConfigsWithBackend(enrichedData);
            } else {
              setExtensionStatus('not-responding');
            }
            setIsRefreshing(false);
          }
        );
      } else {
        setExtensionStatus('not-installed');
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setIsRefreshing(false);
    }
  }, [loadConfigsFromBackend, syncConfigsWithBackend, userEmail]);

  const handleUpdate = async (placeholder: string, value: string) => {
    if (!value.trim()) return;

    setUpdating(prev => ({ ...prev, [placeholder]: true }));

    try {
      // Update in backend first
      const response = await fetch(`${api_baseUrl}/api/inputs/update-inputconfig`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeholderIncludes: placeholder,
          selectedValue: value,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          const updatedConfigs = configs.map(config =>
            config.placeholderIncludes === placeholder
              ? {
                  ...config,
                  defaultValue: value,
                  updatedAt: new Date().toISOString(),
                }
              : config
          );
          setConfigs(updatedConfigs);

          // Update extension if available
          if (extensionStatus === 'available') {
            chrome.runtime.sendMessage(
              EXTENSION_ID,
              {
                from: 'website',
                action: 'updateInputFieldValue',
                data: { placeholder, value },
              },
              (response) => {
                if (!response?.success) {
                  console.error('Failed to update extension');
                }
              }
            );
          }

          // Show success indicator
          setUpdated(prev => ({ ...prev, [placeholder]: true }));
          setTimeout(() => {
            setUpdated(prev => ({ ...prev, [placeholder]: false }));
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setUpdating(prev => ({ ...prev, [placeholder]: false }));
    }
  };

  const handleDelete = async (placeholder: string) => {
    try {
      // Delete from backend first
      const response = await fetch(`${api_baseUrl}/api/inputs/delete-inputconfig/${encodeURIComponent(placeholder)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setConfigs(prev => prev.filter(config => config.placeholderIncludes !== placeholder));

          // Delete from extension if available
          if (extensionStatus === 'available') {
            chrome.runtime.sendMessage(
              EXTENSION_ID,
              {
                from: 'website',
                action: 'deleteInputFieldConfig',
                data: placeholder,
              },
              (response) => {
                if (!response?.success) {
                  console.error('Failed to delete from extension');
                }
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getSortedConfigs = () => {
    const sortedConfigs = [...configs];
    
    switch (sortBy) {
      case 'newest':
        return sortedConfigs.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
      case 'oldest':
        return sortedConfigs.sort((a, b) => 
          new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
        );
      case 'updated-newest':
        return sortedConfigs.sort((a, b) => 
          new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime()
        );
      case 'updated-oldest':
        return sortedConfigs.sort((a, b) => 
          new Date(a.updatedAt || '').getTime() - new Date(b.updatedAt || '').getTime()
        );
      default:
        return sortedConfigs;
    }
  };

  const sortedConfigs = getSortedConfigs();
  const unansweredCount = getUnansweredCount();

  return (
    <div className="p-6">
      {/* Unanswered Questions Popup */}
      {showUnansweredPopup && unansweredCount > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-800">Unanswered Questions</h2>
              </div>
              <button
                onClick={() => setShowUnansweredPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                You have <span className="font-bold text-red-600">{unansweredCount}</span> unanswered question{unansweredCount !== 1 ? 's' : ''} that need attention.
              </p>
              <p className="text-sm text-gray-500">
                Questions without default values are marked with a red line. Please provide answers to improve your form filling experience.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnansweredPopup(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Remind me later
              </button>
              <button
                onClick={() => {
                  setShowUnansweredPopup(false);
                  // Scroll to first unanswered question
                  const firstUnanswered = configs.find(config => !config.defaultValue || config.defaultValue.trim() === '');
                  if (firstUnanswered) {
                    setTimeout(() => {
                      const element = document.querySelector(`[data-placeholder="${firstUnanswered.placeholderIncludes}"]`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Answer Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Bar */}
      {configs.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{configs.length}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{configs.length - unansweredCount}</div>
                <div className="text-sm text-gray-600">Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{unansweredCount}</div>
                <div className="text-sm text-gray-600">Unanswered</div>
              </div>
            </div>
            
            {unansweredCount > 0 && (
              <button
                onClick={() => setShowUnansweredPopup(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Review Unanswered</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex items-center h-12 w-28 border rounded-full gap-2">
          <span className="text-lg font-medium mx-auto text-gray-700">Filter</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1 w-28 h-12 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'newest' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowDown className="inline w-3 h-3 mr-1" />
           Newest
          </button>
          
          <button
            onClick={() => setSortBy('oldest')}
            className={`px-3 py-1 w-28 h-12 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'oldest' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowUp className="inline w-3 h-3 mr-1" />
            Oldest
          </button>
          
          <button
            onClick={() => setSortBy('updated-newest')}
            className={`px-3 py-1 w-28 h-12 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'updated-newest' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowDown className="inline w-3 h-3 mr-1" />
            Updated
          </button>
          
          <button
            onClick={() => setSortBy('updated-oldest')}
            className={`px-3 py-1 w-28 h-12 rounded-full text-sm font-medium transition-colors ${
              sortBy === 'updated-oldest' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowUp className="inline w-3 h-3 mr-1" />
           Initial
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {sortedConfigs.length} configuration{sortedConfigs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Configs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedConfigs.length === 0 ? (
          <div className="col-span-2 text-center">
            <p className="text-gray-500 mb-4">No input field configurations found From Extension. please Login to Your Extension.</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            {extensionStatus === 'checking' && (
              <p className="text-sm text-gray-500 mt-2">Checking extension status...</p>
            )}
          </div>
        ) : (
          sortedConfigs.map(config => (
            <div
              key={config.placeholderIncludes}
              data-placeholder={config.placeholderIncludes}
              className={`border-l-4 bg-gray-50 p-4 rounded-xl shadow text-left relative transition transform hover:-translate-y-1 ${
                config.defaultValue?.trim() ? 'border-green-500' : 'border-red-500'
              }`}
            >
              {!config.defaultValue?.trim() && (
                <div className="absolute top-2 right-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              )}
              
              <h3 className="text-blue-700 w-[83%] font-semibold mb-2">
                {config.placeholderIncludes}
              </h3>
              <p className="text-sm text-gray-600 whitespace-nowrap">Counter: {config.count}</p>

              <div className="flex items-center gap-2 mb-2 mt-2">
                <input
                  type="text"
                  value={editValues[config.placeholderIncludes] ?? config.defaultValue}
                  onChange={e => {
                    const value = e.target.value;
                    setEditValues(prev => ({
                      ...prev,
                      [config.placeholderIncludes]: value,
                    }));
                    setUpdated(prev => ({
                      ...prev,
                      [config.placeholderIncludes]: false,
                    }));
                  }}
                  className="flex-1 p-2 border rounded"
                  placeholder="New Default Value"
                />
                {updated[config.placeholderIncludes] && (
                  <span className="text-green-500 text-xs">✔ Updated</span>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  disabled={updating[config.placeholderIncludes]}
                  onClick={() => {
                    const value = editValues[config.placeholderIncludes] ?? config.defaultValue;
                    handleUpdate(config.placeholderIncludes, value);
                  }}
                  className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
                >
                  <SendHorizonal className="inline w-4 h-4 mr-1" />
                  {updating[config.placeholderIncludes] ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => handleDelete(config.placeholderIncludes)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  <Trash2 className="inline w-4 h-4" />
                </button>
              </div>
              
              <div className="text-xs text-gray-500 italic mt-2">
                <p>
                  Created on:{' '}
                  {config.createdAt ? new Date(config.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <div className="text-xs text-gray-500 italic text-right -mt-4">
                <p>
                  Last updated:{' '}
                  {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : '—'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InputFieldConfigs;