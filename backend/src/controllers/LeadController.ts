import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/LeadService';
import { AIService } from '../services/AIService';
import { createLeadSchema, updateLeadSchema } from '../validators/leadValidator';

export class LeadController {
  /**
   * Get all leads for the authenticated business user
   */
  static async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const status = req.query.status as string;
      const search = req.query.search as string;

      const leads = await LeadService.getLeads(req.user.id, { status, search });

      return res.status(200).json({
        success: true,
        data: { leads }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Capture a new lead and automatically trigger qualification
   */
  static async createLead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const validatedData = createLeadSchema.parse(req.body);
      const lead = await LeadService.createLead(req.user.id, validatedData);

      // Trigger background AI BANT qualification asynchronously
      // Dispatched without awaiting to return a prompt response
      AIService.triggerLeadQualification(req.user.id, lead.id)
        .catch(err => console.error(`[controller]: Failed to trigger qualification for lead ${lead.id}`, err));

      return res.status(201).json({
        success: true,
        data: { lead }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve a specific lead by ID
   */
  static async getLeadById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const lead = await LeadService.getLeadById(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        data: { lead }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update lead properties
   */
  static async updateLead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const validatedData = updateLeadSchema.parse(req.body);
      const lead = await LeadService.updateLead(req.user.id, req.params.id, validatedData);

      return res.status(200).json({
        success: true,
        data: { lead }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually trigger re-qualification for a lead
   */
  static async qualifyLead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const leadId = req.params.id;
      
      // Wait for it synchronously when triggered manually
      await AIService.triggerLeadQualification(req.user.id, leadId);

      const lead = await LeadService.getLeadById(req.user.id, leadId);

      return res.status(200).json({
        success: true,
        data: { lead }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete lead
   */
  static async deleteLead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      await LeadService.deleteLead(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        data: { message: 'Lead deleted successfully' }
      });
    } catch (error) {
      next(error);
    }
  }
}
