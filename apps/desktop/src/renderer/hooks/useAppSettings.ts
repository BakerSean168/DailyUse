/**
 * useAppSettings Hook
 *
 * 应用设置管理 Hook
 * Story-012: Desktop Native Features
 */

import { useState, useCallback, useEffect } from 'react';

// 快捷键配置
export interface ShortcutConfig {
  accelerator: string;
  action: string;
  enabled: boolean;
  description: string;
}

// 应用设置
export interface AppSettings {
  // 通用设置
  language: string;
  theme: 'light' | 'dark' | 'system';

  // 启动设置
  autoLaunch: boolean;
  startMinimized: boolean;
  hideOnClose: boolean;

  // 快捷键设置
  shortcuts: ShortcutConfig[];

  // 托盘设置
  showTrayIcon: boolean;
  trayClickAction: 'show' | 'toggle';
}

const defaultSettings: AppSettings = {
  language: 'zh-CN',
  theme: 'system',
  autoLaunch: false,
  startMinimized: false,
  hideOnClose: true,
  shortcuts: [
    {
      accelerator: 'CommandOrControl+Shift+D',
      action: 'toggle-window',
      enabled: true,
      description: '显示/隐藏窗口',
    },
    {
      accelerator: 'CommandOrControl+Shift+N',
      action: 'quick-note',
      enabled: true,
      description: '快速记录',
    },
    {
      accelerator: 'CommandOrControl+Shift+T',
      action: 'today-tasks',
      enabled: true,
      description: '今日任务',
    },
  ],
  showTrayIcon: true,
  trayClickAction: 'toggle',
};

interface UseAppSettingsReturn {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  updateShortcut: (index: number, shortcut: ShortcutConfig) => Promise<void>;
  resetSettings: () => Promise<void>;
  setAutoLaunch: (enabled: boolean) => Promise<void>;
  isElectron: boolean;
}

export function useAppSettings(): UseAppSettingsReturn {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否在 Electron 环境
  const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

  // 加载设置
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isElectron) {
        // 从 Electron 加载设置
        const result = await (window as any).electronAPI.invoke('settings:get');
        if (result) {
          setSettings({ ...defaultSettings, ...result });
        }
      } else {
        // 从 localStorage 加载
        const stored = localStorage.getItem('app-settings');
        if (stored) {
          setSettings({ ...defaultSettings, ...JSON.parse(stored) });
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // 更新设置
  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      setLoading(true);
      setError(null);

      try {
        const newSettings = { ...settings, ...updates };

        if (isElectron) {
          await (window as any).electronAPI.invoke('settings:set', newSettings);
        } else {
          localStorage.setItem('app-settings', JSON.stringify(newSettings));
        }

        setSettings(newSettings);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [settings, isElectron]
  );

  // 更新快捷键
  const updateShortcut = useCallback(
    async (index: number, shortcut: ShortcutConfig) => {
      const newShortcuts = [...settings.shortcuts];
      newShortcuts[index] = shortcut;
      await updateSettings({ shortcuts: newShortcuts });
    },
    [settings.shortcuts, updateSettings]
  );

  // 重置设置
  const resetSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isElectron) {
        await (window as any).electronAPI.invoke('settings:reset');
      } else {
        localStorage.removeItem('app-settings');
      }

      setSettings(defaultSettings);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isElectron]);

  // 设置自启动
  const setAutoLaunch = useCallback(
    async (enabled: boolean) => {
      if (!isElectron) {
        setError('自启动功能仅在桌面应用中可用');
        return;
      }

      try {
        await (window as any).electronAPI.invoke('autolaunch:set', enabled);
        await updateSettings({ autoLaunch: enabled });
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [isElectron, updateSettings]
  );

  // 初始加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    updateShortcut,
    resetSettings,
    setAutoLaunch,
    isElectron,
  };
}

export default useAppSettings;
