import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase, ArrowRight, UserCheck } from 'lucide-react';
import SkillBadge from './SkillBadge';
import MatchScore from './MatchScore';

const ProfileCard = ({
  user,
  matchScore,
  onConnect,
  isConnected = false,
  hasPendingRequest = false,
}) => {
  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Header: Avatar, Info, Match Score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={user.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-50"
            />
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                {user.name}
              </h3>
              <p className="text-xs text-slate-400">@{user.username}</p>
              {user.occupation && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[150px]">{user.occupation}</span>
                </div>
              )}
            </div>
          </div>

          {matchScore !== undefined && matchScore !== null && (
            <MatchScore score={matchScore} size="sm" />
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Rating & Sessions Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 font-medium text-amber-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{(user.rating || 5.0).toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({user.reviewCount || 0})</span>
          </div>
          <span>•</span>
          <div>
            <span className="font-medium text-slate-700">{user.completedSessions || 0}</span> sessions
          </div>
          {user.location && (
            <>
              <span>•</span>
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[100px]">{user.location}</span>
              </div>
            </>
          )}
        </div>

        {/* Skills Section */}
        <div className="space-y-2.5 mb-5">
          {/* Teaches */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Teaches
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.skillsToTeach && user.skillsToTeach.length > 0 ? (
                user.skillsToTeach.slice(0, 3).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None listed</span>
              )}
              {user.skillsToTeach && user.skillsToTeach.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{user.skillsToTeach.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Wants to Learn */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Wants To Learn
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                user.skillsToLearn.slice(0, 3).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None listed</span>
              )}
              {user.skillsToLearn && user.skillsToLearn.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{user.skillsToLearn.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Link
          to={`/profile/${user._id}`}
          className="flex-1 text-center py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          View Profile
        </Link>

        {isConnected ? (
          <Link
            to="/messages"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Connected
          </Link>
        ) : hasPendingRequest ? (
          <span className="flex-1 text-center py-2 px-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            Pending
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onConnect && onConnect(user)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <span>Connect</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
