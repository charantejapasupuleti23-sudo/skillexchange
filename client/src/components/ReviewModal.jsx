import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Star, Loader2, ShieldCheck, CheckCircle2, Award } from 'lucide-react';

const TAG_OPTIONS = [
  'Clear Explanations',
  'Practical Code Examples',
  'Patient & Encouraging',
  'System Design Expert',
  'Problem-Solving Pro',
  'Fast Follow-up',
];

const ReviewModal = ({ isOpen, onClose, session, onSuccess }) => {
  const { addToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [endorseSkill, setEndorseSkill] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['Clear Explanations', 'Practical Code Examples']);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      addToast('Please write a short comment about your session', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/reviews', {
        sessionId: session._id,
        rating,
        comment: comment.trim(),
        endorseSkill,
        tags: selectedTags,
      });

      if (res.data.success) {
        addToast('Review and skill endorsement submitted successfully!', 'success');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit review.';
      addToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review & Verify Skill Endorsement">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm text-slate-800">
        <div className="text-center pb-1">
          <p className="text-xs text-slate-500">How was your session with</p>
          <p className="font-bold text-slate-900 text-sm">{session.teacher?.name}?</p>
          <span className="inline-block mt-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            {session.skill?.name || 'Skill'}
          </span>
        </div>

        {/* Star Selection */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-hidden"
            >
              <Star
                className={`w-7 h-7 ${
                  (hoverRating || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Skill Verification / Endorsement Checkbox */}
        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
          <input
            type="checkbox"
            id="endorseSkill"
            checked={endorseSkill}
            onChange={(e) => setEndorseSkill(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-emerald-600 rounded-md border-emerald-300 focus:ring-emerald-500"
          />
          <label htmlFor="endorseSkill" className="text-xs text-emerald-950 cursor-pointer">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              Endorse {session.teacher?.name} in {session.skill?.name}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              Adds a verified peer endorsement badge to their profile for credibility.
            </span>
          </label>
        </div>

        {/* Feedback Highlights / Tags */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Key Mentorship Strengths:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Field */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Your Detailed Feedback:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="What concepts did you master? What made this session great?"
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
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
            <span>Submit Review & Endorsement</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;
