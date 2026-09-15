import React from 'react';

const MatchScore = ({ score, size = 'md', showLabel = true }) => {
  const numScore = Math.round(Number(score) || 0);

  let colorClasses = 'bg-emerald-500 text-white';
  let badgeBorder = 'border-emerald-200 bg-emerald-50 text-emerald-700';

  if (numScore >= 80) {
    colorClasses = 'bg-indigo-600 text-white';
    badgeBorder = 'border-indigo-200 bg-indigo-50 text-indigo-700';
  } else if (numScore >= 50) {
    colorClasses = 'bg-sky-600 text-white';
    badgeBorder = 'border-sky-200 bg-sky-50 text-sky-700';
  } else {
    colorClasses = 'bg-slate-600 text-white';
    badgeBorder = 'border-slate-200 bg-slate-50 text-slate-700';
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeBorder}`}>
        {numScore}% Match
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeBorder}`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      <span>{numScore}% {showLabel && 'Match'}</span>
    </div>
  );
};

export default MatchScore;
