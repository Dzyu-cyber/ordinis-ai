import { Router } from 'express';
import { CommunicationController } from '../controllers/CommunicationController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to protect inbox endpoints
router.use(authMiddleware);

router.get('/conversations', CommunicationController.getConversations);
router.get('/conversations/:id/messages', CommunicationController.getMessages);
router.post('/messages/send', CommunicationController.sendMessage);
router.post('/messages/draft', CommunicationController.generateDraft);
router.post('/messages/webhook', CommunicationController.receiveSimulation);

export default router;
