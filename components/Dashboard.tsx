import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserPlus, MessageCircle, Hash } from 'lucide-react';
import { StatCardProps, Server } from '../types';

const data = [
  { name: '00:00', online: 120 },
  { name: '04:00', online: 80 },
  { name: '08:00', online: 250 },
  { name: '12:00', online: 450 },
  { name: '16:00', online: 580 },
  { name: '20:00', online: 600 },
  { name: '23:59', online: 340 },
];

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-theme-card p-5 rounded-xl border border-theme-border shadow-sm hover:border-theme-primary/50 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wide">{title}</h3>
      <Icon className="w-5 h-5 text-gray-500" />
    </div>
    <div className="flex items-end space-x-2">
       <span className="text-2xl font-bold text-white">{value}</span>
       {trend && (
         <span className={`text-xs mb-1 font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
           {trendUp ? '+' : ''}{trend}
         </span>
       )}
    </div>
  </div>
);

interface DashboardProps {
    server: Server;
}

export const Dashboard: React.FC<DashboardProps> = ({ server }) => {
  return (
    <div className="p-8 h-full overflow-y-auto bg-theme-bg scrollbar-hide">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Server Overview</h2>
        <p className="text-gray-400 text-sm mt-1">Statistics for: <span className="text-theme-primary font-medium">{server.name}</span></p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Members" value="3,402" icon={Users} trend="12" trendUp={true} />
        <StatCard title="New (24h)" value="45" icon={UserPlus} trend="8%" trendUp={true} />
        <StatCard title="Messages (24h)" value="8,920" icon={MessageCircle} trend="5%" trendUp={false} />
        <StatCard title="Channels" value="24" icon={Hash} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-theme-card p-6 rounded-xl border border-theme-border">
          <h3 className="text-base font-bold text-white mb-6">Online Activity (Today)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#272a38" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1b1e29', border: '1px solid #272a38', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="online" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOnline)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-theme-card p-6 rounded-xl border border-theme-border">
          <h3 className="text-base font-bold text-white mb-4">Recent Joins</h3>
          <div className="space-y-4">
            {[
              { u: 'Christopher', t: '2 min ago', av: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Christopher' },
              { u: 'Anna_Dev', t: '15 min ago', av: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna' },
              { u: 'Tom123', t: '1 hr ago', av: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom' },
              { u: 'PixelArt', t: '3 hrs ago', av: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pixel' },
            ].map((user, i) => (
              <div key={i} className="flex items-center p-2 hover:bg-theme-hover rounded-lg transition-colors border border-transparent hover:border-theme-border">
                <img src={user.av} alt="Avatar" className="w-8 h-8 rounded-full bg-gray-700 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.u}</p>
                  <p className="text-xs text-gray-400">Joined {user.t}</p>
                </div>
                <button className="text-xs bg-theme-primary/10 hover:bg-theme-primary hover:text-white text-theme-primary border border-theme-primary/20 px-2 py-1 rounded transition-colors">
                  Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};