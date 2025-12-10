/**
 * Setting IPC 处理器
 * 处理所有与设置相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { SettingDesktopApplicationService, type AppSettings } from '../application/SettingDesktopApplicationService';

export class SettingIPCHandler extends BaseIPCHandler {
  private settingService: SettingDesktopApplicationService;

  constructor() {
    super('SettingIPCHandler');
    this.settingService = new SettingDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 获取所有设置
    ipcMain.handle('setting:get-all', async () => {
      return this.handleRequest(
        'setting:get-all',
        () => this.settingService.getAllSettings(),
      );
    });

    // 获取单个设置
    ipcMain.handle('setting:get', async (event, key: keyof AppSettings) => {
      return this.handleRequest(
        'setting:get',
        () => this.settingService.getSetting(key),
      );
    });

    // 设置单个设置项
    ipcMain.handle('setting:set', async (event, payload: { key: keyof AppSettings; value: any }) => {
      return this.handleRequest(
        'setting:set',
        () => this.settingService.setSetting(payload.key, payload.value),
      );
    });

    // 批量更新设置
    ipcMain.handle('setting:update', async (event, updates: Partial<AppSettings>) => {
      return this.handleRequest(
        'setting:update',
        () => this.settingService.updateSettings(updates),
      );
    });

    // 重置设置
    ipcMain.handle('setting:reset', async (event, key?: keyof AppSettings) => {
      return this.handleRequest(
        'setting:reset',
        () => this.settingService.resetSettings(key),
      );
    });

    // 主题管理
    ipcMain.handle('setting:get-theme', async () => {
      return this.handleRequest(
        'setting:get-theme',
        () => this.settingService.getTheme(),
      );
    });

    ipcMain.handle('setting:set-theme', async (event, theme: 'light' | 'dark' | 'system') => {
      return this.handleRequest(
        'setting:set-theme',
        () => this.settingService.setTheme(theme),
      );
    });

    // 语言管理
    ipcMain.handle('setting:get-language', async () => {
      return this.handleRequest(
        'setting:get-language',
        () => this.settingService.getLanguage(),
      );
    });

    ipcMain.handle('setting:set-language', async (event, language: string) => {
      return this.handleRequest(
        'setting:set-language',
        () => this.settingService.setLanguage(language),
      );
    });

    // 通知设置
    ipcMain.handle('setting:get-notifications', async () => {
      return this.handleRequest(
        'setting:get-notifications',
        () => this.settingService.getNotificationSettings(),
      );
    });

    ipcMain.handle('setting:set-notifications', async (event, settings: any) => {
      return this.handleRequest(
        'setting:set-notifications',
        () => this.settingService.updateNotificationSettings(settings),
      );
    });

    // 常规设置
    ipcMain.handle('setting:get-general', async () => {
      return this.handleRequest(
        'setting:get-general',
        () => this.settingService.getGeneralSettings(),
      );
    });

    ipcMain.handle('setting:set-general', async (event, settings: any) => {
      return this.handleRequest(
        'setting:set-general',
        () => this.settingService.updateGeneralSettings(settings),
      );
    });

    // 快捷键设置
    ipcMain.handle('setting:get-shortcuts', async () => {
      return this.handleRequest(
        'setting:get-shortcuts',
        () => this.settingService.getShortcuts(),
      );
    });

    ipcMain.handle('setting:set-shortcuts', async (event, shortcuts: any) => {
      return this.handleRequest(
        'setting:set-shortcuts',
        () => this.settingService.updateShortcuts(shortcuts),
      );
    });

    // 导入导出设置
    ipcMain.handle('setting:export', async () => {
      return this.handleRequest(
        'setting:export',
        () => this.settingService.exportSettings(),
      );
    });

    ipcMain.handle('setting:import', async (event, data: Partial<AppSettings>) => {
      return this.handleRequest(
        'setting:import',
        () => this.settingService.importSettings(data),
      );
    });

    this.logger.info('Registered Setting IPC handlers');
  }
}

export const settingIPCHandler = new SettingIPCHandler();
