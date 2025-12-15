/**
 * IPC Error - 统一 IPC 错误处理
 * 
 * @module renderer/shared/infrastructure/ipc
 */

import type { IPCErrorData } from './ipc-types';
import { IPCErrorCode } from './ipc-types';

/**
 * IPC 错误基类
 */
export class IPCError extends Error {
  public readonly code: IPCErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly originalError?: Error;
  public readonly timestamp: Date;
  public readonly channel?: string;

  constructor(
    code: IPCErrorCode,
    message: string,
    options?: {
      details?: Record<string, unknown>;
      originalError?: Error;
      channel?: string;
    }
  ) {
    super(message);
    this.name = 'IPCError';
    this.code = code;
    this.details = options?.details;
    this.originalError = options?.originalError;
    this.channel = options?.channel;
    this.timestamp = new Date();

    // 保留原始堆栈信息
    if (options?.originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${options.originalError.stack}`;
    }

    // 确保 instanceof 正常工作
    Object.setPrototypeOf(this, IPCError.prototype);
  }

  /**
   * 转换为 JSON 格式
   */
  toJSON(): IPCErrorData {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      stack: import.meta.env.DEV ? this.stack : undefined,
    };
  }

  /**
   * 从 IPC 响应错误创建 IPCError
   */
  static fromIPCErrorData(data: IPCErrorData, channel?: string): IPCError {
    const code = Object.values(IPCErrorCode).includes(data.code as IPCErrorCode)
      ? (data.code as IPCErrorCode)
      : IPCErrorCode.UNKNOWN;

    return new IPCError(code, data.message, {
      details: data.details,
      channel,
    });
  }

  /**
   * 从未知错误创建 IPCError
   */
  static fromUnknown(error: unknown, channel?: string): IPCError {
    if (error instanceof IPCError) {
      return error;
    }

    if (error instanceof Error) {
      return new IPCError(IPCErrorCode.UNKNOWN, error.message, {
        originalError: error,
        channel,
      });
    }

    return new IPCError(
      IPCErrorCode.UNKNOWN,
      typeof error === 'string' ? error : 'Unknown IPC error',
      { channel }
    );
  }
}

// ============ 特定错误类型 ============

/**
 * IPC 超时错误
 */
export class IPCTimeoutError extends IPCError {
  constructor(channel: string, timeout: number) {
    super(IPCErrorCode.TIMEOUT, `IPC request to '${channel}' timed out after ${timeout}ms`, {
      details: { channel, timeout },
      channel,
    });
    this.name = 'IPCTimeoutError';
    Object.setPrototypeOf(this, IPCTimeoutError.prototype);
  }
}

/**
 * IPC 取消错误
 */
export class IPCCancelledError extends IPCError {
  constructor(channel: string, reason?: string) {
    super(IPCErrorCode.CANCELLED, `IPC request to '${channel}' was cancelled${reason ? `: ${reason}` : ''}`, {
      details: { channel, reason },
      channel,
    });
    this.name = 'IPCCancelledError';
    Object.setPrototypeOf(this, IPCCancelledError.prototype);
  }
}

/**
 * IPC 验证错误
 */
export class IPCValidationError extends IPCError {
  public readonly validationErrors: Record<string, string[]>;

  constructor(channel: string, validationErrors: Record<string, string[]>) {
    const errorCount = Object.values(validationErrors).flat().length;
    super(IPCErrorCode.VALIDATION, `Validation failed for '${channel}': ${errorCount} error(s)`, {
      details: { validationErrors },
      channel,
    });
    this.name = 'IPCValidationError';
    this.validationErrors = validationErrors;
    Object.setPrototypeOf(this, IPCValidationError.prototype);
  }
}

/**
 * IPC 未找到错误
 */
export class IPCNotFoundError extends IPCError {
  constructor(channel: string, resource?: string) {
    super(IPCErrorCode.NOT_FOUND, resource ? `Resource '${resource}' not found` : 'Resource not found', {
      details: { resource },
      channel,
    });
    this.name = 'IPCNotFoundError';
    Object.setPrototypeOf(this, IPCNotFoundError.prototype);
  }
}

/**
 * IPC 未授权错误
 */
export class IPCUnauthorizedError extends IPCError {
  constructor(channel: string, message = 'Unauthorized access') {
    super(IPCErrorCode.UNAUTHORIZED, message, { channel });
    this.name = 'IPCUnauthorizedError';
    Object.setPrototypeOf(this, IPCUnauthorizedError.prototype);
  }
}

/**
 * IPC 禁止访问错误
 */
export class IPCForbiddenError extends IPCError {
  constructor(channel: string, message = 'Access forbidden') {
    super(IPCErrorCode.FORBIDDEN, message, { channel });
    this.name = 'IPCForbiddenError';
    Object.setPrototypeOf(this, IPCForbiddenError.prototype);
  }
}

// ============ 错误工厂 ============

/**
 * 根据错误代码创建对应的 IPCError 实例
 */
export function createIPCError(
  data: IPCErrorData,
  channel?: string
): IPCError {
  switch (data.code) {
    case IPCErrorCode.TIMEOUT:
      return new IPCTimeoutError(channel ?? 'unknown', data.details?.timeout as number ?? 30000);
    
    case IPCErrorCode.CANCELLED:
      return new IPCCancelledError(channel ?? 'unknown', data.details?.reason as string);
    
    case IPCErrorCode.VALIDATION:
      return new IPCValidationError(
        channel ?? 'unknown',
        (data.details?.validationErrors as Record<string, string[]>) ?? {}
      );
    
    case IPCErrorCode.NOT_FOUND:
      return new IPCNotFoundError(channel ?? 'unknown', data.details?.resource as string);
    
    case IPCErrorCode.UNAUTHORIZED:
      return new IPCUnauthorizedError(channel ?? 'unknown', data.message);
    
    case IPCErrorCode.FORBIDDEN:
      return new IPCForbiddenError(channel ?? 'unknown', data.message);
    
    default:
      return IPCError.fromIPCErrorData(data, channel);
  }
}

// ============ 错误判断辅助函数 ============

/**
 * 判断是否为 IPC 错误
 */
export function isIPCError(error: unknown): error is IPCError {
  return error instanceof IPCError;
}

/**
 * 判断是否为超时错误
 */
export function isTimeoutError(error: unknown): error is IPCTimeoutError {
  return error instanceof IPCTimeoutError;
}

/**
 * 判断是否为取消错误
 */
export function isCancelledError(error: unknown): error is IPCCancelledError {
  return error instanceof IPCCancelledError;
}

/**
 * 判断是否为验证错误
 */
export function isValidationError(error: unknown): error is IPCValidationError {
  return error instanceof IPCValidationError;
}

/**
 * 判断是否为可重试错误
 */
export function isRetryableError(error: unknown): boolean {
  if (!isIPCError(error)) return false;
  
  const retryableCodes: IPCErrorCode[] = [
    IPCErrorCode.TIMEOUT,
    IPCErrorCode.NETWORK,
    IPCErrorCode.UNKNOWN,
  ];
  
  return retryableCodes.includes(error.code);
}
