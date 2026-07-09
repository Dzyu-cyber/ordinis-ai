import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportingService } from '../services/reportingService';
import type { Analytics } from '../types/reporting';
import {
  TrendingUp,
  Award,
  Sparkles,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  Percent
} from 'lucide-react';

export const Reports: React.FC = () => {
  const queryClient = useQueryClient();

  // 1. Fetch Analytics KPI metrics
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: reportingService.getAnalytics,
  });

  // 2. Fetch Executive AI highlights summary
  const { data: summary = '', isLoading: isSummaryLoading } = useQuery<string>({
    queryKey: ['executiveSummary'],
    queryFn: reportingService.getExecutiveSummary,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    queryClient.invalidateQueries({ queryKey: ['executiveSummary'] });
  };

  const isPageLoading = isAnalyticsLoading || isSummaryLoading;

  return (
    <div className="space-y-6 max-w-6xl mx-auto min-h-[calc(100vh-12rem)] relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Reporting & Analytics</h1>
          <p className="text-zinc-400 text-sm mt-1">AI-compiled executive insights and operations pipeline statistics.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPageLoading}
          className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
        >
          {isPageLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Update Metrics
        </button>
      </div>

      {isPageLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="text-sm text-zinc-500 font-semibold">Generating report models...</span>
        </div>
      ) : !analytics ? (
        <div className="glass-panel py-20 text-center rounded-xl">
          <span className="text-zinc-500 text-sm block font-bold">Failed to load analytics workspace.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Columns: Stats cards + Funnel charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI grid panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Leads KPI */}
              <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Leads</span>
                  <span className="text-2xl font-extrabold text-white block">{analytics.totalLeads}</span>
                  <span className="text-[10px] text-zinc-400 block font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-purple-400" />
                    Pipeline growth tracker
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              {/* Conversion Rate KPI */}
              <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Qualification Rate</span>
                  <span className="text-2xl font-extrabold text-purple-400 block">{analytics.conversionRate}%</span>
                  <span className="text-[10px] text-zinc-400 block font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-400" />
                    {analytics.qualifiedLeads} Qualified of {analytics.totalLeads} total
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Ingested Documents KPI */}
              <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Document OCR Ingests</span>
                  <span className="text-2xl font-extrabold text-white block">{analytics.totalDocuments}</span>
                  <span className="text-[10px] text-emerald-400 block font-semibold">
                    {analytics.completedDocuments} Success / {analytics.failedDocuments} Failed
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </div>

              {/* Communication active threads KPI */}
              <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Active Conversations</span>
                  <span className="text-2xl font-extrabold text-white block">{analytics.activeThreads}</span>
                  <span className="text-[10px] text-zinc-400 block font-semibold">
                    {analytics.emailThreads} Email / {analytics.whatsappThreads} WhatsApp
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Pipeline Ingestion Funnel View */}
            <div className="glass-panel p-6 rounded-xl space-y-6">
              <div>
                <span className="font-bold text-white text-sm block">Conversion Funnel</span>
                <span className="text-zinc-500 text-[10px] block mt-0.5">Visualization of lead qualifications across system moments.</span>
              </div>

              <div className="space-y-3.5">
                {/* Funnel Stage 1: Captured */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-zinc-300">1. Leads Captured (CRM Total)</span>
                    <span className="text-white">{analytics.totalLeads} leads (100%)</span>
                  </div>
                  <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Funnel Stage 2: Engaged */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-zinc-300">2. Thread Conversations (Engaged)</span>
                    <span className="text-white">
                      {analytics.activeThreads} threads ({analytics.totalLeads > 0 ? Math.round((analytics.activeThreads / analytics.totalLeads) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${analytics.totalLeads > 0 ? Math.round((analytics.activeThreads / analytics.totalLeads) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Funnel Stage 3: Evaluated */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-zinc-300">3. Documents Processed (Invoices/Resumes)</span>
                    <span className="text-white">
                      {analytics.totalDocuments} files ({analytics.totalLeads > 0 ? Math.round((analytics.totalDocuments / analytics.totalLeads) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${analytics.totalLeads > 0 ? Math.min(100, Math.round((analytics.totalDocuments / analytics.totalLeads) * 100)) : 0}%` }}
                    />
                  </div>
                </div>

                {/* Funnel Stage 4: Qualified */}
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-zinc-300">4. Leads Qualified (Score &ge; 70)</span>
                    <span className="text-purple-400 font-bold">{analytics.qualifiedLeads} leads ({analytics.conversionRate}%)</span>
                  </div>
                  <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${analytics.conversionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Columns: AI Executive summary reader */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-xl space-y-4 border border-purple-500/20 bg-purple-950/5 relative overflow-hidden shadow-2xl">
              {/* Top ambient glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />

              <div className="flex items-center gap-1.5 text-purple-400 border-b border-zinc-800 pb-3 shrink-0">
                <Sparkles className="w-4 h-4" />
                <span className="font-extrabold text-sm tracking-tight text-white">AI Executive Highlights</span>
              </div>

              {/* MD Content viewport */}
              <div className="text-xs leading-relaxed text-zinc-300 space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {summary ? (
                  <div className="markdown-body space-y-3">
                    {/* Render basic markdown blocks for the simple reports */}
                    {summary.split('\n\n').map((block, bIdx) => {
                      if (block.startsWith('###')) {
                        return <h4 key={bIdx} className="text-sm font-bold text-white mt-4 first:mt-0">{block.replace('###', '').trim()}</h4>;
                      }
                      if (block.startsWith('**')) {
                        return <p key={bIdx} className="font-bold text-white mt-4">{block.replace(/\*\*/g, '').trim()}</p>;
                      }
                      if (block.includes('\n- ') || block.startsWith('- ')) {
                        return (
                          <ul key={bIdx} className="list-disc pl-4 space-y-2 text-zinc-300">
                            {block.split('\n').map((li, liIdx) => {
                              const cleanLi = li.replace(/^-\s+/, '').trim();
                              if (!cleanLi) return null;
                              // Highlight bold texts inside bullet items
                              const parts = cleanLi.split('**');
                              return (
                                <li key={liIdx}>
                                  {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-semibold">{p}</strong> : p)}
                                </li>
                              );
                            })}
                          </ul>
                        );
                      }
                      if (block.includes('\n1. ') || block.startsWith('1. ')) {
                        return (
                          <ol key={bIdx} className="list-decimal pl-4 space-y-2 text-zinc-300 font-semibold">
                            {block.split('\n').map((li, liIdx) => {
                              const cleanLi = li.replace(/^\d+\.\s+/, '').trim();
                              if (!cleanLi) return null;
                              return <li key={liIdx} className="font-normal text-zinc-300">{cleanLi}</li>;
                            })}
                          </ol>
                        );
                      }
                      return <p key={bIdx} className="text-zinc-400">{block}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-center py-10">No highlights compiled.</p>
                )}
              </div>

              {/* Bottom tag indicator */}
              <div className="pt-3 border-t border-zinc-900 text-[9px] text-zinc-500 flex items-center justify-between font-semibold">
                <span>COMPILED BY GPT-4O-MINI</span>
                <span>REAL-TIME ANALYSIS</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
