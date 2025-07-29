import React, { useState } from 'react';
import { CheckCircle, Shield, FileText, Download, Zap, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  images: string[];
  tags: string[];
}

const steps: Step[] = [
  {
    id: 1,
    title: "Sign Up & Install the OPPZ AI Chrome Extension",
    description: "Start by installing the OPPZ AI Chrome Extension from the Chrome Web Store and & Sing-up to the Website. It integrates seamlessly with various job platforms like LinkedIn, Indeed, Glassdoor and others (Dev in progress), enabling you to access powerful automation tools directly within job listings.",
    icon: <Zap className="w-6 h-6" />,
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-pink-500",
    images: [
      "/Step_1.png",
      "/Step1_2.png"
      
    ],
    tags: ["Chrome Extension", "Setup", "Installation"]
  },
  {
    id: 2,
    title: "Build a Powerful Candidate Profile",
    description: "Create a detailed candidate profile to unlock smarter job matches. Add your education, experience, certifications, skills, and accomplishments. The more complete 100% of your profile to unable the other features, the better OPPZ Ai can tailor job opportunities to your goals.",
    icon: <CheckCircle className="w-6 h-6" />,
    color: "text-orange-600",
    bgGradient: "from-orange-500 to-red-500",
    images: [
      "/Step2.png",
      "/Step2_1.png",
      "/Step2_2.png"
    ],
    tags: ["Profile", "Experience", "Skills"]
  },
  {
    id: 3,
    title: "Launch the Application Kickstart Engine",
    description: "Visit the ‘Application Kickstart’ tab to activate OPPZ AI-driven auto-apply system. Define preferences like job role, industry, salary expectations, and work location to streamline and personalize your job search experience.",
    icon: <Shield className="w-6 h-6" />,
    color: "text-indigo-600",
    bgGradient: "from-indigo-500 to-purple-500",
    images: [
      "/Step3.png",
      "/Step3_1.png"
      
    ],
    tags: ["AI Engine", "Auto-Apply", "Dashboard"]
  },
  {
    id: 4,
    title: "Login to OPPZ AI Extension and Start Auto‑Apply",
   description: "Sign back into the OPPZ AI Chrome Extension to continue your job hunt after switching devices or closing the browser. This ensures your dashboard, saved jobs, templates, and settings stay synced and ready.",
    icon: <Lock className="w-6 h-6" />,
    color: "text-teal-600",
    bgGradient: "from-teal-500 to-green-500",
    images: [
      "/Step4.png",
      "/Step4_1.png"
      
    ],
    tags: ["Login", "Sync", "Security"]
  },
  {
    id: 5,
    title: "Fill Questions to get Maximum Applications Revert",
   description: "When using auto-apply for the first time, you’ll be prompted to answer a set of standard job questions on the 'Question Library' page. Complete them once, then return to the extension and restart auto-apply.",
    icon: <Download className="w-6 h-6" />,
    color: "text-rose-600",
    bgGradient: "from-rose-500 to-pink-500",
    images: [
      "/Step5.png"
       
      
    ],
    tags: ["Questions", "Templates", "Automation"]
  },
  {
    id: 6,
    title: "Track Every Application in Detail",
    description: "Track all job applications in the OPPZAI portal dashboard with detailed analytics. View company names, job titles, status updates, timestamps, and job links. Use filters and tags to customize and manage your job search.",
    icon: <FileText className="w-6 h-6" />,
    color: "text-blue-600",
    bgGradient: "from-blue-500 to-green-500",
    images: [
       "/Step6.png"
    ],
    tags: ["Analytics", "Tracking", "Dashboard"]
  }
];

const ImageCarousel: React.FC<{ images: string[]; stepId: number }> = ({ images, stepId }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const selectImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); // Prevent card click
    setCurrentImage(index);
  };

   

  return (
    <div className="relative group">
       <div className="aspect-video w-full bg-gray-100 rounded-xl overflow-hidden">
    <div
    className="flex transition-transform duration-500 ease-in-out h-full"
    style={{ transform: `translateX(-${currentImage * 100}%)` }}
  >
    {images.map((image, index) => (
      <img
        key={index}
        src={image}
        alt=""
        className="w-full h-full object-cover object-center flex-shrink-0"
        loading="lazy"
      />
    ))}
  </div>
  </div>
      
      {images.length > 1 && (
        <>
          {/* Navigation Buttons */}
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => selectImage(e, index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 hover:scale-125 ${
                  index === currentImage 
                    ? 'bg-white shadow-lg' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {currentImage + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const FeaturesStepsProcess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl mb-8 font-bold bg-clip-text bg-gradient-to-l from-green-900 via-purple-600 to-blue-900 bg-clip-text text-transparent">
          Process Overview
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A quick breakdown of the key steps involved to help you understand how the process works from start to finish.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`
                group relative bg-white/80 shadow-lg rounded-2xl shadow-lg border border-white/20 
                overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer
                  : 'hover:scale-102'}
              `}
               
            >
              {/* Image Section */}
              <div className="p-4 pb-0">
                <ImageCarousel images={step.images} stepId={step.id} />
              </div>

              {/* Content Section */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`
                    flex-shrink-0 p-3 rounded-xl bg-gradient-to-r ${step.bgGradient} text-white
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-500 font-medium mb-1">
                      Step {step.id}
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 leading-tight mb-2">
                      {step.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {step.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Hover Overlay */}
                <div className={`
                  absolute inset-0 bg-gradient-to-r ${step.bgGradient} opacity-0 
                  group-hover:opacity-5 transition-opacity duration-300
                `} />
              </div>

              {/* Step Number Badge */}
              <div className={`
                absolute top-0 left-0 w-8 h-8 rounded-full bg-gradient-to-r ${step.bgGradient}
                text-white text-sm font-bold flex items-center justify-center shadow-lg
              `}>
                {step.id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesStepsProcess;