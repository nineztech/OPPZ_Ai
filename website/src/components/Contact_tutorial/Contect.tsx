import React, { useState,useRef } from 'react';
import { Play, Phone, Mail, User } from 'lucide-react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
 
const videoRef = useRef<HTMLVideoElement | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async () => {    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically make an actual API call
      console.log('Form submitted:', formData);
      
      setSubmitStatus('success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  

 

const handleWatchTutorial = () => {
  setShowVideo(true);
  // Let video autoplay once it's visible
  setTimeout(() => {
    videoRef.current?.play().catch(err => {
      console.warn("Autoplay blocked:", err);
    });
  }, 0);
};

const handleVideoPause = () => {
  // When user pauses the video manually, hide video and show button again
  setShowVideo(false);
};


  return (
    <div className="min-h-screen bg-[#f0f0ff] text-white flex items-center justify-center p-4 md:p-4 ml-2 mt-6 mr-6">
      <div className="w-full bg-white ml-12 max-w-6xl rounded-2xl mx-auto">
          <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl mb-12 text-white py-8">
              <h1 className="text-3xl ml-8 font-bold flex justify-center items-center gap-2">
                 <Mail className="w-45 h-45" /> Contact & Assistance
                {/* {emailInitial && <p>Email from login/signup: {emailInitial}</p>} */}
              </h1>
              <p className="text-sm justify-center items-center ml-8">We're here to support & Assist you For Your job journey With OPPZ Ai.</p>
            </div>
{!showVideo ? (
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Tutorial button */}
          <div className="mx-w-6xl h-ful ml-8 rounded-xl flex flex-col items-center justify-center gap-6">
   
    <button
      onClick={handleWatchTutorial}
      className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-3"
    >
      <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
      Watch Tutorial
    </button>
  
</div>


          {/* Right side - Contact section */}
          <div className="w-full max-w-md shadow-2xl rounded-2xl mb-8 border p-12 mx-auto lg:mx-0">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Contact us
            </h1>
 
 
            <div className="space-y-6">
              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                    First name
                  </label>
                  <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className={`w-full pl-10 px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.firstName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-white`}
                  />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                    Last name
                  </label>
                   <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className={`w-full pl-10 px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.lastName 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-white`}
                  />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                   <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                     
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    className={`w-full pl-10 px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-500 text-white`}
                  />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
                  

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone"
                      className={`w-full pl-10 pr-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.phone 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } placeholder-gray-500 text-white`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Message"
                  className={`w-full px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                    errors.message 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                  } placeholder-gray-500 text-white`}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit'
                )}
              </button>

              {/* Status messages */}
              {submitStatus === 'success' && (
                <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg">
                  <p className="text-green-400 text-center">
                    Thank you! Your message has been sent successfully.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-center">
                    Sorry, there was an error sending your message. Please try again.
                  </p>
                </div>
              )}
            </div>
          </div>
           </div>
     
           ) : (
    <video
      ref={videoRef}
      autoPlay
      controls
      onPause={handleVideoPause}
      className="rounded-xl shadow-lg w-full mx-auto mb-8 max-w-4xl"
      poster="https://via.placeholder.com/640x360?text=Tutorial+Preview"
    >
      <source src="/auto_Applyed.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )}
        </div>
    </div>  
  );
};

export default ContactPage;