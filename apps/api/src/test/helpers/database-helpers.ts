/**
 * 数据库测试帮助函数
 * @description 用于测试的数据库管理工具
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient | null = null;

/**
 * 获取测试数据库 Prisma 客户端
 */
export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
        },
      },
    });
  }
  return prisma;
}

/**
 * 清理所有测试数据
 * 保留数据库结构，只删除数据
 */
export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma();
  
  // 按照依赖关系顺序删除（子表 -> 父表）
  const tables = [
    'KeyResult',
    'Goal',
    'ReminderStatistics',
    'ReminderHistory',
    'ReminderTemplate',
    'NotificationRecord',
    'RepositoryStatistics',
    'Repository',
    'ThemeDefinition',
    'Session',
    'Account',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (error) {
      // 表可能不存在，忽略错误
      console.warn(`Warning: Could not truncate table ${table}`);
    }
  }
}

/**
 * 关闭数据库连接
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * 确保数据库 Schema 是最新的
 */
export function ensureDatabaseSchema(): void {
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test',
      },
    });
  } catch (error) {
    console.error('Failed to apply database migrations:', error);
    throw error;
  }
}

/**
 * 创建测试账户
 */
export async function createTestAccount(data: {
  uuid?: string;
  email: string;
  username: string;
  passwordHash?: string;
}) {
  const prisma = getTestPrisma();
  return await prisma.account.create({
    data: {
      uuid: data.uuid || `test-account-${Date.now()}`,
      email: data.email,
      username: data.username,
      emailVerified: true,
      profile: JSON.stringify({ displayName: data.username }),
      preferences: JSON.stringify({}),
      storage: JSON.stringify({}),
      security: JSON.stringify({}),
      stats: JSON.stringify({}),
      history: '[]',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * 批量创建测试账户
 * @param accountIds 账户 ID 列表（不含前缀）
 * @param prefix 账户 ID 前缀，默认 'test-account-'
 */
export async function createTestAccounts(accountIds: string[], prefix: string = 'test-account-') {
  const accounts = [];
  for (const id of accountIds) {
    const uuid = `${prefix}${id}`;
    const account = await createTestAccount({
      uuid,
      email: `${uuid}@test.com`,
      username: uuid,
    });
    accounts.push(account);
  }
  return accounts;
}

/**
 * 批量创建测试目标
 */
export async function createTestGoals(accountUuid: string, count: number = 3) {
  const prisma = getTestPrisma();
  const goals = [];
  
  for (let i = 0; i < count; i++) {
    const goal = await prisma.goal.create({
      data: {
        uuid: `test-goal-${accountUuid}-${i}-${Date.now()}`,
        accountUuid,
        title: `Test Goal ${i + 1}`,
        description: `Test goal description ${i + 1}`,
        importance: 'IMPORTANT',
        urgency: 'URGENT',
        status: 'IN_PROGRESS',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    goals.push(goal);
  }
  
  return goals;
}

/**
 * 创建测试提醒模板
 */
export async function createTestReminderTemplate(data: {
  accountUuid: string;
  title: string;
  message?: string;
  isActive?: boolean;
}) {
  const prisma = getTestPrisma();
  return await prisma.reminderTemplate.create({
    data: {
      uuid: `test-reminder-${Date.now()}`,
      accountUuid: data.accountUuid,
      title: data.title,
      message: data.message || 'Test reminder message',
      recurrence: { type: 'ONCE' },
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
