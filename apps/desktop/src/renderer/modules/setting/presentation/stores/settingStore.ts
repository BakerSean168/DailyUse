/**
 * Setting Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { settingContainer } from '../../infrastructure/di';
import type { AppSettingsDTO, ShortcutSettingsDTO } from '../../infrastructure/ipc/setting.ipc-client';

// ============ Types ============
// 本地扁平化设置类型（用于 UI 组件）
export interface AppSettings {
  // 通用设置
  language: 'zh-CN' | 'en-US';
  autoStart: boolean;
  minimizeToTray: boolean;
  
  // 主题设置
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  
  // 通知设置
  enableNotifications: boolean;
  notificationSound: boolean;
  
  // 同步设置
  autoSync: boolean;
  syncInterval: number; // minutes
  
  // 快捷键
  shortcuts: Record<string, string>;
}

export interface SettingState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

export interface SettingActions {
  setSettings: (settings: Partial<AppSettings>) => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetToDefault: () => void;
}

type SettingStore = SettingState & SettingActions;

const defaultSettings: AppSettings = {
  language: 'zh-CN',
  autoStart: false,
  minimizeToTray: true,
  theme: 'system',
  accentColor: '#3b82f6',
  enableNotifications: true,
  notificationSound: true,
  autoSync: true,
  syncInterval: 5,
  shortcuts: {
    'newGoal': 'Ctrl+Shift+G',
    'newTask': 'Ctrl+Shift+T',
    'newReminder': 'Ctrl+Shift+R',
    'search': 'Ctrl+K',
  },
};

// 将 IPC 嵌套结构转换为扁平结构
function fromIPCSettings(dto: AppSettingsDTO): AppSettings {
  const lang = dto.general?.language;
  const validLanguage: 'zh-CN' | 'en-US' = (lang === 'zh-CN' || lang === 'en-US') ? lang : defaultSettings.language;
  
  return {
    language: validLanguage,
    autoStart: dto.general?.autoLaunch ?? defaultSettings.autoStart,
    minimizeToTray: dto.general?.minimizeToTray ?? defaultSettings.minimizeToTray,
    theme: dto.appearance?.theme ?? defaultSettings.theme,
    accentColor: dto.appearance?.accentColor ?? defaultSettings.accentColor,
    enableNotifications: dto.notifications?.enabled ?? defaultSettings.enableNotifications,
    notificationSound: dto.notifications?.sound ?? defaultSettings.notificationSound,
    autoSync: dto.sync?.autoSync ?? defaultSettings.autoSync,
    syncInterval: dto.sync?.syncInterval ?? defaultSettings.syncInterval,
    shortcuts: dto.shortcuts?.global ?? defaultSettings.shortcuts,
  };
}

// 将扁平结构转换为 IPC 嵌套结构
function toIPCSettings(settings: AppSettings): Partial<AppSettingsDTO> {
  return {
    general: {
      language: settings.language,
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      weekStartsOn: 1,
      autoLaunch: settings.autoStart,
      minimizeToTray: settings.minimizeToTray,
    },
    appearance: {
      theme: settings.theme,
      accentColor: settings.accentColor,
      fontSize: 'medium',
      compactMode: false,
    },
    notifications: {
      enabled: settings.enableNotifications,
      sound: settings.notificationSound,
      doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    },
    shortcuts: {
      global: settings.shortcuts,
      local: {},
    },
    privacy: {
      analytics: false,
      crashReports: true,
    },
    sync: {
      enabled: true,
      autoSync: settings.autoSync,
      syncInterval: settings.syncInterval,
    },
  };
}

const initialState: SettingState = {
  settings: defaultSettings,
  isLoading: false,
  error: null,
};

// ============ Store ============
export const useSettingStore = create<SettingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),
      
      setSetting: (key, value) => set((state) => ({
        settings: { ...state.settings, [key]: value },
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      loadSettings: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const settingClient = settingContainer.settingClient;
          const loadedSettings = await settingClient.getAll();
          if (loadedSettings) {
            // 将 IPC 嵌套结构转换为扁平结构
            const flatSettings = fromIPCSettings(loadedSettings);
            set({ settings: { ...defaultSettings, ...flatSettings } });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load settings' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      saveSettings: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const settingClient = settingContainer.settingClient;
          // 将扁平结构转换为 IPC 嵌套结构
          const ipcSettings = toIPCSettings(get().settings);
          await settingClient.setAll(ipcSettings as AppSettingsDTO);
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to save settings' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      resetToDefault: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'setting-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useSettings = () => useSettingStore((state) => state.settings);
export const useTheme = () => useSettingStore((state) => state.settings.theme);
