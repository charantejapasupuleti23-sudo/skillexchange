import React, { useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Star,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Award,
  MessageCircle,
  Lightbulb,
  Clock,
  HeartHandshake,
  Sparkles,
} from 'lucide-react';

const TAG_OPTIONS = [
  'Clear Explanations',
  'Practical Code Examples',
  'Patient & Encouraging',
  'System Design Expert',
  'Problem-Solving Pro',
  'Fast Follow-up',
  'Hands-on Debugging',
  'Well Prepared',
];

const RATING_CRITERIA = [
  {
    id: 'communication',
    label: 'Communication & Clarity',
    desc: 'Explains complex topics clearly and listens actively',
    icon: MessageCircle,
  },
  {
    id: 'technicalMastery',
    label: 'Technical Depth & Mastery',
    desc: 'Deep knowledge, practical insights, and code solutions',
    icon: Lightbulb,
  },
  {
    id: 'punctuality',
    label: 'Punctuality & Preparedness',
    desc: 'On-time, well-organized, and focused during the call',
    icon: Clock,
  },
  {
    id: 'helpfulness',
    label: 'Patience & Helpfulness',
    desc: 'Approachable, supportive, and encouraging learning vibe',
    icon: HeartHandshake,
  },
];

const StarRatingInput = ({ label, desc, icon: Icon, value, onChange }) => {
  const [hoverVal, setHoverVal] = useState(0);

  const getLabel = (val) => {
    switch (val) {
      case 5:
        return 'Exceptional (5★)';
      case 4:
        return 'Very Good (4★)';
      case 3:
        return 'Average (3★)';
      case 2:
        return 'Needs Improvement (2★)';
      case 1:
        return 'Poor (1★)';
      default:
        return '';
    }
  };

  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{label}</h4>
            <p className="text-[10px] text-slate-500">{desc}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md">
          {getLabel(hoverVal || value)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverVal(star)}
            onMouseLeave={() => setHoverVal(0)}
            className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
          >
            <Star
              className={`w-5 h-5 ${
                (hoverVal || value) >= star
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

const ReviewModal = ({ isOpen, onClose, session, onSuccess }) => {
  const { addToast } = useToast();

  const [categoryRatings, setCategoryRatings] = useState({
    communication: 5,
    technicalMastery: 5,
    punctuality: 5,
    helpfulness: 5,
  });

  const [comment, setComment] = useState('');
  const [endorseSkill, setEndorseSkill] = useState(true);
  const [selectedTags, setSelectedTags] = useState(['Clear Explanations', 'Practical Code Examples']);
  const [submitting, setSubmitting] = useState(false);

  const compositeRating =
    Math.round(
      ((categoryRatings.communication +
        categoryRatings.technicalMastery +
        categoryRatings.punctuality +
        categoryRatings.helpfulness) /
        4) *
        10
    ) / 10;

  const handleCategoryChange = (key, val) => {
    setCategoryRatings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

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
        rating: compositeRating,
        categoryRatings,
        comment: comment.trim(),
        endorseSkill,
        tags: selectedTags,
      });

      if (res.data.success) {
        addToast('Multi-metric review and skill endorsement submitted!', 'success');
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

  const targetName = session.teacher?.name || 'Peer Mentor';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Peer Review & Skill Endorsement">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm text-slate-800 max-h-[75vh] overflow-y-auto pr-1">
        {/* Session context banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-3.5 rounded-2xl border border-indigo-100/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              Session Evaluation
            </span>
            <h3 className="font-bold text-slate-900 text-sm">{targetName}</h3>
            <span className="text-xs text-slate-500">{session.skill?.name || 'Skill Exchange'}</span>
          </div>

          <div className="text-right bg-white px-3 py-2 rounded-xl border border-indigo-100 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Overall Score</span>
            <div className="flex items-center gap-1 text-sm font-black text-amber-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{compositeRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Multi-Pillar Category Ratings */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-700">
            Rate Across 4 Mentorship Dimensions:
          </label>
          {RATING_CRITERIA.map((crit) => (
            <StarRatingInput
              key={crit.id}
              label={crit.label}
              desc={crit.desc}
              icon={crit.icon}
              value={categoryRatings[crit.id]}
              onChange={(val) => handleCategoryChange(crit.id, val)}
            />
          ))}
        </div>

        {/* Skill Verification / Endorsement Checkbox */}
        <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
          <input
            type="checkbox"
            id="endorseSkill"
            checked={endorseSkill}
            onChange={(e) => setEndorseSkill(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-emerald-600 rounded-md border-emerald-300 focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="endorseSkill" className="text-xs text-emerald-950 cursor-pointer">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              Endorse {targetName}'s Mastery in {session.skill?.name}
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5 leading-relaxed">
              Adds a verified peer endorsement badge to their profile for credibility and higher search visibility.
            </span>
          </label>
        </div>

        {/* Key Strengths Tags */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 text-xs">
            Key Mentorship Strengths & Tags:
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
        <div className="space-y-1">
          <label className="block font-bold text-slate-700 text-xs">Detailed Feedback & Takeaway:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="What concepts did you master? What made this peer collaboration great?"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white">
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
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-colors"
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
