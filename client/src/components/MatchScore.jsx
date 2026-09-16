import React from 'react';

const MatchScore = ({ score, breakdown, size = 'md', showLabel = true, showBreakdown = false }) => {
  const numScore = Math.round(Number(score) || 0);

  let badgeBorder = 'border-slate-200 bg-slate-50 text-slate-700';
  let dotColor = 'bg-slate-500';

  if (numScore >= 80) {
    badgeBorder = 'border-emerald-200 bg-emerald-50 text-emerald-700';
    dotColor = 'bg-emerald-500';
  } else if (numScore >= 60) {
    badgeBorder = 'border-indigo-200 bg-indigo-50 text-indigo-700';
    dotColor = 'bg-indigo-500';
  } else if (numScore >= 40) {
    badgeBorder = 'border-sky-200 bg-sky-50 text-sky-700';
    dotColor = 'bg-sky-500';
  }

  const percentages = breakdown?.percentages || {
    skills: Math.round(numScore * 0.5),
    proficiency: Math.round(numScore * 0.2),
    schedule: Math.round(numScore * 0.15),
    reputation: Math.round(numScore * 0.15),
  };

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeBorder}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{numScore}% Match</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeBorder}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
        <span>{numScore}% {showLabel && 'Match'}</span>
      </div>

      {showBreakdown && (
        <div className="w-28 space-y-1">
          {/* Segmented visual progress bar */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex" title={`Skills: ${percentages.skills}%, Schedule: ${percentages.schedule}%, Proficiency: ${percentages.proficiency}%, Reputation: ${percentages.reputation}%`}>
            <div style={{ width: `${percentages.skills}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${percentages.proficiency}%` }} className="bg-indigo-500 h-full" />
            <div style={{ width: `${percentages.schedule}%` }} className="bg-amber-500 h-full" />
            <div style={{ width: `${percentages.reputation}%` }} className="bg-sky-500 h-full" />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-medium tracking-tight">
            <span className="text-emerald-600">Skills {percentages.skills}%</span>
            <span className="text-amber-600">Sched {percentages.schedule}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchScore;
