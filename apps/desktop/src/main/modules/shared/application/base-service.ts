/**
 * 服务基类
 * 提供通用的错误处理、日志记录和性能监控能力
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import { ServiceError, ValidationError, NotFoundError, PermissionError } from './service-decorators';

export interface ServiceExecutionContext {
  serviceName: string;
  operationName: string;
  startTime: number;
  accountUuid?: string;
}

export abstract class BaseService {
  protected logger: ILogger;
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.logger = createLogger(serviceName);
  }

  /**
   * 执行服务方法并进行性能监控和错误处理
   */
  protected async executeWithTracking<T>(
    operationName: string,
    fn: () => Promise<T>,
    context?: { accountUuid?: string },
  ): Promise<T> {
    const startTime = performance.now();
    const startMs = Date.now();

    try {
      this.logger.debug(`[${this.serviceName}] ${operationName} started`, {
        accountUuid: context?.accountUuid,
      });

      const result = await fn();

      const duration = performance.now() - startTime;
      this.logger.info(`[${this.serviceName}] ${operationName} completed`, {
        duration: `${duration.toFixed(2)}ms`,
        durationMs: Math.round(duration),
        accountUuid: context?.accountUuid,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logger.error(`[${this.serviceName}] ${operationName} failed`, {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        duration: `${duration.toFixed(2)}ms`,
        durationMs: Math.round(duration),
        accountUuid: context?.accountUuid,
      });

      // 重新抛出错误
      if (error instanceof ServiceError) {
        throw error;
      }

      // 转换通用错误
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new NotFoundError(error.message);
        }
        if (error.message.includes('permission') || error.message.includes('forbidden')) {
          throw new PermissionError(error.message);
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          throw new ValidationError(error.message);
        }
      }

      throw error;
    }
  }

  /**
   * 验证输入参数
   */
  protected validateInput(input: any, rules: Record<string, (v: any) => boolean>): void {
    for (const [field, rule] of Object.entries(rules)) {
      if (!rule(input?.[field])) {
        throw new ValidationError(`Invalid input: ${field}`);
      }
    }
  }

  /**
   * 检查资源是否存在
   */
  protected assertNotNull<T>(value: T | null | undefined, message: string): asserts value is T {
    if (value === null || value === undefined) {
      throw new NotFoundError(message);
    }
  }

  /**
   * 检查权限
   */
  protected assertPermission(hasPermission: boolean, message: string = 'Permission denied'): void {
    if (!hasPermission) {
      throw new PermissionError(message);
    }
  }
}
