import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ label = 'Loading manufacturing insights...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="text-sm font-medium text-slate-400">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
