import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const userController = new UserController();

router.get('/', authenticate, authorize('ADMIN'), (req, res, next) => userController.list(req, res, next));
router.get('/:userId', authenticate, (req, res, next) => userController.get(req, res, next));
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => userController.create(req, res, next));
router.patch('/:userId', authenticate, (req, res, next) => userController.update(req, res, next));
router.delete('/:userId', authenticate, authorize('ADMIN'), (req, res, next) => userController.delete(req, res, next));
router.post('/:userId/force-logout', authenticate, authorize('ADMIN'), (req, res, next) => userController.forceLogout(req, res, next));
router.get('/:userId/sessions', authenticate, (req, res, next) => userController.getSessions(req, res, next));
router.post('/:userId/roles', authenticate, authorize('ADMIN'), (req, res, next) => userController.addRole(req, res, next));
router.delete('/:userId/roles/:role', authenticate, authorize('ADMIN'), (req, res, next) => userController.removeRole(req, res, next));
router.patch('/:userId/password', authenticate, (req, res, next) => userController.changePassword(req, res, next));

export { router as userRouter };
