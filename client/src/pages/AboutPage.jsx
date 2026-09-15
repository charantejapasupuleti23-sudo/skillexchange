import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Sparkles, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>About SkillLoop</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          “Teach what you know. Learn what you want.”
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          SkillLoop is a peer-to-peer knowledge exchange ecosystem built to dismantle the barriers of expensive education through reciprocal human connection.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            01
          </div>
          <h3 className="font-bold text-slate-900 text-base">Mutual Reciprocity</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every user is valued as both a teacher and a student. You don't need money to learn — your knowledge is your currency.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            02
          </div>
          <h3 className="font-bold text-slate-900 text-base">Algorithmic Transparency</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our 5-factor matching algorithm clearly explains why you match with peers: mutual skill complementarity, proficiency levels, and schedule overlap.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
            03
          </div>
          <h3 className="font-bold text-slate-900 text-base">Accountability & Trust</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Scheduled practice sessions, progress milestones, and verified post-session reviews ensure quality, safe, and productive exchanges.
          </p>
        </div>
      </div>

      {/* Architecture & Engineering Callout */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Engineering Philosophy
        </span>
        <h2 className="text-xl font-bold tracking-tight">Full-Stack MERN Architecture</h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          SkillLoop is engineered with clean separation of concerns: Express REST APIs, centralized error handling, robust Mongoose relationships with text and compound indexing, WebSocket real-time chat with Socket.IO, secure JWT cookie authentication, and a responsive Tailwind React client.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 transition-colors"
        >
          <span>Join the SkillLoop Community</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
