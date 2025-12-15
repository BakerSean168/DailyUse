# Story 13.48: Platform 模块 - 全局快捷键

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.48 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 6: 平台集成 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | Platform |

## 目标

实现全局快捷键功能，支持注册、管理和自定义快捷键。

## 任务列表

### 1. 创建 Shortcuts Handler (2h)
- [ ] ShortcutsHandler 类
- [ ] 快捷键注册/注销
- [ ] 默认快捷键配置

### 2. 创建 Shortcuts IPC Client (1h)
- [ ] ShortcutsIPCClient
- [ ] useShortcuts hook

### 3. 创建快捷键设置 UI (2h)
- [ ] ShortcutsList 组件
- [ ] ShortcutEditor 组件
- [ ] 快捷键记录器

## 技术规范

### Shortcuts Handler
```typescript
// main/modules/platform/shortcuts-handler.ts
import { ipcMain, globalShortcut, BrowserWindow, app } from 'electron';
import { db } from '@/infrastructure/database';
import { logger } from '@/infrastructure/logger';

export interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  accelerator: string; // e.g., "CommandOrControl+Shift+P"
  action: string; // Action identifier
  enabled: boolean;
  isDefault: boolean;
}

const defaultShortcuts: Omit<ShortcutConfig, 'id'>[] = [
  {
    name: '显示/隐藏窗口',
    description: '快速显示或隐藏应用窗口',
    accelerator: 'CommandOrControl+Shift+D',
    action: 'app:toggle-window',
    enabled: true,
    isDefault: true,
  },
  {
    name: '快速添加任务',
    description: '打开快速添加任务窗口',
    accelerator: 'CommandOrControl+Shift+T',
    action: 'task:quick-add',
    enabled: true,
    isDefault: true,
  },
  {
    name: '开始/暂停专注',
    description: '快速开始或暂停专注计时',
    accelerator: 'CommandOrControl+Shift+F',
    action: 'focus:toggle',
    enabled: true,
    isDefault: true,
  },
  {
    name: '打开搜索',
    description: '打开全局搜索',
    accelerator: 'CommandOrControl+Shift+Space',
    action: 'app:search',
    enabled: true,
    isDefault: true,
  },
  {
    name: '打开设置',
    description: '打开应用设置',
    accelerator: 'CommandOrControl+,',
    action: 'app:settings',
    enabled: true,
    isDefault: true,
  },
];

class ShortcutsHandler {
  private mainWindow: BrowserWindow | null = null;
  private registeredShortcuts: Map<string, ShortcutConfig> = new Map();
  private shortcuts: ShortcutConfig[] = [];

  register(): void {
    ipcMain.handle('shortcuts:get-all', this.getAllShortcuts.bind(this));
    ipcMain.handle('shortcuts:get', this.getShortcut.bind(this));
    ipcMain.handle('shortcuts:update', this.updateShortcut.bind(this));
    ipcMain.handle('shortcuts:reset', this.resetShortcut.bind(this));
    ipcMain.handle('shortcuts:reset-all', this.resetAllShortcuts.bind(this));
    ipcMain.handle('shortcuts:enable', this.enableShortcut.bind(this));
    ipcMain.handle('shortcuts:disable', this.disableShortcut.bind(this));
    ipcMain.handle('shortcuts:validate', this.validateAccelerator.bind(this));

    logger.info('[ShortcutsHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async initialize(): Promise<void> {
    // Load shortcuts from database
    const savedShortcuts = await db.shortcut.findMany();

    if (savedShortcuts.length === 0) {
      // Initialize with defaults
      for (const shortcut of defaultShortcuts) {
        const saved = await db.shortcut.create({
          data: shortcut,
        });
        this.shortcuts.push(saved);
      }
    } else {
      this.shortcuts = savedShortcuts;
    }

    // Register all enabled shortcuts
    for (const shortcut of this.shortcuts) {
      if (shortcut.enabled) {
        this.registerShortcut(shortcut);
      }
    }

    logger.info('[ShortcutsHandler] Initialized with', this.shortcuts.length, 'shortcuts');
  }

  private registerShortcut(shortcut: ShortcutConfig): boolean {
    try {
      const success = globalShortcut.register(shortcut.accelerator, () => {
        this.handleShortcutAction(shortcut.action);
      });

      if (success) {
        this.registeredShortcuts.set(shortcut.id, shortcut);
        logger.info(`[ShortcutsHandler] Registered: ${shortcut.accelerator} -> ${shortcut.action}`);
      } else {
        logger.warn(`[ShortcutsHandler] Failed to register: ${shortcut.accelerator}`);
      }

      return success;
    } catch (error) {
      logger.error(`[ShortcutsHandler] Error registering shortcut:`, error);
      return false;
    }
  }

  private unregisterShortcut(accelerator: string): void {
    try {
      globalShortcut.unregister(accelerator);
      logger.info(`[ShortcutsHandler] Unregistered: ${accelerator}`);
    } catch (error) {
      logger.error(`[ShortcutsHandler] Error unregistering shortcut:`, error);
    }
  }

  private handleShortcutAction(action: string): void {
    switch (action) {
      case 'app:toggle-window':
        if (this.mainWindow) {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide();
          } else {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
        break;

      case 'task:quick-add':
        this.mainWindow?.show();
        this.mainWindow?.focus();
        this.mainWindow?.webContents.send('shortcut:action', { action });
        break;

      case 'focus:toggle':
        this.mainWindow?.webContents.send('shortcut:action', { action });
        break;

      case 'app:search':
        this.mainWindow?.show();
        this.mainWindow?.focus();
        this.mainWindow?.webContents.send('shortcut:action', { action });
        break;

      case 'app:settings':
        this.mainWindow?.show();
        this.mainWindow?.focus();
        this.mainWindow?.webContents.send('shortcut:action', { action });
        break;

      default:
        this.mainWindow?.webContents.send('shortcut:action', { action });
    }
  }

  // IPC Handlers
  private async getAllShortcuts(): Promise<ShortcutConfig[]> {
    return this.shortcuts;
  }

  private async getShortcut(
    _: Electron.IpcMainInvokeEvent,
    shortcutId: string
  ): Promise<ShortcutConfig | null> {
    return this.shortcuts.find((s) => s.id === shortcutId) || null;
  }

  private async updateShortcut(
    _: Electron.IpcMainInvokeEvent,
    shortcutId: string,
    accelerator: string
  ): Promise<ShortcutConfig> {
    const shortcut = this.shortcuts.find((s) => s.id === shortcutId);
    if (!shortcut) {
      throw new Error('Shortcut not found');
    }

    // Validate new accelerator
    const validation = this.validateAcceleratorSync(accelerator);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check for conflicts
    const conflict = this.shortcuts.find(
      (s) => s.id !== shortcutId && s.accelerator === accelerator && s.enabled
    );
    if (conflict) {
      throw new Error(`快捷键已被 "${conflict.name}" 使用`);
    }

    // Unregister old shortcut
    if (shortcut.enabled) {
      this.unregisterShortcut(shortcut.accelerator);
    }

    // Update shortcut
    shortcut.accelerator = accelerator;
    shortcut.isDefault = false;

    await db.shortcut.update({
      where: { id: shortcutId },
      data: { accelerator, isDefault: false },
    });

    // Register new shortcut
    if (shortcut.enabled) {
      this.registerShortcut(shortcut);
    }

    return shortcut;
  }

  private async resetShortcut(
    _: Electron.IpcMainInvokeEvent,
    shortcutId: string
  ): Promise<ShortcutConfig> {
    const shortcut = this.shortcuts.find((s) => s.id === shortcutId);
    if (!shortcut) {
      throw new Error('Shortcut not found');
    }

    const defaultShortcut = defaultShortcuts.find((d) => d.action === shortcut.action);
    if (!defaultShortcut) {
      throw new Error('No default shortcut available');
    }

    // Unregister current
    if (shortcut.enabled) {
      this.unregisterShortcut(shortcut.accelerator);
    }

    // Reset to default
    shortcut.accelerator = defaultShortcut.accelerator;
    shortcut.isDefault = true;

    await db.shortcut.update({
      where: { id: shortcutId },
      data: {
        accelerator: defaultShortcut.accelerator,
        isDefault: true,
      },
    });

    // Register default
    if (shortcut.enabled) {
      this.registerShortcut(shortcut);
    }

    return shortcut;
  }

  private async resetAllShortcuts(): Promise<ShortcutConfig[]> {
    // Unregister all
    for (const shortcut of this.shortcuts) {
      if (shortcut.enabled) {
        this.unregisterShortcut(shortcut.accelerator);
      }
    }

    // Reset all to defaults
    for (const shortcut of this.shortcuts) {
      const defaultShortcut = defaultShortcuts.find((d) => d.action === shortcut.action);
      if (defaultShortcut) {
        shortcut.accelerator = defaultShortcut.accelerator;
        shortcut.enabled = defaultShortcut.enabled;
        shortcut.isDefault = true;

        await db.shortcut.update({
          where: { id: shortcut.id },
          data: {
            accelerator: defaultShortcut.accelerator,
            enabled: defaultShortcut.enabled,
            isDefault: true,
          },
        });

        if (shortcut.enabled) {
          this.registerShortcut(shortcut);
        }
      }
    }

    return this.shortcuts;
  }

  private async enableShortcut(
    _: Electron.IpcMainInvokeEvent,
    shortcutId: string
  ): Promise<ShortcutConfig> {
    const shortcut = this.shortcuts.find((s) => s.id === shortcutId);
    if (!shortcut) {
      throw new Error('Shortcut not found');
    }

    if (!shortcut.enabled) {
      const success = this.registerShortcut(shortcut);
      if (success) {
        shortcut.enabled = true;
        await db.shortcut.update({
          where: { id: shortcutId },
          data: { enabled: true },
        });
      }
    }

    return shortcut;
  }

  private async disableShortcut(
    _: Electron.IpcMainInvokeEvent,
    shortcutId: string
  ): Promise<ShortcutConfig> {
    const shortcut = this.shortcuts.find((s) => s.id === shortcutId);
    if (!shortcut) {
      throw new Error('Shortcut not found');
    }

    if (shortcut.enabled) {
      this.unregisterShortcut(shortcut.accelerator);
      shortcut.enabled = false;
      this.registeredShortcuts.delete(shortcut.id);

      await db.shortcut.update({
        where: { id: shortcutId },
        data: { enabled: false },
      });
    }

    return shortcut;
  }

  private async validateAccelerator(
    _: Electron.IpcMainInvokeEvent,
    accelerator: string
  ): Promise<{ valid: boolean; error?: string }> {
    return this.validateAcceleratorSync(accelerator);
  }

  private validateAcceleratorSync(accelerator: string): { valid: boolean; error?: string } {
    // Basic validation
    if (!accelerator || accelerator.trim() === '') {
      return { valid: false, error: '快捷键不能为空' };
    }

    // Check for required modifier
    const hasModifier = /^(Command|Cmd|Control|Ctrl|CommandOrControl|CmdOrCtrl|Alt|Option|AltGr|Shift|Super|Meta)/i.test(accelerator);
    if (!hasModifier) {
      return { valid: false, error: '快捷键必须包含修饰键 (Ctrl, Alt, Shift 等)' };
    }

    // Try to register and unregister to validate
    try {
      const isRegistered = globalShortcut.isRegistered(accelerator);
      if (isRegistered) {
        // It's already registered by us, that's fine for validation
        return { valid: true };
      }

      // Try to register
      const success = globalShortcut.register(accelerator, () => {});
      if (success) {
        globalShortcut.unregister(accelerator);
        return { valid: true };
      } else {
        return { valid: false, error: '快捷键可能已被其他应用占用' };
      }
    } catch (error) {
      return { valid: false, error: '无效的快捷键格式' };
    }
  }

  // Cleanup on app quit
  cleanup(): void {
    globalShortcut.unregisterAll();
  }
}

export const shortcutsHandler = new ShortcutsHandler();

// Cleanup on app quit
app.on('will-quit', () => {
  shortcutsHandler.cleanup();
});
```

### Shortcuts IPC Client
```typescript
// renderer/modules/platform/infrastructure/ipc/shortcuts-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';

export interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  accelerator: string;
  action: string;
  enabled: boolean;
  isDefault: boolean;
}

class ShortcutsIPCClient extends BaseIPCClient {
  constructor() {
    super('shortcuts');
  }

  async getAll(): Promise<ShortcutConfig[]> {
    return this.invoke<ShortcutConfig[]>('get-all');
  }

  async get(shortcutId: string): Promise<ShortcutConfig | null> {
    return this.invoke<ShortcutConfig | null>('get', shortcutId);
  }

  async update(shortcutId: string, accelerator: string): Promise<ShortcutConfig> {
    return this.invoke<ShortcutConfig>('update', shortcutId, accelerator);
  }

  async reset(shortcutId: string): Promise<ShortcutConfig> {
    return this.invoke<ShortcutConfig>('reset', shortcutId);
  }

  async resetAll(): Promise<ShortcutConfig[]> {
    return this.invoke<ShortcutConfig[]>('reset-all');
  }

  async enable(shortcutId: string): Promise<ShortcutConfig> {
    return this.invoke<ShortcutConfig>('enable', shortcutId);
  }

  async disable(shortcutId: string): Promise<ShortcutConfig> {
    return this.invoke<ShortcutConfig>('disable', shortcutId);
  }

  async validate(accelerator: string): Promise<{ valid: boolean; error?: string }> {
    return this.invoke<{ valid: boolean; error?: string }>('validate', accelerator);
  }

  onAction(callback: (data: { action: string }) => void): () => void {
    return this.on('action', callback);
  }
}

export const shortcutsIPCClient = new ShortcutsIPCClient();
```

### useShortcuts Hook
```typescript
// renderer/modules/platform/infrastructure/ipc/use-shortcuts.ts
import { useState, useEffect, useCallback } from 'react';
import { shortcutsIPCClient, type ShortcutConfig } from './shortcuts-ipc-client';

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShortcuts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await shortcutsIPCClient.getAll();
      setShortcuts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shortcuts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  const updateShortcut = useCallback(async (id: string, accelerator: string) => {
    const updated = await shortcutsIPCClient.update(id, accelerator);
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );
    return updated;
  }, []);

  const resetShortcut = useCallback(async (id: string) => {
    const reset = await shortcutsIPCClient.reset(id);
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? reset : s))
    );
    return reset;
  }, []);

  const resetAll = useCallback(async () => {
    const all = await shortcutsIPCClient.resetAll();
    setShortcuts(all);
    return all;
  }, []);

  const toggleShortcut = useCallback(async (id: string, enabled: boolean) => {
    const updated = enabled
      ? await shortcutsIPCClient.enable(id)
      : await shortcutsIPCClient.disable(id);
    setShortcuts((prev) =>
      prev.map((s) => (s.id === id ? updated : s))
    );
    return updated;
  }, []);

  const validate = useCallback(async (accelerator: string) => {
    return shortcutsIPCClient.validate(accelerator);
  }, []);

  return {
    shortcuts,
    isLoading,
    error,
    updateShortcut,
    resetShortcut,
    resetAll,
    toggleShortcut,
    validate,
    refresh: loadShortcuts,
  };
}
```

### Shortcut Settings UI
```typescript
// renderer/modules/platform/presentation/components/ShortcutSettings.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useShortcuts } from '../../infrastructure/ipc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Switch,
  Input,
  Badge,
  Alert,
  AlertDescription,
} from '@dailyuse/ui';
import { Keyboard, RotateCcw, AlertCircle } from 'lucide-react';

const formatAccelerator = (accelerator: string): string => {
  return accelerator
    .replace('CommandOrControl', '⌘/Ctrl')
    .replace('Command', '⌘')
    .replace('Control', 'Ctrl')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace('Option', '⌥')
    .replace(/\+/g, ' + ');
};

interface ShortcutRecorderProps {
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  validate: (value: string) => Promise<{ valid: boolean; error?: string }>;
}

const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({
  value,
  onChange,
  onCancel,
  validate,
}) => {
  const [recording, setRecording] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    e.preventDefault();

    const parts: string[] = [];

    if (e.metaKey || e.ctrlKey) parts.push('CommandOrControl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    const key = e.key;
    if (key !== 'Control' && key !== 'Shift' && key !== 'Alt' && key !== 'Meta') {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
    }

    const accelerator = parts.join('+');
    setRecording(accelerator);

    if (parts.length >= 2) {
      const result = await validate(accelerator);
      if (result.valid) {
        onChange(accelerator);
        setError(null);
      } else {
        setError(result.error || '无效的快捷键');
      }
    }
  }, [onChange, validate]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={recording ? formatAccelerator(recording) : '按下快捷键...'}
          onKeyDown={handleKeyDown}
          readOnly
          className="flex-1"
        />
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export const ShortcutSettings: React.FC = () => {
  const {
    shortcuts,
    isLoading,
    error,
    updateShortcut,
    resetShortcut,
    resetAll,
    toggleShortcut,
    validate,
  } = useShortcuts();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setUpdateError(null);
  };

  const handleSave = async (id: string, accelerator: string) => {
    try {
      await updateShortcut(id, accelerator);
      setEditingId(null);
      setUpdateError(null);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setUpdateError(null);
  };

  const handleReset = async (id: string) => {
    try {
      await resetShortcut(id);
      setUpdateError(null);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                键盘快捷键
              </CardTitle>
              <CardDescription>自定义全局快捷键</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重置全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {updateError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{updateError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.id}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{shortcut.name}</p>
                    {!shortcut.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        已修改
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {shortcut.description}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {editingId === shortcut.id ? (
                    <ShortcutRecorder
                      value={shortcut.accelerator}
                      onChange={(acc) => handleSave(shortcut.id, acc)}
                      onCancel={handleCancel}
                      validate={validate}
                    />
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(shortcut.id)}
                        disabled={!shortcut.enabled}
                      >
                        {formatAccelerator(shortcut.accelerator)}
                      </Button>
                      {!shortcut.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReset(shortcut.id)}
                          title="重置为默认"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Switch
                        checked={shortcut.enabled}
                        onCheckedChange={(enabled) =>
                          toggleShortcut(shortcut.id, enabled)
                        }
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 验收标准

- [ ] 全局快捷键正确注册
- [ ] 快捷键触发相应操作
- [ ] 自定义快捷键保存正确
- [ ] 快捷键冲突检测正常
- [ ] 重置功能正常
- [ ] 启用/禁用功能正常
- [ ] UI 记录快捷键正确
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/platform/shortcuts-handler.ts`
- `renderer/modules/platform/infrastructure/ipc/shortcuts-ipc-client.ts`
- `renderer/modules/platform/infrastructure/ipc/use-shortcuts.ts`
- `renderer/modules/platform/presentation/components/ShortcutSettings.tsx`
