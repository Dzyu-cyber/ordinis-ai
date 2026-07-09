import { Request, Response, NextFunction } from 'express';
import { ReportingService } from '../services/ReportingService';

export class ReportingController {
  /**
   * Get workspace analytics dashboard numbers
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const analytics = await ReportingService.getAnalytics(req.user.id);

      return res.status(200).json({
        success: true,
        data: { analytics }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get generated executive report highlights
   */
  static async getExecutiveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const summary = await ReportingService.getExecutiveSummary(req.user.id);

      return res.status(200).json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      next(error);
    }
  }
}
