import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req, res) => res.json([]));
router.get('/:langId', authenticate, (req, res) => res.json({}));
router.post('/', authenticate, authorize('ADMIN'), (req, res) => res.status(501).json({ message: 'Not implemented' }));

export { router as languageRouter };
