/**
 * Notification 模块入口
 * @description 统一导出notification模块的所有公共接口
 */

// ===== Application Layer =====
// 核心服务
export { NotificationService } from './application/services/NotificationService';
export { InAppNotificationService } from './application/services/InAppNotificationService';
export { NotificationInitializationManager } from './application/initialization/NotificationInitializationManager';

// 事件相关
export {
  NOTIFICATION_EVENTS,
  SCHEDULE_EVENTS,
  publishReminderTriggered,
  onReminderTriggered,
  onScheduleReminderTriggered,
} from './application/events/notificationEvents';
export { NotificationEventHandlers } from './application/events/NotificationEventHandlers';

// 类型定义
export {
  NotificationType,
  NotificationPriority,
  NotificationMethod,
  NotificationPermission,
  SoundType,
} from './application/types';

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
} from './application/types';

// ===== Infrastructure Layer =====
export { DesktopNotificationService } from './infrastructure/services/DesktopNotificationService';
export { AudioNotificationService } from './infrastructure/services/AudioNotificationService';
export { NotificationConfigStorage } from './infrastructure/storage/NotificationConfigStorage';
export { NotificationPermissionService } from './infrastructure/browser/NotificationPermissionService';
export { notificationApiClient } from './infrastructure/api/notificationApiClient';

// ===== Presentation Layer =====
// UI 组件
export { default as InAppNotification } from './presentation/components/InAppNotification.vue';
export { default as NotificationPermissionWarning } from './presentation/components/NotificationPermissionWarning.vue';

// Composables
export { useNotification } from './presentation/composables/useNotification';
export { useReminderStatistics } from './presentation/composables/useReminderStatistics';

// ===== Initialization =====
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
