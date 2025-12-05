/**
 * Schedule Application Module (Server)
 *
 * 提供 Schedule 模块的所有 Services
 */

// ===== Container (from infrastructure-server) =====
export { ScheduleContainer } from '@dailyuse/infrastructure-server';

// ===== Services =====
export * from './services';

// Legacy placeholder (to be removed)
export const SCHEDULE_MODULE_PLACEHOLDER = 'schedule-module';
