/**
 * IPC Adapters
 *
 * Electron IPC client implementations for desktop renderer process.
 * These communicate with the main process via Electron's IPC.
 */

export { GoalIpcAdapter, createGoalIpcAdapter } from './goal-ipc.adapter';
export { GoalFolderIpcAdapter, createGoalFolderIpcAdapter } from './goal-folder-ipc.adapter';

// Re-export types
export type { IpcClient, ElectronAPI } from './ipc-client.types';
