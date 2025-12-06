/**
 * Setting Module IPC Handlers
 */

import { ipcMain } from 'electron';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// 设置文件路径
const getSettingsPath = () => path.join(app.getPath('userData'), 'settings.json');

// 默认设置
const defaultSettings = {
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
  },
  shortcuts: {
    global: {},
    app: {},
  },
};

// 读取设置
const loadSettings = (): Record<string, unknown> => {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('[Settings] Failed to load settings:', error);
  }
  return { ...defaultSettings };
};

// 保存设置
const saveSettings = (settings: Record<string, unknown>): boolean => {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('[Settings] Failed to save settings:', error);
    return false;
  }
};

/**
 * 注册 Setting 模块的 IPC 处理器
 */
export function registerSettingIpcHandlers(): void {
  ipcMain.handle('setting:get-all', async () => {
    return loadSettings();
  });

  ipcMain.handle('setting:get', async (_, key: string) => {
    const settings = loadSettings();
    return settings[key] ?? null;
  });

  ipcMain.handle('setting:set', async (_, key: string, value: unknown) => {
    const settings = loadSettings();
    settings[key] = value;
    const success = saveSettings(settings);
    return { success };
  });

  ipcMain.handle('setting:update', async (_, updates: Record<string, unknown>) => {
    const settings = loadSettings();
    Object.assign(settings, updates);
    const success = saveSettings(settings);
    return { success };
  });

  ipcMain.handle('setting:reset', async (_, key?: string) => {
    if (key) {
      const settings = loadSettings();
      settings[key] = (defaultSettings as Record<string, unknown>)[key];
      const success = saveSettings(settings);
      return { success };
    } else {
      const success = saveSettings({ ...defaultSettings });
      return { success };
    }
  });

  ipcMain.handle('setting:get-theme', async () => {
    const settings = loadSettings();
    return settings.theme ?? 'system';
  });

  ipcMain.handle('setting:set-theme', async (_, theme: string) => {
    const settings = loadSettings();
    settings.theme = theme;
    const success = saveSettings(settings);
    return { success };
  });

  ipcMain.handle('setting:get-language', async () => {
    const settings = loadSettings();
    return settings.language ?? 'zh-CN';
  });

  ipcMain.handle('setting:set-language', async (_, language: string) => {
    const settings = loadSettings();
    settings.language = language;
    const success = saveSettings(settings);
    return { success };
  });

  ipcMain.handle('setting:export', async () => {
    const settings = loadSettings();
    return { data: settings };
  });

  ipcMain.handle('setting:import', async (_, data: Record<string, unknown>) => {
    const success = saveSettings({ ...defaultSettings, ...data });
    return { success };
  });

  console.log('[IPC] Setting handlers registered');
}
