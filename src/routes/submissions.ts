import { Router } from 'express';
import { SubmissionController } from '../controllers/submissionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const submissionController = new SubmissionController();

router.post('/', authenticate, authorize('TEAM'), (req, res, next) => 
  submissionController.create(req, res, next)
);

router.get('/', authenticate, (req, res, next) => 
  submissionController.list(req, res, next)
);

router.get('/:submissionId', authenticate, (req, res, next) => 
  submissionController.get(req, res, next)
);

router.get('/:submissionId/source', authenticate, (req, res, next) => 
  submissionController.getSource(req, res, next)
);

router.get('/:submissionId/history', authenticate, (req, res, next) => 
  submissionController.getHistory(req, res, next)
);

router.patch('/:submissionId/status', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) => 
  submissionController.updateStatus(req, res, next)
);

export { router as submissionRouter };
