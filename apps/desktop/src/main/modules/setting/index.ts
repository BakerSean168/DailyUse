/**
 * Setting Module - Desktop Main Process
 *
 * 设置模块 - 注册 IPC handlers 和生命周期管理
 *
 * 功能：
 * - 应用设置管理（主题、语言、通知、快捷键等）
 * - 设置持久化（JSON 文件存储）
 * - 设置导入/导出
 *
 * @module setting
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';
import {
  registerSettingIpcHandlers,
  unregisterSettingIpcHandlers,
} from './ipc/setting.ipc-handlers';

const logger = createLogger('SettingModule');

/**
 * 注册 Setting 模块到初始化管理器
 *
 * Priority: 150 (after Repository module)
 * Dependencies: infrastructure (10)
 */
export function registerSettingModule(): void {
  logger.info('Registering Setting module...');

  InitializationManager.getInstance().registerTask({
    name: 'setting-module',
    phase: InitializationPhase.APP_STARTUP,
    priority: 150, // After Repository module (140)

    async initialize() {
      logger.info('Initializing Setting module...');

      try {
        // Register IPC handlers
        registerSettingIpcHandlers();

        logger.info('Setting module initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Setting module', error);
        throw error;
      }
    },

    async cleanup() {
      logger.info('Cleaning up Setting module...');

      try {
        // Unregister IPC handlers
        unregisterSettingIpcHandlers();

        logger.info('Setting module cleaned up successfully');
      } catch (error) {
        logger.error('Failed to cleanup Setting module', error);
      }
    },
  });

  logger.info('Setting module registered');
}

// Re-export application services
export { SettingDesktopApplicationService } from './application/SettingDesktopApplicationService';
export type {
  AppSettings,
  NotificationSettings,
  GeneralSettings,
  ShortcutSettings,
} from './application/SettingDesktopApplicationService';

// Re-export IPC handlers for direct use if needed
export {
  registerSettingIpcHandlers,
  unregisterSettingIpcHandlers,
} from './ipc/setting.ipc-handlers';
