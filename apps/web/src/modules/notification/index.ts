/**
 * Notification 模块入口
 * @description 统一导出notification模块的所有公共接口
 */

// 核心服务
export { NotificationService } from './application/services/NotificationService';
export { NotificationInitializationManager } from './application/initialization/NotificationInitializationManager';

// 类型定义
export {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  NotificationPermission,
  SoundType,
} from './domain/types';

export type {
  NotificationConfig,
  NotificationAction,
  SoundConfig,
  DesktopNotificationConfig,
  NotificationServiceConfig,
  NotificationStats,
  NotificationHistory,
  NotificationFilter,
  NotificationSearchResult,
  ReminderTriggeredPayload,
  INotificationService,
} from './domain/types';

// 事件相关
export {
  NOTIFICATION_EVENTS,
  SCHEDULE_EVENTS,
  publishReminderTriggered,
  onReminderTriggered,
  onScheduleReminderTriggered,
} from './application/events/notificationEvents';

export { NotificationEventHandlers } from './application/events/NotificationEventHandlers';

// 基础设施服务
export { DesktopNotificationService } from './infrastructure/services/DesktopNotificationService';
export { AudioNotificationService } from './infrastructure/services/AudioNotificationService';
export { NotificationConfigStorage } from './infrastructure/storage/NotificationConfigStorage';

// 初始化相关
export { registerNotificationInitializationTasks } from './initialization/notificationInitialization';

// 便捷方法
export const initializeNotificationModule = async () => {
  const { NotificationInitializationManager } = await import(
    './application/initialization/NotificationInitializationManager'
  );
  const manager = NotificationInitializationManager.getInstance();
  await manager.initializeNotificationModule();
  return manager;
};

export const getNotificationService = async () => {
  const { NotificationService } = await import('./application/services/NotificationService');
  return NotificationService.getInstance();
};

export const testNotificationFeatures = async () => {
  const { NotificationInitializationManager } = await import(
    './application/initialization/NotificationInitializationManager'
  );
  const manager = NotificationInitializationManager.getInstance();
  return await manager.testNotificationFeatures();
};
