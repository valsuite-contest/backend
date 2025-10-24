import { Router } from 'express';
import { AnnouncementController } from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const announcementController = new AnnouncementController();

router.get('/:contestId/announcements', authenticate, (req, res, next) =>
  announcementController.list(req, res, next)
);
router.get('/:contestId/announcements/:announcementId', authenticate, (req, res, next) =>
  announcementController.get(req, res, next)
);
router.post('/:contestId/announcements', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) =>
  announcementController.create(req, res, next)
);
router.patch('/:contestId/announcements/:announcementId', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) =>
  announcementController.update(req, res, next)
);
router.delete('/:contestId/announcements/:announcementId', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) =>
  announcementController.delete(req, res, next)
);

export { router as announcementRouter };
