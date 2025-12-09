# STORY-011: Setting 模块重构

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 4  
> **预估**: 4 小时  
> **优先级**: P2  
> **依赖**: STORY-001

---

## 📋 概述

Setting 模块已有基本实现，但未遵循模块化架构。
需要重构为符合 DDD 模式的实现。

---

## 🎯 目标

1. 将现有 setting.ipc-handlers.ts 重构为模块化架构
2. 使用 SettingDesktopApplicationService 封装业务逻辑
3. 支持设置分类管理和类型安全

---

## ✅ 验收标准 (AC)

### AC-1: 设置 CRUD
```gherkin
Given Setting IPC channels
When 调用以下 channels:
  - setting:get-all
  - setting:get
  - setting:set
  - setting:update
  - setting:reset
Then 应正确管理应用设置
```

### AC-2: 分类设置
```gherkin
Given 设置分类
When 调用 setting:get-category (category: 'theme' | 'notifications' | 'general' | 'shortcuts')
Then 应返回该分类下的所有设置
```

### AC-3: 设置变更通知
```gherkin
Given 设置发生变化
When 任何设置被修改
Then 应通过 eventBus 发出 setting.changed 事件
And 相关模块应能响应设置变更
```

---

## 📁 任务清单

### Task 11.1: 创建 SettingDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/setting/application/SettingDesktopApplicationService.ts`

```typescript
/**
 * Setting Desktop Application Service
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, eventBus } from '@dailyuse/utils';

const logger = createLogger('SettingDesktopAppService');

// 设置类型定义
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  general: {
    autoStart: boolean;
    minimizeToTray: boolean;
    startMinimized: boolean;
    checkUpdates: boolean;
  };
  shortcuts: {
    global: Record<string, string>;
    app: Record<string, string>;
  };
  sync: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number;
  };
  ai: {
    provider: string;
    apiKey?: string;
    maxTokens: number;
  };
}

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'zh-CN',
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  },
  general: {
    autoStart: false,
    minimizeToTray: true,
    startMinimized: false,
    checkUpdates: true,
  },
  shortcuts: {
    global: {
      'toggle-window': 'CommandOrControl+Shift+D',
      'quick-add-task': 'CommandOrControl+Shift+T',
    },
    app: {
      'new-task': 'CommandOrControl+N',
      'search': 'CommandOrControl+K',
    },
  },
  sync: {
    enabled: false,
    autoSync: false,
    syncInterval: 300000, // 5 minutes
  },
  ai: {
    provider: 'openai',
    maxTokens: 4096,
  },
};

export class SettingDesktopApplicationService {
  private settings: AppSettings;
  private readonly settingsPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const loaded = JSON.parse(data);
        // 深度合并默认设置
        return this.deepMerge(defaultSettings, loaded);
      }
    } catch (error) {
      logger.error('Failed to load settings', error);
    }
    return { ...defaultSettings };
  }

  private saveSettings(): boolean {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      return true;
    } catch (error) {
      logger.error('Failed to save settings', error);
      return false;
    }
  }

  private deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      const sourceValue = source[key as keyof T];
      const targetValue = target[key as keyof T];
      
      if (
        sourceValue && 
        typeof sourceValue === 'object' && 
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = this.deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
    return result;
  }

  // ===== Get =====

  getAll(): AppSettings {
    return { ...this.settings };
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  getCategory(category: keyof AppSettings): unknown {
    return this.settings[category];
  }

  // ===== Set =====

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): boolean {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    const success = this.saveSettings();
    if (success) {
      this.emitChange(key, value, oldValue);
    }
    return success;
  }

  update(updates: Partial<AppSettings>): boolean {
    const oldSettings = { ...this.settings };
    this.settings = this.deepMerge(this.settings, updates);
    
    const success = this.saveSettings();
    if (success) {
      // 发送所有变更
      for (const key of Object.keys(updates) as (keyof AppSettings)[]) {
        this.emitChange(key, this.settings[key], oldSettings[key]);
      }
    }
    return success;
  }

  // ===== Reset =====

  reset(key?: keyof AppSettings): boolean {
    if (key) {
      this.settings[key] = defaultSettings[key];
    } else {
      this.settings = { ...defaultSettings };
    }
    
    const success = this.saveSettings();
    if (success) {
      eventBus.emit('setting.reset', { key });
    }
    return success;
  }

  // ===== Event =====

  private emitChange<K extends keyof AppSettings>(
    key: K,
    newValue: AppSettings[K],
    oldValue: AppSettings[K]
  ): void {
    eventBus.emit('setting.changed', {
      key,
      newValue,
      oldValue,
    });

    // 特定设置变更事件
    switch (key) {
      case 'theme':
        eventBus.emit('setting.theme.changed', { theme: newValue });
        break;
      case 'language':
        eventBus.emit('setting.language.changed', { language: newValue });
        break;
      case 'notifications':
        eventBus.emit('setting.notifications.changed', newValue);
        break;
    }
  }

  // ===== Shortcuts =====

  getShortcuts(): AppSettings['shortcuts'] {
    return this.settings.shortcuts;
  }

  setShortcut(type: 'global' | 'app', action: string, shortcut: string): boolean {
    this.settings.shortcuts[type][action] = shortcut;
    return this.saveSettings();
  }

  removeShortcut(type: 'global' | 'app', action: string): boolean {
    delete this.settings.shortcuts[type][action];
    return this.saveSettings();
  }

  // ===== Validation =====

  validateSetting<K extends keyof AppSettings>(key: K, value: unknown): {
    valid: boolean;
    error?: string;
  } {
    // 基本类型验证
    switch (key) {
      case 'theme':
        if (!['light', 'dark', 'system'].includes(value as string)) {
          return { valid: false, error: 'Invalid theme value' };
        }
        break;
      case 'language':
        if (typeof value !== 'string' || value.length < 2) {
          return { valid: false, error: 'Invalid language code' };
        }
        break;
    }
    return { valid: true };
  }
}
```

### Task 11.2: 创建 Setting IPC Handlers

**文件**: `apps/desktop/src/main/modules/setting/ipc/setting.ipc-handlers.ts`

```typescript
/**
 * Setting IPC Handlers
 */

import { ipcMain } from 'electron';
import { SettingDesktopApplicationService, AppSettings } from '../application/SettingDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingIPC');

let appService: SettingDesktopApplicationService | null = null;

function getAppService(): SettingDesktopApplicationService {
  if (!appService) {
    appService = new SettingDesktopApplicationService();
  }
  return appService;
}

export function registerSettingIpcHandlers(): void {
  ipcMain.handle('setting:get-all', async () => {
    return getAppService().getAll();
  });

  ipcMain.handle('setting:get', async (_, key: keyof AppSettings) => {
    return getAppService().get(key);
  });

  ipcMain.handle('setting:get-category', async (_, category: keyof AppSettings) => {
    return getAppService().getCategory(category);
  });

  ipcMain.handle('setting:set', async (_, key: keyof AppSettings, value: unknown) => {
    const validation = getAppService().validateSetting(key, value);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const success = getAppService().set(key, value as AppSettings[typeof key]);
    return { success };
  });

  ipcMain.handle('setting:update', async (_, updates: Partial<AppSettings>) => {
    const success = getAppService().update(updates);
    return { success };
  });

  ipcMain.handle('setting:reset', async (_, key?: keyof AppSettings) => {
    const success = getAppService().reset(key);
    return { success };
  });

  // Shortcuts
  ipcMain.handle('setting:shortcuts:get', async () => {
    return getAppService().getShortcuts();
  });

  ipcMain.handle('setting:shortcuts:set', async (_, type, action, shortcut) => {
    const success = getAppService().setShortcut(type, action, shortcut);
    return { success };
  });

  ipcMain.handle('setting:shortcuts:remove', async (_, type, action) => {
    const success = getAppService().removeShortcut(type, action);
    return { success };
  });

  logger.info('Setting IPC handlers registered');
}
```

### Task 11.3: 创建模块入口

**文件**: `apps/desktop/src/main/modules/setting/index.ts`

```typescript
/**
 * Setting Module - Desktop Main Process
 */

import { registerSettingIpcHandlers } from './ipc/setting.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('SettingModule');

export function registerSettingModule(): void {
  InitializationManager.getInstance().registerModule(
    'setting',
    InitializationPhase.CORE_SERVICES, // 设置是核心服务，其他模块可能依赖它
    async () => {
      registerSettingIpcHandlers();
      logger.info('Setting module initialized');
    }
  );
}

export { SettingDesktopApplicationService, AppSettings } from './application/SettingDesktopApplicationService';
```

### Task 11.4: 删除旧的 setting.ipc-handlers.ts

完成后删除 `apps/desktop/src/main/ipc/setting.ipc-handlers.ts`

---

## 📚 技术上下文

### 现有实现

现有 `setting.ipc-handlers.ts` 已有基本功能：
- 读写 settings.json
- 默认设置
- 基本 CRUD

### 重构要点

- 将逻辑移到 ApplicationService
- 添加类型安全
- 添加设置验证
- 添加 eventBus 通知

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施)
- **被依赖**: 
  - STORY-006 (Notification 需要通知设置)
  - STORY-008 (AI 需要 AI 设置)

---

## 📝 备注

- 设置变更应通过 eventBus 通知其他模块
- 考虑添加设置迁移机制（版本升级时）
- 敏感设置（如 API Key）考虑加密存储
