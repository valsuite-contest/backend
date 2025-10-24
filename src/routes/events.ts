import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/:contestId', authenticate, (req, res) => res.json([]));

export { router as eventRouter };
