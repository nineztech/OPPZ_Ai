import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  experience: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

const SkillsManager: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', name: 'JavaScript', experience: 4, level: 'Intermediate' },
    { id: '2', name: 'React.js', experience: 3, level: 'Intermediate' },
    { id: '3', name: 'Node.js', experience: 3, level: 'Intermediate' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', experience: 1, level: 'Beginner' as const });

  const getLevelFromExperience = (experience: number): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' => {
    if (experience <= 1) return 'Beginner';
    if (experience <= 3) return 'Intermediate';
    if (experience <= 5) return 'Advanced';
    return 'Expert';
  };

  const getFilledDots = (level: string): number => {
    switch (level) {
      case 'Beginner': return 1;
      case 'Intermediate': return 2;
      case 'Advanced': return 4;
      case 'Expert': return 5;
      default: return 1;
    }
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const level = getLevelFromExperience(newSkill.experience);
      const skill: Skill = {
        id: Date.now().toString(),
        name: newSkill.name.trim(),
        experience: newSkill.experience,
        level,
      };
      setSkills([...skills, skill]);
      setNewSkill({ name: '', experience: 1, level: 'Beginner' });
      setShowAddForm(false);
    }
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const renderDots = (level: string) => {
    const filledDots = getFilledDots(level);
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            className={`w-2 h-2 rounded-full ${
              dot <= filledDots ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">Skills</h1>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Skill
        </button>
      </div>

      {/* Add Skill Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Skill</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Skill Name
              </label>
              <input
                type="text"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="w-full bg-gray-200 text-black px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Python, React, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100 mb-2">
                Experience (Years)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={newSkill.experience}
                onChange={(e) => setNewSkill({ 
                  ...newSkill, 
                  experience: parseInt(e.target.value) || 1 
                })}
                className="w-full bg-gray-200 text-black px-3 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100 mb-2">
                Level
              </label>
              <div className="bg-gray-200 text-black px-3 py-2 rounded-lg border border-gray-600">
                {getLevelFromExperience(newSkill.experience)}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={addSkill}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Skill
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewSkill({ name: '', experience: 1, level: 'Beginner' });
              }}
              className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-4">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-white shadow to-purple-600 rounded-lg p-6 border    "
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-black uppercase tracking-wide">
                    {skill.name}
                  </h3>
                  <button
                    onClick={() => removeSkill(skill.id)}
                    className="text-red-500 hover:text-red-300 p-1 hover:bg-red-900/20 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="h-px bg-gray-900 mb-4"></div>
              </div>
              <div className="flex flex-col items-end ml-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-700">{skill.experience}</span>
                  <span className="text-sm text-gray-900">yrs</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-900">Level:</span>
                {renderDots(skill.level)}
              </div>
              <span className="text-sm text-gray-900 font-medium">
                {skill.level}
              </span>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && !showAddForm && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No skills added yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Your First Skill
          </button>
        </div>
      )}
    </div>
  );
};

export default SkillsManager;