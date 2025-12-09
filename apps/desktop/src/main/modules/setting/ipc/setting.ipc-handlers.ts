/**
 * Setting Module IPC Handlers
 *
 * Setting 模块 IPC 处理器
 * 复用 SettingDesktopApplicationService 中的逻辑
 *
 * 功能分组：
 * - Core：基本设置操作
 * - Theme：主题设置
 * - Language：语言设置
 * - Notification：通知设置
 * - General：常规设置
 * - Shortcut：快捷键设置
 * - Import/Export：设置导入导出
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import {
  SettingDesktopApplicationService,
  type AppSettings,
  type NotificationSettings,
  type GeneralSettings,
  type ShortcutSettings,
} from '../application/SettingDesktopApplicationService';

const logger = createLogger('SettingIpcHandlers');

// 惰性初始化的服务实例
let appService: SettingDesktopApplicationService | null = null;

function getAppService(): SettingDesktopApplicationService {
  if (!appService) {
    appService = new SettingDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Core
  'setting:get-all',
  'setting:get',
  'setting:set',
  'setting:update',
  'setting:reset',
  // Theme
  'setting:get-theme',
  'setting:set-theme',
  // Language
  'setting:get-language',
  'setting:set-language',
  'setting:get-supported-languages',
  // Notification
  'setting:notification:get',
  'setting:notification:update',
  // General
  'setting:general:get',
  'setting:general:update',
  // Shortcut
  'setting:shortcut:get',
  'setting:shortcut:update',
  'setting:shortcut:reset',
  // Import/Export
  'setting:export',
  'setting:import',
] as const;

/**
 * 注册 Setting 模块的 IPC 处理器
 */
export function registerSettingIpcHandlers(): void {
  logger.info('Registering Setting IPC handlers...');

  // ============================================
  // Core Settings Handlers
  // ============================================

  ipcMain.handle('setting:get-all', async () => {
    try {
      return await getAppService().getAllSettings();
    } catch (error) {
      logger.error('Failed to get all settings', error);
      throw error;
    }
  });

  ipcMain.handle('setting:get', async (_, key: keyof AppSettings) => {
    try {
      return await getAppService().getSetting(key);
    } catch (error) {
      logger.error('Failed to get setting', error);
      return null;
    }
  });

  ipcMain.handle('setting:set', async (_, key: keyof AppSettings, value: unknown) => {
    try {
      return await getAppService().setSetting(key, value as AppSettings[keyof AppSettings]);
    } catch (error) {
      logger.error('Failed to set setting', error);
      throw error;
    }
  });

  ipcMain.handle('setting:update', async (_, updates: Partial<AppSettings>) => {
    try {
      return await getAppService().updateSettings(updates);
    } catch (error) {
      logger.error('Failed to update settings', error);
      throw error;
    }
  });

  ipcMain.handle('setting:reset', async (_, key?: keyof AppSettings) => {
    try {
      return await getAppService().resetSettings(key);
    } catch (error) {
      logger.error('Failed to reset settings', error);
      throw error;
    }
  });

  // ============================================
  // Theme Handlers
  // ============================================

  ipcMain.handle('setting:get-theme', async () => {
    try {
      return await getAppService().getTheme();
    } catch (error) {
      logger.error('Failed to get theme', error);
      return 'system';
    }
  });

  ipcMain.handle('setting:set-theme', async (_, theme: 'light' | 'dark' | 'system') => {
    try {
      return await getAppService().setTheme(theme);
    } catch (error) {
      logger.error('Failed to set theme', error);
      throw error;
    }
  });

  // ============================================
  // Language Handlers
  // ============================================

  ipcMain.handle('setting:get-language', async () => {
    try {
      return await getAppService().getLanguage();
    } catch (error) {
      logger.error('Failed to get language', error);
      return 'zh-CN';
    }
  });

  ipcMain.handle('setting:set-language', async (_, language: string) => {
    try {
      return await getAppService().setLanguage(language);
    } catch (error) {
      logger.error('Failed to set language', error);
      throw error;
    }
  });

  ipcMain.handle('setting:get-supported-languages', async () => {
    try {
      return await getAppService().getSupportedLanguages();
    } catch (error) {
      logger.error('Failed to get supported languages', error);
      return [];
    }
  });

  // ============================================
  // Notification Settings Handlers
  // ============================================

  ipcMain.handle('setting:notification:get', async () => {
    try {
      return await getAppService().getNotificationSettings();
    } catch (error) {
      logger.error('Failed to get notification settings', error);
      throw error;
    }
  });

  ipcMain.handle('setting:notification:update', async (_, updates: Partial<NotificationSettings>) => {
    try {
      return await getAppService().updateNotificationSettings(updates);
    } catch (error) {
      logger.error('Failed to update notification settings', error);
      throw error;
    }
  });

  // ============================================
  // General Settings Handlers
  // ============================================

  ipcMain.handle('setting:general:get', async () => {
    try {
      return await getAppService().getGeneralSettings();
    } catch (error) {
      logger.error('Failed to get general settings', error);
      throw error;
    }
  });

  ipcMain.handle('setting:general:update', async (_, updates: Partial<GeneralSettings>) => {
    try {
      return await getAppService().updateGeneralSettings(updates);
    } catch (error) {
      logger.error('Failed to update general settings', error);
      throw error;
    }
  });

  // ============================================
  // Shortcut Settings Handlers
  // ============================================

  ipcMain.handle('setting:shortcut:get', async () => {
    try {
      return await getAppService().getShortcuts();
    } catch (error) {
      logger.error('Failed to get shortcuts', error);
      throw error;
    }
  });

  ipcMain.handle('setting:shortcut:update', async (_, updates: Partial<ShortcutSettings>) => {
    try {
      return await getAppService().updateShortcuts(updates);
    } catch (error) {
      logger.error('Failed to update shortcuts', error);
      throw error;
    }
  });

  ipcMain.handle('setting:shortcut:reset', async () => {
    try {
      return await getAppService().resetShortcuts();
    } catch (error) {
      logger.error('Failed to reset shortcuts', error);
      throw error;
    }
  });

  // ============================================
  // Import/Export Handlers
  // ============================================

  ipcMain.handle('setting:export', async () => {
    try {
      return await getAppService().exportSettings();
    } catch (error) {
      logger.error('Failed to export settings', error);
      throw error;
    }
  });

  ipcMain.handle('setting:import', async (_, data: Partial<AppSettings>) => {
    try {
      return await getAppService().importSettings(data);
    } catch (error) {
      logger.error('Failed to import settings', error);
      throw error;
    }
  });

  logger.info(`Setting IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 Setting 模块的 IPC 处理器
 */
export function unregisterSettingIpcHandlers(): void {
  logger.info('Unregistering Setting IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Reset service instance
  if (appService) {
    appService.clearCache();
    appService = null;
  }

  logger.info('Setting IPC handlers unregistered');
}
