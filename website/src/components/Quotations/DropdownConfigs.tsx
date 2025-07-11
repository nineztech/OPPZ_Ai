import React, { useEffect, useState } from 'react';
import { SendHorizonal, Trash2, Filter, ArrowUp, ArrowDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  selected: boolean;
}

interface DropdownConfig {
  placeholderIncludes: string;
  count: number;
  options: DropdownOption[];
  createdAt?: string;
  updatedAt?: string;
}

const EXTENSION_ID = 'hmjkmddeonifkflejbicnapamlfejdim';

const isChromeExtension = () =>
  typeof chrome !== 'undefined' &&
  chrome.runtime !== undefined &&
  typeof chrome.runtime.sendMessage === 'function';

const DropdownConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<DropdownConfig[]>([]);
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [updated, setUpdated] = useState<{ [key: string]: boolean }>({});
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'updated-newest' | 'updated-oldest'>('newest');

  useEffect(() => {
    if (!isChromeExtension()) return;

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { from: 'website', action: 'getFormControlData' },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
          return;
        }

        if (response?.success) {
          const updatedConfigs = (response.data.dropdowns || []).map((config: DropdownConfig) => ({
            ...config,
            createdAt: config.createdAt ?? new Date().toISOString(),
            updatedAt: config.updatedAt ?? config.createdAt ?? new Date().toISOString(),
          }));
          setConfigs(updatedConfigs);
        }
      }
    );
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
            console.error('Failed to update dropdown');
          }
          setTimeout(() => {
            setUpdating(prev => ({ ...prev, [placeholder]: false }));
            setUpdated(prev => ({ ...prev, [placeholder]: true }));
          }, 800);
        }
      );
    }
  };

  const handleDelete = (placeholder: string) => {
    const filtered = configs.filter(config => config.placeholderIncludes !== placeholder);
    setConfigs(filtered);

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
            console.error('Failed to delete dropdown config');
          }
        }
      );
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

  return (
    <div className="p-6">
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
          Showing {sortedConfigs.length} dropdown configuration{sortedConfigs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Configs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedConfigs.length === 0 ? (
          <p className="text-gray-500 col-span-2 text-center">No dropdown configurations found.</p>
        ) : (
          sortedConfigs.map(config => {
            const currentValue = config.options.find(opt => opt.selected)?.value || '';
            return (
              <div
                key={config.placeholderIncludes}
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