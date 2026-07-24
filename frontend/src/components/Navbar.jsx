import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Cpu, User, LogOut, Bell, Factory } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide flex items-center gap-2">
            AI-POWERED QUALITY ASSISTANT
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
              LIVE GEMINI V1
            </span>
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Factory className="w-3 h-3 text-slate-500" />
            {user?.plant_location || 'Plant Alpha - Detroit'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
            <div className="text-[11px] text-blue-400 font-mono">{user?.role}</div>
          </div>
          
          <button 
            onClick={() => navigate('/profile')}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 text-slate-300 transition"
            title="User Profile"
          >
            <User className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-full border border-rose-500/30 text-rose-400 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
