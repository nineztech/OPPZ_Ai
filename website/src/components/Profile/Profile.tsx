import React, { useState, useRef, useEffect } from 'react';
import { Check,FileText, UserCog,Upload, User, Save } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom';
import FilterSettingsConfigs  from './FilterSettingsConfig';
import SkillsManager from './Skills';
import ExperienceManager from './Experiance';


interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  experience: string;
  city: string;
  phone: string;
  currentSalary: string;
  expectedSalary: string;
  gender: string;
  military: string;
  citizenship: string;
  age: string;
  noticePeriod: string;
  additionalInfo: string;
}

const initialState: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  experience: '',
  city: '',
  phone: '',
  currentSalary: '',
  expectedSalary: '',
  gender: '',
  military:'',
  citizenship: '',
  age: '',
  noticePeriod: '',
  additionalInfo: '',
};

const ProfileBuilder: React.FC = () => {
  const [data, setData] = useState<ProfileData>(initialState);
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Required fields for profile completion
  const requiredFields = ['firstName', 'lastName', 'email', 'experience', 'city', 'phone', 'currentSalary', 'expectedSalary'];

  // Helper function to safely check if a field value is filled
  const isFieldFilled = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value);
    return Boolean(value);
  };

  // Function to check if profile is complete
  const isProfileComplete = () => {
    // Check if all required fields are filled
    const allRequiredFieldsFilled = requiredFields.every(field => {
      const value = data[field as keyof ProfileData];
      return isFieldFilled(value);
    });
    
    // Check if resume is uploaded
    const resumeUploaded = !!resumeFile;
    
    // Profile is complete if all required fields are filled, resume is uploaded, and profile is submitted
    return allRequiredFieldsFilled && resumeUploaded && isSubmitted;
  };

  // Function to update profile status
  const updateProfileStatus = () => {
    const complete = isProfileComplete();
    const statusData = {
      completed: complete,
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString(),
      requiredFieldsFilled: requiredFields.every(field => {
        const value = data[field as keyof ProfileData];
        return isFieldFilled(value);
      }),
      resumeUploaded: !!resumeFile,
      submitted: isSubmitted
    };
    
    console.log('Updating profile status:', statusData);
    localStorage.setItem('profileStatus', JSON.stringify(statusData));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('profileStatusChanged', { 
      detail: statusData
    }));
  };

  // Update status whenever data, resume, or submission status changes
  useEffect(() => {
    updateProfileStatus();
  }, [data, resumeFile, isSubmitted]);

  // Load existing profile data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const userEmail = parsedUser?.email;

      if (userEmail) {
        fetch(`http://localhost:5006/api/profiles`)
          .then(res => res.json())
          .then(json => {
            const profile = json.profiles?.find((p: any) => p.email === userEmail);
            if (profile) {
              const { resume, ...rest } = profile;
              setData(rest);
              setResumeFile(resume || null);
              setProfileExists(true);
              setIsSubmitted(true); // If profile exists, it was submitted
            } else {
              setProfileExists(false);
              setIsSubmitted(false);
            }
          })
          .catch(() => {
            setProfileExists(false);
            setIsSubmitted(false);
          });
      }
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file.name);
    }
  };

  const calculateProgress = () => {
    let filled = 0;
    
    // Count filled required fields
    requiredFields.forEach(field => {
      const value = data[field as keyof ProfileData];
      if (isFieldFilled(value)) {
        filled++;
      }
    });
    
    // Count optional fields
    const optionalFields = ['gender', 'citizenship', 'age', 'noticePeriod', 'additionalInfo'];
    optionalFields.forEach(field => {
      const value = data[field as keyof ProfileData];
      if (isFieldFilled(value)) {
        filled++;
      }
    });
    
    // Add resume
    if (resumeFile) filled++;
    
    // Total fields = required + optional + resume
    const totalFields = requiredFields.length + optionalFields.length + 1;
    return Math.round((filled / totalFields) * 100);
  };

  const handleSubmit = async () => {
    // Check if all required fields are filled
    const allRequiredFieldsFilled = requiredFields.every(field => {
      const value = data[field as keyof ProfileData];
      return isFieldFilled(value);
    });

    if (!allRequiredFieldsFilled) {
      alert('⚠️ Please fill all required fields before submitting.');
      return;
    }

    if (!resumeFile) {
      alert('⚠️ Please upload your resume before submitting.');
      return;
    }

    const formData = new FormData();
    formData.append('data', JSON.stringify(data));

    if (fileInputRef.current?.files?.[0]) {
      formData.append('resume', fileInputRef.current.files[0]);
    }

    try {
      const response = await fetch('http://localhost:5006/api/profile', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        
        // Set submission status to true
        setIsSubmitted(true);
        setProfileExists(true);
        
        // Show success message
        alert('✅ Profile submitted successfully!');
        
        // Force immediate status update
        setTimeout(() => {
          updateProfileStatus();
        }, 100);
        
      } else {
        const errorText = await response.text();
        alert(`🚫 Error: ${response.statusText}\nDetails: ${errorText}`);
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        alert(`Network error: ${error.message}`);
      }
    }
  };
      
  

  const handleNavigate = () => {
    if (!isProfileComplete()) {
      alert("⚠️ Please complete and submit your profile before proceeding.");
      return;
    }
    navigate('/another-page');
  };
const [activeTab, setActiveTab] = useState('Personal Details');

  // Calculate completion status for UI
  const requiredFieldsFilled = requiredFields.every(field => {
    const value = data[field as keyof ProfileData];
    return isFieldFilled(value);
  });
  
const calculateGrowthExpectation = (current: string, expected: string) => {
    const currentNum = parseInt(current.replace(/[^\d]/g, ''));
    const expectedNum = parseInt(expected.replace(/[^\d]/g, ''));
    if (currentNum > 0) {
      return Math.round(((expectedNum - currentNum) / currentNum) * 100);
    }
    return 0;
  };

  const resumeUploaded = !!resumeFile;
  const allComplete = isProfileComplete();

  return (
    <div className="min-h-screen rounded-xl  p-4 -mt-8 flex">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl backdrop-blur-md ">
          <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-2xl text-white py-8">
          <h1 className="text-3xl ml-8 font-bold flex justify-center items-center gap-2">
            <UserCog className="w-10 h-10" /> Shape Your Job Profile
          </h1>
          <p className="text-sm justify-center items-center ml-8">Customize and optimize your job application preferences to match your dream role.</p>


</div>


         {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 m-8">
          <div className="flex space-x-6">
            {['Personal Details', 'Exclusions', 'Skills', 'Experience'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold transition-all ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
            {/* Debug info
            <div className="mb-4 p-3 text-white bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-sm">
              <strong>Debug Info:</strong><br/>
              Required Fields Filled: {requiredFieldsFilled ? '✅' : '❌'}<br/>
              Resume Uploaded: {resumeUploaded ? '✅' : '❌'}<br/>
              Profile Submitted: {isSubmitted ? '✅' : '❌'}<br/>
              Profile Complete: {allComplete ? '✅' : '❌'}
            </div> */}
             {activeTab === 'Personal Details' && (
              <div className="p-6 space-y-6">
                {/* Resume Upload */}
                 
                  {!resumeFile ? (
                    <>
                    <div className="p-6 border rounded-xl border-blue-900 border-dashed">
                      <Upload className="w-12 h-12 text-blue-900 mx-auto mb-4" />
                      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                      <label htmlFor="resume-upload" className="cursor-pointer text-blue-400 hover:text-blue-900 font-medium text-center block">
                        Click to upload your resume
                      </label>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-800 to-purple-800 p-4 rounded-xl text-white">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{resumeFile}</p>
                          <p className="text-sm text-blue-200">PDF Document • Uploaded successfully</p>
                        </div>
                      </div>
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <Upload className="w-5 h-5 opacity-60 hover:opacity-100" />
                      </label>
                      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                    </div>
                  )}
                

                {/* Input Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {['firstName', 'lastName', 'email', 'experience', 'city', 'age', 'noticePeriod'].map((field) => (
                    <div key={field} className="flex flex-col">
                      <label className="mb-2 text-sm font-medium text-black">
                        {field === 'experience' ? 'Experience (Years)' : field === 'noticePeriod' ? 'Notice Period (In Days)' : field.charAt(0).toUpperCase() + field.slice(1)}{' '}
                        {requiredFields.includes(field) && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        id={field}
                        name={field}
                        type={field === 'email' ? 'email' : 'text'}
                        value={data[field as keyof ProfileData]}
                        onChange={handleChange}
                        className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                      />
                    </div>
                  ))}

                  <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Phone <span className="text-red-400">*</span></label>
                    <PhoneInput
                      country={'us'}
                      value={data.phone}
                      onChange={(phone) => setData(prev => ({ ...prev, phone }))}
                      inputStyle={{ width: '100%', height: '48px', borderRadius: '8px', border: '1px solid #00000055', paddingLeft: '48px' }}
                      containerStyle={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Salaries + Growth Expectation */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {['currentSalary', 'expectedSalary'].map((field) => (
                    <div key={field} className="flex-1 flex flex-col">
                      <label className="mb-2 text-sm font-medium text-black">
                        {field === 'currentSalary' ? 'Current Salary' : 'Expected Salary'} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name={field}
                        value={data[field as keyof ProfileData]}
                        onChange={handleChange}
                        className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                      />
                    </div>
                  ))}
                  <div className="w-20 h-12 rounded-xl bg-orange-200 flex flex-col items-center justify-center shadow text-orange-600 font-semibold text-xs text-center p-2 mt-[30px]">
                     <span className="text-xs text-orange-800 font-medium">Growth EX.</span>
  
                     <span className="text-xl font-bold">
                      {calculateGrowthExpectation(data.currentSalary, data.expectedSalary)}%
                     </span>
                  </div>

                </div>

                {/* Gender + Citizenship + Military */}
                <div className="flex flex-col lg:flex-row gap-6 w-full">
                  <div className="flex-1 flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Gender</label>
                    <select name="gender" value={data.gender} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Citizenship</label>
                    <select name="citizenship" value={data.citizenship} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black">
                      <option value="">Select citizenship status</option>
                      <option value="citizen">Citizen</option>
                      <option value="visa">Visa</option>
                      <option value="permanent-resident">Permanent Resident</option>
                    </select>
                  </div>

                  {/* <div className="flex-1 flex flex-col">
                    <label className="mb-2 text-sm font-medium text-black">Military / Army Status</label>
                    <select name="military" value={data.military} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black">
                      <option value="">Select military status</option>
                      <option value="Active Duty">Active Duty</option>
                      <option value="No Military Services">No Military Services</option>
                      <option value="Reservist">Reservist</option>
                      <option value="Veteran">Veteran</option>
                    </select>
                  </div> */}
                </div>

                {/* Additional Info */}
                <div className="flex flex-col">
                  <label className="mb-2 text-sm font-medium text-black">Additional Information</label>
                  <textarea name="additionalInfo" value={data.additionalInfo} onChange={handleChange} className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black min-h-[100px]" />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!requiredFieldsFilled || !resumeUploaded}
                  className={`w-full mt-6 py-3 rounded-lg font-bold transition-all ${
                    requiredFieldsFilled && resumeUploaded
                      ? 'bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 text-white'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                >
                  {isSubmitted ? 'Update Profile' : 'Save Profile'}
                </button>
              </div>
            )}

            {activeTab === 'Exclusions' && <div className="text-gray-700"><FilterSettingsConfigs /></div>}
            {activeTab === 'Skills' && <div className="text-gray-700"> <SkillsManager /></div>}
            {activeTab === 'Experience' && <div className="text-gray-700"><ExperienceManager /> </div>}
          </div>
        </div>
      </div>

      
      {/* Sidebar with Profile Status */}
      <div className="w-90 h-[50%] rounded-2xl mr-4 mt-8 bg-gradient-to-r from-indigo-600 to-purple-800 backdrop-blur-md border-lg border-gray-700/50 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Job Profile Status</h2>
          <p className="text-gray-300 text-sm">Access full features after completing your profile.</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${requiredFieldsFilled ? 'bg-green-500' : 'bg-white'}`}>
              {requiredFieldsFilled ? <Check className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Fill required fields</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${resumeUploaded ? 'bg-green-500' : 'bg-white'}`}>
              {resumeUploaded ? <Check className="w-4 h-4 text-white" /> : <Upload className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Upload resume</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSubmitted ? 'bg-green-500' : 'bg-white'}`}>
              {isSubmitted ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Submit your profile</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${allComplete ? 'bg-green-500' : 'bg-white'}`}>
              {allComplete ? <Check className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-black" />}
            </div>
            <span className="text-white text-sm">Profile Complete</span>
          </div>
        </div>

       <div className="flex justify-end mb-6 -mt-40">
  <div className="relative w-32 h-32">
    <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
      {/* Background Circle */}
      <circle
        cx="50%"
        cy="50%"
        r="45"
        stroke="#4B5563"
        strokeWidth="10"
        fill="none"
      />
      {/* Progress Circle */}
      <circle
        cx="50%"
        cy="50%"
        r="45"
        stroke="url(#gradient)"
        strokeWidth="10"
        fill="none"
        strokeDasharray="283"
        strokeDashoffset={`${283 - (calculateProgress() / 100) * 283}`}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>

    {/* Center Text */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
      <span className="text-xs text-gray-300">Profile</span>
      <span className="text-xs text-gray-300">Completion</span>
      <span className="text-xl font-bold">{calculateProgress()}%</span>
    </div>
  </div>
</div>


      </div>
    </div>
  );
};

export default ProfileBuilder;