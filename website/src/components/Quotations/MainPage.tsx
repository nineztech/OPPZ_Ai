import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import DefaultFieldsForm from './DefaultFieldsForm';
import InputFieldConfigs from './InputFieldConfigs';
import RadioButtonConfigs from './RadioButtonConfigs';
import DropdownConfigs from './DropdownConfigs';

const tabs = [
  { label: 'Default Fields', key: 'Person' },
  { label: 'Input Fields', key: 'text' },
  { label: 'Options', key: 'radio' },
  { label: 'Pick Lists', key: 'dropdown' },
];

const MainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Person');

  const renderContent = () => {
    switch (activeTab) {
      case 'Person':
        return <DefaultFieldsForm />;
      case 'text':
        return <InputFieldConfigs />;
      case 'radio':
        return <RadioButtonConfigs />;
      case 'dropdown':
        return <DropdownConfigs />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl bg-[#f0f0ff] mx-auto mt-6 p-4">
      <div className="bg-white rounded-2xl shadow-md">
        <div className="text-center mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl text-white py-8">
          <h1 className="text-3xl ml-8 font-bold flex justify-center items-center gap-2">
            <Settings2 className="w-10 h-10" /> Auto Apply Config Panel
          </h1>
          <p className="text-sm flex justify-center items-center ml-8">
            Manage how OPPZ automatically applies to jobs — personalize filters, keywords, and behavior to suit your needs.
          </p>
        </div>

        {/* LinkedIn-style tab navigation */}
        <div className="px-6 bg-white mb-6 rounded-t-lg">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-4 font-medium text-sm transition-all duration-200 relative ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-b-lg">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default MainPage;