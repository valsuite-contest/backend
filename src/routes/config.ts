import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/global', authenticate, authorize('ADMIN'), (req, res) => res.json({}));
router.patch('/global', authenticate, authorize('ADMIN'), (req, res) => res.status(501).json({ message: 'Not implemented' }));

export { router as configRouter };
