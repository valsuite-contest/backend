import { Router } from 'express';
import { ClarificationController } from '../controllers/clarificationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const clarificationController = new ClarificationController();

router.get('/:contestId/clarifications', authenticate, (req, res, next) =>
  clarificationController.list(req, res, next)
);
router.get('/:contestId/clarifications/:clarificationId', authenticate, (req, res, next) =>
  clarificationController.get(req, res, next)
);
router.post('/:contestId/clarifications', authenticate, authorize('TEAM'), (req, res, next) =>
  clarificationController.create(req, res, next)
);
router.patch('/:contestId/clarifications/:clarificationId', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) =>
  clarificationController.update(req, res, next)
);

export { router as clarificationRouter };
