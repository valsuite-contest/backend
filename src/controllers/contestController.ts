import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { ContestStatus, EventType } from '@prisma/client';

export class ContestController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contests = await prisma.contest.findMany({
        include: {
          _count: {
            select: {
              problems: true,
              submissions: true,
              languages: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(contests);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        include: {
          problems: true,
          languages: {
            include: {
              language: true,
            },
          },
          _count: {
            select: {
              submissions: true,
              clarifications: true,
            },
          },
        },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        name,
        startTime,
        endTime,
        duration,
        freezeTime,
        thawTime,
        contestType,
        scoringModel,
        penaltyTime,
        scoreboardFreeze,
        multiSiteMode,
      } = req.body;

      if (!name) {
        throw new HttpError(400, 'Contest name is required');
      }

      const contest = await prisma.contest.create({
        data: {
          name,
          startTime: startTime ? new Date(startTime) : undefined,
          endTime: endTime ? new Date(endTime) : undefined,
          duration,
          freezeTime: freezeTime ? new Date(freezeTime) : undefined,
          thawTime: thawTime ? new Date(thawTime) : undefined,
          contestType,
          scoringModel,
          penaltyTime,
          scoreboardFreeze,
          multiSiteMode,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_CONTEST',
          entity: 'Contest',
          entityId: contest.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(contest);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const updateData: any = {};

      const allowedFields = [
        'name',
        'startTime',
        'endTime',
        'duration',
        'freezeTime',
        'thawTime',
        'contestType',
        'scoringModel',
        'penaltyTime',
        'scoreboardFreeze',
        'multiSiteMode',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field.includes('Time')) {
            updateData[field] = new Date(req.body[field]);
          } else {
            updateData[field] = req.body[field];
          }
        }
      }

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      await prisma.contest.delete({
        where: { id: contestId },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Contest deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async start(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
          status: 'RUNNING',
          startTime: new Date(),
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'CONTEST_STARTED',
          data: { contestId, name: contest.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'START_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async pause(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: { status: 'PAUSED' },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'CONTEST_PAUSED',
          data: { contestId, name: contest.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'PAUSE_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async resume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: { status: 'RUNNING' },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'CONTEST_RESUMED',
          data: { contestId, name: contest.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'RESUME_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async freeze(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
          scoreboardFreeze: true,
          freezeTime: new Date(),
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'SCOREBOARD_UPDATE',
          data: { contestId, frozen: true },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'FREEZE_SCOREBOARD',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async thaw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
          scoreboardFreeze: false,
          thawTime: new Date(),
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'SCOREBOARD_UPDATE',
          data: { contestId, frozen: false },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'THAW_SCOREBOARD',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async end(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
          status: 'ENDED',
          endTime: new Date(),
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'CONTEST_ENDED',
          data: { contestId, name: contest.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'END_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async finalize(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.update({
        where: { id: contestId },
        data: {
          status: 'FINALIZED',
          finalizationTime: new Date(),
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'CONTEST_FINALIZED',
          data: { contestId, name: contest.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'FINALIZE_CONTEST',
          entity: 'Contest',
          entityId: contestId,
          ipAddress: req.ip,
        },
      });

      res.json(contest);
    } catch (error) {
      next(error);
    }
  }

  async getState(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
        select: {
          id: true,
          name: true,
          status: true,
          startTime: true,
          endTime: true,
          duration: true,
          scoreboardFreeze: true,
          freezeTime: true,
          thawTime: true,
        },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      let timeRemaining = null;
      if (contest.status === 'RUNNING' && contest.startTime && contest.duration) {
        const endTime = new Date(contest.startTime.getTime() + contest.duration * 60000);
        timeRemaining = Math.max(0, endTime.getTime() - Date.now());
      }

      res.json({
        ...contest,
        timeRemaining,
      });
    } catch (error) {
      next(error);
    }
  }
}
