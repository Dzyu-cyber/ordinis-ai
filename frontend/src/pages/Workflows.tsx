import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationService } from '../services/automationService';
import type { WebhookSubscription, WebhookLog } from '../types/automation';
import {
  Webhook,
  Plus,
  Trash2,
  Loader2,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

export const Workflows: React.FC = () => {
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState<'lead_created' | 'lead_qualified' | 'message_received' | 'document_processed'>('lead_created');
  const [urlInput, setUrlInput] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // 1. Fetch Registered Subscriptions Query
  const { data: subscriptions = [], isLoading: isSubsLoading } = useQuery<WebhookSubscription[]>({
    queryKey: ['subscriptions'],
    queryFn: automationService.getSubscriptions,
  });

  // 2. Fetch Automation Execution Webhook Logs Query (Polls every 4 seconds for real-time trigger updates)
  const { data: logs = [], isLoading: isLogsLoading } = useQuery<WebhookLog[]>({
    queryKey: ['webhookLogs'],
    queryFn: automationService.getWebhookLogs,
    refetchInterval: 4000,
  });

  // 3. Register Webhook Mutation
  const registerMutation = useMutation({
    mutationFn: automationService.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setUrlInput('');
      setRegisterError('');
    },
    onError: (err: any) => {
      setRegisterError(err.message || 'Webhook registration failed.');
    }
  });

  // 4. Delete Subscription Mutation
  const deleteMutation = useMutation({
    mutationFn: automationService.deleteSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    }
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setRegisterError('Please enter a valid receiver webhook URL.');
      return;
    }

    registerMutation.mutate({ eventType, url: urlInput });
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2000);
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto min-h-[calc(100vh-12rem)] relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 flex items-center gap-2">
          <Webhook className="w-8 h-8 text-purple-400" />
          Workflow Automation
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Configure n8n webhook nodes to orchestrate business pipelines from system events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Webhook Registration + Subscriptions */}
        <div className="lg:col-span-1.5 space-y-6">
          {/* Registration Box */}
          <div className="glass-panel p-6 rounded-xl">
            <span className="font-bold text-white text-sm block mb-4">Register Webhook Node</span>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {registerError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                  {registerError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Event Trigger</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="glass-input w-full px-3 py-2.5 rounded-lg text-xs cursor-pointer"
                >
                  <option value="lead_created">lead_created (captured CRM profile)</option>
                  <option value="lead_qualified">lead_qualified (AI BANT score update)</option>
                  <option value="message_received">message_received (inbound WhatsApp/Email)</option>
                  <option value="document_processed">document_processed (AI document extracted)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Receiver Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://n8n.mybusiness.com/webhook/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="glass-input flex-1 px-3 py-2.5 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Active Webhooks List */}
          <div className="space-y-3">
            <span className="font-bold text-white text-sm block">Active Webhook Nodes</span>
            {isSubsLoading ? (
              <div className="glass-panel rounded-xl py-14 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-xs text-zinc-500">Loading nodes...</span>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="glass-panel rounded-xl py-14 text-center">
                <Webhook className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <span className="text-zinc-500 text-xs font-bold block">No automation webhooks registered</span>
              </div>
            ) : (
              <div className="glass-panel rounded-xl overflow-hidden divide-y divide-zinc-900 shadow-xl">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase block w-fit mb-1.5">
                        {sub.event_type}
                      </span>
                      <span className="text-xs text-zinc-300 font-semibold truncate block pr-2">
                        {sub.url}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyUrl(sub.url, sub.id)}
                        className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                      >
                        {copiedUrlId === sub.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Unsubscribe this webhook node?')) {
                            deleteMutation.mutate(sub.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 border border-red-500/10 hover:bg-red-500/10 rounded-lg text-red-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Webhook execution logs feed */}
        <div className="lg:col-span-1.5 space-y-3">
          <span className="font-bold text-white text-sm block flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-purple-400" />
            Execution Console Logs
          </span>

          {isLogsLoading ? (
            <div className="glass-panel rounded-xl py-24 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-xs text-zinc-500">Loading console...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="glass-panel rounded-xl py-24 text-center">
              <Terminal className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <span className="text-zinc-500 text-xs font-bold block">Console history is empty</span>
              <span className="text-[10px] text-zinc-600 block mt-0.5">Dispatched events will be logged here.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isSuccess = log.response_status >= 200 && log.response_status < 300;
                return (
                  <div
                    key={log.id}
                    className="glass-panel border border-zinc-800 rounded-xl overflow-hidden shadow-lg transition-all"
                  >
                    {/* Log Header click-trigger */}
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/10 select-none gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[8px] font-bold uppercase shrink-0">
                            {log.event_type}
                          </span>
                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border shrink-0 ${getStatusBadge(log.response_status)}`}>
                            {log.response_status}
                          </span>
                          <span className="text-[9px] text-zinc-500 truncate shrink-0">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-semibold truncate block">
                          {log.url}
                        </span>
                      </div>
                      <div className="text-zinc-600 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expandable Details console */}
                    {isExpanded && (
                      <div className="border-t border-zinc-900 bg-zinc-950/40 p-4 space-y-3.5 text-[10px] font-mono leading-relaxed">
                        {/* Payload Block */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Sent Payload JSON</span>
                          <pre className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 text-purple-300 overflow-x-auto">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Response Block */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                            Response body ({isSuccess ? 'Success' : 'Error'})
                          </span>
                          <pre className={`bg-zinc-950 p-3 rounded-lg border border-zinc-900 overflow-x-auto ${
                            isSuccess ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {log.response_body || 'No response body returned'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
