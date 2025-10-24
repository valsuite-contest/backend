import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class AnnouncementController {
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
      let where: any = { contestId };

      if (isTeam) {
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: req.user?.id },
          select: { teamId: true },
        });

        if (teamMember) {
          where.OR = [
            { toTeam: null },
            { toTeam: teamMember.teamId },
          ];
        }
      }

      const announcements = await prisma.announcement.findMany({
        where,
        orderBy: { timestamp: 'desc' },
      });

      res.json(announcements);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, announcementId } = req.params;

      const announcement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          contestId: contestId,
        },
      });

      if (!announcement) {
        throw new HttpError(404, 'Announcement not found');
      }

      const isTeam = req.user?.roles.includes('TEAM');
      if (isTeam && announcement.toTeam) {
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: req.user?.id },
          select: { teamId: true },
        });

        if (teamMember?.teamId !== announcement.toTeam) {
          throw new HttpError(403, 'Access denied to this announcement');
        }
      }

      res.json(announcement);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const { subject, body, toTeam, toSite } = req.body;

      if (!subject || !body) {
        throw new HttpError(400, 'Subject and body are required');
      }

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      const announcement = await prisma.announcement.create({
        data: {
          contestId,
          subject,
          body,
          fromUser: req.user?.id,
          toTeam,
          toSite,
          timestamp: new Date(),
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'CLARIFICATION',
          data: {
            announcementId: announcement.id,
            subject: announcement.subject,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_ANNOUNCEMENT',
          entity: 'Announcement',
          entityId: announcement.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(announcement);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, announcementId } = req.params;
      const { subject, body, toTeam, toSite } = req.body;

      const existingAnnouncement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          contestId: contestId,
        },
      });

      if (!existingAnnouncement) {
        throw new HttpError(404, 'Announcement not found');
      }

      const updateData: any = {};
      if (subject !== undefined) updateData.subject = subject;
      if (body !== undefined) updateData.body = body;
      if (toTeam !== undefined) updateData.toTeam = toTeam;
      if (toSite !== undefined) updateData.toSite = toSite;

      const announcement = await prisma.announcement.update({
        where: { id: announcementId },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_ANNOUNCEMENT',
          entity: 'Announcement',
          entityId: announcementId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json(announcement);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, announcementId } = req.params;

      const existingAnnouncement = await prisma.announcement.findFirst({
        where: {
          id: announcementId,
          contestId: contestId,
        },
      });

      if (!existingAnnouncement) {
        throw new HttpError(404, 'Announcement not found');
      }

      await prisma.announcement.delete({
        where: { id: announcementId },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_ANNOUNCEMENT',
          entity: 'Announcement',
          entityId: announcementId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
