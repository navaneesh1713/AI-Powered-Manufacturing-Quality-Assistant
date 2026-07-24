import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Plus, 
  Search, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

const DashboardPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchInspections = async () => {
    try {
      const response = await api.get('/inspections');
      setInspections(response.data);
    } catch (error) {
      console.error('Failed to fetch inspections', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const totalCount = inspections.length;
  const underReviewCount = inspections.filter(i => i.status === 'Under Review').length;
  const quarantinedCount = inspections.filter(i => i.status === 'Quarantined').length;
  const approvedCount = inspections.filter(i => i.status === 'Approved').length;
  
  const defectRate = totalCount > 0 
    ? Math.round(((underReviewCount + quarantinedCount + inspections.filter(i => i.status === 'Scrapped').length) / totalCount) * 100) 
    : 0;

  const filteredInspections = inspections.filter(i => {
    const matchesSearch = i.batch_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.product_id?.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.product_id?.product_code || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            Quality Control Operational Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time batch inspections, specification monitoring, and Generative Gemini AI root-cause analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inspections/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Log New Inspection
          </Link>
          <Link
            to="/products"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Manage Specifications
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inspections</span>
            <div className="text-2xl font-extrabold text-slate-100 mt-1">{totalCount}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Active Batch Tracking
            </div>
          </div>
          <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Defect / Anomaly Rate</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">{defectRate}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Tolerance breaches flagged</div>
          </div>
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Under AI Review</span>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">{underReviewCount}</div>
            <div className="text-[11px] text-blue-300 mt-1">Pending engineer release</div>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quarantined Batches</span>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">{quarantinedCount}</div>
            <div className="text-[11px] text-rose-400 mt-1">Locked in holding zone</div>
          </div>
          <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Inspections Table Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Recent Quality Inspections & AI Records
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any inspection to trigger or view Gemini AI Root-Cause Analysis</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search batch or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Quarantined">Quarantined</option>
              <option value="Scrapped">Scrapped</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filteredInspections.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No matching inspection records found.</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or log a new inspection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Product Code & Name</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Spec Failures</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Log Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInspections.map((item) => {
                  const outOfSpecCount = item.measurements.filter(m => !m.is_within_spec).length;
                  return (
                    <tr 
                      key={item._id} 
                      className="hover:bg-slate-800/40 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                        {item.batch_number}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div className="font-semibold text-slate-100">{item.product_id?.product_code || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{item.product_id?.product_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {item.stage}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {item.operator_name}
                      </td>
                      <td className="py-3.5 px-4">
                        {outOfSpecCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {outOfSpecCount} Out of Spec
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Passed All
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/inspections/${item._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[11px] font-semibold rounded border border-blue-500/30 transition group-hover:border-blue-400"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          AI Investigation
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
