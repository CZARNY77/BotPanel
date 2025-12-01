import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WelcomeEditor } from './components/WelcomeEditor';
import { ModerationSettings } from './components/Modules';
import { EventsEditor } from './components/EventsEditor';
import { EmojiManager } from './components/EmojiManager';
import { AiAssistant } from './components/AiAssistant';
import { View, Server, Theme } from './types';
import { Plus } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [theme, setTheme] = useState<Theme>('midnight');
  
  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'midnight' ? 'gold' : 'midnight');
  };
  
  // Mock Data for Servers
  const [servers, setServers] = useState<Server[]>([
    { id: '1', name: 'Dev Haven', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=DH&backgroundColor=3b82f6', active: true },
    { id: '2', name: 'Gaming Lounge', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=GL&backgroundColor=23a559', active: false },
    { id: '3', name: 'Study Group', icon: 'https://api.dicebear.com/7.x/initials/svg?seed=SG&backgroundColor=da373c', active: false },
  ]);

  const selectedServer = servers.find(s => s.active) || servers[0];

  const handleServerSwitch = (id: string) => {
    setServers(servers.map(s => ({ ...s, active: s.id === id })));
    setCurrentView('dashboard'); // Reset view on switch
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard server={selectedServer} />;
      case 'welcome':
        return <WelcomeEditor />;
      case 'moderation':
        return <ModerationSettings />;
      case 'events':
        return <EventsEditor />;
      case 'emoji-triggers':
        return <EmojiManager />;
      case 'ai-assistant':
        return <AiAssistant />;
      default:
        return <Dashboard server={selectedServer} />;
      }
  };

  return (
    <div className="flex h-screen bg-theme-bg text-gray-100 font-sans overflow-hidden transition-colors duration-300">
      {/* Server Rail (Far Left) */}
      <div className="w-[72px] bg-[#050608] flex flex-col items-center py-3 space-y-2 overflow-y-auto scrollbar-hide border-r border-theme-border shrink-0 z-20">
         {/* Home / Discord Icon Mock */}
         <div className="w-12 h-12 bg-theme-card rounded-[24px] hover:rounded-[16px] transition-all duration-200 flex items-center justify-center cursor-pointer mb-2 text-theme-primary hover:bg-theme-primary hover:text-white border border-theme-border hover:border-transparent">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09.01-.02-.04-.07-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.2 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.66-.25-1.3-.56-1.91-.91-.03-.02-.04-.07-.01-.1.13-.1.27-.2.4-.31.01-.01.04-.01.05 0 3.86 1.78 8.05 1.78 11.91 0 .01-.01.04-.01.05 0 .13.1.27.2.4.3.03.04.01.09-.01.11-.6.35-1.24.66-1.9.91.04.01.02.06.04.09.32.61.68 1.19 1.07 1.74.01.02.04.03.07.02 1.67-.53 3.4-1.33 5.2-2.65.02-.01.03-.03.03-.05.44-4.52-.6-8.5-3.1-11.95-.01-.01-.02-.02-.03-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.85 2.12-1.89 2.12z"/></svg>
         </div>
         
         <div className="w-8 h-[2px] bg-theme-border rounded-lg"></div>

         {/* Server List */}
         {servers.map(s => (
            <div key={s.id} className="relative group w-full flex justify-center">
                {s.active && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 bg-white rounded-r-lg"></div>}
                {!s.active && <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-2 bg-white rounded-r-lg opacity-0 group-hover:opacity-100 group-hover:h-5 transition-all duration-200"></div>}
                
                <button 
                    onClick={() => handleServerSwitch(s.id)}
                    className={`w-12 h-12 rounded-[24px] group-hover:rounded-[16px] transition-all duration-200 overflow-hidden ${s.active ? 'rounded-[16px]' : ''}`}
                >
                    <img src={s.icon} alt={s.name} className="w-full h-full object-cover" />
                </button>

                {/* Tooltip */}
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-black text-white text-xs font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-100 scale-95 group-hover:scale-100 origin-left border border-gray-800">
                    {s.name}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-black border-l border-b border-gray-800 transform rotate-45"></div>
                </div>
            </div>
         ))}

         {/* Add Server Button */}
         <div className="group w-full flex justify-center mt-2">
            <button className="w-12 h-12 bg-theme-card rounded-[24px] group-hover:rounded-[16px] group-hover:bg-green-600 transition-all duration-200 flex items-center justify-center text-green-500 group-hover:text-white border border-theme-border group-hover:border-transparent">
                <Plus className="w-6 h-6" />
            </button>
         </div>
      </div>

      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        selectedServer={selectedServer}
        currentTheme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 relative bg-theme-bg min-w-0 transition-colors duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;