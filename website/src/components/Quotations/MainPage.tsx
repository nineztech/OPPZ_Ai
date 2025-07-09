import React, { useState } from 'react';
import DefaultFieldsForm from './DefaultFieldsForm'; 
import InputFieldConfigs from './InputFieldConfigs';
import RadioButtonConfigs from './RadioButtonConfigs';
import DropdownConfigs from './DropdownConfigs';
import {Settings2} from 'lucide-react';
const tabs = [
   { label: 'Default Fields', key: 'Person' },
  { label: 'Text Fields', key: 'text' },
  { label: 'Radio Buttons', key: 'radio' },
  { label: 'Dropdowns', key: 'dropdown' },
];

const MainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Person');

  const renderContent = () => {
    switch (activeTab) {
       case 'Person':
        return <DefaultFieldsForm />
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
    <div className="max-w-5xl bg-[#f4ffee] mx-auto ml-8 p-4">  
     <div className="bg-gray-100   rounded-2xl shadow-md">
        <div className="text-center mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl text-white py-8">
          <h1 className="text-3xl ml-8 font-bold flex justify-center items-center gap-2">
            <Settings2 className="w-10 h-10  " /> Auto Apply Config Panel
          </h1>
          <p className="text-sm flex justify-center items-center ml-8">Manage how OPPZ automatically applies to jobs — personalize filters, keywords, and behavior to suit your needs.</p>
        </div>
       
      <div className="flex justify-left space-x-4 w-[65%]  mb-4 p-6    ">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded font-medium border transition-colors duration-200 ${
              activeTab === tab.key
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-green-600'
                : 'bg-white text-blue-600 border-blue-300 text-decoration:underline hover:bg-blue-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
       
        {renderContent()}
      </div>
    </div>
  );
};

export default MainPage;
