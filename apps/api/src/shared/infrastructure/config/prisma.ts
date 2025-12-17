/**
 * @file prisma.ts
 * @description Prisma Client 统一配置，提供数据库连接管理、查询监控和重试机制。
 * @date 2025-01-22
 */

import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Prisma Client 统一配置。
 *
 * @remarks
 * 功能：
 * - 开发环境慢查询监控 (>100ms)
 * - 连接重试机制
 * - 单例模式（开发环境热重载兼容）
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientConfig = {
  log:
    process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event' as const, level: 'query' as const },
          { emit: 'stdout' as const, level: 'warn' as const },
          { emit: 'stdout' as const, level: 'error' as const },
        ]
      : [{ emit: 'stdout' as const, level: 'error' as const }],
};

/**
 * Prisma Client 单例实例。
 *
 * @remarks
 * 开发环境防止热重载创建多个连接。
 */
export const prisma: PrismaClient =
  global.prisma ??
  new PrismaClient(prismaClientConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 慢查询监控 (开发环境，>100ms)
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
    if (e.duration > 100) {
      console.warn(`[SLOW QUERY] ${e.duration}ms - ${e.query}`);
    }
  });
}

/**
 * 可重试的 Prisma 错误代码。
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const RETRYABLE_ERROR_CODES = [
  'P1001', // Can't reach database server
  'P1002', // Database server reached but timed out
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
  'P2024', // Connection pool timeout
];

/**
 * 判断错误是否可重试。
 *
 * @param error - 捕获的错误对象
 * @returns {boolean} 如果是网络或连接相关的错误，返回 true
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.includes(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  return false;
}

/**
 * 带重试的数据库操作执行器。
 *
 * @param operation - 需要执行的异步数据库操作
 * @param options - 重试配置选项
 * @returns {Promise<T>} 操作结果
 * @throws 最后一次尝试失败的错误
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    operationName?: string;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    operationName = 'Database operation',
  } = options || {};

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt > maxRetries) {
        console.error(
          `❌ [PrismaRetry] ${operationName} failed after ${maxRetries} retries:`,
          error
        );
        throw error;
      }

      console.warn(
        `⚠️ [PrismaRetry] ${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * 连接数据库（带重试）。
 *
 * @returns {Promise<void>}
 */
export const connectPrisma = async (): Promise<void> => {
  await withRetry(
    async () => {
      await prisma.$connect();
    },
    {
      maxRetries: 3,
      initialDelay: 2000,
      operationName: 'Database connection',
    }
  );
  console.log('✅ Connected to database');
};

/**
 * 断开数据库连接。
 *
 * @returns {Promise<void>}
 */
export const disconnectPrisma = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
};

/**
 * 测试数据库连接。
 *
 * @returns {Promise<boolean>} 连接成功返回 true，否则 false
 */
export async function testConnection(): Promise<boolean> {
  try {
    await withRetry(
      async () => {
        await prisma.$queryRaw`SELECT 1`;
      },
      {
        maxRetries: 5,
        initialDelay: 2000,
        operationName: 'Connection test',
      }
    );
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 兼容默认导出
export default prisma;
