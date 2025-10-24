import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class SubmissionController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const { problemId, languageId, sourceCode, entryPoint } = req.body;

      if (!problemId || !languageId || !sourceCode) {
        throw new HttpError(400, 'Problem ID, language ID, and source code are required');
      }

      if (sourceCode.length > 1000000) { // 1MB limit
        throw new HttpError(400, 'Source code exceeds maximum size of 1MB');
      }

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      if (contest.status !== 'RUNNING') {
        throw new HttpError(400, 'Contest is not currently running');
      }

      const problem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
      });

      if (!problem) {
        throw new HttpError(404, 'Problem not found in this contest');
      }

      const contestLanguage = await prisma.contestLanguage.findFirst({
        where: {
          contestId: contestId,
          languageId: languageId,
          enabled: true,
        },
      });

      if (!contestLanguage) {
        throw new HttpError(400, 'Language not allowed in this contest');
      }

      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId: req.user?.id,
        },
        include: {
          team: true,
        },
      });

      if (!teamMember) {
        throw new HttpError(403, 'User is not part of any team');
      }

      const contestTime = contest.startTime 
        ? Math.floor((Date.now() - contest.startTime.getTime()) / 60000)
        : 0;

      const isLate = contest.endTime 
        ? new Date() > contest.endTime
        : false;

      const submission = await prisma.submission.create({
        data: {
          teamId: teamMember.teamId,
          contestId,
          problemId,
          languageId,
          sourceCode,
          entryPoint,
          contestTime,
          isLate,
          siteId: teamMember.team.siteId,
          status: 'QUEUED',
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          problem: {
            select: {
              id: true,
              label: true,
              name: true,
            },
          },
          language: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'SUBMISSION',
          data: {
            submissionId: submission.id,
            teamId: submission.teamId,
            problemId: submission.problemId,
            languageId: submission.languageId,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'SUBMIT_SOLUTION',
          entity: 'Submission',
          entityId: submission.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json({
        id: submission.id,
        teamId: submission.teamId,
        contestId: submission.contestId,
        problemId: submission.problemId,
        languageId: submission.languageId,
        timestamp: submission.timestamp,
        contestTime: submission.contestTime,
        status: submission.status,
        isLate: submission.isLate,
        team: submission.team,
        problem: submission.problem,
        language: submission.language,
      });
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              affiliation: true,
            },
          },
          problem: {
            select: {
              id: true,
              label: true,
              name: true,
            },
          },
          language: {
            select: {
              id: true,
              name: true,
            },
          },
          judgements: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found');
      }

      const isTeamMember = await prisma.teamMember.findFirst({
        where: {
          userId: req.user?.id,
          teamId: submission.teamId,
        },
      });

      const canView = 
        isTeamMember ||
        req.user?.roles.includes('ADMIN') ||
        req.user?.roles.includes('JUDGE');

      if (!canView) {
        throw new HttpError(403, 'Insufficient permissions to view this submission');
      }

      const response: any = {
        ...submission,
        sourceCode: undefined,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getSource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId,
        },
        select: {
          id: true,
          teamId: true,
          sourceCode: true,
          entryPoint: true,
          language: {
            select: {
              name: true,
              extensions: true,
            },
          },
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found');
      }

      const isTeamMember = await prisma.teamMember.findFirst({
        where: {
          userId: req.user?.id,
          teamId: submission.teamId,
        },
      });

      const canView = 
        isTeamMember ||
        req.user?.roles.includes('ADMIN') ||
        req.user?.roles.includes('JUDGE');

      if (!canView) {
        throw new HttpError(403, 'Insufficient permissions to view source code');
      }

      res.json({
        id: submission.id,
        sourceCode: submission.sourceCode,
        entryPoint: submission.entryPoint,
        language: submission.language,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const { teamId, problemId, status } = req.query;

      const where: any = { contestId };

      if (teamId) where.teamId = teamId;
      if (problemId) where.problemId = problemId;
      if (status) where.status = status;

      if (teamId && !req.user?.roles.includes('ADMIN') && !req.user?.roles.includes('JUDGE')) {
        const isTeamMember = await prisma.teamMember.findFirst({
          where: {
            userId: req.user?.id,
            teamId: teamId as string,
          },
        });

        if (!isTeamMember) {
          throw new HttpError(403, 'Insufficient permissions to view these submissions');
        }
      }

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          problem: {
            select: {
              id: true,
              label: true,
              name: true,
            },
          },
          language: {
            select: {
              id: true,
              name: true,
            },
          },
          judgements: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      res.json(submissions.map(s => ({
        id: s.id,
        teamId: s.teamId,
        contestId: s.contestId,
        problemId: s.problemId,
        languageId: s.languageId,
        timestamp: s.timestamp,
        contestTime: s.contestTime,
        status: s.status,
        isLate: s.isLate,
        deleted: s.deleted,
        team: s.team,
        problem: s.problem,
        language: s.language,
        latestJudgement: s.judgements[0] || null,
      })));
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId,
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found');
      }

      const isTeamMember = await prisma.teamMember.findFirst({
        where: {
          userId: req.user?.id,
          teamId: submission.teamId,
        },
      });

      const canView = 
        isTeamMember ||
        req.user?.roles.includes('ADMIN') ||
        req.user?.roles.includes('JUDGE');

      if (!canView) {
        throw new HttpError(403, 'Insufficient permissions');
      }

      const judgements = await prisma.judgement.findMany({
        where: {
          submissionId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        submissionId,
        judgements,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new HttpError(400, 'Status is required');
      }

      const submission = await prisma.submission.update({
        where: { id: submissionId },
        data: { status },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_SUBMISSION_STATUS',
          entity: 'Submission',
          entityId: submissionId,
          changes: { status },
          ipAddress: req.ip,
        },
      });

      res.json(submission);
    } catch (error) {
      next(error);
    }
  }
}
