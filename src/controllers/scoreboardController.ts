import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

interface ScoringConfig {
  scoringMethod: 'per_problem' | 'per_testcase';
  
  penaltyPerWrongAttempt: number; 
  penaltyAppliesWhen: 'before_accept' | 'all_attempts' | 'never';
  
  tiebreakers: Array<'problems_solved' | 'penalty_time' | 'last_accept_time' | 'first_accept_time' | 'total_attempts' | 'team_name'>;
  
  problemScoring: {
    pointsPerProblem?: number; 
    partialCredit?: boolean;
    testcaseWeights?: { [testcaseIndex: number]: number }; 
  };
  
  countOnlyAccepted: boolean; 
  firstSubmissionBonus?: number; 
  freezeScoreboard: boolean;
}

const ACM_CONFIG: ScoringConfig = {
  scoringMethod: 'per_problem',
  penaltyPerWrongAttempt: 20,
  penaltyAppliesWhen: 'before_accept',
  tiebreakers: ['problems_solved', 'penalty_time', 'last_accept_time'],
  problemScoring: {
    partialCredit: false
  },
  countOnlyAccepted: false,
  freezeScoreboard: true
};

const IOI_CONFIG: ScoringConfig = {
  scoringMethod: 'per_testcase',
  penaltyPerWrongAttempt: 0,
  penaltyAppliesWhen: 'never',
  tiebreakers: ['problems_solved', 'last_accept_time'],
  problemScoring: {
    pointsPerProblem: 100,
    partialCredit: true
  },
  countOnlyAccepted: false,
  freezeScoreboard: false
};

interface TeamScore {
  teamId: string;
  teamName: string;
  affiliation?: string;
  problemsSolved: number;
  totalScore: number;
  penaltyTime: number;
  lastAcceptTime?: Date;
  firstAcceptTime?: Date;
  totalAttempts: number;
  rank?: number;
  problems: {
    [problemId: string]: {
      attempts: number;
      solved: boolean;
      score: number;
      penalty: number;
      firstAcceptTime?: Date;
      submissionCount: number;
      testcasesPassed?: number;
      totalTestcases?: number;
    }
  };
}

export const calculateScoreboard = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    const { config: customConfig, includeDetails = true } = req.query;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: {
          where: { active: true },
          orderBy: { label: 'asc' }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    let config: ScoringConfig;
    if (customConfig) {
      config = JSON.parse(customConfig as string);
    } else if (contest.scoringModel === 'IOI') {
      config = IOI_CONFIG;
    } else {
      config = { ...ACM_CONFIG, penaltyPerWrongAttempt: contest.penaltyTime };
    }

    const now = new Date();
    const isFrozen = config.freezeScoreboard && 
                     contest.freezeTime && 
                     now > contest.freezeTime && 
                     (!contest.thawTime || now < contest.thawTime);

    const teams = await prisma.team.findMany({
      where: {
        submissions: {
          some: {
            contestId: contestId,
            deleted: false
          }
        }
      },
      include: {
        submissions: {
          where: {
            contestId: contestId,
            deleted: false
          },
          include: {
            problem: true,
            judgements: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    const teamScores: TeamScore[] = [];

    for (const team of teams) {
      const teamScore: TeamScore = {
        teamId: team.id,
        teamName: team.name,
        affiliation: team.affiliation || undefined,
        problemsSolved: 0,
        totalScore: 0,
        penaltyTime: 0,
        totalAttempts: 0,
        problems: {}
      };

      const submissionsByProblem = new Map<string, typeof team.submissions>();
      for (const submission of team.submissions) {
        if (!submissionsByProblem.has(submission.problemId)) {
          submissionsByProblem.set(submission.problemId, []);
        }
        submissionsByProblem.get(submission.problemId)!.push(submission);
      }

      for (const problem of contest.problems) {
        const problemSubmissions = submissionsByProblem.get(problem.id) || [];
        
        const visibleSubmissions = isFrozen && contest.freezeTime
          ? problemSubmissions.filter(s => s.timestamp <= contest.freezeTime!)
          : problemSubmissions;

        let problemSolved = false;
        let problemScore = 0;
        let problemPenalty = 0;
        let attemptCount = 0;
        let wrongAttempts = 0;
        let firstAcceptTime: Date | undefined;
        let testcasesPassed = 0;
        let totalTestcases = problem.testDataCount;

        for (const submission of visibleSubmissions) {
          const latestJudgement = submission.judgements[0];
          
          if (!latestJudgement) {
            continue; 
          }

          attemptCount++;
          teamScore.totalAttempts++;

          const isAccepted = latestJudgement.verdict === 'ACCEPTED';

          if (isAccepted) {
            problemSolved = true;
            if (!firstAcceptTime) {
              firstAcceptTime = submission.timestamp;
              
              if (!teamScore.firstAcceptTime || submission.timestamp < teamScore.firstAcceptTime) {
                teamScore.firstAcceptTime = submission.timestamp;
              }
              if (!teamScore.lastAcceptTime || submission.timestamp > teamScore.lastAcceptTime) {
                teamScore.lastAcceptTime = submission.timestamp;
              }
            }

            if (config.scoringMethod === 'per_problem') {
              problemScore = config.problemScoring.pointsPerProblem || 1;
            }

            if (contest.startTime) {
              const acceptTime = Math.floor((submission.timestamp.getTime() - contest.startTime.getTime()) / (1000 * 60));
              problemPenalty = acceptTime;
            }

            if (config.penaltyAppliesWhen === 'before_accept') {
              problemPenalty += wrongAttempts * config.penaltyPerWrongAttempt;
            }

            if (config.scoringMethod === 'per_problem') {
              break;
            }
          } else {
            wrongAttempts++;
            
            if (config.penaltyAppliesWhen === 'all_attempts') {
              problemPenalty += config.penaltyPerWrongAttempt;
            }
          }

          if (config.scoringMethod === 'per_testcase' && config.problemScoring.partialCredit) {
            const passed = latestJudgement.testcasesPassed || 0;
            const total = latestJudgement.testcasesTotal || problem.testDataCount;
            
            if (passed > testcasesPassed) {
              testcasesPassed = passed;
            }
            
            const basePoints = config.problemScoring.pointsPerProblem || 100;
            problemScore = Math.max(problemScore, (passed / total) * basePoints);
          }
        }

        teamScore.problems[problem.id] = {
          attempts: attemptCount,
          solved: problemSolved,
          score: problemScore,
          penalty: problemPenalty,
          firstAcceptTime,
          submissionCount: problemSubmissions.length,
          testcasesPassed,
          totalTestcases
        };

        if (problemSolved) {
          teamScore.problemsSolved++;
        }
        teamScore.totalScore += problemScore;
        teamScore.penaltyTime += problemPenalty;
      }

      teamScores.push(teamScore);
    }

    teamScores.sort((a, b) => {
      for (const tiebreaker of config.tiebreakers) {
        let comparison = 0;
        
        switch (tiebreaker) {
          case 'problems_solved':
            comparison = b.problemsSolved - a.problemsSolved;
            break;
          case 'penalty_time':
            comparison = a.penaltyTime - b.penaltyTime;
            break;
          case 'last_accept_time':
            if (a.lastAcceptTime && b.lastAcceptTime) {
              comparison = a.lastAcceptTime.getTime() - b.lastAcceptTime.getTime();
            } else if (a.lastAcceptTime) {
              comparison = -1;
            } else if (b.lastAcceptTime) {
              comparison = 1;
            }
            break;
          case 'first_accept_time':
            if (a.firstAcceptTime && b.firstAcceptTime) {
              comparison = a.firstAcceptTime.getTime() - b.firstAcceptTime.getTime();
            } else if (a.firstAcceptTime) {
              comparison = -1;
            } else if (b.firstAcceptTime) {
              comparison = 1;
            }
            break;
          case 'total_attempts':
            comparison = a.totalAttempts - b.totalAttempts;
            break;
          case 'team_name':
            comparison = a.teamName.localeCompare(b.teamName);
            break;
        }
        
        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });

    let currentRank = 1;
    for (let i = 0; i < teamScores.length; i++) {
      if (i > 0) {
        const prev = teamScores[i - 1];
        const curr = teamScores[i];
        
        let isTied = true;
        for (const tiebreaker of config.tiebreakers) {
          if (tiebreaker === 'problems_solved' && prev.problemsSolved !== curr.problemsSolved) {
            isTied = false;
            break;
          }
          if (tiebreaker === 'penalty_time' && prev.penaltyTime !== curr.penaltyTime) {
            isTied = false;
            break;
          }
        }
        
        if (!isTied) {
          currentRank = i + 1;
        }
      }
      teamScores[i].rank = currentRank;
    }

    const response: any = {
      contestId: contest.id,
      contestName: contest.name,
      frozen: isFrozen,
      freezeTime: contest.freezeTime,
      thawTime: contest.thawTime,
      scoringConfig: config,
      lastUpdated: new Date(),
      teams: includeDetails === 'false' 
        ? teamScores.map(t => ({
            teamId: t.teamId,
            teamName: t.teamName,
            rank: t.rank,
            problemsSolved: t.problemsSolved,
            totalScore: t.totalScore,
            penaltyTime: t.penaltyTime
          }))
        : teamScores
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating scoreboard:', error);
    res.status(500).json({ error: 'Failed to calculate scoreboard' });
  }
};

export const getFrozenScoreboard = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;
    
    req.query.config = JSON.stringify({
      ...ACM_CONFIG,
      freezeScoreboard: true
    });
    
    return calculateScoreboard(req, res);
  } catch (error) {
    console.error('Error getting frozen scoreboard:', error);
    res.status(500).json({ error: 'Failed to get frozen scoreboard' });
  }
};

export const getTeamScoreboard = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId, teamId } = req.params;

    const mockRes: any = {
      json: (data: any) => data,
      status: (code: number) => mockRes
    };
    
    const mockReq = { ...req };
    await calculateScoreboard(mockReq as AuthRequest, mockRes);
    const scoreboard = mockRes.json();

    if (!scoreboard.teams) {
      return res.status(500).json({ error: 'Failed to calculate scoreboard' });
    }

    const teamScore = scoreboard.teams.find((t: any) => t.teamId === teamId);
    
    if (!teamScore) {
      return res.status(404).json({ error: 'Team not found in scoreboard' });
    }

    res.json({
      contestId,
      team: teamScore
    });
  } catch (error) {
    console.error('Error getting team scoreboard:', error);
    res.status(500).json({ error: 'Failed to get team scoreboard' });
  }
};

export const updateScores = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    const userRoles = req.user?.roles?.map((r: any) => r.role) || [];
    if (!userRoles.includes('ADMIN') && !userRoles.includes('JUDGE')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const mockRes: any = {
      json: (data: any) => data,
      status: (code: number) => mockRes
    };
    
    await calculateScoreboard(req, mockRes);
    const scoreboard = mockRes.json();

    if (!scoreboard.teams) {
      return res.status(500).json({ error: 'Failed to calculate scoreboard' });
    }

    for (const teamScore of scoreboard.teams) {
      await prisma.score.upsert({
        where: {
          teamId_contestId: {
            teamId: teamScore.teamId,
            contestId: contestId
          }
        },
        update: {
          problemsSolved: teamScore.problemsSolved,
          penaltyTime: teamScore.penaltyTime,
          lastCorrectTime: teamScore.lastAcceptTime,
          rankingPosition: teamScore.rank,
          problemBreakdown: teamScore.problems,
          updatedAt: new Date()
        },
        create: {
          teamId: teamScore.teamId,
          contestId: contestId,
          problemsSolved: teamScore.problemsSolved,
          penaltyTime: teamScore.penaltyTime,
          lastCorrectTime: teamScore.lastAcceptTime,
          rankingPosition: teamScore.rank,
          problemBreakdown: teamScore.problems
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SCOREBOARD_UPDATE',
        entity: 'Contest',
        entityId: contestId,
        changes: { teamsUpdated: scoreboard.teams.length },
        ipAddress: (req as any).ip
      }
    });

    res.json({ 
      message: 'Scoreboard updated successfully',
      teamsUpdated: scoreboard.teams.length
    });
  } catch (error) {
    console.error('Error updating scores:', error);
    res.status(500).json({ error: 'Failed to update scores' });
  }
};

export const getScoreboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: { where: { active: true } },
        submissions: {
          where: { deleted: false },
          include: {
            judgements: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    const stats = {
      totalTeams: await prisma.team.count({
        where: {
          submissions: {
            some: {
              contestId: contestId,
              deleted: false
            }
          }
        }
      }),
      totalSubmissions: contest.submissions.length,
      totalProblems: contest.problems.length,
      problemStats: {} as any
    };

    for (const problem of contest.problems) {
      const problemSubmissions = contest.submissions.filter(s => s.problemId === problem.id);
      const acceptedSubmissions = problemSubmissions.filter(s => 
        s.judgements[0]?.verdict === 'ACCEPTED'
      );

      stats.problemStats[problem.label] = {
        problemId: problem.id,
        label: problem.label,
        name: problem.name,
        totalSubmissions: problemSubmissions.length,
        acceptedSubmissions: acceptedSubmissions.length,
        acceptanceRate: problemSubmissions.length > 0 
          ? (acceptedSubmissions.length / problemSubmissions.length * 100).toFixed(2) + '%'
          : '0%',
        uniqueSolvers: new Set(acceptedSubmissions.map(s => s.teamId)).size,
        firstSolver: acceptedSubmissions.length > 0 
          ? await prisma.team.findUnique({
              where: { id: acceptedSubmissions[0].teamId },
              select: { name: true }
            })
          : null
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting scoreboard stats:', error);
    res.status(500).json({ error: 'Failed to get scoreboard statistics' });
  }
};

export const exportScoreboardHTML = async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = req.params;

    const mockRes: any = {
      json: (data: any) => data,
      status: (code: number) => mockRes
    };
    
    await calculateScoreboard(req, mockRes);
    const scoreboard = mockRes.json();

    if (!scoreboard.teams) {
      return res.status(500).json({ error: 'Failed to calculate scoreboard' });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${scoreboard.contestName} - Scoreboard</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; text-align: center; }
    .info { text-align: center; margin-bottom: 20px; color: #666; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #4CAF50; color: white; font-weight: bold; }
    tr:hover { background: #f9f9f9; }
    .rank { font-weight: bold; color: #4CAF50; }
    .frozen { background: #fff3cd; padding: 10px; text-align: center; margin-bottom: 20px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${scoreboard.contestName} - Scoreboard</h1>
  <div class="info">
    ${scoreboard.frozen ? '<div class="frozen">⚠️ Scoreboard is FROZEN</div>' : ''}
    Last Updated: ${new Date().toLocaleString()}
  </div>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Team</th>
        <th>Problems Solved</th>
        <th>Total Score</th>
        <th>Penalty Time</th>
      </tr>
    </thead>
    <tbody>
      ${scoreboard.teams.map((team: any) => `
        <tr>
          <td class="rank">${team.rank}</td>
          <td>${team.teamName}${team.affiliation ? ` (${team.affiliation})` : ''}</td>
          <td>${team.problemsSolved}</td>
          <td>${team.totalScore}</td>
          <td>${team.penaltyTime}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="scoreboard-${contestId}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Error exporting scoreboard HTML:', error);
    res.status(500).json({ error: 'Failed to export scoreboard' });
  }
};
