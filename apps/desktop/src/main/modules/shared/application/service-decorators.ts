/**
 * 服务层错误处理和性能监控装饰器
 * 
 * 功能：
 * - 统一错误处理
 * - 性能监控
 * - 日志记录
 * - 错误转换为用户友好的消息
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ServiceDecorators');

export interface PerformanceMetrics {
  duration: number; // ms
  timestamp: number;
  success: boolean;
}

/**
 * 服务执行监控装饰器
 * 追踪服务的执行时间、错误和日志
 */
export function withPerformanceTracking(
  serviceName: string,
  operationName: string,
): (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) => PropertyDescriptor {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      const startMs = Date.now();

      try {
        logger.debug(`[${serviceName}] ${operationName} started`, {
          args: JSON.stringify(args).substring(0, 100),
        });

        const result = await originalMethod.apply(this, args);

        const duration = performance.now() - startTime;
        logger.info(`[${serviceName}] ${operationName} completed`, {
          duration: `${duration.toFixed(2)}ms`,
          timestamp: startMs,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        logger.error(`[${serviceName}] ${operationName} failed`, {
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration.toFixed(2)}ms`,
          timestamp: startMs,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 统一错误处理装饰器
 */
export function withErrorHandling(
  serviceName: string,
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`[${serviceName}] Service error: ${error.message}`, {
            stack: error.stack,
          });

          // 转换为用户友好的错误
          if (error.message.includes('not found')) {
            throw new Error(`Resource not found`);
          }
          if (error.message.includes('permission')) {
            throw new Error(`Permission denied`);
          }
          if (error.message.includes('invalid')) {
            throw new Error(`Invalid request`);
          }
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 业务逻辑错误基类
 */
export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends ServiceError {
  constructor(message: string = 'Resource not found', details?: any) {
    super('NOT_FOUND', message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends ServiceError {
  constructor(message: string = 'Permission denied', details?: any) {
    super('PERMISSION_DENIED', message, 403, details);
    this.name = 'PermissionError';
  }
}

/**
 * 服务不可用错误
 */
export class ServiceUnavailableError extends ServiceError {
  constructor(message: string = 'Service unavailable', details?: any) {
    super('SERVICE_UNAVAILABLE', message, 503, details);
    this.name = 'ServiceUnavailableError';
  }
}
