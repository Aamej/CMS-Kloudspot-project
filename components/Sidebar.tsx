import React from 'react';
import { LayoutDashboard, Maximize, Power, Menu } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout }) => {
  return (
    <div className="w-64 bg-primary-darker h-screen flex flex-col text-white fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="flex items-center gap-2 text-xl font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                 <path d="M4.9 16.1C3.1 14.3 2 11.8 2 9c0-2.8 1.1-5.3 2.9-7.1"/>
                 <path d="M9.1 11.9c-1.1-1.1-1.8-2.6-1.8-4.3 0-1.7.7-3.2 1.8-4.3"/>
                 <circle cx="12" cy="9" r="2"/>
                 <path d="M12 2v20"/>
                 <path d="M20 22v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>
            </svg>
            <span>kloudspot</span>
        </div>
        <button className="ml-auto text-white/70 hover:text-white">
          <Menu size={20} />
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-6 space-y-2">
        
        {/* Overview Link */}
        <button
          onClick={() => onChangeView(ViewState.OVERVIEW)}
          className={`w-full flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${
            currentView === ViewState.OVERVIEW
              ? 'bg-white/10 border-white text-white'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Overview</span>
        </button>

        {/* Crowd Entries Link */}
        <button
          onClick={() => onChangeView(ViewState.ENTRIES)}
          className={`w-full flex items-center gap-3 px-6 py-3 transition-colors border-l-4 ${
            currentView === ViewState.ENTRIES
              ? 'bg-white/10 border-white text-white'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Maximize size={20} /> {/* Icon matching design (box with arrow) */}
          <span className="font-medium">Crowd Entries</span>
        </button>
      </div>

      {/* Logout Button (Sticky at bottom) */}
      <div className="p-6">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 text-white/60 hover:text-white transition-colors"
        >
          <Power size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;