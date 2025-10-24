import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class TeamController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId, contestId } = req.query;
      const where: any = {};
      
      if (siteId) where.siteId = siteId;
      
      const teams = await prisma.team.findMany({
        where,
        include: {
          site: true,
          members: true,
          _count: {
            select: {
              submissions: contestId ? { where: { contestId: contestId as string } } : true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(teams);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          site: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!team) {
        throw new HttpError(404, 'Team not found');
      }

      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, affiliation, institution, siteId, contactInfo, members } = req.body;

      if (!name) {
        throw new HttpError(400, 'Team name is required');
      }

      const team = await prisma.team.create({
        data: {
          name,
          affiliation,
          institution,
          siteId,
          contactInfo,
          members: members ? {
            create: members.map((m: any) => ({
              name: m.name,
              userId: m.userId,
            })),
          } : undefined,
        },
        include: {
          members: true,
          site: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_TEAM',
          entity: 'Team',
          entityId: team.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { name, affiliation, institution, siteId, contactInfo, status } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (affiliation !== undefined) updateData.affiliation = affiliation;
      if (institution !== undefined) updateData.institution = institution;
      if (siteId !== undefined) updateData.siteId = siteId;
      if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
      if (status && req.user?.roles.includes('ADMIN')) updateData.status = status;

      const team = await prisma.team.update({
        where: { id: teamId },
        data: updateData,
        include: {
          members: true,
          site: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_TEAM',
          entity: 'Team',
          entityId: teamId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;

      await prisma.team.update({
        where: { id: teamId },
        data: { status: 'INACTIVE' },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_TEAM',
          entity: 'Team',
          entityId: teamId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Team deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;

      const members = await prisma.teamMember.findMany({
        where: { teamId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      res.json(members);
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { name, userId } = req.body;

      if (!name) {
        throw new HttpError(400, 'Member name is required');
      }

      const member = await prisma.teamMember.create({
        data: {
          teamId,
          name,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'ADD_TEAM_MEMBER',
          entity: 'Team',
          entityId: teamId,
          changes: { memberId: member.id },
          ipAddress: req.ip,
        },
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId, memberId } = req.params;

      await prisma.teamMember.delete({
        where: { id: memberId },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'REMOVE_TEAM_MEMBER',
          entity: 'Team',
          entityId: teamId,
          changes: { memberId },
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async assignSite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { siteId } = req.body;

      const team = await prisma.team.update({
        where: { id: teamId },
        data: { siteId },
        include: { site: true },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'ASSIGN_SITE',
          entity: 'Team',
          entityId: teamId,
          changes: { siteId },
          ipAddress: req.ip,
        },
      });

      res.json(team);
    } catch (error) {
      next(error);
    }
  }

  async getRuns(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { contestId } = req.query;

      const where: any = { teamId };
      if (contestId) where.contestId = contestId;

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          problem: true,
          language: true,
          judgements: true,
        },
        orderBy: { timestamp: 'desc' },
      });

      res.json(submissions);
    } catch (error) {
      next(error);
    }
  }

  async getClarifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { contestId } = req.query;

      const where: any = { teamId };
      if (contestId) where.contestId = contestId;

      const clarifications = await prisma.clarification.findMany({
        where,
        include: {
          contest: {
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

  async getScore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { teamId } = req.params;
      const { contestId } = req.query;

      if (!contestId) {
        throw new HttpError(400, 'Contest ID is required');
      }

      const score = await prisma.score.findUnique({
        where: {
          teamId_contestId: {
            teamId,
            contestId: contestId as string,
          },
        },
        include: {
          team: true,
          contest: true,
        },
      });

      if (!score) {
        res.json({
          teamId,
          contestId,
          problemsSolved: 0,
          penaltyTime: 0,
          problemBreakdown: {},
        });
        return;
      }

      res.json(score);
    } catch (error) {
      next(error);
    }
  }
}
