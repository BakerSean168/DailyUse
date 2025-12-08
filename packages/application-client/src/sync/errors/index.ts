/**
 * @fileoverview 同步适配器错误类型
 * @module @dailyuse/application-client/sync/errors
 */

/**
 * 基础同步错误类
 */
export class SyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SyncError';
    Object.setPrototypeOf(this, SyncError.prototype);
  }
}

/**
 * 认证失败错误
 * 
 * 当凭据无效或认证流程失败时抛出
 */
export class AuthenticationError extends SyncError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 网络错误
 * 
 * 当网络请求失败时抛出
 */
export class NetworkError extends SyncError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * 冲突错误
 * 
 * 当检测到版本冲突时抛出
 */
export class ConflictError extends SyncError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 配额超限错误
 * 
 * 当存储空间或 API 调用次数超限时抛出
 */
export class QuotaExceededError extends SyncError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'QUOTA_EXCEEDED', details);
    this.name = 'QuotaExceededError';
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

/**
 * 实体未找到错误
 * 
 * 当请求的实体不存在时抛出
 */
export class NotFoundError extends SyncError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 数据验证错误
 * 
 * 当数据格式不正确或校验失败时抛出
 */
export class ValidationError extends SyncError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
