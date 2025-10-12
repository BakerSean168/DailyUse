/**
 * Schedule Module - API Request/Response Types
 * 调度模块 - API 请求/响应类型定义
 */

import type { ScheduleTaskClientDTO } from './aggregates/ScheduleTaskClient';
import type { ScheduleStatisticsClientDTO } from './aggregates/ScheduleStatisticsClient';
import type { ScheduleExecutionClientDTO } from './entities/ScheduleExecutionClient';
import type {
  ScheduleTaskStatus,
  ExecutionStatus,
  SourceModule,
  TaskPriority,
  Timezone,
} from './enums';
import type {
  ScheduleConfigServerDTO,
  RetryPolicyServerDTO,
  TaskMetadataServerDTO,
} from './value-objects';

// ============ ScheduleTask 请求 ============

/**
 * 创建调度任务请求
 */
export interface CreateScheduleTaskRequestDTO {
  readonly name: string;
  readonly sourceModule: SourceModule;
  readonly sourceEntityId: string;
  readonly schedule: ScheduleConfigServerDTO;
  readonly description?: string;
  readonly metadata?: Partial<TaskMetadataServerDTO>;
  readonly retryPolicy?: Partial<RetryPolicyServerDTO>;
  readonly enabled?: boolean;
}

/**
 * 更新调度任务请求
 */
export interface UpdateScheduleTaskRequestDTO {
  readonly name?: string;
  readonly description?: string;
  readonly schedule?: Partial<ScheduleConfigServerDTO>;
  readonly metadata?: Partial<TaskMetadataServerDTO>;
  readonly retryPolicy?: Partial<RetryPolicyServerDTO>;
  readonly enabled?: boolean;
}

/**
 * 更新任务调度配置请求
 */
export interface UpdateScheduleConfigRequestDTO {
  readonly cronExpression?: string;
  readonly timezone?: Timezone;
  readonly startDate?: number | null;
  readonly endDate?: number | null;
  readonly maxExecutions?: number | null;
}

/**
 * 更新任务元数据请求
 */
export interface UpdateTaskMetadataRequestDTO {
  readonly payload?: Record<string, any>;
  readonly tags?: string[];
  readonly priority?: TaskPriority;
  readonly timeout?: number | null;
}

/**
 * 任务查询参数
 */
export interface ScheduleTaskQueryParamsDTO {
  readonly sourceModule?: SourceModule;
  readonly sourceEntityId?: string;
  readonly status?: ScheduleTaskStatus;
  readonly enabled?: boolean;
  readonly search?: string; // 搜索名称或描述
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'createdAt' | 'updatedAt' | 'nextRunAt' | 'name';
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * 批量操作请求
 */
export interface BatchScheduleTaskOperationRequestDTO {
  readonly taskUuids: readonly string[];
  readonly operation: 'pause' | 'resume' | 'cancel' | 'enable' | 'disable';
  readonly reason?: string;
}

// ============ ScheduleTask 响应 ============

/**
 * 任务详情响应（单个）
 */
export type ScheduleTaskDTO = ScheduleTaskClientDTO;

/**
 * 任务列表响应
 */
export interface ScheduleTaskListResponseDTO {
  readonly items: readonly ScheduleTaskClientDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponseDTO {
  readonly success: readonly string[]; // 成功的 taskUuid 列表
  readonly failed: readonly {
    taskUuid: string;
    error: string;
  }[];
  readonly total: number;
  readonly successCount: number;
  readonly failedCount: number;
}

// ============ ScheduleExecution 请求 ============

/**
 * 执行记录查询参数
 */
export interface ScheduleExecutionQueryParamsDTO {
  readonly taskUuid?: string;
  readonly status?: ExecutionStatus;
  readonly startTime?: number; // epoch ms
  readonly endTime?: number; // epoch ms
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'executionTime' | 'duration';
  readonly sortOrder?: 'asc' | 'desc';
}

// ============ ScheduleExecution 响应 ============

/**
 * 执行记录详情响应（单个）
 */
export type ScheduleExecutionDTO = ScheduleExecutionClientDTO;

/**
 * 执行记录列表响应
 */
export interface ScheduleExecutionListResponseDTO {
  readonly items: readonly ScheduleExecutionClientDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * 执行历史统计响应
 */
export interface ExecutionHistoryStatsDTO {
  readonly taskUuid: string;
  readonly totalExecutions: number;
  readonly successfulExecutions: number;
  readonly failedExecutions: number;
  readonly avgDuration: number;
  readonly recentExecutions: readonly ScheduleExecutionClientDTO[];
}

// ============ ScheduleStatistics 响应 ============

/**
 * 统计数据响应
 */
export type ScheduleStatisticsDTO = ScheduleStatisticsClientDTO;

/**
 * 仪表盘统计响应
 */
export interface ScheduleDashboardStatsDTO {
  readonly overview: ScheduleStatisticsClientDTO;
  readonly recentExecutions: readonly ScheduleExecutionClientDTO[];
  readonly failedTasks: readonly ScheduleTaskClientDTO[];
  readonly upcomingTasks: readonly {
    task: ScheduleTaskClientDTO;
    nextRunAt: number;
    timeUntilRun: number; // 毫秒
  }[];
}

/**
 * 模块统计响应
 */
export interface ModuleStatsResponseDTO {
  readonly moduleName: SourceModule;
  readonly totalTasks: number;
  readonly activeTasks: number;
  readonly totalExecutions: number;
  readonly successRate: number;
  readonly avgDuration: number;
  readonly recentTasks: readonly ScheduleTaskClientDTO[];
}

// ============ 通用响应 ============

/**
 * 操作成功响应
 */
export interface ScheduleOperationSuccessResponseDTO {
  readonly success: boolean;
  readonly message: string;
  readonly data?: any;
}

/**
 * 错误响应
 */
export interface ScheduleErrorResponseDTO {
  readonly success: false;
  readonly error: string;
  readonly code?: string;
  readonly details?: any;
}
