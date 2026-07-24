import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { User, Shield, Factory, Mail, Key, CheckCircle } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);

  const rolePermissions = {
    Inspector: [
      'Submit quality inspection logs and measurement readings',
      'Record physical defect logs and operator machine parameters',
      'Trigger automated Gemini AI quality analysis',
      'Toggle CAPA completion status'
    ],
    Engineer: [
      'All Inspector capabilities',
      'Configure Product Quality Specifications and Min/Max limit bounds',
      'Review Gemini AI root-cause analysis and evidence gaps',
      'Execute Quality Engineering batch disposition (Approve / Quarantine / Scrap)'
    ],
    Approver: [
      'All Engineer capabilities',
      'Authorize final batch release certificates',
      'Sign off on plant regulatory compliance audit logs'
    ],
    Admin: [
      'Full administrative access across plant locations',
      'User role management & system configuration'
    ]
  };

  const userPermissions = rolePermissions[user?.role || 'Inspector'] || rolePermissions.Inspector;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <User className="w-7 h-7 text-blue-500" />
          Staff User Profile & Plant Permissions
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Authenticated credentials and operational authorization levels
        </p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-xl space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-2xl">
            {user?.name?.charAt(0) || 'U'}
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> {user?.email}</span>
              <span className="flex items-center gap-1"><Factory className="w-3.5 h-3.5 text-slate-500" /> {user?.plant_location}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Assigned Staff Role</span>
            <div className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              {user?.role}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Plant Facility</span>
            <div className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Factory className="w-4 h-4 text-slate-400" />
              {user?.plant_location}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" /> Role Capabilities & System Authorizations
          </h3>

          <div className="space-y-2">
            {userPermissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
