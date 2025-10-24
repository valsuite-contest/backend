import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const teamController = new TeamController();

router.get('/', authenticate, (req, res, next) => teamController.list(req, res, next));
router.get('/:teamId', authenticate, (req, res, next) => teamController.get(req, res, next));
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => teamController.create(req, res, next));
router.patch('/:teamId', authenticate, authorize('ADMIN', 'TEAM'), (req, res, next) => teamController.update(req, res, next));
router.delete('/:teamId', authenticate, authorize('ADMIN'), (req, res, next) => teamController.delete(req, res, next));
router.get('/:teamId/members', authenticate, (req, res, next) => teamController.getMembers(req, res, next));
router.post('/:teamId/members', authenticate, authorize('ADMIN', 'TEAM'), (req, res, next) => teamController.addMember(req, res, next));
router.delete('/:teamId/members/:memberId', authenticate, authorize('ADMIN', 'TEAM'), (req, res, next) => teamController.removeMember(req, res, next));
router.post('/:teamId/site', authenticate, authorize('ADMIN'), (req, res, next) => teamController.assignSite(req, res, next));
router.get('/:teamId/runs', authenticate, (req, res, next) => teamController.getRuns(req, res, next));
router.get('/:teamId/clarifications', authenticate, (req, res, next) => teamController.getClarifications(req, res, next));
router.get('/:teamId/score', authenticate, (req, res, next) => teamController.getScore(req, res, next));

export { router as teamRouter };
