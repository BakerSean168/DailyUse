/**
 * TaskReminderConfig Value Object - Server Interface
 * 任务提醒配置值对象 - 服务端接口
 */

import type { ReminderType, ReminderTimeUnit } from '../enums';
import type { TaskReminderConfigClientDTO } from './TaskReminderConfigClient';

// ============ 接口定义 ============

interface ReminderTrigger {
  type: ReminderType;
  absoluteTime?: number | null;
  relativeValue?: number | null;
  relativeUnit?: ReminderTimeUnit | null;
}

export interface TaskReminderConfigServer {
  enabled: boolean;
  triggers: ReminderTrigger[];

  equals(other: TaskReminderConfigServer): boolean;
  toServerDTO(): TaskReminderConfigServerDTO;
  toClientDTO(): TaskReminderConfigClientDTO;
  toPersistenceDTO(): TaskReminderConfigPersistenceDTO;
}

// ============ DTO 定义 ============

export interface TaskReminderConfigServerDTO {
  enabled: boolean;
  triggers: ReminderTrigger[];
}

export interface TaskReminderConfigPersistenceDTO {
  enabled: boolean;
  triggers: string; // JSON
}
