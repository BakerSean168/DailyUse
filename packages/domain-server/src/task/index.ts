/**
 * Task Domain Server 模块导出
 *
 * 模块结构：
 * - value-objects: 值对象
 * - entities: 实体
 * - aggregates: 聚合根
 * - repositories: 仓储接口
 * - services: 领域服务
 */

// 值对象
export {
  RecurrenceRule,
  TaskTimeConfig,
  TaskReminderConfig,
  TaskGoalBinding,
  CompletionRecord,
  SkipRecord,
} from './value-objects';

// 实体
export { TaskTemplateHistory } from './entities';

// 聚合根
export { TaskInstance, TaskTemplate, TaskStatistics, TaskDependency } from './aggregates';

// 仓储接口
export type {
  ITaskInstanceRepository,
  ITaskTemplateRepository,
  ITaskDependencyRepository,
  ITaskStatisticsRepository,
} from './repositories';

// 领域服务
export {
  TaskInstanceGenerationService,
  TaskExpirationService,
  TaskDependencyService,
} from './services';

// 错误类
export * from './errors';
