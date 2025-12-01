import React, { useState } from 'react';
import { WelcomeConfig } from '../types';
import { Save, RefreshCw, Hash, Eye, Layout, Type, Image as ImageIcon } from 'lucide-react';
import { generateBotAdvice } from '../services/geminiService';

export const WelcomeEditor: React.FC = () => {
  const [config, setConfig] = useState<WelcomeConfig>({
    enabled: true,
    messageType: 'embed',
    channelId: '1029384756',
    title: 'Welcome to the server!',
    description: 'Hey {user}, great to see you on **{server}**! \nDo not forget to read rules at <#rules>.',
    color: '#3b82f6',
    footer: 'Have fun!',
    showUserAvatar: true,
    imageUrl: 'https://imgur.com/K07347D.png' 
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const prompt = `Write a short, funny, and welcoming message for a Discord programming server named "Dev Haven". 
    Format: Return ONLY valid JSON: {"title": "...", "description": "...", "footer": "..."}. Use placeholders {user} and {server}. Language: English.`;
    
    try {
      const response = await generateBotAdvice(prompt);
      // Clean markdown if present
      const jsonStr = response.replace(/```json|```/g, '').trim();
      const aiData = JSON.parse(jsonStr);
      
      setConfig(prev => ({
        ...prev,
        title: aiData.title || prev.title,
        description: aiData.description || prev.description,
        footer: aiData.footer || prev.footer
      }));
    } catch (e) {
      console.error("Failed to parse AI response", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    // Simulate API call
    const btn = document.getElementById('save-btn');
    if (btn) {
        btn.innerText = 'Saved!';
        setTimeout(() => btn.innerText = 'Save Changes', 2000);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Settings Form Column (Themed) */}
      <div className="flex-1 p-8 overflow-y-auto border-r border-theme-border bg-theme-bg scrollbar-hide">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome Messages</h2>
            <p className="text-gray-400 text-sm mt-1">Configure the message sent when a new user joins.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${config.enabled ? 'text-green-400' : 'text-gray-500'}`}>
                {config.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <button 
                onClick={() => setConfig(c => ({...c, enabled: !c.enabled}))}
                className={`w-12 h-6 rounded-full transition-colors relative ${config.enabled ? 'bg-green-500' : 'bg-gray-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${config.enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <div className={`space-y-6 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Channel Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Welcome Channel</label>
                <div className="relative">
                    <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <select 
                        className="w-full bg-theme-card text-gray-200 p-2.5 pl-10 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none appearance-none cursor-pointer hover:border-gray-600 transition-colors"
                        value={config.channelId}
                        onChange={(e) => setConfig({...config, channelId: e.target.value})}
                    >
                        <option value="1029384756"># general</option>
                        <option value="9928374"># welcome</option>
                        <option value="11223344"># off-topic</option>
                    </select>
                </div>
            </div>

            {/* Message Type Toggle */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message Type</label>
                <div className="flex space-x-2 bg-theme-card p-1 rounded-lg border border-theme-border">
                    <button
                        onClick={() => setConfig({...config, messageType: 'embed'})}
                        className={`flex-1 flex items-center justify-center py-2 text-sm rounded-md transition-all ${
                            config.messageType === 'embed' ? 'bg-theme-primary text-white shadow' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Layout className="w-4 h-4 mr-2" />
                        Embed
                    </button>
                    <button
                        onClick={() => setConfig({...config, messageType: 'text'})}
                        className={`flex-1 flex items-center justify-center py-2 text-sm rounded-md transition-all ${
                            config.messageType === 'text' ? 'bg-theme-primary text-white shadow' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <Type className="w-4 h-4 mr-2" />
                        Plain Text
                    </button>
                </div>
            </div>

            {/* AI Generator */}
            <div className="bg-gradient-to-r from-theme-primary/10 to-theme-secondary/10 border border-theme-primary/20 p-4 rounded-xl flex justify-between items-center">
                <div>
                    <h4 className="text-sm font-bold text-theme-primary flex items-center">
                        <RefreshCw className="w-3 h-3 mr-2" />
                        No Ideas?
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Use AI to generate creative content.</p>
                </div>
                <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-theme-primary hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {isGenerating ? 'Generating...' : 'Magic Generate'}
                </button>
            </div>

            {config.messageType === 'embed' && (
                <>
                    {/* Embed Title */}
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Embed Title</label>
                        <input 
                            type="text" 
                            value={config.title}
                            onChange={(e) => setConfig({...config, title: e.target.value})}
                            className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none placeholder-gray-600"
                            placeholder="Welcome!"
                        />
                    </div>
                </>
            )}

            {/* Description / Content */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {config.messageType === 'embed' ? 'Embed Description' : 'Message Content'}
                    </label>
                    <span className="text-[10px] text-gray-500 cursor-help" title="Available: {user}, {server}, {count}">? Variables</span>
                </div>
                <textarea 
                    value={config.description}
                    onChange={(e) => setConfig({...config, description: e.target.value})}
                    className="w-full h-32 bg-theme-card text-white p-3 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none resize-none font-mono text-sm"
                    placeholder="Message content..."
                />
            </div>

            {config.messageType === 'embed' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strip Color</label>
                        <div className="flex space-x-2">
                            <input 
                                type="color" 
                                value={config.color}
                                onChange={(e) => setConfig({...config, color: e.target.value})}
                                className="w-10 h-10 p-1 bg-theme-card border border-theme-border rounded cursor-pointer"
                            />
                            <input 
                                type="text" 
                                value={config.color}
                                onChange={(e) => setConfig({...config, color: e.target.value})}
                                className="flex-1 bg-theme-card text-white p-2 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none uppercase"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Footer</label>
                        <input 
                            type="text" 
                            value={config.footer}
                            onChange={(e) => setConfig({...config, footer: e.target.value})}
                            className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Extra Options */}
            <div className="space-y-3">
                 {config.messageType === 'embed' && (
                    <div className="flex items-center justify-between p-3 bg-theme-card rounded-lg border border-theme-border animate-fade-in">
                        <div className="flex items-center">
                            <ImageIcon className="w-5 h-5 text-gray-400 mr-3" />
                            <span className="text-sm font-medium text-gray-200">Show User Avatar (Thumbnail)</span>
                        </div>
                        <button 
                            onClick={() => setConfig(c => ({...c, showUserAvatar: !c.showUserAvatar}))}
                            className={`w-10 h-5 rounded-full relative transition-colors ${config.showUserAvatar ? 'bg-green-500' : 'bg-gray-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.showUserAvatar ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                 )}
            </div>
            
            <div className="pt-4">
                <button 
                    id="save-btn"
                    onClick={handleSave}
                    className="flex items-center justify-center w-full py-3 bg-theme-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </button>
            </div>
        </div>
      </div>

      {/* Preview Column (DISCORD COLORS KEPT INTENTIONALLY) */}
      <div className="w-[400px] bg-[#313338] p-8 hidden xl:flex flex-col border-l border-theme-border">
        <div className="flex items-center text-gray-400 mb-6">
            <Eye className="w-5 h-5 mr-2" />
            <span className="font-bold uppercase text-xs tracking-wider">Discord Preview</span>
        </div>

        {/* Discord Message Mockup */}
        <div className="flex items-start space-x-4 animate-fade-in">
            {/* Bot Avatar */}
            <div className="w-10 h-10 rounded-full bg-discord-blurple flex items-center justify-center text-white font-bold shrink-0 mt-1">
                B
            </div>
            
            <div className="flex-1 min-w-0">
                {/* Message Header */}
                <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-white hover:underline cursor-pointer">Bot Helper</span>
                    <span className="px-1.5 py-0.5 rounded bg-discord-blurple text-[10px] text-white font-medium uppercase">BOT</span>
                    <span className="text-xs text-gray-400">Today at 14:30</span>
                </div>

                {/* Content */}
                {config.messageType === 'embed' ? (
                     <div className="mt-2 bg-[#2b2d31] border-l-4 rounded-r px-4 py-3 max-w-sm" style={{ borderLeftColor: config.color }}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1 mr-4">
                                <h4 className="font-bold text-white mb-2">{config.title || 'Embed Title'}</h4>
                                <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                                    {config.description
                                        .replace('{user}', '@User')
                                        .replace('{server}', 'Dev Haven')
                                        .replace('{count}', '105')
                                    || 'Description...'}
                                </p>
                            </div>
                            {config.showUserAvatar && (
                                <img 
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                                    alt="User" 
                                    className="w-16 h-16 rounded-full bg-gray-700 object-cover"
                                />
                            )}
                        </div>
                        {config.imageUrl && (
                             <div className="mt-2"></div> /* Placeholder for main image if needed */
                        )}
                        {config.footer && (
                            <div className="mt-3 text-xs text-gray-500 flex items-center pt-2 border-t border-gray-800">
                                 {config.footer}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="mt-1 text-gray-100 whitespace-pre-wrap">
                        {config.description
                                .replace('{user}', '@User')
                                .replace('{server}', 'Dev Haven')
                                .replace('{count}', '105')
                        }
                    </p>
                )}
            </div>
        </div>
        
        <div className="mt-auto p-4 bg-[#2b2d31] border border-gray-800 rounded text-xs text-gray-400">
            <strong>Note:</strong> This preview attempts to mimic Discord's dark mode. Actual appearance may vary slightly based on user themes.
        </div>
      </div>
    </div>
  );
};