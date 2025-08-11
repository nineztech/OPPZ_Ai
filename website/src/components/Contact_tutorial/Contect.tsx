import React, { useState, useRef } from 'react';
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
  const api_baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:5006/api";
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
      console.log('Form data:', formData);

      const response = await fetch(`${api_baseUrl}/api/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);

      setSubmitStatus('success');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact:', error);
      setSubmitStatus('error');
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
    }, 100);
  };

  

  const handleCloseVideo = () => {
    setShowVideo(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0ff] text-white flex items-center justify-center p-4 md:p-4 ml-2 mt-6 mr-6">
      <div className="w-full bg-white ml-12 max-w-6xl rounded-2xl mx-auto shadow-xl">
        {/* Header */}
        <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl mb-12 text-white py-8">
          <h1 className="text-3xl ml-8 font-bold flex justify-center items-center gap-2">
            <Mail className="w-8 h-8" /> Contact & Assistance
          </h1>
          <p className="text-sm justify-center items-center ml-8 opacity-90">
            We're here to support & assist you for your job journey with OPPZ AI.
          </p>
        </div>

        {/* Main Content */}
        {!showVideo ? (
          <div className="grid lg:grid-cols-2 gap-12 items-start px-8 pb-8">
            {/* Left side - Tutorial button */}
            <div className="flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Need Help Getting Started?</h2>
                <p className="text-gray-600">
                  Watch our comprehensive tutorial to learn how to maximize your experience with OPPZ AI.
                </p>
              </div>
              
              <button
                onClick={handleWatchTutorial}
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-3"
              >
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                Watch Tutorial
              </button>

              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>💡 Learn how to set up auto-fill and boost your productivity</p>
              </div>
            </div>

            {/* Right side - Contact form */}
            <div className="w-full max-w-md shadow-2xl rounded-2xl border border-gray-200 p-8 mx-auto lg:mx-0">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Contact Us
              </h2>
 
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
                      First name <span className="text-red-500">*</span>
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
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        } placeholder-gray-400 text-black`}
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
                      Last name <span className="text-red-500">*</span>
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
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        } placeholder-gray-400 text-black`}
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
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
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        } placeholder-gray-400 text-black`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
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
                        className={`w-full pl-10 px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
                          errors.phone 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        } placeholder-gray-400 text-black`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    className={`w-full px-4 py-3 bg-transparent border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                      errors.message 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    } placeholder-gray-400 text-black`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">{errors.message}</p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Send Message'
                  )}
                </button>

                {/* Status messages */}
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-center">
                      ✅ Thank you! Your message has been sent successfully. 🎉
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-center">
                      ⚠️ Sorry, there was an error sending your message. Please try again.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : (
          /* Video Section */
          <div className="px-8 pb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Tutorial Video</h2>
              <button
                onClick={handleCloseVideo}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Contact
              </button>
            </div>
            <video
              ref={videoRef}
              autoPlay
              controls
              onEnded={() => setShowVideo(false)}
              className="rounded-xl shadow-lg w-full mx-auto max-w-4xl"
              poster="https://via.placeholder.com/640x360?text=Tutorial+Preview"
            >
              <source src="/auto_Applyed.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        
      </div>
    </div>  
  );
};

export default ContactPage;