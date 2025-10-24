/**
 * Domain Error Base Class
 * 所有领域错误的基类，提供统一的错误结构和 API 响应格式
 *
 * @example
 * ```typescript
 * export class InvalidTagError extends DomainError {
 *   constructor(message: string, tag?: string) {
 *     super('INVALID_TAG', message, { tag }, 400);
 *   }
 * }
 *
 * throw new InvalidTagError('Tag cannot be empty');
 * ```
 */
export abstract class DomainError extends Error {
  /**
   * 错误码（用于国际化和前端识别）
   * @example 'INVALID_TAG', 'NOT_FOUND', 'UNAUTHORIZED'
   */
  public readonly code: string;

  /**
   * 错误上下文信息（用于调试和日志记录）
   * @example { tag: 'invalid-tag', maxLength: 50 }
   */
  public readonly context?: Record<string, any>;

  /**
   * HTTP 状态码（用于 API 响应）
   * @default 400
   */
  public readonly httpStatus: number;

  /**
   * 时间戳（错误发生时间）
   */
  public readonly timestamp: number;

  constructor(
    code: string,
    message: string,
    context?: Record<string, any>,
    httpStatus: number = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.httpStatus = httpStatus;
    this.timestamp = Date.now();

    // 保留正确的堆栈跟踪（对于调试至关重要）
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 转换为 API 响应格式
   * @returns JSON-serializable error object
   */
  toJSON(): {
    code: string;
    message: string;
    timestamp: number;
    context?: Record<string, any>;
  } {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      ...(this.context && { context: this.context }),
    };
  }

  /**
   * 转换为日志格式
   * @returns Formatted string for logging
   */
  toLogString(): string {
    const contextStr = this.context ? ` | Context: ${JSON.stringify(this.context)}` : '';
    return `[${this.code}] ${this.message}${contextStr} | Stack: ${this.stack}`;
  }
}

/**
 * ============================================================
 * 通用领域错误类
 * ============================================================
 */

/**
 * 业务规则违规错误
 * 当领域操作违反业务规则时抛出
 *
 * @example
 * ```typescript
 * throw new BusinessRuleViolationError('Cannot exceed 10 tags', { maxTags: 10, current: 11 });
 * ```
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super('BUSINESS_RULE_VIOLATION', message, context, 400);
  }
}

/**
 * 资源未找到错误
 * 当查询的资源不存在时抛出
 *
 * @example
 * ```typescript
 * throw new NotFoundError('TaskTemplate', 'tpl-123');
 * ```
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string) {
    super('NOT_FOUND', `${resource} not found: ${identifier}`, { resource, identifier }, 404);
  }
}

/**
 * 验证错误
 * 当输入数据验证失败时抛出
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid input', { title: 'Title is required', email: 'Invalid email format' });
 * ```
 */
export class ValidationError extends DomainError {
  constructor(message: string, fields?: Record<string, string>) {
    super('VALIDATION_ERROR', message, fields ? { fields } : undefined, 400);
  }
}

/**
 * 未授权错误
 * 当用户未认证或 Token 无效时抛出
 *
 * @example
 * ```typescript
 * throw new UnauthorizedError('Invalid or expired token');
 * ```
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized access') {
    super('UNAUTHORIZED', message, undefined, 401);
  }
}

/**
 * 禁止访问错误
 * 当用户已认证但无权限访问资源时抛出
 *
 * @example
 * ```typescript
 * throw new ForbiddenError('You do not have permission to delete this task');
 * ```
 */
export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden access') {
    super('FORBIDDEN', message, undefined, 403);
  }
}

/**
 * 冲突错误
 * 当资源状态冲突时抛出（例如唯一性约束违反）
 *
 * @example
 * ```typescript
 * throw new ConflictError('Username already exists', { username: 'john' });
 * ```
 */
export class ConflictError extends DomainError {
  constructor(message: string, context?: Record<string, any>) {
    super('CONFLICT', message, context, 409);
  }
}

/**
 * 内部服务器错误
 * 当发生未预期的系统错误时抛出
 *
 * @example
 * ```typescript
 * throw new InternalServerError('Database connection failed', { error: err.message });
 * ```
 */
export class InternalServerError extends DomainError {
  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super('INTERNAL_SERVER_ERROR', message, context, 500);
  }
}

/**
 * ============================================================
 * 错误工具函数
 * ============================================================
 */

/**
 * 检查是否为 DomainError
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * 从未知错误中提取错误信息
 */
export function extractErrorInfo(error: unknown): {
  code: string;
  message: string;
  httpStatus: number;
  context?: Record<string, any>;
} {
  if (isDomainError(error)) {
    return {
      code: error.code,
      message: error.message,
      httpStatus: error.httpStatus,
      context: error.context,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      httpStatus: 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    httpStatus: 500,
  };
}
