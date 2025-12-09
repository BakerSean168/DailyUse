/**
 * Reminder Module - Renderer
 *
 * 提醒模块 - 渲染进程
 * 遵循 DDD 分层架构
 */

// ===== Application Layer =====
export { ReminderApplicationService, reminderApplicationService } from './application/services';

// ===== Presentation Layer =====
export {
  useReminder,
  type ReminderState,
  type UseReminderReturn,
} from './presentation/hooks';

// ===== Initialization =====
export { registerReminderModule, initializeReminderModule } from './initialization';
