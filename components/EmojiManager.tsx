import React, { useState } from 'react';
import { EmojiTrigger } from '../types';
import { Trash2, PlusCircle, AlertCircle, Sticker, Image as ImageIcon } from 'lucide-react';

export const EmojiManager: React.FC = () => {
  const [triggers, setTriggers] = useState<EmojiTrigger[]>([
    { id: '1', emoji: '🍕', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&fit=crop' },
    { id: '2', emoji: '🚀', imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=200&fit=crop' }
  ]);
  
  const [newEmoji, setNewEmoji] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    if (triggers.length >= 10) {
        setError('Maximum 10 emoji triggers allowed.');
        return;
    }
    if (!newEmoji || !newUrl) {
        setError('Please provide both an emoji and an image URL.');
        return;
    }

    // Basic URL validation
    try {
        new URL(newUrl);
    } catch (_) {
        setError('Invalid Image URL.');
        return;
    }

    const newTrigger: EmojiTrigger = {
        id: Date.now().toString(),
        emoji: newEmoji,
        imageUrl: newUrl
    };

    setTriggers([...triggers, newTrigger]);
    setNewEmoji('');
    setNewUrl('');
  };

  const handleDelete = (id: string) => {
    setTriggers(triggers.filter(t => t.id !== id));
    if (triggers.length <= 10) setError('');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-theme-bg scrollbar-hide">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Emoji Image Triggers</h2>
        <p className="text-gray-400 text-sm mt-1">
            When a user posts a specific emoji, the bot will reply with an image. 
            <span className="text-theme-primary ml-2">(Max 10)</span>
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* List of Triggers */}
        <div className="space-y-4">
            {triggers.map((trigger) => (
                <div key={trigger.id} className="bg-theme-card p-4 rounded-xl border border-theme-border flex items-center justify-between group hover:border-theme-primary/30 transition-colors">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-theme-bg rounded-lg border border-theme-border flex items-center justify-center text-2xl shadow-inner">
                            {trigger.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                             <div className="text-xs text-gray-500 uppercase font-bold mb-1">Response Image</div>
                             <div className="flex items-center space-x-2">
                                <img src={trigger.imageUrl} alt="Preview" className="w-8 h-8 rounded object-cover bg-gray-700" />
                                <span className="text-sm text-gray-300 truncate max-w-[150px]">{trigger.imageUrl}</span>
                             </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleDelete(trigger.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ))}
            
            {triggers.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-theme-border rounded-xl">
                    <Sticker className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No triggers configured yet.</p>
                </div>
            )}
        </div>

        {/* Add New Form */}
        <div className="bg-theme-card p-6 rounded-xl border border-theme-border h-fit sticky top-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-theme-primary" />
                Add New Trigger
            </h3>
            
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emoji</label>
                    <input 
                        type="text" 
                        value={newEmoji}
                        onChange={(e) => setNewEmoji(e.target.value)}
                        placeholder="e.g. 🍪"
                        className="w-full bg-theme-bg text-white p-3 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-xl"
                    />
                </div>
                
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Image URL</label>
                    <input 
                        type="text" 
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        placeholder="https://imgur.com/..."
                        className="w-full bg-theme-bg text-white p-3 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-sm font-mono"
                    />
                     <p className="text-[10px] text-gray-500">Small images load faster (recommended under 2MB).</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button 
                    onClick={handleAdd}
                    disabled={triggers.length >= 10}
                    className="w-full py-3 bg-theme-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-md"
                >
                    Add Trigger
                </button>
                <div className="text-center text-xs text-gray-500">
                    {triggers.length} / 10 slots used
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};