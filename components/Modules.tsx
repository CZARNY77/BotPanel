import React, { useState } from 'react';
import { Shield, EyeOff, Link, FileWarning, Mic2 } from 'lucide-react';

export const ModerationSettings: React.FC = () => {
  const [toggles, setToggles] = useState([
    { id: 'bad-words', label: 'Profanity Filter', desc: 'Automatically deletes messages containing swear words.', active: true, icon: FileWarning },
    { id: 'links', label: 'Anti-Link', desc: 'Deletes links sent by new users (account age < 24h).', active: false, icon: Link },
    { id: 'caps', label: 'Anti-Caps', desc: 'Blocks messages containing more than 70% uppercase letters.', active: true, icon: EyeOff },
    { id: 'raid', label: 'Anti-Raid', desc: 'Enables slowmode automatically when spam is detected.', active: false, icon: Shield },
    { id: 'warthog', label: 'Warthog Mode', desc: 'Command that cycles users through all voice channels (Troll/Fun).', active: false, icon: Mic2 },
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-theme-bg scrollbar-hide">
      <h2 className="text-2xl font-bold text-white mb-6">Auto-Moderation</h2>
      
      <div className="space-y-4 max-w-3xl">
        {toggles.map((item) => {
            const Icon = item.icon;
            return (
                <div key={item.id} className="flex items-center justify-between p-5 bg-theme-card rounded-xl border border-theme-border shadow-sm hover:border-gray-600 transition-colors">
                    <div className="flex items-start space-x-4">
                        <div className="p-3 bg-theme-bg rounded-full text-gray-400 border border-theme-border">
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{item.label}</h3>
                            <p className="text-sm text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setToggles(prev => prev.map(t => t.id === item.id ? {...t, active: !t.active} : t))}
                        className={`w-14 h-7 rounded-full relative transition-colors ${item.active ? 'bg-green-500' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${item.active ? 'left-8' : 'left-1'}`} />
                    </button>
                </div>
            );
        })}
      </div>
    </div>
  );
};