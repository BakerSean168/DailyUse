/**
 * Task 模块专用错误类
 * 继承自 utils 包的 DomainError 基类
 */
import { DomainError } from '@dailyuse/utils';

// ==================== Task 模块错误类 ====================

// ==================== TaskTemplate 错误 ====================

/**
 * 任务模板未找到错误
 */
export class TaskTemplateNotFoundError extends DomainError {
  constructor(templateUuid: string) {
    super(
      'TASK_TEMPLATE_NOT_FOUND',
      `Task template not found: ${templateUuid}`,
      {
        templateUuid,
      },
      404,
    );
  }
}

/**
 * 无效的任务模板状态错误
 */
export class InvalidTaskTemplateStateError extends DomainError {
  constructor(
    message: string,
    context: {
      templateUuid: string;
      currentStatus: string;
      attemptedAction: string;
    },
  ) {
    super('INVALID_TASK_TEMPLATE_STATE', message, context, 400);
  }
}

/**
 * 任务模板已存档错误
 */
export class TaskTemplateArchivedError extends DomainError {
  constructor(templateUuid: string) {
    super('TASK_TEMPLATE_ARCHIVED', 'Cannot modify archived task template', { templateUuid }, 400);
  }
}

// ==================== 标签管理错误 ====================

/**
 * 无效的标签错误
 */
export class InvalidTagError extends DomainError {
  constructor(
    message: string,
    context: {
      tag: string;
      reason: string;
    },
  ) {
    super('INVALID_TAG', message, context, 400);
  }
}

/**
 * 标签数量过多错误
 */
export class TooManyTagsError extends DomainError {
  constructor(currentCount: number, maxCount: number, context?: Record<string, unknown>) {
    super(
      'TOO_MANY_TAGS',
      `Cannot add more tags. Current: ${currentCount}, Max: ${maxCount}`,
      { currentCount, maxCount, ...context },
      400,
    );
  }
}

/**
 * 标签未找到错误
 */
export class TagNotFoundError extends DomainError {
  constructor(tag: string, templateUuid: string) {
    super(
      'TAG_NOT_FOUND',
      `Tag "${tag}" not found in task template`,
      {
        tag,
        templateUuid,
      },
      404,
    );
  }
}

/**
 * 标签已存在错误
 */
export class TagAlreadyExistsError extends DomainError {
  constructor(tag: string, templateUuid: string) {
    super(
      'TAG_ALREADY_EXISTS',
      `Tag "${tag}" already exists in task template`,
      {
        tag,
        templateUuid,
      },
      400,
    );
  }
}

// ==================== TaskInstance 错误 ====================

/**
 * 任务实例未找到错误
 */
export class TaskInstanceNotFoundError extends DomainError {
  constructor(instanceUuid: string) {
    super(
      'TASK_INSTANCE_NOT_FOUND',
      `Task instance not found: ${instanceUuid}`,
      {
        instanceUuid,
      },
      404,
    );
  }
}

/**
 * 无效的任务实例状态错误
 */
export class InvalidTaskInstanceStateError extends DomainError {
  constructor(
    message: string,
    context: {
      instanceUuid: string;
      currentStatus: string;
      attemptedAction: string;
    },
  ) {
    super('INVALID_TASK_INSTANCE_STATE', message, context, 400);
  }
}

/**
 * 任务实例已完成错误
 */
export class TaskInstanceAlreadyCompletedError extends DomainError {
  constructor(instanceUuid: string) {
    super(
      'TASK_INSTANCE_ALREADY_COMPLETED',
      'Cannot modify completed task instance',
      { instanceUuid },
      400,
    );
  }
}

// ==================== 重复规则错误 ====================

/**
 * 无效的重复规则错误
 */
export class InvalidRecurrenceRuleError extends DomainError {
  constructor(
    message: string,
    context: {
      frequency?: string;
      reason: string;
    },
  ) {
    super('INVALID_RECURRENCE_RULE', message, context, 400);
  }
}

/**
 * 重复规则未实现错误
 */
export class RecurrenceRuleNotImplementedError extends DomainError {
  constructor(frequency: string) {
    super(
      'RECURRENCE_RULE_NOT_IMPLEMENTED',
      `Recurrence frequency "${frequency}" is not fully implemented`,
      { frequency },
      501,
    );
  }
}

// ==================== 实例生成错误 ====================

/**
 * 实例生成失败错误
 */
export class InstanceGenerationFailedError extends DomainError {
  constructor(
    message: string,
    context: {
      templateUuid: string;
      fromDate: number;
      toDate: number;
      reason: string;
    },
  ) {
    super('INSTANCE_GENERATION_FAILED', message, context, 500);
  }
}

/**
 * 无效的日期范围错误
 */
export class InvalidDateRangeError extends DomainError {
  constructor(fromDate: number, toDate: number) {
    super(
      'INVALID_DATE_RANGE',
      `Invalid date range: fromDate (${fromDate}) must be before toDate (${toDate})`,
      { fromDate, toDate },
      400,
    );
  }
}

// ==================== 时间配置错误 ====================

/**
 * 无效的时间配置错误
 */
export class InvalidTimeConfigError extends DomainError {
  constructor(
    message: string,
    context: {
      reason: string;
    },
  ) {
    super('INVALID_TIME_CONFIG', message, context, 400);
  }
}

/**
 * 时间冲突错误
 */
export class TimeConflictError extends DomainError {
  constructor(
    message: string,
    context: {
      conflictingTasks: string[];
    },
  ) {
    super('TIME_CONFLICT', message, context, 409);
  }
}

// ==================== 目标绑定错误 ====================

/**
 * 无效的目标绑定错误
 */
export class InvalidGoalBindingError extends DomainError {
  constructor(
    message: string,
    context: {
      goalUuid?: string;
      reason: string;
    },
  ) {
    super('INVALID_GOAL_BINDING', message, context, 400);
  }
}

/**
 * 目标不存在错误
 */
export class GoalNotFoundError extends DomainError {
  constructor(goalUuid: string) {
    super('GOAL_NOT_FOUND', `Goal not found: ${goalUuid}`, { goalUuid }, 404);
  }
}

// ==================== 权限错误 ====================

/**
 * 任务模板访问被拒绝错误
 */
export class TaskTemplateAccessDeniedError extends DomainError {
  constructor(templateUuid: string, accountUuid: string) {
    super(
      'TASK_TEMPLATE_ACCESS_DENIED',
      'You do not have permission to access this task template',
      { templateUuid, accountUuid },
      403,
    );
  }
}

/**
 * 任务实例访问被拒绝错误
 */
export class TaskInstanceAccessDeniedError extends DomainError {
  constructor(instanceUuid: string, accountUuid: string) {
    super(
      'TASK_INSTANCE_ACCESS_DENIED',
      'You do not have permission to access this task instance',
      { instanceUuid, accountUuid },
      403,
    );
  }
}

// ==================== 工具函数 ====================

/**
 * 检查是否为 Task 模块的 DomainError
 */
export function isTaskError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

/**
 * 从未知错误中提取错误信息
 */
export function extractTaskErrorInfo(error: unknown): {
  code: string;
  message: string;
  httpStatus: number;
  context?: Record<string, unknown>;
} {
  if (isTaskError(error)) {
    return {
      code: error.code,
      message: error.message,
      httpStatus: error.httpStatus,
      context: error.context,
    };
  }

  // Handle standard Error objects
  const err = error as any;
  if (err && typeof err === 'object' && 'message' in err) {
    return {
      code: 'UNKNOWN_ERROR',
      message: String(err.message),
      httpStatus: 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    httpStatus: 500,
  };
}
