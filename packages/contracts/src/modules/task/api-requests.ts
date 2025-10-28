/**
 * Task Module API Requests
 * 任务模块 API 请求/响应类型定义
 */

import type {
  TaskTemplateServerDTO,
  TaskTemplateClientDTO,
  TaskInstanceServerDTO,
  TaskInstanceClientDTO,
  TaskDependencyServerDTO,
  TaskDependencyClientDTO,
  TaskStatisticsServerDTO,
  TaskStatisticsClientDTO,
} from './aggregates';
import type {
  TaskTemplateHistoryServerDTO,
  TaskTemplateHistoryClientDTO,
} from './entities';
import type {
  TaskTimeConfigServerDTO,
  RecurrenceRuleServerDTO,
  TaskReminderConfigServerDTO,
  TaskGoalBindingServerDTO,
} from './value-objects';
import type {
  TaskType,
  TaskTemplateStatus,
  TaskInstanceStatus,
  DependencyType,
  ImportanceLevel,
  UrgencyLevel,
} from './enums';
import type { BatchOperationResponseDTO } from '../../shared/dtos';

// ============ TaskTemplate 请求/响应 ============

/**
 * 创建任务模板请求
 */
export interface CreateTaskTemplateRequest {
  accountUuid: string;
  title: string;
  description?: string;
  taskType: TaskType;
  timeConfig: TaskTimeConfigServerDTO;
  recurrenceRule?: RecurrenceRuleServerDTO;
  reminderConfig?: TaskReminderConfigServerDTO;
  importance: ImportanceLevel;
  urgency: UrgencyLevel;
  goalBinding?: TaskGoalBindingServerDTO;
  folderUuid?: string;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
}

/**
 * 更新任务模板请求
 */
export interface UpdateTaskTemplateRequest {
  title?: string;
  description?: string;
  timeConfig?: TaskTimeConfigServerDTO;
  recurrenceRule?: RecurrenceRuleServerDTO;
  reminderConfig?: TaskReminderConfigServerDTO;
  importance?: ImportanceLevel;
  urgency?: UrgencyLevel;
  folderUuid?: string;
  tags?: string[];
  color?: string;
  generateAheadDays?: number;
}

/**
 * 查询任务模板请求
 */
export interface QueryTaskTemplatesRequest {
  accountUuid: string;
  status?: TaskTemplateStatus[];
  taskType?: TaskType[];
  importance?: ImportanceLevel[];
  urgency?: UrgencyLevel[];
  folderUuid?: string;
  goalUuid?: string;
  tags?: string[];
  keyword?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeInstances?: boolean;
  includeHistory?: boolean;
}

/**
 * 生成任务实例请求
 */
export interface GenerateInstancesRequest {
  templateUuid: string;
  toDate: number; // 生成到哪个日期（时间戳）
}

/**
 * 绑定到目标请求
 */
export interface BindToGoalRequest {
  goalUuid: string;
  keyResultUuid?: string;
  incrementValue?: number;
}

/**
 * 任务模板响应
 */
export interface TaskTemplateResponse {
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
}

/**
 * 任务模板列表响应
 */
export interface TaskTemplatesResponse {
  templates: (TaskTemplateServerDTO | TaskTemplateClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============ TaskInstance 请求/响应 ============

/**
 * 创建任务实例请求（通常由系统自动生成，不需要手动创建）
 */
export interface CreateTaskInstanceRequest {
  templateUuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  scheduledStartTime: number;
  scheduledEndTime: number;
  reminderTime?: number;
  tags?: string[];
}

/**
 * 更新任务实例请求
 */
export interface UpdateTaskInstanceRequest {
  title?: string;
  description?: string;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  reminderTime?: number;
  tags?: string[];
}

/**
 * 查询任务实例请求
 */
export interface QueryTaskInstancesRequest {
  accountUuid: string;
  templateUuid?: string;
  status?: TaskInstanceStatus[];
  startDate?: number;
  endDate?: number;
  tags?: string[];
  keyword?: string;
  sortBy?: 'scheduledStartTime' | 'createdAt' | 'completedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * 完成任务实例请求
 */
export interface CompleteTaskInstanceRequest {
  duration?: number; // 实际耗时（分钟）
  note?: string; // 完成备注
  rating?: number; // 满意度评分（1-5）
}

/**
 * 跳过任务实例请求
 */
export interface SkipTaskInstanceRequest {
  reason?: string; // 跳过原因
}

/**
 * 任务实例响应
 */
export interface TaskInstanceResponse {
  instance: TaskInstanceServerDTO | TaskInstanceClientDTO;
}

/**
 * 任务实例列表响应
 */
export interface TaskInstancesResponse {
  instances: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * 检查过期实例响应
 */
export interface CheckExpiredInstancesResponse {
  count: number;
  instances: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
}

// ============ TaskDependency 请求/响应 ============
// 注意：CreateTaskDependencyRequest、UpdateTaskDependencyRequest、ValidateDependencyRequest
// 已在 TaskDependencyClient.ts 中定义，这里不重复定义

/**
 * 获取依赖链请求
 */
export interface GetDependencyChainRequest {
  taskUuid: string;
  maxDepth?: number; // 最大深度（防止循环依赖导致无限查询）
}

/**
 * 任务依赖响应
 */
export interface TaskDependencyResponse {
  dependency: TaskDependencyServerDTO | TaskDependencyClientDTO;
}

/**
 * 任务依赖列表响应
 */
export interface TaskDependenciesResponse {
  dependencies: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
  total: number;
}

/**
 * 依赖链响应
 */
export interface DependencyChainResponse {
  chain: Array<{
    task: TaskTemplateServerDTO | TaskTemplateClientDTO;
    dependencies: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
    level: number; // 层级（0 表示根任务）
  }>;
}

// 注意：ValidateDependencyResponse 已在 TaskDependencyClient.ts 中定义

// ============ TaskStatistics 请求/响应 ============

/**
 * 获取任务统计请求
 */
export interface GetTaskStatisticsRequest {
  accountUuid: string;
  forceRecalculate?: boolean;
}

/**
 * 任务统计响应
 */
export interface TaskStatisticsResponse {
  statistics: TaskStatisticsServerDTO | TaskStatisticsClientDTO;
}

/**
 * 重新计算统计请求
 */
export interface RecalculateTaskStatisticsRequest {
  accountUuid: string;
  force?: boolean; // 是否强制重算（即使已存在）
}

/**
 * 重新计算统计响应
 */
export interface RecalculateTaskStatisticsResponse {
  success: boolean;
  message: string;
  statistics: TaskStatisticsServerDTO;
}

// ============ 批量操作 ============

/**
 * 批量更新任务模板状态请求
 */
export interface BatchUpdateTemplateStatusRequest {
  templateUuids: string[];
  status: TaskTemplateStatus;
}

/**
 * 批量删除任务模板请求
 */
export interface BatchDeleteTemplatesRequest {
  templateUuids: string[];
  hardDelete?: boolean;
}

/**
 * 批量移动任务模板请求
 */
export interface BatchMoveTemplatesRequest {
  templateUuids: string[];
  targetFolderUuid: string;
}

/**
 * 批量完成任务实例请求
 */
export interface BatchCompleteInstancesRequest {
  instanceUuids: string[];
  note?: string;
}

/**
 * 批量跳过任务实例请求
 */
export interface BatchSkipInstancesRequest {
  instanceUuids: string[];
  reason?: string;
}

/**
 * 批量删除任务实例请求
 */
export interface BatchDeleteInstancesRequest {
  instanceUuids: string[];
}

/**
 * 批量操作响应
 */
export type BatchOperationResponse = BatchOperationResponseDTO;

// ============ 任务历史 ============

/**
 * 获取任务模板历史请求
 */
export interface GetTaskTemplateHistoryRequest {
  templateUuid: string;
  page?: number;
  pageSize?: number;
}

/**
 * 任务模板历史响应
 */
export interface TaskTemplateHistoryResponse {
  history: (TaskTemplateHistoryServerDTO | TaskTemplateHistoryClientDTO)[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ============ 导出/导入 ============

/**
 * 导出任务模板请求
 */
export interface ExportTaskTemplatesRequest {
  accountUuid: string;
  templateUuids?: string[];
  format: 'json' | 'csv' | 'markdown';
  includeInstances?: boolean;
  includeHistory?: boolean;
}

/**
 * 导出响应
 */
export interface ExportTaskTemplatesResponse {
  data: string | Uint8Array;
  filename: string;
  mimeType: string;
}

/**
 * 导入任务模板请求
 */
export interface ImportTaskTemplatesRequest {
  accountUuid: string;
  data: string | Uint8Array;
  format: 'json' | 'csv';
  folderUuid?: string;
  overwriteExisting?: boolean;
}

/**
 * 导入响应
 */
export interface ImportTaskTemplatesResponse {
  importedCount: number;
  skippedCount: number;
  errors?: Array<{
    line: number;
    error: string;
  }>;
}

// ============ 任务聚合视图 ============

/**
 * 任务模板聚合视图响应
 * 包含模板及其所有关联实体的完整视图
 */
export interface TaskTemplateAggregateViewResponse {
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
  instances?: (TaskInstanceServerDTO | TaskInstanceClientDTO)[];
  history?: (TaskTemplateHistoryServerDTO | TaskTemplateHistoryClientDTO)[];
  dependencies?: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
  statistics?: {
    totalInstances: number;
    completedInstances: number;
    pendingInstances: number;
    skippedInstances: number;
    expiredInstances: number;
    completionRate: number;
    averageDuration: number;
    averageRating: number;
  };
}

/**
 * 任务实例聚合视图响应
 */
export interface TaskInstanceAggregateViewResponse {
  instance: TaskInstanceServerDTO | TaskInstanceClientDTO;
  template: TaskTemplateServerDTO | TaskTemplateClientDTO;
  dependencies?: (TaskDependencyServerDTO | TaskDependencyClientDTO)[];
}

// ============ 统计相关事件 ============

/**
 * 任务统计更新事件
 * 用于事件驱动的增量统计更新
 */
export interface TaskStatisticsUpdateEvent {
  type:
    | 'template.created'
    | 'template.deleted'
    | 'template.status_changed'
    | 'template.archived'
    | 'instance.created'
    | 'instance.deleted'
    | 'instance.completed'
    | 'instance.started'
    | 'instance.skipped'
    | 'instance.expired'
    | 'dependency.created'
    | 'dependency.deleted';
  accountUuid: string;
  timestamp: number;
  payload: {
    templateUuid?: string;
    instanceUuid?: string;
    previousStatus?: TaskTemplateStatus | TaskInstanceStatus;
    newStatus?: TaskTemplateStatus | TaskInstanceStatus;
    taskType?: TaskType;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    duration?: number;
    rating?: number;
    [key: string]: any;
  };
}
