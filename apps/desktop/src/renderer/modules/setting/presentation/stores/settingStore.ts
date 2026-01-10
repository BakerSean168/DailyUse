/**
 * Setting Store - Zustand 状态管理
 *
 * EPIC-018 重构:
 * - 移除 Container 依赖
 * - Store 仅管理本地状态
 * - 服务调用移至 useAppSettings Hook
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

// 移除 async actions，只保留纯状态管理
// 服务调用移至 useAppSettings Hook
export interface SettingStateActions {
  setSettings: (settings: Partial<AppSettings>) => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetToDefault: () => void;
}

type SettingStore = SettingState & SettingStateActions;

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
    (set) => ({
      ...initialState,

      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      setSetting: (key, value) => set((state) => ({
        settings: { ...state.settings, [key]: value },
      })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

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
