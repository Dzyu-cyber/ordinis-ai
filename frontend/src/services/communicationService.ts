import { apiClient } from './apiClient';
import type {
  Conversation,
  Message,
  ConversationsResponse,
  MessagesResponse,
  MessageResponse,
  DraftResponse,
} from '../types/communication';

export const communicationService = {
  /**
   * List all active conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<ConversationsResponse>('/api/communication/conversations');
    return response.data.data.conversations;
  },

  /**
   * Retrieve full message history inside a conversation
   */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await apiClient.get<MessagesResponse>(
      `/api/communication/conversations/${conversationId}/messages`
    );
    return response.data.data.messages;
  },

  /**
   * Dispatch outbound email/WhatsApp message
   */
  sendMessage: async (payload: { conversationId: string; content: string }): Promise<Message> => {
    const response = await apiClient.post<MessageResponse>('/api/communication/messages/send', payload);
    return response.data.data.message;
  },

  /**
   * Auto-generate a reply suggest draft based on context
   */
  generateDraft: async (conversationId: string): Promise<string> => {
    const response = await apiClient.post<DraftResponse>('/api/communication/messages/draft', {
      conversationId,
    });
    return response.data.data.draft;
  },

  /**
   * Simulate a webhook receiving message for testing
   */
  simulateInbound: async (payload: {
    leadId: string;
    channel: 'email' | 'whatsapp';
    sender: string;
    content: string;
  }): Promise<Message> => {
    const response = await apiClient.post<MessageResponse>('/api/communication/messages/webhook', payload);
    return response.data.data.message;
  },
};
