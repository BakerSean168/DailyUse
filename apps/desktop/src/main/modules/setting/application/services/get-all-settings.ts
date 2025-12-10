import { app } from 'electron';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getAllSettingsService');

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

export async function getAllSettingsService(): Promise<AppSettings> {
  logger.debug('Get all settings');
  return { ...DEFAULT_SETTINGS };
}
