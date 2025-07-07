import React, { useState, useRef, useEffect } from 'react';
import { Check, Upload, User, Save } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useNavigate } from 'react-router-dom';

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

  // Calculate completion status for UI
  const requiredFieldsFilled = requiredFields.every(field => {
    const value = data[field as keyof ProfileData];
    return isFieldFilled(value);
  });
  
  const resumeUploaded = !!resumeFile;
  const allComplete = isProfileComplete();

  return (
    <div className="min-h-screen rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex">
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl backdrop-blur-md p-8">
            <h1 className="text-3xl font-bold mb-8 text-black">Build Your Profile</h1>

            {/* Debug info */}
            <div className="mb-4 p-3 text-white bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-sm">
              <strong>Debug Info:</strong><br/>
              Required Fields Filled: {requiredFieldsFilled ? '✅' : '❌'}<br/>
              Resume Uploaded: {resumeUploaded ? '✅' : '❌'}<br/>
              Profile Submitted: {isSubmitted ? '✅' : '❌'}<br/>
              Profile Complete: {allComplete ? '✅' : '❌'}
            </div>

            <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-lg font-semibold text-black mb-4">Upload Resume *</h3>
              <div className="border-2 border-dashed border-blue-900 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-blue-900 mx-auto mb-4" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="cursor-pointer text-blue-400 hover:text-blue-900 font-medium"
                >
                  Click to upload your resume
                </label>
                {resumeFile && (
                  <p className="text-green-600 text-sm mt-2">✓ {resumeFile} uploaded</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array.from(Object.entries({
                  firstName: 'First Name',
                  lastName: 'Last Name',
                  email: 'Email',
                  experience: 'Experience (Years)',
                  city: 'City',
                  currentSalary: 'Current Salary',
                  expectedSalary: 'Expected Salary',
                  age: 'Age',
                  noticePeriod: 'Notice Period (Days)',
                }))].map(([name, label]) => {
                  const isRequired = requiredFields.includes(name);
                  
                  return (
                    <div key={name} className="flex flex-col">
                      <label htmlFor={name} className="mb-2 text-sm font-medium text-black">
                        {label} {isRequired && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        id={name}
                        name={name}
                        type={name === 'email' ? 'email' : 'text'}
                        value={(data as any)[name]}
                        onChange={handleChange}
                        className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                        required={isRequired}
                      />
                    </div>
                  );
                })}

                <div className="flex flex-col">
                  <label htmlFor="phone" className="mb-2 text-sm font-medium text-black">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <PhoneInput
                    country={'us'}
                    value={data.phone}
                    onChange={(phone) => setData(prev => ({ ...prev, phone }))}
                    inputStyle={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '8px',
                      border: '1px solid #00000055',
                      paddingLeft: '48px',
                    }}
                    containerStyle={{ width: '100%' }}
                  />
                </div>

                <div className="flex flex-col">
                  <label htmlFor="gender" className="mb-2 text-sm font-medium text-black">Gender</label>
                  <select
                    name="gender"
                    value={data.gender}
                    onChange={handleChange}
                    className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label htmlFor="citizenship" className="mb-2 text-sm font-medium text-black">Citizenship</label>
                  <select
                    name="citizenship"
                    value={data.citizenship}
                    onChange={handleChange}
                    className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black"
                  >
                    <option value="">Select citizenship status</option>
                    <option value="citizen">Citizen</option>
                    <option value="visa">Visa</option>
                    <option value="permanent-resident">Permanent Resident</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col">
                <label htmlFor="additionalInfo" className="mb-2 text-sm font-medium text-black">
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={data.additionalInfo}
                  onChange={handleChange}
                  className="bg-white/10 border border-black/35 rounded-lg px-4 py-3 text-black min-h-[100px]"
                />
              </div>

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
          </div>
        </div>
      </div>

      <div className="w-80 h-[50%] rounded-2xl mr-4 mt-8 bg-blue-900/50 backdrop-blur-md border-lg border-gray-700/50 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Complete Your Profile</h2>
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

        <div className="text-right mb-2">
          <span className="text-white text-sm font-medium">{calculateProgress()}% complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${calculateProgress()}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBuilder;