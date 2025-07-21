import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Shield, FileText, Download, Zap, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  illustration: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Install Chrome Extension",
    description:
      "Begin by installing the OPPZ Ai Chrome Extension from the Chrome Web Store. This extension enables seamless interaction with job listings and application automation directly from your browser.",
    icon: <Zap className="w-8 h-8" />, 
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-pink-500",
    illustration: "📝"
  },
  {
    id: 2,
    title: "Create Your Account",
    description:
      "Register your account using a valid email address and a secure password. Creating an account unlocks personalized features such as resume integration, application history, and tracking tools.",
    icon: <FileText className="w-8 h-8" />, 
    color: "text-blue-600",
    bgGradient: "from-blue-500 to-cyan-500",
    illustration: "📄"
  },
  {
    id: 3,
    title: "Complete Your Profile",
    description:
      "Fill in your personal details, education, experience, and skills to complete your profile. Achieving 100% completion unlocks advanced features like auto-apply filters, better matching, and improved job targeting.",
    icon: <Users className="w-8 h-8" />, 
    color: "text-green-600",
    bgGradient: "from-green-500 to-emerald-500",
    illustration: "👥"
  },
  {
    id: 4,
    title: "Go to Questions Library",
    description:
      "Access the Quotation Library to browse or create reusable job application templates. Click the 'Save' button to store selected fields in the extension, making them available during the auto-apply process.",
    icon: <CheckCircle className="w-8 h-8" />, 
    color: "text-orange-600",
    bgGradient: "from-orange-500 to-red-500",
    illustration: "✍️"
  },
  {
    id: 5,
    title: "Visit the Application Kickstart",
    description:
      "Navigate to the 'Application Kickstart' section to initiate the auto-apply process. This feature begins matching jobs based on your profile and preferences, enabling one-click job applications.",
    icon: <Shield className="w-8 h-8" />, 
    color: "text-indigo-600",
    bgGradient: "from-indigo-500 to-purple-500",
    illustration: "🔒"
  },
  {
    id: 6,
    title: "Login in to Extention",
    description:
      "Log in using the email and password you provided during registration. This grants access to your dashboard, application tracker, saved templates, and all personalized extension settings.",
    icon: <Lock className="w-8 h-8" />, 
    color: "text-teal-600",
    bgGradient: "from-teal-500 to-green-500",
    illustration: "🏆"
  },
  {
    id: 7,
    title: "Start Auto Applying",
    description:
      "Activate auto-apply to let OPPZ Ai automatically submit applications to jobs that match your profile. You can monitor submissions, track progress, and manage your job history — all in one place.",
    icon: <Download className="w-8 h-8" />, 
    color: "text-rose-600",
    bgGradient: "from-rose-500 to-pink-500",
    illustration: "⬇️"
  }
];

const FeaturesStepsProcess: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(true);

  useEffect(() => {
    if (!isAutoRunning || isPaused) return;

    const interval = setInterval(() => {
      setActiveStep((prevStep) => {
        const nextStep = prevStep >= steps.length ? 1 : prevStep + 1;
        return nextStep;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, isAutoRunning]);

  const handleStepSelect = (stepId: number) => {
    setActiveStep(stepId);
    setIsAutoRunning(false);
    setTimeout(() => {
      setIsAutoRunning(true);
    }, 10000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl mb-8 font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Process Overview
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
         A quick breakdown of the key steps involved to help you understand how the process works from start to finish.
        </p>
      </div>

      {/* Main Content Layout - Side by Side */}
      <div 
        className="max-w-7xl mx-auto px-4 pb-16"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Steps Navigation - Left Side */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Process Steps</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAutoRunning(!isAutoRunning)}
                    className={`
                      p-2 rounded-lg transition-all duration-300 text-sm font-medium
                      ${isAutoRunning 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }
                    `}
                    title={isAutoRunning ? 'Auto-advance ON' : 'Auto-advance OFF'}
                  >
                    {isAutoRunning ? '▶️' : '⏸️'}
                  </button>
                  {isPaused && isAutoRunning && (
                    <div className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded">
                      Paused
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepSelect(step.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 font-medium text-left relative
                      ${activeStep === step.id 
                        ? `${step.color} bg-white shadow-md border-2 border-current/20 scale-105` 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/60 border-2 border-transparent'
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg bg-gradient-to-r ${step.bgGradient} text-white flex-shrink-0 relative
                      ${activeStep === step.id ? 'shadow-md' : ''}
                    `}>
                      {step.icon}
                      {/* Auto-advance progress ring */}
                      {activeStep === step.id && isAutoRunning && !isPaused && (
                        <div className="absolute -inset-1 rounded-lg">
                          <div className="w-full h-full rounded-lg border-2 border-white/50 animate-pulse"></div>
                          <div 
                            className="absolute inset-0 rounded-lg border-2 border-white animate-progress-ring"
                            style={{
                              animation: 'progress-ring 4s linear infinite'
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Step {step.id}</div>
                      <div className="text-sm opacity-80 line-clamp-2">{step.title}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Progress indicator */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-medium text-gray-800">
                    {activeStep}/{steps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(activeStep / steps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Step Content - Right Side */}
          <div className="lg:col-span-3">
            <div className="relative">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`
                    transition-all duration-700 transform
                    ${activeStep === step.id 
                      ? 'opacity-100 translate-y-0 scale-100' 
                      : 'opacity-0 translate-y-10 scale-95 absolute pointer-events-none top-0 left-0 w-full'
                    }
                  `}
                >
                  <div className="space-y-8">
                    {/* Step Header */}
                    <div className={`
                      transition-all duration-500 delay-200
                      ${activeStep === step.id ? 'animate-slide-in-right' : ''}
                    `}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`
                          p-4 rounded-2xl bg-gradient-to-r ${step.bgGradient} text-white shadow-lg
                          transform transition-all duration-300 hover:scale-110
                        `}>
                          {step.icon}
                        </div>
                        <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
                          Step {step.id} of 7
                        </div>
                      </div>
                      
                      <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4 leading-tight">
                        {step.title}
                      </h2>
                      
                      <p className="text-lg text-gray-600 leading-relaxed mb-6">
                        {step.description}
                      </p>
                    </div>

                    {/* Illustration */}
                    <div className={`
                      transition-all duration-500 delay-400
                      ${activeStep === step.id ? 'animate-slide-in-up' : ''}
                    `}>
                      <div className={`
                        relative h-64 lg:h-60 lg:w-60 rounded-2xl bg-gradient-to-r ${step.bgGradient} 
                        shadow-xl overflow-hidden transform transition-all duration-500 hover:scale-105
                      `}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-4 left-4 w-6 h-6 bg-white rounded-full"></div>
                          <div className="absolute top-12 right-8 w-4 h-4 bg-white rounded-full"></div>
                          <div className="absolute bottom-8 left-8 w-3 h-3 bg-white rounded-full"></div>
                          <div className="absolute bottom-4 right-4 w-8 h-8 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Main Illustration */}
                        <div className="flex items-center justify-center h-full">
                          <div className="text-6xl lg:text-7xl animate-bounce">
                            {step.illustration}
                          </div>
                        </div>
                        
                        {/* Floating Elements */}
                        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
                          Step {step.id}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      {step.id > 1 && (
                        <button
                          onClick={() => handleStepSelect(step.id - 1)}
                          className="border-2 border-gray-300 text-gray-600 px-6 py-3 rounded-xl font-semibold hover:border-gray-400 hover:text-gray-700 transition-all duration-300"
                        >
                          ← Previous
                        </button>
                      )}
                      {step.id < 7 && (
                        <button
                          onClick={() => handleStepSelect(step.id + 1)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          Next Step →
                        </button>
                      )}
                      {step.id === 7 && (
                        <Link to="https://chromewebstore.google.com/detail/oppz-ai/edejolphacgbhddjeoomiadkgfaocjcj" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                          Get Started Free
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      
  );
};

export default FeaturesStepsProcess;