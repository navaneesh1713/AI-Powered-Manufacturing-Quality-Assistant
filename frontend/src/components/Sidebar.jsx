import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Box, 
  User, 
  Sparkles,
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { label: 'Quality Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'New Inspection', icon: PlusCircle, path: '/inspections/new' },
    { label: 'Batch History & Audit', icon: History, path: '/history' },
    { label: 'Product Specifications', icon: Box, path: '/products' },
    { label: 'User Profile & Permissions', icon: User, path: '/profile' },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between py-6 px-4 shrink-0">
      <div className="space-y-6">
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Manufacturing Ops
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/20 text-xs">
        <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
          <Sparkles className="w-4 h-4" />
          Gemini Intelligence
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Generative AI detects 5-Why root causes, evidence gaps, and automates CAPA tracking.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
