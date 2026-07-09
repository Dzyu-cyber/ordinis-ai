import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService } from '../services/communicationService';
import { leadService } from '../services/leadService';
import type { Conversation, Message } from '../types/communication';
import type { Lead } from '../types/lead';
import {
  Mail,
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  Inbox as InboxIcon
} from 'lucide-react';

export const Inbox: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [simulationLeadId, setSimulationLeadId] = useState('');
  const [simulationChannel, setSimulationChannel] = useState<'email' | 'whatsapp'>('email');
  const [simulationContent, setSimulationContent] = useState('');
  const [simulationError, setSimulationError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  const { data: conversations = [], isLoading: isConvoLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: communicationService.getConversations,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // 2. Fetch Messages for Selected Conversation
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ['messages', selectedConvo?.id],
    queryFn: () => communicationService.getMessages(selectedConvo!.id),
    enabled: !!selectedConvo?.id,
    refetchInterval: 3000, // Poll messages faster when viewing thread
  });

  // 3. Fetch Leads for Inbound Message Simulation Dropdown
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: () => leadService.getLeads(),
  });

  // 4. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: communicationService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConvo?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
    }
  });

  // 5. Inbound Message Webhook Simulation Mutation
  const simulateInboundMutation = useMutation({
    mutationFn: communicationService.simulateInbound,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (selectedConvo) {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConvo.id] });
      }
      setSimulationContent('');
      setSimulationError('');
      setIsSimulating(false);
    },
    onError: (err: any) => {
      setSimulationError(err.message || 'Simulation failed.');
    }
  });

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set default simulation lead
  useEffect(() => {
    if (leads.length > 0 && !simulationLeadId) {
      setSimulationLeadId(leads[0].id);
    }
  }, [leads, simulationLeadId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvo || !messageInput.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      conversationId: selectedConvo.id,
      content: messageInput
    });
  };

  const handleTriggerAIDraft = async () => {
    if (!selectedConvo || isDraftLoading) return;
    setIsDraftLoading(true);
    try {
      const draft = await communicationService.generateDraft(selectedConvo.id);
      setMessageInput(draft);
    } catch (error) {
      console.error('Failed to generate draft', error);
    } finally {
      setIsDraftLoading(false);
    }
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationLeadId || !simulationContent.trim()) {
      setSimulationError('Please select a lead and enter message content.');
      return;
    }

    const lead = leads.find((l) => l.id === simulationLeadId);
    const sender = simulationChannel === 'email' ? lead?.email || 'test@client.com' : lead?.phone || '+123456';

    simulateInboundMutation.mutate({
      leadId: simulationLeadId,
      channel: simulationChannel,
      sender,
      content: simulationContent
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">Communication Hub</h1>
          <p className="text-zinc-400 text-sm mt-1">Unified business inbox with instant AI reply suggestions.</p>
        </div>
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4 text-purple-400" />
          Simulate Client Incoming Webhook
        </button>
      </div>

      {/* Simulator Modal Drawdown Overlay */}
      {isSimulating && (
        <div className="absolute inset-x-0 top-0 bg-zinc-950/95 border border-zinc-800/80 rounded-xl p-6 z-40 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="font-bold text-white text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Inbound Webhook Simulator (n8n WhatsApp/Email ingestion hook bypass)
            </span>
            <button
              onClick={() => setIsSimulating(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSimulateSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Lead</label>
              <select
                value={simulationLeadId}
                onChange={(e) => setSimulationLeadId(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-lg text-xs cursor-pointer"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.company || 'No Company'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Inbound Channel</label>
              <select
                value={simulationChannel}
                onChange={(e) => setSimulationChannel(e.target.value as any)}
                className="glass-input w-full px-3 py-2 rounded-lg text-xs cursor-pointer"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Message Content</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Hey, interested in a demo next week!"
                  value={simulationContent}
                  onChange={(e) => setSimulationContent(e.target.value)}
                  className="glass-input flex-1 px-3 py-2 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  disabled={simulateInboundMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  Fire Inbound
                </button>
              </div>
            </div>
          </form>
          {simulationError && (
            <p className="text-red-400 text-xs m-0 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {simulationError}
            </p>
          )}
        </div>
      )}

      {/* Main Panel Viewport */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden min-h-0">
        {/* Sidebar Threads List */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 font-bold text-sm text-zinc-300 flex items-center gap-2">
            <InboxIcon className="w-4 h-4 text-purple-400" />
            Conversations
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
            {isConvoLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-xs text-zinc-500">Loading threads...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <span className="text-zinc-500 text-xs block font-bold">No active conversations</span>
                <span className="text-[10px] text-zinc-600 block">Use the simulator to send a message.</span>
              </div>
            ) : (
              conversations.map((convo) => {
                const isSelected = selectedConvo?.id === convo.id;
                const isEmail = convo.channel === 'email';
                return (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={`p-4 border-l-2 cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-purple-600/5 border-purple-500'
                        : 'hover:bg-zinc-900/10 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm block truncate pr-2">
                        {convo.lead_name}
                      </span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {isEmail ? (
                        <span className="text-purple-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Email
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </span>
                      )}
                    </div>

                    {convo.last_message_content && (
                      <p className={`text-xs mt-1.5 truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {convo.last_message_direction === 'outbound' ? 'You: ' : ''}
                        {convo.last_message_content}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Messaging Feed Workspace */}
        <div className="md:col-span-2 glass-panel rounded-xl flex flex-col overflow-hidden">
          {selectedConvo ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex items-center justify-between shrink-0">
                <div>
                  <span className="font-bold text-white text-sm block">{selectedConvo.lead_name}</span>
                  <span className="text-xs text-zinc-500">
                    {selectedConvo.channel === 'email' ? selectedConvo.lead_email : selectedConvo.lead_phone}
                  </span>
                </div>
                <button
                  onClick={handleTriggerAIDraft}
                  disabled={isDraftLoading}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isDraftLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Drafting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Suggest Reply
                    </>
                  )}
                </button>
              </div>

              {/* Feed viewport */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0 bg-zinc-950/20">
                {isMessagesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : (
                  messages.map((message) => {
                    const isInbound = message.direction === 'inbound';
                    return (
                      <div key={message.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                            isInbound
                              ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                              : 'bg-purple-600 text-white rounded-tr-none'
                          }`}
                        >
                          <p className="m-0 whitespace-pre-wrap">{message.content}</p>
                          <span className={`text-[9px] block mt-1 text-right ${isInbound ? 'text-zinc-500' : 'text-purple-200'}`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send input tray */}
              <form onSubmit={handleSend} className="p-4 border-t border-zinc-800 bg-zinc-900/10 flex gap-3 shrink-0">
                <input
                  type="text"
                  placeholder="Type a response or request an AI Suggest Draft..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sendMessageMutation.isPending}
                  className="glass-input flex-1 px-4 py-2.5 rounded-lg text-sm"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="font-bold text-white text-base block">No conversation selected</span>
              <span className="text-zinc-500 text-xs max-w-xs">
                Select a thread from the list on the left to read history and send drafts.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
