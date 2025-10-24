import { Router } from 'express';
import { ContestController } from '../controllers/contestController';
import { SubmissionController } from '../controllers/submissionController';
import { JudgementController } from '../controllers/judgementController';
import { ProblemController } from '../controllers/problemController';
import { ClarificationController } from '../controllers/clarificationController';
import { AnnouncementController } from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const contestController = new ContestController();
const submissionController = new SubmissionController();
const judgementController = new JudgementController();
const problemController = new ProblemController();
const clarificationController = new ClarificationController();
const announcementController = new AnnouncementController();

router.get('/', authenticate, (req, res, next) => contestController.list(req, res, next));
router.get('/:contestId', authenticate, (req, res, next) => contestController.get(req, res, next));
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => contestController.create(req, res, next));
router.patch('/:contestId', authenticate, authorize('ADMIN'), (req, res, next) => contestController.update(req, res, next));
router.delete('/:contestId', authenticate, authorize('ADMIN'), (req, res, next) => contestController.delete(req, res, next));

router.post('/:contestId/start', authenticate, authorize('ADMIN'), (req, res, next) => contestController.start(req, res, next));
router.post('/:contestId/pause', authenticate, authorize('ADMIN'), (req, res, next) => contestController.pause(req, res, next));
router.post('/:contestId/resume', authenticate, authorize('ADMIN'), (req, res, next) => contestController.resume(req, res, next));
router.post('/:contestId/freeze', authenticate, authorize('ADMIN'), (req, res, next) => contestController.freeze(req, res, next));
router.post('/:contestId/thaw', authenticate, authorize('ADMIN'), (req, res, next) => contestController.thaw(req, res, next));
router.post('/:contestId/end', authenticate, authorize('ADMIN'), (req, res, next) => contestController.end(req, res, next));
router.post('/:contestId/finalize', authenticate, authorize('ADMIN'), (req, res, next) => contestController.finalize(req, res, next));
router.get('/:contestId/state', authenticate, (req, res, next) => contestController.getState(req, res, next));

router.post('/:contestId/submissions', authenticate, authorize('TEAM'), (req, res, next) => 
  submissionController.create(req, res, next)
);
router.get('/:contestId/submissions', authenticate, (req, res, next) => 
  submissionController.list(req, res, next)
);
router.get('/:contestId/submissions/:submissionId', authenticate, (req, res, next) => 
  submissionController.get(req, res, next)
);
router.get('/:contestId/submissions/:submissionId/source', authenticate, (req, res, next) => 
  submissionController.getSource(req, res, next)
);
router.get('/:contestId/submissions/:submissionId/history', authenticate, (req, res, next) => 
  submissionController.getHistory(req, res, next)
);
router.patch('/:contestId/submissions/:submissionId/status', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) => 
  submissionController.updateStatus(req, res, next)
);

router.post('/:contestId/submissions/:submissionId/judgements', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.create(req, res, next)
);
router.post('/:contestId/submissions/:submissionId/rejudge', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.rejudge(req, res, next)
);
router.post('/:contestId/submissions/:submissionId/execute', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.execute(req, res, next)
);
router.post('/:contestId/submissions/:submissionId/compile', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.compile(req, res, next)
);

router.get('/:contestId/judgements', authenticate, (req, res, next) => 
  judgementController.list(req, res, next)
);
router.get('/:contestId/judgements/stats', authenticate, (req, res, next) => 
  judgementController.getStats(req, res, next)
);
router.get('/:contestId/judgements/queue', authenticate, authorize('JUDGE', 'ADMIN'), (req, res, next) => 
  judgementController.getQueueStatus(req, res, next)
);
router.get('/:contestId/judgements/:judgementId', authenticate, (req, res, next) => 
  judgementController.get(req, res, next)
);

router.get('/:contestId/problems', authenticate, (req, res, next) => 
  problemController.list(req, res, next)
);
router.get('/:contestId/problems/:problemId', authenticate, (req, res, next) => 
  problemController.get(req, res, next)
);
router.post('/:contestId/problems', authenticate, authorize('ADMIN'), (req, res, next) => 
  problemController.create(req, res, next)
);
router.patch('/:contestId/problems/:problemId', authenticate, authorize('ADMIN'), (req, res, next) => 
  problemController.update(req, res, next)
);
router.delete('/:contestId/problems/:problemId', authenticate, authorize('ADMIN'), (req, res, next) => 
  problemController.delete(req, res, next)
);

router.get('/:contestId/problems/:problemId/testdata', authenticate, authorize('ADMIN', 'JUDGE'), (req, res, next) => 
  problemController.listTestData(req, res, next)
);
router.post('/:contestId/problems/:problemId/testdata', authenticate, authorize('ADMIN'), (req, res, next) => 
  problemController.uploadTestData(req, res, next)
);
router.delete('/:contestId/problems/:problemId/testdata/:testDataId', authenticate, authorize('ADMIN'), (req, res, next) => 
  problemController.deleteTestData(req, res, next)
);


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

export { router as contestRouter };

