# Story 13.30: Account 模块 IPC Client

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.30 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 2h |
| 前置依赖 | Story 13.29 (Account Main Process) |
| 关联模块 | Account |

## 目标

实现 Account 模块的 Renderer Process IPC Client。

## 任务列表

### 1. 创建 AccountIPCClient (1.5h)
- [ ] 继承 BaseIPCClient
- [ ] 实现 Profile 方法
- [ ] 实现 Preferences 方法
- [ ] 实现账户操作方法

### 2. 类型定义和测试 (0.5h)
- [ ] 导出类型定义
- [ ] 单元测试

## 技术规范

### AccountIPCClient 实现
```typescript
// renderer/modules/account/infrastructure/ipc/accountIPCClient.ts
import { BaseIPCClient } from '../../../../infrastructure/ipc';

// Types (re-export from shared or define here)
export interface UserProfile {
  uuid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  startOnBoot: boolean;
  minimizeToTray: boolean;
  showInMenuBar: boolean;
  notificationSound: boolean;
  dailyDigestTime: string | null;
  weekStartsOn: 0 | 1 | 6;
  defaultView: 'today' | 'week' | 'month';
  taskDefaultPriority: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroLongBreakMinutes: number;
  pomodoroSessionsBeforeLongBreak: number;
}

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string | null;
  timezone?: string;
  language?: string;
}

export interface UpdatePreferencesInput extends Partial<UserPreferences> {}

export interface ExportDataOptions {
  format: 'json' | 'csv';
  modules?: string[];
}

export interface ExportDataResult {
  filePath: string;
  format: 'json' | 'csv';
  includedModules: string[];
  exportedAt: Date;
}

export interface AccountIPCClient {
  // Profile
  getProfile(): Promise<UserProfile | null>;
  updateProfile(input: UpdateProfileInput): Promise<UserProfile>;
  
  // Preferences
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(input: UpdatePreferencesInput): Promise<UserPreferences>;
  
  // Account Operations
  deleteAccount(): Promise<void>;
  exportData(options: ExportDataOptions): Promise<ExportDataResult>;
  
  // Events
  onProfileUpdated(callback: (profile: UserProfile) => void): () => void;
  onPreferencesChanged(callback: (preferences: UserPreferences) => void): () => void;
  onAccountDeleted(callback: () => void): () => void;
}

class AccountIPCClientImpl extends BaseIPCClient implements AccountIPCClient {
  constructor() {
    super('account');
  }

  // ===== Profile Methods =====

  async getProfile(): Promise<UserProfile | null> {
    return this.invoke<UserProfile | null>('get-profile');
  }

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return this.invoke<UserProfile>('update-profile', input);
  }

  // ===== Preferences Methods =====

  async getPreferences(): Promise<UserPreferences> {
    return this.invoke<UserPreferences>('get-preferences');
  }

  async updatePreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
    return this.invoke<UserPreferences>('update-preferences', input);
  }

  // ===== Account Operations =====

  async deleteAccount(): Promise<void> {
    return this.invoke<void>('delete-account');
  }

  async exportData(options: ExportDataOptions): Promise<ExportDataResult> {
    return this.invoke<ExportDataResult>('export-data', options);
  }

  // ===== Event Subscriptions =====

  onProfileUpdated(callback: (profile: UserProfile) => void): () => void {
    return this.on('profile-updated', callback);
  }

  onPreferencesChanged(callback: (preferences: UserPreferences) => void): () => void {
    return this.on('preferences-changed', callback);
  }

  onAccountDeleted(callback: () => void): () => void {
    return this.on('deleted', callback);
  }
}

export const accountIPCClient = new AccountIPCClientImpl();
```

### 索引文件
```typescript
// renderer/modules/account/infrastructure/ipc/index.ts
export { accountIPCClient, type AccountIPCClient } from './accountIPCClient';
export type {
  UserProfile,
  UserPreferences,
  UpdateProfileInput,
  UpdatePreferencesInput,
  ExportDataOptions,
  ExportDataResult,
} from './accountIPCClient';
```

### 单元测试
```typescript
// renderer/modules/account/infrastructure/ipc/__tests__/accountIPCClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountIPCClient } from '../accountIPCClient';

const mockIpcRenderer = {
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

vi.stubGlobal('window', {
  electron: {
    ipcRenderer: mockIpcRenderer,
  },
});

describe('AccountIPCClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should call correct IPC channel', async () => {
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

      mockIpcRenderer.invoke.mockResolvedValue(mockProfile);

      const result = await accountIPCClient.getProfile();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('account:get-profile');
      expect(result).toEqual(mockProfile);
    });

    it('should return null if no profile exists', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(null);

      const result = await accountIPCClient.getProfile();

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should call with correct parameters', async () => {
      const input = { displayName: 'New Name' };
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

      mockIpcRenderer.invoke.mockResolvedValue(updatedProfile);

      const result = await accountIPCClient.updateProfile(input);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'account:update-profile',
        input
      );
      expect(result.displayName).toBe('New Name');
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
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

      mockIpcRenderer.invoke.mockResolvedValue(mockPrefs);

      const result = await accountIPCClient.getPreferences();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('account:get-preferences');
      expect(result.theme).toBe('dark');
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences', async () => {
      const input = { theme: 'dark' as const, startOnBoot: true };
      const updatedPrefs = { ...input };

      mockIpcRenderer.invoke.mockResolvedValue(updatedPrefs);

      const result = await accountIPCClient.updatePreferences(input);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'account:update-preferences',
        input
      );
      expect(result.theme).toBe('dark');
    });
  });

  describe('deleteAccount', () => {
    it('should call delete account IPC', async () => {
      mockIpcRenderer.invoke.mockResolvedValue(undefined);

      await accountIPCClient.deleteAccount();

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('account:delete-account');
    });
  });

  describe('exportData', () => {
    it('should export data with options', async () => {
      const options = { format: 'json' as const, modules: ['tasks', 'goals'] };
      const result = {
        filePath: '/downloads/export.json',
        format: 'json' as const,
        includedModules: ['tasks', 'goals'],
        exportedAt: new Date(),
      };

      mockIpcRenderer.invoke.mockResolvedValue(result);

      const exportResult = await accountIPCClient.exportData(options);

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(
        'account:export-data',
        options
      );
      expect(exportResult.filePath).toBe('/downloads/export.json');
    });
  });

  describe('Event subscriptions', () => {
    it('should subscribe to profile updated event', () => {
      const callback = vi.fn();
      mockIpcRenderer.on.mockImplementation((_, cb) => cb);

      accountIPCClient.onProfileUpdated(callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith(
        'account:profile-updated',
        expect.any(Function)
      );
    });

    it('should subscribe to preferences changed event', () => {
      const callback = vi.fn();
      mockIpcRenderer.on.mockImplementation((_, cb) => cb);

      accountIPCClient.onPreferencesChanged(callback);

      expect(mockIpcRenderer.on).toHaveBeenCalledWith(
        'account:preferences-changed',
        expect.any(Function)
      );
    });

    it('should unsubscribe from events', () => {
      const callback = vi.fn();
      mockIpcRenderer.on.mockReturnValue(callback);

      const unsubscribe = accountIPCClient.onProfileUpdated(callback);
      unsubscribe();

      expect(mockIpcRenderer.removeListener).toHaveBeenCalled();
    });
  });
});
```

## 验收标准

- [ ] 所有 IPC 方法正确调用
- [ ] Profile 操作正常
- [ ] Preferences 操作正常
- [ ] 数据导出功能正常
- [ ] 事件订阅和取消正常
- [ ] 单元测试覆盖率 > 80%
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/account/infrastructure/ipc/accountIPCClient.ts`
- `renderer/modules/account/infrastructure/ipc/index.ts`
- `renderer/modules/account/infrastructure/ipc/__tests__/accountIPCClient.test.ts`
