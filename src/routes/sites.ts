import { Router } from 'express';
import { SiteController } from '../controllers/siteController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const siteController = new SiteController();

router.get('/', authenticate, (req, res, next) => siteController.list(req, res, next));
router.get('/:siteId', authenticate, (req, res, next) => siteController.get(req, res, next));
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => siteController.create(req, res, next));
router.patch('/:siteId', authenticate, authorize('ADMIN'), (req, res, next) => siteController.update(req, res, next));
router.delete('/:siteId', authenticate, authorize('ADMIN'), (req, res, next) => siteController.delete(req, res, next));
router.post('/:siteId/connect', authenticate, authorize('ADMIN'), (req, res, next) => siteController.connect(req, res, next));
router.post('/:siteId/disconnect', authenticate, authorize('ADMIN'), (req, res, next) => siteController.disconnect(req, res, next));
router.get('/:siteId/teams', authenticate, (req, res, next) => siteController.getTeams(req, res, next));
router.get('/:siteId/runs', authenticate, (req, res, next) => siteController.getSubmissions(req, res, next));
router.get('/:siteId/export', authenticate, authorize('ADMIN'), (req, res, next) => siteController.exportData(req, res, next));
router.post('/:siteId/import', authenticate, authorize('ADMIN'), (req, res, next) => siteController.importData(req, res, next));

export { router as siteRouter };

