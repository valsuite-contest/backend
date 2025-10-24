import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { ClarificationStatus } from '@prisma/client';

export class ClarificationController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      const isTeam = req.user?.roles.includes('TEAM');
      const teamMember = isTeam ? await prisma.teamMember.findFirst({
        where: { userId: req.user?.id },
        select: { teamId: true },
      }) : null;

      const where: any = { contestId };
      
      if (isTeam && teamMember) {
        where.OR = [
          { teamId: teamMember.teamId },
          { isPublic: true },
        ];
      }

      const clarifications = await prisma.clarification.findMany({
        where,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { timestampSubmitted: 'desc' },
      });

      res.json(clarifications);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, clarificationId } = req.params;

      const clarification = await prisma.clarification.findFirst({
        where: {
          id: clarificationId,
          contestId: contestId,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!clarification) {
        throw new HttpError(404, 'Clarification not found');
      }

      const isTeam = req.user?.roles.includes('TEAM');
      if (isTeam) {
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: req.user?.id },
          select: { teamId: true },
        });

        if (teamMember?.teamId !== clarification.teamId && !clarification.isPublic) {
          throw new HttpError(403, 'Access denied to this clarification');
        }
      }

      res.json(clarification);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const { questionText } = req.body;

      if (!questionText) {
        throw new HttpError(400, 'Question text is required');
      }

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      const teamMember = await prisma.teamMember.findFirst({
        where: { userId: req.user?.id },
        select: { teamId: true },
      });

      if (!teamMember) {
        throw new HttpError(403, 'User is not part of any team');
      }

      const clarification = await prisma.clarification.create({
        data: {
          contestId,
          teamId: teamMember.teamId,
          questionText,
          status: ClarificationStatus.PENDING,
        },
        include: {
          team: {
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
          type: 'CLARIFICATION',
          data: {
            clarificationId: clarification.id,
            teamId: teamMember.teamId,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_CLARIFICATION',
          entity: 'Clarification',
          entityId: clarification.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(clarification);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, clarificationId } = req.params;
      const { answerText, status, isPublic } = req.body;

      const existingClarification = await prisma.clarification.findFirst({
        where: {
          id: clarificationId,
          contestId: contestId,
        },
      });

      if (!existingClarification) {
        throw new HttpError(404, 'Clarification not found');
      }

      const updateData: any = {};
      if (answerText !== undefined) {
        updateData.answerText = answerText;
        updateData.timestampAnswered = new Date();
      }
      if (status !== undefined) updateData.status = status;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      const clarification = await prisma.clarification.update({
        where: { id: clarificationId },
        data: updateData,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_CLARIFICATION',
          entity: 'Clarification',
          entityId: clarificationId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json(clarification);
    } catch (error) {
      next(error);
    }
  }
}
