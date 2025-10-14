/**
 * Reminder Template Aggregate Root - Server Interface
 * 提醒模板聚合根 - 服务端接口
 */

import { ImportanceLevel } from '../../../shared/importance';
import type { ReminderType, ReminderStatus } from '../enums';
import type {
  ReminderHistoryServer,
  ReminderHistoryServerDTO,
} from '../entities/ReminderHistoryServer';

// 从值对象导入类型
import type {
  RecurrenceConfigServerDTO,
  NotificationConfigServerDTO,
  TriggerConfigServerDTO,
  ActiveTimeConfigServerDTO,
  ActiveHoursConfigServerDTO,
  ReminderStatsServerDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Reminder Template Server DTO
 */
export interface ReminderTemplateServerDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO | null;
  activeTime: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO | null;
  notificationConfig: NotificationConfigServerDTO;
  selfEnabled: boolean;
  status: ReminderStatus;
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null; // epoch ms
  stats: ReminderStatsServerDTO;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null; // epoch ms

  // ===== 子实体 DTO =====
  history?: ReminderHistoryServerDTO[] | null; // 提醒历史列表（可选加载）
}

/**
 * Reminder Template Persistence DTO (数据库映射)
 */
export interface ReminderTemplatePersistenceDTO {
  uuid: string;
  account_uuid: string;
  title: string;
  description?: string | null;
  type: ReminderType;
  trigger: string; // JSON string
  recurrence?: string | null; // JSON string
  active_time: string; // JSON string
  active_hours?: string | null; // JSON string
  notification_config: string; // JSON string
  self_enabled: boolean;
  status: ReminderStatus;
  group_uuid?: string | null;
  importance_level: ImportanceLevel;
  tags: string; // JSON string
  color?: string | null;
  icon?: string | null;
  next_trigger_at?: number | null;
  stats: string; // JSON string
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
}

// ============ 领域事件 ============

/**
 * 提醒模板创建事件
 */
export interface ReminderTemplateCreatedEvent {
  type: 'reminder.template.created';
  aggregateId: string;
  timestamp: number;
  payload: {
    template: ReminderTemplateServerDTO;
  };
}

/**
 * 提醒模板更新事件
 */
export interface ReminderTemplateUpdatedEvent {
  type: 'reminder.template.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    template: ReminderTemplateServerDTO;
    previousData: Partial<ReminderTemplateServerDTO>;
    changes: string[];
  };
}

/**
 * 提醒模板删除事件
 */
export interface ReminderTemplateDeletedEvent {
  type: 'reminder.template.deleted';
  aggregateId: string;
  timestamp: number;
  payload: {
    templateUuid: string;
    templateTitle: string;
  };
}

/**
 * 提醒模板启用事件
 */
export interface ReminderTemplateEnabledEvent {
  type: 'reminder.template.enabled';
  aggregateId: string;
  timestamp: number;
  payload: {
    templateUuid: string;
  };
}

/**
 * 提醒模板暂停事件
 */
export interface ReminderTemplatePausedEvent {
  type: 'reminder.template.paused';
  aggregateId: string;
  timestamp: number;
  payload: {
    templateUuid: string;
  };
}

/**
 * 提醒模板触发事件
 */
export interface ReminderTemplateTriggeredEvent {
  type: 'reminder.template.triggered';
  aggregateId: string;
  timestamp: number;
  payload: {
    templateUuid: string;
    triggeredAt: number;
    nextTriggerAt?: number | null;
  };
}

/**
 * Reminder Template 领域事件联合类型
 */
export type ReminderTemplateDomainEvent =
  | ReminderTemplateCreatedEvent
  | ReminderTemplateUpdatedEvent
  | ReminderTemplateDeletedEvent
  | ReminderTemplateEnabledEvent
  | ReminderTemplatePausedEvent
  | ReminderTemplateTriggeredEvent;

// ============ 实体接口 ============

/**
 * Reminder Template 聚合根 - Server 接口（实例方法）
 */
export interface ReminderTemplateServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  type: ReminderType;
  trigger: TriggerConfigServerDTO;
  recurrence?: RecurrenceConfigServerDTO | null;
  activeTime: ActiveTimeConfigServerDTO;
  activeHours?: ActiveHoursConfigServerDTO | null;
  notificationConfig: NotificationConfigServerDTO;
  selfEnabled: boolean;
  status: ReminderStatus;
  groupUuid?: string | null;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color?: string | null;
  icon?: string | null;
  nextTriggerAt?: number | null;
  stats: ReminderStatsServerDTO;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 提醒历史列表（懒加载，可选）
   */
  history?: ReminderHistoryServer[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：ReminderHistory（通过聚合根创建）
   */
  createHistory(params: {
    triggeredAt: number;
    result: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    error?: string;
  }): ReminderHistoryServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加历史记录到聚合根
   */
  addHistory(history: ReminderHistoryServer): void;

  /**
   * 获取所有历史记录
   */
  getAllHistory(): ReminderHistoryServer[];

  /**
   * 获取最近 N 条历史记录
   */
  getRecentHistory(limit: number): ReminderHistoryServer[];

  // ===== 业务方法 =====

  // 状态管理
  enable(): void;
  pause(): void;
  toggle(): void;

  // 实际启用状态计算
  getEffectiveEnabled(): Promise<boolean>;
  isEffectivelyEnabled(): Promise<boolean>;

  // 触发计算
  calculateNextTrigger(): number | null;
  shouldTriggerNow(): boolean;
  shouldTriggerAt(timestamp: number): boolean;
  isActiveAtTime(timestamp: number): boolean;

  // 触发记录
  recordTrigger(): void;

  // 查询
  isActive(): boolean;
  isPaused(): boolean;
  isOneTime(): boolean;
  isRecurring(): boolean;
  getNextTriggerTime(): number | null;

  // 软删除
  softDelete(): void;
  restore(): void;

  // 标签管理
  addTag(tag: string): void;
  removeTag(tag: string): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): ReminderTemplateServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): ReminderTemplatePersistenceDTO;
}

/**
 * Reminder Template 静态工厂方法接口
 */
export interface ReminderTemplateServerStatic {
  /**
   * 创建新的 Reminder Template 聚合根（静态工厂方法）
   */
  create(params: {
    accountUuid: string;
    title: string;
    type: ReminderType;
    trigger: TriggerConfigServerDTO;
    activeTime: ActiveTimeConfigServerDTO;
    notificationConfig: NotificationConfigServerDTO;
    description?: string;
    recurrence?: RecurrenceConfigServerDTO;
    activeHours?: ActiveHoursConfigServerDTO;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string;
    icon?: string;
    groupUuid?: string;
  }): ReminderTemplateServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplateServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: ReminderTemplatePersistenceDTO): ReminderTemplateServer;
}
