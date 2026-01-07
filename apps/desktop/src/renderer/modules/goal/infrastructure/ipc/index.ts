/**
 * Goal IPC Module - Barrel Exports
 *
 * 从 @dailyuse/infrastructure-client 重导出 IPC Adapters
 */

export {
  GoalIpcAdapter,
  GoalFolderIpcAdapter,
  createGoalIpcAdapter,
  createGoalFolderIpcAdapter,
} from '@dailyuse/infrastructure-client';

// Focus 功能 - 本地实现（尚未提取到 packages）
export * from './goal-focus.ipc-client';
