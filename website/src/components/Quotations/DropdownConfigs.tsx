import React, { useEffect, useState, useCallback } from 'react';
import { SendHorizonal, Trash2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

interface DropdownOption {
  value: string;
  selected: boolean;
}

interface DropdownConfig {
  id?: number;
  email?: string;
  placeholderIncludes: string;
  count: number;
  options: DropdownOption[];
  createdAt?: string;
  updatedAt?: string;
}

const EXTENSION_ID = 'edejolphacgbhddjeoomiadkgfaocjcj';

const isChromeExtension = () =>
  typeof chrome !== 'undefined' &&
  chrome.runtime !== undefined &&
  typeof chrome.runtime.sendMessage === 'function';

const DropdownConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<DropdownConfig[]>([]);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [updated, setUpdated] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated-newest' | 'updated-oldest'>('newest');
  const [userEmail, setUserEmail] = useState<string>('');
  
  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5006";

  // Load user email from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.email) {
          setUserEmail(userData.email);
        }
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        setError('Failed to load user information');
      }
    }
  }, []);

  // Fetch dropdown configurations based on email
  const fetchDropdownConfigs = useCallback(async (email: string) => {
    if (!email) {
      console.log('No email provided, skipping fetch');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Fetching data for email:', email);

      // Encode email to handle special characters
      const encodedEmail = encodeURIComponent(email);
      
      const response = await fetch(`${api_baseUrl}/api/dropdowns/configs/${encodedEmail}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      console.log('Backend response:', data);

      if (data.success) {
        const configsWithEmail = data.data.map((config: DropdownConfig) => ({
          ...config,
          email: email, // Ensure email is always present
          createdAt: config.createdAt || new Date().toISOString(),
          updatedAt: config.updatedAt || config.createdAt || new Date().toISOString(),
        }));
        
        setConfigs(configsWithEmail);
        console.log(`Successfully loaded ${configsWithEmail.length} configurations`);
      } else {
        console.error('Backend returned error:', data.error);
        setError(data.error || 'Failed to fetch configurations');
        setConfigs([]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch dropdown configurations');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [api_baseUrl]);

  // Sync with Chrome extension and then fetch from backend
  const syncWithExtension = useCallback(async () => {
    if (!userEmail) return;

    if (isChromeExtension()) {
      console.log('Syncing with Chrome extension...');
      
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { from: 'website', action: 'getFormControlData' },
        async (response) => {
          if (chrome.runtime.lastError) {
            console.error('Chrome extension error:', chrome.runtime.lastError.message);
            // Still fetch from backend even if extension fails
            fetchDropdownConfigs(userEmail);
            return;
          }

          console.log('Chrome extension response:', response);

          if (response?.success && response.data?.dropdowns) {
            const extensionConfigs = response.data.dropdowns.map((config: DropdownConfig) => ({
              ...config,
              email: userEmail,
              createdAt: config.createdAt || new Date().toISOString(),
              updatedAt: config.updatedAt || config.createdAt || new Date().toISOString(),
            }));

            console.log('Processed extension configs:', extensionConfigs);

            // Save extension data to backend
            try {
              const syncResponse = await fetch(`${api_baseUrl}/api/dropdowns/save-configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  email: userEmail, 
                  configs: extensionConfigs 
                }),
              });

              const syncData = await syncResponse.json();
              console.log('Sync response:', syncData);

              if (syncData.success) {
                console.log('Successfully synced with backend');
              } else {
                console.error('Backend sync failed:', syncData.error);
              }
            } catch (syncErr) {
              console.error('Sync error:', syncErr);
            }
          }

          // Always fetch latest from backend after sync attempt
          fetchDropdownConfigs(userEmail);
        }
      );
    } else {
      // Not in Chrome extension, just fetch from backend
      console.log('Not in Chrome extension, fetching from backend only');
      fetchDropdownConfigs(userEmail);
    }
  }, [userEmail, fetchDropdownConfigs, api_baseUrl]);

  // Initial data load when userEmail is available
  useEffect(() => {
    if (userEmail) {
      syncWithExtension();
    }
  }, [userEmail, syncWithExtension]);

  const handleChange = async (placeholder: string, selectedValue: string) => {
    const updated = configs.map(config => {
      if (config.placeholderIncludes === placeholder) {
        const updatedOptions = config.options.map(option => ({
          ...option,
          selected: option.value === selectedValue,
        }));

        return {
          ...config,
          options: updatedOptions,
          updatedAt: new Date().toISOString(),
        };
      }
      return config;
    });

    setConfigs(updated);
    setUpdating(prev => ({ ...prev, [placeholder]: true }));
    setUpdated(prev => ({ ...prev, [placeholder]: false }));

    // Update Chrome extension
    if (isChromeExtension()) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          from: 'website',
          action: 'updateDropdownValue',
          data: { placeholder, selectedValue },
        },
        (response) => {
          if (!response?.success) {
            console.error('Failed to update dropdown in extension');
          }
        }
      );
    }

    // Update backend
    try {
      const response = await fetch(`${api_baseUrl}/api/dropdowns/save-configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          configs: updated
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Update successful');
        setTimeout(() => {
          setUpdating(prev => ({ ...prev, [placeholder]: false }));
          setUpdated(prev => ({ ...prev, [placeholder]: true }));
        }, 800);
      } else {
        console.error('Update failed:', data.error);
        setError('Failed to update configuration');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update configuration');
    } finally {
      setTimeout(() => {
        setUpdating(prev => ({ ...prev, [placeholder]: false }));
      }, 800);
    }
  };

  const handleDelete = async (placeholder: string) => {
    const filtered = configs.filter(config => config.placeholderIncludes !== placeholder);
    setConfigs(filtered);

    // Delete from Chrome extension
    if (isChromeExtension()) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          from: 'website',
          action: 'deleteDropdownConfig',
          data: placeholder,
        },
        (response) => {
          if (!response?.success) {
            console.error('Failed to delete dropdown config from extension');
          }
        }
      );
    }

    // Delete from backend
    try {
      const response = await fetch(`${api_baseUrl}/api/dropdowns/delete/${encodeURIComponent(placeholder)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Delete successful');
      } else {
        console.error('Delete failed:', data.error);
        setError('Failed to delete configuration');
        // Restore the deleted item if backend delete failed
        setConfigs(configs);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete configuration');
      // Restore the deleted item if request failed
      setConfigs(configs);
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

  const handleRefresh = useCallback(() => {
    if (userEmail) {
      syncWithExtension();
    }
  }, [userEmail, syncWithExtension]);

  return (
    <div className="p-6">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* User Email Display */}
      {/* {userEmail ? (
        <div className="mb-4 p-3 w-[43%] bg-blue-50 rounded-lg flex items-center gap-2">
          <User className="w-4 h-4 text-blue-700" />
          <p className="text-sm text-blue-700">
            Dropdown configurations for: <span className="font-semibold">{userEmail}</span>
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">No user email found. Please log in to view configurations.</p>
        </div>
      )} */}

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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {sortedConfigs.length} dropdown configuration{sortedConfigs.length !== 1 ? 's' : ''}
        </p>
        {loading && (
          <p className="text-sm text-blue-600">Loading configurations...</p>
        )}
      </div>

      {/* Configs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-500">Loading dropdown configurations...</p>
          </div>
        ) : sortedConfigs.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <p className="text-gray-500">
              {userEmail ? 'No dropdown configurations found for this email.' : 'Please log in to view configurations.'}
            </p>
            {userEmail && (
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Refreshing
              </button>
            )}
          </div>
        ) : (
          sortedConfigs.map(config => {
            const currentValue = config.options.find(opt => opt.selected)?.value || '';
            const configKey = `${config.email}-${config.placeholderIncludes}`;
            
            return (
              <div
                key={configKey}
                className={`border-l-4 bg-gray-50 p-4 rounded-xl shadow text-left relative transition transform hover:-translate-y-1 ${
                  config.options.some(opt => opt.selected) ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <h3 className="text-blue-700 font-semibold mb-2">{config.placeholderIncludes}</h3>
                <p className="text-sm text-gray-600 mb-2">Counter: {config.count}</p>

                <div className="flex items-center gap-2 mb-2">
                  <select
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={currentValue}
                    onChange={e => handleChange(config.placeholderIncludes, e.target.value)}
                    disabled={updating[config.placeholderIncludes]}
                  >
                    {config.options.map((option, idx) => (
                      <option key={idx} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                  {updating[config.placeholderIncludes] && (
                    <span className="text-sm text-blue-500">Updating...</span>
                  )}
                  {updated[config.placeholderIncludes] && (
                    <span className="text-green-500 text-sm">✔ Updated</span>
                  )}
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button
                    disabled={updating[config.placeholderIncludes]}
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
                  <p>Created: {new Date(config.createdAt || '').toLocaleString()}</p>
                </div>
                <div className="text-xs text-gray-500 text-right italic -mt-4">
                  <p>Last updated: {new Date(config.updatedAt || config.createdAt || '').toLocaleString()}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DropdownConfigs;