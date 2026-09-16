import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge';
import MatchScore from '../components/MatchScore';
import SendRequestModal from '../components/SendRequestModal';
import BookSessionModal from '../components/BookSessionModal';
import {
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Globe,
  Link2,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  Edit,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Flame,
  Coins,
  MessageSquare,
} from 'lucide-react';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const targetId = id || currentUser?._id;
  const isOwnProfile = currentUser && (currentUser._id === targetId || currentUser.id === targetId);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetId) return;
      try {
        setLoading(true);
        const res = await api.get(`/users/${targetId}`);
        if (res.data.success) {
          setProfileUser(res.data.data);
        }

        // If not own profile and user is logged in, fetch match score
        if (currentUser && !isOwnProfile) {
          try {
            const mRes = await api.get(`/matches/${targetId}`);
            if (mRes.data.success) {
              setMatchData(mRes.data.data);
            }
          } catch (mErr) {
            // ignore
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetId, currentUser?._id]);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-2 text-xs text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>User profile not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={profileUser.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={profileUser.name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-50 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {profileUser.name}
                </h1>
                <span className="text-xs text-slate-400">@{profileUser.username}</span>
              </div>

              {profileUser.occupation && (
                <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profileUser.occupation}</span>
                </p>
              )}

              {profileUser.location && (
                <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profileUser.location}</span>
                </p>
              )}

              {/* Rating and Social Icons */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                <div className="flex items-center gap-1 font-bold text-amber-600 text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{(profileUser.rating || 5.0).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">
                    ({profileUser.reviewCount || 0} reviews)
                  </span>
                </div>

                {/* Social Links */}
                {profileUser.socialLinks && (
                  <div className="flex items-center gap-2 text-slate-400">
                    {profileUser.socialLinks.github && (
                      <a href={profileUser.socialLinks.github} target="_blank" rel="noopener noreferrer" className="hover:text-slate-700" title="GitHub">
                        <Link2 className="w-4 h-4" />
                      </a>
                    )}
                    {profileUser.socialLinks.linkedin && (
                      <a href={profileUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600" title="LinkedIn">
                        <Link2 className="w-4 h-4" />
                      </a>
                    )}
                    {profileUser.socialLinks.website && (
                      <a href={profileUser.socialLinks.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600" title="Portfolio">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons / Match Score */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            {isOwnProfile ? (
              <Link
                to="/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center sm:items-end gap-2">
                {matchData && <MatchScore score={matchData.matchScore} />}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/messages?userId=${profileUser._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-xs transition-all hover:scale-102"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-200 transition-all hover:scale-102"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Session (1 Credit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all hover:scale-102"
                  >
                    <span>Propose Barter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
            {profileUser.bio}
          </p>
        )}

        {/* 4 Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sessions Completed</span>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{profileUser.completedSessions || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Learners Helped</span>
            <p className="text-lg font-extrabold text-indigo-600 mt-0.5">{profileUser.learnersHelped || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Skills Taught</span>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{profileUser.skillsToTeach?.length || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Skills Learning</span>
            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{profileUser.skillsToLearn?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Skills Grid: Teaches vs Wants to Learn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skills I Teach */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Skills {isOwnProfile ? 'I Teach' : `${profileUser.name} Teaches`}</span>
          </h2>

          <div className="space-y-3">
            {profileUser.skillsToTeach && profileUser.skillsToTeach.length > 0 ? (
              profileUser.skillsToTeach.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {item.skill?.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.endorsementsCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{item.endorsementsCount} Verified Endorsement{item.endorsementsCount > 1 ? 's' : ''}</span>
                        </span>
                      )}
                      <SkillBadge skill={item.skill?.name} level={item.level} size="sm" />
                    </div>
                  </div>
                  {item.yearsOfExperience && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      {item.yearsOfExperience} years of experience
                    </p>
                  )}
                  {item.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No teaching skills listed yet.</p>
            )}
          </div>
        </div>

        {/* Skills I Want to Learn */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Skills {isOwnProfile ? 'I Want to Learn' : `${profileUser.name} Wants to Learn`}</span>
          </h2>

          <div className="space-y-3">
            {profileUser.skillsToLearn && profileUser.skillsToLearn.length > 0 ? (
              profileUser.skillsToLearn.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {item.skill?.name}
                    </span>
                    <SkillBadge skill={item.skill?.name} level={item.level} size="sm" />
                  </div>
                  {item.desiredOutcome && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      Goal: {item.desiredOutcome}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No learning goals listed yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Availability & Education / Experience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Availability */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Weekly Availability</span>
          </h2>

          <div className="space-y-2">
            {profileUser.availability && profileUser.availability.length > 0 ? (
              profileUser.availability.map((av, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                  <span className="font-semibold text-slate-800">{av.day}</span>
                  <span className="text-slate-600 font-medium">
                    {av.slots?.map((s) => `${s.startTime} - ${s.endTime}`).join(', ') || 'Flexible'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">Availability schedule flexible or not configured.</p>
            )}
          </div>
        </div>

        {/* Education & Experience */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Background</span>
          </h2>

          <div className="space-y-3 text-xs">
            {profileUser.education && (
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Education</span>
                <p className="font-semibold text-slate-800 mt-0.5">{profileUser.education}</p>
              </div>
            )}
            {profileUser.experience && (
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] block">Experience</span>
                <p className="text-slate-600 leading-relaxed mt-0.5">{profileUser.experience}</p>
              </div>
            )}
            {!profileUser.education && !profileUser.experience && (
              <p className="text-xs text-slate-400 italic">No background details provided.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Peer Reviews ({profileUser.reviews?.length || 0})</span>
          </h2>
        </div>

        {profileUser.reviews && profileUser.reviews.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {profileUser.reviews.map((rev) => (
              <div key={rev._id} className="py-4 space-y-2 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.reviewer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={rev.reviewer?.name}
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 text-xs">{rev.reviewer?.name}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          rev.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No reviews received yet.</p>
        )}
      </div>

      {/* Connect Modal */}
      <SendRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        targetUser={profileUser}
      />

      {/* Book Session Modal */}
      <BookSessionModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        mentor={profileUser}
      />
    </div>
  );
};

export default ProfilePage;
