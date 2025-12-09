/**
 * Setting Desktop Application Service
 *
 * 设置管理服务
 * 为 Desktop IPC handlers 提供统一的应用服务入口
 *
 * 功能：
 * - 设置读写：get, set, update, reset
 * - 主题管理：theme
 * - 语言管理：language
 * - 通知设置：notifications
 * - 常规设置：general
 * - 快捷键：shortcuts
 * - 导入导出：import/export
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingDesktopAppService');

// ===== Types =====

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email?: boolean;
  push?: boolean;
}

export interface GeneralSettings {
  autoStart: boolean;
  minimizeToTray: boolean;
  startMinimized: boolean;
  checkForUpdates?: boolean;
  analyticsEnabled?: boolean;
}

export interface ShortcutSettings {
  global: Record<string, string>;
  app: Record<string, string>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  general: GeneralSettings;
  shortcuts: ShortcutSettings;
  [key: string]: unknown;
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'zh-CN',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
  },
  general: {
    autoStart: false,
    minimizeToTray: true,
    startMinimized: false,
    checkForUpdates: true,
    analyticsEnabled: false,
  },
  shortcuts: {
    global: {
      showApp: 'CommandOrControl+Shift+D',
      quickAdd: 'CommandOrControl+Shift+N',
    },
    app: {
      newTask: 'CommandOrControl+N',
      search: 'CommandOrControl+K',
      settings: 'CommandOrControl+,',
    },
  },
};

export class SettingDesktopApplicationService {
  private settingsPath: string;
  private cachedSettings: AppSettings | null = null;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }

  // ===== Core Settings Operations =====

  /**
   * 获取所有设置
   */
  async getAllSettings(): Promise<AppSettings> {
    logger.debug('Get all settings');
    return this.loadSettings();
  }

  /**
   * 获取单个设置项
   */
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | null> {
    logger.debug('Get setting', { key });
    const settings = this.loadSettings();
    return settings[key] ?? null;
  }

  /**
   * 设置单个设置项
   */
  async setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<{ success: boolean }> {
    logger.debug('Set setting', { key });
    const settings = this.loadSettings();
    settings[key] = value;
    const success = await this.saveSettings(settings);
    return { success };
  }

  /**
   * 批量更新设置
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<{ success: boolean }> {
    logger.debug('Update settings', { keys: Object.keys(updates) });
    const settings = this.loadSettings();
    Object.assign(settings, updates);
    const success = await this.saveSettings(settings);
    return { success };
  }

  /**
   * 重置设置
   */
  async resetSettings(key?: keyof AppSettings): Promise<{ success: boolean }> {
    logger.debug('Reset settings', { key });

    if (key) {
      const settings = this.loadSettings();
      settings[key] = DEFAULT_SETTINGS[key];
      const success = await this.saveSettings(settings);
      return { success };
    } else {
      const success = await this.saveSettings({ ...DEFAULT_SETTINGS });
      return { success };
    }
  }

  // ===== Theme Settings =====

  /**
   * 获取主题
   */
  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    logger.debug('Get theme');
    const settings = this.loadSettings();
    return settings.theme;
  }

  /**
   * 设置主题
   */
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<{ success: boolean }> {
    logger.debug('Set theme', { theme });
    return this.setSetting('theme', theme);
  }

  // ===== Language Settings =====

  /**
   * 获取语言
   */
  async getLanguage(): Promise<string> {
    logger.debug('Get language');
    const settings = this.loadSettings();
    return settings.language;
  }

  /**
   * 设置语言
   */
  async setLanguage(language: string): Promise<{ success: boolean }> {
    logger.debug('Set language', { language });
    return this.setSetting('language', language);
  }

  /**
   * 获取支持的语言列表
   */
  async getSupportedLanguages(): Promise<{ code: string; name: string }[]> {
    return [
      { code: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', name: '繁體中文' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
    ];
  }

  // ===== Notification Settings =====

  /**
   * 获取通知设置
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    logger.debug('Get notification settings');
    const settings = this.loadSettings();
    return settings.notifications;
  }

  /**
   * 更新通知设置
   */
  async updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<{ success: boolean }> {
    logger.debug('Update notification settings');
    const settings = this.loadSettings();
    settings.notifications = { ...settings.notifications, ...updates };
    const success = await this.saveSettings(settings);
    return { success };
  }

  // ===== General Settings =====

  /**
   * 获取常规设置
   */
  async getGeneralSettings(): Promise<GeneralSettings> {
    logger.debug('Get general settings');
    const settings = this.loadSettings();
    return settings.general;
  }

  /**
   * 更新常规设置
   */
  async updateGeneralSettings(updates: Partial<GeneralSettings>): Promise<{ success: boolean }> {
    logger.debug('Update general settings');
    const settings = this.loadSettings();
    settings.general = { ...settings.general, ...updates };
    const success = await this.saveSettings(settings);
    return { success };
  }

  // ===== Shortcut Settings =====

  /**
   * 获取快捷键设置
   */
  async getShortcuts(): Promise<ShortcutSettings> {
    logger.debug('Get shortcuts');
    const settings = this.loadSettings();
    return settings.shortcuts;
  }

  /**
   * 更新快捷键
   */
  async updateShortcuts(updates: Partial<ShortcutSettings>): Promise<{ success: boolean }> {
    logger.debug('Update shortcuts');
    const settings = this.loadSettings();
    if (updates.global) {
      settings.shortcuts.global = { ...settings.shortcuts.global, ...updates.global };
    }
    if (updates.app) {
      settings.shortcuts.app = { ...settings.shortcuts.app, ...updates.app };
    }
    const success = await this.saveSettings(settings);
    return { success };
  }

  /**
   * 重置快捷键
   */
  async resetShortcuts(): Promise<{ success: boolean }> {
    logger.debug('Reset shortcuts');
    return this.setSetting('shortcuts', { ...DEFAULT_SETTINGS.shortcuts });
  }

  // ===== Import/Export =====

  /**
   * 导出设置
   */
  async exportSettings(): Promise<{ data: AppSettings }> {
    logger.debug('Export settings');
    const settings = this.loadSettings();
    return { data: settings };
  }

  /**
   * 导入设置
   */
  async importSettings(data: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> {
    logger.debug('Import settings');

    try {
      // Validate and merge with defaults
      const settings = { ...DEFAULT_SETTINGS, ...data };
      const success = await this.saveSettings(settings);
      return { success };
    } catch (error) {
      logger.error('Failed to import settings', error);
      return { success: false, error: String(error) };
    }
  }

  // ===== Private Helpers =====

  /**
   * 加载设置（同步，带缓存）
   */
  private loadSettings(): AppSettings {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const loaded = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        this.cachedSettings = loaded;
        return loaded;
      }
    } catch (error) {
      logger.error('Failed to load settings', error);
    }

    const defaults = { ...DEFAULT_SETTINGS };
    this.cachedSettings = defaults;
    return defaults;
  }

  /**
   * 保存设置
   */
  private async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      await fsp.writeFile(this.settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      this.cachedSettings = settings;
      logger.info('Settings saved successfully');
      return true;
    } catch (error) {
      logger.error('Failed to save settings', error);
      return false;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cachedSettings = null;
  }
}
