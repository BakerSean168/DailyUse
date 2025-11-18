/**
 * Reminder domain services
 */

// 纯业务逻辑服务（推荐使用）
export { ReminderTemplateBusinessService } from './ReminderTemplateBusinessService';
export type {
  TemplateEffectiveStatus,
  GroupAssignmentValidation,
} from './ReminderTemplateBusinessService';

export { ReminderGroupBusinessService } from './ReminderGroupBusinessService';
export type {
  GroupStatistics,
  GroupDeletionValidation,
  GroupNameValidation,
} from './ReminderGroupBusinessService';

// 即将到来的提醒计算服务
export { UpcomingReminderCalculationService } from './UpcomingReminderCalculationService';
export type { UpcomingReminderDTO } from './UpcomingReminderCalculationService';

// 旧的服务（待废弃）
export { ReminderTemplateControlService } from './ReminderTemplateControlService';
export type { ITemplateEffectiveStatus } from './ReminderTemplateControlService';

export { ReminderTriggerService } from './ReminderTriggerService';
export type { ITriggerReminderParams, ITriggerReminderResult } from './ReminderTriggerService';

export { ReminderSchedulerService } from './ReminderSchedulerService';
export type { IScheduleResult, IScheduleOptions } from './ReminderSchedulerService';

export * from './ReminderDomainService';

