import React, { useState } from 'react';
 import { Mail} from 'lucide-react';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Subscribing email:', email);
  };

  return (
    <footer className="bg-black text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo and Social Media */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-20 h-20 bg-blue-700 rounded-sm flex items-center justify-center">
                 <img src="/OPPZ_Ai_Logo.png" alt="Logo" className="w-14 h-14" />
              </div>
              <span className="text-5xl font-semibold">OPPZ Ai</span>
               
            </div>
            <p className='text-xl text-gray-300'>Apply Smarter, Not Harder – Let OPPZ AI Handle the Job Hunt. Grab the dream Job out of all competition.</p>
            {/* <div className="flex space-x-4">
               
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-white font-bold">𝕏</span>
                </div>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                  <Youtube size={16} className="text-white" />
                </div>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center border border-white">
                  <span className="text-white font-bold">🎵</span>
                </div>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                  <Instagram size={16} className="text-white" />
                </div>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <Facebook size={16} className="text-white" />
                </div>
              </a>
            </div> */}

            <div className="text-gray-400 text-xl flex items-center space-x-2">
  <Mail className="w-5 h-5 text-white/50" />
  <span>support@oppzai.com</span>
</div>

          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-8">
            {/* Product Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                
                <li><a href="/pricing" className="text-purple-400 hover:text-purple-300 transition-colors">Pricing</a></li>
                <li><a href="/FAQ" className="text-purple-400 hover:text-purple-300 transition-colors">FAQ</a></li>
                <li><a href="/Login" className="text-gray-400 hover:text-white transition-colors">Login</a></li>
                <li><a href="/SignUp" className="text-gray-400 hover:text-white transition-colors">SignUp</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="/TermsAndConditions" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><a href="/PrivacyPolicy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/RefundPolicy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h3 className="text-white font-semibold mb-4">Stay Connected</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="text-gray-400 text-sm mb-2 block">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-600 py-2 px-0 text-white placeholder-gray-400 focus:border-white focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button
                onClick={handleSubscribe}
                className="bg-transparent border border-white text-white px-6 py-2 rounded-full hover:bg-white hover:text-black transition-colors font-medium"
              >
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="text-center text-gray-400 text-sm">
            © Powered BY OPPZ AI
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
