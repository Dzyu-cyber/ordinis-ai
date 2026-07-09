export interface Conversation {
  id: string;
  lead_id: string;
  channel: 'email' | 'whatsapp';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  lead_name: string;
  lead_company: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  last_message_content: string | null;
  last_message_direction: 'inbound' | 'outbound' | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
  };
}

export interface MessageResponse {
  success: boolean;
  data: {
    message: Message;
  };
}

export interface DraftResponse {
  success: boolean;
  data: {
    draft: string;
  };
}
