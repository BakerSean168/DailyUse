# Story 13.29: Account 模块 Main Process IPC Handler

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.29 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.03 (Main Process 初始化) |
| 关联模块 | Account |

## 目标

在 Main Process 中实现 Account 模块的 IPC Handler，处理用户账户相关操作。

## 任务列表

### 1. 创建 accountHandler (2h)
- [ ] 定义 Account IPC channels
- [ ] 实现用户信息查询
  - `account:get-profile`
  - `account:update-profile`
  - `account:get-preferences`
  - `account:update-preferences`
- [ ] 实现账户操作
  - `account:delete-account`
  - `account:export-data`

### 2. 实现数据存储 (1h)
- [ ] Profile 数据 CRUD
- [ ] Preferences 数据 CRUD
- [ ] 数据加密存储

### 3. 实现事件发布 (0.5h)
- [ ] `account:profile-updated` 事件
- [ ] `account:preferences-changed` 事件

### 4. 单元测试 (0.5h)
- [ ] Handler 测试
- [ ] 数据操作测试

## 技术规范

### Account IPC Handler
```typescript
// main/modules/account/accountHandler.ts
import { ipcMain, BrowserWindow } from 'electron';
import { db } from '../../database';
import { encryptData, decryptData } from '../../utils/crypto';

// Types
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
  weekStartsOn: 0 | 1 | 6; // Sunday, Monday, Saturday
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

export interface ExportDataResult {
  filePath: string;
  format: 'json' | 'csv';
  includedModules: string[];
  exportedAt: Date;
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  startOnBoot: false,
  minimizeToTray: true,
  showInMenuBar: true,
  notificationSound: true,
  dailyDigestTime: '09:00',
  weekStartsOn: 1,
  defaultView: 'today',
  taskDefaultPriority: 2,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroLongBreakMinutes: 15,
  pomodoroSessionsBeforeLongBreak: 4,
};

class AccountHandler {
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  register() {
    // Profile handlers
    ipcMain.handle('account:get-profile', async () => {
      return this.getProfile();
    });

    ipcMain.handle('account:update-profile', async (_, input: UpdateProfileInput) => {
      return this.updateProfile(input);
    });

    // Preferences handlers
    ipcMain.handle('account:get-preferences', async () => {
      return this.getPreferences();
    });

    ipcMain.handle('account:update-preferences', async (_, input: UpdatePreferencesInput) => {
      return this.updatePreferences(input);
    });

    // Account operations
    ipcMain.handle('account:delete-account', async () => {
      return this.deleteAccount();
    });

    ipcMain.handle('account:export-data', async (_, options: { format: 'json' | 'csv'; modules?: string[] }) => {
      return this.exportData(options);
    });

    console.log('[AccountHandler] Registered');
  }

  // ===== Profile Methods =====

  private async getProfile(): Promise<UserProfile | null> {
    const profile = await db.userProfile.findFirst();
    return profile;
  }

  private async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const existingProfile = await this.getProfile();
    
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    const updated = await db.userProfile.update({
      where: { uuid: existingProfile.uuid },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    });

    // Notify renderer
    this.emitEvent('account:profile-updated', updated);

    return updated;
  }

  // ===== Preferences Methods =====

  private async getPreferences(): Promise<UserPreferences> {
    const prefs = await db.userPreferences.findFirst();
    
    if (!prefs) {
      // Return defaults if not set
      return DEFAULT_PREFERENCES;
    }

    // Decrypt sensitive data if needed
    const decrypted = prefs.encryptedData
      ? JSON.parse(decryptData(prefs.encryptedData))
      : {};

    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      ...decrypted,
    };
  }

  private async updatePreferences(input: UpdatePreferencesInput): Promise<UserPreferences> {
    const existingPrefs = await db.userPreferences.findFirst();
    
    // Separate sensitive fields for encryption
    const sensitiveFields = ['apiKeys', 'credentials'];
    const sensitiveData: Record<string, unknown> = {};
    const regularData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (sensitiveFields.includes(key)) {
        sensitiveData[key] = value;
      } else {
        regularData[key] = value;
      }
    }

    const updateData: Record<string, unknown> = {
      ...regularData,
      updatedAt: new Date(),
    };

    if (Object.keys(sensitiveData).length > 0) {
      updateData.encryptedData = encryptData(JSON.stringify(sensitiveData));
    }

    let updated;
    if (existingPrefs) {
      updated = await db.userPreferences.update({
        where: { id: existingPrefs.id },
        data: updateData,
      });
    } else {
      updated = await db.userPreferences.create({
        data: updateData,
      });
    }

    // Apply system preferences
    await this.applySystemPreferences(input);

    // Notify renderer
    this.emitEvent('account:preferences-changed', await this.getPreferences());

    return this.getPreferences();
  }

  private async applySystemPreferences(prefs: Partial<UserPreferences>) {
    const { app } = await import('electron');

    // Start on boot
    if (prefs.startOnBoot !== undefined) {
      app.setLoginItemSettings({
        openAtLogin: prefs.startOnBoot,
        openAsHidden: true,
      });
    }

    // Other system-level preferences would be applied here
  }

  // ===== Account Operations =====

  private async deleteAccount(): Promise<void> {
    // Delete all user data
    await db.$transaction([
      db.task.deleteMany(),
      db.goal.deleteMany(),
      db.schedule.deleteMany(),
      db.reminder.deleteMany(),
      db.document.deleteMany(),
      db.userPreferences.deleteMany(),
      db.userProfile.deleteMany(),
    ]);

    // Clear any cached data
    // Reset app state

    this.emitEvent('account:deleted', null);
  }

  private async exportData(options: {
    format: 'json' | 'csv';
    modules?: string[];
  }): Promise<ExportDataResult> {
    const { dialog, app } = await import('electron');
    const path = await import('path');
    const fs = await import('fs/promises');

    const modules = options.modules || [
      'tasks',
      'goals',
      'schedules',
      'reminders',
      'documents',
      'preferences',
    ];

    // Collect data from each module
    const exportData: Record<string, unknown[]> = {};

    for (const module of modules) {
      switch (module) {
        case 'tasks':
          exportData.tasks = await db.task.findMany();
          break;
        case 'goals':
          exportData.goals = await db.goal.findMany();
          break;
        case 'schedules':
          exportData.schedules = await db.schedule.findMany();
          break;
        case 'reminders':
          exportData.reminders = await db.reminder.findMany();
          break;
        case 'documents':
          exportData.documents = await db.document.findMany();
          break;
        case 'preferences':
          const prefs = await this.getPreferences();
          exportData.preferences = [prefs];
          break;
      }
    }

    // Choose save location
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(
      app.getPath('downloads'),
      `dailyuse-export-${timestamp}.${options.format}`
    );

    const { filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        options.format === 'json'
          ? { name: 'JSON', extensions: ['json'] }
          : { name: 'CSV', extensions: ['csv'] },
      ],
    });

    if (!filePath) {
      throw new Error('Export cancelled');
    }

    // Write data
    if (options.format === 'json') {
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    } else {
      // Convert to CSV format
      const csvContent = this.convertToCSV(exportData);
      await fs.writeFile(filePath, csvContent);
    }

    return {
      filePath,
      format: options.format,
      includedModules: modules,
      exportedAt: new Date(),
    };
  }

  private convertToCSV(data: Record<string, unknown[]>): string {
    const sections: string[] = [];

    for (const [module, items] of Object.entries(data)) {
      if (items.length === 0) continue;

      // Header
      const headers = Object.keys(items[0] as object);
      sections.push(`# ${module.toUpperCase()}`);
      sections.push(headers.join(','));

      // Rows
      for (const item of items) {
        const values = headers.map((h) => {
          const val = (item as Record<string, unknown>)[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return String(val);
        });
        sections.push(values.join(','));
      }

      sections.push('');
    }

    return sections.join('\n');
  }

  // ===== Event Emission =====

  private emitEvent(channel: string, data: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

export const accountHandler = new AccountHandler();
```

### Handler 注册
```typescript
// main/modules/account/index.ts
export { accountHandler } from './accountHandler';
export type {
  UserProfile,
  UserPreferences,
  UpdateProfileInput,
  UpdatePreferencesInput,
  ExportDataResult,
} from './accountHandler';
```

### 单元测试
```typescript
// main/modules/account/__tests__/accountHandler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountHandler } from '../accountHandler';
import { db } from '../../../database';

vi.mock('../../../database');
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  app: {
    setLoginItemSettings: vi.fn(),
    getPath: vi.fn(() => '/downloads'),
  },
  dialog: {
    showSaveDialog: vi.fn(() => ({ filePath: '/test/export.json' })),
  },
}));

describe('AccountHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
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

      vi.mocked(db.userProfile.findFirst).mockResolvedValue(mockProfile);

      // Access private method through handler
      const result = await (accountHandler as any).getProfile();

      expect(result).toEqual(mockProfile);
    });

    it('should return null if no profile exists', async () => {
      vi.mocked(db.userProfile.findFirst).mockResolvedValue(null);

      const result = await (accountHandler as any).getProfile();

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile and emit event', async () => {
      const existingProfile = {
        uuid: 'user-uuid',
        email: 'test@example.com',
        displayName: 'Old Name',
        avatarUrl: null,
        timezone: 'Asia/Shanghai',
        language: 'zh-CN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProfile = {
        ...existingProfile,
        displayName: 'New Name',
      };

      vi.mocked(db.userProfile.findFirst).mockResolvedValue(existingProfile);
      vi.mocked(db.userProfile.update).mockResolvedValue(updatedProfile);

      const result = await (accountHandler as any).updateProfile({
        displayName: 'New Name',
      });

      expect(result.displayName).toBe('New Name');
      expect(db.userProfile.update).toHaveBeenCalled();
    });

    it('should throw error if profile not found', async () => {
      vi.mocked(db.userProfile.findFirst).mockResolvedValue(null);

      await expect(
        (accountHandler as any).updateProfile({ displayName: 'Test' })
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('getPreferences', () => {
    it('should return default preferences if none exist', async () => {
      vi.mocked(db.userPreferences.findFirst).mockResolvedValue(null);

      const result = await (accountHandler as any).getPreferences();

      expect(result.theme).toBe('system');
      expect(result.startOnBoot).toBe(false);
      expect(result.pomodoroWorkMinutes).toBe(25);
    });

    it('should merge stored preferences with defaults', async () => {
      const storedPrefs = {
        id: 1,
        theme: 'dark',
        startOnBoot: true,
        encryptedData: null,
      };

      vi.mocked(db.userPreferences.findFirst).mockResolvedValue(storedPrefs);

      const result = await (accountHandler as any).getPreferences();

      expect(result.theme).toBe('dark');
      expect(result.startOnBoot).toBe(true);
      expect(result.pomodoroWorkMinutes).toBe(25); // from defaults
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences and apply system settings', async () => {
      const existingPrefs = { id: 1, theme: 'light' };

      vi.mocked(db.userPreferences.findFirst).mockResolvedValue(existingPrefs);
      vi.mocked(db.userPreferences.update).mockResolvedValue({
        ...existingPrefs,
        theme: 'dark',
        startOnBoot: true,
      });

      await (accountHandler as any).updatePreferences({
        theme: 'dark',
        startOnBoot: true,
      });

      expect(db.userPreferences.update).toHaveBeenCalled();
    });
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      vi.mocked(db.task.findMany).mockResolvedValue([
        { uuid: 'task-1', title: 'Test Task' },
      ]);
      vi.mocked(db.goal.findMany).mockResolvedValue([]);

      const result = await (accountHandler as any).exportData({
        format: 'json',
        modules: ['tasks', 'goals'],
      });

      expect(result.format).toBe('json');
      expect(result.includedModules).toContain('tasks');
      expect(result.filePath).toBe('/test/export.json');
    });
  });
});
```

## 验收标准

- [ ] Profile 查询和更新正常
- [ ] Preferences 查询和更新正常
- [ ] 敏感数据加密存储
- [ ] 系统级偏好设置应用（开机启动等）
- [ ] 数据导出功能正常
- [ ] 事件发布正常
- [ ] 单元测试覆盖率 > 80%
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/account/accountHandler.ts`
- `main/modules/account/index.ts`
- `main/modules/account/__tests__/accountHandler.test.ts`
