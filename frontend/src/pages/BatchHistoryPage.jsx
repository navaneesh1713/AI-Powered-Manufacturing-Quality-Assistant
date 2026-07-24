import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { formatDate, exportToCSV } from '../utils/helpers';

const BatchHistoryPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/inspections?batch=${search}&status=${statusFilter}&severity=${severityFilter}`);
      setInspections(response.data);
    } catch (error) {
      console.error('Failed to load batch history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, severityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <History className="w-7 h-7 text-blue-500" />
            Batch History & Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete regulatory compliance log, exportable quality records, and historical quality cases
          </p>
        </div>

        <button
          onClick={() => exportToCSV(inspections, `Quality_Audit_Export_${Date.now()}.csv`)}
          disabled={inspections.length === 0}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-2 self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search batch code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Quarantined">Quarantined</option>
              <option value="Scrapped">Scrapped</option>
              <option value="Under Review">Under Review</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Defect Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Severities</option>
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <button
            onClick={fetchHistory}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition bg-slate-950 rounded border border-slate-800"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Querying historical quality audit logs..." />
        ) : inspections.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm font-medium">No audit logs matching search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Product Code & Name</th>
                  <th className="py-3 px-4">Process Stage</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Defect Logs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged Date</th>
                  <th className="py-3 px-4 text-right">View Audit Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                      {item.batch_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <div className="font-semibold text-slate-100">{item.product_id?.product_code || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{item.product_id?.product_name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{item.stage}</td>
                    <td className="py-3.5 px-4 text-slate-300">{item.operator_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {item.defect_logs?.length || 0} defects
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
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold text-xs"
                      >
                        Reopen Record <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchHistoryPage;
