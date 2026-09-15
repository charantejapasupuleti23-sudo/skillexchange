import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Code,
  Layout,
  Briefcase,
  Camera,
  Users,
  CalendarCheck,
  Star,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import ProfileCard from '../components/ProfileCard';

const LandingPage = () => {
  const { user } = useAuth();
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [usersRes, skillsRes] = await Promise.all([
          api.get('/users?limit=3'),
          api.get('/skills?sort=popularity'),
        ]);

        if (usersRes.data.success) {
          setFeaturedUsers(usersRes.data.data);
        }
        if (skillsRes.data.success) {
          setPopularSkills(skillsRes.data.data.slice(0, 8));
        }
      } catch (err) {
        // ignore
      }
    };
    loadFeatured();
  }, []);

  return (
    <div className="space-y-20 pb-12">
      {/* Hero Section */}
      <section className="text-center pt-8 md:pt-16 max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold shadow-xs animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Peer-to-Peer Skill Exchange Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Learn from people. <br />
          <span className="text-indigo-600">Teach what you know.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          SkillLoop connects people who want to exchange knowledge, practice together, and grow through reciprocal peer-to-peer learning — completely free of charge.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={user ? '/matches' : '/register'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-102"
          >
            <span>Find Your Match</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm shadow-xs transition-colors"
          >
            <span>Share Your Skill</span>
          </Link>
        </div>

        {/* Visual Flow Banner */}
        <div className="pt-10">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              How The Loop Works
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700">
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                1. Your Skills
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                2. Find a Match
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                3. Exchange Knowledge
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                4. Learn Together
              </span>
              <span className="text-slate-300">→</span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                5. Grow
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center shadow-xs">
          <p className="text-3xl font-extrabold text-indigo-600">500+</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Skills Exchanged</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center shadow-xs">
          <p className="text-3xl font-extrabold text-indigo-600">94%</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Matching Accuracy</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center shadow-xs">
          <p className="text-3xl font-extrabold text-indigo-600">1,200+</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Completed Sessions</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 text-center shadow-xs">
          <p className="text-3xl font-extrabold text-indigo-600">4.9/5</p>
          <p className="text-xs text-slate-500 font-medium mt-1">Average Peer Rating</p>
        </div>
      </section>

      {/* Popular Skills Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Popular Exchange Skills
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Explore high-demand programming, design, and creative competencies
            </p>
          </div>
          <Link
            to="/discover"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            Explore All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {popularSkills.map((skill) => (
            <Link
              key={skill._id}
              to={`/discover?skill=${encodeURIComponent(skill.name)}`}
              className="bg-white rounded-xl border border-slate-200/80 p-4 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                  {skill.name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{skill.category}</p>
              </div>
              <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Why SkillLoop Feature Highlights */}
      <section className="bg-indigo-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            Why SkillLoop
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight">
            Learn faster by trading what you're already great at.
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed">
            No expensive bootcamps or one-way video lectures. Practice interactively 1-on-1 with talented peers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Smart Mutual Matching</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Our 5-factor matching algorithm pairs you with people whose teaching abilities complement your learning objectives.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-200">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Both Teacher & Learner</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Never feel locked into a single role. Share your frontend expertise while getting coached in Python or design thinking.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-200">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">Structured Sessions</h3>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Schedule sessions with built-in video links, track mastery milestones, and build your verified peer reputation.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Mentors / Peers */}
      {featuredUsers.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Featured Peers on SkillLoop
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Connect with passionate developers, designers, and creators
              </p>
            </div>
            <Link
              to="/discover"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Browse All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredUsers.map((u) => (
              <ProfileCard key={u._id} user={u} />
            ))}
          </div>
        </section>
      )}

      {/* Call to Action CTA */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-xs space-y-5">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Ready to trade knowledge and level up?
        </h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
          Create your profile in 60 seconds, add the skills you can teach, and discover your highest-scoring peer matches today.
        </p>
        <div>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-102"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
