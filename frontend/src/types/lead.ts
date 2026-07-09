export interface QualificationDetails {
  budget?: string;
  authority?: string;
  need?: string;
  timeline?: string;
  summary?: string;
}

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'won';
  score: number;
  qualification_details: QualificationDetails;
  created_at: string;
  updated_at: string;
}

export interface LeadResponse {
  success: boolean;
  data: {
    lead: Lead;
  };
}

export interface LeadsResponse {
  success: boolean;
  data: {
    leads: Lead[];
  };
}
