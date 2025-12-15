# Story 13.34: Setting 模块实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.34 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 4: 系统模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |
| 前置依赖 | Story 13.33 (Auth Module) |
| 关联模块 | Setting |

## 目标

实现 Setting 模块的完整架构，管理应用级设置（与 Account Preferences 区分，Setting 管理应用配置）。

## 任务列表

### 1. Main Process Setting Handler (1.5h)
- [ ] 应用配置管理
- [ ] 快捷键配置
- [ ] 存储路径配置
- [ ] 代理设置

### 2. Renderer Process Setting Client (1h)
- [ ] IPC Client 实现
- [ ] Store 实现

### 3. Setting UI 组件 (2h)
- [ ] 通用设置页
- [ ] 快捷键设置页
- [ ] 高级设置页

### 4. 路由和集成 (0.5h)
- [ ] 路由配置
- [ ] 模块索引

## 技术规范

### Main Process Setting Handler
```typescript
// main/modules/setting/settingHandler.ts
import { ipcMain, app, BrowserWindow } from 'electron';
import { db } from '../../database';
import path from 'path';

export interface AppSettings {
  // General
  language: string;
  checkForUpdates: boolean;
  sendAnalytics: boolean;
  
  // Storage
  dataPath: string;
  backupPath: string;
  maxBackups: number;
  
  // Network
  useProxy: boolean;
  proxyUrl: string | null;
  
  // Advanced
  hardwareAcceleration: boolean;
  devTools: boolean;
  experimentalFeatures: string[];
}

export interface ShortcutConfig {
  id: string;
  label: string;
  defaultKey: string;
  currentKey: string;
  isGlobal: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh-CN',
  checkForUpdates: true,
  sendAnalytics: false,
  dataPath: path.join(app.getPath('userData'), 'data'),
  backupPath: path.join(app.getPath('userData'), 'backups'),
  maxBackups: 10,
  useProxy: false,
  proxyUrl: null,
  hardwareAcceleration: true,
  devTools: false,
  experimentalFeatures: [],
};

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: 'quick-add-task', label: '快速添加任务', defaultKey: 'CommandOrControl+Shift+N', currentKey: 'CommandOrControl+Shift+N', isGlobal: true },
  { id: 'toggle-app', label: '显示/隐藏应用', defaultKey: 'CommandOrControl+Shift+D', currentKey: 'CommandOrControl+Shift+D', isGlobal: true },
  { id: 'start-pomodoro', label: '开始番茄钟', defaultKey: 'CommandOrControl+Shift+P', currentKey: 'CommandOrControl+Shift+P', isGlobal: true },
  { id: 'search', label: '搜索', defaultKey: 'CommandOrControl+K', currentKey: 'CommandOrControl+K', isGlobal: false },
  { id: 'new-document', label: '新建文档', defaultKey: 'CommandOrControl+N', currentKey: 'CommandOrControl+N', isGlobal: false },
  { id: 'save', label: '保存', defaultKey: 'CommandOrControl+S', currentKey: 'CommandOrControl+S', isGlobal: false },
];

class SettingHandler {
  private mainWindow: BrowserWindow | null = null;
  private settings: AppSettings = DEFAULT_SETTINGS;
  private shortcuts: ShortcutConfig[] = DEFAULT_SHORTCUTS;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  register() {
    // Settings
    ipcMain.handle('setting:get-all', async () => {
      return this.getAllSettings();
    });

    ipcMain.handle('setting:update', async (_, updates: Partial<AppSettings>) => {
      return this.updateSettings(updates);
    });

    ipcMain.handle('setting:reset', async () => {
      return this.resetSettings();
    });

    // Shortcuts
    ipcMain.handle('setting:get-shortcuts', async () => {
      return this.getShortcuts();
    });

    ipcMain.handle('setting:update-shortcut', async (_, id: string, key: string) => {
      return this.updateShortcut(id, key);
    });

    ipcMain.handle('setting:reset-shortcuts', async () => {
      return this.resetShortcuts();
    });

    // Path operations
    ipcMain.handle('setting:get-data-path', async () => {
      return this.settings.dataPath;
    });

    ipcMain.handle('setting:change-data-path', async () => {
      return this.changeDataPath();
    });

    ipcMain.handle('setting:open-data-folder', async () => {
      return this.openDataFolder();
    });

    console.log('[SettingHandler] Registered');
  }

  async initialize() {
    await this.loadSettings();
    await this.loadShortcuts();
    this.applySettings();
  }

  // ===== Settings Methods =====

  private async loadSettings() {
    const stored = await db.appSetting.findFirst();
    if (stored?.data) {
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored.data) };
    }
  }

  private async getAllSettings(): Promise<AppSettings> {
    return this.settings;
  }

  private async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    this.settings = { ...this.settings, ...updates };
    
    await db.appSetting.upsert({
      where: { id: 'main' },
      update: { data: JSON.stringify(this.settings), updatedAt: new Date() },
      create: { id: 'main', data: JSON.stringify(this.settings), updatedAt: new Date() },
    });

    this.applySettings();
    this.emitEvent('setting:changed', this.settings);
    
    return this.settings;
  }

  private async resetSettings(): Promise<AppSettings> {
    this.settings = { ...DEFAULT_SETTINGS };
    
    await db.appSetting.delete({
      where: { id: 'main' },
    }).catch(() => {});

    this.applySettings();
    this.emitEvent('setting:changed', this.settings);
    
    return this.settings;
  }

  private applySettings() {
    // Apply hardware acceleration
    if (!this.settings.hardwareAcceleration) {
      app.disableHardwareAcceleration();
    }

    // Apply proxy
    if (this.settings.useProxy && this.settings.proxyUrl) {
      this.mainWindow?.webContents.session.setProxy({
        proxyRules: this.settings.proxyUrl,
      });
    } else {
      this.mainWindow?.webContents.session.setProxy({
        proxyRules: '',
      });
    }
  }

  // ===== Shortcuts Methods =====

  private async loadShortcuts() {
    const stored = await db.appSetting.findFirst({
      where: { id: 'shortcuts' },
    });
    if (stored?.data) {
      const savedShortcuts = JSON.parse(stored.data);
      this.shortcuts = DEFAULT_SHORTCUTS.map((def) => ({
        ...def,
        currentKey: savedShortcuts[def.id] || def.defaultKey,
      }));
    }
  }

  private async getShortcuts(): Promise<ShortcutConfig[]> {
    return this.shortcuts;
  }

  private async updateShortcut(id: string, key: string): Promise<ShortcutConfig[]> {
    const index = this.shortcuts.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Shortcut ${id} not found`);
    }

    // Check for conflicts
    const conflict = this.shortcuts.find(
      (s) => s.id !== id && s.currentKey === key
    );
    if (conflict) {
      throw new Error(`快捷键与 "${conflict.label}" 冲突`);
    }

    this.shortcuts[index].currentKey = key;

    // Save to database
    const shortcutMap = Object.fromEntries(
      this.shortcuts.map((s) => [s.id, s.currentKey])
    );
    
    await db.appSetting.upsert({
      where: { id: 'shortcuts' },
      update: { data: JSON.stringify(shortcutMap), updatedAt: new Date() },
      create: { id: 'shortcuts', data: JSON.stringify(shortcutMap), updatedAt: new Date() },
    });

    this.emitEvent('setting:shortcuts-changed', this.shortcuts);
    
    return this.shortcuts;
  }

  private async resetShortcuts(): Promise<ShortcutConfig[]> {
    this.shortcuts = DEFAULT_SHORTCUTS.map((s) => ({
      ...s,
      currentKey: s.defaultKey,
    }));

    await db.appSetting.delete({
      where: { id: 'shortcuts' },
    }).catch(() => {});

    this.emitEvent('setting:shortcuts-changed', this.shortcuts);
    
    return this.shortcuts;
  }

  // ===== Path Operations =====

  private async changeDataPath(): Promise<string | null> {
    const { dialog } = await import('electron');
    const { shell } = await import('electron');

    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择数据存储位置',
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    const newPath = result.filePaths[0];
    await this.updateSettings({ dataPath: newPath });
    
    return newPath;
  }

  private async openDataFolder(): Promise<void> {
    const { shell } = await import('electron');
    await shell.openPath(this.settings.dataPath);
  }

  // ===== Event Emission =====

  private emitEvent(channel: string, data: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

export const settingHandler = new SettingHandler();
```

### Setting IPC Client and Store
```typescript
// renderer/modules/setting/infrastructure/ipc/settingIPCClient.ts
import { BaseIPCClient } from '../../../../infrastructure/ipc';

export interface AppSettings {
  language: string;
  checkForUpdates: boolean;
  sendAnalytics: boolean;
  dataPath: string;
  backupPath: string;
  maxBackups: number;
  useProxy: boolean;
  proxyUrl: string | null;
  hardwareAcceleration: boolean;
  devTools: boolean;
  experimentalFeatures: string[];
}

export interface ShortcutConfig {
  id: string;
  label: string;
  defaultKey: string;
  currentKey: string;
  isGlobal: boolean;
}

class SettingIPCClientImpl extends BaseIPCClient {
  constructor() {
    super('setting');
  }

  async getAll(): Promise<AppSettings> {
    return this.invoke<AppSettings>('get-all');
  }

  async update(updates: Partial<AppSettings>): Promise<AppSettings> {
    return this.invoke<AppSettings>('update', updates);
  }

  async reset(): Promise<AppSettings> {
    return this.invoke<AppSettings>('reset');
  }

  async getShortcuts(): Promise<ShortcutConfig[]> {
    return this.invoke<ShortcutConfig[]>('get-shortcuts');
  }

  async updateShortcut(id: string, key: string): Promise<ShortcutConfig[]> {
    return this.invoke<ShortcutConfig[]>('update-shortcut', id, key);
  }

  async resetShortcuts(): Promise<ShortcutConfig[]> {
    return this.invoke<ShortcutConfig[]>('reset-shortcuts');
  }

  async getDataPath(): Promise<string> {
    return this.invoke<string>('get-data-path');
  }

  async changeDataPath(): Promise<string | null> {
    return this.invoke<string | null>('change-data-path');
  }

  async openDataFolder(): Promise<void> {
    return this.invoke<void>('open-data-folder');
  }

  onSettingsChanged(callback: (settings: AppSettings) => void): () => void {
    return this.on('changed', callback);
  }

  onShortcutsChanged(callback: (shortcuts: ShortcutConfig[]) => void): () => void {
    return this.on('shortcuts-changed', callback);
  }
}

export const settingIPCClient = new SettingIPCClientImpl();

// renderer/modules/setting/presentation/stores/settingStore.ts
import { create } from 'zustand';
import {
  settingIPCClient,
  type AppSettings,
  type ShortcutConfig,
} from '../../infrastructure/ipc';

interface SettingState {
  settings: AppSettings | null;
  shortcuts: ShortcutConfig[];
  isLoading: boolean;
  error: string | null;
}

interface SettingActions {
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loadShortcuts: () => Promise<void>;
  updateShortcut: (id: string, key: string) => Promise<void>;
  resetShortcuts: () => Promise<void>;
  changeDataPath: () => Promise<string | null>;
  openDataFolder: () => Promise<void>;
  initialize: () => Promise<void>;
}

type SettingStore = SettingState & SettingActions;

export const useSettingStore = create<SettingStore>((set, get) => ({
  settings: null,
  shortcuts: [],
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingIPCClient.getAll();
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingIPCClient.update(updates);
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingIPCClient.reset();
      set({ settings, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadShortcuts: async () => {
    try {
      const shortcuts = await settingIPCClient.getShortcuts();
      set({ shortcuts });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateShortcut: async (id, key) => {
    set({ error: null });
    try {
      const shortcuts = await settingIPCClient.updateShortcut(id, key);
      set({ shortcuts });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  resetShortcuts: async () => {
    try {
      const shortcuts = await settingIPCClient.resetShortcuts();
      set({ shortcuts });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  changeDataPath: async () => {
    const newPath = await settingIPCClient.changeDataPath();
    if (newPath) {
      await get().loadSettings();
    }
    return newPath;
  },

  openDataFolder: async () => {
    await settingIPCClient.openDataFolder();
  },

  initialize: async () => {
    await Promise.all([
      get().loadSettings(),
      get().loadShortcuts(),
    ]);

    settingIPCClient.onSettingsChanged((settings) => {
      set({ settings });
    });

    settingIPCClient.onShortcutsChanged((shortcuts) => {
      set({ shortcuts });
    });
  },
}));
```

### Settings Page
```typescript
// renderer/modules/setting/presentation/views/SettingsPage.tsx
import React, { useEffect, useState } from 'react';
import { useSettingStore } from '../stores';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Label,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Separator,
} from '@dailyuse/ui';
import {
  Settings,
  Keyboard,
  FolderOpen,
  Globe,
  Zap,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    shortcuts,
    isLoading,
    error,
    loadSettings,
    updateSettings,
    resetSettings,
    updateShortcut,
    resetShortcuts,
    changeDataPath,
    openDataFolder,
  } = useSettingStore();

  const [recordingShortcut, setRecordingShortcut] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleShortcutRecord = (id: string) => {
    setRecordingShortcut(id);
    
    const handleKeyDown = async (e: KeyboardEvent) => {
      e.preventDefault();
      
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      
      if (e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Shift') {
        parts.push(e.key.toUpperCase());
      }

      if (parts.length > 1) {
        const shortcut = parts.join('+');
        try {
          await updateShortcut(id, shortcut);
        } catch {
          // Error handled by store
        }
        setRecordingShortcut(null);
        window.removeEventListener('keydown', handleKeyDown);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="settings-page container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground">配置应用程序设置</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            通用
          </TabsTrigger>
          <TabsTrigger value="shortcuts">
            <Keyboard className="w-4 h-4 mr-2" />
            快捷键
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="w-4 h-4 mr-2" />
            高级
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>更新</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>自动检查更新</Label>
                  <p className="text-sm text-muted-foreground">
                    启动时自动检查新版本
                  </p>
                </div>
                <Switch
                  checked={settings.checkForUpdates}
                  onCheckedChange={(checked) =>
                    updateSettings({ checkForUpdates: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <FolderOpen className="w-5 h-5 inline mr-2" />
                存储
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>数据存储位置</Label>
                <div className="flex gap-2">
                  <Input value={settings.dataPath} readOnly className="flex-1" />
                  <Button variant="outline" onClick={changeDataPath}>
                    更改
                  </Button>
                  <Button variant="outline" onClick={openDataFolder}>
                    打开
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>最大备份数量</Label>
                <Input
                  type="number"
                  value={settings.maxBackups}
                  onChange={(e) =>
                    updateSettings({ maxBackups: parseInt(e.target.value) || 10 })
                  }
                  min={1}
                  max={50}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Globe className="w-5 h-5 inline mr-2" />
                网络
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>使用代理</Label>
                  <p className="text-sm text-muted-foreground">
                    通过代理服务器连接网络
                  </p>
                </div>
                <Switch
                  checked={settings.useProxy}
                  onCheckedChange={(checked) =>
                    updateSettings({ useProxy: checked })
                  }
                />
              </div>

              {settings.useProxy && (
                <div className="space-y-2">
                  <Label>代理地址</Label>
                  <Input
                    value={settings.proxyUrl || ''}
                    onChange={(e) =>
                      updateSettings({ proxyUrl: e.target.value || null })
                    }
                    placeholder="http://proxy:port"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shortcuts */}
        <TabsContent value="shortcuts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>键盘快捷键</CardTitle>
              <CardDescription>
                自定义应用程序快捷键。点击快捷键后按下新的组合键。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="font-medium">{shortcut.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {shortcut.isGlobal ? '全局快捷键' : '应用内快捷键'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShortcutRecord(shortcut.id)}
                      className={
                        recordingShortcut === shortcut.id
                          ? 'border-primary bg-primary/10'
                          : ''
                      }
                    >
                      {recordingShortcut === shortcut.id
                        ? '按下快捷键...'
                        : shortcut.currentKey.replace('CommandOrControl', '⌘')}
                    </Button>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <Button variant="outline" onClick={resetShortcuts}>
                <RotateCcw className="w-4 h-4 mr-2" />
                重置所有快捷键
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>性能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>硬件加速</Label>
                  <p className="text-sm text-muted-foreground">
                    使用 GPU 加速渲染（需要重启）
                  </p>
                </div>
                <Switch
                  checked={settings.hardwareAcceleration}
                  onCheckedChange={(checked) =>
                    updateSettings({ hardwareAcceleration: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>开发者</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>开发者工具</Label>
                  <p className="text-sm text-muted-foreground">
                    启用开发者工具菜单
                  </p>
                </div>
                <Switch
                  checked={settings.devTools}
                  onCheckedChange={(checked) =>
                    updateSettings({ devTools: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">重置设置</CardTitle>
              <CardDescription>
                将所有设置恢复为默认值
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={resetSettings}>
                <RotateCcw className="w-4 h-4 mr-2" />
                重置所有设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Routes and Module Index
```typescript
// renderer/modules/setting/routes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { SettingsPage } from './presentation/views/SettingsPage';

export const settingRoutes: RouteObject[] = [
  {
    path: '/settings/app',
    element: <SettingsPage />,
  },
];

// renderer/modules/setting/index.ts
export { settingIPCClient } from './infrastructure/ipc';
export type { AppSettings, ShortcutConfig } from './infrastructure/ipc';
export { useSettingStore } from './presentation/stores';
export { SettingsPage } from './presentation/views/SettingsPage';
export { settingRoutes } from './routes';
```

## 验收标准

- [ ] 应用设置加载和保存正常
- [ ] 快捷键录制和更新正常
- [ ] 快捷键冲突检测正常
- [ ] 数据路径更改正常
- [ ] 代理设置正常
- [ ] 硬件加速设置正常
- [ ] 设置重置功能正常
- [ ] IPC 事件同步正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/setting/settingHandler.ts`
- `main/modules/setting/index.ts`
- `renderer/modules/setting/infrastructure/ipc/settingIPCClient.ts`
- `renderer/modules/setting/presentation/stores/settingStore.ts`
- `renderer/modules/setting/presentation/views/SettingsPage.tsx`
- `renderer/modules/setting/routes.tsx`
- `renderer/modules/setting/index.ts`
