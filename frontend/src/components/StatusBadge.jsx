import React from 'react';
import { CheckCircle, AlertTriangle, ShieldAlert, Clock, FileText } from 'lucide-react';
import { getStatusColorClass } from '../utils/helpers';

const StatusBadge = ({ status }) => {
  const getIcon = () => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-3.5 h-3.5 mr-1" />;
      case 'Quarantined':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      case 'Scrapped':
        return <ShieldAlert className="w-3.5 h-3.5 mr-1" />;
      case 'Under Review':
        return <Clock className="w-3.5 h-3.5 mr-1" />;
      default:
        return <FileText className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(status)}`}>
      {getIcon()}
      {status}
    </span>
  );
};

export default StatusBadge;
