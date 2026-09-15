import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight">SkillLoop</span>
              <p className="text-xs text-slate-400">Teach what you know. Learn what you want.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <Link to="/discover" className="hover:text-indigo-600 transition-colors">Discover Mentors</Link>
            <Link to="/matches" className="hover:text-indigo-600 transition-colors">Smart Matches</Link>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">About SkillLoop</Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Built for peer-to-peer learning</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
