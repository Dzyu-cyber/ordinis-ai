import { db } from '../config/db';
import { GmailService } from './GmailService';
import { WhatsAppService } from './WhatsAppService';
import { AIService } from './AIService';
import { LeadService } from './LeadService';
import { AutomationService } from './AutomationService';

export class CommunicationService {
  /**
   * Fetch all conversation threads for the user's leads
   */
  static async getConversations(userId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT c.*, l.name as lead_name, l.company as lead_company, l.email as lead_email, l.phone as lead_phone,
       (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
       (SELECT m.direction FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_direction
       FROM conversations c
       JOIN leads l ON c.lead_id = l.id
       WHERE l.user_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Retrieve all messages inside a specific conversation thread
   */
  static async getMessages(userId: string, conversationId: string): Promise<any[]> {
    // Verify conversation owner
    const conversationCheck = await db.query(
      `SELECT c.id FROM conversations c
       JOIN leads l ON c.lead_id = l.id
       WHERE l.user_id = $1 AND c.id = $2`,
      [userId, conversationId]
    );

    if (conversationCheck.rows.length === 0) {
      const error: any = new Error('Conversation not found');
      error.statusCode = 404;
      error.code = 'CONVERSATION_NOT_FOUND';
      throw error;
    }

    const result = await db.query(
      `SELECT * FROM messages 
       WHERE conversation_id = $1 
       ORDER BY created_at ASC`,
      [conversationId]
    );

    // Mark messages as read
    await db.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE conversation_id = $1 AND direction = 'inbound'`,
      [conversationId]
    );

    return result.rows;
  }

  /**
   * Ingest an incoming message from a lead (e.g. Email or WhatsApp)
   */
  static async receiveMessage(
    userId: string,
    leadId: string,
    channel: 'email' | 'whatsapp',
    sender: string,
    content: string
  ): Promise<any> {
    // 1. Verify lead belongs to user
    await LeadService.getLeadById(userId, leadId);

    // 2. Find or Create conversation thread
    let conversationResult = await db.query(
      'SELECT id FROM conversations WHERE lead_id = $1 AND channel = $2',
      [leadId, channel]
    );

    let conversationId: string;

    if (conversationResult.rows.length === 0) {
      const createResult = await db.query(
        'INSERT INTO conversations (lead_id, channel, last_message_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id',
        [leadId, channel]
      );
      conversationId = createResult.rows[0].id;
    } else {
      conversationId = conversationResult.rows[0].id;
      // Update last message timestamp
      await db.query(
        'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );
    }

    // 3. Write incoming message to DB
    const messageResult = await db.query(
      `INSERT INTO messages (conversation_id, direction, sender, content, is_read)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [conversationId, 'inbound', sender, content, false]
    );

    const message = messageResult.rows[0];

    // Trigger webhook event
    AutomationService.triggerWebhook(userId, 'message_received', {
      leadId,
      conversationId,
      channel,
      messageId: message.id,
      direction: message.direction,
      sender: message.sender,
      content: message.content
    }).catch((err) => {
      console.error('[communication-service]: Webhook trigger failure for message_received', err);
    });

    return message;
  }

  /**
   * Send an outbound message (Email or WhatsApp)
   */
  static async sendMessage(userId: string, conversationId: string, content: string): Promise<any> {
    // 1. Fetch conversation details and verify user ownership
    const convoResult = await db.query(
      `SELECT c.id, c.channel, l.id as lead_id, l.email, l.phone, l.name
       FROM conversations c
       JOIN leads l ON c.lead_id = l.id
       WHERE l.user_id = $1 AND c.id = $2`,
      [userId, conversationId]
    );

    if (convoResult.rows.length === 0) {
      const error: any = new Error('Conversation thread not found or access denied');
      error.statusCode = 404;
      error.code = 'CONVERSATION_NOT_FOUND';
      throw error;
    }

    const conversation = convoResult.rows[0];
    const channel = conversation.channel;
    const recipient = channel === 'email' ? conversation.email : conversation.phone;

    if (!recipient) {
      const error: any = new Error(`Lead does not have a valid ${channel} configured`);
      error.statusCode = 400;
      error.code = 'RECIPIENT_MISSING';
      throw error;
    }

    // 2. Dispatch to external adapter
    if (channel === 'email') {
      await GmailService.sendEmail(recipient, 'Update from Ordinis AI Operations', content);
    } else if (channel === 'whatsapp') {
      await WhatsAppService.sendMessage(recipient, content);
    }

    // 3. Write outbound message log to DB
    const messageResult = await db.query(
      `INSERT INTO messages (conversation_id, direction, sender, content, is_read)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [conversationId, 'outbound', 'system', content, true]
    );

    // 4. Update last message timestamp
    await db.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    return messageResult.rows[0];
  }

  /**
   * Auto-generate response suggestions using AI
   */
  static async generateDraftReply(userId: string, conversationId: string): Promise<string> {
    // 1. Verify owner and fetch details
    const convoResult = await db.query(
      `SELECT c.id, c.channel, l.id as lead_id, l.name, l.qualification_details
       FROM conversations c
       JOIN leads l ON c.lead_id = l.id
       WHERE l.user_id = $1 AND c.id = $2`,
      [userId, conversationId]
    );

    if (convoResult.rows.length === 0) {
      const error: any = new Error('Conversation thread not found');
      error.statusCode = 404;
      error.code = 'CONVERSATION_NOT_FOUND';
      throw error;
    }

    const conversation = convoResult.rows[0];

    // 2. Fetch conversation history
    const messages = await db.query(
      'SELECT direction, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    if (messages.rows.length === 0) {
      return '';
    }

    const lastMessage = messages.rows[messages.rows.length - 1].content;
    const historyText = messages.rows
      .slice(0, -1) // Exclude last message
      .map((m: any) => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`)
      .join('\n');

    // 3. Trigger AI generation
    const draft = await AIService.generateDraftReply(
      conversation.name,
      conversation.qualification_details,
      lastMessage,
      historyText,
      conversation.channel
    );

    return draft;
  }
}
