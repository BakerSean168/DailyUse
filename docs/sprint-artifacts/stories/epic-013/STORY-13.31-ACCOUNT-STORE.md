# Story 13.31: Account 模块 Store 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.31 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 3h |
| 前置依赖 | Story 13.30 (Account IPC Client) |
| 关联模块 | Account |

## 目标

实现 Account 模块的 Zustand Store，管理用户账户和偏好设置状态。

## 任务列表

### 1. 创建 accountStore (2h)
- [ ] 定义 State 接口
- [ ] 实现 Profile 状态管理
- [ ] 实现 Preferences 状态管理
- [ ] 实现 Actions

### 2. 实现 IPC 事件监听 (0.5h)
- [ ] 监听 profile-updated 事件
- [ ] 监听 preferences-changed 事件
- [ ] 自动同步状态

### 3. 单元测试 (0.5h)
- [ ] Store 测试
- [ ] Actions 测试

## 技术规范

### accountStore 实现
```typescript
// renderer/modules/account/presentation/stores/accountStore.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import {
  accountIPCClient,
  type UserProfile,
  type UserPreferences,
  type UpdateProfileInput,
  type UpdatePreferencesInput,
  type ExportDataOptions,
  type ExportDataResult,
} from '../../infrastructure/ipc';

interface AccountState {
  // Profile State
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  
  // Preferences State
  preferences: UserPreferences | null;
  isLoadingPreferences: boolean;
  
  // Export State
  isExporting: boolean;
  lastExport: ExportDataResult | null;
  
  // Error State
  error: string | null;
}

interface AccountActions {
  // Profile Actions
  loadProfile: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  
  // Preferences Actions
  loadPreferences: () => Promise<void>;
  updatePreferences: (input: UpdatePreferencesInput) => Promise<void>;
  
  // Theme Helpers
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  getEffectiveTheme: () => 'light' | 'dark';
  
  // Account Operations
  deleteAccount: () => Promise<void>;
  exportData: (options: ExportDataOptions) => Promise<ExportDataResult>;
  
  // Initialization
  initialize: () => Promise<void>;
  
  // Selectors
  isLoggedIn: () => boolean;
  
  // Internal
  _setProfile: (profile: UserProfile | null) => void;
  _setPreferences: (preferences: UserPreferences) => void;
}

type AccountStore = AccountState & AccountActions;

const initialState: AccountState = {
  profile: null,
  isLoadingProfile: false,
  preferences: null,
  isLoadingPreferences: false,
  isExporting: false,
  lastExport: null,
  error: null,
};

export const useAccountStore = create<AccountStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // ===== Profile Actions =====

        loadProfile: async () => {
          set({ isLoadingProfile: true, error: null });
          try {
            const profile = await accountIPCClient.getProfile();
            set({ profile, isLoadingProfile: false });
          } catch (error) {
            set({
              error: (error as Error).message,
              isLoadingProfile: false,
            });
            throw error;
          }
        },

        updateProfile: async (input) => {
          set({ isLoadingProfile: true, error: null });
          try {
            const profile = await accountIPCClient.updateProfile(input);
            set({ profile, isLoadingProfile: false });
          } catch (error) {
            set({
              error: (error as Error).message,
              isLoadingProfile: false,
            });
            throw error;
          }
        },

        // ===== Preferences Actions =====

        loadPreferences: async () => {
          set({ isLoadingPreferences: true, error: null });
          try {
            const preferences = await accountIPCClient.getPreferences();
            set({ preferences, isLoadingPreferences: false });
            
            // Apply theme on load
            get().applyTheme(preferences.theme);
          } catch (error) {
            set({
              error: (error as Error).message,
              isLoadingPreferences: false,
            });
            throw error;
          }
        },

        updatePreferences: async (input) => {
          set({ isLoadingPreferences: true, error: null });
          try {
            const preferences = await accountIPCClient.updatePreferences(input);
            set({ preferences, isLoadingPreferences: false });
            
            // Apply theme if changed
            if (input.theme) {
              get().applyTheme(input.theme);
            }
          } catch (error) {
            set({
              error: (error as Error).message,
              isLoadingPreferences: false,
            });
            throw error;
          }
        },

        // ===== Theme Helpers =====

        setTheme: async (theme) => {
          await get().updatePreferences({ theme });
        },

        getEffectiveTheme: () => {
          const { preferences } = get();
          if (!preferences || preferences.theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
          }
          return preferences.theme;
        },

        applyTheme: (theme: 'light' | 'dark' | 'system') => {
          const effectiveTheme =
            theme === 'system'
              ? window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light'
              : theme;

          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(effectiveTheme);
        },

        // ===== Account Operations =====

        deleteAccount: async () => {
          set({ error: null });
          try {
            await accountIPCClient.deleteAccount();
            set({ profile: null, preferences: null });
          } catch (error) {
            set({ error: (error as Error).message });
            throw error;
          }
        },

        exportData: async (options) => {
          set({ isExporting: true, error: null });
          try {
            const result = await accountIPCClient.exportData(options);
            set({ lastExport: result, isExporting: false });
            return result;
          } catch (error) {
            set({
              error: (error as Error).message,
              isExporting: false,
            });
            throw error;
          }
        },

        // ===== Initialization =====

        initialize: async () => {
          // Load both profile and preferences
          await Promise.all([
            get().loadProfile(),
            get().loadPreferences(),
          ]);

          // Set up IPC event listeners
          accountIPCClient.onProfileUpdated((profile) => {
            set({ profile });
          });

          accountIPCClient.onPreferencesChanged((preferences) => {
            set({ preferences });
            get().applyTheme(preferences.theme);
          });

          accountIPCClient.onAccountDeleted(() => {
            set({ profile: null, preferences: null });
          });

          // Listen for system theme changes
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          mediaQuery.addEventListener('change', () => {
            const { preferences } = get();
            if (preferences?.theme === 'system') {
              get().applyTheme('system');
            }
          });
        },

        // ===== Selectors =====

        isLoggedIn: () => {
          return get().profile !== null;
        },

        // ===== Internal =====

        _setProfile: (profile) => {
          set({ profile });
        },

        _setPreferences: (preferences) => {
          set({ preferences });
        },
      }),
      {
        name: 'account-store',
        partialize: (state) => ({
          // Only persist certain fields
          preferences: state.preferences,
        }),
      }
    )
  )
);

// Subscribe to preferences changes to apply theme
useAccountStore.subscribe(
  (state) => state.preferences?.theme,
  (theme) => {
    if (theme) {
      useAccountStore.getState().applyTheme(theme);
    }
  }
);
```

### usePreferences Hook
```typescript
// renderer/modules/account/presentation/hooks/usePreferences.ts
import { useCallback } from 'react';
import { useAccountStore } from '../stores';
import type { UserPreferences } from '../../infrastructure/ipc';

export function usePreferences() {
  const preferences = useAccountStore((state) => state.preferences);
  const isLoading = useAccountStore((state) => state.isLoadingPreferences);
  const updatePreferences = useAccountStore((state) => state.updatePreferences);
  const setTheme = useAccountStore((state) => state.setTheme);
  const getEffectiveTheme = useAccountStore((state) => state.getEffectiveTheme);

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(
      key: K,
      value: UserPreferences[K]
    ) => {
      await updatePreferences({ [key]: value } as Partial<UserPreferences>);
    },
    [updatePreferences]
  );

  return {
    preferences,
    isLoading,
    updatePreferences,
    updatePreference,
    setTheme,
    effectiveTheme: getEffectiveTheme(),
  };
}
```

### useProfile Hook
```typescript
// renderer/modules/account/presentation/hooks/useProfile.ts
import { useCallback } from 'react';
import { useAccountStore } from '../stores';
import type { UpdateProfileInput } from '../../infrastructure/ipc';

export function useProfile() {
  const profile = useAccountStore((state) => state.profile);
  const isLoading = useAccountStore((state) => state.isLoadingProfile);
  const isLoggedIn = useAccountStore((state) => state.isLoggedIn);
  const updateProfile = useAccountStore((state) => state.updateProfile);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      await updateProfile({ displayName });
    },
    [updateProfile]
  );

  const updateAvatar = useCallback(
    async (avatarUrl: string | null) => {
      await updateProfile({ avatarUrl });
    },
    [updateProfile]
  );

  const updateTimezone = useCallback(
    async (timezone: string) => {
      await updateProfile({ timezone });
    },
    [updateProfile]
  );

  return {
    profile,
    isLoading,
    isLoggedIn: isLoggedIn(),
    updateProfile,
    updateDisplayName,
    updateAvatar,
    updateTimezone,
  };
}
```

### 索引文件
```typescript
// renderer/modules/account/presentation/stores/index.ts
export { useAccountStore } from './accountStore';

// renderer/modules/account/presentation/hooks/index.ts
export { usePreferences } from './usePreferences';
export { useProfile } from './useProfile';
```

### 单元测试
```typescript
// renderer/modules/account/presentation/stores/__tests__/accountStore.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAccountStore } from '../accountStore';
import { accountIPCClient } from '../../../infrastructure/ipc';

vi.mock('../../../infrastructure/ipc');

const mockAccountIPCClient = vi.mocked(accountIPCClient);

describe('accountStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAccountStore.setState({
      profile: null,
      isLoadingProfile: false,
      preferences: null,
      isLoadingPreferences: false,
      isExporting: false,
      lastExport: null,
      error: null,
    });
  });

  describe('loadProfile', () => {
    it('should load profile successfully', async () => {
      const mockProfile = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAccountIPCClient.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useAccountStore());

      await act(async () => {
        await result.current.loadProfile();
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoadingProfile).toBe(false);
    });

    it('should handle profile load error', async () => {
      mockAccountIPCClient.getProfile.mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() => useAccountStore());

      await expect(
        act(async () => {
          await result.current.loadProfile();
        })
      ).rejects.toThrow('Load failed');

      expect(result.current.error).toBe('Load failed');
      expect(result.current.isLoadingProfile).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updatedProfile = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        displayName: 'New Name',
        avatarUrl: null,
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAccountIPCClient.updateProfile.mockResolvedValue(updatedProfile);

      const { result } = renderHook(() => useAccountStore());

      await act(async () => {
        await result.current.updateProfile({ displayName: 'New Name' });
      });

      expect(result.current.profile?.displayName).toBe('New Name');
    });
  });

  describe('loadPreferences', () => {
    it('should load preferences and apply theme', async () => {
      const mockPrefs = {
        theme: 'dark' as const,
        startOnBoot: false,
        minimizeToTray: true,
        showInMenuBar: true,
        notificationSound: true,
        dailyDigestTime: '09:00',
        weekStartsOn: 1 as const,
        defaultView: 'today' as const,
        taskDefaultPriority: 2,
        pomodoroWorkMinutes: 25,
        pomodoroBreakMinutes: 5,
        pomodoroLongBreakMinutes: 15,
        pomodoroSessionsBeforeLongBreak: 4,
      };

      mockAccountIPCClient.getPreferences.mockResolvedValue(mockPrefs);

      const { result } = renderHook(() => useAccountStore());

      await act(async () => {
        await result.current.loadPreferences();
      });

      expect(result.current.preferences?.theme).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should update theme preference', async () => {
      const mockPrefs = {
        theme: 'dark' as const,
        startOnBoot: false,
        minimizeToTray: true,
        showInMenuBar: true,
        notificationSound: true,
        dailyDigestTime: '09:00',
        weekStartsOn: 1 as const,
        defaultView: 'today' as const,
        taskDefaultPriority: 2,
        pomodoroWorkMinutes: 25,
        pomodoroBreakMinutes: 5,
        pomodoroLongBreakMinutes: 15,
        pomodoroSessionsBeforeLongBreak: 4,
      };

      mockAccountIPCClient.updatePreferences.mockResolvedValue(mockPrefs);

      const { result } = renderHook(() => useAccountStore());

      await act(async () => {
        await result.current.setTheme('dark');
      });

      expect(mockAccountIPCClient.updatePreferences).toHaveBeenCalledWith({
        theme: 'dark',
      });
    });
  });

  describe('exportData', () => {
    it('should export data successfully', async () => {
      const exportResult = {
        filePath: '/downloads/export.json',
        format: 'json' as const,
        includedModules: ['tasks', 'goals'],
        exportedAt: new Date(),
      };

      mockAccountIPCClient.exportData.mockResolvedValue(exportResult);

      const { result } = renderHook(() => useAccountStore());

      let resultData;
      await act(async () => {
        resultData = await result.current.exportData({
          format: 'json',
          modules: ['tasks', 'goals'],
        });
      });

      expect(resultData).toEqual(exportResult);
      expect(result.current.lastExport).toEqual(exportResult);
      expect(result.current.isExporting).toBe(false);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when profile exists', () => {
      useAccountStore.setState({
        profile: {
          uuid: 'user-uuid',
          email: 'test@example.com',
          displayName: 'Test',
          avatarUrl: null,
          timezone: 'UTC',
          language: 'en',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const { result } = renderHook(() => useAccountStore());
      expect(result.current.isLoggedIn()).toBe(true);
    });

    it('should return false when profile is null', () => {
      const { result } = renderHook(() => useAccountStore());
      expect(result.current.isLoggedIn()).toBe(false);
    });
  });
});
```

## 验收标准

- [ ] Profile 状态管理正常
- [ ] Preferences 状态管理正常
- [ ] 主题切换正常工作
- [ ] 数据导出状态正确
- [ ] IPC 事件监听正常
- [ ] 系统主题变化响应
- [ ] 单元测试覆盖率 > 80%
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/account/presentation/stores/accountStore.ts`
- `renderer/modules/account/presentation/stores/index.ts`
- `renderer/modules/account/presentation/hooks/usePreferences.ts`
- `renderer/modules/account/presentation/hooks/useProfile.ts`
- `renderer/modules/account/presentation/hooks/index.ts`
- `renderer/modules/account/presentation/stores/__tests__/accountStore.test.ts`
