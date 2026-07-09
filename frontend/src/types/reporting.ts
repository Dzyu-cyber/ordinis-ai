export interface Analytics {
  totalLeads: number;
  qualifiedLeads: number;
  newLeads: number;
  contactedLeads: number;
  conversionRate: number;
  
  totalDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  activeDocuments: number;

  activeThreads: number;
  emailThreads: number;
  whatsappThreads: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    analytics: Analytics;
  };
}

export interface SummaryResponse {
  success: boolean;
  data: {
    summary: string;
  };
}
