/**
 * TaskReminderConfig Value Object - Client Interface
 * 任务提醒配置值对象 - 客户端接口
 */

import type { ReminderType, ReminderTimeUnit } from '../enums';
import type { TaskReminderConfigServerDTO } from './TaskReminderConfigServer';

// ============ 接口定义 ============

interface ReminderTrigger {
  type: ReminderType;
  absoluteTime?: number | null;
  relativeValue?: number | null;
  relativeUnit?: ReminderTimeUnit | null;
}

export interface TaskReminderConfigClient {
  enabled: boolean;
  triggers: ReminderTrigger[];

  // UI 辅助属性
  hasTriggers: boolean;
  triggerCount: number;
  reminderSummary: string;
  triggerDescriptions: string[];

  equals(other: TaskReminderConfigClient): boolean;
  toServerDTO(): TaskReminderConfigServerDTO;
}

// ============ DTO 定义 ============

export interface TaskReminderConfigClientDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
  hasTriggers: boolean;
  triggerCount: number;
  reminderSummary: string;
  triggerDescriptions: string[];
}
