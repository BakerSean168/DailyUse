/**
 * Goal IPC Handlers (Legacy)
 *
 * @deprecated 使用 GoalIPCHandler 类代替
 * 此文件保留用于向后兼容，所有功能已迁移到 goal-ipc-handler.ts
 *
 * 处理 Goal 模块的主要 IPC 通道
 */

import { createLogger } from '@dailyuse/utils';

const logger = createLogger('GoalIPC');

/**
 * @deprecated 不再使用，所有处理器已在 GoalIPCHandler 中注册
 */
export function registerGoalIpcHandlers(): void {
  logger.warn('registerGoalIpcHandlers() is deprecated. Handlers are now managed by GoalIPCHandler class.');
}

