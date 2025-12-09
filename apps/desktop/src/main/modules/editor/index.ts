/**
 * Editor Module - Desktop Main Process
 *
 * 编辑器模块 - 注册 IPC handlers 和生命周期管理
 *
 * 功能：
 * - 文档管理（创建、打开、保存、关闭）
 * - 内容操作
 * - 草稿自动保存
 * - 模板管理
 *
 * @module editor
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import {
  registerEditorIpcHandlers,
  unregisterEditorIpcHandlers,
} from './ipc/editor.ipc-handlers';

const logger = createLogger('EditorModule');

/**
 * 注册 Editor 模块到初始化管理器
 *
 * Priority: 160 (after Setting module)
 * Dependencies: infrastructure (10)
 */
export function registerEditorModule(): void {
  logger.info('Registering Editor module...');

  InitializationManager.getInstance().registerTask({
    name: 'editor-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 160, // After Setting module (150)

    async initialize() {
      logger.info('Initializing Editor module...');

      try {
        // Register IPC handlers
        registerEditorIpcHandlers();

        logger.info('Editor module initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Editor module', error);
        throw error;
      }
    },

    async cleanup() {
      logger.info('Cleaning up Editor module...');

      try {
        // Unregister IPC handlers (also cleans up service)
        unregisterEditorIpcHandlers();

        logger.info('Editor module cleaned up successfully');
      } catch (error) {
        logger.error('Failed to cleanup Editor module', error);
      }
    },
  });

  logger.info('Editor module registered');
}

// Re-export application services
export { EditorDesktopApplicationService } from './application/EditorDesktopApplicationService';
export type {
  EditorDocument,
  DocumentTemplate,
  AutoSaveConfig,
} from './application/EditorDesktopApplicationService';

// Re-export IPC handlers for direct use if needed
export {
  registerEditorIpcHandlers,
  unregisterEditorIpcHandlers,
} from './ipc/editor.ipc-handlers';
