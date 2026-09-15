import React from 'react';

const levelColors = {
  Beginner: 'bg-teal-50 text-teal-700 border-teal-200',
  Intermediate: 'bg-sky-50 text-sky-700 border-sky-200',
  Advanced: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
};

const variantColors = {
  teach: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  learn: 'bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100',
  default: 'bg-slate-50 text-slate-700 border-slate-200',
};

const SkillBadge = ({ skill, level, variant, size = 'md', onRemove }) => {
  const skillName = typeof skill === 'string' ? skill : skill?.name || 'Skill';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-lg',
    lg: 'text-sm px-3 py-1.5 rounded-xl',
  }[size] || 'text-xs px-2.5 py-1 rounded-lg';

  let colorClass = variantColors[variant] || (level ? levelColors[level] : variantColors.default);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border shadow-2xs transition-colors ${colorClass} ${sizeClasses}`}
    >
      <span>{skillName}</span>
      {level && (
        <span className="text-[10px] font-bold opacity-75 uppercase tracking-wider">
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
          className="ml-1 hover:text-rose-600 focus:outline-hidden font-bold"
          title="Remove skill"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default SkillBadge;
