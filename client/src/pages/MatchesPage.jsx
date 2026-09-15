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
  Info,
  ChevronRight,
} from 'lucide-react';

const MatchesPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Peer Matching</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Your Recommended Matches
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Peers ranked by mutual skill complementarity, proficiency fit, and scheduling overlap
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-xs text-slate-400 font-medium">
            Analyzing mutual teaching and learning compatibility...
          </p>
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No matches yet"
          description="Add more skills you can teach and skills you want to learn to improve your recommendation score!"
          actionText="Update My Skills"
          actionLink="/profile/edit"
        />
      ) : (
        <div className="space-y-4">
          {matches.map((matchItem) => {
            const peer = matchItem.user;
            return (
              <div
                key={peer._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
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
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${peer._id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-base transition-colors"
                        >
                          {peer.name}
                        </Link>
                        <span className="text-xs text-slate-400">@{peer.username}</span>
                      </div>
                      <p className="text-xs text-slate-500">{peer.occupation || 'Peer Member'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{(peer.rating || 5.0).toFixed(1)}</span>
                    </div>

                    <MatchScore score={matchItem.matchScore} />
                  </div>
                </div>

                {/* Algorithmic Transparent Reasons */}
                {matchItem.reasons && matchItem.reasons.length > 0 && (
                  <div className="bg-indigo-50/50 rounded-xl p-3.5 border border-indigo-100/80 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block mb-1">
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
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Skills They Can Teach You:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchItem.skillsTheyTeachYou?.length > 0 ? (
                        matchItem.skillsTheyTeachYou.map((s, idx) => (
                          <SkillBadge
                            key={idx}
                            skill={s.name}
                            level={s.teacherLevel}
                            size="sm"
                          />
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No direct match</span>
                      )}
                    </div>
                  </div>

                  {/* Skills You Can Teach Them */}
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Skills You Can Teach Them:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {matchItem.skillsYouTeachThem?.length > 0 ? (
                        matchItem.skillsYouTeachThem.map((s, idx) => (
                          <SkillBadge
                            key={idx}
                            skill={s.name}
                            level={s.teacherLevel}
                            size="sm"
                          />
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No direct match</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {peer.availability?.length > 0
                        ? `Available on ${peer.availability.map((a) => a.day).slice(0, 2).join(', ')}`
                        : 'Availability flexible'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/profile/${peer._id}`}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleConnect(peer)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Propose Exchange</span>
                      <ArrowRight className="w-3 h-3" />
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
