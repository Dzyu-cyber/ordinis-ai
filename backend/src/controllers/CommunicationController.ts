import { Request, Response, NextFunction } from 'express';
import { CommunicationService } from '../services/CommunicationService';
import { z } from 'zod';

const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation thread ID'),
  content: z.string().min(1, 'Message content cannot be empty'),
});

const generateDraftSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation thread ID'),
});

const inboundSimulationSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID'),
  channel: z.enum(['email', 'whatsapp']),
  sender: z.string().min(1, 'Sender contact info is required'),
  content: z.string().min(1, 'Message body is required'),
});

export class CommunicationController {
  /**
   * Get all active conversation threads
   */
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const conversations = await CommunicationService.getConversations(req.user.id);

      return res.status(200).json({
        success: true,
        data: { conversations }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve message feed inside a thread
   */
  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const messages = await CommunicationService.getMessages(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        data: { messages }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send outgoing email/WhatsApp message
   */
  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const validatedData = sendMessageSchema.parse(req.body);
      const message = await CommunicationService.sendMessage(
        req.user.id,
        validatedData.conversationId,
        validatedData.content
      );

      return res.status(201).json({
        success: true,
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate draft message using GPT-4o-mini
   */
  static async generateDraft(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const validatedData = generateDraftSchema.parse(req.body);
      const draft = await CommunicationService.generateDraftReply(
        req.user.id,
        validatedData.conversationId
      );

      return res.status(200).json({
        success: true,
        data: { draft }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public webhook endpoint simulating inbound client messages (WhatsApp/Email)
   */
  static async receiveSimulation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const validatedData = inboundSimulationSchema.parse(req.body);
      const message = await CommunicationService.receiveMessage(
        req.user.id,
        validatedData.leadId,
        validatedData.channel,
        validatedData.sender,
        validatedData.content
      );

      return res.status(201).json({
        success: true,
        data: { message }
      });
    } catch (error) {
      next(error);
    }
  }
}
