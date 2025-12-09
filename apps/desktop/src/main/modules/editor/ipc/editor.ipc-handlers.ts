/**
 * Editor Module IPC Handlers
 *
 * Editor 模块 IPC 处理器
 * 复用 EditorDesktopApplicationService 中的逻辑
 *
 * 功能分组：
 * - Document：文档管理（创建、打开、保存、关闭）
 * - Content：内容操作
 * - Draft：草稿管理
 * - Template：模板管理
 * - Config：配置
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import { EditorDesktopApplicationService } from '../application/EditorDesktopApplicationService';

const logger = createLogger('EditorIpcHandlers');

// 惰性初始化的服务实例
let appService: EditorDesktopApplicationService | null = null;

function getAppService(): EditorDesktopApplicationService {
  if (!appService) {
    appService = new EditorDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Document Management
  'editor:document:create',
  'editor:document:open',
  'editor:document:save',
  'editor:document:close',
  'editor:document:list-open',
  // Content Operations
  'editor:content:get',
  'editor:content:set',
  'editor:metadata:update',
  // Draft Management
  'editor:draft:list',
  'editor:draft:delete',
  // Template Management
  'editor:template:get',
  'editor:template:list',
  'editor:template:save',
  'editor:template:delete',
  // Config
  'editor:config:get-autosave',
  'editor:config:update-autosave',
] as const;

/**
 * 注册 Editor 模块的 IPC 处理器
 */
export function registerEditorIpcHandlers(): void {
  logger.info('Registering Editor IPC handlers...');

  // ============================================
  // Document Management Handlers
  // ============================================

  ipcMain.handle('editor:document:create', async (_, options?: {
    title?: string;
    content?: string;
    format?: 'markdown' | 'richtext' | 'plain';
    templateUuid?: string;
  }) => {
    try {
      return await getAppService().createDocument(options);
    } catch (error) {
      logger.error('Failed to create document', error);
      throw error;
    }
  });

  ipcMain.handle('editor:document:open', async (_, uuid: string) => {
    try {
      return await getAppService().openDocument(uuid);
    } catch (error) {
      logger.error('Failed to open document', error);
      return null;
    }
  });

  ipcMain.handle('editor:document:save', async (_, uuid: string) => {
    try {
      return await getAppService().saveDocument(uuid);
    } catch (error) {
      logger.error('Failed to save document', error);
      throw error;
    }
  });

  ipcMain.handle('editor:document:close', async (_, uuid: string, save?: boolean) => {
    try {
      return await getAppService().closeDocument(uuid, save);
    } catch (error) {
      logger.error('Failed to close document', error);
      throw error;
    }
  });

  ipcMain.handle('editor:document:list-open', async () => {
    try {
      return await getAppService().getOpenDocuments();
    } catch (error) {
      logger.error('Failed to list open documents', error);
      return [];
    }
  });

  // ============================================
  // Content Operations Handlers
  // ============================================

  ipcMain.handle('editor:content:get', async (_, uuid: string) => {
    try {
      return await getAppService().getContent(uuid);
    } catch (error) {
      logger.error('Failed to get content', error);
      return null;
    }
  });

  ipcMain.handle('editor:content:set', async (_, uuid: string, content: string) => {
    try {
      return await getAppService().setContent(uuid, content);
    } catch (error) {
      logger.error('Failed to set content', error);
      throw error;
    }
  });

  ipcMain.handle('editor:metadata:update', async (_, uuid: string, updates: {
    title?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      return await getAppService().updateMetadata(uuid, updates);
    } catch (error) {
      logger.error('Failed to update metadata', error);
      throw error;
    }
  });

  // ============================================
  // Draft Management Handlers
  // ============================================

  ipcMain.handle('editor:draft:list', async () => {
    try {
      return await getAppService().listDrafts();
    } catch (error) {
      logger.error('Failed to list drafts', error);
      return { drafts: [], total: 0 };
    }
  });

  ipcMain.handle('editor:draft:delete', async (_, uuid: string) => {
    try {
      return await getAppService().deleteDraft(uuid);
    } catch (error) {
      logger.error('Failed to delete draft', error);
      throw error;
    }
  });

  // ============================================
  // Template Management Handlers
  // ============================================

  ipcMain.handle('editor:template:get', async (_, uuid: string) => {
    try {
      return await getAppService().getTemplate(uuid);
    } catch (error) {
      logger.error('Failed to get template', error);
      return null;
    }
  });

  ipcMain.handle('editor:template:list', async () => {
    try {
      return await getAppService().listTemplates();
    } catch (error) {
      logger.error('Failed to list templates', error);
      return { templates: [], total: 0 };
    }
  });

  ipcMain.handle('editor:template:save', async (_, template: {
    name: string;
    description?: string;
    content: string;
    format: 'markdown' | 'richtext' | 'plain';
  }) => {
    try {
      return await getAppService().saveTemplate(template);
    } catch (error) {
      logger.error('Failed to save template', error);
      throw error;
    }
  });

  ipcMain.handle('editor:template:delete', async (_, uuid: string) => {
    try {
      return await getAppService().deleteTemplate(uuid);
    } catch (error) {
      logger.error('Failed to delete template', error);
      throw error;
    }
  });

  // ============================================
  // Config Handlers
  // ============================================

  ipcMain.handle('editor:config:get-autosave', async () => {
    try {
      return getAppService().getAutoSaveConfig();
    } catch (error) {
      logger.error('Failed to get autosave config', error);
      throw error;
    }
  });

  ipcMain.handle('editor:config:update-autosave', async (_, updates: {
    enabled?: boolean;
    intervalMs?: number;
    maxDrafts?: number;
  }) => {
    try {
      return getAppService().updateAutoSaveConfig(updates);
    } catch (error) {
      logger.error('Failed to update autosave config', error);
      throw error;
    }
  });

  logger.info(`Editor IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 Editor 模块的 IPC 处理器
 */
export function unregisterEditorIpcHandlers(): void {
  logger.info('Unregistering Editor IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Cleanup service
  if (appService) {
    appService.cleanup();
    appService = null;
  }

  logger.info('Editor IPC handlers unregistered');
}
