/**
 * Goal Folder IPC Handlers
 */

import { ipcMain } from 'electron';
import { GoalContainer } from '@dailyuse/infrastructure-server';

/**
 * 注册 Goal Folder 模块的 IPC 处理器
 */
export function registerGoalFolderIpcHandlers(): void {
  // 获取 GoalFolderRepository (从 Container 的扩展属性)
  const getFolderRepo = () => {
    const container = GoalContainer.getInstance() as { __goalFolderRepository?: unknown };
    return container.__goalFolderRepository;
  };

  ipcMain.handle('goalFolder:create', async (_, request) => {
    // TODO: 实现文件夹创建
    return { uuid: 'todo', ...request };
  });

  ipcMain.handle('goalFolder:list', async (_, params) => {
    // TODO: 实现文件夹列表
    return { data: [], total: 0 };
  });

  ipcMain.handle('goalFolder:get', async (_, uuid) => {
    // TODO: 实现获取文件夹
    return null;
  });

  ipcMain.handle('goalFolder:update', async (_, uuid, request) => {
    // TODO: 实现更新文件夹
    return { uuid, ...request };
  });

  ipcMain.handle('goalFolder:delete', async (_, uuid) => {
    // TODO: 实现删除文件夹
    return { success: true };
  });

  console.log('[IPC] Goal Folder handlers registered');
}
