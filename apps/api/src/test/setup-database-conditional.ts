/**
 * 真实数据库测试环境配置 - 有条件的初始化
 * 
 * 对于单元测试（test.ts 前缀，不带 integration/e2e），会跳过数据库初始化
 * 对于集成测试（integration.test.ts），会初始化真实数据库
 * 
 * @description 使用 PostgreSQL Docker 容器进行集成测试
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let prisma: PrismaClient;
let isSetupComplete = false;
let isUnitTestOnly = true; // 标记是否只运行单元测试

/**
 * 检查是否仅运行单元测试
 * 通过获取堆栈跟踪并检查测试文件名
 */
function detectUnitTestMode(): boolean {
  try {
    // 从堆栈跟踪获取当前运行的文件
    const stack = new Error().stack || '';
    
    // 检查是否是集成测试文件
    const hasIntegrationTests = stack.includes('.integration.test');
    const hasE2ETests = stack.includes('.e2e.test');
    
    return !(hasIntegrationTests || hasE2ETests);
  } catch {
    // 无法检测，假设是单元测试
    return true;
  }
}

/**
 * 初始化测试数据库
 */
export async function setupTestDatabase() {
  // 检查是否应该跳过 setup
  isUnitTestOnly = detectUnitTestMode();
  
  if (isUnitTestOnly) {
    console.log('⏭️  跳过数据库初始化（单元测试模式）');
    return;
  }
  
  if (isSetupComplete) return prisma;

  console.log('🚀 初始化测试数据库...');

  // 设置测试数据库 URL
  const TEST_DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  try {
    // 使用 db push 同步 schema（跳过迁移历史）
    console.log('📦 同步数据库 schema...');
    execSync('pnpm prisma db push --skip-generate', {
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

    await prisma.$connect();
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
  if (isUnitTestOnly || !prisma) {
    return; // 单元测试模式下跳过
  }

  if (!prisma) {
    throw new Error('Database not initialized. Call setupTestDatabase() first.');
  }

  try {
    // 获取所有表名
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename != '_prisma_migrations'
    `;

    // 禁用外键约束
    await prisma.$executeRaw`SET session_replication_role = 'replica'`;

    // 清空所有表
    for (const { tablename } of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
    }

    // 恢复外键约束
    await prisma.$executeRaw`SET session_replication_role = 'origin'`;
  } catch (error) {
    console.error('❌ 清理数据库失败:', error);
    throw error;
  }
}

/**
 * 断开数据库连接
 */
export async function teardownTestDatabase() {
  if (isUnitTestOnly) {
    return; // 单元测试模式下跳过
  }

  if (prisma) {
    await prisma.$disconnect();
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
