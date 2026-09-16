import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MatchScore from '../components/MatchScore';
import SkillBadge from '../components/SkillBadge';
import EmptyState from '../components/EmptyState';
import SendRequestModal from '../components/SendRequestModal';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Star,
  ArrowRight,
  Loader2,
  ArrowRightLeft,
  GraduationCap,
  Award,
  Repeat,
  SlidersHorizontal,
  Search,
  X,
  AlertCircle,
  Users,
  Compass,
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES = ['All', 'Programming', 'Design', 'Data & AI', 'Creative', 'Business', 'Marketing'];

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [threeWayLoops, setThreeWayLoops] = useState([]);
  const [stats, setStats] = useState({ exactMatchesCount: 0, partialMatchesCount: 0, threeWayLoopsCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'exact', 'loops', 'partial'
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minMatchScore, setMinMatchScore] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check profile completeness
  const teachesCount = user?.skillsToTeach?.length || 0;
  const learnsCount = user?.skillsToLearn?.length || 0;
  const needsMoreSkills = teachesCount < 2 || learnsCount < 2;

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('minScore', minMatchScore);
      if (selectedDay !== 'all') params.append('day', selectedDay);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);

      const res = await api.get(`/matches?${params.toString()}`);
      if (res.data.success) {
        setMatches(res.data.data || []);
        setThreeWayLoops(res.data.threeWayLoops || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedDay, selectedCategory, minMatchScore]);

  const handleConnect = (peerUser) => {
    setSelectedUser(peerUser);
    setIsModalOpen(true);
  };

  // Filter matches based on search and active tab
  const filteredMatches = matches.filter((m) => {
    if (filterTab === 'exact' && !m.isExactBidirectional) return false;
    if (filterTab === 'partial' && m.isExactBidirectional) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = m.user.name.toLowerCase().includes(q);
      const skillMatch = m.matchedSkills?.some((s) => s.toLowerCase().includes(q));
      const bioMatch = m.user.bio?.toLowerCase().includes(q);
      if (!nameMatch && !skillMatch && !bioMatch) return false;
    }
    return true;
  });

  const exactMatchesCount = matches.filter((m) => m.isExactBidirectional).length;
  const partialMatchesCount = matches.filter((m) => !m.isExactBidirectional).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Semantic Barter & Multi-Way Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Your Match Compatibility
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by taxonomy overlap, mentor proficiency, schedule compatibility, and circular 3-way loops
          </p>
        </div>

        {/* Primary Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold self-start sm:self-auto flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({matches.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('exact')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'exact'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>1:1 Barter ({exactMatchesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('loops')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'loops'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span>3-Way Loops ({threeWayLoops.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('partial')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterTab === 'partial'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            One-Way ({partialMatchesCount})
          </button>
        </div>
      </div>

      {/* Skill Completeness Banner */}
      {exactMatchesCount === 0 || needsMoreSkills ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Unlock More Direct 1:1 Barters
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {exactMatchesCount === 0
                  ? 'Add 3 more skills you want to learn or teach to unlock direct 1:1 barter matches with peer mentors.'
                  : `You have ${teachesCount} offered and ${learnsCount} learning skills. Adding more skills expands your barter synergy.`}
              </p>
            </div>
          </div>
          <Link
            to="/profile/edit"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Update Profile Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : null}

      {/* Quick Filter Refinements Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter matches by skill name, user, or bio..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Day:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="all">Any Day</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 cursor-pointer focus:outline-hidden"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Min Score Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Min Score:</span>
            <select
              value={minMatchScore}
              onChange={(e) => setMinMatchScore(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value={25}>25%+ (Default)</option>
              <option value={50}>50%+ (High)</option>
              <option value={75}>75%+ (Direct Barter)</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-xs text-slate-400 font-medium">
            Computing semantic skill similarity, proficiency alignment, and 3-way barter loops...
          </p>
        </div>
      ) : filterTab === 'loops' ? (
        /* 3-WAY MULTI-WAY BARTER LOOPS VIEW */
        <div className="space-y-4">
          <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-200 flex items-start gap-3">
            <Repeat className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-purple-950">
                Multi-Way (3-Way) Circular Barter Loops
              </h3>
              <p className="text-[11px] text-purple-800 mt-0.5">
                When direct 1:1 barter is not available, these 3-way loops complete a circular trade: <strong>You teach User B</strong> &rarr; <strong>User B teaches User C</strong> &rarr; <strong>User C teaches You</strong>.
              </p>
            </div>
          </div>

          {threeWayLoops.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No 3-way barter loops found"
              description="Add more skills to your profile to generate multi-way triangular trade opportunities."
              actionText="Update Profile Skills"
              actionLink="/profile/edit"
            />
          ) : (
            <div className="space-y-4">
              {threeWayLoops.map((loop) => (
                <div
                  key={loop.id}
                  className="bg-white rounded-2xl border border-purple-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                      <Repeat className="w-3.5 h-3.5" />
                      <span>3-WAY CIRCULAR LOOP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Loop Synergy:</span>
                      <MatchScore score={loop.score} size="sm" />
                    </div>
                  </div>

                  {/* 3 Step Visual Sequence */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Step 1: You -> User B */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Step 1 (You Teach)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600">You</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <Link to={`/profile/${loop.step1.to._id}`} className="font-semibold text-slate-900 hover:underline">
                          {loop.step1.to.name}
                        </Link>
                      </div>
                      <div className="pt-1">
                        <SkillBadge skill={loop.step1.skill} level={loop.step1.teacherLevel} variant="teach" size="sm" />
                      </div>
                    </div>

                    {/* Step 2: User B -> User C */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Step 2 (Peer Trade)
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${loop.step2.from._id}`} className="font-semibold text-slate-900 hover:underline truncate">
                          {loop.step2.from.name}
                        </Link>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <Link to={`/profile/${loop.step2.to._id}`} className="font-semibold text-slate-900 hover:underline truncate">
                          {loop.step2.to.name}
                        </Link>
                      </div>
                      <div className="pt-1">
                        <SkillBadge skill={loop.step2.skill} level={loop.step2.teacherLevel} variant="teach" size="sm" />
                      </div>
                    </div>

                    {/* Step 3: User C -> You */}
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2">
                      <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                        Step 3 (You Learn)
                      </div>
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${loop.step3.from._id}`} className="font-semibold text-slate-900 hover:underline truncate">
                          {loop.step3.from.name}
                        </Link>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="font-bold text-purple-700">You</span>
                      </div>
                      <div className="pt-1">
                        <SkillBadge skill={loop.step3.skill} level={loop.step3.teacherLevel} variant="learn" size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Actions for Loop */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleConnect(loop.userB)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Connect with {loop.step1.to.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnect(loop.userC)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Request from {loop.step3.from.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={
            filterTab === 'exact'
              ? 'No exact 1:1 bidirectional matches yet'
              : 'No matches found with current filters'
          }
          description="Try clearing your filters or adding more skills you want to teach and learn!"
          actionText="Update Profile Skills"
          actionLink="/profile/edit"
        />
      ) : (
        /* COMPACT ASYMMETRIC ROW MATCH CARDS */
        <div className="space-y-3.5">
          {filteredMatches.map((matchItem) => {
            const peer = matchItem.user;
            const isExact = matchItem.isExactBidirectional;
            const breakdown = matchItem.breakdown;
            const percentages = breakdown?.percentages || {};

            return (
              <div
                key={peer._id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3.5 ${
                  isExact ? 'border-emerald-300 ring-2 ring-emerald-50/50' : 'border-slate-200/80'
                }`}
              >
                {/* Asymmetric Row Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Column: User Profile Info (3 cols) */}
                  <div className="lg:col-span-4 flex items-start gap-3">
                    <img
                      src={peer.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={peer.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          to={`/profile/${peer._id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-sm transition-colors truncate"
                        >
                          {peer.name}
                        </Link>
                        {isExact ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                            <ArrowRightLeft className="w-2.5 h-2.5" />
                            1:1 BARTER
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-semibold">
                            {matchItem.matchType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">@{peer.username}</p>
                      {peer.occupation && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{peer.occupation}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <div className="flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{(peer.rating || 5.0).toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">{peer.completedSessions || 0} sessions</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Skills Compatibility & Breakdown (5 cols) */}
                  <div className="lg:col-span-5 space-y-2 text-xs">
                    {/* Skills They Teach You */}
                    {matchItem.skillsTheyTeachYou?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          They Teach You:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {matchItem.skillsTheyTeachYou.map((s, idx) => (
                            <SkillBadge
                              key={idx}
                              skill={s.name}
                              level={s.teacherLevel}
                              variant="teach"
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills You Teach Them */}
                    {matchItem.skillsYouTeachThem?.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block mb-1">
                          You Teach Them:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {matchItem.skillsYouTeachThem.map((s, idx) => (
                            <SkillBadge
                              key={idx}
                              skill={s.name}
                              level={s.teacherLevel}
                              variant="learn"
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Direct Barter Visual Cue if only one-way */}
                    {matchItem.skillsTheyTeachYou?.length === 0 && (
                      <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                        Explore non-direct barter: you offer skills they want!
                      </div>
                    )}

                    {/* Actionable Reasons */}
                    {matchItem.reasons && matchItem.reasons.length > 0 && (
                      <div className="text-[11px] text-slate-600 space-y-0.5 pt-0.5">
                        <div className="flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{matchItem.reasons[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Match Score, Breakdown Progress & Action (3 cols) */}
                  <div className="lg:col-span-3 flex flex-col items-end justify-between h-full space-y-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-2 lg:pt-0 lg:pl-4">
                    <div className="w-full flex items-center justify-between lg:flex-col lg:items-end gap-1">
                      <MatchScore score={matchItem.matchScore} breakdown={breakdown} showBreakdown={true} />
                    </div>

                    <div className="flex items-center gap-2 w-full pt-1">
                      <Link
                        to={`/profile/${peer._id}`}
                        className="flex-1 text-center py-1.5 px-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleConnect(peer)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Trade</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trade Proposal Request Modal */}
      <SendRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUser={selectedUser}
      />
    </div>
  );
};

export default MatchesPage;
