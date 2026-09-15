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
  Clock,
  Camera,
  Upload,
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

const OCCUPATION_OPTIONS = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Mobile App Developer (iOS / Android)',
  'UI/UX Designer',
  'Product Manager',
  'Data Scientist / AI Engineer',
  'DevOps & Cloud Engineer',
  'Cybersecurity Specialist',
  'Software Architect',
  'Student / CS Major',
  'Freelance Consultant',
];

const EDUCATION_OPTIONS = [
  'B.S. in Computer Science',
  'B.Tech / B.E. in Engineering',
  'Bachelor of Science (B.S.)',
  'Bachelor of Arts (B.A.)',
  'Master of Science (M.S.) in CS / IT',
  'Master of Business Administration (MBA)',
  'Ph.D. / Doctorate',
  'Associate Degree',
  'Coding Bootcamp Graduate',
  'Self-Taught Developer',
  'High School Diploma',
];

const LOCATION_OPTIONS = [
  'Remote (Worldwide)',
  'San Francisco, CA, USA',
  'New York, NY, USA',
  'Seattle, WA, USA',
  'Austin, TX, USA',
  'London, UK',
  'Berlin, Germany',
  'Toronto, Canada',
  'Bangalore, India',
  'Hyderabad, India',
  'Singapore',
  'Tokyo, Japan',
  'Sydney, Australia',
];

const EXPERIENCE_PRESETS = [
  'Beginner / Student (< 1 year)',
  'Junior Developer (1 - 2 years)',
  'Mid-Level Professional (3 - 5 years)',
  'Senior Specialist (5 - 8 years)',
  'Lead / Principal Engineer (8 - 12 years)',
  'Director / Staff (12+ years)',
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const YEARS_OPTIONS = [
  { value: 0, label: 'Less than 1 year' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3 years' },
  { value: 4, label: '4 years' },
  { value: 5, label: '5 years' },
  { value: 7, label: '6 - 9 years' },
  { value: 10, label: '10+ years' },
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

  // Learn Skills
  const [newLearnSkillId, setNewLearnSkillId] = useState('');
  const [newLearnLevel, setNewLearnLevel] = useState('Beginner');
  const [newLearnOutcome, setNewLearnOutcome] = useState('');

  // Availability Schedule
  const [availDay, setAvailDay] = useState('Monday');
  const [availStartTime, setAvailStartTime] = useState('09:00');
  const [availEndTime, setAvailEndTime] = useState('17:00');
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
            setNewLearnSkillId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSkills();
  }, [user]);

  // Group available skills by category for organized dropdown menus
  const groupedSkills = availableSkills.reduce((acc, skill) => {
    const cat = skill.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image must be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploadingAvatar(true);
      const res = await api.put('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        addToast('Profile photo updated successfully!', 'success');
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  const handleAddLearningSkill = async (e) => {
    e.preventDefault();
    if (!newLearnSkillId) return;

    try {
      const res = await api.post('/users/skills/learn', {
        skillId: newLearnSkillId,
        level: newLearnLevel,
        desiredOutcome: newLearnOutcome,
      });

      if (res.data.success) {
        addToast('Learning skill goal added!', 'success');
        setNewLearnOutcome('');
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add learning skill', 'error');
    }
  };

  const handleRemoveLearningSkill = async (skillId) => {
    try {
      const res = await api.delete(`/users/skills/learn/${skillId}`);
      if (res.data.success) {
        addToast('Learning goal removed', 'info');
        await refreshUser();
      }
    } catch (err) {
      addToast('Failed to remove skill', 'error');
    }
  };

  const handleAddAvailabilitySlot = async (e) => {
    e.preventDefault();

    const currentAvailability = user?.availability || [];
    const daySchedule = currentAvailability.find((a) => a.day === availDay);

    let updatedAvailability;
    if (daySchedule) {
      // Add slot to existing day
      updatedAvailability = currentAvailability.map((item) => {
        if (item.day === availDay) {
          return {
            ...item,
            slots: [...(item.slots || []), { startTime: availStartTime, endTime: availEndTime }],
          };
        }
        return item;
      });
    } else {
      // Add new day with slot
      updatedAvailability = [
        ...currentAvailability,
        {
          day: availDay,
          slots: [{ startTime: availStartTime, endTime: availEndTime }],
        },
      ];
    }

    try {
      setSavingAvailability(true);
      const res = await api.put('/users/availability', { availability: updatedAvailability });
      if (res.data.success) {
        addToast('Availability slot added!', 'success');
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update availability', 'error');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleRemoveAvailabilitySlot = async (day, slotIndex) => {
    const currentAvailability = user?.availability || [];
    const updatedAvailability = currentAvailability
      .map((item) => {
        if (item.day === day) {
          const newSlots = item.slots.filter((_, idx) => idx !== slotIndex);
          return { ...item, slots: newSlots };
        }
        return item;
      })
      .filter((item) => item.slots.length > 0);

    try {
      setSavingAvailability(true);
      const res = await api.put('/users/availability', { availability: updatedAvailability });
      if (res.data.success) {
        addToast('Availability slot removed', 'info');
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update availability', 'error');
    } finally {
      setSavingAvailability(false);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Edit Your Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep your skills, background, and weekly schedule up to date
        </p>
      </div>

      {/* Profile Photo Section - Upload Only */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-600" />
          <span>Profile Photo</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <img
              src={user?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Profile'}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-50 shadow-md"
            />
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-slate-900/60 rounded-3xl flex items-center justify-center text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <p className="text-xs font-semibold text-slate-800">Update your profile photo</p>
            <p className="text-[11px] text-slate-500">Upload a JPG, PNG, or WebP photo up to 5MB.</p>
            <div>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer transition-colors shadow-xs">
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{uploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Personal & Professional Form - Single Input Boxes with Dropdown Suggestions */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5"
      >
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Personal & Professional Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          {/* Full Name */}
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

          {/* Occupation / Headline - Single Box with Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Occupation / Headline:</label>
            <input
              type="text"
              list="occupation-list"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <datalist id="occupation-list">
              {OCCUPATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>

          {/* Location - Single Box with Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location:</label>
            <input
              type="text"
              list="location-list"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA, USA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <datalist id="location-list">
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>

          {/* Education / Degree - Single Box with Dropdown */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Education / Degree:</label>
            <input
              type="text"
              list="education-list"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g. B.S. in Computer Science"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <datalist id="education-list">
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Experience Summary - Single Box with Dropdown */}
        <div>
          <label className="block font-semibold text-slate-700 text-xs mb-1">
            Experience Level & Summary:
          </label>
          <input
            type="text"
            list="experience-list"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="e.g. Mid-Level Professional (3 - 5 years), React & Node.js specialist..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
          <datalist id="experience-list">
            {EXPERIENCE_PRESETS.map((opt) => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        </div>

        {/* Bio */}
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

      {/* Skills You Can Teach Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Skills You Can Teach</span>
        </h2>

        {/* Existing teaching skills */}
        <div className="space-y-2">
          {user?.skillsToTeach && user.skillsToTeach.length > 0 ? (
            user.skillsToTeach.map((item, idx) => {
              const sId = item.skill?._id || item.skill;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{item.skill?.name || 'Skill'}</span>
                    <span className="text-indigo-600 font-medium ml-2">({item.level})</span>
                    <span className="text-slate-400 ml-2">• {item.yearsOfExperience} yrs exp</span>
                    {item.description && (
                      <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeachingSkill(sId)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove Skill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">No teaching skills added yet.</p>
          )}
        </div>

        {/* Add teaching skill form */}
        <form onSubmit={handleAddTeachingSkill} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
          <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Teaching Skill</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Skill Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Skill:</label>
              <select
                value={newTeachSkillId}
                onChange={(e) => setNewTeachSkillId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              >
                {Object.keys(groupedSkills).map((category) => (
                  <optgroup key={category} label={category}>
                    {groupedSkills[category].map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Level Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proficiency Level:</label>
              <select
                value={newTeachLevel}
                onChange={(e) => setNewTeachLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Experience:</label>
              <select
                value={newTeachExp}
                onChange={(e) => setNewTeachExp(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {YEARS_OPTIONS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
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
            <span>Add Teaching Skill</span>
          </button>
        </form>
      </div>

      {/* Skills You Want to Learn Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>Skills You Want to Learn</span>
        </h2>

        {/* Existing learning skills */}
        <div className="space-y-2">
          {user?.skillsToLearn && user.skillsToLearn.length > 0 ? (
            user.skillsToLearn.map((item, idx) => {
              const sId = item.skill?._id || item.skill;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{item.skill?.name || 'Skill'}</span>
                    <span className="text-emerald-600 font-medium ml-2">({item.level || 'Beginner'})</span>
                    {item.desiredOutcome && (
                      <p className="text-slate-500 text-[11px] mt-0.5">Goal: {item.desiredOutcome}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveLearningSkill(sId)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove Skill Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">No learning goals added yet.</p>
          )}
        </div>

        {/* Add learning skill form */}
        <form onSubmit={handleAddLearningSkill} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
          <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add a Learning Goal</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Skill Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Skill:</label>
              <select
                value={newLearnSkillId}
                onChange={(e) => setNewLearnSkillId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              >
                {Object.keys(groupedSkills).map((category) => (
                  <optgroup key={category} label={category}>
                    {groupedSkills[category].map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Target Level */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Proficiency Level:</label>
              <select
                value={newLearnLevel}
                onChange={(e) => setNewLearnLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Beginner">Beginner (Fundamentals)</option>
                <option value="Intermediate">Intermediate (Practical Application)</option>
                <option value="Advanced">Advanced (Deep Dive & Architecture)</option>
                <option value="Expert">Expert (Mastery)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Learning Goal / Desired Outcome:</label>
            <input
              type="text"
              value={newLearnOutcome}
              onChange={(e) => setNewLearnOutcome(e.target.value)}
              placeholder="e.g. Build end-to-end full stack web applications and prepare for tech interviews..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Learning Goal</span>
          </button>
        </form>
      </div>

      {/* Weekly Availability Schedule Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Weekly Availability Schedule</span>
        </h2>

        {/* Existing availability */}
        <div className="space-y-3">
          {user?.availability && user.availability.length > 0 ? (
            user.availability.map((dayItem, dayIdx) => (
              <div key={dayIdx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {dayItem.day}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dayItem.slots?.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                    >
                      <span>{slot.startTime} - {slot.endTime}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAvailabilitySlot(dayItem.day, sIdx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove Slot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No scheduled availability slots configured yet.</p>
          )}
        </div>

        {/* Add availability slot form */}
        <form onSubmit={handleAddAvailabilitySlot} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 space-y-3">
          <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Available Time Slot</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Day Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Day of Week:</label>
              <select
                value={availDay}
                onChange={(e) => setAvailDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time:</label>
              <select
                value={availStartTime}
                onChange={(e) => setAvailStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* End Time Dropdown */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time:</label>
              <select
                value={availEndTime}
                onChange={(e) => setAvailEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingAvailability}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            {savingAvailability ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Slot</span>
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
