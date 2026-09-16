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
  Flame,
  Coins,
  Map,
  Code2,
  Binary,
  Cpu,
  Server,
  Palette,
  CheckSquare,
  Square,
  ShieldCheck,
  History,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

const ICON_MAP = {
  Code2: Code2,
  Binary: Binary,
  Cpu: Cpu,
  Server: Server,
  Palette: Palette,
};

const LearnPage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('roadmaps'); // 'roadmaps' | 'skills' | 'badges' | 'wallet'

  // Roadmaps state
  const [roadmaps, setRoadmaps] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [expandedRoadmap, setExpandedRoadmap] = useState('fullstack-dev');

  // Wallet state
  const [walletData, setWalletData] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Badges state
  const [badgesData, setBadgesData] = useState(null);
  const [loadingBadges, setLoadingBadges] = useState(false);

  // Add Skill state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [targetLevel, setTargetLevel] = useState('Beginner');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchRoadmaps();
    fetchWallet();
    fetchBadges();
    fetchSkills();
  }, []);

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

  const fetchRoadmaps = async () => {
    try {
      setLoadingRoadmaps(true);
      const res = await api.get('/gamification/roadmaps');
      if (res.data.success) {
        setRoadmaps(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoadmaps(false);
    }
  };

  const fetchWallet = async () => {
    try {
      setLoadingWallet(true);
      const res = await api.get('/gamification/wallet');
      if (res.data.success) {
        setWalletData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchBadges = async () => {
    try {
      setLoadingBadges(true);
      const res = await api.get('/gamification/badges');
      if (res.data.success) {
        setBadgesData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBadges(false);
    }
  };

  const handleToggleTopic = async (roadmapId, topicName) => {
    try {
      const res = await api.put(`/gamification/roadmaps/${roadmapId}/topic`, {
        topicName,
      });
      if (res.data.success) {
        setRoadmaps((prev) =>
          prev.map((r) => {
            if (r.id === roadmapId) {
              const topics = res.data.data.completedTopics;
              return {
                ...r,
                completedTopics: topics,
                progress: Math.round((topics.length / r.topics.length) * 100),
              };
            }
            return r;
          })
        );
        addToast('Topic milestone updated!', 'success');
        fetchBadges();
      }
    } catch (err) {
      addToast('Failed to update topic', 'error');
    }
  };

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
  const streakCount = user?.streak?.current ?? 3;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Gamification Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 text-amber-300">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{streakCount}-Week Active Learning Streak</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Learning Roadmaps & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200">
            Check off topics covered during peer sessions, track structured learning paths, and build credibility.
          </p>
        </div>

        {/* Quick Stats Widget */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Credits</span>
            <span className="text-xl font-extrabold text-white">{user?.timeCredits ?? 5}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Taught</span>
            <span className="text-xl font-extrabold text-amber-300">{user?.completedSessions || 0} hrs</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Badges</span>
            <span className="text-xl font-extrabold text-emerald-300">{user?.badges?.length || 2}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: 'roadmaps', label: 'Interactive Roadmaps', icon: Map },
          { id: 'skills', label: 'My Target Skills', icon: GraduationCap },
          { id: 'badges', label: 'Streaks & Badges', icon: Award },
          { id: 'wallet', label: 'Time-Banking Ledger', icon: Coins },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Interactive Roadmaps */}
      {activeTab === 'roadmaps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Curated Peer Roadmaps</h2>
              <p className="text-xs text-slate-500">
                Check off syllabus items as you cover them with mentors during live calls
              </p>
            </div>
          </div>

          {loadingRoadmaps ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {roadmaps.map((rm) => {
                const IconComponent = ICON_MAP[rm.icon] || Code2;
                const isExpanded = expandedRoadmap === rm.id;
                const completedCount = rm.completedTopics?.length || 0;

                return (
                  <div
                    key={rm.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs transition-all space-y-4"
                  >
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      onClick={() => setExpandedRoadmap(isExpanded ? null : rm.id)}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">{rm.title}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              {rm.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{rm.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:self-center">
                        <div className="text-right min-w-[80px]">
                          <span className="text-sm font-extrabold text-indigo-600">
                            {rm.progress}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {completedCount} / {rm.totalTopics} Topics
                          </span>
                        </div>
                        <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${rm.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Topics Checklist when expanded */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-100 space-y-2.5">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Topics Checklist:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rm.topics.map((topic, i) => {
                            const isChecked = rm.completedTopics?.includes(topic);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleToggleTopic(rm.id, topic)}
                                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all ${
                                  isChecked
                                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span>{topic}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Target Skills */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Learning Goals</h2>
              <p className="text-xs text-slate-500">Skills you want to learn from community peers</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Goal</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddLearningSkill}
              className="p-5 bg-white rounded-3xl border border-indigo-200 shadow-sm space-y-4"
            >
              <h3 className="font-bold text-sm text-slate-900">Add New Learning Goal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Skill:</label>
                  <select
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {availableSkills.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Proficiency:</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Beginner">Beginner (Foundations)</option>
                    <option value="Intermediate">Intermediate (Practical)</option>
                    <option value="Advanced">Advanced (Production)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSkill}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  {addingSkill ? 'Saving...' : 'Add Goal'}
                </button>
              </div>
            </form>
          )}

          {learningSkills.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No learning goals set yet"
              description="Add the skills you want to learn so our AI matching engine pairs you with mentors!"
              actionText="Add a Skill Goal"
              onAction={() => setShowAddForm(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {learningSkills.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <SkillBadge
                      name={item.skill?.name || 'Skill'}
                      category={item.skill?.category}
                      level={item.level}
                    />
                    <span className="text-xs font-bold text-indigo-600">{item.progress || 0}% Mastery</span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>{item.sessionsCompleted || 0} Sessions completed</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.progress || 0}
                      onChange={(e) =>
                        handleUpdateProgress(item.skill?._id || item.skill, Number(e.target.value))
                      }
                      className="w-24 accent-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Badges & Streaks */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Gamification Streaks & Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badgesData?.badges?.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-3xl border transition-all ${
                  badge.isEarned
                    ? 'bg-white border-amber-300 shadow-sm ring-1 ring-amber-400/30'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{badge.name}</span>
                      {badge.isEarned && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{badge.description}</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  {badge.isEarned ? (
                    <span className="text-emerald-700 font-bold">
                      Earned {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Recently'}
                    </span>
                  ) : (
                    <span>Locked • Complete criteria to unlock</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Time-Banking Ledger */}
      {activeTab === 'wallet' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block">Available Balance</span>
              <span className="text-3xl font-black text-indigo-600">
                {walletData?.timeCredits ?? 5} <span className="text-sm font-bold text-slate-500">Credits</span>
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
              <span className="font-bold block">In Escrow (Locked):</span>
              <span>{walletData?.escrowCredits ?? 0} Credits awaiting session confirmation</span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 pt-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Transaction Ledger:</span>
          </h3>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            {walletData?.transactions?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {walletData.transactions.map((tx) => (
                  <div key={tx._id} className="p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          tx.type.includes('earned')
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}
                      >
                        {tx.type.includes('earned') ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.description}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black ${
                          tx.type.includes('earned') ? 'text-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        {tx.type.includes('earned') ? `+${tx.amount}` : `-${tx.amount}`} Credits
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Bal: {tx.balanceAfter}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No credit transactions logged yet. Complete a session to start earning!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnPage;
