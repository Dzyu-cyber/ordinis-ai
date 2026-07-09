export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_url: string;
  document_type: 'invoice' | 'contract' | 'resume';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parsed_content: any;
  created_at: string;
  updated_at: string;
}

export interface DocumentResponse {
  success: boolean;
  data: {
    document: Document;
  };
}

export interface DocumentsResponse {
  success: boolean;
  data: {
    documents: Document[];
  };
}
