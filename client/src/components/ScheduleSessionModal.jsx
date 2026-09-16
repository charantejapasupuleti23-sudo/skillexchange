import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Calendar, Clock, Video, FileText, Loader2 } from 'lucide-react';

const ScheduleSessionModal = ({ isOpen, onClose, connection, peerUser, onSuccess }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [role, setRole] = useState('learner'); // 'learner' (peer teaches me) or 'teacher' (I teach peer)
  const [skillId, setSkillId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [notes, setNotes] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const generateMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
  };

  React.useEffect(() => {
    if (isOpen) {
      // Set default minimum date (tomorrow)
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDate(d.toISOString().split('T')[0]);

      // Set default skill
      if (connection?.sharedSkills?.length > 0) {
        setSkillId(connection.sharedSkills[0]._id || connection.sharedSkills[0]);
      } else if (peerUser?.skillsToTeach?.length > 0) {
        setSkillId(peerUser.skillsToTeach[0].skill?._id || peerUser.skillsToTeach[0].skill);
      }

      setMeetingLink(generateMeetLink());
    }
  }, [isOpen, connection, peerUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!skillId || !date || !startTime || !endTime) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    const teacherId = role === 'learner' ? peerUser._id : user._id;
    const learnerId = role === 'learner' ? user._id : peerUser._id;

    try {
      setSubmitting(true);
      const res = await api.post('/sessions', {
        connectionId: connection._id,
        teacherId,
        learnerId,
        skillId,
        date,
        startTime,
        endTime,
        meetingLink,
        notes,
      });

      if (res.data.success) {
        addToast('Learning session scheduled successfully!', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to schedule session.';
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!peerUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Learning Session">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <img
            src={peerUser.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
            alt={peerUser.name}
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{peerUser.name}</p>
            <p className="text-slate-400 text-xs">@{peerUser.username}</p>
          </div>
        </div>

        {/* Role toggle */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Session Type:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('learner')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                role === 'learner'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {peerUser.name} teaches me
            </button>
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                role === 'teacher'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              I teach {peerUser.name}
            </button>
          </div>
        </div>

        {/* Skill Selector */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Skill Focus:</label>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required
          >
            {connection?.sharedSkills?.map((s, idx) => (
              <option key={idx} value={s._id || s}>
                {s.name || 'Shared Skill'}
              </option>
            ))}
            {peerUser?.skillsToTeach?.map((s, idx) => (
              <option key={`p-${idx}`} value={s.skill?._id || s.skill}>
                {s.skill?.name || 'Skill'} ({s.level || 'Peer teaches'})
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Start Time:</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">End Time:</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>
        </div>

        {/* Meeting Link */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Meet Video Link:</span>
            </label>
            <button
              type="button"
              onClick={() => setMeetingLink(generateMeetLink())}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
            >
              Generate New Link
            </button>
          </div>
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/xxx-yyyy-zzz"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            An email with this Google Meet link and session details will be sent automatically to both participants.
          </p>
        </div>

        {/* Agenda / Notes */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Agenda / Topic Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="What concepts or exercises will you cover during this session?"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>Schedule Session</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleSessionModal;
