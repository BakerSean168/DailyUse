/**
 * Setting Store - Zustand 状态管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============ Types ============
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
          const loadedSettings = await window.electron.setting.getAll() as Partial<AppSettings> | null;
          if (loadedSettings) {
            set({ settings: { ...defaultSettings, ...loadedSettings } });
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
          await window.electron.setting.save(get().settings);
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
