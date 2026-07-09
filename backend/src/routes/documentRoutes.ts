import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// Apply auth middleware to protect all document endpoints
router.use(authMiddleware);

router.get('/', DocumentController.getDocuments);
router.get('/:id', DocumentController.getDocumentById);
router.post('/upload', uploadMiddleware.single('file'), DocumentController.uploadDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
