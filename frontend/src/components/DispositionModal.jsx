import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, X, Loader2 } from 'lucide-react';

const DispositionModal = ({ isOpen, onClose, onSubmit, batchNumber, currentStatus }) => {
  const [status, setStatus] = useState(currentStatus || 'Quarantined');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ status, engineer_comments: comments });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          Batch Disposition Decision
        </h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Sign off on quality release or quarantine status for Batch <span className="font-mono text-blue-400">{batchNumber}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Disposition Outcome
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStatus('Approved')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition ${
                  status === 'Approved'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mb-1 text-emerald-400" />
                Approve & Release
              </button>

              <button
                type="button"
                onClick={() => setStatus('Quarantined')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition ${
                  status === 'Quarantined'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/40'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-5 h-5 mb-1 text-amber-400" />
                Quarantine
              </button>

              <button
                type="button"
                onClick={() => setStatus('Scrapped')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition ${
                  status === 'Scrapped'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/40'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="w-5 h-5 mb-1 text-rose-400" />
                Scrap Batch
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Quality Engineer Rationale / Sign-off Comments
            </label>
            <textarea
              required
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="State root-cause justification, containment instructions, or CAPA approval notes..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Disposition Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispositionModal;
