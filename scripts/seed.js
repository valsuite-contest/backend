const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Creating the admin");
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@admin.com',
      passwordHash,
      displayName: 'admin',
      status: 'ACTIVE',
      roles: {
        create: [{ role: 'ADMIN' }, { role: 'JUDGE' }],
      },
    },
  });
  console.log(`Created the admin user ${adminUser.username}`);

  console.log('Creating the judge');
  const judgePasswordHash = await bcrypt.hash('judge123', 10);
  
  const judgeUser = await prisma.user.upsert({
    where: { username: 'judge' },
    update: {},
    create: {
      username: 'judge',
      email: 'judge@judge.com',
      passwordHash: judgePasswordHash,
      displayName: 'judge',
      status: 'ACTIVE',
      roles: {
        create: [{ role: 'JUDGE' }],
      },
    },
  });
  console.log(`Created the judge user ${judgeUser.username}`);
  console.log('Creating the team');
  const teamPasswordHash = await bcrypt.hash('team123', 10);
  
  const teamUser = await prisma.user.upsert({
    where: { username: 'team1' },
    update: {},
    create: {
      username: 'team1',
      email: 'team1@example.com',
      passwordHash: teamPasswordHash,
      displayName: 'Team 1',
      status: 'ACTIVE',
      roles: {
        create: [{ role: 'TEAM' }],
      },
    },
  });
  console.log(`user created ${teamUser.username}`);

  console.log('Creating test site');
  const mainSite = await prisma.site.upsert({
    where: { id: 'main-site' },
    update: {},
    create: {
      id: 'main-site',
      name: 'Main Commons',
      location: 'Main Cafeteria',
      serverAddress: 'ip.maybeusedlateridk.com',
      timezone: 'CDT',
      status: 'CONNECTED',
    },
  });
  console.log(`test site created ${mainSite.name}`);

  console.log('creating languages');
  
  const languages = [
    {
      name: 'C++',
      extensions: ['cpp', 'cc', 'cxx'],
      compilerCommand: 'g++ -std=c++17 -O2 -Wall',
      runnerCommand: './a.out',
      entryPointRequired: false,
      defaultTimeLimit: 2000,
      defaultMemoryLimit: 256,
    },
    {
      name: 'Java',
      extensions: ['java'],
      compilerCommand: 'javac',
      runnerCommand: 'java Main',
      entryPointRequired: true,
      defaultTimeLimit: 3000,
      defaultMemoryLimit: 512,
    },
    {
      name: 'Python 3',
      extensions: ['py'],
      compilerCommand: null,
      runnerCommand: 'python3',
      entryPointRequired: false,
      defaultTimeLimit: 5000,
      defaultMemoryLimit: 256,
    },
  ];

  for (const lang of languages) {
    const language = await prisma.language.upsert({
      where: { name: lang.name },
      update: {},
      create: lang,
    });
    console.log(`created ${language.name}`);
  }

  console.log('Creating a contest now');
  
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1);
  
  const contest = await prisma.contest.create({
    data: {
      name: 'SLHS October Contest',
      startTime,
      duration: 180, // 3 hours
      contestType: 'ICPC',
      scoringModel: 'ACM',
      penaltyTime: 20,
      scoreboardFreeze: false,
      status: 'NOT_STARTED',
      multiSiteMode: 'SINGLE_SITE',
    },
  });
  console.log(`created contest ${contest.name}`);

  const allLanguages = await prisma.language.findMany();
  for (const lang of allLanguages) {
    await prisma.contestLanguage.create({
      data: {
        contestId: contest.id,
        languageId: lang.id,
        enabled: true,
      },
    });
  }
  console.log('creating problems');
  
  const problems = [
    {
      contestId: contest.id,
      label: 'A',
      name: 'Problem a',
      title: 'Problem a title',
      description: 'Problem a description',
      inputSpec: 'Some extra input stuff, optional',
      outputSpec: 'Some extra output stuff, optional',
      sampleInput: '',
      sampleOutput: '',
      tags: ['easy', 'math'],
      difficulty: 1,
      timeLimit: 1000,
      memoryLimit: 256,
      active: true,
    },
    {
      contestId: contest.id,
      label: 'B',
      name: 'Sorting Problem',
      title: 'Sort Numbers',
      description: 'Sort N integers in ascending order.',
      inputSpec: 'First line: N (1 ≤ N ≤ 10^5)\nSecond line: N integers',
      outputSpec: 'N integers in ascending order',
      sampleInput: '5\n5 2 8 1 9',
      sampleOutput: '1 2 5 8 9',
      tags: ['easy', 'sorting'],
      difficulty: 2,
      timeLimit: 2000,
      memoryLimit: 256,
      active: true,
    },
    {
      contestId: contest.id,
      label: 'C',
      name: 'Graph Traversal',
      title: 'Find Shortest Path',
      description: 'Find the shortest path in a graph using BFS.',
      inputSpec: 'Graph edges and start/end nodes',
      outputSpec: 'Shortest distance or -1 if no path exists',
      sampleInput: '4 4\n1 2\n2 3\n3 4\n1 4\n1 4',
      sampleOutput: '1',
      tags: ['medium', 'graph', 'bfs'],
      difficulty: 5,
      timeLimit: 3000,
      memoryLimit: 512,
      active: true,
    },
  ];

  for (const prob of problems) {
    const problem = await prisma.problem.create({
      data: prob,
    });
    console.log(`created a problem ${problem.label} - ${problem.name}`);
  }

  console.log('Creating a team');
  
  const team = await prisma.team.create({
    data: {
      name: 'Seven Lakes A',
      affiliation: 'Seven Lakes High School',
      institution: 'UIL Computerscience',
      siteId: mainSite.id,
      contactInfo: 'paulstroud@katyisd.org',
      status: 'ACTIVE',
      members: {
        create: [
          {
            name: 'Abhay Godavarthy',
            userId: teamUser.id,
            role: 'Contestant',
          },
          {
            name: 'Eren Tor',
            role: 'Contestant',
          },
          {
            name: 'Charlie Brown',
            role: 'Contestant',
          },
        ],
      },
    },
  });

  console.log('Creating global configuration...');
  
  const systemNameConfig = await prisma.configuration.findFirst({
    where: {
      scope: 'GLOBAL',
      scopeId: null,
      key: 'system_name',
    },
  });

  if (!systemNameConfig) {
    await prisma.configuration.create({
      data: {
        scope: 'GLOBAL',
        scopeId: null,
        key: 'system_name',
        value: { name: 'Contest Management System' },
      },
    });
  }

  const submissionLimitConfig = await prisma.configuration.findFirst({
    where: {
      scope: 'GLOBAL',
      scopeId: null,
      key: 'max_submissions_per_minute',
    },
  });

  if (!submissionLimitConfig) {
    await prisma.configuration.create({
      data: {
        scope: 'GLOBAL',
        scopeId: null,
        key: 'max_submissions_per_minute',
        value: { limit: 10 },
      },
    });
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('Database seeded successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('\nTest Credentials:');
  console.log('─────────────────────────────────────────');
  console.log('Admin:  username: admin  | password: admin123');
  console.log('Judge:  username: judge  | password: judge123');
  console.log('Team:   username: team1  | password: team123');
  console.log('─────────────────────────────────────────');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
