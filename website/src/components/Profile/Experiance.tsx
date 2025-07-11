import React, { useState, useEffect } from 'react';
import { Plus, X, Building, Calendar, User } from 'lucide-react';
import { useAuth } from '../AuthContext'; // adjust the path as needed

interface Experience {
  id: string;
  companyName: string;
  jobRole: string;
  yearsWorked: string;
  currentlyWorking: boolean;
}

const ExperienceManager: React.FC = () => {
  const { user } = useAuth();
  const userEmail = user?.email || 'guest';
  const storageKey = `workExperiences_${userEmail}`;

  const [experiences, setExperiences] = useState<Experience[]>([{
    id: '1',
    companyName: '',
    jobRole: '',
    yearsWorked: '',
    currentlyWorking: false
  }]);

  const [savedExperiences, setSavedExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedExperiences(parsed);
      } catch (error) {
        console.error('Error parsing saved experiences:', error);
      }
    }
  }, [storageKey]); // ✅ FIXED: include storageKey as dependency

  const addExperience = () => {
    setExperiences([...experiences, {
      id: Date.now().toString(),
      companyName: '',
      jobRole: '',
      yearsWorked: '',
      currentlyWorking: false
    }]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(exp => exp.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperiences(experiences.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const saveExperiences = () => {
    const validExperiences = experiences.filter(exp =>
      exp.companyName.trim() || exp.jobRole.trim() || exp.yearsWorked.trim()
    );

    if (validExperiences.length === 0) {
      alert('Please add at least one experience before saving.');
      return;
    }

    const allSaved = [...savedExperiences, ...validExperiences];
    localStorage.setItem(storageKey, JSON.stringify(allSaved));
    setSavedExperiences(allSaved);
    setExperiences([{
      id: Date.now().toString(),
      companyName: '',
      jobRole: '',
      yearsWorked: '',
      currentlyWorking: false
    }]);
    alert('Experiences saved successfully!');
  };

  const deleteSavedExperience = (id: string) => {
    const updated = savedExperiences.filter(exp => exp.id !== id);
    setSavedExperiences(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const clearAllExperiences = () => {
    if (window.confirm('Are you sure you want to clear all saved experiences?')) {
      setSavedExperiences([]);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-blue-600 to-purple-700">
          Work Experience
        </h1>
      </div>

      {/* Add Experience Form */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-black mb-4">Add New Experience</h2>
        <div className="space-y-4">
          {experiences.map((experience) => (
            <div
              key={experience.id}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={experience.companyName}
                    onChange={(e) => updateExperience(experience.id, 'companyName', e.target.value)}
                    className="w-full bg-white text-black px-3 py-2 rounded-lg border border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Job Role
                  </label>
                  <input
                    type="text"
                    value={experience.jobRole}
                    onChange={(e) => updateExperience(experience.id, 'jobRole', e.target.value)}
                    className="w-full bg-white text-black px-3 py-2 rounded-lg border border-gray-600"
                    placeholder="Enter job role"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Years Worked
                  </label>
                  <input
                    type="text"
                    value={experience.yearsWorked}
                    onChange={(e) => updateExperience(experience.id, 'yearsWorked', e.target.value)}
                    className="w-full bg-white text-black px-3 py-2 rounded-lg border border-gray-600"
                    placeholder="e.g., 2020-2023"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`currently-working-${experience.id}`}
                    checked={experience.currentlyWorking}
                    onChange={(e) => updateExperience(experience.id, 'currentlyWorking', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                  />
                  <label htmlFor={`currently-working-${experience.id}`} className="text-sm text-gray-900 cursor-pointer">
                    I currently work here
                  </label>
                </div>

                {experiences.length > 1 && (
                  <button
                    onClick={() => removeExperience(experience.id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={addExperience}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-400 text-sm font-medium"
          >
            <Plus size={16} />
            Add Experience
          </button>
        </div>

        <div className="mt-8">
          <button
            onClick={saveExperiences}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium py-3 px-6 rounded-lg"
          >
            Save Experiences
          </button>
        </div>
      </div>

      {savedExperiences.length > 0 && (
        <div className="mt-12 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Saved Experiences</h2>
            <button
              onClick={clearAllExperiences}
              className="text-red-400 bg-red-100 p-2 border border-red-300 rounded-xl"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {savedExperiences.map((experience) => (
              <div
                key={experience.id}
                className="bg-gray-20 shadow rounded-lg p-6 border hover:border-gray-600"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building size={18} className="text-blue-400" />
                      <h3 className="text-lg font-semibold text-black">
                        {experience.companyName || 'Company Name Not Provided'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-gray-900" />
                      <span className="text-gray-900">
                        {experience.jobRole || 'Job Role Not Provided'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-gray-900" />
                      <span className="text-gray-900">
                        {experience.yearsWorked || 'Years Not Provided'}
                        {experience.currentlyWorking && (
                          <span className="ml-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                            Currently Working
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteSavedExperience(experience.id)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedExperiences.length === 0 && (
        <div className="mt-12 text-center py-8">
          <div className="text-gray-500 mb-4">
            <Building size={48} className="mx-auto mb-2" />
            <p className="text-lg">No experiences saved yet</p>
            <p className="text-sm">Add your first work experience above</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceManager;
