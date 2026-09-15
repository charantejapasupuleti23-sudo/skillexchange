import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SkillBadge from '../components/SkillBadge';
import EmptyState from '../components/EmptyState';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Plus,
  Loader2,
} from 'lucide-react';

const LearnPage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [targetLevel, setTargetLevel] = useState('Beginner');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/skills');
        if (res.data.success) {
          setAvailableSkills(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSkillId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSkills();
  }, []);

  const handleAddLearningSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    try {
      setAddingSkill(true);
      const res = await api.post('/users/skills/learn', {
        skillId: selectedSkillId,
        level: targetLevel,
        desiredOutcome,
      });

      if (res.data.success) {
        addToast('Learning goal added!', 'success');
        setDesiredOutcome('');
        setShowAddForm(false);
        await refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add learning goal', 'error');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleUpdateProgress = async (skillId, newProgress) => {
    try {
      const res = await api.put('/users/skills/progress', {
        skillId,
        progress: newProgress,
      });
      if (res.data.success) {
        addToast('Skill progress updated!', 'success');
        await refreshUser();
      }
    } catch (err) {
      addToast('Failed to update progress', 'error');
    }
  };

  const learningSkills = user?.skillsToLearn || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Learning Roadmap & Progress
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track mastery levels, completed sessions, and milestones for every target skill
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Learning Goal</span>
        </button>
      </div>

      {/* Add Learning Goal Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddLearningSkill}
          className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-4 animate-fade-in"
        >
          <h3 className="font-bold text-slate-900 text-sm">Add a Skill You Want to Learn</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                Select Skill:
              </label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                Current Level:
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="Beginner">Beginner (Starting from scratch)</option>
                <option value="Intermediate">Intermediate (Know fundamentals)</option>
                <option value="Advanced">Advanced (Want mastery)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">
              Desired Outcome / Milestone Goal:
            </label>
            <input
              type="text"
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="e.g. Build a production React portfolio or understand database indexes..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingSkill}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
            >
              {addingSkill && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Learning Goal</span>
            </button>
          </div>
        </form>
      )}

      {/* Learning Goals Feed */}
      {learningSkills.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No learning goals added yet"
          description="Add skills you want to learn to get personalized peer matches and track your progress!"
          actionText="Add Your First Skill"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        <div className="space-y-4">
          {learningSkills.map((item, idx) => {
            const skillObj = item.skill;
            const progress = item.progress || 0;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <SkillBadge skill={skillObj} level={item.level} size="lg" />
                    {progress === 100 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Mastered</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/discover?skill=${encodeURIComponent(skillObj?.name || '')}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Find Mentors for {skillObj?.name} →
                  </Link>
                </div>

                {item.desiredOutcome && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Target Outcome: </span>
                    {item.desiredOutcome}
                  </p>
                )}

                {/* Progress Bar & Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Mastery Progress</span>
                    <span className="text-indigo-600 font-bold">{progress}%</span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Sessions completed: {item.sessionsCompleted || 0}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateProgress(skillObj?._id || skillObj, Math.max(0, progress - 10))
                        }
                        className="px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                        title="-10% progress"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateProgress(skillObj?._id || skillObj, Math.min(100, progress + 10))
                        }
                        className="px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                        title="+10% progress"
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                </div>

                {item.lastLearned && (
                  <div className="text-[11px] text-slate-400">
                    Last session:{' '}
                    {new Date(item.lastLearned).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearnPage;
