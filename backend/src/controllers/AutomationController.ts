import { Request, Response, NextFunction } from 'express';
import { AutomationService } from '../services/AutomationService';
import { LeadService } from '../services/LeadService';
import { CommunicationService } from '../services/CommunicationService';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  eventType: z.enum(['lead_created', 'lead_qualified', 'message_received', 'document_processed']),
  url: z.string().url('Invalid webhook receiver URL'),
});

const incomingWebhookSchema = z.object({
  eventType: z.enum(['create_lead', 'incoming_message']),
  payload: z.any(),
});

export class AutomationController {
  /**
   * Get all registered webhook subscriptions
   */
  static async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const subscriptions = await AutomationService.getSubscriptions(req.user.id);

      return res.status(200).json({
        success: true,
        data: { subscriptions }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new webhook subscription URL
   */
  static async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const validatedData = createSubscriptionSchema.parse(req.body);
      const subscription = await AutomationService.createSubscription(
        req.user.id,
        validatedData.eventType,
        validatedData.url
      );

      return res.status(201).json({
        success: true,
        data: { subscription }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a subscription url registration
   */
  static async deleteSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      await AutomationService.deleteSubscription(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        data: { message: 'Webhook subscription deleted successfully' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve automation execution audits logs
   */
  static async getWebhookLogs(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const logs = await AutomationService.getWebhookLogs(req.user.id);

      return res.status(200).json({
        success: true,
        data: { logs }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public webhook endpoint allowing n8n to call platform operations APIs
   */
  static async handleIncomingWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const { eventType, payload } = incomingWebhookSchema.parse(req.body);

      console.log(`[webhook]: Received inbound event "${eventType}" from external automation node`);

      let data: any;

      if (eventType === 'create_lead') {
        const leadSchema = z.object({
          name: z.string().min(1),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
        });
        
        const cleanPayload = leadSchema.parse(payload);
        data = await LeadService.createLead(req.user.id, cleanPayload);
      } else if (eventType === 'incoming_message') {
        const messageSchema = z.object({
          leadId: z.string().uuid(),
          channel: z.enum(['email', 'whatsapp']),
          sender: z.string().min(1),
          content: z.string().min(1),
        });

        const cleanPayload = messageSchema.parse(payload);
        data = await CommunicationService.receiveMessage(
          req.user.id,
          cleanPayload.leadId,
          cleanPayload.channel,
          cleanPayload.sender,
          cleanPayload.content
        );
      }

      return res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}
