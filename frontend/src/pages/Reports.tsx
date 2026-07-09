import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Reports & Analytics</h1>
        <p className="text-zinc-400 text-sm mt-1">AI-generated business intelligence summaries and operation metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Summary */}
        <div className="md:col-span-2 glass-panel p-6 rounded-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-white text-sm">AI Daily Executive Summary</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">Updated 5 minutes ago</span>
          </div>

          <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
            <p>
              **Overview:** Acme Business Solutions operations ran smoothly today. We ingested **3 new leads**, of which **1 (Alice Smith)** was qualified with a high interest score of **85/100** based on clear budget and immediate timeline details.
            </p>
            <p>
              **Communications:** The unified inbox received **1 new WhatsApp message** requesting document processing prices. An AI draft reply has been auto-generated and is pending admin approval.
            </p>
            <p>
              **Next Action Recommendations:**
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
              <li>Approve the email demo booking offer for Alice Smith.</li>
              <li>Review the pending WhatsApp response for Bob Johnson.</li>
            </ul>
          </div>
        </div>

        {/* Operational Performance */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white text-sm">Performance Metrics</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Lead Conversion Rate</span>
              <span className="text-sm font-bold text-white">33%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">AI Qualification Accuracy</span>
              <span className="text-sm font-bold text-white">98.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Avg. AI Response Time</span>
              <span className="text-sm font-bold text-white">1.8s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
