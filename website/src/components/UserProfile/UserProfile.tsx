import React, { useState, useEffect } from 'react';
import {
  Users, Eye, Trash2, Download, Mail, Phone,
  MapPin, Calendar, DollarSign, FileText, RefreshCw,
  User, CheckCircle, Clock, Briefcase, Award, TrendingUp
} from 'lucide-react';

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  experience: number;
  city: string;
  phone: string;
  currentSalary: string;
  expectedSalary: string;
  gender: string;
  citizenship: string;
  age: number;
  noticePeriod: number;
  additionalInfo: string;
  resume: string;
  createdAt: string;
  updatedAt: string;
}

const ProfilesList: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserEmail(parsedUser?.email ?? null);
        setUserName(parsedUser?.firstname ?? 'User');
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
      }
    } else {
      setError('User not logged in');
      setLoading(false);
    }
  }, []);

  const fetchProfiles = async () => {
    if (!userEmail) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5006/api/profiles');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success) {
        const filtered = data.profiles.filter((profile: Profile) => profile.email === userEmail);
        setProfiles(filtered);
        // Auto-select the first profile
        if (filtered.length > 0) {
          setSelectedProfile(filtered[0]);
        }
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch profiles');
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`http://localhost:5006/api/profile/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedProfiles = profiles.filter(p => p.id !== id);
        setProfiles(updatedProfiles);
        
        // Auto-select the first remaining profile or null if no profiles left
        if (selectedProfile?.id === id) {
          setSelectedProfile(updatedProfiles.length > 0 ? updatedProfiles[0] : null);
        }
        
        alert('Profile deleted successfully!');
      } else {
        alert('Failed to delete profile');
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      alert('Error deleting profile');
    }
  };

  const calculateGrowthExpectation = (current: string, expected: string) => {
    const currentNum = parseInt(current.replace(/[^\d]/g, ''));
    const expectedNum = parseInt(expected.replace(/[^\d]/g, ''));
    if (currentNum > 0) {
      return Math.round(((expectedNum - currentNum) / currentNum) * 100);
    }
    return 0;
  };

  const getSubscriptionStatus = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const trialDays = 30;
    const remainingDays = trialDays - diffDays;
    
    return {
      status: remainingDays > 0 ? 'Trial' : 'Expired',
      daysLeft: remainingDays > 0 ? remainingDays : 0,
      plan: 'Trial'
    };
  };

  useEffect(() => {
    if (userEmail) fetchProfiles();
  }, [userEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
          <p className="text-red-400 text-lg mb-4">Error: {error}</p>
          <button
            onClick={fetchProfiles}
            className="bg-red-600 hover:bg-red-700 text-Black px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-900 text-black-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg- min-h-screen p-6 border-lg border-black-700/50">
          {/* User Profile Section */}
          <div className="bg-gray-200 rounded-xl p-6 mb-6 border-xl border-black-700/50">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-Black font-semibold">{userName}</h3>
                <p className="text-black-900 text-sm">User</p>
                <div className="flex items-center space-x-1 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 text-xs">Verified</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-black-900 space-y-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{userEmail}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          {selectedProfile && (
            <div className="bg-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-Black font-semibold">Subscription</h3>
                <span className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs">
                  {getSubscriptionStatus(selectedProfile.createdAt).status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-300 rounded-lg p-3">
                  <div className="text-green-700 font-semibold">
                    {getSubscriptionStatus(selectedProfile.createdAt).status}
                  </div>
                  <div className="text-black-900 text-sm">Plan</div>
                </div>
                <div className="bg-gray-300 rounded-lg p-3">
                  <div className="text-red-400 font-semibold">
                    -{getSubscriptionStatus(selectedProfile.createdAt).daysLeft}
                  </div>
                  <div className="text-black-900 text-sm">Days Left</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-black-900">
                Expires: {new Date(new Date(selectedProfile.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Applications Section */}
          <div className="bg-gray-200 rounded-xl p-6">
            <h3 className="text-Black font-semibold mb-4">Applications</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-600 rounded-lg p-3 text-center">
                <div className="text-blue-400 font-semibold text-lg">6</div>
                <div className="text-gray-400 text-xs">LinkedIn</div>
              </div>
              <div className="bg-slate-600 rounded-lg p-3 text-center">
                <div className="text-green-400 font-semibold text-lg">0</div>
                <div className="text-gray-400 text-xs">Indeed</div>
              </div>
              <div className="bg-slate-600 rounded-lg p-3 text-center">
                <div className="text-purple-400 font-semibold text-lg">6</div>
                <div className="text-gray-400 text-xs">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col space-y-6">
          {/* Top Section: Profile Cards */}
          <div>
            <h1 className="text-2xl font-bold text-Black mb-4">Profile Dashboard</h1>
            

            {profiles.length === 0 ? (
              <div className="bg-gray-200 rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-Black mb-2">No Profiles Found</h3>
                <p className="text-black-900">Your profile hasn't been created yet!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`bg-gray-200 rounded-xl p-6 border transition-all ${
                      selectedProfile?.id === profile.id
                        ? 'border-blue-500 bg-slate-700'
                        : 'border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-Black mb-3">
                          {profile.firstName} {profile.lastName}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-black-900">
                            <Mail className="w-4 h-4" />
                            <span>{profile.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-black-900">
                            <Phone className="w-4 h-4" />
                            <span>{profile.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-black-900">
                            <MapPin className="w-4 h-4" />
                            <span>{profile.city}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-black-900">
                            <Briefcase className="w-4 h-4" />
                            <span>{profile.experience} years</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          className="p-2 bg-red-500 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProfile(profile.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Middle Section: Profile Details + Salary */}
          {selectedProfile && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Profile Details */}
              <div className="w-full lg:w-1/2   border-blue-600 bg-gray-200 rounded-xl p-6">
                <div className="text-xl font-bold text-Black mb-4">Profile Details</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedProfile.firstName} {selectedProfile.lastName}</div>
                  <div><strong>Phone:</strong> {selectedProfile.phone}</div>
                  <div><strong>Experience:</strong> {selectedProfile.experience} Years</div>
                  <div><strong>Age:</strong> {selectedProfile.age}</div>
                  <div><strong>Gender:</strong> {selectedProfile.gender}</div>
                  <div><strong>Citizenship:</strong> {selectedProfile.citizenship}</div>
                  <div><strong>Location:</strong> {selectedProfile.city}</div>
                  <div><strong>Notice Period:</strong> {selectedProfile.noticePeriod} Days</div>
                </div>
              </div>

              {/* Salary Details */}
              <div className="w-full lg:w-1/2 bg-gray-200 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-Black">Salary Details</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-gray-900">Current</label>
                    <div className="text-green-500 font-semibold text-lg">
                      ${selectedProfile.currentSalary}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-900">Expected</label>
                    <div className="text-blue-400 font-semibold text-lg">
                      ${selectedProfile.expectedSalary}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-900">Growth Expectation</label>
                    <div className="text-orange-500 font-semibold">
                      {calculateGrowthExpectation(selectedProfile.currentSalary, selectedProfile.expectedSalary)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Section: Documents */}
          {selectedProfile && (
            <div className="bg-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-Black">Documents</h3>
              </div>
              <div className="space-y-3">
                {selectedProfile.resume ? (
                  <div className="bg-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-Black font-medium">Resume</div>
                        <div className="text-gray-900 text-sm truncate">
                          {selectedProfile.resume}
                        </div>
                      </div>
                      <a
                        href={`http://localhost:5006/uploads/${selectedProfile.resume}`}
                        download
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-200 rounded-lg p-4 opacity-50">
                    <div className="text-gray-900">No Resume Uploaded</div>
                  </div>
                )}

                {/* Placeholder for Cover Letter */}
                <div className="bg-gray-400 rounded-lg p-4 opacity-50">
                  <div className="text-gray-900">Cover Letter</div>
                  <div className="text-gray-900 text-sm">Not uploaded</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilesList;