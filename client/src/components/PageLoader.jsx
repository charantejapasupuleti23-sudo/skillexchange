import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-3">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <span className="text-xs font-medium text-slate-400">Loading page...</span>
    </div>
  );
}
