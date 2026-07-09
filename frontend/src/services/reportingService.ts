import { apiClient } from './apiClient';
import type { Analytics, AnalyticsResponse, SummaryResponse } from '../types/reporting';

export const reportingService = {
  /**
   * Get workspace analytics dashboard numbers
   */
  getAnalytics: async (): Promise<Analytics> => {
    const response = await apiClient.get<AnalyticsResponse>('/api/reports/analytics');
    return response.data.data.analytics;
  },

  /**
   * Fetch generated daily executive summary report
   */
  getExecutiveSummary: async (): Promise<string> => {
    const response = await apiClient.get<SummaryResponse>('/api/reports/summary');
    return response.data.data.summary;
  },
};
