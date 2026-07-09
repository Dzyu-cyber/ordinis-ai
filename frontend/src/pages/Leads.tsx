import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../services/leadService';
import type { Lead } from '../types/lead';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Sparkles,
  Trash2,
  User,
  Mail,
  Phone,
  Building,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const Leads: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for adding a lead
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Fetch Leads Query
  const { data: leads = [], isLoading, error } = useQuery<Lead[]>({
    queryKey: ['leads', statusFilter, search],
    queryFn: () => leadService.getLeads({ status: statusFilter || undefined, search: search || undefined }),
  });

  // 2. Create Lead Mutation
  const createLeadMutation = useMutation({
    mutationFn: leadService.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create lead.');
    }
  });

  // 3. Update Lead Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) =>
      leadService.updateLead(id, { status }),
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (selectedLead && selectedLead.id === updatedLead.id) {
        setSelectedLead(updatedLead);
      }
    }
  });

  // 4. Trigger AI Qualification Mutation
  const qualifyLeadMutation = useMutation({
    mutationFn: leadService.qualifyLead,
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (selectedLead && selectedLead.id === updatedLead.id) {
        setSelectedLead(updatedLead);
      }
    }
  });

  // 5. Delete Lead Mutation
  const deleteLeadMutation = useMutation({
    mutationFn: leadService.deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(null);
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Lead name is required.');
      return;
    }
    createLeadMutation.mutate({
      name,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 40) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-zinc-400 bg-zinc-800 border-zinc-700';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative min-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight m-0">CRM Leads</h1>
          <p className="text-zinc-400 text-sm mt-1">Capture, qualify, and track lead profiles and interaction scoring.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-500 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3 py-2 rounded-lg text-sm w-full sm:w-44 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
            <option value="won">Won</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Leads table + details viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table View (Spans 2 columns if a lead is selected, otherwise full) */}
        <div className={`${selectedLead ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          {isLoading ? (
            <div className="glass-panel rounded-xl py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <span className="text-sm font-medium text-zinc-400">Loading leads database...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              Failed to load leads from the server.
            </div>
          ) : leads.length === 0 ? (
            <div className="glass-panel rounded-xl py-20 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600 mb-2">
                <User className="w-6 h-6" />
              </div>
              <span className="font-bold text-white text-base block">No leads found</span>
              <span className="text-zinc-500 text-xs">Add a lead manually or test webhook inputs.</span>
            </div>
          ) : (
            <div className="glass-panel rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40">
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Lead</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Company</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider">Score</th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-zinc-400 tracking-wider text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          selectedLead?.id === lead.id
                            ? 'bg-purple-600/5'
                            : 'hover:bg-zinc-900/20'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white text-sm">{lead.name}</div>
                          <div className="text-xs text-zinc-400">{lead.email || 'No Email'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-300">
                          {lead.company || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                            lead.status === 'qualified' || lead.status === 'won'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : lead.status === 'contacted'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : lead.status === 'lost'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{lead.score || 0}</span>
                            <div className="w-12 bg-zinc-800 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  lead.score >= 70 ? 'bg-emerald-500' : lead.score >= 40 ? 'bg-blue-500' : 'bg-zinc-600'
                                }`}
                                style={{ width: `${lead.score || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${
                            selectedLead?.id === lead.id ? 'translate-x-1 text-purple-400' : ''
                          }`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Selected Lead Details Panel */}
        {selectedLead && (
          <div className="glass-panel p-6 rounded-xl space-y-6 shadow-xl sticky top-6 border border-zinc-800 animate-in fade-in slide-in-from-right-5 duration-200">
            {/* Header / Actions */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white m-0">{selectedLead.name}</h3>
                <span className="text-xs text-zinc-500">{selectedLead.company || 'No Company'}</span>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-zinc-500" />
                <span className="truncate">{selectedLead.email || 'No Email'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{selectedLead.phone || 'No Phone'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-zinc-500" />
                <span>{selectedLead.company || 'No Company'}</span>
              </div>
            </div>

            {/* Lead Status Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Status</label>
              <select
                value={selectedLead.status}
                onChange={(e) => updateStatusMutation.mutate({ id: selectedLead.id, status: e.target.value as any })}
                className="glass-input w-full px-3 py-2 rounded-lg text-sm cursor-pointer"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="lost">Lost</option>
                <option value="won">Won</option>
              </select>
            </div>

            {/* AI BANT Qualification Details */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold text-sm">AI Qualification</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getScoreColor(selectedLead.score)}`}>
                  Score: {selectedLead.score || 0}/100
                </span>
              </div>

              {/* BANT metrics */}
              <div className="space-y-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 text-xs">
                <div>
                  <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Budget</span>
                  <span className="text-zinc-300">{selectedLead.qualification_details?.budget || 'Not Analyzed'}</span>
                </div>
                <div>
                  <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Authority</span>
                  <span className="text-zinc-300">{selectedLead.qualification_details?.authority || 'Not Analyzed'}</span>
                </div>
                <div>
                  <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Need</span>
                  <span className="text-zinc-300">{selectedLead.qualification_details?.need || 'Not Analyzed'}</span>
                </div>
                <div>
                  <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Timeline</span>
                  <span className="text-zinc-300">{selectedLead.qualification_details?.timeline || 'Not Analyzed'}</span>
                </div>
                {selectedLead.qualification_details?.summary && (
                  <div className="pt-2.5 border-t border-zinc-800">
                    <span className="font-bold text-zinc-500 block uppercase tracking-wider mb-0.5">Summary</span>
                    <p className="text-zinc-400 leading-relaxed m-0">{selectedLead.qualification_details.summary}</p>
                  </div>
                )}
              </div>

              {/* Qualify Trigger Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => qualifyLeadMutation.mutate(selectedLead.id)}
                  disabled={qualifyLeadMutation.isPending}
                  className="flex-1 px-4 py-2 border border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5 text-purple-400 font-semibold rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {qualifyLeadMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing BANT...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Recalculate AI Score
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this lead?')) {
                      deleteLeadMutation.mutate(selectedLead.id);
                    }
                  }}
                  disabled={deleteLeadMutation.isPending}
                  className="p-2 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg cursor-pointer transition-colors"
                  title="Delete Lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-fuchsia-500"></div>

            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <span className="font-bold text-white text-lg">Add New Lead</span>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              {/* Lead Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Lead Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
                    required
                  />
                </div>
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Company Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Inc."
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@acme.com"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 1234"
                    className="glass-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLeadMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {createLeadMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
