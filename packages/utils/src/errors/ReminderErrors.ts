/**
 * Reminder 模块专用错误类
 * 
 * 职责：
 * 1. 提供语义化的错误类型
 * 2. 统一错误代码和 HTTP 状态码
 * 3. 提供详细的上下文信息用于调试
 */

import { DomainError } from './DomainError';

/**
 * 提醒模板方法缺失错误
 * 当从数据库加载的模板对象缺少必要的方法时抛出
 * 
 * 常见原因：
 * - 未正确使用工厂方法创建实例
 * - ORM 返回的是普通对象而非类实例
 * - 类定义未正确加载
 */
export class ReminderTemplateMethodMissingError extends DomainError {
  constructor(
    methodName: string,
    context: {
      uuid: string;
      templateType: string;
      availableMethods?: string[];
      operationId?: string;
      step?: string;
    },
    originalError?: Error,
  ) {
    super(
      'REMINDER_TEMPLATE_METHOD_MISSING',
      `Reminder template is missing required method: ${methodName}`,
      {
        methodName,
        ...context,
      },
      500, // 这是服务器内部错误，不是客户端错误
      {
        operationId: context.operationId,
        step: context.step,
        originalError,
      },
    );
  }
}

/**
 * 提醒模板未找到错误
 */
export class ReminderTemplateNotFoundError extends DomainError {
  constructor(uuid: string, operationId?: string) {
    super(
      'REMINDER_TEMPLATE_NOT_FOUND',
      `Reminder template not found: ${uuid}`,
      { uuid },
      404,
      { operationId },
    );
  }
}

/**
 * 提醒模板更新失败错误
 */
export class ReminderTemplateUpdateError extends DomainError {
  constructor(
    uuid: string,
    reason: string,
    context?: Record<string, any>,
    originalError?: Error,
  ) {
    super(
      'REMINDER_TEMPLATE_UPDATE_FAILED',
      `Failed to update reminder template: ${reason}`,
      {
        uuid,
        ...context,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError,
      },
    );
  }
}

/**
 * 提醒模板保存失败错误
 */
export class ReminderTemplateSaveError extends DomainError {
  constructor(
    uuid: string,
    context?: Record<string, any>,
    originalError?: Error,
  ) {
    super(
      'REMINDER_TEMPLATE_SAVE_FAILED',
      `Failed to save reminder template: ${uuid}`,
      {
        uuid,
        ...context,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError,
      },
    );
  }
}

/**
 * 提醒模板验证错误
 */
export class ReminderTemplateValidationError extends DomainError {
  constructor(
    message: string,
    validationErrors: Record<string, string>,
    operationId?: string,
  ) {
    super(
      'REMINDER_TEMPLATE_VALIDATION_ERROR',
      message,
      { validationErrors },
      400,
      { operationId },
    );
  }
}
