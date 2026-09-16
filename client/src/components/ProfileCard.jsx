import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Briefcase, ArrowRight, UserCheck, Globe, Link2, CheckCircle2, Calendar } from 'lucide-react';
import SkillBadge from './SkillBadge';
import MatchScore from './MatchScore';

const ProfileCard = ({
  user,
  matchScore,
  breakdown,
  onConnect,
  isConnected = false,
  hasPendingRequest = false,
  layout = 'compact', // 'compact' or 'standard'
}) => {
  if (!user) return null;

  const teaches = user.skillsToTeach || [];
  const learns = user.skillsToLearn || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Compact Header: Avatar + Meta + Match Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 ring-indigo-50 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to={`/profile/${user._id}`}
                  className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm truncate"
                >
                  {user.name}
                </Link>
                {user.completedSessions > 0 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" title="Active Peer Mentor" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
              {user.occupation && (
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{user.occupation}</span>
                </p>
              )}
            </div>
          </div>

          {matchScore !== undefined && matchScore !== null && (
            <MatchScore score={matchScore} breakdown={breakdown} size="sm" />
          )}
        </div>

        {/* Bio (compact 2 lines max) */}
        {user.bio ? (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {user.bio}
          </p>
        ) : null}

        {/* Rating & Availability bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2.5 mb-3 border-b border-slate-100 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 font-semibold text-amber-600 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{(user.rating || 5.0).toFixed(1)}</span>
              <span className="text-slate-400 font-normal text-[10px]">({user.reviewCount || 0})</span>
            </div>
            <span>•</span>
            <span className="text-[11px] text-slate-500">
              <strong className="text-slate-700">{user.completedSessions || 0}</strong> sessions
            </span>
          </div>

          {user.availability?.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{user.availability.map((a) => a.day.slice(0, 3)).slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Compact Skills Grid */}
        <div className="space-y-2.5 mb-4">
          {/* Teaches */}
          {teaches.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Teaches:
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {teaches.slice(0, 2).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    variant="teach"
                    size="sm"
                  />
                ))}
                {teaches.length > 2 && (
                  <span className="text-[10px] text-slate-400 self-center font-medium ml-0.5">
                    +{teaches.length - 2}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
              <span>Open to barter offers</span>
            </div>
          )}

          {/* Wants to Learn */}
          {learns.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">
                  Learning:
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {learns.slice(0, 2).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    variant="learn"
                    size="sm"
                  />
                ))}
                {learns.length > 2 && (
                  <span className="text-[10px] text-slate-400 self-center font-medium ml-0.5">
                    +{learns.length - 2}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
        <Link
          to={`/profile/${user._id}`}
          className="flex-1 text-center py-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          Profile
        </Link>

        {isConnected ? (
          <Link
            to="/messages"
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Connected
          </Link>
        ) : hasPendingRequest ? (
          <span className="flex-1 text-center py-1.5 px-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            Pending
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onConnect && onConnect(user)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <span>Trade</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
