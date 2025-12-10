/**
 * Goal Statistics IPC Handlers (Legacy)
 *
 * @deprecated 使用 GoalIPCHandler 类代替
 * 此文件保留用于向后兼容，所有功能已迁移到 goal-ipc-handler.ts
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalStatisticsIPC');

/**
 * @deprecated 不再使用，所有处理器已在 GoalIPCHandler 中注册
 */
export function registerGoalStatisticsIpcHandlers(): void {
  logger.warn('registerGoalStatisticsIpcHandlers() is deprecated. Handlers are now managed by GoalIPCHandler class.');
}
