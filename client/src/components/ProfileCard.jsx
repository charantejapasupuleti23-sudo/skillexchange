import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase, ArrowRight, UserCheck, Globe, Link2, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group h-full">
      <div>
        {/* Header: Avatar, Info, Match Score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-50 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight text-sm truncate">
                  {user.name}
                </h3>
                {user.completedSessions > 0 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" title="Active Peer Mentor" />
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">@{user.username}</p>
              {user.occupation && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                  <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{user.occupation}</span>
                </div>
              )}
            </div>
          </div>

          {matchScore !== undefined && matchScore !== null && (
            <MatchScore score={matchScore} size="sm" />
          )}
        </div>

        {/* Bio */}
        {user.bio ? (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {user.bio}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mb-3">No bio written yet.</p>
        )}

        {/* Rating, Sessions Stats & Verification Links */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-semibold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{(user.rating || 5.0).toFixed(1)}</span>
              <span className="text-slate-400 font-normal text-[11px]">({user.reviewCount || 0})</span>
            </div>
            <span>•</span>
            <div className="text-[11px]">
              <span className="font-semibold text-slate-700">{user.completedSessions || 0}</span> sessions
            </div>
          </div>

          {/* Social Links Verification */}
          {user.socialLinks && (user.socialLinks.github || user.socialLinks.linkedin || user.socialLinks.website) && (
            <div className="flex items-center gap-1 text-slate-400">
              {user.socialLinks.github && (
                <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:text-slate-700" title="Verified GitHub">
                  <Link2 className="w-3.5 h-3.5 text-slate-500" />
                </a>
              )}
              {user.socialLinks.linkedin && (
                <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600" title="Verified LinkedIn">
                  <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                </a>
              )}
              {user.socialLinks.website && (
                <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="hover:text-slate-700" title="Portfolio">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="space-y-3 mb-5">
          {/* Teaches */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Teaches
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.skillsToTeach && user.skillsToTeach.length > 0 ? (
                user.skillsToTeach.slice(0, 3).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    variant="teach"
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                  Open to offers
                </span>
              )}
              {user.skillsToTeach && user.skillsToTeach.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center font-medium">
                  +{user.skillsToTeach.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Wants to Learn */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                Wants To Learn
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.skillsToLearn && user.skillsToLearn.length > 0 ? (
                user.skillsToLearn.slice(0, 3).map((item, idx) => (
                  <SkillBadge
                    key={idx}
                    skill={item.skill}
                    level={item.level}
                    variant="learn"
                    size="sm"
                  />
                ))
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-100">
                  Flexible goals
                </span>
              )}
              {user.skillsToLearn && user.skillsToLearn.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center font-medium">
                  +{user.skillsToLearn.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
        <Link
          to={`/profile/${user._id}`}
          className="flex-1 text-center py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
        >
          View Profile
        </Link>

        {isConnected ? (
          <Link
            to="/messages"
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
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
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <span>Connect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
