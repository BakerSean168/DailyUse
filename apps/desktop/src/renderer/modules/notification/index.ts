/**
 * Notification Module - Renderer
 *
 * 通知模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { NotificationApplicationService, notificationApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useNotification,
  type NotificationState,
  type UseNotificationReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerNotificationModule, initializeNotificationModule } from './initialization';
