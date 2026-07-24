import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import DispositionModal from '../components/DispositionModal';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  FileCheck, 
  ShieldCheck, 
  Sliders, 
  Layers, 
  Settings, 
  UserCheck, 
  Loader2,
  ListTodo
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

const InspectionDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [inspection, setInspection] = useState(null);
  const [aiRecord, setAiRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchData = async () => {
    try {
      const response = await api.get(`/inspections/${id}`);
      setInspection(response.data.inspection);
      setAiRecord(response.data.aiRecord);
    } catch (error) {
      console.error('Failed to load inspection detail', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRunAIAnalysis = async () => {
    setAiAnalyzing(true);
    try {
      const response = await api.post('/ai/analyze-inspection', { inspection_id: id });
      setAiRecord(response.data.aiRecord);
      setToast({ message: 'Gemini AI Root-Cause Analysis generated successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'AI Analysis failed', type: 'error' });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleToggleCAPA = async (itemId, currentCompleted) => {
    try {
      const response = await api.patch(`/ai/capa/${id}`, {
        itemId,
        completed: !currentCompleted,
        verified_by: !currentCompleted ? user?.name : ''
      });
      setAiRecord(response.data.aiRecord);
      setToast({ message: 'CAPA checklist task updated', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to update CAPA task', type: 'error' });
    }
  };

  const handleDispositionSubmit = async (data) => {
    try {
      const response = await api.patch(`/inspections/${id}/disposition`, data);
      setInspection(response.data.inspection);
      if (response.data.aiRecord) {
        setAiRecord(response.data.aiRecord);
      }
      setToast({ message: response.data.message, type: 'success' });
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Disposition update failed', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner label="Fetching inspection batch details..." />;
  if (!inspection) return <div className="p-8 text-slate-400">Inspection record not found.</div>;

  const outOfSpecCount = inspection.measurements.filter(m => !m.is_within_spec).length;
  const canApprove = user?.role === 'Engineer' || user?.role === 'Approver' || user?.role === 'Admin';

  return (
    <div className="space-y-8 pb-12">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      {/* Disposition Decision Modal */}
      <DispositionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleDispositionSubmit}
        batchNumber={inspection.batch_number}
        currentStatus={inspection.status}
      />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
              Batch #{inspection.batch_number}
            </h1>
            <StatusBadge status={inspection.status} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {inspection.product_id?.product_code} — {inspection.product_id?.product_name} | Stage: <span className="text-slate-200 font-medium">{inspection.stage}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAIAnalysis}
            disabled={aiAnalyzing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
          >
            {aiAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-200" />}
            {aiRecord ? 'Re-run Gemini AI Analysis' : 'Run Gemini AI Analysis'}
          </button>

          {canApprove && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Batch Disposition Decision
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Inspection Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Measurements Table & Defects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Measurements Card */}
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                Logged Quality Measurements ({inspection.measurements.length})
              </h2>
              {outOfSpecCount > 0 ? (
                <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded">
                  {outOfSpecCount} Breach(es)
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                  100% In Spec
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-3">Value Recorded</th>
                    <th className="py-2.5 px-3">Allowed Min/Max</th>
                    <th className="py-2.5 px-3 text-right">Spec Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {inspection.measurements.map((m, i) => (
                    <tr key={i} className={!m.is_within_spec ? 'bg-rose-500/5' : ''}>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{m.parameter}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                        {m.value} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {m.min_limit} - {m.max_limit} {m.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {m.is_within_spec ? (
                          <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Within Spec
                          </span>
                        ) : (
                          <span className="text-rose-400 font-semibold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Out of Spec
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Defect Logs Card */}
          {inspection.defect_logs && inspection.defect_logs.length > 0 && (
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Physical Defect Observations ({inspection.defect_logs.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {inspection.defect_logs.map((d, i) => (
                  <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-100">{d.defect_type}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {d.severity} (x{d.count})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{d.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Metadata Details Card */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Batch Production Context
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Inspector / Operator</span>
                <span className="font-medium text-slate-200">{inspection.operator_name}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Logged At</span>
                <span className="font-mono text-slate-300">{formatDate(inspection.createdAt)}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Material Lots</span>
                <span className="font-mono text-blue-400">
                  {inspection.material_lots?.join(', ') || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5 flex items-center gap-1 font-semibold">
                  <Settings className="w-3.5 h-3.5 text-slate-400" /> Machine Settings Snapshot
                </span>
                <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800">
                  {Object.entries(inspection.machine_settings || {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-slate-200">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {inspection.notes && (
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Operator Notes</span>
                  <p className="text-slate-300 italic p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    "{inspection.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Disposition Sign-off Card if completed */}
          {aiRecord && aiRecord.disposition_by && (
            <div className="p-6 bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-xl shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Quality Engineer Sign-off
              </h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Signed by: <span className="font-semibold text-slate-100">{aiRecord.disposition_by.name || 'Quality Engineer'}</span></div>
                <div className="text-[11px] text-slate-400 font-mono">Date: {formatDate(aiRecord.disposition_date)}</div>
                <div className="p-2.5 bg-slate-950/80 rounded border border-emerald-500/20 text-slate-200 italic mt-2">
                  "{aiRecord.engineer_comments || 'Approved release following CAPA verification.'}"
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: GEMINI AI ROOT-CAUSE QUALITY ANALYSIS PANEL */}
      <div className="bg-slate-900/90 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              Generative AI Diagnostics (Gemini 1.5 Flash)
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight mt-1">
              Automated Root-Cause Analysis & Evidence Assessment
            </h2>
          </div>

          {!aiRecord && (
            <button
              onClick={handleRunAIAnalysis}
              disabled={aiAnalyzing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 shrink-0"
            >
              {aiAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Gemini Insights
            </button>
          )}
        </div>

        {!aiRecord ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Sparkles className="w-12 h-12 mx-auto text-blue-500/40" />
            <h3 className="text-base font-bold text-slate-200">No AI Quality Analysis Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click the button above to run Google Gemini Generative AI across batch measurements, machine parameters, and spec limit tolerances.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Executive Summary */}
            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" /> Executive Summary
              </h3>
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                {aiRecord.summary}
              </p>
            </div>

            {/* Detailed Breakdown & Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" /> Technical Failure Mechanics
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {aiRecord.detailed_explanation}
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Evidence Gaps & Missing Sensor Telemetry
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {aiRecord.evidence_gaps}
                </p>
                {aiRecord.recurring_patterns && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                      Cross-Batch Pattern Analysis:
                    </span>
                    <p className="text-xs text-slate-400">{aiRecord.recurring_patterns}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 5-Why Root Cause Investigation Questions */}
            {aiRecord.root_cause_questions && aiRecord.root_cause_questions.length > 0 && (
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" /> 5-Why Investigation Framework
                </h3>
                <div className="space-y-2">
                  {aiRecord.root_cause_questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-slate-300 p-2.5 bg-slate-900/60 rounded-lg border border-slate-800/60">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold rounded text-[10px] shrink-0">
                        WHY #{idx + 1}
                      </span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive CAPA Checklist Section */}
            <div className="p-5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-emerald-400" /> Actionable CAPA (Corrective and Preventive Action) Checklist
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {aiRecord.capa_checklist.filter(c => c.completed).length} / {aiRecord.capa_checklist.length} Completed
                </span>
              </div>

              <div className="space-y-3">
                {aiRecord.capa_checklist.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-3.5 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      item.completed 
                        ? 'bg-emerald-950/10 border-emerald-500/30 text-slate-300' 
                        : 'bg-slate-900/70 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleCAPA(item.id, item.completed)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className={`text-xs font-medium block ${item.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {item.task}
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span>Owner: <strong className="text-blue-400 font-normal">{item.owner}</strong></span>
                          <span>Deadline: <strong className="text-amber-400 font-normal">{item.deadline}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] shrink-0">
                      {item.completed ? (
                        <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified by {item.verified_by || 'Engineer'}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Action Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionDetailPage;
