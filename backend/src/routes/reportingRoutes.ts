import { Router } from 'express';
import { ReportingController } from '../controllers/ReportingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to protect all reporting endpoints
router.use(authMiddleware);

router.get('/analytics', ReportingController.getAnalytics);
router.get('/summary', ReportingController.getExecutiveSummary);

export default router;
