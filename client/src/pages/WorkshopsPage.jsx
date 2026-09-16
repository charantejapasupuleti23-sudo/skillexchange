import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CreateWorkshopModal from '../components/CreateWorkshopModal';
import EmptyState from '../components/EmptyState';
import {
  Users,
  Calendar,
  Clock,
  Video,
  Coins,
  Plus,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const WorkshopsPage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/workshops?category=${selectedCategory}`);
      if (res.data.success) {
        setWorkshops(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, [selectedCategory]);

  const handleJoin = async (workshopId) => {
    try {
      setJoiningId(workshopId);
      const res = await api.post(`/workshops/${workshopId}/join`);
      if (res.data.success) {
        addToast('Registered for workshop! Check Google Meet link to join.', 'success');
        if (refreshUser) refreshUser();
        fetchWorkshops();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join workshop', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const categories = ['All', 'Technical', 'Architecture', 'Interview Prep', 'Design'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Group Study Rooms & 1-to-Many Workshops</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Learn Together with Peer Workshops
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100">
            Join interactive group sessions hosted by top community mentors for System Design, Mock DSA Interviews, and Architecture reviews.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Host a Workshop</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Workshop List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="mt-2 text-xs text-slate-400">Loading community workshops...</p>
        </div>
      ) : workshops.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No upcoming workshops found"
          description="Be the first to host a group study room or mock interview workshop!"
          actionText="Host a Workshop"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.map((workshop) => {
            const isHost = workshop.host?._id === user?._id;
            const isAttending = workshop.attendees?.some((a) => a.user?._id === user?._id || a.user === user?._id);
            const isFull = (workshop.attendees?.length || 0) >= workshop.capacity;

            return (
              <div
                key={workshop._id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {workshop.category}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{workshop.creditCost === 0 ? 'Free' : `${workshop.creditCost} Credit`}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                    {workshop.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3">
                    {workshop.description}
                  </p>

                  {/* Host info */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <img
                      src={
                        workshop.host?.profileImage?.url ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={workshop.host?.name}
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        Host: {workshop.host?.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {workshop.host?.occupation || 'Mentor'}
                      </p>
                    </div>
                  </div>

                  {/* Time & Capacity Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{new Date(workshop.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{workshop.startTime} - {workshop.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{workshop.attendees?.length || 0} / {workshop.capacity} registered</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100">
                  {isHost ? (
                    <a
                      href={workshop.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Host: Launch Google Meet</span>
                    </a>
                  ) : isAttending ? (
                    <a
                      href={workshop.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registered: Join Google Meet</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoin(workshop._id)}
                      disabled={isFull || joiningId === workshop._id}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      {joiningId === workshop._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      <span>{isFull ? 'Workshop Full' : 'RSVP & Join'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Host Workshop Modal */}
      <CreateWorkshopModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        userSkills={user?.skillsToTeach}
        onSuccess={() => fetchWorkshops()}
      />
    </div>
  );
};

export default WorkshopsPage;
