import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:fileId', authenticate, (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/upload', authenticate, (req, res) => res.status(501).json({ message: 'Not implemented' }));

export { router as fileRouter };
