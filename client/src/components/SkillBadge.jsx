import React from 'react';

const levelColors = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-sky-50 text-sky-700 border-sky-200',
  Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
};

const SkillBadge = ({ skill, level, size = 'md', onRemove }) => {
  const skillName = typeof skill === 'string' ? skill : skill?.name || 'Skill';
  const skillCategory = skill?.category;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border shadow-xs transition-colors ${
        level ? levelColors[level] || 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-50 text-slate-700 border-slate-200'
      } ${sizeClasses}`}
    >
      <span>{skillName}</span>
      {level && (
        <span className="text-[10px] font-semibold opacity-80 uppercase tracking-wider">
          • {level}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-rose-600 focus:outline-hidden"
          title="Remove skill"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default SkillBadge;
