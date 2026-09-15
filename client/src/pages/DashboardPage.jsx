import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import MatchScore from '../components/MatchScore';
import SkillBadge from '../components/SkillBadge';
import SendRequestModal from '../components/SendRequestModal';
import {
  Sparkles,
  Calendar,
  Star,
  Users,
  Award,
  ArrowRight,
  TrendingUp,
  Video,
  Clock,
  ExternalLink,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [matchesRes, sessionsRes] = await Promise.all([
          api.get('/matches?limit=4&minScore=10'),
          api.get('/sessions?limit=3'),
        ]);

        if (matchesRes.data.success) setMatches(matchesRes.data.data);
        if (sessionsRes.data.success) setSessions(sessionsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'Confirmed' || s.status === 'Pending'
  );

  // Skill progress chart data
  const chartData = (user?.skillsToLearn || []).map((item) => ({
    name: item.skill?.name || 'Skill',
    progress: item.progress || 0,
    sessions: item.sessionsCompleted || 0,
  }));

  const handleConnect = (peerUser) => {
    setSelectedUser(peerUser);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Welcome Back
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.name}! 👋
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
            You're currently offering to teach <span className="font-semibold text-white">{user?.skillsToTeach?.length || 0} skills</span> and actively expanding your knowledge in <span className="font-semibold text-white">{user?.skillsToLearn?.length || 0} skills</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              to="/matches"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-xs transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Recommendations</span>
            </Link>
            <Link
              to="/profile/edit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20"
            >
              <span>Edit My Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Skills I Teach
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {user?.skillsToTeach?.length || 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Active mentor</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Skills I Want
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {user?.skillsToLearn?.length || 0}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">Target goals</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Matches
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {matches.length}
          </p>
          <span className="text-[11px] text-sky-600 font-medium">Available now</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Completed Sessions
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {user?.completedSessions || 0}
          </p>
          <span className="text-[11px] text-purple-600 font-medium">{user?.learnersHelped || 0} helped</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Peer Rating
          </span>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <p className="text-2xl font-extrabold text-slate-900">
              {(user?.rating || 5.0).toFixed(1)}
            </p>
          </div>
          <span className="text-[11px] text-slate-400">({user?.reviewCount || 0} reviews)</span>
        </div>
      </div>

      {/* Main Grid: Left column (Matches & Sessions) - Right column (Charts & Progress) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Matches & Upcoming Sessions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Matches Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recommended Peer Matches
                </h2>
              </div>
              <Link
                to="/matches"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all ({matches.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : matches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-xs text-slate-500">
                <p>No matches found yet.</p>
                <Link to="/profile/edit" className="text-indigo-600 font-semibold underline mt-1 block">
                  Add more skills to improve recommendations
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.slice(0, 3).map((m) => {
                  const peer = m.user;
                  return (
                    <div
                      key={peer._id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={peer.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                          alt={peer.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-50"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/profile/${peer._id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-sm transition-colors"
                            >
                              {peer.name}
                            </Link>
                            <span className="text-xs text-slate-400">@{peer.username}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>
                              Teaches:{' '}
                              <strong className="text-slate-700">
                                {peer.skillsToTeach?.map((s) => s.skill?.name).slice(0, 2).join(', ') || 'Various'}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Wants:{' '}
                              <strong className="text-slate-700">
                                {peer.skillsToLearn?.map((s) => s.skill?.name).slice(0, 2).join(', ') || 'Various'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <MatchScore score={m.matchScore} size="sm" />
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/profile/${peer._id}`}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleConnect(peer)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Upcoming Sessions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Upcoming Learning Sessions
                </h2>
              </div>
              <Link
                to="/sessions"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all ({sessions.length}) →
              </Link>
            </div>

            {upcomingSessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-xs text-slate-500 space-y-2">
                <p>You don’t have any upcoming sessions scheduled.</p>
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <span>Find Someone to Learn From</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const isTeacher = session.teacher?._id === user?._id;
                  const peer = isTeacher ? session.learner : session.teacher;

                  return (
                    <div
                      key={session._id}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={peer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                          alt={peer?.name}
                          className="w-11 h-11 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {peer?.name}{' '}
                            <span className="text-slate-400 font-normal">
                              ({isTeacher ? 'Learner' : 'Teacher'})
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-indigo-600 text-xs">
                              {session.skill?.name}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500">
                              {new Date(session.date).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at {session.startTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.meetingLink && session.status === 'Confirmed' && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                          >
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Join</span>
                          </a>
                        )}
                        <Link
                          to="/sessions"
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right 1 Col: Learning Progress Chart & Breakdown */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Learning Progress</span>
              </h3>
              <Link to="/learn" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Manage →
              </Link>
            </div>

            {chartData.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Progress']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.progress >= 80 ? '#22c55e' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active learning goals yet
              </div>
            )}

            {/* List of goals with mini progress bars */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {user?.skillsToLearn?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.skill?.name || 'Skill'}</span>
                    <span className="font-bold text-indigo-600 text-[11px]">{item.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${item.progress || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <SendRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        targetUser={selectedUser}
      />
    </div>
  );
};

export default DashboardPage;
