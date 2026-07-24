import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md transition-all ${
      isSuccess ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
    }`}>
      {isSuccess ? <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400" /> : <AlertCircle className="w-5 h-5 mr-3 text-rose-400" />}
      <span className="text-sm font-medium pr-4">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
