import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { ContestStatus, SiteStatus } from '@prisma/client';

export class SiteController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sites = await prisma.site.findMany({
        include: {
          _count: {
            select: {
              teams: true,
              submissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(sites);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: {
          teams: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      if (!site) {
        throw new HttpError(404, 'Site not found');
      }

      res.json(site);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, location, serverAddress, timezone, status } = req.body;

      if (!name) {
        throw new HttpError(400, 'Site name is required');
      }

      const site = await prisma.site.create({
        data: {
          name,
          location,
          serverAddress,
          timezone,
          status: status || 'DISCONNECTED',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_SITE',
          entity: 'Site',
          entityId: site.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(site);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;
      const { name, location, serverAddress, timezone, status } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (serverAddress !== undefined) updateData.serverAddress = serverAddress;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (status) updateData.status = status;

      const site = await prisma.site.update({
        where: { id: siteId },
        data: updateData,
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPDATE_SITE',
          entity: 'Site',
          entityId: siteId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json(site);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      await prisma.site.delete({
        where: { id: siteId },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_SITE',
          entity: 'Site',
          entityId: siteId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Site deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async connect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      const site = await prisma.site.update({
        where: { id: siteId },
        data: { status: 'CONNECTED' },
      });

      await prisma.event.create({
        data: {
          type: 'SITE_CONNECTED',
          data: { siteId: site.id, name: site.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'SITE_CONNECTED',
          entity: 'Site',
          entityId: siteId,
          ipAddress: req.ip,
        },
      });

      res.json(site);
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      const site = await prisma.site.update({
        where: { id: siteId },
        data: { status: 'DISCONNECTED' },
      });

      await prisma.event.create({
        data: {
          type: 'SITE_DISCONNECTED',
          data: { siteId: site.id, name: site.name },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'SITE_DISCONNECTED',
          entity: 'Site',
          entityId: siteId,
          ipAddress: req.ip,
        },
      });

      res.json(site);
    } catch (error) {
      next(error);
    }
  }

  async getTeams(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      const teams = await prisma.team.findMany({
        where: { siteId },
        include: {
          members: true,
        },
      });

      res.json(teams);
    } catch (error) {
      next(error);
    }
  }

  async getSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;
      const { contestId } = req.query;

      const where: any = { siteId };
      if (contestId) where.contestId = contestId;

      const submissions = await prisma.submission.findMany({
        where,
        include: {
          team: true,
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

  async exportData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;

      const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: {
          teams: {
            include: {
              members: true,
              submissions: true,
            },
          },
          submissions: {
            include: {
              judgements: true,
            },
          },
        },
      });

      if (!site) {
        throw new HttpError(404, 'Site not found');
      }

      const exportData = await prisma.syncExport.create({
        data: {
          originSiteId: siteId,
          dataPackage: site as any,
          status: 'COMPLETED',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'EXPORT_SITE_DATA',
          entity: 'Site',
          entityId: siteId,
          ipAddress: req.ip,
        },
      });

      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }

  async importData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { siteId } = req.params;
      const { dataPackage } = req.body;

      if (!dataPackage) {
        throw new HttpError(400, 'Data package is required');
      }

      const importRecord = await prisma.syncImport.create({
        data: {
          targetSiteId: siteId,
          dataPackage,
          status: 'COMPLETED',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'IMPORT_SITE_DATA',
          entity: 'Site',
          entityId: siteId,
          ipAddress: req.ip,
        },
      });

      res.json(importRecord);
    } catch (error) {
      next(error);
    }
  }
}
