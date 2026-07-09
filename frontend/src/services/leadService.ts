import { apiClient } from './apiClient';
import type { Lead, LeadsResponse, LeadResponse } from '../types/lead';

export const leadService = {
  /**
   * List all business leads with optional filtering
   */
  getLeads: async (filters?: { status?: string; search?: string }): Promise<Lead[]> => {
    const response = await apiClient.get<LeadsResponse>('/api/leads', { params: filters });
    return response.data.data.leads;
  },

  /**
   * Fetch details for a specific lead
   */
  getLeadById: async (id: string): Promise<Lead> => {
    const response = await apiClient.get<LeadResponse>(`/api/leads/${id}`);
    return response.data.data.lead;
  },

  /**
   * Create a new lead manually or from public capture
   */
  createLead: async (payload: { name: string; email?: string; phone?: string; company?: string }): Promise<Lead> => {
    const response = await apiClient.post<LeadResponse>('/api/leads', payload);
    return response.data.data.lead;
  },

  /**
   * Update lead details (e.g., status, score, notes)
   */
  updateLead: async (id: string, payload: Partial<Lead>): Promise<Lead> => {
    const response = await apiClient.put<LeadResponse>(`/api/leads/${id}`, payload);
    return response.data.data.lead;
  },

  /**
   * Manually trigger re-qualification for a lead
   */
  qualifyLead: async (id: string): Promise<Lead> => {
    const response = await apiClient.post<LeadResponse>(`/api/leads/${id}/qualify`);
    return response.data.data.lead;
  },

  /**
   * Delete lead from database
   */
  deleteLead: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/leads/${id}`);
  }
};
