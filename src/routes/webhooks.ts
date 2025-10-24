import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), (req: Request, res: Response) => res.json([]));
router.post('/', authenticate, authorize('ADMIN'), (req: Request, res: Response) => res.status(501).json({ message: 'Not implemented' }));

export { router as webhookRouter };
