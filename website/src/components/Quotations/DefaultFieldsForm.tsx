import React, { useEffect, useState } from 'react';

interface DefaultFields {
  YearsOfExperience: string;
  FirstName: string;
  LastName: string;
  PhoneNumber: string;
  City: string;
  Email: string;
}

const defaultNullFieldInput: DefaultFields = {
  YearsOfExperience: '',
  FirstName: '',
  LastName: '',
  PhoneNumber: '',
  City: '',
  Email: '',
};

const EXTENSION_ID = 'gkjemnmlpgdngnchlgnhacembojdfnbm';

const isChromeExtension = () =>
  typeof chrome !== 'undefined' &&
  chrome.runtime !== undefined &&
  typeof chrome.runtime.sendMessage === 'function';

const placeholderMap: Record<keyof DefaultFields, string> = {
  YearsOfExperience: 'Years of Experience',
  FirstName: 'First Name',
  LastName: 'Last Name',
  PhoneNumber: 'Phone Number',
  City: 'City',
  Email: 'Email',
};

const DefaultFieldsForm: React.FC = () => {
  const [fields, setFields] = useState<DefaultFields>(defaultNullFieldInput);
  const [statusMsg, setStatusMsg] = useState<string>('Please fill out the missing values:');
  const [statusColor, setStatusColor] = useState<string>('text-red-600');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Load profile from localStorage + API
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const parsedUser = JSON.parse(storedUser);
    const userEmail = parsedUser?.email;

    if (!userEmail) return;

    fetch('http://localhost:5006/api/profiles')
      .then(res => res.json())
      .then(json => {
        const profile = json.profiles?.find((p: any) => p.email === userEmail);
        if (profile) {
          const defaultFieldData: DefaultFields = {
            FirstName: String(profile.firstName || ''),
            LastName: String(profile.lastName || ''),
            Email: String(profile.email || ''),
            PhoneNumber: String(profile.phone || ''),
            City: String(profile.city || ''),
            YearsOfExperience: String(profile.experience || ''),
          };

          setFields(defaultFieldData);
          if (window.chrome?.storage?.local) {
            chrome.storage.local.set({ defaultFields: defaultFieldData });
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
      });
  }, []);

  // Status UI
  useEffect(() => {
    const allFilled = Object.values(fields).every(v => typeof v === 'string' && v.trim() !== '');
    setStatusMsg(allFilled ? 'You are ready to use auto apply!' : 'Please fill out the missing values:');
    setStatusColor(allFilled ? 'text-green-600' : 'text-red-600');
  }, [fields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...fields, [name]: value };
    setFields(updated);

    if (window.chrome?.storage?.local) {
      chrome.storage.local.set({ defaultFields: updated });
    }
  };

  // Debug function to check extension storage
  const debugExtensionStorage = () => {
    if (!isChromeExtension()) {
      setDebugInfo('Not in Chrome Extension environment');
      return;
    }

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      {
        from: 'website',
        action: 'getFormControlData',
      },
      (response) => {
        if (chrome.runtime.lastError) {
          setDebugInfo(`Error: ${chrome.runtime.lastError.message}`);
        } else {
          setDebugInfo(JSON.stringify(response, null, 2));
        }
      }
    );
  };

  const handleConfirm = async () => {
    if (!isChromeExtension()) {
      console.warn('Not in Chrome Extension environment');
      setDebugInfo('Not in Chrome Extension environment');
      return;
    }

    setIsLoading(true);
    setDebugInfo('Sending data to extension...');

    const results: Array<{ field: string; success: boolean; error?: string }> = [];

    // Process each field sequentially to avoid race conditions
    for (const [key, value] of Object.entries(fields)) {
      const placeholderIncludes = placeholderMap[key as keyof DefaultFields];

      const fieldConfig = {
        placeholder: placeholderIncludes,
        value: value,
      };

      console.log(`[React] Sending to extension: ${key} →`, JSON.stringify(fieldConfig));

      try {
        const response = await new Promise<any>((resolve, reject) => {
          chrome.runtime.sendMessage(
            EXTENSION_ID,
            {
              from: 'website',
              action: 'updateInputFieldValue',
              data: fieldConfig,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            }
          );
        });

        results.push({ field: key, success: response?.success || false });
        console.log(`[Website] Successfully sent ${placeholderIncludes} →`, response);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ field: key, success: false, error: errorMessage });
        console.error(`[Website] Error sending ${placeholderIncludes}:`, error);
      }

      // Small delay between requests to prevent overwhelming the extension
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsLoading(false);
    
    // Update debug info with results
    const successCount = results.filter(r => r.success).length;
    const failedFields = results.filter(r => !r.success).map(r => r.field);
    
    setDebugInfo(`
Results: ${successCount}/${results.length} fields sent successfully
${failedFields.length > 0 ? `Failed fields: ${failedFields.join(', ')}` : 'All fields sent successfully!'}
    `.trim());
  };

  return (
    <div>
      <h3 className={`text-sm font-medium mb-4 ${statusColor}`}>{statusMsg}</h3>
      
     <div className="flex flex-wrap gap-6">
  {Object.entries(fields).map(([key, val]) => (
    <div key={key} className="w-full md:w-[48%] text-left">
      <label htmlFor={key} className="block font-semibold mb-1">
        {placeholderMap[key as keyof DefaultFields]}
      </label>
      <input
        type="text"
        id={key}
        name={key}
        value={val}
        onChange={handleChange}
        className="w-full p-2 border rounded shadow"
        placeholder={placeholderMap[key as keyof DefaultFields]}
      />
    </div>
  ))}
</div>


      <div className="mt-6 space-y-3">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={`w-[20%] px-4 py-2 text-white rounded ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Sending to Extension...' : 'Confirm & Send'}
        </button>

        {/* <button
          onClick={debugExtensionStorage}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Debug Extension Storage
        </button> */}
      </div>

      {debugInfo && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h4 className="font-semibold text-sm mb-2">Debug Information:</h4>
          <pre className="text-xs whitespace-pre-wrap overflow-x-auto">
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DefaultFieldsForm;