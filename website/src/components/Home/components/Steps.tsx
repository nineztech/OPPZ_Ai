import React from 'react';
import { Link } from 'react-router-dom';

const OPPZAIProcess: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <p className="text-center text-4xl font-bold mb-20">How It Works?</p>
      <div className="max-w-7xl mx-auto">
        {/* Steps Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">1. Install extension</h2>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">2. Setup Profile</h2>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">3. Let Ai Apply</h2>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Install */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="bg-white rounded-lg p-8 mb-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <img src="/OPPZ_Ai_Logo.png" alt="Logo" className="h-full mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-blue-500 mb-2">OPPZ Ai</h3>
            </div>

            <div className="space-y-3">
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Saved Questions
              </button>
              <button className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors">
                Job Profile
              </button>
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Logout
              </button>
            </div>

            <div className="mt-6 text-center">
              <Link to="/help" className="text-blue-400 hover:text-blue-300 text-sm">
                Help & Documentation
              </Link>
            </div>

            <p className="text-gray-400 text-sm mt-6 text-center">
              Simplify your job application process
            </p>
          </div>

          {/* Step 2: Setup Profile */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="bg-gray-700 h-[60%] rounded-lg">
              <img src="/step2.png" alt="Profile Setup" className="h-full mx-auto mb-4" />
            </div>
            <p className="text-gray-400 text-sm mt-6 text-center">
              Complete your Profile Up to 100% to Start Auto Applying
            </p>
          </div>

          {/* Step 3: Let AI Apply */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="bg-blue-600 rounded-lg p-6 mb-4">
              <img src="/step3.png" alt="AI Apply" className="h-full mx-auto mb-4" />
            </div>
            <p className="text-gray-400 text-sm mt-6 text-center">
              Sit back and let AI apply jobs for you while you relax
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OPPZAIProcess;
