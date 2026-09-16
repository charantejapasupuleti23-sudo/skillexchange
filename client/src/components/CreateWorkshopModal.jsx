import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Users, Calendar, Clock, Video, Coins, Loader2, Sparkles } from 'lucide-react';

const CreateWorkshopModal = ({ isOpen, onClose, userSkills, onSuccess }) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillId, setSkillId] = useState('');
  const [category, setCategory] = useState('Technical');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [capacity, setCapacity] = useState(15);
  const [creditCost, setCreditCost] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDate(d.toISOString().split('T')[0]);

      if (userSkills && userSkills.length > 0) {
        setSkillId(userSkills[0].skill?._id || userSkills[0].skill);
      }
    }
  }, [isOpen, userSkills]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !skillId || !date || !startTime || !endTime) {
      addToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/workshops', {
        title,
        description,
        skillId,
        category,
        date,
        startTime,
        endTime,
        capacity: Number(capacity),
        creditCost: Number(creditCost),
      });

      if (res.data.success) {
        addToast('Group Workshop created! Google Meet link generated.', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create workshop', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Host a Group Workshop / Study Room">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm text-slate-800">
        <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-900">
            Host a 1-to-many workshop for high-demand topics (e.g. System Design, Mock DSA Interviews). You earn time credits for each registered attendee!
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Workshop Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scalable Microservices & Redis Caching Deep Dive"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Skill Focus:</label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              {userSkills?.map((s, idx) => (
                <option key={idx} value={s.skill?._id || s.skill}>
                  {s.skill?.name || 'Skill'} ({s.level || 'Expert'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Technical">Technical</option>
              <option value="Architecture">Architecture & System Design</option>
              <option value="Interview Prep">Interview Prep & Mock</option>
              <option value="Design">UI/UX Design</option>
            </select>
          </div>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max Capacity (Seats):</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min={2}
              max={50}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Entry Fee (Credits):</label>
            <select
              value={creditCost}
              onChange={(e) => setCreditCost(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value={0}>Free (0 Credits)</option>
              <option value={1}>1 Time Credit</option>
              <option value={2}>2 Time Credits</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Workshop Description & Agenda:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Outline the topics covered, prerequisite knowledge, and live coding exercises..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
            <span>Publish Workshop</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkshopModal;
