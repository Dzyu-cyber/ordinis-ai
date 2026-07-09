import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Users, MessageSquare, FileText } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Leads', value: '3', change: '+3 this week', icon: Users, color: 'text-purple-400' },
    { name: 'Unread Messages', value: '1', change: '1 pending reply', icon: MessageSquare, color: 'text-blue-400' },
    { name: 'Documents Processed', value: '0', change: '0 total parsed', icon: FileText, color: 'text-emerald-400' },
  ];

  const modules = [
    { id: 1, name: 'Foundation (Module 1)', status: 'In Progress', progress: '90%', desc: 'Database connections, session authentication, layout shells, and basic navigation.' },
    { id: 2, name: 'AI Lead Engine (Module 2)', status: 'Not Started', progress: '0%', desc: 'Automatic qualification, lead scoring, and appointment scheduling workflows.' },
    { id: 3, name: 'AI Communication (Module 3)', status: 'Not Started', progress: '0%', desc: 'Email/WhatsApp inbox integration, message intent recognition, and draft replies.' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            System Status: Active
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">
            {user?.businessName} Operating System
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl">
            Welcome to your AI Operations workspace. Here you can capture, qualify, and interact with business leads in a unified dashboard.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="glass-panel p-6 rounded-2xl glass-card-hover flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">{stat.name}</span>
                <span className="text-3xl font-bold text-white block">{stat.value}</span>
                <span className="text-xs text-zinc-400 block">{stat.change}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Roadmap Status */}
      <div className="glass-panel p-8 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white m-0">Ordinis AI Roadmap</h2>
          <p className="text-sm text-zinc-400 mt-1">Status details of the core platform modules being built.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <div key={mod.id} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{mod.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    mod.status === 'In Progress' 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}>
                    {mod.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{mod.desc}</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span>Implementation Progress</span>
                  <span>{mod.progress}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: mod.progress }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
