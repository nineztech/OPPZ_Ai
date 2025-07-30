import React, { useEffect, useState, useCallback } from 'react';
import { Trash2 } from 'lucide-react';

const EXTENSION_ID = 'hmjkmddeonifkflejbicnapamlfejdim'; // Replace with your real one

type FilterKey = 'badWords' | 'titleFilterWords' | 'titleSkipWords';

interface FilterConfig {
  key: FilterKey;
  label: string;
  toggleKey: string;
}

const FILTERS: FilterConfig[] = [
  { key: 'badWords', label: 'Blocked Keywords (Company/Industry)', toggleKey: 'badWordsEnabled' },
  { key: 'titleFilterWords', label: 'Job Title Must Contain', toggleKey: 'titleFilterEnabled' },
  { key: 'titleSkipWords', label: 'Job Title Must Skip', toggleKey: 'titleSkipEnabled' },
];

const FilterSettingsConfigs: React.FC = () => {
  const [filters, setFilters] = useState<Record<FilterKey, string[]>>({
    badWords: [],
    titleFilterWords: [],
    titleSkipWords: [],
  });

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    badWordsEnabled: true,
    titleFilterEnabled: true,
    titleSkipEnabled: true,
  });

  const [editWords, setEditWords] = useState<Record<string, string>>({});
  const [newWord, setNewWord] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<FilterKey>('badWords');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isExtension = () =>
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    typeof chrome.runtime.sendMessage === 'function';

  // ✅ Enhanced fetchData with better error handling and logging
  const fetchData = useCallback(() => {
    if (!isExtension()) {
      setError('Chrome extension API not available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { from: 'website', action: 'getFilterSettings' },
        (response) => {
          // Check for chrome.runtime.lastError
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            setError(`Extension error: ${chrome.runtime.lastError.message}`);
            setIsLoading(false);
            return;
          }

          if (!response) {
            console.error('No response from extension');
            setError('No response from extension - make sure it\'s installed and running');
            setIsLoading(false);
            return;
          }

          if (response.success) {
            console.log('Received data from extension:', response);
            
            const updated: Record<FilterKey, string[]> = {
              badWords: response.badWords || [],
              titleFilterWords: response.titleFilterWords || [],
              titleSkipWords: response.titleSkipWords || [],
            };
            
            setFilters(updated);
            setToggles({
              badWordsEnabled: response.badWordsEnabled ?? true,
              titleFilterEnabled: response.titleFilterEnabled ?? true,
              titleSkipEnabled: response.titleSkipEnabled ?? true,
            });
          } else {
            console.error('Extension returned error:', response.error);
            setError(response.error || 'Failed to load settings from extension');
          }
          
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Error sending message to extension:', err);
      setError('Failed to communicate with extension');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add a small delay to ensure extension is ready
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, [fetchData]);

  const sendUpdate = (key: string, value: any) => {
    if (!isExtension()) return;

    chrome.runtime.sendMessage(EXTENSION_ID, {
      from: 'website',
      action: 'updateFilterSetting',
      key,
      value,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error updating extension:', chrome.runtime.lastError);
        setError(`Update failed: ${chrome.runtime.lastError.message}`);
      } else if (response && !response.success) {
        console.error('Extension update failed:', response.error);
        setError(response.error || 'Failed to update extension');
      }
    });
  };

  const handleToggle = (key: string) => {
    const next = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: next }));
    sendUpdate(key, next);
  };

  const handleUpdateWord = (filterKey: FilterKey, index: number, value: string) => {
    const updated = [...filters[filterKey]];
    updated[index] = value;
    setFilters(prev => ({ ...prev, [filterKey]: updated }));
    sendUpdate(filterKey, updated);
    // Clear the edit state after update
    setEditWords(prev => {
      const newState = { ...prev };
      delete newState[`${filterKey}-${index}`];
      return newState;
    });
  };

  const handleDeleteWord = (filterKey: FilterKey, index: number) => {
    const updated = filters[filterKey].filter((_, i) => i !== index);
    setFilters(prev => ({ ...prev, [filterKey]: updated }));
    sendUpdate(filterKey, updated);
  };

  const handleAddWord = (filterKey: FilterKey) => {
    const word = (newWord[filterKey] || '').trim();
    if (!word || filters[filterKey].includes(word)) return;
    const updated = [...filters[filterKey], word];
    setFilters(prev => ({ ...prev, [filterKey]: updated }));
    sendUpdate(filterKey, updated);
    setNewWord(prev => ({ ...prev, [filterKey]: '' }));
  };

  const currentFilter = FILTERS.find(f => f.key === activeTab);

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 space-y-6 bg-gray-100">
        <div className="flex items-center justify-center p-8">
          <div className="text-lg text-gray-600">Loading extension data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 bg-gray-100">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
          Exclusions
        </h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
          <button
            onClick={fetchData}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Extension Status */}
      <div className="text-sm text-gray-600">
        Extension Status: {isExtension() ? '✅ Available' : '❌ Not Available'}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2 mb-4">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`px-4 py-2 rounded-t-md font-semibold text-sm ${
              activeTab === key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'
            }`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active Tab Panel */}
      {currentFilter && (
        <div className="p-4 border rounded-xl bg-white shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg">{currentFilter.label}</h3>
            <label className="flex items-center gap-2">
              <span className="text-sm">Enable</span>
              <input
                type="checkbox"
                checked={toggles[currentFilter.toggleKey]}
                onChange={() => handleToggle(currentFilter.toggleKey)}
              />
            </label>
          </div>

          <div className="space-y-2">
            {filters[activeTab]?.map((word, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="flex-1 border p-2 rounded"
                  value={editWords[`${activeTab}-${index}`] ?? word}
                  onChange={e =>
                    setEditWords(prev => ({ ...prev, [`${activeTab}-${index}`]: e.target.value }))
                  }
                />
                <button
                  className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                  onClick={() => {
                    const val = editWords[`${activeTab}-${index}`] ?? word;
                    handleUpdateWord(activeTab, index, val);
                  }}
                >
                  Update
                </button>
                <button
                  className="bg-red-500 text-white px-1 py-1 rounded hover:bg-red-600"
                  onClick={() => handleDeleteWord(activeTab, index)}
                >
                  <Trash2 className="inline w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 mt-2">
              <input
                className="flex-1 border p-2 rounded"
                placeholder="Add new word"
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
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (remove in production) */}
      {/* <details className="text-xs text-gray-500">
        <summary>Debug Info (click to expand)</summary>
        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
          {JSON.stringify({ filters, toggles }, null, 2)}
        </pre>
      </details> */}
    </div>
  );
};

export default FilterSettingsConfigs;