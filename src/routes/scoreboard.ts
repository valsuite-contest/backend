import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  calculateScoreboard,
  getFrozenScoreboard,
  getTeamScoreboard,
  updateScores,
  getScoreboardStats,
  exportScoreboardHTML
} from '../controllers/scoreboardController';

const router = Router();

router.get('/:contestId', authenticate, calculateScoreboard);

router.get('/:contestId/frozen', authenticate, getFrozenScoreboard);

router.get('/:contestId/team/:teamId', authenticate, getTeamScoreboard);

router.post('/:contestId/update', authenticate, updateScores);

router.get('/:contestId/stats', authenticate, getScoreboardStats);

router.get('/:contestId/export/html', authenticate, exportScoreboardHTML);

export { router as scoreboardRouter };
