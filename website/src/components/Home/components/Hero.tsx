import React from 'react';
import { ArrowRight,FileText,Zap} from 'lucide-react';
import OPPZAIProcess from './Steps'
import Footer from '../../Footer/Footer';
import {Link } from 'react-router-dom';
import HowItWorks from './OPPZ_Ai';
import VendorPortalUI from './Strength';

 
import { X, Check, Layers,Split,Rocket,Hourglass,BadgeCheck,Ban } from 'lucide-react';

interface ComparisonCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'before' | 'after';
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ icon, title, description, type }) => {
  const borderColor = type === 'before' ? 'border-red-200' : 'border-green-200';
  const bgColor = type === 'before' ? 'bg-white-50' : 'bg-white-50';
  
  return (
    <div className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} shadow-md min-h-[120px] flex flex-col`}>
      <div className="flex items-start gap-3 -mb-2">
        <div className={`${type === 'before' ? 'text-red-500' : 'text-green-500'} mt-1`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div>
      
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen overflow-hidden">
  {/* Background Video */}
  <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
  <svg
  viewBox="0 0 1366 633"
  preserveAspectRatio="xMidYMid slice"
  className="w-full h-full object-cover"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <linearGradient y2="0" y1="0" x2="1" x1="0" id="waveGradient">
      <stop offset="0%" stopColor="#4f46e5" />
      <stop offset="50%" stopColor="#7e22ce" />
      <stop offset="100%" stopColor="#46e5e5" />
    </linearGradient>
  </defs>

  <g>
    <path
  className="wave wave1"
  opacity="1"
  fill="url(#waveGradient)"
  d="M 0 0 L 0 456.4 Q 113.83 500 227.67 420 T 455.33 394.32 T 683 328.11 T 910.67 326.91 T 1138.33 269.51 T 1366 291.11 L 1366 0 Z"
/>

{/* <path
  className="wave wave2"
  opacity="0.5"
  fill="url(#waveGradient)"
  d="M 0 0 L 0 470.425 Q 113.83 499.999 227.67 420 T 455.33 359.88 T 683 377.72 T 910.67 349.822 T 1138.33 292.263 T 1366 316.688 L 1366 0 Z"
/> */}

<path
  className="wave wave3"
  opacity="0.3"
  fill="url(#waveGradient)"
  d="M 0 0 L 0 453.425 Q 113.83 499.999 227.67 420 T 455.33 399.208 T 683 347.72 T 910.67 339.82 T 1138.33 276.63 T 1366 306.688 L 1366 0 Z"
/>

<path
  className="wave wave4"
  opacity="0.25"
  fill="url(#waveGradient)"
  d="M 0 0 L 0 453.0 Q 113.83 499.88 227.67 420 T 455.33 384.22 T 683 340.11 T 910.67 330.22 T 1138.33 270.33 T 1366 300.88 L 1366 0 Z"
/>

<path
  className="wave wave5"
  opacity="0.2"
  fill="url(#waveGradient)"
  d="M 0 0 L 0 455.0 Q 113.83 499.888 227.67 420 T 455.33 378.55 T 683 335.66 T 910.67 326.66 T 1138.33 266.44 T 1366 295.88 L 1366 0 Z"
/>

<path
  className="wave wave6"
  opacity="0.15"
  fill="url(#waveGradient)"
  d="M 0 0 L 0 455.0 Q 113.83 500.88 227.67 420 T 455.33 368.55 T 683 330.66 T 910.67 318.66 T 1138.33 260.44 T 1366 288.88 L 1366 0 Z"
/>
   
  </g>

  <style>{`
    .wave {
      animation: waveBounce 6s ease-in-out infinite;
    }

    .wave1 {
      animation-delay: 0s;
    }

    .wave2 {
      animation-delay: 2s;
    }

    .wave3 {
      animation-delay: 4s;
    }
     
     .wave4 {
      animation-delay: 3s;
    }

     .wave5 {
      animation-delay: 5s;
    }

     .wave6 {
      animation-delay: 1s;
    }

    @keyframes waveBounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
  `}</style>
</svg>

</div>


  

  {/* Content Layer (z-20 ensures it's above video and gradient) */}
  <main className="relative  flex flex-col md:flex-row items-center justify-between px-6 py-8 -mt-16 max-w-7xl mx-auto min-h-screen text-white">
    
    {/* Left Column */}
    <div className="flex-1 max-w-3xl mb-12 md:mb-0">
      <h1 className="text-5xl md:text-5xl font-bold leading-tight mb-3">
          
        Land Jobs Faster with OPPZ AI  </h1>
        <h1 className="text-4xl md:text-4xl font-bold leading-tight mb-6">Stand Out & Get Hired.</h1>
         
         
      

      <p className="text-blue-100 text-xl mb-8 leading-relaxed">
        Emphasizes speed, efficiency, and AI value.
      </p>

      <div className="flex items-center mb-12">
        <Link to="/Signup" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2">
          <ArrowRight className="w-5 h-5" />
          <span>Get Started Free</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-16">
        <div>
          <div className="text-white text-4xl font-bold mb-2 ">80%</div>
          <div className="text-blue-100 flex"><Zap className="w-5 h-5 text-white mr-2" /> Faster Time To Interviews</div>
        </div>
        <div>
          <div className="text-white text-4xl font-bold  mb-2">4x</div>
          <div className="text-blue-100 flex"><FileText className="w-5 h-5 text-white mr-2" />More Job Offers</div>
        </div>
      </div>
    </div>

    {/* Right Column - Video Block */}
    {/* <div className="w-full md:w-[500px]">
      <div className="bg-white/10 h-[400px] backdrop-blur-sm rounded-2xl p-4 border border-white/20 overflow-hidden">
        <video
          className="w-full h-full rounded-lg object-cover"
          src="/Home_video.mp4"
          title="OPPZ AI Demo"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>
    </div> */}
    <div className="w-full md:w-[500px]">
  <div className="h-[350px] -mr-18   p-0  -mt-24 overflow-hidden">
    <img
      src="/AI-f-removebg-preview.png"
      alt="OPPZ Ai Logo"
      className="h-full w-full object-contain"
    />
  </div>
</div>

  </main>
 <div className="relative text-center py-12">
  <p className="text-black text-xl mb-8 mx-auto leading-relaxed">
     1000s of Professionals Rely on Us to Land Jobs
  </p>

  <a
    href="https://chromewebstore.google.com/detail/oppz-ai/edejolphacgbhddjeoomiadkgfaocjcj"
    target="_blank"
    rel="noopener noreferrer"
    className="group relative inline-flex items-center justify-center w-80 rounded-full p-[2px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
  >
    {/* Inner content wrapper with white bg and transition */}
    <span className="flex items-center justify-center w-full h-full px-8 py-4 bg-white rounded-full transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-500 group-hover:text-white space-x-2">
      <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
      <span>Try-Free Chrome Extension</span>
    </span>
  </a>
</div>

</div>
 <HowItWorks />
 <VendorPortalUI />

<div className="max-w-7xl mx-auto p-8 mb-20 rounded-md bg-white">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Empower <span className="text-blue-500">Job Seekers</span> with Smart Career Tools
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Streamline Your Job Search and Get the Responses You Deserve. 
           <br />
           Unlock a faster, smarter way to land interviews and build your dream career.
       </p>
      </div>


      {/* Before/After Section Headers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 mb-8">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-red-500 uppercase tracking-wide">
              Before OPPZ AI
            </h2>
          </div>
         <p className="text-gray-700 text-lg font-medium">
  Overwhelmed by job boards, ignored applications, and zero clarity in your job search journey.
</p>
        </div>

        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-green-500 uppercase tracking-wide">
              After OPPZ AI
            </h2>
          </div>
          <p className="text-gray-700 text-lg font-medium">
  Confidently conquer your job search with AI-driven insights and automation.
</p>

        </div>
      </div>

      {/* Comparison Cards */}
      <div className="space-y-6">
  {/* First Row */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
    <ComparisonCard
      icon={<Ban className="w-6 h-6" />}
      title="Constant Rejections"    
      description="Generic resumes get filtered out by ATS systems"
      type="before"
    />
    <ComparisonCard
      icon={<BadgeCheck className="w-6 h-6" />}
      title="Turn Rejections Into Interviews"
      description="Craft professional, compliant resumes that pass screening"
      type="after"
    />
  </div>

  {/* Second Row */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
    <ComparisonCard
      icon={<Hourglass className="w-6 h-6" />}
      title="Wasted Effort"
      description="Manual applications consume hours with little return"
      type="before"
    />

    {/* Arrow for larger screens */}
    <div className="hidden lg:flex justify-center items-center absolute left-1/2 transform -translate-x-1/2 z-10">
  <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-300">
    <svg
      className="w-6 h-6 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
</div>


    <ComparisonCard
      icon={<Rocket className="w-6 h-6" />}
      title="Accelerated Search"
      description="AI-powered tools streamline every step of your job hunt"
      type="after"
    />
  </div>
 
  {/* Third Row */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
    <ComparisonCard
      icon={<Split className="w-6 h-6" />}
      title="Multiple Tools"
      description="Juggling multiple platforms leads to confusion"
      type="before"
    />
    <ComparisonCard
      icon={<Layers className="w-6 h-6" />}
      title="Unified Platform"
      description="Handle countless Job search at one place"
      type="after"
    />
  </div>
</div>

    </div>

  <div className="min-h-screen/4 bg-black text-white flex items-center justify-center px-4 py-12">
  <div className="flex flex-col md:flex-row items-center md:items-start p-4 gap-10 max-w-7xl w-full">
    
<div className="relative w-full  -mt-8 flex justify-center items-center bg-black">
  {/* Desktop setup image */}
  <img
    src="./Desk-removebg-preview.png"
    alt="Desk Setup"
    className="max-w-4xl w-full rounded-xl shadow-2xl -mt-12"
  />

  {/* Video on screen */}
  <div className="absolute w-[69.9%] h-[47.5%] top-[18%] left-[15.3%]  rounded-md overflow-hidden shadow-lg">
    <video
      src="/auto_Applyed.mp4" // Replace with your actual video path
      className="w-full h-full object-cover"
      autoPlay
      muted 
      loop
      playsInline
    />
  </div>
</div>

    {/* Description Section */}
    <div className="w-full md:w-1/2 mt-12 text-left space-y-4">
      <h2 className="text-4xl font-bold">Watch OPPZ Ai In Action</h2>
      <p className="text-lg text-gray-300">
  Discover how OPPZ AI transforms your job search into a fully automated experience. With just a few clicks, our intelligent system scans listings, fills out applications, and submits them on your behalf — saving you hours every day.
</p>
<p className="text-md text-gray-400">
  Whether you're job hunting full-time or casually exploring new opportunities, OPPZ AI ensures you never miss a chance. Stay ahead of the competition, eliminate repetitive tasks, and land interviews faster — all while you focus on preparing for your next big role.
</p>

    </div>

  </div>
</div>


<OPPZAIProcess />
<div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
  <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
    
    {/* Left: Text Content */}
    <div className="text-centermx-auto md:text-left">
      <h1 className="text-5xl font-bold text-center text-gray-800 mb-4">Subscription Plan</h1>
      
      <p className="text-xl text-center text-purple-600 font-semibold mb-2">
        🎉 Limited-Time Offer! Free for <span className="font-medium text-indigo-600">Beta</span> Version.
      </p>
      
      <p className="text-base text-center text-gray-600 mb-2">
        Our AI finds and applies to jobs for you so you can focus on what matters.
      </p>
      
      <p className="text-base text-center text-gray-600 mb-6">
        Offer ends with our next release — claim it now.
      </p>
        

       <div className="flex justify-center">
  <a
    href="/signup"
    
    className="group mb-12 relative inline-flex items-center justify-center w-80 rounded-full p-[2px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
  >
    <span className="flex items-center justify-center w-full h-full px-8 py-4 bg-white rounded-full transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-blue-500 group-hover:text-white space-x-2">
      <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
       Sign-up
    </span>
  </a>
</div>

      {/* You can add a CTA button or pricing table here */}
    </div>

    {/* Right: Image */}
    <div className="w-full">
      <img
        src="/Free-Now (2).jpeg" // Replace with your actual image path
        alt="Subscription Illustration"
        className="w-full h-[90%] contianer-cover rounded-xl"
      />
    </div>
    
  </div>
</div>
 

 <div className="relative text-center bg-black py-12">
  <p className="text-white text-4xl w-[70%]  mx-auto leading-relaxed">
    "One-Click Applications, Real-Time Tracking, </p>
    <p className="text-white text-4xl w-[70%]  mx-auto leading-relaxed">
    OPPZ AI Makes Job Hunting Easy"
      
  </p>
  <p className="text-white text-4xl w-[70%] mb-8 mx-auto leading-relaxed">
- We help <span className="font-bold">Job Seekers</span> succeed.
</p>
  <a
    href="https://chromewebstore.google.com/detail/oppz-ai/edejolphacgbhddjeoomiadkgfaocjcj"
    target="_blank"
    rel="noopener noreferrer"
    className="group mb-12 relative inline-flex items-center justify-center w-80 rounded-full p-[2px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500"
  >
    {/* Inner content wrapper with white bg and transition */}
    <span className="flex items-center justify-center w-full h-full px-8 py-4 bg-white rounded-full transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-500 group-hover:text-white space-x-2">
      <ArrowRight className="w-5 h-5 transition-transform duration-300 ease-in-out group-hover:translate-x-1" />
      Try-Free Chrome Extension
    </span>
  </a>
</div>
    
    <Footer />
    </div>
  );
};

export default  Home;