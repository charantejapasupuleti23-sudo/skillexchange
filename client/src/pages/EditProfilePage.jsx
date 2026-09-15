import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SkillBadge from '../components/SkillBadge';
import {
  User,
  Briefcase,
  MapPin,
  FileText,
  Calendar,
  Lock,
  Plus,
  Trash2,
  Save,
  Loader2,
  Award,
  GraduationCap,
} from 'lucide-react';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const EditProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Basic Profile Fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Skills
  const [availableSkills, setAvailableSkills] = useState([]);
  const [newTeachSkillId, setNewTeachSkillId] = useState('');
  const [newTeachLevel, setNewTeachLevel] = useState('Intermediate');
  const [newTeachExp, setNewTeachExp] = useState(2);
  const [newTeachDesc, setNewTeachDesc] = useState('');

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setOccupation(user.occupation || '');
      setEducation(user.education || '');
      setExperience(user.experience || '');
      setGithub(user.socialLinks?.github || '');
      setLinkedin(user.socialLinks?.linkedin || '');
      setWebsite(user.socialLinks?.website || '');
    }

    const fetchSkills = async () => {
      try {
        const res = await api.get('/skills');
        if (res.data.success) {
          setAvailableSkills(res.data.data);
          if (res.data.data.length > 0) {
            setNewTeachSkillId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSkills();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put('/auth/profile', {
        name,
        bio,
        location,
        occupation,
        education,
        experience,
        socialLinks: {
          github,
          linkedin,
          website,
        },
      });

      if (res.data.success) {
        addToast('Profile updated successfully!', 'success');
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddTeachingSkill = async (e) => {
    e.preventDefault();
    if (!newTeachSkillId) return;

    try {
      const res = await api.post('/users/skills/teach', {
        skillId: newTeachSkillId,
        level: newTeachLevel,
        yearsOfExperience: Number(newTeachExp),
        description: newTeachDesc,
      });

      if (res.data.success) {
        addToast('Teaching skill added!', 'success');
        setNewTeachDesc('');
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add teaching skill', 'error');
    }
  };

  const handleRemoveTeachingSkill = async (skillId) => {
    try {
      const res = await api.delete(`/users/skills/teach/${skillId}`);
      if (res.data.success) {
        addToast('Skill removed', 'info');
        await refreshUser();
      }
    } catch (err) {
      addToast('Failed to remove skill', 'error');
    }
  };

  const handleRemoveLearningSkill = async (skillId) => {
    try {
      const res = await api.delete(`/users/skills/learn/${skillId}`);
      if (res.data.success) {
        addToast('Skill removed', 'info');
        await refreshUser();
      }
    } catch (err) {
      addToast('Failed to remove skill', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.put('/auth/password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        addToast('Password updated successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Edit Your Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep your skills, background, and availability up to date to maximize match accuracy
        </p>
      </div>

      {/* Basic Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5"
      >
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Personal & Professional Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Occupation / Headline:</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Education:</label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. B.S. in Computer Science"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-1">Bio:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell peers what you love teaching and what motivates your learning journey..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-1">Experience Summary:</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={2}
            placeholder="Years in the field, major projects or companies worked with..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">GitHub URL:</label>
            <input
              type="url"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">LinkedIn URL:</label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Portfolio / Website:</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://mywebsite.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>

      {/* Skills Management Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Skills You Can Teach</span>
        </h2>

        {/* Existing teaching skills */}
        <div className="space-y-2">
          {user?.skillsToTeach?.map((item, idx) => {
            const sId = item.skill?._id || item.skill;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{item.skill?.name || 'Skill'}</span>
                  <span className="text-slate-400 ml-2">({item.level}, {item.yearsOfExperience} yrs exp)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveTeachingSkill(sId)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Add teaching skill form */}
        <form onSubmit={handleAddTeachingSkill} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
          <h3 className="text-xs font-bold text-indigo-900">Add a New Teaching Skill</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Skill:</label>
              <select
                value={newTeachSkillId}
                onChange={(e) => setNewTeachSkillId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                required
              >
                {availableSkills.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proficiency Level:</label>
              <select
                value={newTeachLevel}
                onChange={(e) => setNewTeachLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Years of Experience:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={newTeachExp}
                onChange={(e) => setNewTeachExp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Description / Key Topics:</label>
            <input
              type="text"
              value={newTeachDesc}
              onChange={(e) => setNewTeachDesc(e.target.value)}
              placeholder="e.g. Components, Hooks, State management, Performance tuning..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </form>
      </div>

      {/* Change Password Section */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4"
      >
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          <span>Security & Password</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password:</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={changingPassword}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
