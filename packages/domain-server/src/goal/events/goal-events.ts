import type { GoalReminderConfigServerDTO, GoalServerDTO } from '@dailyuse/contracts/goal';
import type { DomainEvent } from '@dailyuse/utils';

/**
 * 当目标的计划时间（开始或结束日期）发生变化时触发
 */
export interface GoalScheduleTimeChangedEvent extends DomainEvent {
  eventType: 'goal.schedule_time_changed';
  payload: {
    goal: GoalServerDTO;
    oldStartDate: number | null;
    oldTargetDate: number | null;
    newStartDate: number | null;
    newTargetDate: number | null;
  };
}

/**
 * 当目标的提醒配置发生变化时触发
 */
export interface GoalReminderConfigChangedEvent extends DomainEvent {
  eventType: 'goal.reminder_config_changed';
  payload: {
    goal: GoalServerDTO;
    oldConfig: GoalReminderConfigServerDTO | null;
    newConfig: GoalReminderConfigServerDTO | null;
    isEnabled: boolean;
  };
}

// Union type for all goal-related events
export type GoalDomainEvent = GoalScheduleTimeChangedEvent | GoalReminderConfigChangedEvent;
