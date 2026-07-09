import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to protect all lead operations
router.use(authMiddleware);

router.get('/', LeadController.getLeads);
router.post('/', LeadController.createLead);
router.get('/:id', LeadController.getLeadById);
router.put('/:id', LeadController.updateLead);
router.post('/:id/qualify', LeadController.qualifyLead);
router.delete('/:id', LeadController.deleteLead);

export default router;
