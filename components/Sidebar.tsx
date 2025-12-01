import React from 'react';
import { View, NavItem, Server, Theme } from '../types';
import { LayoutDashboard, MessageSquarePlus, ShieldAlert, Bot, LogOut, CalendarPlus, Sticker, ExternalLink, Moon, Sun, Sword } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  selectedServer: Server;
  currentTheme: Theme;
  toggleTheme: () => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'welcome', label: 'Welcome Messages', icon: MessageSquarePlus },
  { id: 'events', label: 'Event Creator', icon: CalendarPlus },
  { id: 'emoji-triggers', label: 'Emoji Triggers', icon: Sticker },
  { id: 'moderation', label: 'Moderation', icon: ShieldAlert },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, selectedServer, currentTheme, toggleTheme }) => {
  return (
    <div className="w-60 h-screen bg-theme-sidebar flex flex-col border-r border-theme-border shrink-0 transition-colors duration-300">
      {/* Selected Server Header */}
      <div className="p-4 border-b border-theme-border shadow-sm">
         <h2 className="font-bold text-gray-100 text-md truncate">{selectedServer.name}</h2>
         <p className="text-xs text-green-400 font-medium flex items-center mt-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1.5 animate-pulse"></span>
            Bot Active
         </p>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-theme-primary/10 text-theme-primary border border-theme-primary/20'
                  : 'text-gray-400 hover:bg-theme-hover hover:text-gray-200 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-theme-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {item.label}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-theme-border px-1">
           <a 
             href="https://conqsite.bard-dev.com/home" 
             target="_blank" 
             rel="noopener noreferrer"
             className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-theme-secondary hover:bg-theme-secondary/10 hover:text-white transition-all group border border-dashed border-theme-border hover:border-theme-secondary/30"
           >
             <ExternalLink className="w-5 h-5 mr-3" />
             ConqSite Manager
           </a>
        </div>
      </nav>

      {/* User Footer & Theme Toggle */}
      <div className="p-3 bg-[#0d0f14] border-t border-theme-border bg-opacity-30">
        
        {/* Theme Toggle */}
        <div className="mb-3 px-1">
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-theme-bg border border-theme-border hover:border-theme-primary/40 text-xs text-gray-400 transition-all"
            >
                <span className="flex items-center">
                    {currentTheme === 'midnight' ? <Moon className="w-4 h-4 mr-2 text-indigo-400" /> : <Sword className="w-4 h-4 mr-2 text-yellow-500" />}
                    {currentTheme === 'midnight' ? 'Midnight Mode' : 'Warlord Mode'}
                </span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${currentTheme === 'gold' ? 'bg-theme-primary' : 'bg-gray-700'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${currentTheme === 'gold' ? 'left-4.5' : 'left-0.5'}`} style={{ left: currentTheme === 'gold' ? '18px' : '2px' }} />
                </div>
            </button>
        </div>

        <div className="flex items-center p-2 rounded-lg hover:bg-theme-hover cursor-pointer group transition-colors">
           <div className="w-8 h-8 bg-gray-700 rounded-full mr-2 relative">
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0d0f14] rounded-full"></div>
           </div>
           <div className="flex-1 min-w-0">
             <div className="text-xs font-bold text-white truncate">AdminUser</div>
             <div className="text-[10px] text-gray-500">#1234</div>
           </div>
           <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};