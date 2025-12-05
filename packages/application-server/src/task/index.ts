/**
 * Task Application Module (Server)
 *
 * 提供 Task 模块的所有 Services
 */

// ===== Container (from infrastructure-server) =====
export { TaskContainer } from '@dailyuse/infrastructure-server';

// ===== Services =====
export * from './services';

// Legacy placeholder (to be removed)
export const TASK_MODULE_PLACEHOLDER = 'task-module';
