import React from 'react';
import { ArrowRight} from 'lucide-react';
import OPPZAIProcess from './Steps'
import Footer from '../../Footer/Footer';
import {Link } from 'react-router-dom';
import HowItWorks from './OPPZ_Ai';
const Home: React.FC = () => {
  return (
    <div>
      
    <div className="relative min-h-screen overflow-hidden">
  {/* Background Video */}
  <video
    className="absolute top-0 left-0 w-full h-full object-cover z-0"
    src="/Home_Back.mp4"
    autoPlay
    muted
    loop
    playsInline
  />

  {/* Semi-transparent Gradient Overlay for better text readability */}
  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 opacity-20 z-10" />

  {/* Content Layer (z-20 ensures it's above video and gradient) */}
  <main className="relative z-20 flex flex-col md:flex-row items-center justify-between px-6 py-8 -mt-16 max-w-7xl mx-auto min-h-screen text-white">
    
    {/* Left Column */}
    <div className="flex-1 max-w-2xl mb-12 md:mb-0">
      <h1 className="text-5xl md:text-5xl font-bold leading-tight mb-6">
        Effortless Job Applications with AI - Focus on Success, Not for Job Application.
        <img src="./OPPZ_Ai_Logo.png" alt="OPPZ AI Logo" className="inline-block h-12 ml-2" />
      </h1>

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
          <div className="text-white text-4xl font-bold mb-2">46%</div>
          <div className="text-blue-100">Increase in Qualified Applicants</div>
        </div>
        <div>
          <div className="text-white text-4xl font-bold mb-2">35%</div>
          <div className="text-blue-100">Reduction in Hiring Time</div>
        </div>
      </div>
    </div>

    {/* Right Column - Video Block */}
    <div className="w-full md:w-[500px]">
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
    </div>

  </main>
 <div className="relative z-20 text-center py-12">
    <p className="text-blue-100 text-xl mb-8 mx-auto leading-relaxed">
      Trusted by 3,000+ job seekers
    </p>
    <Link to="https://chromewebstore.google.com/detail/oppz-ai/edejolphacgbhddjeoomiadkgfaocjcj" target="_blank"
    rel="noopener noreferrer" className="border-2 w-80 mx-auto border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2 group">
      <ArrowRight className="w-5 h-5 transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
      <span>Try-Free Chrome Extension</span>
    </Link>
  </div>
</div>
 <HowItWorks />
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
  <div className="absolute w-[69.7%] h-[47.5%] top-[18%] left-[15.8%]  rounded-md overflow-hidden shadow-lg">
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
 <div className="min-h-screen bg-black text-center flex flex-col items-center justify-center px-4">
  <p className="text-white font-bold text-4xl mb-2 leading-relaxed">
    Track every Job You are applying to!
  </p>
  <div className="w-full max-w-4xl aspect-video">
     <img src='/job_track.png' alt="Track Jobs" className="w-full h-full rounded-lg shadow-lg" />
  </div>
  

</div>
    
    <Footer />
    </div>
  );
};

export default  Home;