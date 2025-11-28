/**
 * Task Module - Type Aliases
 * 任务模块 - 类型别名
 *
 * 这个文件提供简短的类型别名，便于在应用中导入使用
 */

import {
  TaskTemplateStatus,
  TaskInstanceStatus,
  TimeType,
  TaskType,
} from '@dailyuse/contracts/task';
import { TaskTemplate } from './aggregates/TaskTemplate';
import { TaskInstance } from './aggregates/TaskInstance';
import { TaskStatistics } from './aggregates/TaskStatistics';
import { TaskTemplateHistory } from './entities/TaskTemplateHistory';

// 重新导出聚合根和实体（作为值导出，可以使用类方法）
export { TaskTemplate, TaskInstance, TaskStatistics, TaskTemplateHistory };

// 重新导出值对象（作为值导出，可以使用类方法）
export {
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
  TaskGoalBinding,
} from './value-objects';

// 从 contracts 重新导出常用类型
export type { TaskType } from '@dailyuse/contracts/task';
