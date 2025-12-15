/**
 * Setting IPC Client - Setting 模块 IPC 客户端
 * 
 * @module renderer/modules/setting/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { SettingChannels } from '@/shared/types/ipc-channels';

// ============ Types ============

export interface AppSettingsDTO {
  general: GeneralSettingsDTO;
  appearance: AppearanceSettingsDTO;
  notifications: NotificationSettingsDTO;
  shortcuts: ShortcutSettingsDTO;
  privacy: PrivacySettingsDTO;
  sync: SyncSettingsDTO;
}

export interface GeneralSettingsDTO {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: number;
  autoLaunch: boolean;
  minimizeToTray: boolean;
}

export interface AppearanceSettingsDTO {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

export interface NotificationSettingsDTO {
  enabled: boolean;
  sound: boolean;
  soundFile?: string;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface ShortcutSettingsDTO {
  global: Record<string, string>;
  local: Record<string, string>;
}

export interface PrivacySettingsDTO {
  analytics: boolean;
  crashReports: boolean;
}

export interface SyncSettingsDTO {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export interface ThemeDTO {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: Record<string, string>;
}

// ============ Setting IPC Client ============

/**
 * Setting IPC Client
 */
export class SettingIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ Settings ============

  /**
   * 获取所有设置
   */
  async getAll(): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.GET_ALL,
      {}
    );
  }

  /**
   * 获取设置
   */
  async get<K extends keyof AppSettingsDTO>(key: K): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.GET,
      { key }
    );
  }

  /**
   * 更新设置
   */
  async update<K extends keyof AppSettingsDTO>(
    key: K,
    settings: Partial<AppSettingsDTO[K]>
  ): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.UPDATE,
      { key, settings }
    );
  }

  /**
   * 重置设置
   */
  async reset(key?: keyof AppSettingsDTO): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.RESET,
      { key }
    );
  }

  // ============ Section Settings ============

  /**
   * 获取设置分类
   */
  async getSection<K extends keyof AppSettingsDTO>(section: K): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.SECTION_GET,
      { section }
    );
  }

  /**
   * 更新设置分类
   */
  async updateSection<K extends keyof AppSettingsDTO>(
    section: K,
    settings: Partial<AppSettingsDTO[K]>
  ): Promise<AppSettingsDTO[K]> {
    return this.client.invoke<AppSettingsDTO[K]>(
      SettingChannels.SECTION_UPDATE,
      { section, settings }
    );
  }

  // ============ Shortcuts ============

  /**
   * 获取快捷键列表
   */
  async listShortcuts(): Promise<ShortcutSettingsDTO> {
    return this.client.invoke<ShortcutSettingsDTO>(
      SettingChannels.SHORTCUT_LIST,
      {}
    );
  }

  /**
   * 设置快捷键
   */
  async setShortcut(action: string, keys: string): Promise<void> {
    return this.client.invoke<void>(
      SettingChannels.SHORTCUT_SET,
      { action, keys }
    );
  }

  /**
   * 重置快捷键
   */
  async resetShortcuts(): Promise<ShortcutSettingsDTO> {
    return this.client.invoke<ShortcutSettingsDTO>(
      SettingChannels.SHORTCUT_RESET,
      {}
    );
  }

  // ============ Theme ============

  /**
   * 获取主题
   */
  async getTheme(): Promise<AppearanceSettingsDTO['theme']> {
    return this.client.invoke<AppearanceSettingsDTO['theme']>(
      SettingChannels.THEME_GET,
      {}
    );
  }

  /**
   * 设置主题
   */
  async setTheme(theme: AppearanceSettingsDTO['theme']): Promise<void> {
    return this.client.invoke<void>(
      SettingChannels.THEME_SET,
      { theme }
    );
  }

  /**
   * 获取可用主题列表
   */
  async listThemes(): Promise<ThemeDTO[]> {
    return this.client.invoke<ThemeDTO[]>(
      SettingChannels.THEME_LIST,
      {}
    );
  }

  // ============ Language ============

  /**
   * 获取语言
   */
  async getLanguage(): Promise<string> {
    return this.client.invoke<string>(
      SettingChannels.LANGUAGE_GET,
      {}
    );
  }

  /**
   * 设置语言
   */
  async setLanguage(language: string): Promise<void> {
    return this.client.invoke<void>(
      SettingChannels.LANGUAGE_SET,
      { language }
    );
  }

  // ============ Notifications ============

  /**
   * 获取通知设置
   */
  async getNotificationSettings(): Promise<NotificationSettingsDTO> {
    return this.client.invoke<NotificationSettingsDTO>(
      SettingChannels.NOTIFICATION_GET,
      {}
    );
  }

  /**
   * 更新通知设置
   */
  async updateNotificationSettings(settings: Partial<NotificationSettingsDTO>): Promise<NotificationSettingsDTO> {
    return this.client.invoke<NotificationSettingsDTO>(
      SettingChannels.NOTIFICATION_UPDATE,
      settings
    );
  }

  // ============ Backup ============

  /**
   * 创建设置备份
   */
  async createBackup(): Promise<{ path: string }> {
    return this.client.invoke(
      SettingChannels.BACKUP_CREATE,
      {}
    );
  }

  /**
   * 恢复设置
   */
  async restoreBackup(path: string): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.BACKUP_RESTORE,
      { path }
    );
  }

  /**
   * 获取备份列表
   */
  async listBackups(): Promise<Array<{ path: string; createdAt: number }>> {
    return this.client.invoke(
      SettingChannels.BACKUP_LIST,
      {}
    );
  }

  // ============ Import/Export ============

  /**
   * 导入设置
   */
  async import(settingsJson: string): Promise<AppSettingsDTO> {
    return this.client.invoke<AppSettingsDTO>(
      SettingChannels.IMPORT,
      { settings: settingsJson }
    );
  }

  /**
   * 导出设置
   */
  async export(): Promise<string> {
    return this.client.invoke<string>(
      SettingChannels.EXPORT,
      {}
    );
  }
}

// ============ Singleton Export ============

export const settingIPCClient = new SettingIPCClient();
   */
  onThemeChanged(handler: (theme: AppearanceSettingsDTO['theme']) => void): () => void {
    return this.client.on(SettingChannels.EVENT_THEME_CHANGED, handler);
  }
}

// ============ Singleton Export ============

export const settingIPCClient = new SettingIPCClient();
