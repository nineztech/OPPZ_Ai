import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import OPPZAIProcess from './Steps'
import Footer from '../../Footer/Footer';
const Home: React.FC = () => {
  return (
    <div>
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
     

      {/* Main Content */}
      <main className="flex items-center justify-between px-6 py-16 max-w-7xl mx-auto">
        {/* Left Column */}
        <div className="flex-1 max-w-2xl">
          <h1 className="text-white text-5xl md:text-6xl font-bold leading-tight mb-6">
            Revolutionize Your Hiring with AI
          </h1>
          
          <p className="text-blue-100 text-xl mb-8 leading-relaxed">
            Smarter, Faster, More Secure Recruitment Powered by AI and Web3
          </p>
          
          <div className="flex items-center space-x-4 mb-12">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2 font-semibold">
              <ArrowRight className="w-5 h-5" />
              <span>Get Started Free</span>
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Book a Demo</span>
            </button>
          </div>

          {/* Statistics */}
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

        {/* Right Column - Image */}
        <div className="flex-1 max-w-lg ml-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                <div className="h-4 bg-gray-600 rounded w-5/6"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">AI</span>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-white/20 rounded w-full"></div>
                  <div className="h-3 bg-white/20 rounded w-2/3 mt-2"></div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">HR</span>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-white/20 rounded w-4/5"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2 mt-2"></div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">JD</span>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-white/20 rounded w-3/4"></div>
                  <div className="h-3 bg-white/20 rounded w-5/6 mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
         
      </main>
      <div className='text-center py-12'>
          <p className="text-blue-100 text-xl mb-8 mx-auto leading-relaxed">
            Smarter, Faster, More Secure Recruitment Powered by AI and Web3
          </p>
           <button className="border-2 mx-auto border-white text-white px-8 py-4 rounded-full hover:bg-white hover:text-blue-600 transition-colors flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Try-Free Chrome Extention</span>
            </button>
      </div>

    </div>
   <div className="min-h-screen bg-black text-center flex flex-col items-center justify-center px-4">
  <p className="text-white font-bold text-6xl mb-2 leading-relaxed">
    Watch Teemo Ai In Action
  </p>
  <div className="w-full max-w-4xl aspect-video">
    <video
      className="w-full h-full rounded-lg shadow-lg"
      src="/auto_Applyed.mp4"
      title="Teemo AI Demo"
      controls
      autoPlay
      loop
    ></video>
  </div>
  

</div>
<OPPZAIProcess />
 <div className="min-h-screen bg-black text-center flex flex-col items-center justify-center px-4">
  <p className="text-white font-bold text-6xl mb-2 leading-relaxed">
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