import React, { useState, useEffect } from 'react';
import { EventConfig } from '../types';
import { BotAPI } from '../services/api';
import { Hash, Plus, Trash2, Calendar, Clock, RefreshCw } from 'lucide-react';

export const EventsEditor: React.FC = () => {
  const [event, setEvent] = useState<EventConfig>({
    date: '',
    time: '',
    intervalType: 'never',
    channelId: '',
    title: '',
    description: '',
    durationHours: 1,
    mentionRole: 'Test Member',
  });

  const [activeEvents, setActiveEvents] = useState<EventConfig[]>([
    { id: '101', date: '2023-11-20', time: '19:00', intervalType: 'never', channelId: '2', title: 'Molten Core Raid', description: 'Main raid night. Bring potions.', durationHours: 3, mentionRole: 'Raider' },
    { id: '102', date: '2023-11-22', time: '20:00', intervalType: 'custom', intervalDays: 7, channelId: '1', title: 'Weekly Meeting', description: 'Staff meeting.', durationHours: 1, mentionRole: 'Test Member' },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!event.title || !event.date || !event.time) return; 
    setIsLoading(true);
    const newEventPayload = { ...event };
    const response = await BotAPI.createEvent(newEventPayload);
    const newEventWithId = { ...event, id: Date.now().toString() };
    setActiveEvents(prev => [newEventWithId, ...prev]);
    setEvent({
        date: '',
        time: '',
        intervalType: 'never',
        channelId: '',
        title: '',
        description: '',
        durationHours: 1,
        mentionRole: 'Test Member',
    });
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
      await BotAPI.deleteEvent(id);
      setActiveEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="flex h-full bg-theme-bg overflow-hidden">
      {/* LEFT COLUMN: Event Creator Form */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col border-r border-theme-border bg-theme-bg h-full overflow-y-auto scrollbar-hide p-6">
        <header className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-theme-primary" />
                Create Event
            </h2>
            <p className="text-sm text-gray-400 mt-1">Configure event details and post to Discord.</p>
        </header>

        <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                <input 
                    type="text" 
                    value={event.title}
                    onChange={(e) => setEvent({...event, title: e.target.value})}
                    placeholder="Raid Night, Meeting, etc."
                    className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-sm placeholder-gray-600"
                />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <textarea 
                    value={event.description}
                    onChange={(e) => setEvent({...event, description: e.target.value})}
                    placeholder="Event details..."
                    rows={3}
                    className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-sm placeholder-gray-600 resize-none"
                />
            </div>

            {/* Date & Hour Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</label>
                    <input 
                        type="date" 
                        className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-sm"
                        value={event.date}
                        onChange={e => setEvent({...event, date: e.target.value})}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time</label>
                    <input 
                        type="time" 
                        className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-sm"
                        value={event.time}
                        onChange={e => setEvent({...event, time: e.target.value})}
                    />
                </div>
            </div>

            {/* Interval */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recurrence</label>
                <div className="flex space-x-2 bg-theme-card p-1 rounded-lg border border-theme-border">
                    <button 
                        onClick={() => setEvent({...event, intervalType: 'never'})}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${event.intervalType === 'never' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        One-time
                    </button>
                    <button 
                         onClick={() => setEvent({...event, intervalType: 'custom'})}
                         className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${event.intervalType === 'custom' ? 'bg-theme-primary text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Repeating
                    </button>
                </div>
                {event.intervalType === 'custom' && (
                     <div className="mt-2 flex items-center space-x-2 animate-fade-in p-2 bg-theme-card rounded-lg border border-theme-border">
                        <span className="text-xs text-gray-300">Every</span>
                        <input 
                            type="number" 
                            min="1"
                            className="w-12 bg-theme-bg text-white p-1 rounded border border-theme-border text-center text-sm focus:outline-none focus:border-theme-primary"
                            value={event.intervalDays || 7}
                            onChange={e => setEvent({...event, intervalDays: parseInt(e.target.value)})}
                        />
                        <span className="text-xs text-gray-300">days</span>
                     </div>
                )}
            </div>

            {/* Channel & Role */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Channel</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-3 w-3 h-3 text-gray-500" />
                        <select 
                            className="w-full bg-theme-card text-gray-200 p-2.5 pl-8 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none appearance-none cursor-pointer text-xs"
                            value={event.channelId}
                            onChange={(e) => setEvent({...event, channelId: e.target.value})}
                        >
                            <option value="" disabled>Select...</option>
                            <option value="1"># announcements</option>
                            <option value="2"># events</option>
                            <option value="3"># raids</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</label>
                    <select 
                        className="w-full bg-theme-card text-gray-200 p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none appearance-none cursor-pointer text-xs"
                        value={event.mentionRole}
                        onChange={(e) => setEvent({...event, mentionRole: e.target.value})}
                    >
                        <option value="Test Member">Test Member</option>
                        <option value="Raider">Raider</option>
                        <option value="Everyone">@everyone</option>
                    </select>
                </div>
            </div>

            {/* Duration */}
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration (Hours)</label>
                <input 
                    type="number" 
                    value={event.durationHours}
                    onChange={(e) => setEvent({...event, durationHours: parseInt(e.target.value)})}
                    className="w-full bg-theme-card text-white p-2.5 rounded-lg border border-theme-border focus:border-theme-primary focus:outline-none text-sm"
                />
            </div>

            <div className="pt-4">
                <button 
                    onClick={handleCreate}
                    disabled={isLoading}
                    className="w-full bg-theme-primary hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex justify-center items-center"
                >
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Create Event'}
                </button>
            </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Events List */}
      <div className="flex-1 bg-theme-bg p-8 overflow-y-auto">
         <header className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Active Events</h2>
            <div className="text-sm text-gray-400 bg-theme-card px-3 py-1 rounded-full border border-theme-border">
                {activeEvents.length} scheduled
            </div>
         </header>

         <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
             {activeEvents.map((evt) => (
                 <div key={evt.id} className="bg-theme-card rounded-xl border border-theme-border p-5 hover:border-theme-primary/50 transition-all group relative">
                    <div className="flex justify-between items-start mb-3">
                        <div className="bg-theme-bg px-2 py-1 rounded-md text-xs text-theme-primary font-bold uppercase tracking-wide border border-theme-border">
                             {evt.channelId === '1' ? '#announcements' : evt.channelId === '2' ? '#events' : '#general'}
                        </div>
                        <button 
                            onClick={() => evt.id && handleDelete(evt.id)}
                            className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors"
                            title="Delete Event"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-white font-bold text-lg mb-1 truncate pr-6">{evt.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">{evt.description}</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-300 border-t border-theme-border pt-3">
                         <div className="flex items-center">
                             <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
                             {evt.date}
                         </div>
                         <div className="flex items-center">
                             <Clock className="w-4 h-4 mr-1.5 text-gray-500" />
                             {evt.time}
                         </div>
                    </div>
                    
                    {evt.intervalType === 'custom' && (
                        <div className="absolute top-5 right-11 flex items-center">
                             <RefreshCw className="w-3 h-3 text-green-400 mr-1" />
                             <span className="text-[10px] text-green-400 font-bold">REPEAT</span>
                        </div>
                    )}
                 </div>
             ))}

             {activeEvents.length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-theme-border rounded-xl text-gray-500">
                     <Calendar className="w-12 h-12 mb-4 opacity-30" />
                     <p>No active events found.</p>
                     <p className="text-sm mt-1">Create one using the form on the left.</p>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};