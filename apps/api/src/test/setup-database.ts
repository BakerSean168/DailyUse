/**
 * 真实数据库测试环境配置
 * @description 使用 PostgreSQL Docker 容器进行测试
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let prisma: PrismaClient;
let isSetupComplete = false;

/**
 * 初始化测试数据库
 */
export async function setupTestDatabase() {
  if (isSetupComplete) return prisma;

  console.log('🚀 初始化测试数据库...');

  // 设置测试数据库 URL
  const TEST_DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  try {
    // 运行 Prisma Migrate（部署 migrations）
    console.log('📦 运行数据库迁移...');
    execSync('pnpm prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      cwd: process.cwd(),
    });

    // 创建 Prisma 客户端
    prisma = new PrismaClient({
      datasources: {
        db: { url: TEST_DATABASE_URL },
      },
    });

    await prisma.\();
    console.log('✅ 测试数据库初始化完成');

    isSetupComplete = true;
    return prisma;
  } catch (error) {
    console.error('❌ 测试数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 清理所有表数据（保留 Schema）
 */
export async function cleanDatabase() {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupTestDatabase() first.');
  }

  try {
    // 获取所有表名
    const tables = await prisma.\<Array<{ tablename: string }>>\
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
    \;

    // 禁用外键约束
    await prisma.\\SET session_replication_role = 'replica'\;

    // 清空所有表
    for (const { tablename } of tables) {
      await prisma.\(\TRUNCATE TABLE "\" CASCADE\);
    }

    // 恢复外键约束
    await prisma.\\SET session_replication_role = 'origin'\;
  } catch (error) {
    console.error('❌ 清理数据库失败:', error);
    throw error;
  }
}

/**
 * 断开数据库连接
 */
export async function teardownTestDatabase() {
  if (prisma) {
    await prisma.\();
    console.log('🔌 测试数据库连接已断开');
  }
}

/**
 * 获取 Prisma 客户端实例
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Database not initialized. Call setupTestDatabase() first.');
  }
  return prisma;
}

// Vitest 全局钩子
beforeAll(async () => {
  await setupTestDatabase();
}, 30000); // 30秒超时（首次需要拉取镜像和运行迁移）

afterAll(async () => {
  await teardownTestDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});
