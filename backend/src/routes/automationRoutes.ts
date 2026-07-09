import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to protect all automation endpoints
router.use(authMiddleware);

router.get('/subscriptions', AutomationController.getSubscriptions);
router.post('/subscriptions', AutomationController.createSubscription);
router.delete('/subscriptions/:id', AutomationController.deleteSubscription);
router.get('/logs', AutomationController.getWebhookLogs);
router.post('/webhooks/incoming', AutomationController.handleIncomingWebhook);

export default router;
