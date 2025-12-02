/**
 * Prisma 查询重试工具
 * 
 * 用于处理 Neon 无服务器数据库的临时连接问题：
 * - 冷启动延迟
 * - 连接超时
 * - 网络波动
 */

import { Prisma } from '@prisma/client';

/**
 * 可重试的 Prisma 错误代码
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
 * 判断错误是否可重试
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.includes(error.code);
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true; // 初始化错误通常是连接问题
  }
  
  // 检查错误消息
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
 * 配置选项
 */
interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始延迟（毫秒） */
  initialDelay?: number;
  /** 最大延迟（毫秒） */
  maxDelay?: number;
  /** 延迟倍数（指数退避） */
  backoffMultiplier?: number;
  /** 操作名称（用于日志） */
  operationName?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  operationName: 'Prisma operation',
};

/**
 * 带重试的 Prisma 查询执行器
 * 
 * @example
 * const result = await withRetry(
 *   () => prisma.user.findUnique({ where: { id } }),
 *   { operationName: 'findUserById' }
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 如果不是可重试的错误，直接抛出
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // 如果已经是最后一次尝试，抛出错误
      if (attempt > opts.maxRetries) {
        console.error(
          `❌ [PrismaRetry] ${opts.operationName} failed after ${opts.maxRetries} retries:`,
          error
        );
        throw error;
      }
      
      console.warn(
        `⚠️ [PrismaRetry] ${opts.operationName} attempt ${attempt} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 指数退避
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  // 这行代码理论上不会执行，但 TypeScript 需要它
  throw lastError;
}

/**
 * 创建带重试的 Prisma 操作包装器
 * 
 * @example
 * const retryableFindUser = createRetryableOperation(
 *   (id: string) => prisma.user.findUnique({ where: { id } }),
 *   { operationName: 'findUserById' }
 * );
 * const user = await retryableFindUser('123');
 */
export function createRetryableOperation<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  options?: RetryOptions
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => operation(...args), options);
}
