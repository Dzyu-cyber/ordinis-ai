import { apiClient } from './apiClient';
import type { Document, DocumentsResponse, DocumentResponse } from '../types/document';

export const documentService = {
  /**
   * Fetch all uploaded documents for the user
   */
  getDocuments: async (): Promise<Document[]> => {
    const response = await apiClient.get<DocumentsResponse>('/api/documents');
    return response.data.data.documents;
  },

  /**
   * Fetch details for a specific document
   */
  getDocumentById: async (id: string): Promise<Document> => {
    const response = await apiClient.get<DocumentResponse>(`/api/documents/${id}`);
    return response.data.data.document;
  },

  /**
   * Upload file and trigger async Vision parsing
   */
  uploadDocument: async (file: File, documentType: 'invoice' | 'contract' | 'resume'): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await apiClient.post<DocumentResponse>('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.document;
  },

  /**
   * Delete document
   */
  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/documents/${id}`);
  },
};
