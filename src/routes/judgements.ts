import { Router } from 'express';
import { JudgementController } from '../controllers/judgementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const judgementController = new JudgementController();

router.post('/', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.create(req, res, next)
);

router.get('/', authenticate, (req, res, next) => 
  judgementController.list(req, res, next)
);

router.get('/stats', authenticate, (req, res, next) => 
  judgementController.getStats(req, res, next)
);

router.get('/queue', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.getQueueStatus(req, res, next)
);

router.get('/:judgementId', authenticate, (req, res, next) => 
  judgementController.get(req, res, next)
);

export { router as judgementRouter };
