/**
 * Schedule 模块错误类
 * 提供明确的错误信息和上下文，便于调试和错误追踪
 */

import { DomainError } from '@dailyuse/utils';
import type { SourceModule } from '@dailyuse/contracts';

/**
 * 调度策略未找到错误
 * 当请求的源模块没有对应的调度策略时抛出
 */
export class ScheduleStrategyNotFoundError extends DomainError {
  constructor(
    sourceModule: SourceModule,
    context?: {
      availableModules?: SourceModule[];
      operationId?: string;
    },
  ) {
    super(
      'SCHEDULE_STRATEGY_NOT_FOUND',
      `No schedule strategy found for source module: ${sourceModule}`,
      {
        sourceModule,
        availableModules: context?.availableModules,
        suggestion: 'Check if the module has a registered schedule strategy',
      },
      500,
      {
        operationId: context?.operationId,
      },
    );
  }
}

/**
 * 源实体不需要调度错误
 * 当源实体不满足调度条件时抛出（正常业务场景）
 */
export class SourceEntityNoScheduleRequiredError extends DomainError {
  constructor(
    sourceModule: SourceModule,
    sourceEntityId: string,
    reason: string,
    context?: {
      entityData?: Record<string, any>;
      operationId?: string;
    },
  ) {
    super(
      'SOURCE_ENTITY_NO_SCHEDULE_REQUIRED',
      `Source entity does not require schedule: ${sourceModule}:${sourceEntityId} - ${reason}`,
      {
        sourceModule,
        sourceEntityId,
        reason,
        entityData: context?.entityData,
      },
      400,
      {
        operationId: context?.operationId,
      },
    );
  }
}

/**
 * 调度配置无效错误
 * 当调度配置不符合要求时抛出
 */
export class InvalidScheduleConfigError extends DomainError {
  constructor(
    message: string,
    context?: {
      scheduleConfig?: Record<string, any>;
      validationErrors?: string[];
      operationId?: string;
      step?: string;
    },
  ) {
    super(
      'INVALID_SCHEDULE_CONFIG',
      `Invalid schedule configuration: ${message}`,
      {
        scheduleConfig: context?.scheduleConfig,
        validationErrors: context?.validationErrors,
      },
      400,
      {
        operationId: context?.operationId,
        step: context?.step,
      },
    );
  }
}

/**
 * 调度任务未找到错误
 */
export class ScheduleTaskNotFoundError extends DomainError {
  constructor(
    identifier: string,
    identifierType: 'uuid' | 'sourceEntity',
    context?: {
      accountUuid?: string;
      operationId?: string;
    },
  ) {
    super(
      'SCHEDULE_TASK_NOT_FOUND',
      `Schedule task not found: ${identifierType}=${identifier}`,
      {
        identifier,
        identifierType,
        accountUuid: context?.accountUuid,
      },
      404,
      {
        operationId: context?.operationId,
      },
    );
  }
}

/**
 * 调度任务创建失败错误
 */
export class ScheduleTaskCreationError extends DomainError {
  constructor(
    sourceModule: SourceModule,
    sourceEntityId: string,
    reason: string,
    context?: {
      sourceEntity?: Record<string, any>;
      scheduleConfig?: Record<string, any>;
      operationId?: string;
      step?: string;
      originalError?: Error;
    },
  ) {
    super(
      'SCHEDULE_TASK_CREATION_FAILED',
      `Failed to create schedule task for ${sourceModule}:${sourceEntityId} - ${reason}`,
      {
        sourceModule,
        sourceEntityId,
        reason,
        sourceEntity: context?.sourceEntity,
        scheduleConfig: context?.scheduleConfig,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError: context?.originalError,
      },
    );
  }
}

/**
 * 调度任务更新失败错误
 */
export class ScheduleTaskUpdateError extends DomainError {
  constructor(
    taskUuid: string,
    reason: string,
    context?: {
      updates?: Record<string, any>;
      operationId?: string;
      step?: string;
      originalError?: Error;
    },
  ) {
    super(
      'SCHEDULE_TASK_UPDATE_FAILED',
      `Failed to update schedule task ${taskUuid} - ${reason}`,
      {
        taskUuid,
        reason,
        updates: context?.updates,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError: context?.originalError,
      },
    );
  }
}

/**
 * 调度任务执行失败错误
 */
export class ScheduleTaskExecutionError extends DomainError {
  constructor(
    taskUuid: string,
    reason: string,
    context?: {
      executionId?: string;
      executionAttempt?: number;
      operationId?: string;
      step?: string;
      originalError?: Error;
    },
  ) {
    super(
      'SCHEDULE_TASK_EXECUTION_FAILED',
      `Schedule task execution failed: ${taskUuid} - ${reason}`,
      {
        taskUuid,
        reason,
        executionId: context?.executionId,
        executionAttempt: context?.executionAttempt,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError: context?.originalError,
      },
    );
  }
}

/**
 * 调度任务删除失败错误
 */
export class ScheduleTaskDeletionError extends DomainError {
  constructor(
    taskUuid: string,
    reason: string,
    context?: {
      operationId?: string;
      step?: string;
      originalError?: Error;
    },
  ) {
    super(
      'SCHEDULE_TASK_DELETION_FAILED',
      `Failed to delete schedule task ${taskUuid} - ${reason}`,
      {
        taskUuid,
        reason,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError: context?.originalError,
      },
    );
  }
}

/**
 * 调度引擎错误
 * 当调度引擎（如 Bree）操作失败时抛出
 */
export class ScheduleEngineError extends DomainError {
  constructor(
    operation: 'start' | 'stop' | 'add' | 'remove' | 'run',
    reason: string,
    context?: {
      taskUuid?: string;
      engineType?: string;
      operationId?: string;
      step?: string;
      originalError?: Error;
    },
  ) {
    super(
      'SCHEDULE_ENGINE_ERROR',
      `Schedule engine ${operation} failed - ${reason}`,
      {
        operation,
        reason,
        taskUuid: context?.taskUuid,
        engineType: context?.engineType,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError: context?.originalError,
      },
    );
  }
}

/**
 * Cron 表达式无效错误
 */
export class InvalidCronExpressionError extends DomainError {
  constructor(
    cronExpression: string,
    context?: {
      validationError?: string;
      operationId?: string;
      step?: string;
    },
  ) {
    super(
      'INVALID_CRON_EXPRESSION',
      `Invalid cron expression: ${cronExpression}`,
      {
        cronExpression,
        validationError: context?.validationError,
        suggestion: 'Use standard cron format: "* * * * *" (minute hour day month weekday)',
      },
      400,
      {
        operationId: context?.operationId,
        step: context?.step,
      },
    );
  }
}

/**
 * 调度统计错误
 */
export class ScheduleStatisticsError extends DomainError {
  constructor(
    operation: string,
    reason: string,
    context?: {
      accountUuid?: string;
      sourceModule?: SourceModule;
      operationId?: string;
      step?: string;
      originalError?: Error;
    },
  ) {
    super(
      'SCHEDULE_STATISTICS_ERROR',
      `Schedule statistics ${operation} failed - ${reason}`,
      {
        operation,
        reason,
        accountUuid: context?.accountUuid,
        sourceModule: context?.sourceModule,
      },
      500,
      {
        operationId: context?.operationId,
        step: context?.step,
        originalError: context?.originalError,
      },
    );
  }
}

/**
 * 重试策略错误
 */
export class RetryPolicyError extends DomainError {
  constructor(
    reason: string,
    context?: {
      currentAttempt?: number;
      maxAttempts?: number;
      operationId?: string;
      step?: string;
    },
  ) {
    super(
      'RETRY_POLICY_ERROR',
      `Retry policy error - ${reason}`,
      {
        reason,
        currentAttempt: context?.currentAttempt,
        maxAttempts: context?.maxAttempts,
      },
      400,
      {
        operationId: context?.operationId,
        step: context?.step,
      },
    );
  }
}
