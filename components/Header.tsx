import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-4">
        <h2 className="font-bold text-gray-800 text-lg">Crowd Solutions</h2>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-700 bg-gray-50">
          <MapPin size={16} className="text-gray-500" />
          <span>Avenue Mall</span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-6">
        
        {/* Language Switcher */}
        <div className="flex items-center border border-gray-200 rounded-full overflow-hidden h-8">
          <button className="bg-primary text-white text-xs font-bold px-3 h-full flex items-center">En</button>
          <button className="bg-white text-gray-600 text-xs font-medium px-3 h-full flex items-center hover:bg-gray-50">ع</button>
        </div>

        {/* Notification */}
        <div className="relative cursor-pointer text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white transform translate-x-1/4 -translate-y-1/4"></span>
        </div>

        {/* Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
            <div 
                className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
            <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80" 
                alt="Profile"
                className="w-full h-full object-cover"
            />
            </div>

            {/* Dropdown Menu */}
            {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Admin User</p>
                        <p className="text-xs text-gray-500 truncate">admin@kloudspot.com</p>
                    </div>
                    <button 
                        onClick={() => { setIsProfileOpen(false); onLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <LogOut size={14} />
                        Sign out
                    </button>
                </div>
            )}
        </div>

      </div>
    </header>
  );
};

export default Header;