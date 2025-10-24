import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export class ProblemController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });
      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      const problems = await prisma.problem.findMany({
        where: { contestId },
        include: {
          _count: {
            select: {
              submissions: true,
              testData: true,
            },
          },
        },
        orderBy: { label: 'asc' },
      });

      res.json(problems);
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, problemId } = req.params;

      const problem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
        include: {
          contest: {
            select: {
              id: true,
              name: true,
            },
          },
          testData: {
            select: {
              id: true,
              order: true,
              createdAt: true,
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      });

      if (!problem) {
        throw new HttpError(404, 'Problem not found');
      }

      res.json(problem);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const {
        label,
        name,
        title,
        timeLimit,
        memoryLimit,
        specialJudge,
        interactive,
        archiveLocation,
        active,
      } = req.body;

      if (!label || !name) {
        throw new HttpError(400, 'Label and name are required');
      }

      const contest = await prisma.contest.findUnique({
        where: { id: contestId },
      });

      if (!contest) {
        throw new HttpError(404, 'Contest not found');
      }

      const existingProblem = await prisma.problem.findFirst({
        where: {
          contestId,
          label,
        },
      });

      if (existingProblem) {
        throw new HttpError(400, `Problem with label '${label}' already exists in this contest`);
      }

      const problem = await prisma.problem.create({
        data: {
          contestId,
          label,
          name,
          title,
          timeLimit: timeLimit || 5000,
          memoryLimit: memoryLimit || 256,
          specialJudge: specialJudge || false,
          interactive: interactive || false,
          archiveLocation,
          active: active !== undefined ? active : true,
        },
        include: {
          contest: {
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
          type: 'PROBLEM_ADDED',
          data: {
            problemId: problem.id,
            label: problem.label,
            name: problem.name,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'CREATE_PROBLEM',
          entity: 'Problem',
          entityId: problem.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(problem);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, problemId } = req.params;
      const {
        label,
        name,
        title,
        timeLimit,
        memoryLimit,
        specialJudge,
        interactive,
        archiveLocation,
        active,
      } = req.body;

      const existingProblem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
      });

      if (!existingProblem) {
        throw new HttpError(404, 'Problem not found');
      }

      if (label && label !== existingProblem.label) {
        const labelConflict = await prisma.problem.findFirst({
          where: {
            contestId,
            label,
            id: { not: problemId },
          },
        });

        if (labelConflict) {
          throw new HttpError(400, `Problem with label '${label}' already exists in this contest`);
        }
      }

      const updateData: any = {};
      if (label !== undefined) updateData.label = label;
      if (name !== undefined) updateData.name = name;
      if (title !== undefined) updateData.title = title;
      if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
      if (memoryLimit !== undefined) updateData.memoryLimit = memoryLimit;
      if (specialJudge !== undefined) updateData.specialJudge = specialJudge;
      if (interactive !== undefined) updateData.interactive = interactive;
      if (archiveLocation !== undefined) updateData.archiveLocation = archiveLocation;
      if (active !== undefined) updateData.active = active;

      const problem = await prisma.problem.update({
        where: { id: problemId },
        data: updateData,
        include: {
          contest: {
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
          action: 'UPDATE_PROBLEM',
          entity: 'Problem',
          entityId: problemId,
          changes: updateData,
          ipAddress: req.ip,
        },
      });

      res.json(problem);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, problemId } = req.params;

      const existingProblem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
      });

      if (!existingProblem) {
        throw new HttpError(404, 'Problem not found');
      }

      await prisma.problem.update({
        where: { id: problemId },
        data: { active: false },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_PROBLEM',
          entity: 'Problem',
          entityId: problemId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Problem deactivated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async uploadTestData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, problemId } = req.params;
      const { inputFile, outputFile, order } = req.body;

      if (!inputFile || !outputFile) {
        throw new HttpError(400, 'Input file and output file are required');
      }

      const problem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
      });

      if (!problem) {
        throw new HttpError(404, 'Problem not found');
      }

      let testOrder = order;
      if (testOrder === undefined || testOrder === null) {
        const lastTest = await prisma.testData.findFirst({
          where: { problemId },
          orderBy: { order: 'desc' },
          select: { order: true },
        });
        testOrder = lastTest ? lastTest.order + 1 : 1;
      }

      const testData = await prisma.testData.create({
        data: {
          problemId,
          inputFile,
          outputFile,
          order: testOrder,
        },
      });

      await prisma.problem.update({
        where: { id: problemId },
        data: {
          testDataCount: {
            increment: 1,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'UPLOAD_TEST_DATA',
          entity: 'TestData',
          entityId: testData.id,
          ipAddress: req.ip,
        },
      });

      res.status(201).json(testData);
    } catch (error) {
      next(error);
    }
  }

  async listTestData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, problemId } = req.params;

      const problem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
      });

      if (!problem) {
        throw new HttpError(404, 'Problem not found');
      }

      const testData = await prisma.testData.findMany({
        where: { problemId },
        orderBy: { order: 'asc' },
      });

      res.json(testData);
    } catch (error) {
      next(error);
    }
  }

  async deleteTestData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, problemId, testDataId } = req.params;

      const problem = await prisma.problem.findFirst({
        where: {
          id: problemId,
          contestId: contestId,
        },
      });

      if (!problem) {
        throw new HttpError(404, 'Problem not found');
      }

      const testData = await prisma.testData.findFirst({
        where: {
          id: testDataId,
          problemId,
        },
      });

      if (!testData) {
        throw new HttpError(404, 'Test data not found');
      }

      await prisma.testData.delete({
        where: { id: testDataId },
      });

      await prisma.problem.update({
        where: { id: problemId },
        data: {
          testDataCount: {
            decrement: 1,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'DELETE_TEST_DATA',
          entity: 'TestData',
          entityId: testDataId,
          ipAddress: req.ip,
        },
      });

      res.json({ message: 'Test data deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
