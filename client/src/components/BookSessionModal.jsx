import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  Clock,
  Coins,
  Video,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const BookSessionModal = ({ isOpen, onClose, mentor, onSuccess }) => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && mentor?._id) {
      // Set default date (tomorrow)
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDate(d.toISOString().split('T')[0]);

      // Set default taught skill
      if (mentor.skillsToTeach?.length > 0) {
        setSelectedSkillId(mentor.skillsToTeach[0].skill?._id || mentor.skillsToTeach[0].skill);
      }

      fetchMentorSlots();
    }
  }, [isOpen, mentor]);

  const fetchMentorSlots = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/availability/mentor/${mentor._id}`);
      if (res.data.success) {
        setSlots(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedSlot(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();

    if (!selectedSkillId || !date) {
      addToast('Please select a skill and session date', 'error');
      return;
    }

    if ((user?.timeCredits || 0) < 1) {
      addToast('You need at least 1 Time Credit to book a session. Teach a session to earn credits!', 'error');
      return;
    }

    const startTime = selectedSlot ? selectedSlot.startTime : '18:00';
    const endTime = selectedSlot ? selectedSlot.endTime : '19:00';

    try {
      setSubmitting(true);
      const res = await api.post('/sessions', {
        teacherId: mentor._id,
        learnerId: user._id,
        skillId: selectedSkillId,
        date,
        startTime,
        endTime,
        notes,
        availabilitySlotId: selectedSlot?._id,
      });

      if (res.data.success) {
        addToast('Session booked! 1 Time Credit is secured in escrow until completion.', 'success');
        if (refreshUser) refreshUser();
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to book session', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mentor) return null;

  const currentCredits = user?.timeCredits ?? 5;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Direct Mentor Booking (Time-Banking)">
      <form onSubmit={handleBook} className="space-y-4 text-xs sm:text-sm text-slate-800">
        {/* Mentor Info Header */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-3">
            <img
              src={
                mentor.profileImage?.url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
              }
              alt={mentor.name}
              className="w-11 h-11 rounded-2xl object-cover"
            />
            <div>
              <p className="font-bold text-slate-900">{mentor.name}</p>
              <p className="text-slate-500 text-xs">{mentor.occupation || 'SkillLoop Mentor'}</p>
            </div>
          </div>

          {/* Time Credit Status Badge */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Wallet</span>
            <span className="inline-flex items-center gap-1 font-extrabold text-indigo-600">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentCredits} Credits</span>
            </span>
          </div>
        </div>

        {/* Escrow Notice */}
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <Coins className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">1 Time Credit Escrow Guarantee:</span>
            <span>
              1 credit is held in escrow when booking. It is only released to {mentor.name} when you both confirm session completion. You can cancel anytime before for a full instant refund.
            </span>
          </div>
        </div>

        {/* Skill Selection */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Skill to Learn:</label>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required
          >
            {mentor.skillsToTeach?.map((s, idx) => (
              <option key={idx} value={s.skill?._id || s.skill}>
                {s.skill?.name || 'Skill'} ({s.level || 'Intermediate'})
              </option>
            ))}
          </select>
        </div>

        {/* Published Availability Slots */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Available Mentor Windows:
          </label>
          {loading ? (
            <div className="py-4 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading mentor availability...</span>
            </div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {slots.map((slot) => {
                const isSelected = selectedSlot?._id === slot._id;
                return (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{slot.dayOfWeek}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              No specific recurring slots published by mentor. Pick your custom date & time below!
            </div>
          )}
        </div>

        {/* Date Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Date:</label>
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
            <label className="block font-semibold text-slate-700 mb-1">Time Slot:</label>
            <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
              {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : '18:00 - 19:00 (Standard 1 hr)'}
            </div>
          </div>
        </div>

        {/* Topic Agenda */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Session Agenda / Goal:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="e.g. Debugging React Redux hooks, DSA graph traversal practice..."
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || currentCredits < 1}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-3.5 h-3.5" />
            )}
            <span>Book with 1 Credit</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookSessionModal;
