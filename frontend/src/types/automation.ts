export interface WebhookSubscription {
  id: string;
  user_id: string;
  event_type: 'lead_created' | 'lead_qualified' | 'message_received' | 'document_processed';
  url: string;
  is_active: boolean;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  user_id: string;
  event_type: string;
  url: string;
  payload: any;
  response_status: number;
  response_body: string | null;
  created_at: string;
}

export interface SubscriptionsResponse {
  success: boolean;
  data: {
    subscriptions: WebhookSubscription[];
  };
}

export interface SubscriptionResponse {
  success: boolean;
  data: {
    subscription: WebhookSubscription;
  };
}

export interface WebhookLogsResponse {
  success: boolean;
  data: {
    logs: WebhookLog[];
  };
}
