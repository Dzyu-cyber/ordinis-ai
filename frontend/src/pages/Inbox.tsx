import React from 'react';
import { Sparkles, Send } from 'lucide-react';

export const Inbox: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Communication Hub</h1>
        <p className="text-zinc-400 text-sm mt-1">Unified email and WhatsApp inbox powered by conversational AI.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Thread List */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 font-bold text-sm text-zinc-300">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800">
            <div className="p-4 bg-purple-500/5 border-l-2 border-purple-500 flex flex-col gap-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">Alice Smith</span>
                <span className="text-[10px] text-zinc-500">1h ago</span>
              </div>
              <span className="text-xs text-purple-400 font-medium">Email Thread</span>
              <p className="text-xs text-zinc-400 truncate mt-1">Hi, I saw your product Ordinis AI and would love to know if...</p>
            </div>
            <div className="p-4 hover:bg-zinc-900/10 flex flex-col gap-1 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300 text-sm">Bob Johnson</span>
                <span className="text-[10px] text-zinc-500">2h ago</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">WhatsApp Thread</span>
              <p className="text-xs text-zinc-400 truncate mt-1">Hi, interested in pricing for processing invoices automatically...</p>
            </div>
          </div>
        </div>

        {/* Chat Feed Window */}
        <div className="md:col-span-2 glass-panel rounded-xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-white text-sm block">Alice Smith</span>
              <span className="text-xs text-zinc-500">alice@example.com</span>
            </div>
            <button className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5" />
              AI Draft Reply
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex justify-start">
              <div className="max-w-[80%] p-3.5 rounded-2xl rounded-tl-none bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 leading-relaxed">
                Hi, I saw your product Ordinis AI and would love to know if it integrates with Supabase database.
              </div>
            </div>
            <div className="flex justify-end">
              <div className="max-w-[80%] p-3.5 rounded-2xl rounded-tr-none bg-purple-600 text-sm text-white leading-relaxed">
                Hello Alice! Yes, Ordinis AI uses Supabase directly for authentication and database services. Would you like to schedule a quick demo?
              </div>
            </div>
          </div>

          {/* Input field */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/10 flex gap-2">
            <input
              type="text"
              placeholder="Type message or generate draft..."
              className="glass-input flex-1 px-4 py-2.5 rounded-lg text-sm"
            />
            <button className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-lg cursor-pointer transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
