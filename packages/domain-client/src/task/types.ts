/**
 * Task Module - Type Aliases
 * 任务模块 - 类型别名
 *
 * 这个文件提供简短的类型别名，便于在应用中导入使用
 */

import { TaskTemplate } from './aggregates/TaskTemplate';
import { TaskInstance } from './aggregates/TaskInstance';
import { TaskStatistics } from './aggregates/TaskStatistics';
import { TaskTemplateHistoryClient } from './entities/TaskTemplateHistoryClient';

// 重新导出聚合根（现在不需要别名了）
export { TaskTemplate, TaskInstance, TaskStatistics };

// 实体别名
export type TaskTemplateHistory = TaskTemplateHistoryClient;
export { TaskTemplateHistoryClient };

// 值对象别名
export type {
  TaskTimeConfigClient as TaskTimeConfig,
  RecurrenceRuleClient as RecurrenceRule,
  TaskReminderConfigClient as TaskReminderConfig,
  TaskGoalBindingClient as TaskGoalBinding,
} from './value-objects';

// 从 contracts 重新导出常用类型
export type {
  TaskType,
  TaskTemplateStatus,
  TaskInstanceStatus,
  TimeType,
} from '@dailyuse/contracts';
