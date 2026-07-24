export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getStatusColorClass = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Quarantined':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'Scrapped':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'Under Review':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'Draft':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

export const exportToCSV = (data, filename = 'quality_inspections.csv') => {
  if (!data || !data.length) return;

  const headers = ['Batch Number', 'Product Code', 'Product Name', 'Operator', 'Stage', 'Status', 'Defects Count', 'Created At'];
  const rows = data.map(item => [
    item.batch_number,
    item.product_id?.product_code || 'N/A',
    item.product_id?.product_name || 'N/A',
    item.operator_name,
    item.stage,
    item.status,
    item.defect_logs?.length || 0,
    new Date(item.createdAt).toLocaleString()
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.map(cell => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
