/**
 * UAT User Data Seeding Script
 *
 * Creates 4 test users with different data profiles for User Acceptance Testing:
 * - test_user_1: Heavy User (100+ tasks, 20+ goals)
 * - test_user_2: Moderate User (20 tasks, 5 goals)
 * - test_user_3: New User (5 tasks, 2 goals)
 * - test_user_4: Minimal User (0 tasks, 0 goals)
 *
 * Usage:
 *   tsx src/scripts/seed-uat-users.ts [--clean]
 *
 * Options:
 *   --clean  Delete existing test users before seeding
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Test user credentials
const TEST_USERS = [
  {
    id: 'uat-user-1',
    email: 'test1@example.com',
    username: 'test_user_1',
    password: 'Test123!@#',
    profile: 'Heavy User',
  },
  {
    id: 'uat-user-2',
    email: 'test2@example.com',
    username: 'test_user_2',
    password: 'Test123!@#',
    profile: 'Moderate User',
  },
  {
    id: 'uat-user-3',
    email: 'test3@example.com',
    username: 'test_user_3',
    password: 'Test123!@#',
    profile: 'New User',
  },
  {
    id: 'uat-user-4',
    email: 'test4@example.com',
    username: 'test_user_4',
    password: 'Test123!@#',
    profile: 'Minimal User',
  },
];

async function cleanExistingTestUsers() {
  console.log('🧹 Cleaning existing test users...');

  for (const user of TEST_USERS) {
    try {
      // Delete user data in correct order (respecting foreign keys)
      await prisma.task.deleteMany({ where: { userId: user.id } });
      await prisma.goal.deleteMany({ where: { userId: user.id } });
      await prisma.reminderHistory.deleteMany({ where: { userId: user.id } });
      await prisma.scheduleExecutionRecord.deleteMany({ where: { userId: user.id } });

      // Delete statistics
      await prisma.taskStatistics.deleteMany({ where: { userId: user.id } });
      await prisma.goalStatistics.deleteMany({ where: { userId: user.id } });
      await prisma.reminderStatistics.deleteMany({ where: { userId: user.id } });
      await prisma.scheduleStatistics.deleteMany({ where: { userId: user.id } });

      // Delete dashboard config
      await prisma.dashboardConfig.deleteMany({ where: { userId: user.id } });

      // Delete user
      await prisma.user.deleteMany({ where: { email: user.email } });

      console.log(`  ✓ Cleaned ${user.username} (${user.email})`);
    } catch (error) {
      console.warn(`  ⚠ Error cleaning ${user.username}:`, error);
    }
  }

  console.log('✅ Cleanup complete\n');
}

async function createTestUser(userData: (typeof TEST_USERS)[0]) {
  console.log(`\n👤 Creating ${userData.username} (${userData.profile})...`);

  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      passwordHash: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`  ✓ User created: ${user.email}`);
  return user;
}

async function seedHeavyUser(userId: string) {
  console.log('  📊 Seeding heavy user data...');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  // Create 100 tasks: 50 TODO, 30 IN_PROGRESS, 20 COMPLETED
  const tasks = [];
  for (let i = 0; i < 100; i++) {
    const status = i < 50 ? 'TODO' : i < 80 ? 'IN_PROGRESS' : 'COMPLETED';
    tasks.push({
      id: `task-heavy-${i + 1}`,
      userId,
      title: `Task ${i + 1} - ${status}`,
      description: `Test task for heavy user - Status: ${status}`,
      status,
      priority: ['HIGH', 'MEDIUM', 'LOW'][i % 3] as any,
      createdAt: new Date(now.getTime() - (100 - i) * 3600000), // Stagger creation times
      updatedAt: new Date(),
    });
  }
  await prisma.task.createMany({ data: tasks });
  console.log(`    ✓ Created 100 tasks (50 TODO, 30 IN_PROGRESS, 20 COMPLETED)`);

  // Create 20 goals: 8 IN_PROGRESS, 10 COMPLETED, 2 ARCHIVED
  const goals = [];
  for (let i = 0; i < 20; i++) {
    const status = i < 8 ? 'IN_PROGRESS' : i < 18 ? 'COMPLETED' : 'ARCHIVED';
    goals.push({
      id: `goal-heavy-${i + 1}`,
      userId,
      title: `Goal ${i + 1} - ${status}`,
      description: `Test goal for heavy user - Status: ${status}`,
      status,
      startDate: new Date(now.getTime() - 30 * 86400000), // 30 days ago
      targetDate: new Date(now.getTime() + 30 * 86400000), // 30 days from now
      createdAt: new Date(now.getTime() - (20 - i) * 3600000),
      updatedAt: new Date(),
    });
  }
  await prisma.goal.createMany({ data: goals });
  console.log(`    ✓ Created 20 goals (8 IN_PROGRESS, 10 COMPLETED, 2 ARCHIVED)`);

  // Create 40 reminder histories: 15 today, 25 unread
  const reminderHistories = [];
  for (let i = 0; i < 40; i++) {
    const isToday = i < 15;
    const isRead = i >= 25;
    const reminderTime = isToday
      ? new Date(today.getTime() + i * 3600000) // Today at different hours
      : new Date(now.getTime() - (i - 15) * 86400000); // Past days

    reminderHistories.push({
      id: `reminder-heavy-${i + 1}`,
      userId,
      title: `Reminder ${i + 1}`,
      description: `Test reminder for heavy user`,
      reminderTime,
      isRead,
      createdAt: new Date(reminderTime.getTime() - 86400000),
      updatedAt: new Date(),
    });
  }
  await prisma.reminderHistory.createMany({ data: reminderHistories });
  console.log(`    ✓ Created 40 reminders (15 today, 25 unread)`);

  // Create 40 schedule execution records: 10 today, 30 this week
  const scheduleRecords = [];
  for (let i = 0; i < 40; i++) {
    const isToday = i < 10;
    const executionTime = isToday
      ? new Date(today.getTime() + i * 3600000) // Today at different hours
      : new Date(thisWeekStart.getTime() + (i - 10) * 7200000); // This week

    scheduleRecords.push({
      id: `schedule-heavy-${i + 1}`,
      userId,
      scheduleId: `schedule-template-${(i % 5) + 1}`, // Reference 5 templates
      title: `Schedule ${i + 1}`,
      description: `Test schedule for heavy user`,
      executionTime,
      status: ['PENDING', 'COMPLETED', 'MISSED'][i % 3] as any,
      createdAt: new Date(executionTime.getTime() - 86400000),
      updatedAt: new Date(),
    });
  }
  await prisma.scheduleExecutionRecord.createMany({ data: scheduleRecords });
  console.log(`    ✓ Created 40 schedule records (10 today, 30 this week)`);

  // Create statistics
  await prisma.taskStatistics.create({
    data: {
      id: `task-stats-heavy`,
      userId,
      totalCount: 100,
      todoCount: 50,
      inProgressCount: 30,
      completedCount: 20,
      highPriorityCount: 34,
      mediumPriorityCount: 33,
      lowPriorityCount: 33,
      completionRate: 0.2,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.goalStatistics.create({
    data: {
      id: `goal-stats-heavy`,
      userId,
      totalCount: 20,
      activeCount: 8,
      completedCount: 10,
      archivedCount: 2,
      completionRate: 0.5,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.reminderStatistics.create({
    data: {
      id: `reminder-stats-heavy`,
      userId,
      totalCount: 40,
      todayCount: 15,
      unreadCount: 25,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.scheduleStatistics.create({
    data: {
      id: `schedule-stats-heavy`,
      userId,
      totalCount: 40,
      todayCount: 10,
      thisWeekCount: 30,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`    ✓ Created statistics records`);
}

async function seedModerateUser(userId: string) {
  console.log('  📊 Seeding moderate user data...');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  // Create 20 tasks: 10 TODO, 5 IN_PROGRESS, 5 COMPLETED
  const tasks = [];
  for (let i = 0; i < 20; i++) {
    const status = i < 10 ? 'TODO' : i < 15 ? 'IN_PROGRESS' : 'COMPLETED';
    tasks.push({
      id: `task-moderate-${i + 1}`,
      userId,
      title: `Task ${i + 1} - ${status}`,
      description: `Test task for moderate user - Status: ${status}`,
      status,
      priority: ['HIGH', 'MEDIUM', 'LOW'][i % 3] as any,
      createdAt: new Date(now.getTime() - (20 - i) * 3600000),
      updatedAt: new Date(),
    });
  }
  await prisma.task.createMany({ data: tasks });
  console.log(`    ✓ Created 20 tasks (10 TODO, 5 IN_PROGRESS, 5 COMPLETED)`);

  // Create 5 goals: 3 IN_PROGRESS, 2 COMPLETED
  const goals = [];
  for (let i = 0; i < 5; i++) {
    const status = i < 3 ? 'IN_PROGRESS' : 'COMPLETED';
    goals.push({
      id: `goal-moderate-${i + 1}`,
      userId,
      title: `Goal ${i + 1} - ${status}`,
      description: `Test goal for moderate user - Status: ${status}`,
      status,
      startDate: new Date(now.getTime() - 15 * 86400000),
      targetDate: new Date(now.getTime() + 15 * 86400000),
      createdAt: new Date(now.getTime() - (5 - i) * 3600000),
      updatedAt: new Date(),
    });
  }
  await prisma.goal.createMany({ data: goals });
  console.log(`    ✓ Created 5 goals (3 IN_PROGRESS, 2 COMPLETED)`);

  // Create 13 reminder histories: 5 today, 8 unread
  const reminderHistories = [];
  for (let i = 0; i < 13; i++) {
    const isToday = i < 5;
    const isRead = i >= 8;
    const reminderTime = isToday
      ? new Date(today.getTime() + i * 3600000)
      : new Date(now.getTime() - (i - 5) * 86400000);

    reminderHistories.push({
      id: `reminder-moderate-${i + 1}`,
      userId,
      title: `Reminder ${i + 1}`,
      description: `Test reminder for moderate user`,
      reminderTime,
      isRead,
      createdAt: new Date(reminderTime.getTime() - 86400000),
      updatedAt: new Date(),
    });
  }
  await prisma.reminderHistory.createMany({ data: reminderHistories });
  console.log(`    ✓ Created 13 reminders (5 today, 8 unread)`);

  // Create 15 schedule execution records: 3 today, 12 this week
  const scheduleRecords = [];
  for (let i = 0; i < 15; i++) {
    const isToday = i < 3;
    const executionTime = isToday
      ? new Date(today.getTime() + i * 3600000)
      : new Date(thisWeekStart.getTime() + (i - 3) * 7200000);

    scheduleRecords.push({
      id: `schedule-moderate-${i + 1}`,
      userId,
      scheduleId: `schedule-template-${(i % 3) + 1}`,
      title: `Schedule ${i + 1}`,
      description: `Test schedule for moderate user`,
      executionTime,
      status: ['PENDING', 'COMPLETED'][i % 2] as any,
      createdAt: new Date(executionTime.getTime() - 86400000),
      updatedAt: new Date(),
    });
  }
  await prisma.scheduleExecutionRecord.createMany({ data: scheduleRecords });
  console.log(`    ✓ Created 15 schedule records (3 today, 12 this week)`);

  // Create statistics
  await prisma.taskStatistics.create({
    data: {
      id: `task-stats-moderate`,
      userId,
      totalCount: 20,
      todoCount: 10,
      inProgressCount: 5,
      completedCount: 5,
      highPriorityCount: 7,
      mediumPriorityCount: 7,
      lowPriorityCount: 6,
      completionRate: 0.25,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.goalStatistics.create({
    data: {
      id: `goal-stats-moderate`,
      userId,
      totalCount: 5,
      activeCount: 3,
      completedCount: 2,
      archivedCount: 0,
      completionRate: 0.4,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.reminderStatistics.create({
    data: {
      id: `reminder-stats-moderate`,
      userId,
      totalCount: 13,
      todayCount: 5,
      unreadCount: 8,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.scheduleStatistics.create({
    data: {
      id: `schedule-stats-moderate`,
      userId,
      totalCount: 15,
      todayCount: 3,
      thisWeekCount: 12,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`    ✓ Created statistics records`);
}

async function seedNewUser(userId: string) {
  console.log('  📊 Seeding new user data...');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  // Create 5 tasks: 3 TODO, 2 IN_PROGRESS
  const tasks = [];
  for (let i = 0; i < 5; i++) {
    const status = i < 3 ? 'TODO' : 'IN_PROGRESS';
    tasks.push({
      id: `task-new-${i + 1}`,
      userId,
      title: `Task ${i + 1} - ${status}`,
      description: `Test task for new user - Status: ${status}`,
      status,
      priority: ['HIGH', 'MEDIUM', 'LOW'][i % 3] as any,
      createdAt: new Date(now.getTime() - (5 - i) * 3600000),
      updatedAt: new Date(),
    });
  }
  await prisma.task.createMany({ data: tasks });
  console.log(`    ✓ Created 5 tasks (3 TODO, 2 IN_PROGRESS)`);

  // Create 2 goals: 1 IN_PROGRESS, 1 COMPLETED
  const goals = [];
  for (let i = 0; i < 2; i++) {
    const status = i === 0 ? 'IN_PROGRESS' : 'COMPLETED';
    goals.push({
      id: `goal-new-${i + 1}`,
      userId,
      title: `Goal ${i + 1} - ${status}`,
      description: `Test goal for new user - Status: ${status}`,
      status,
      startDate: new Date(now.getTime() - 7 * 86400000),
      targetDate: new Date(now.getTime() + 7 * 86400000),
      createdAt: new Date(now.getTime() - (2 - i) * 3600000),
      updatedAt: new Date(),
    });
  }
  await prisma.goal.createMany({ data: goals });
  console.log(`    ✓ Created 2 goals (1 IN_PROGRESS, 1 COMPLETED)`);

  // Create 5 reminder histories: 2 today, 3 unread
  const reminderHistories = [];
  for (let i = 0; i < 5; i++) {
    const isToday = i < 2;
    const isRead = i >= 3;
    const reminderTime = isToday
      ? new Date(today.getTime() + i * 3600000)
      : new Date(now.getTime() - (i - 2) * 86400000);

    reminderHistories.push({
      id: `reminder-new-${i + 1}`,
      userId,
      title: `Reminder ${i + 1}`,
      description: `Test reminder for new user`,
      reminderTime,
      isRead,
      createdAt: new Date(reminderTime.getTime() - 86400000),
      updatedAt: new Date(),
    });
  }
  await prisma.reminderHistory.createMany({ data: reminderHistories });
  console.log(`    ✓ Created 5 reminders (2 today, 3 unread)`);

  // Create 6 schedule execution records: 1 today, 5 this week
  const scheduleRecords = [];
  for (let i = 0; i < 6; i++) {
    const isToday = i === 0;
    const executionTime = isToday
      ? new Date(today.getTime() + 10 * 3600000)
      : new Date(thisWeekStart.getTime() + (i - 1) * 14400000);

    scheduleRecords.push({
      id: `schedule-new-${i + 1}`,
      userId,
      scheduleId: `schedule-template-${(i % 2) + 1}`,
      title: `Schedule ${i + 1}`,
      description: `Test schedule for new user`,
      executionTime,
      status: ['PENDING', 'COMPLETED'][i % 2] as any,
      createdAt: new Date(executionTime.getTime() - 86400000),
      updatedAt: new Date(),
    });
  }
  await prisma.scheduleExecutionRecord.createMany({ data: scheduleRecords });
  console.log(`    ✓ Created 6 schedule records (1 today, 5 this week)`);

  // Create statistics
  await prisma.taskStatistics.create({
    data: {
      id: `task-stats-new`,
      userId,
      totalCount: 5,
      todoCount: 3,
      inProgressCount: 2,
      completedCount: 0,
      highPriorityCount: 2,
      mediumPriorityCount: 2,
      lowPriorityCount: 1,
      completionRate: 0.0,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.goalStatistics.create({
    data: {
      id: `goal-stats-new`,
      userId,
      totalCount: 2,
      activeCount: 1,
      completedCount: 1,
      archivedCount: 0,
      completionRate: 0.5,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.reminderStatistics.create({
    data: {
      id: `reminder-stats-new`,
      userId,
      totalCount: 5,
      todayCount: 2,
      unreadCount: 3,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.scheduleStatistics.create({
    data: {
      id: `schedule-stats-new`,
      userId,
      totalCount: 6,
      todayCount: 1,
      thisWeekCount: 5,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`    ✓ Created statistics records`);
}

async function seedMinimalUser(userId: string) {
  console.log('  📊 Seeding minimal user data (empty state)...');

  // Create empty statistics
  await prisma.taskStatistics.create({
    data: {
      id: `task-stats-minimal`,
      userId,
      totalCount: 0,
      todoCount: 0,
      inProgressCount: 0,
      completedCount: 0,
      highPriorityCount: 0,
      mediumPriorityCount: 0,
      lowPriorityCount: 0,
      completionRate: 0.0,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.goalStatistics.create({
    data: {
      id: `goal-stats-minimal`,
      userId,
      totalCount: 0,
      activeCount: 0,
      completedCount: 0,
      archivedCount: 0,
      completionRate: 0.0,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.reminderStatistics.create({
    data: {
      id: `reminder-stats-minimal`,
      userId,
      totalCount: 0,
      todayCount: 0,
      unreadCount: 0,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.scheduleStatistics.create({
    data: {
      id: `schedule-stats-minimal`,
      userId,
      totalCount: 0,
      todayCount: 0,
      thisWeekCount: 0,
      lastRecalculatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`    ✓ Created empty statistics records`);
}

async function main() {
  console.log('🚀 UAT User Data Seeding Script\n');
  console.log('==========================================\n');

  const args = process.argv.slice(2);
  const shouldClean = args.includes('--clean');

  try {
    // Clean existing test users if requested
    if (shouldClean) {
      await cleanExistingTestUsers();
    }

    // Create test users
    console.log('📝 Creating test users...\n');

    // User 1: Heavy User
    const user1 = await createTestUser(TEST_USERS[0]);
    await seedHeavyUser(user1.id);

    // User 2: Moderate User
    const user2 = await createTestUser(TEST_USERS[1]);
    await seedModerateUser(user2.id);

    // User 3: New User
    const user3 = await createTestUser(TEST_USERS[2]);
    await seedNewUser(user3.id);

    // User 4: Minimal User
    const user4 = await createTestUser(TEST_USERS[3]);
    await seedMinimalUser(user4.id);

    console.log('\n==========================================\n');
    console.log('✅ UAT user seeding complete!\n');
    console.log('Test User Credentials:\n');
    console.log('┌────────────────┬──────────────────────┬──────────────┐');
    console.log('│ Username       │ Email                │ Password     │');
    console.log('├────────────────┼──────────────────────┼──────────────┤');
    TEST_USERS.forEach((user) => {
      console.log(
        `│ ${user.username.padEnd(14)} │ ${user.email.padEnd(20)} │ ${user.password.padEnd(12)} │`,
      );
    });
    console.log('└────────────────┴──────────────────────┴──────────────┘\n');

    console.log('Summary:');
    console.log('  • test_user_1: 100 tasks, 20 goals, 40 reminders, 40 schedules');
    console.log('  • test_user_2: 20 tasks, 5 goals, 13 reminders, 15 schedules');
    console.log('  • test_user_3: 5 tasks, 2 goals, 5 reminders, 6 schedules');
    console.log('  • test_user_4: 0 tasks, 0 goals, 0 reminders, 0 schedules\n');
  } catch (error) {
    console.error('❌ Error seeding UAT users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
