import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

type FilterKey = 'badWords' | 'titleFilterWords' | 'titleSkipWords';

interface FilterConfig {
  key: FilterKey;
  label: string;
  toggleKey: string;
  description: string;
  placeholder: string;
}

const FILTERS: FilterConfig[] = [
  {
    key: 'badWords',
    label: 'Blocked Keywords (Company_name/Industry)',
    toggleKey: 'badWordsEnabled',
    description: 'Skip jobs containing these words in job description or company info',
    placeholder: 'e.g., unpaid, internship, temporary'
  },
  {
    key: 'titleFilterWords',
    label: 'Job Title Must Contain',
    toggleKey: 'titleFilterEnabled',
    description: 'Only apply to jobs with titles containing these words',
    placeholder: 'e.g., developer, engineer, manager'
  },
  {
    key: 'titleSkipWords',
    label: 'Job Title Must Skip',
    toggleKey: 'titleSkipEnabled',
    description: 'Skip jobs with titles containing these words',
    placeholder: 'e.g., senior, lead, director'
  },
];

const EXTENSION_ID = 'edejolphacgbhddjeoomiadkgfaocjcj';

const isExtension = () => {
  try {
    return typeof chrome !== 'undefined' &&
      typeof chrome.runtime?.sendMessage === 'function';
  } catch {
    return false;
  }
};

const FilterSettingsConfigs: React.FC = () => {
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>({
    badWords: [],
    titleFilterWords: [],
    titleSkipWords: [],
  });

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    badWordsEnabled: false,
    titleFilterEnabled: false,
    titleSkipEnabled: false,
  });

  const [editWords, setEditWords] = useState<Record<string, string>>({});
  const [newWord, setNewWord] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FilterKey>('badWords');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
   

  const sendMessageToExtension = useCallback((message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!isExtension()) return reject(new Error('Extension not available'));

      const callback = (response: any) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response || response.success === false) {
          return reject(new Error(response?.error || 'Unknown error from extension'));
        }
        resolve(response);
      };

      try {
        if (chrome.runtime.id) {
          chrome.runtime.sendMessage(message, callback);
        } else {
          chrome.runtime.sendMessage(EXTENSION_ID, message, callback);
        }
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('checking');

    try {
      const response = await sendMessageToExtension({
        from: 'website',
        action: 'getFilterSettings'
      });

      setFilters({
        badWords: Array.isArray(response.badWords) ? response.badWords : [],
        titleFilterWords: Array.isArray(response.titleFilterWords) ? response.titleFilterWords : [],
        titleSkipWords: Array.isArray(response.titleSkipWords) ? response.titleSkipWords : [],
      });

      setToggles({
        badWordsEnabled: Boolean(response.badWordsEnabled),
        titleFilterEnabled: Boolean(response.titleFilterEnabled),
        titleSkipEnabled: Boolean(response.titleSkipEnabled),
      });

      setConnectionStatus('connected');
       
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [sendMessageToExtension]);

  const sendUpdate = useCallback(async (key: string, value: any) => {
    try {
      await sendMessageToExtension({
        from: 'website',
        action: 'updateFilterSetting',
        key,
        value,
      });
       
    } catch (err) {
      console.error('Update error:', err);
      setError(`Failed to update ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [sendMessageToExtension]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = useCallback(async (key: string) => {
    const newValue = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newValue }));
    await sendUpdate(key, newValue);
  }, [toggles, sendUpdate]);

  const handleUpdateWord = useCallback(async (filterKey: FilterKey, index: number, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    const updated = [...filters[filterKey]];
    updated[index] = trimmedValue;
    setFilters(prev => ({ ...prev, [filterKey]: updated }));
    setEditWords(prev => {
      const copy = { ...prev };
      delete copy[`${filterKey}-${index}`];
      return copy;
    });

    await sendUpdate(filterKey, updated);
  }, [filters, sendUpdate]);

  const handleDeleteWord = useCallback(async (filterKey: FilterKey, index: number) => {
    const updated = filters[filterKey].filter((_, i) => i !== index);
    setFilters(prev => ({ ...prev, [filterKey]: updated }));
    await sendUpdate(filterKey, updated);
  }, [filters, sendUpdate]);

  const handleAddWord = useCallback(async (filterKey: FilterKey) => {
    const input = newWord[filterKey] || '';
const words = input
  .split(',')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length > 0);

// Filter out duplicates
const current = filters[filterKey].map(w => w.toLowerCase());
const uniqueNewWords = words.filter(w => !current.includes(w));

if (uniqueNewWords.length === 0) {
  setError('All entered words already exist in this filter');
  return;
}

const updated = [...filters[filterKey], ...uniqueNewWords];


   
    setFilters(prev => ({ ...prev, [filterKey]: updated }));
    setNewWord(prev => ({ ...prev, [filterKey]: '' }));
    await sendUpdate(filterKey, updated);
  }, [filters, newWord, sendUpdate]);

  const currentFilter = FILTERS.find(f => f.key === activeTab);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <div className="text-lg text-gray-600">Loading extension data...</div>
            <div className="text-sm text-gray-500 mt-2">Connecting to OPPZ extension...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
             Exclution
          </h1>
           
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
            {connectionStatus === 'checking' && (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-blue-600">Checking...</span>
              </>
            )}
          </div>
          
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <strong>Error:</strong> {error}
              <button
                onClick={() => setError(null)}
                className="ml-4 text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="bg-white w-[38%] rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>Extension Status: {isExtension() ? '✅ Available' : '❌ Not Available'}</div>
          
        </div>
      </div>

      {/* Tabs */}
  <div className="flex gap-2 mt-12 ">
  {FILTERS.map(({ key, label }) => (
    <button
      key={key}
      className={`relative flex-1 px-6 py-3 text-sm font-medium bg-white border-2 transition-all duration-300 ease-in-out
        ${
          activeTab === key
            ? 'bg-gradient-to-r from-indigo-400 to-purple-600 text-white shadow-inner rounded-t-xl'
            : 'text-gray-600 hover:text-blue-600 rounded-t-xl'
        }`}
      onClick={() => setActiveTab(key)}
    >
      {label}

      {/* Top-right badge */}
      <span className="absolute h-6 w-6 -top-1 right-0 bg-blue-500 text-gray-100 text-[10px] px-2 py-0.5 rounded-full shadow-sm">
        {filters[key]?.length || 0}
      </span>
    </button>
  ))}
</div>



   <div className="shadow-lg rounded-b-xl mb-12 bg-white">
        {/* Active Tab Panel */}
        {currentFilter && (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{currentFilter.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{currentFilter.description}</p>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Enable Filter</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={toggles[currentFilter.toggleKey]}
                    onChange={() => handleToggle(currentFilter.toggleKey)}
                    className="sr-only"
                  />
                 <div className={`w-11 h-6 rounded-full shadow-inner transition-colors ${
  toggles[currentFilter.toggleKey] === true
    ? 'bg-blue-500'
    : toggles[currentFilter.toggleKey] === false
    ? 'bg-red-300'
    : 'bg-gray-200'
}`}>

                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      toggles[currentFilter.toggleKey] ? 'translate-x-6' : 'translate-x-1'
                    } mt-1`} />
                  </div>
                </div>
              </label>
            </div>

            {/* Word List */}
            <div className="space-y-3">
              {filters[activeTab]?.map((word, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <input
                    className="flex-1 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editWords[`${activeTab}-${index}`] ?? word}
                    onChange={e =>
                      setEditWords(prev => ({ ...prev, [`${activeTab}-${index}`]: e.target.value }))
                    }
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        const val = editWords[`${activeTab}-${index}`] ?? word;
                        handleUpdateWord(activeTab, index, val);
                      }
                    }}
                  />
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
                    onClick={() => {
                      const val = editWords[`${activeTab}-${index}`] ?? word;
                      handleUpdateWord(activeTab, index, val);
                    }}
                  >
                    Update
                  </button>
                  <button
                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
                    onClick={() => handleDeleteWord(activeTab, index)}
                    title="Delete word"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add New Word */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                <input
                  className="flex-1 border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={currentFilter.placeholder}
                  value={newWord[activeTab] || ''}
                  onChange={e =>
                    setNewWord(prev => ({ ...prev, [activeTab]: e.target.value }))
                  }
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleAddWord(activeTab);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddWord(activeTab)}
                  disabled={!newWord[activeTab]?.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-800 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  + Add Word
                </button>
              </div>

              {/* Empty State */}
              {(!filters[activeTab] || filters[activeTab].length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No {currentFilter.label.toLowerCase()} configured yet.</p>
                  <p className="text-sm mt-1">Add your first word above to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 shadow-lg border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Tips for Better Filtering</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use lowercase words for better matching.</li>
          <li>• Add variations of words (e.g., "dev", "developer", "development").</li>
          <li>• Test with a few jobs first before running auto-apply.</li>
          <li>• Review filtered results regularly to refine your settings.</li>
          <li>• This will consider front-end and front end both differently so kindly enter front or end separately.</li>
        </ul>
      </div>
    </div>
  );
};

export default FilterSettingsConfigs;