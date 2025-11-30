import type { DomainEvent } from '@dailyuse/utils';
import type { RecurrenceRuleServerDTO, TaskTemplateServerDTO } from '@dailyuse/contracts/task';

/**
 * 当任务模板的计划时间（开始或结束日期）发生变化时触发
 * 主要用于一次性任务
 */
export interface TaskTemplateScheduleTimeChangedEvent extends DomainEvent {
  eventType: 'task_template.schedule_time_changed';
  payload: {
    taskTemplate: TaskTemplateServerDTO;
    oldStartDate: number | null;
    oldDueDate: number | null;
    newStartDate: number | null;
    newDueDate: number | null;
  };
}

/**
 * 当任务模板的重复规则发生变化时触发
 * 主要用于循环任务
 */
export interface TaskTemplateRecurrenceChangedEvent extends DomainEvent {
  eventType: 'task_template.recurrence_changed';
  payload: {
    taskTemplate: TaskTemplateServerDTO;
    oldRecurrenceRule: RecurrenceRuleServerDTO | null;
    newRecurrenceRule: RecurrenceRuleServerDTO | null;
  };
}

// Union type for all TaskTemplate-related events
export type TaskTemplateDomainEvent =
  | TaskTemplateScheduleTimeChangedEvent
  | TaskTemplateRecurrenceChangedEvent;
