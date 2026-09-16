import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReviewModal from '../components/ReviewModal';
import Modal from '../components/Modal';
import SkillBadge from '../components/SkillBadge';
import EmptyState from '../components/EmptyState';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  Star,
  Check,
  X,
  ExternalLink,
  Loader2,
  Coins,
  ArrowRightLeft,
  CalendarCheck,
  RefreshCw,
} from 'lucide-react';

const SessionsPage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Review Modal state
  const [reviewingSession, setReviewingSession] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Reschedule Modal state
  const [reschedulingSession, setReschedulingSession] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('18:00');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('19:00');
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sessions');
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAcceptSession = async (sessionId) => {
    try {
      setActionLoadingId(sessionId);
      const res = await api.put(`/sessions/${sessionId}/accept`);
      if (res.data.success) {
        addToast('Session confirmed!', 'success');
        fetchSessions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to accept session', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSession = async (sessionId) => {
    try {
      setActionLoadingId(sessionId);
      const res = await api.put(`/sessions/${sessionId}/reject`);
      if (res.data.success) {
        addToast('Session proposal declined.', 'info');
        fetchSessions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to decline session', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSession = async (sessionId) => {
    try {
      setActionLoadingId(sessionId);
      const res = await api.put(`/sessions/${sessionId}/cancel`);
      if (res.data.success) {
        addToast('Session cancelled.', 'info');
        fetchSessions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel session', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setActionLoadingId(sessionId);
      const res = await api.put(`/sessions/${sessionId}/complete`);
      if (res.data.success) {
        addToast('Session marked as completed! Time credit & stats updated.', 'success');
        await refreshUser();
        fetchSessions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to complete session', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReschedule = (session) => {
    setReschedulingSession(session);
    setRescheduleDate(new Date(session.date).toISOString().split('T')[0]);
    setRescheduleStartTime(session.startTime || '18:00');
    setRescheduleEndTime(session.endTime || '19:00');
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!reschedulingSession) return;

    try {
      setActionLoadingId(reschedulingSession._id);
      const res = await api.put(`/sessions/${reschedulingSession._id}/reschedule`, {
        date: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime,
      });

      if (res.data.success) {
        addToast('Session rescheduled successfully!', 'success');
        setIsRescheduleModalOpen(false);
        fetchSessions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reschedule session', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'All') return true;
    if (filterStatus === 'Upcoming') return s.status === 'Confirmed' || s.status === 'Pending' || s.status === 'Rescheduled';
    return s.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Time-Banking Balance Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-300" />
            <h2 className="font-bold text-sm tracking-wide text-indigo-100 uppercase">
              Time-Banking Token Ledger
            </h2>
          </div>
          <p className="text-2xl font-extrabold text-white">
            {user?.timeCredits ?? 5} <span className="text-sm font-semibold text-indigo-200">Time Credits</span>
          </p>
          <p className="text-xs text-indigo-200">
            Teaching 1 session earns +1 credit. Learning consumes 1 credit. Solves non-reciprocal barter trades!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-white/15">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Taught</span>
            <span className="text-base font-extrabold text-white">{user?.completedSessions || 0} hrs</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-white/15">
            <span className="text-[10px] uppercase font-bold text-indigo-200 block">Learners Helped</span>
            <span className="text-base font-extrabold text-amber-300">{user?.learnersHelped || 0}</span>
          </div>
        </div>
      </div>

      {/* Page Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Learning Sessions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage upcoming video practice sessions, track completed hours, and submit peer reviews
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          {['All', 'Upcoming', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-xs text-slate-400 font-medium">Loading your session schedule...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No sessions found"
          description="Schedule sessions directly from your active conversations or discover new peers to learn with."
          actionText="Find Peers to Learn From"
          actionLink="/discover"
        />
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const isTeacher = session.teacher?._id === user?._id;
            const peer = isTeacher ? session.learner : session.teacher;
            const isActing = actionLoadingId === session._id;
            const canReview = !isTeacher && session.status === 'Completed' && !session.isReviewed;

            return (
              <div
                key={session._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={peer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={peer?.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-50"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/profile/${peer?._id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-sm transition-colors"
                        >
                          {peer?.name}
                        </Link>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                          isTeacher ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isTeacher ? 'You are Teaching' : 'You are Learning'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <SkillBadge skill={session.skill} size="sm" variant={isTeacher ? 'teach' : 'learn'} />
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'Confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : session.status === 'Completed'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : session.status === 'Rescheduled'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : session.status === 'Cancelled'
                        ? 'bg-slate-50 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                {/* Session Date, Time & Video Meeting Room */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Date</span>
                      <span className="font-semibold">
                        {new Date(session.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Slot</span>
                      <span className="font-semibold">{session.startTime} - {session.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-700">
                    <Video className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Google Meet Room</span>
                      {session.meetingLink ? (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-emerald-600 hover:text-emerald-800 underline truncate inline-flex items-center gap-1.5"
                        >
                          <span>Join Google Meet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No link provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Topic / Notes */}
                {session.notes && (
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                    Agenda: {session.notes}
                  </p>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    Created {new Date(session.createdAt).toLocaleDateString()}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Pending Actions */}
                    {session.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectSession(session._id)}
                          disabled={isActing}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptSession(session._id)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Session</span>
                        </button>
                      </>
                    )}

                    {/* Confirmed Actions */}
                    {(session.status === 'Confirmed' || session.status === 'Rescheduled') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(session)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reschedule</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelSession(session._id)}
                          disabled={isActing}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCompleteSession(session._id)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Completed (+1 Credit)</span>
                        </button>
                      </>
                    )}

                    {/* Review Action for Learner */}
                    {canReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingSession(session);
                          setIsReviewModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {session.isReviewed && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        <span>Reviewed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Learning Session"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Date:</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time:</label>
              <input
                type="time"
                value={rescheduleStartTime}
                onChange={(e) => setRescheduleStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time:</label>
              <input
                type="time"
                value={rescheduleEndTime}
                onChange={(e) => setRescheduleEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoadingId !== null}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        session={reviewingSession}
        onSuccess={() => {
          fetchSessions();
        }}
      />
    </div>
  );
};

export default SessionsPage;
