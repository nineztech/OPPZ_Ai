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
  { key: 'badWords', label: 'Blocked Keywords (Bad Words)', toggleKey: 'badWordsEnabled' },
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

  const isExtension = () =>
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    typeof chrome.runtime.sendMessage === 'function';

  // ✅ Memoized fetchData to fix dependency warning
  const fetchData = useCallback(() => {
    if (!isExtension()) return;

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { from: 'website', action: 'getFilterSettings' },
      (res) => {
        if (res?.success) {
          const updated: any = {};
          FILTERS.forEach((f) => {
            updated[f.key] = res[f.key] || [];
          });
          setFilters(updated);
          setToggles({
            badWordsEnabled: res.badWordsEnabled,
            titleFilterEnabled: res.titleFilterEnabled,
            titleSkipEnabled: res.titleSkipEnabled,
          });
        }
      }
    );
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendUpdate = (key: string, value: any) => {
    chrome.runtime.sendMessage(EXTENSION_ID, {
      from: 'website',
      action: 'updateFilterSetting',
      key,
      value,
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

  return (
    <div className="p-4 space-y-6 bg-gray-100">
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">Exclusions</h1>

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
    </div>
  );
};

export default FilterSettingsConfigs;
