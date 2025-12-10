/**
 * Setting Module IPC Handlers
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
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
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';

import {
  SettingDesktopApplicationService,
  type AppSettings,
  type NotificationSettings,
  type GeneralSettings,
  type ShortcutSettings,
} from '../application/SettingDesktopApplicationService';

export class SettingIPCHandler extends BaseIPCHandler {
  private appService: SettingDesktopApplicationService;

  constructor() {
    super('SettingIPCHandler');
    this.appService = new SettingDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // ============================================
    // Core Settings Handlers
    // ============================================

    ipcMain.handle('setting:get-all', async () => {
      return this.handleRequest('setting:get-all', () =>
        this.appService.getAllSettings(),
      );
    });

    ipcMain.handle('setting:get', async (_, key: keyof AppSettings) => {
      return this.handleRequest('setting:get', () => this.appService.getSetting(key));
    });

    ipcMain.handle('setting:set', async (_, key: keyof AppSettings, value: unknown) => {
      return this.handleRequest('setting:set', () =>
        this.appService.setSetting(key, value as AppSettings[keyof AppSettings]),
      );
    });

    ipcMain.handle('setting:update', async (_, updates: Partial<AppSettings>) => {
      return this.handleRequest('setting:update', () =>
        this.appService.updateSettings(updates),
      );
    });

    ipcMain.handle('setting:reset', async (_, key?: keyof AppSettings) => {
      return this.handleRequest('setting:reset', () =>
        this.appService.resetSettings(key),
      );
    });

    // ============================================
    // Theme Handlers
    // ============================================

    ipcMain.handle('setting:get-theme', async () => {
      return this.handleRequest('setting:get-theme', () => this.appService.getTheme());
    });

    ipcMain.handle('setting:set-theme', async (_, theme: 'light' | 'dark' | 'system') => {
      return this.handleRequest('setting:set-theme', () =>
        this.appService.setTheme(theme),
      );
    });

    // ============================================
    // Language Handlers
    // ============================================

    ipcMain.handle('setting:get-language', async () => {
      return this.handleRequest('setting:get-language', () =>
        this.appService.getLanguage(),
      );
    });

    ipcMain.handle('setting:set-language', async (_, language: string) => {
      return this.handleRequest('setting:set-language', () =>
        this.appService.setLanguage(language),
      );
    });

    ipcMain.handle('setting:get-supported-languages', async () => {
      return this.handleRequest('setting:get-supported-languages', () =>
        this.appService.getSupportedLanguages(),
      );
    });

    // ============================================
    // Notification Settings Handlers
    // ============================================

    ipcMain.handle('setting:notification:get', async () => {
      return this.handleRequest('setting:notification:get', () =>
        this.appService.getNotificationSettings(),
      );
    });

    ipcMain.handle(
      'setting:notification:update',
      async (_, updates: Partial<NotificationSettings>) => {
        return this.handleRequest('setting:notification:update', () =>
          this.appService.updateNotificationSettings(updates),
        );
      },
    );

    // ============================================
    // General Settings Handlers
    // ============================================

    ipcMain.handle('setting:general:get', async () => {
      return this.handleRequest('setting:general:get', () =>
        this.appService.getGeneralSettings(),
      );
    });

    ipcMain.handle(
      'setting:general:update',
      async (_, updates: Partial<GeneralSettings>) => {
        return this.handleRequest('setting:general:update', () =>
          this.appService.updateGeneralSettings(updates),
        );
      },
    );

    // ============================================
    // Shortcut Settings Handlers
    // ============================================

    ipcMain.handle('setting:shortcut:get', async () => {
      return this.handleRequest('setting:shortcut:get', () =>
        this.appService.getShortcuts(),
      );
    });

    ipcMain.handle(
      'setting:shortcut:update',
      async (_, updates: Partial<ShortcutSettings>) => {
        return this.handleRequest('setting:shortcut:update', () =>
          this.appService.updateShortcuts(updates),
        );
      },
    );

    ipcMain.handle('setting:shortcut:reset', async () => {
      return this.handleRequest('setting:shortcut:reset', () =>
        this.appService.resetShortcuts(),
      );
    });

    // ============================================
    // Import/Export Handlers
    // ============================================

    ipcMain.handle('setting:export', async () => {
      return this.handleRequest('setting:export', () =>
        this.appService.exportSettings(),
      );
    });

    ipcMain.handle('setting:import', async (_, data: Partial<AppSettings>) => {
      return this.handleRequest('setting:import', () =>
        this.appService.importSettings(data),
      );
    });
  }
}

/**
 * 注册 Setting 模块的 IPC 处理器（已弃用）
 *
 * @deprecated 使用 SettingIPCHandler 类代替
 */
export function registerSettingIpcHandlers(): void {
  const handler = new SettingIPCHandler();
  (global as any).settingIPCHandler = handler;
}

/**
 * 注销 Setting 模块的 IPC 处理器（已弃用）
 *
 * @deprecated 由应用生命周期管理自动处理
 */
export function unregisterSettingIpcHandlers(): void {
  // IPC 通道由 Electron 在应用退出时自动清理
}
