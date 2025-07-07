import React, { useEffect, useState } from 'react';
import { SendHorizonal, Trash2 } from 'lucide-react';

interface FieldConfig {
  placeholderIncludes: string;
  defaultValue: string;
  count: number;
  createdAt?: string;
  updatedAt?: string;
}

const EXTENSION_ID = 'gkjemnmlpgdngnchlgnhacembojdfnbm'; // Replace with your actual extension ID

const isChromeExtension = () =>
  typeof chrome !== 'undefined' &&
  chrome.runtime !== undefined &&
  typeof chrome.runtime.sendMessage === 'function';

const InputFieldConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<FieldConfig[]>([]);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [updated, setUpdated] = useState<{ [key: string]: boolean }>({});

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
          const enrichedData = (response.data.inputFieldConfigs || []).map(
            (config: FieldConfig) => {
              const now = new Date().toISOString();
              return {
                ...config,
                createdAt: config.createdAt || now,
                updatedAt: config.updatedAt || config.createdAt || now,
              };
            }
          );
          setConfigs(enrichedData);
        }
      }
    );
  }, []);

  const handleUpdate = (placeholder: string, value: string) => {
    if (!value.trim()) return;

    const updated = configs.map(config =>
      config.placeholderIncludes === placeholder
        ? {
            ...config,
            defaultValue: value,
            updatedAt: new Date().toISOString(),
          }
        : config
    );
    setConfigs(updated);

    if (isChromeExtension()) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          from: 'website',
          action: 'updateInputFieldValue',
          data: { placeholder, value },
        },
        (response) => {
          if (!response?.success) {
            console.error('Failed to update input config');
          }
        }
      );
    }
  };

  const handleDelete = (placeholder: string) => {
    if (isChromeExtension()) {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          from: 'website',
          action: 'deleteInputFieldConfig',
          data: placeholder,
        },
        (response) => {
          if (!response?.success) {
            console.error('Failed to delete input config');
          }
        }
      );
    }

    setConfigs(prev => prev.filter(config => config.placeholderIncludes !== placeholder));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {configs.length === 0 ? (
        <p className="text-gray-500 col-span-2 text-center">No input field configurations found.</p>
      ) : (
        configs.map(config => (
         <div
  key={config.placeholderIncludes}
 className={`border-l-4 bg-gray-50 p-4 rounded-xl shadow text-left relative transition transform hover:-translate-y-1 ${
  config.defaultValue?.trim() ? 'border-green-500' : 'border-red-500'
}`}

>

             

            <h3 className="text-blue-700 w-[83%] font-semibold mb-2 ">
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
              {/* <button
                disabled={updating[config.placeholderIncludes]}
                onClick={() => {
                  const value = editValues[config.placeholderIncludes] ?? config.defaultValue;
                  setUpdating(prev => ({ ...prev, [config.placeholderIncludes]: true }));
                  handleUpdate(config.placeholderIncludes, value);
                  setTimeout(() => {
                    setUpdating(prev => ({ ...prev, [config.placeholderIncludes]: false }));
                    setUpdated(prev => ({ ...prev, [config.placeholderIncludes]: true }));
                  }, 800);
                }}
                className="px-3 py-1 text-sm text-white rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {updating[config.placeholderIncludes] ? 'Updating...' : 'Update'}
              </button> */}
              {updated[config.placeholderIncludes] && (
                <span className="text-green-500 text-xs">✔ Updated</span>
              )}
            </div>
<div className="flex gap-2 justify-end">
              <a
              
                onClick={() => {
                  const value = editValues[config.placeholderIncludes] ?? config.defaultValue;
                  setUpdating(prev => ({ ...prev, [config.placeholderIncludes]: true }));
                  handleUpdate(config.placeholderIncludes, value);
                  setTimeout(() => {
                    setUpdating(prev => ({ ...prev, [config.placeholderIncludes]: false }));
                    setUpdated(prev => ({ ...prev, [config.placeholderIncludes]: true }));
                  }, 800);
                }}
                target="_blank"
                className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
              >
                <SendHorizonal className="inline w-4 h-4 mr-1" />Update
              </a>
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
  );
};

export default InputFieldConfigs;
