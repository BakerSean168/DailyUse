/**
 * 通用的调度生命周期事件定义
 * 
 * 设计原则：
 * 1. 事件命名统一：{module}.{entity}.{lifecycle_action}
 * 2. Payload 结构统一：包含实体基本信息 + 账户信息
 * 3. 适配所有需要调度的实体（Task、Goal、Reminder等）
 * 
 * 生命周期动作：
 * - created: 实体创建，需要创建调度
 * - paused: 实体暂停，需要暂停/删除调度
 * - resumed: 实体恢复，需要恢复/重新创建调度
 * - deleted: 实体删除，需要删除调度
 * - schedule_changed: 调度配置变更，需要重新创建调度
 */

import type { SourceModule } from '../schedule/enums';

/**
 * 统一事件接口（从 utils 复制，避免循环依赖）
 */
export interface IUnifiedEvent {
  eventType: string;
  payload: Record<string, any>;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * 实体调度生命周期事件的通用 Payload
 */
export interface EntityScheduleLifecyclePayload {
  /** 实体 UUID */
  entityUuid: string;
  
  /** 实体类型（来自 SourceModule） */
  entityType: SourceModule;
  
  /** 实体标题/名称 */
  entityTitle?: string;
  
  /** 账户 UUID */
  accountUuid: string;
  
  /** 操作时间戳 */
  operatedAt: number;
  
  /** 实体完整数据（用于创建/更新调度） */
  entityData?: any;
  
  /** 操作原因/备注 */
  reason?: string;
}

// ===================== 通用事件类型定义 =====================

/**
 * 实体创建事件（需要创建调度）
 * 
 * 适用场景：
 * - TaskTemplate 创建
 * - Goal 创建
 * - Reminder 创建
 */
export interface EntityCreatedForScheduleEvent extends IUnifiedEvent {
  eventType: `${string}.created`;
  payload: EntityScheduleLifecyclePayload;
}

/**
 * 实体暂停事件（需要暂停/删除调度）
 * 
 * 适用场景：
 * - TaskTemplate 暂停
 * - Goal 暂停
 * - Reminder 禁用
 */
export interface EntityPausedForScheduleEvent extends IUnifiedEvent {
  eventType: `${string}.paused`;
  payload: EntityScheduleLifecyclePayload;
}

/**
 * 实体恢复事件（需要恢复/重新创建调度）
 * 
 * 适用场景：
 * - TaskTemplate 激活
 * - Goal 激活
 * - Reminder 启用
 */
export interface EntityResumedForScheduleEvent extends IUnifiedEvent {
  eventType: `${string}.resumed`;
  payload: EntityScheduleLifecyclePayload;
}

/**
 * 实体删除事件（需要删除调度）
 * 
 * 适用场景：
 * - TaskTemplate 删除
 * - Goal 删除
 * - Reminder 删除
 */
export interface EntityDeletedForScheduleEvent extends IUnifiedEvent {
  eventType: `${string}.deleted`;
  payload: EntityScheduleLifecyclePayload;
}

/**
 * 实体调度配置变更事件（需要重新创建调度）
 * 
 * 适用场景：
 * - TaskTemplate 时间/重复配置变更
 * - Goal 计划时间/提醒配置变更
 * - Reminder 触发器配置变更
 */
export interface EntityScheduleChangedEvent extends IUnifiedEvent {
  eventType: `${string}.schedule_changed`;
  payload: EntityScheduleLifecyclePayload;
}

// ===================== 联合类型 =====================

/**
 * 所有调度生命周期事件
 */
export type ScheduleLifecycleEvent =
  | EntityCreatedForScheduleEvent
  | EntityPausedForScheduleEvent
  | EntityResumedForScheduleEvent
  | EntityDeletedForScheduleEvent
  | EntityScheduleChangedEvent;

// ===================== 事件类型常量 =====================

/**
 * 生命周期动作常量
 */
export const ScheduleLifecycleAction = {
  CREATED: 'created',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  DELETED: 'deleted',
  SCHEDULE_CHANGED: 'schedule_changed',
} as const;

export type ScheduleLifecycleActionType = typeof ScheduleLifecycleAction[keyof typeof ScheduleLifecycleAction];

// ===================== 辅助函数 =====================

/**
 * 构建事件类型名称
 * @param module 模块名（如 'task.template', 'goal', 'reminder.template'）
 * @param action 生命周期动作
 * @returns 完整的事件类型名称
 * 
 * @example
 * buildScheduleEventType('task.template', 'paused') // => 'task.template.paused'
 * buildScheduleEventType('goal', 'resumed') // => 'goal.resumed'
 */
export function buildScheduleEventType(
  module: string,
  action: ScheduleLifecycleActionType
): string {
  return `${module}.${action}`;
}

/**
 * 创建调度生命周期事件
 * @param module 模块名
 * @param action 生命周期动作
 * @param payload 事件 Payload
 * @returns 统一事件对象
 */
export function createScheduleLifecycleEvent(
  module: string,
  action: ScheduleLifecycleActionType,
  payload: EntityScheduleLifecyclePayload
): IUnifiedEvent {
  return {
    eventType: buildScheduleEventType(module, action),
    payload,
    timestamp: Date.now(),
    metadata: {
      module,
      action,
      entityType: payload.entityType,
    },
  };
}

/**
 * 判断是否为调度生命周期事件
 * @param eventType 事件类型
 * @returns 是否为调度生命周期事件
 */
export function isScheduleLifecycleEvent(eventType: string): boolean {
  const actions = Object.values(ScheduleLifecycleAction);
  return actions.some(action => eventType.endsWith(`.${action}`));
}

/**
 * 从事件类型中提取模块名和动作
 * @param eventType 事件类型（如 'task.template.paused'）
 * @returns { module, action } 或 null
 */
export function parseScheduleEventType(eventType: string): {
  module: string;
  action: ScheduleLifecycleActionType;
} | null {
  const actions = Object.values(ScheduleLifecycleAction) as string[];
  
  for (const action of actions) {
    if (eventType.endsWith(`.${action}`)) {
      const module = eventType.slice(0, -(action.length + 1)); // 移除 '.action'
      return { module, action: action as ScheduleLifecycleActionType };
    }
  }
  
  return null;
}
