import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReviewModal from '../components/ReviewModal';
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
  AlertCircle,
} from 'lucide-react';

const SessionsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Review Modal state
  const [reviewingSession, setReviewingSession] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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
        addToast('Session declined.', 'info');
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
        addToast('Session marked as completed! Progress updated.', 'success');
        fetchSessions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to complete session', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'All') return true;
    return s.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
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
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {['All', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
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
          title="You don't have any upcoming sessions."
          description="Schedule sessions directly from your active conversations or discover new peers to learn with."
          actionText="Find Someone to Learn From"
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
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={peer?.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={peer?.name}
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${peer?._id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-sm transition-colors"
                        >
                          {peer?.name}
                        </Link>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-600">
                          {isTeacher ? 'Your Learner' : 'Your Teacher'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <SkillBadge skill={session.skill} size="sm" />
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      session.status === 'Confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : session.status === 'Completed'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : session.status === 'Cancelled'
                        ? 'bg-slate-50 text-slate-600 border border-slate-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                {/* Session Date, Time & Meeting Link */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                      <span className="font-semibold">
                        {new Date(session.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Time</span>
                      <span className="font-semibold">{session.startTime} - {session.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Meeting Room</span>
                      {session.meetingLink ? (
                        <a
                          href={session.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-indigo-600 hover:text-indigo-800 underline truncate block inline-flex items-center gap-1"
                        >
                          <span>Join Video</span>
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
                    Notes: {session.notes}
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
                    {session.status === 'Confirmed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCancelSession(session._id)}
                          disabled={isActing}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
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
                          <span>Mark Completed</span>
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
