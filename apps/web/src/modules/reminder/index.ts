/**
 * Reminder Module Exports
 * DDD 架构分层导出
 */

// Initialization
export { registerReminderInitializationTasks } from './initialization';

// Infrastructure Layer - API Client
export { reminderApiClient } from './infrastructure/api/reminderApiClient';

// Presentation Layer - Composables
export { useReminder } from './presentation/composables/useReminder';

// Presentation Layer - Views (Desktop Grid Style)
export { default as ReminderDesktopView } from './presentation/views/ReminderDesktopView.vue';
