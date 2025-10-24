import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { HttpError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Verdict, SubmissionStatus } from '@prisma/client';

export class JudgementController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;
      const { verdict, testCase, runTime, runMemory, comment } = req.body;

      if (!verdict) {
        throw new HttpError(400, 'Verdict is required');
      }

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId: contestId,
        },
        include: {
          problem: true,
          language: true,
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found in this contest');
      }

      const judgement = await prisma.judgement.create({
        data: {
          submissionId,
          verdict,
          testCase,
          runTime,
          runMemory,
          comment,
          endTime: new Date(),
        },
      });

      let newStatus = submission.status;
      switch (verdict) {
        case 'ACCEPTED':
          newStatus = 'ACCEPTED';
          break;
        case 'WRONG_ANSWER':
          newStatus = 'WRONG_ANSWER';
          break;
        case 'TIME_LIMIT_EXCEEDED':
          newStatus = 'TIME_LIMIT';
          break;
        case 'MEMORY_LIMIT_EXCEEDED':
          newStatus = 'MEMORY_LIMIT';
          break;
        case 'RUNTIME_ERROR':
          newStatus = 'RUNTIME_ERROR';
          break;
        case 'COMPILATION_ERROR':
          newStatus = 'COMPILE_ERROR';
          break;
        default:
          newStatus = 'JUDGED';
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: newStatus,
          executionTime: runTime,
          memoryUsed: runMemory,
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'JUDGEMENT',
          data: {
            submissionId,
            judgementId: judgement.id,
            verdict,
            testCase,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || '',
          action: 'JUDGEMENT_CREATE',
          entity: 'judgement',
          entityId: judgement.id,
          changes: {
            submissionId,
            verdict,
            testCase,
          },
          ipAddress: req.ip,
        },
      });

      res.status(201).json({
        success: true,
        data: judgement,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get judgement details
   * GET /api/contests/:contestId/judgements/:judgementId
   */
  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, judgementId } = req.params;

      const judgement = await prisma.judgement.findFirst({
        where: {
          id: judgementId,
          submission: {
            contestId: contestId,
          },
        },
        include: {
          submission: {
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
          },
        },
      });

      if (!judgement) {
        throw new HttpError(404, 'Judgement not found');
      }

      const isJudgeOrAdmin = req.user?.roles?.includes('JUDGE') || req.user?.roles?.includes('ADMIN');
      const isOwnTeam = await this.isUserInTeam(req.user?.id || '', judgement.submission.teamId);

      if (!isJudgeOrAdmin && !isOwnTeam) {
        throw new HttpError(403, 'Access denied');
      }

      res.json({
        success: true,
        data: judgement,
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;
      const { submissionId, verdict, page = '1', limit = '50' } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {
        submission: {
          contestId: contestId,
        },
      };

      if (submissionId) {
        where.submissionId = submissionId as string;
      }

      if (verdict) {
        where.verdict = verdict as string;
      }

      const isJudgeOrAdmin = req.user?.roles?.includes('JUDGE') || req.user?.roles?.includes('ADMIN');

      if (!isJudgeOrAdmin) {
        const teamMember = await prisma.teamMember.findFirst({
          where: { userId: req.user?.id },
        });

        if (!teamMember) {
          throw new HttpError(403, 'Access denied');
        }

        where.submission = {
          ...where.submission,
          teamId: teamMember.teamId,
        };
      }

      const [judgements, total] = await Promise.all([
        prisma.judgement.findMany({
          where,
          include: {
            submission: {
              select: {
                id: true,
                contestTime: true,
                teamId: true,
                problemId: true,
                team: {
                  select: {
                    name: true,
                  },
                },
                problem: {
                  select: {
                    label: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.judgement.count({ where }),
      ]);

      res.json({
        success: true,
        data: judgements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rejudge a submission
   * POST /api/contests/:contestId/submissions/:submissionId/rejudge
   */
  async rejudge(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;
      const { reason } = req.body;

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId: contestId,
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found');
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.QUEUED,
          executionTime: null,
          memoryUsed: null,
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'SUBMISSION',
          data: {
            submissionId,
            reason: reason || 'Manual rejudge',
            requestedBy: req.user?.id,
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || '',
          action: 'SUBMISSION_REJUDGE',
          entity: 'submission',
          entityId: submissionId,
          changes: {
            reason: reason || 'Manual rejudge',
          },
          ipAddress: req.ip,
        },
      });

      res.json({
        success: true,
        message: 'Submission queued for rejudging',
        data: {
          submissionId,
          status: 'QUEUED',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async execute(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId: contestId,
        },
        include: {
          problem: {
            include: {
              testData: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
          language: true,
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found');
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.RUNNING,
        },
      });

      const results = [];
      let allPassed = true;
      let totalTime = 0;
      let maxMemory = 0;

      for (const testData of submission.problem.testData) {
        const result = await this.simulateExecution(
          submission.sourceCode,
          testData,
          submission.problem.timeLimit,
          submission.problem.memoryLimit
        );

        results.push({
          testCase: testData.order,
          verdict: result.verdict,
          time: result.time,
          memory: result.memory,
        });

        totalTime += result.time;
        maxMemory = Math.max(maxMemory, result.memory);

        if (result.verdict !== 'ACCEPTED') {
          allPassed = false;
          await prisma.judgement.create({
            data: {
              submissionId,
              verdict: result.verdict as Verdict,
              testCase: testData.order,
              runTime: result.time,
              runMemory: result.memory,
              endTime: new Date(),
            },
          });
          break; 
        }
      }

      const finalVerdict = allPassed ? 'ACCEPTED' : results[results.length - 1].verdict;
      const judgement = await prisma.judgement.create({
        data: {
          submissionId,
          verdict: finalVerdict as Verdict,
          runTime: totalTime,
          runMemory: maxMemory,
          endTime: new Date(),
        },
      });

      const finalStatus = this.verdictToStatus(finalVerdict);
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: finalStatus,
          executionTime: totalTime,
          memoryUsed: maxMemory,
        },
      });

      await prisma.event.create({
        data: {
          contestId,
          type: 'JUDGEMENT',
          data: {
            submissionId,
            judgementId: judgement.id,
            verdict: finalVerdict,
            executionTime: totalTime,
          },
        },
      });

      res.json({
        success: true,
        data: {
          judgement,
          results,
          summary: {
            totalTests: submission.problem.testData.length,
            passed: allPassed ? submission.problem.testData.length : results.length - 1,
            totalTime,
            maxMemory,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get judgement statistics for a contest
   * GET /api/contests/:contestId/judgements/stats
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const verdictCounts = await prisma.judgement.groupBy({
        by: ['verdict'],
        where: {
          submission: {
            contestId: contestId,
          },
        },
        _count: {
          verdict: true,
        },
      });

      const stats = {
        total: 0,
        byVerdict: {} as Record<string, number>,
      };

      verdictCounts.forEach((item: any) => {
        stats.byVerdict[item.verdict] = item._count.verdict;
        stats.total += item._count.verdict;
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }


  private async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        teamId,
      },
    });
    return !!teamMember;
  }

  private verdictToStatus(verdict: string): SubmissionStatus {
    const mapping: Record<string, SubmissionStatus> = {
      'ACCEPTED': SubmissionStatus.ACCEPTED,
      'WRONG_ANSWER': SubmissionStatus.WRONG_ANSWER,
      'TIME_LIMIT_EXCEEDED': SubmissionStatus.TIME_LIMIT,
      'MEMORY_LIMIT_EXCEEDED': SubmissionStatus.MEMORY_LIMIT,
      'RUNTIME_ERROR': SubmissionStatus.RUNTIME_ERROR,
      'COMPILATION_ERROR': SubmissionStatus.COMPILE_ERROR,
      'PRESENTATION_ERROR': SubmissionStatus.ERROR,
      'OUTPUT_LIMIT_EXCEEDED': SubmissionStatus.ERROR,
      'INTERNAL_ERROR': SubmissionStatus.ERROR,
    };
    return mapping[verdict] || SubmissionStatus.JUDGED;
  }

  private async simulateExecution(
    sourceCode: string,
    testData: any,
    timeLimit: number,
    memoryLimit: number
  ): Promise<{ verdict: string; time: number; memory: number }> {
    const time = Math.floor(Math.random() * timeLimit * 0.8);
    const memory = Math.floor(Math.random() * memoryLimit * 0.8);
    
    const random = Math.random();
    let verdict = 'ACCEPTED';
    
    if (random > 0.8) {
      const verdicts = ['WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR'];
      verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    }

    return { verdict, time, memory };
  }

  async compile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId, submissionId } = req.params;

      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
          contestId: contestId,
        },
        include: {
          language: true,
        },
      });

      if (!submission) {
        throw new HttpError(404, 'Submission not found');
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.COMPILING,
        },
      });

      const compileResult = await this.simulateCompilation(
        submission.sourceCode,
        submission.language
      );

      if (!compileResult.success) {
        await prisma.judgement.create({
          data: {
            submissionId,
            verdict: Verdict.COMPILATION_ERROR,
            comment: compileResult.error,
            endTime: new Date(),
          },
        });

        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.COMPILE_ERROR,
            logs: compileResult.error,
          },
        });

        return res.json({
          success: false,
          message: 'Compilation failed',
          data: {
            error: compileResult.error,
          },
        });
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.QUEUED,
        },
      });

      res.json({
        success: true,
        message: 'Compilation successful',
        data: {
          submissionId,
          status: 'QUEUED',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private async simulateCompilation(
    sourceCode: string,
    language: any
  ): Promise<{ success: boolean; error?: string }> {
    if (sourceCode.length < 10) {
      return {
        success: false,
        error: 'Source code is too short',
      };
    }

    if (Math.random() > 0.95) {
      return {
        success: false,
        error: 'Compilation error: syntax error at line 10',
      };
    }

    return { success: true };
  }

  async getQueueStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contestId } = req.params;

      const queuedCount = await prisma.submission.count({
        where: {
          contestId: contestId,
          status: {
            in: ['QUEUED', 'COMPILING', 'RUNNING'],
          },
        },
      });

      const statusBreakdown = await prisma.submission.groupBy({
        by: ['status'],
        where: {
          contestId: contestId,
          status: {
            in: ['QUEUED', 'COMPILING', 'RUNNING'],
          },
        },
        _count: {
          status: true,
        },
      });

      const breakdown: Record<string, number> = {};
      statusBreakdown.forEach((item: any) => {
        breakdown[item.status] = item._count.status;
      });

      res.json({
        success: true,
        data: {
          total: queuedCount,
          breakdown,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
