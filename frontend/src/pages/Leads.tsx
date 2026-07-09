import React from 'react';
import { Plus, Filter, ArrowUpRight } from 'lucide-react';

export const Leads: React.FC = () => {
  const dummyLeads = [
    { name: 'Alice Smith', email: 'alice@example.com', company: 'Smith & Co Consulting', status: 'Qualified', score: 85 },
    { name: 'Bob Johnson', email: 'bob@example.com', company: 'Johnson Logistics', status: 'Contacted', score: 50 },
    { name: 'Charlie Brown', email: 'charlie@example.com', company: 'Brown Dental Clinic', status: 'New', score: 10 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">CRM Leads</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and track your business sales pipeline leads.</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center gap-2 cursor-pointer shadow-md">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filter Options */}
      <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-zinc-800">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>
        <span className="text-xs text-zinc-500 font-medium">3 leads found</span>
      </div>

      {/* Leads Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/40">
              <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Lead</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Company</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Score</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {dummyLeads.map((lead) => (
              <tr key={lead.email} className="hover:bg-zinc-900/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{lead.name}</div>
                  <div className="text-xs text-zinc-400">{lead.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-300">{lead.company}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    lead.status === 'Qualified'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : lead.status === 'Contacted'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{lead.score}</span>
                    <div className="w-16 bg-zinc-800 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          lead.score >= 70 ? 'bg-emerald-500' : lead.score >= 40 ? 'bg-blue-500' : 'bg-zinc-600'
                        }`} 
                        style={{ width: `${lead.score}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-purple-400 hover:text-purple-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer">
                    View Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
