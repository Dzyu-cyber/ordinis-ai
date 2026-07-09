import React from 'react';
import { Play, Settings } from 'lucide-react';

export const Workflows: React.FC = () => {
  const dummyWorkflows = [
    { name: 'Lead Ingestion Hook', desc: 'Triggers when a new website form is submitted. Routes to qualification.', status: 'Active', trigger: 'HTTP POST Webhook' },
    { name: 'Invoice Processing Flow', desc: 'Triggers when an invoice PDF is uploaded. Dispatches OCR extraction data.', status: 'Active', trigger: 'Document Event' },
    { name: 'Meeting Booking Alert', desc: 'Triggers when a Google Calendar invite is created. Notifies the CRM lead.', status: 'Inactive', trigger: 'Calendar Webhook' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">n8n Workflows</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage external n8n automation webhook configurations and event rules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyWorkflows.map((flow) => (
          <div key={flow.name} className="glass-panel p-6 rounded-xl flex flex-col justify-between min-h-[180px] space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{flow.name}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  flow.status === 'Active'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}>
                  {flow.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{flow.desc}</p>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
              <span className="text-[10px] text-zinc-500 font-semibold">{flow.trigger}</span>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer">
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
