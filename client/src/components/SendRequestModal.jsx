import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Send, ArrowRightLeft, Sparkles, Loader2 } from 'lucide-react';

const SendRequestModal = ({ isOpen, onClose, targetUser, onSuccess }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [teachSkillId, setTeachSkillId] = useState('');
  const [learnSkillId, setLearnSkillId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Set default skills if available
  React.useEffect(() => {
    if (isOpen) {
      if (user?.skillsToTeach?.length > 0) {
        setTeachSkillId(user.skillsToTeach[0].skill?._id || user.skillsToTeach[0].skill);
      }
      if (targetUser?.skillsToTeach?.length > 0) {
        setLearnSkillId(targetUser.skillsToTeach[0].skill?._id || targetUser.skillsToTeach[0].skill);
      }
      setMessage(
        `Hi ${targetUser?.name || 'there'}, I would love to connect and exchange knowledge!`
      );
    }
  }, [isOpen, targetUser, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teachSkillId || !learnSkillId) {
      addToast('Please select both a skill to teach and a skill to learn', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/requests', {
        receiverId: targetUser._id,
        teachSkillId,
        learnSkillId,
        message,
      });

      if (res.data.success) {
        addToast('Exchange request sent successfully!', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send request.';
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!targetUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Propose Skill Exchange">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <img
            src={targetUser.profileImage?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
            alt={targetUser.name}
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div>
            <p className="font-semibold text-slate-900">{targetUser.name}</p>
            <p className="text-slate-400 text-xs">@{targetUser.username}</p>
          </div>
        </div>

        {/* Skill You Offer */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Skill You Will Teach:
          </label>
          {user?.skillsToTeach?.length > 0 ? (
            <select
              value={teachSkillId}
              onChange={(e) => setTeachSkillId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              {user.skillsToTeach.map((item, idx) => {
                const sId = item.skill?._id || item.skill;
                const sName = item.skill?.name || 'Skill';
                return (
                  <option key={idx} value={sId}>
                    {sName} ({item.level || 'Intermediate'})
                  </option>
                );
              })}
            </select>
          ) : (
            <p className="text-rose-500 text-xs">
              You haven't listed any teaching skills yet. Please add a skill to your profile first!
            </p>
          )}
        </div>

        {/* Skill You Want to Learn */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Skill You Want to Learn from {targetUser.name}:
          </label>
          {targetUser?.skillsToTeach?.length > 0 ? (
            <select
              value={learnSkillId}
              onChange={(e) => setLearnSkillId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              required
            >
              {targetUser.skillsToTeach.map((item, idx) => {
                const sId = item.skill?._id || item.skill;
                const sName = item.skill?.name || 'Skill';
                return (
                  <option key={idx} value={sId}>
                    {sName} ({item.level || 'Expert'})
                  </option>
                );
              })}
            </select>
          ) : (
            <p className="text-amber-600 text-xs">
              This peer has not listed specific teaching skills yet.
            </p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Introductory Message:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="Introduce yourself and explain your learning goals..."
            required
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
            disabled={submitting || !user?.skillsToTeach?.length}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send Proposal</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SendRequestModal;
