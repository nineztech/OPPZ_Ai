import React from 'react';

export const Home = () => (
  <div className="bg-gray-50">
    {/* Hero Section */}
    <header className="py-32 bg-gradient-to-br from-gray-100 to-gray-200 text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Automate Your LinkedIn Job Applications
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Save time and increase your chances of landing your dream job with our powerful automation tool.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition">
            Get Started
          </button>
          <button className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded hover:bg-blue-600 hover:text-white transition">
            Learn More
          </button>
        </div>
      </div>
    </header>

    {/* How It Works Section */}
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Get started with our automated job application process in just 4 simple steps
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="text-center group">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=80&h=80&fit=crop&crop=center" 
                alt="Upload Resume" 
                className="w-12 h-12 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload Resume</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Simply drag and drop your resume or upload it from your device. Our AI will automatically extract your skills, experience, and qualifications to create a comprehensive profile.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="text-center group">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=80&h=80&fit=crop&crop=center" 
                alt="Set Preferences" 
                className="w-12 h-12 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3">Set Preferences</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Customize your job search with specific criteria including desired roles, industries, locations, salary range, and company size. Set remote work preferences and experience level requirements.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="text-center group">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=80&h=80&fit=crop&crop=center" 
                alt="Auto Apply" 
                className="w-12 h-12 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3">Auto Apply</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our intelligent system scans LinkedIn for matching opportunities and automatically submits tailored applications. Each application is customized with relevant keywords and cover letters.
            </p>
          </div>
          
          {/* Step 4 */}
          <div className="text-center group">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=80&h=80&fit=crop&crop=center" 
                alt="Track Progress" 
                className="w-12 h-12 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Monitor all your applications through our comprehensive dashboard. Track response rates, interview invitations, and application status. Get insights to optimize your job search strategy.
            </p>
          </div>
        </div>
        
        {/* Connecting Lines for Desktop */}
        <div className="hidden lg:block relative mt-8">
          <div className="absolute top-0 left-1/4 w-1/4 h-0.5 bg-gradient-to-r from-blue-300 to-green-300"></div>
          <div className="absolute top-0 left-1/2 w-1/4 h-0.5 bg-gradient-to-r from-green-300 to-purple-300"></div>
          <div className="absolute top-0 left-3/4 w-1/4 h-0.5 bg-gradient-to-r from-purple-300 to-orange-300"></div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg shadow-md hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=48&h=48&fit=crop&crop=center" 
                alt="Easy Apply" 
                className="w-8 h-8 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold text-blue-600 mb-3">Easy Apply Automation</h3>
            <p className="text-gray-600">Automatically fill out job applications with your saved information and submit them instantly to relevant positions.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=48&h=48&fit=crop&crop=center" 
                alt="Smart Filtering" 
                className="w-8 h-8 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-3">Smart Filtering</h3>
            <p className="text-gray-600">Set custom filters to find the most relevant jobs for your career path, skills, and preferences with AI-powered matching.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=48&h=48&fit=crop&crop=center" 
                alt="Application Tracking" 
                className="w-8 h-8 object-cover rounded"
              />
            </div>
            <h3 className="text-xl font-semibold text-purple-600 mb-3">Application Tracking</h3>
            <p className="text-gray-600">Keep track of all your applications in one centralized dashboard with real-time status updates and analytics.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
);