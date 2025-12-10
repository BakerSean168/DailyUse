/**
 * IPC 处理器基类
 * 提供统一的 IPC 请求处理、错误处理和响应格式
 * 
 * 功能：
 * - 统一的 IPC 响应格式
 * - 自动错误处理和转换
 * - 请求验证和授权
 * - 日志记录
 * - 性能监控
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import { ServiceError } from './service-decorators';

/**
 * 统一的 IPC 响应格式
 */
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    statusCode?: number;
  };
  meta?: {
    duration: number;
    timestamp: number;
  };
}

/**
 * IPC 处理器基类
 */
export abstract class BaseIPCHandler {
  protected logger: ILogger;
  protected handlerName: string;

  constructor(handlerName: string) {
    this.handlerName = handlerName;
    this.logger = createLogger(`IPC:${handlerName}`);
  }

  /**
   * 处理 IPC 请求
   * 包装错误处理、日志和性能监控
   */
  protected async handleRequest<T>(
    channel: string,
    fn: () => Promise<T>,
    context?: { accountUuid?: string; userId?: string },
  ): Promise<IPCResponse<T>> {
    const startTime = performance.now();
    const startMs = Date.now();

    try {
      this.logger.debug(`IPC request: ${channel}`, {
        accountUuid: context?.accountUuid,
      });

      const result = await fn();

      const duration = performance.now() - startTime;

      this.logger.info(`IPC request completed: ${channel}`, {
        duration: `${duration.toFixed(2)}ms`,
        durationMs: Math.round(duration),
        accountUuid: context?.accountUuid,
      });

      return {
        success: true,
        data: result,
        meta: {
          duration: Math.round(duration),
          timestamp: startMs,
        },
      };
    } catch (error) {
      const duration = performance.now() - startTime;

      this.logger.error(`IPC request failed: ${channel}`, {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        duration: `${duration.toFixed(2)}ms`,
        durationMs: Math.round(duration),
        accountUuid: context?.accountUuid,
      });

      // 处理服务错误
      if (error instanceof ServiceError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            statusCode: error.statusCode,
          },
          meta: {
            duration: Math.round(duration),
            timestamp: startMs,
          },
        };
      }

      // 处理通用错误
      if (error instanceof Error) {
        return {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Internal server error',
            statusCode: 500,
          },
          meta: {
            duration: Math.round(duration),
            timestamp: startMs,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          statusCode: 500,
        },
        meta: {
          duration: Math.round(duration),
          timestamp: startMs,
        },
      };
    }
  }

  /**
   * 验证请求授权
   */
  protected assertAuthorized(
    hasAccess: boolean,
    message: string = 'Unauthorized',
  ): void {
    if (!hasAccess) {
      const error = new ServiceError('UNAUTHORIZED', message, 401);
      throw error;
    }
  }

  /**
   * 验证请求参数
   */
  protected validateRequest<T>(
    data: any,
    rules: Record<string, (v: any) => boolean>,
  ): asserts data is T {
    for (const [field, rule] of Object.entries(rules)) {
      if (!rule(data?.[field])) {
        throw new ServiceError('INVALID_REQUEST', `Invalid parameter: ${field}`, 400);
      }
    }
  }
}

/**
 * IPC 处理器注册器
 * 用于在 IPC 主进程中注册处理器
 */
export class IPCHandlerRegistry {
  private handlers = new Map<string, (args: any) => Promise<any>>();
  private logger = createLogger('IPCHandlerRegistry');

  /**
   * 注册处理器
   */
  registerHandler(
    channel: string,
    handler: (args: any) => Promise<any>,
  ): void {
    if (this.handlers.has(channel)) {
      this.logger.warn(`Handler already registered for channel: ${channel}`);
    }
    this.handlers.set(channel, handler);
    this.logger.debug(`Registered IPC handler: ${channel}`);
  }

  /**
   * 获取处理器
   */
  getHandler(channel: string): ((args: any) => Promise<any>) | undefined {
    return this.handlers.get(channel);
  }

  /**
   * 列出所有已注册的处理器
   */
  listHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

// 全局 IPC 处理器注册器
export const globalIPCHandlerRegistry = new IPCHandlerRegistry();
