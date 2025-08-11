import React, { useEffect, useState } from 'react';
import { SendHorizonal, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface RadioOption {
  value: string;
  selected: boolean;
  text?: string;
}

interface RadioConfig {
  placeholderIncludes: string;
  count: number;
  options: RadioOption[];
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

const EXTENSION_ID = 'edejolphacgbhddjeoomiadkgfaocjcj';
const api_baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5006";

const isChromeExtension = () =>
  typeof chrome !== 'undefined' &&
  chrome.runtime !== undefined &&
  typeof chrome.runtime.sendMessage === 'function';

const RadioButtonConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<RadioConfig[]>([]);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [updated, setUpdated] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated-newest' | 'updated-oldest'>('newest');
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Function to fetch configs from backend
  const fetchConfigsFromBackend = async (email: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${api_baseUrl}/api/radiobuttons/get-radioconfigs?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.configs || []);
      } else {
        setError(data.message || 'Failed to fetch configurations');
      }
    } catch (err) {
      console.error('Failed to fetch configs from backend:', err);
      setError('Failed to fetch configurations from server');
    } finally {
      setLoading(false);
    }
  };

  // Function to sync with extension
  const syncWithExtension = async (email: string) => {
    if (!isChromeExtension()) return;

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { from: 'website', action: 'getFormControlData' },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.error('Extension error:', chrome.runtime.lastError.message);
          return;
        }

        if (response?.success) {
          const updatedConfigs = (response.data.radioButtons || []).map((config: RadioConfig) => ({
            ...config,
            email: email,
            createdAt: config.createdAt ?? new Date().toISOString(),
            updatedAt: config.updatedAt ?? new Date().toISOString(),
          }));
          
          // Update local state
          setConfigs(updatedConfigs);

          // Save to backend to keep them in sync
          try {
            await fetch(`${api_baseUrl}/api/radiobuttons/save-radioconfigs`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(updatedConfigs)
            });
          } catch (err) {
            console.error('Failed to sync with backend:', err);
          }
        }
      }
    );
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserEmail(userData.email);

      // First, try to fetch from backend
      fetchConfigsFromBackend(userData.email);
      
      // Also sync with extension if available
      syncWithExtension(userData.email);
    }
  }, []);

  const handleChange = (placeholder: string, selectedValue: string) => {
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

    // Update extension if available
    if (isChromeExtension()) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          from: 'website',
          action: 'updateRadioButtonValue',
          data: { placeholder, value: selectedValue },
        },
        async (response) => {
          if (!response?.success) {
            console.error('Extension update failed');
          }
        }
      );
    }

    // Update backend
    const updateBackend = async () => {
      try {
        await fetch(`${api_baseUrl}/api/radiobuttons/update-radioconfig`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            placeholderIncludes: placeholder,
            selectedValue,
            email: userEmail,
            updatedAt: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('Backend update failed:', err);
        setError('Failed to update configuration');
      }

      setTimeout(() => {
        setUpdating(prev => ({ ...prev, [placeholder]: false }));
        setUpdated(prev => ({ ...prev, [placeholder]: true }));
      }, 800);
    };

    updateBackend();
  };

  const handleDelete = (placeholder: string) => {
    const filtered = configs.filter(config => config.placeholderIncludes !== placeholder);
    setConfigs(filtered);

    // Delete from extension if available
    if (isChromeExtension()) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          from: 'website',
          action: 'deleteRadioButtonConfig',
          data: placeholder,
        },
        async (response) => {
          if (!response?.success) {
            console.error('Extension delete failed');
          }
        }
      );
    }

    // Delete from backend
    const deleteFromBackend = async () => {
      try {
        await fetch(`${api_baseUrl}/api/radiobuttons/delete-radioconfig/${encodeURIComponent(placeholder)}?email=${encodeURIComponent(userEmail)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Backend delete failed:', err);
        setError('Failed to delete configuration');
      }
    };

    deleteFromBackend();
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

  return (
    <div className="p-6">
      
      {/* {userEmail && (
        <div className="mb-4 p-3 w-full max-w-2xl bg-blue-50 rounded-lg flex justify-between items-center">
          <p className="text-sm text-blue-700">
            Radio button configurations for: <span className="font-semibold">{userEmail}</span>
          </p>
           
        </div>
      )} */}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Loading configurations...</p>
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
          Showing {sortedConfigs.length} radio button configuration{sortedConfigs.length !== 1 ? 's' : ''}
        </p>
      </div>
      

      {/* Configs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedConfigs.length === 0 && !loading ? (
          <p className="text-gray-500 col-span-2 text-center">No radio button configurations found.</p>
        ) : (
          sortedConfigs.map(config => {
            return (
              <div
                key={config.placeholderIncludes}
                className={`border-l-4 bg-gray-50 p-4 rounded-xl shadow text-left relative transition transform hover:-translate-y-1 ${
                  config.options.some(opt => opt.selected) ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <h3 className="text-blue-700 font-semibold mb-2">{config.placeholderIncludes}</h3>
                <p className="text-sm text-gray-600 mb-2">Counter: {config.count}</p>

                <div className="space-y-2 mb-2">
                  {config.options.map((option, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`radio-${config.placeholderIncludes}`}
                        value={option.value}
                        checked={option.selected}
                        onChange={() => handleChange(config.placeholderIncludes, option.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm">{option.text ?? option.value}</span>
                    </label>
                  ))}
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
                
                <div className="flex items-center justify-between text-sm text-gray-500 italic mt-2">
                  <p>Created: {new Date(config.createdAt || '').toLocaleString()}</p>
                  <p>Last updated: {new Date(config.updatedAt || config.createdAt || '').toLocaleString()}</p>
                </div>

                <div className="text-right mt-1 text-sm">
                  {updating[config.placeholderIncludes] && (
                    <span className="text-blue-500">Updating...</span>
                  )}
                  {updated[config.placeholderIncludes] && (
                    <span className="text-green-500">✔ Updated</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RadioButtonConfigs;