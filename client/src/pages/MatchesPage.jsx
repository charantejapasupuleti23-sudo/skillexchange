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
  BookOpen,
  GraduationCap,
  Layers,
  Award,
} from 'lucide-react';

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'exact', 'partial'

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await api.get('/matches?minScore=10');
        if (res.data.success) {
          setMatches(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load matches', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleConnect = (peerUser) => {
    setSelectedUser(peerUser);
    setIsModalOpen(true);
  };

  const filteredMatches = matches.filter((m) => {
    if (filterTab === 'exact') return m.isExactBidirectional;
    if (filterTab === 'partial') return !m.isExactBidirectional;
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
            <span>Smart Barter Algorithm</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Your Match Compatibility
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmically ranked by direct 1:1 barter overlap, proficiency fit, and schedule availability
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
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
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all ${
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
            onClick={() => setFilterTab('partial')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filterTab === 'partial'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            One-Way / Partial ({partialMatchesCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-xs text-slate-400 font-medium">
            Computing mutual barter synergy and proficiency compatibility...
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={
            filterTab === 'exact'
              ? 'No exact bidirectional matches yet'
              : 'No matches found'
          }
          description="Add more skills you can teach and skills you want to learn to increase your direct 1:1 barter compatibility score!"
          actionText="Update Profile Skills"
          actionLink="/profile/edit"
        />
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((matchItem) => {
            const peer = matchItem.user;
            const isExact = matchItem.isExactBidirectional;

            return (
              <div
                key={peer._id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4 ${
                  isExact ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200/80'
                }`}
              >
                {/* Header Row: User Info + Match Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={peer.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={peer.name}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-50"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/profile/${peer._id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-base transition-colors"
                        >
                          {peer.name}
                        </Link>
                        <span className="text-xs text-slate-400">@{peer.username}</span>

                        {isExact ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold tracking-wide">
                            <ArrowRightLeft className="w-3 h-3" />
                            EXACT 1:1 BARTER
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                            {matchItem.matchType || 'One-Way Match'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{peer.occupation || 'Peer Member'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{(peer.rating || 5.0).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({peer.reviewCount || 0})</span>
                    </div>

                    <MatchScore score={matchItem.matchScore} />
                  </div>
                </div>

                {/* Algorithmic Transparent Reasons */}
                {matchItem.reasons && matchItem.reasons.length > 0 && (
                  <div className="bg-indigo-50/50 rounded-2xl p-3.5 border border-indigo-100/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Why you matched:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                      {matchItem.reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  {/* Skills They Teach You */}
                  <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100/80">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Skills They Can Teach You:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchItem.skillsTheyTeachYou?.length > 0 ? (
                        matchItem.skillsTheyTeachYou.map((s, idx) => (
                          <SkillBadge
                            key={idx}
                            skill={s.name}
                            level={s.teacherLevel}
                            variant="teach"
                            size="sm"
                          />
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No direct learn match</span>
                      )}
                    </div>
                  </div>

                  {/* Skills You Can Teach Them */}
                  <div className="bg-violet-50/40 p-3.5 rounded-2xl border border-violet-100/80">
                    <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <Award className="w-3.5 h-3.5" />
                      Skills You Can Teach Them:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchItem.skillsYouTeachThem?.length > 0 ? (
                        matchItem.skillsYouTeachThem.map((s, idx) => (
                          <SkillBadge
                            key={idx}
                            skill={s.name}
                            level={s.teacherLevel}
                            variant="learn"
                            size="sm"
                          />
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No direct teach match</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {peer.availability?.length > 0
                        ? `Available: ${peer.availability.map((a) => a.day).slice(0, 3).join(', ')}`
                        : 'Availability flexible'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      to={`/profile/${peer._id}`}
                      className="flex-1 sm:flex-initial text-center px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleConnect(peer)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Propose Trade</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proposal Request Modal */}
      <SendRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUser={selectedUser}
      />
    </div>
  );
};

export default MatchesPage;
