import { apiClient } from './apiClient';
import type {
  WebhookSubscription,
  WebhookLog,
  SubscriptionsResponse,
  SubscriptionResponse,
  WebhookLogsResponse,
} from '../types/automation';

export const automationService = {
  /**
   * Fetch all registered webhook subscriptions
   */
  getSubscriptions: async (): Promise<WebhookSubscription[]> => {
    const response = await apiClient.get<SubscriptionsResponse>('/api/automations/subscriptions');
    return response.data.data.subscriptions;
  },

  /**
   * Register a new webhook subscription
   */
  createSubscription: async (payload: {
    eventType: 'lead_created' | 'lead_qualified' | 'message_received' | 'document_processed';
    url: string;
  }): Promise<WebhookSubscription> => {
    const response = await apiClient.post<SubscriptionResponse>(
      '/api/automations/subscriptions',
      payload
    );
    return response.data.data.subscription;
  },

  /**
   * Remove subscription
   */
  deleteSubscription: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/automations/subscriptions/${id}`);
  },

  /**
   * Fetch webhook execution logs
   */
  getWebhookLogs: async (): Promise<WebhookLog[]> => {
    const response = await apiClient.get<WebhookLogsResponse>('/api/automations/logs');
    return response.data.data.logs;
  },
};
