/**
 * Task 模块领域事件定义
 * 用于模块间异步通信
 */

/**
 * 统一事件接口
 * (从 @dailyuse/utils 复制过来，避免循环依赖)
 */
export interface IUnifiedEvent {
  eventType: string;
  payload: Record<string, any>;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * 任务实例完成事件
 * 当任务实例被标记为完成时触发
 */
export interface TaskInstanceCompletedEvent extends IUnifiedEvent {
  eventType: 'task.instance.completed';
  payload: {
    taskInstanceUuid: string;
    taskTemplateUuid: string;
    title: string;
    completedAt: number;
    accountUuid: string;
    goalBinding?: {
      goalUuid: string;
      keyResultUuid: string;
      incrementValue: number;
    };
  };
}

/**
 * 任务模板创建事件
 * 当新的任务模板被创建时触发
 */
export interface TaskTemplateCreatedEvent extends IUnifiedEvent {
  eventType: 'task.template.created';
  payload: {
    taskTemplateUuid: string;
    title: string;
    accountUuid: string;
    createdAt: number;
  };
}

/**
 * 任务模板删除事件
 * 当任务模板被删除时触发
 */
export interface TaskTemplateDeletedEvent extends IUnifiedEvent {
  eventType: 'task.template.deleted';
  payload: {
    taskTemplateUuid: string;
    accountUuid: string;
    deletedAt: number;
  };
}

/**
 * 任务模板暂停事件
 * 当任务模板被暂停时触发（需要暂停提醒调度）
 */
export interface TaskTemplatePausedEvent extends IUnifiedEvent {
  eventType: 'task.template.paused';
  payload: {
    taskTemplateUuid: string;
    accountUuid: string;
    pausedAt: number;
    reason?: string;
  };
}

/**
 * 任务模板激活/恢复事件
 * 当任务模板被激活或从暂停状态恢复时触发（需要恢复提醒调度）
 */
export interface TaskTemplateResumedEvent extends IUnifiedEvent {
  eventType: 'task.template.resumed';
  payload: {
    taskTemplateUuid: string;
    taskTemplateTitle: string;
    accountUuid: string;
    resumedAt: number;
    taskTemplateData?: any; // TaskTemplateServerDTO
  };
}

/**
 * 任务模板调度配置变更事件
 * 当时间配置、重复规则或提醒配置变更时触发
 */
export interface TaskTemplateScheduleChangedEvent extends IUnifiedEvent {
  eventType: 'task.template.schedule_changed';
  payload: {
    taskTemplateUuid: string;
    taskTemplateTitle: string;
    accountUuid: string;
    changedAt: number;
    taskTemplateData?: any; // TaskTemplateServerDTO
  };
}

/**
 * Task 模块事件类型联合
 */
export type TaskModuleEvent =
  | TaskInstanceCompletedEvent
  | TaskTemplateCreatedEvent
  | TaskTemplateDeletedEvent
  | TaskTemplatePausedEvent
  | TaskTemplateResumedEvent
  | TaskTemplateScheduleChangedEvent;

/**
 * Task 模块事件类型常量
 */
export const TaskEventTypes = {
  INSTANCE_COMPLETED: 'task.instance.completed' as const,
  TEMPLATE_CREATED: 'task.template.created' as const,
  TEMPLATE_DELETED: 'task.template.deleted' as const,
  TEMPLATE_PAUSED: 'task.template.paused' as const,
  TEMPLATE_RESUMED: 'task.template.resumed' as const,
  TEMPLATE_SCHEDULE_CHANGED: 'task.template.schedule_changed' as const,
} as const;
