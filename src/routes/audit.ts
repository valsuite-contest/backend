import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/logs', authenticate, authorize('ADMIN'), (req, res) => res.json([]));
router.get('/logs/:logId', authenticate, authorize('ADMIN'), (req, res) => res.json({}));

export { router as auditRouter };
