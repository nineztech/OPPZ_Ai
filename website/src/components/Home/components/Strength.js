import React from 'react';
import {
  Network,
   BrainCircuit,
  UserCheck,
   
  BarChart4,
  ShieldCheck,
  Rocket
} from "lucide-react";


const VendorPortalUI = () => {
  const features = [
   
  {
  icon: Rocket, // Represents speed and automation
  title: "1‑Click Auto‑Apply Engine",
  color: "text-purple-600"
},
{
  icon: ShieldCheck, // Represents security and encryption
  title: "Encrypted Data & Sync Security",
  color: "text-red-600"
},
{
  icon: BarChart4, // Represents tracking and analytics
  title: "Real-Time Application Tracking",
  color: "text-indigo-600"
},
{
  icon: BrainCircuit, // Represents growth/acceleration
  title: "AI-Powered Career Acceleration",
  color: "text-orange-600"
},
{
  icon: UserCheck, // Represents secure login/profile verification
  title: "Secure Profile Sync",
  color: "text-teal-600"
},
{
  icon: Network, // Represents integration across platforms
  title: "Cross-Platform Job Integration",
  color: "text-blue-700"
}



  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header Section */}
      <div className="max-w-8xl mx-auto mb-8 mt-8">
         

        {/* Main Content Section */}
        <div className="bg-white rounded-lg shadow-sm p-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl mb-8 h-20 font-bold bg-clip-text bg-gradient-to-r from-green-500 via-blue-600 to-purple-700 bg-clip-text text-transparent">
               Our Unique Strength
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
             From auto-applying to jobs with a single click to tracking every application in real time, 
             OPPZ AI gives job seekers an edge with smart automation, cross-platform reach, and enterprise-grade data security.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-4 shadow-md transition-shadow duration-200 border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-white/80 shadow-md ${feature.color}`}>
                      <IconComponent size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800">
                      {feature.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPortalUI;