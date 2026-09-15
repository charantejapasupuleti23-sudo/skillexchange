import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Star, Loader2 } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, session, onSuccess }) => {
  const { addToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      });

      if (res.data.success) {
        addToast('Review submitted successfully!', 'success');
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
    <Modal isOpen={isOpen} onClose={onClose} title="Leave a Peer Review">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="text-center pb-2">
          <p className="text-xs text-slate-500">How was your session with</p>
          <p className="font-semibold text-slate-900 text-sm">{session.teacher?.name}?</p>
          <span className="inline-block mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            {session.skill?.name}
          </span>
        </div>

        {/* Star Selection */}
        <div className="flex items-center justify-center gap-1.5 py-2">
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

        {/* Comment Field */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Your Feedback:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="What did you learn? What made this session helpful?"
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
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
            <span>Submit Review</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;
