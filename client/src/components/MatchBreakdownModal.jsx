import React from 'react';
import Modal from './Modal';
import {
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  Zap,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

const MatchBreakdownModal = ({ isOpen, onClose, peer, onConnect, onBook }) => {
  if (!peer) return null;

  const matchScore = peer.matchScore ?? peer.score ?? 75;
  const matchType = peer.matchType || (matchScore >= 80 ? 'Bidirectional' : 'Complementary');
  const reasons = peer.reasons || [];
  const breakdown = peer.breakdown || {
    percentages: { skills: 45, proficiency: 25, schedule: 20, reputation: 10 },
  };

  const skillsTheyTeach = peer.skillsTheyTeachYou || peer.skillsToTeach || [];
  const skillsYouTeach = peer.skillsYouTeachThem || peer.skillsToLearn || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Match Compatibility Breakdown">
      <div className="space-y-5 text-slate-800">
        {/* Match Header Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <img
              src={
                peer.profileImage?.url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
              }
              alt={peer.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{peer.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
                  {matchType}
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {peer.occupation || 'SkillLoop Member'} • ⭐ {peer.rating || 5.0} ({peer.reviewCount || 0} reviews)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-2xl font-black">{matchScore}%</span>
            </div>
            <p className="text-[10px] text-indigo-200 mt-1 uppercase font-bold tracking-wider">
              Compatibility
            </p>
          </div>
        </div>

        {/* Score Dimension Bars */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Compatibility Dimensions</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Complementary Skills</span>
                <span className="font-bold text-indigo-600">{breakdown.percentages?.skills ?? 45}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${Math.min(100, (breakdown.percentages?.skills ?? 45) * 2)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Proficiency Alignment</span>
                <span className="font-bold text-emerald-600">{breakdown.percentages?.proficiency ?? 25}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (breakdown.percentages?.proficiency ?? 25) * 3)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Schedule & Availability</span>
                <span className="font-bold text-amber-600">{breakdown.percentages?.schedule ?? 20}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${Math.min(100, (breakdown.percentages?.schedule ?? 20) * 3)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Trust & Peer Rating</span>
                <span className="font-bold text-purple-600">{breakdown.percentages?.reputation ?? 10}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${Math.min(100, (breakdown.percentages?.reputation ?? 10) * 5)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Two-Way Exchange Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* They Teach You */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{peer.name} Teaches You:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillsTheyTeach.length > 0 ? (
                skillsTheyTeach.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white rounded-lg text-xs font-semibold text-indigo-700 border border-indigo-200 shadow-2xs"
                  >
                    {s.name || s.skill?.name || s.skill || 'Skill'}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Open to diverse topics</span>
              )}
            </div>
          </div>

          {/* You Teach Them */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>You Teach {peer.name}:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillsYouTeach.length > 0 ? (
                skillsYouTeach.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-white rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-2xs"
                  >
                    {s.name || s.skill?.name || s.skill || 'Skill'}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Can earn credits with Time-Banking</span>
              )}
            </div>
          </div>
        </div>

        {/* AI Key Insights / Reasons */}
        {reasons.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Match Highlights:</span>
            </h4>
            <div className="space-y-1">
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
          >
            Close
          </button>
          {onBook && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBook(peer);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Direct Slot</span>
            </button>
          )}
          {onConnect && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onConnect(peer);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Send Barter Proposal</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MatchBreakdownModal;
