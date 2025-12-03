/**
 * 错误类统一导出
 */

// 基础错误类
export { DomainError } from './DomainError';
import { DomainError } from './DomainError';

// 通用错误类
export class ValidationError extends DomainError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string, context: Record<string, any> = {}) {
    super(
      `${resource} not found: ${identifier}`,
      'NOT_FOUND',
      { resource, identifier, ...context },
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized', context: Record<string, any> = {}) {
    super(message, 'UNAUTHORIZED', context);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden', context: Record<string, any> = {}) {
    super(message, 'FORBIDDEN', context);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, 'CONFLICT', context);
  }
}

export class InternalServerError extends DomainError {
  constructor(
    message: string = 'Internal server error',
    context: Record<string, any> = {},
    originalError?: Error,
  ) {
    super(message, 'INTERNAL_SERVER_ERROR', context, originalError);
  }
}
