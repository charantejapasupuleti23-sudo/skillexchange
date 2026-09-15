import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import SendRequestModal from '../components/SendRequestModal';
import EmptyState from '../components/EmptyState';
import {
  Search,
  Filter,
  Loader2,
  Compass,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  X,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = [
  'Programming',
  'Design',
  'Business',
  'Creative',
  'Data & AI',
  'Language',
  'Marketing',
  'Music',
];

const DiscoverPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [level, setLevel] = useState(searchParams.get('level') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if current user profile is incomplete
  const hasNoTeachingSkills = !user?.skillsToTeach || user.skillsToTeach.length === 0;
  const hasNoLearningSkills = !user?.skillsToLearn || user.skillsToLearn.length === 0;
  const isProfileIncomplete = user && (hasNoTeachingSkills || hasNoLearningSkills);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 12);
      if (search.trim()) params.append('search', search.trim());
      if (skill.trim()) params.append('skill', skill.trim());
      if (selectedCategories.length > 0) {
        params.append('category', selectedCategories.join(','));
      }
      if (level && level !== 'All') params.append('level', level);
      if (location.trim()) params.append('location', location.trim());

      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [selectedCategories, level]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSkill('');
    setSelectedCategories([]);
    setLevel('All');
    setLocation('');
    fetchUsers(1);
  };

  const handleOpenConnect = (targetUser) => {
    setSelectedUser(targetUser);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Discover Mentors & Peers
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore skilled creators, developers, and designers ready for peer-to-peer knowledge exchange
        </p>
      </div>

      {/* Onboarding Banner if Skills Missing */}
      {isProfileIncomplete && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Setup your profile to unlock smart 1:1 barter matches!
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {hasNoTeachingSkills && hasNoLearningSkills
                  ? 'Add at least 1 skill you can teach and 1 skill you want to learn to get matched with barter partners.'
                  : hasNoTeachingSkills
                  ? 'Add at least 1 skill you can teach to unlock 2-way trade proposals.'
                  : 'Add at least 1 skill you want to learn to discover mentors who teach it.'}
              </p>
            </div>
          </div>
          <Link
            to="/profile/edit"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Update Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Search & Multi-Attribute Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, name, bio, or role..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="relative sm:col-span-3">
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Specific skill (e.g. React, Python)..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="relative sm:col-span-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or Remote..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Search
            </button>
            {(search || skill || location || selectedCategories.length > 0 || level !== 'All') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                title="Reset filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Multi-Select Category Pills & Level Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Category Pills:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategories.length === 0
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Proficiency:
            </span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Results / Skeleton Shimmer */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-2.5 bg-slate-100 rounded-md w-1/2"></div>
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl"></div>
              <div className="flex gap-2">
                <div className="h-5 bg-slate-100 rounded-md w-16"></div>
                <div className="h-5 bg-slate-100 rounded-md w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No users found matching your search"
          description="Try broadening your skill keywords or clearing filters to discover more peers."
          actionText="Reset All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong className="text-slate-900">{users.length}</strong> available peers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map((u) => (
              <ProfileCard
                key={u._id}
                user={u}
                onConnect={handleOpenConnect}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => fetchUsers(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    pagination.page === p
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trade Proposal Request Modal */}
      <SendRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUser={selectedUser}
      />
    </div>
  );
};

export default DiscoverPage;
