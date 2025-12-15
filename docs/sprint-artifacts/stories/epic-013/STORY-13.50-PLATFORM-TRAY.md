# Story 13.50: Platform 模块 - 系统托盘

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.50 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 6: 平台集成 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | Platform |

## 目标

实现系统托盘功能，包括托盘图标、右键菜单和托盘交互。

## 任务列表

### 1. 创建 Tray Handler (2h)
- [ ] TrayHandler 类
- [ ] 托盘图标设置
- [ ] 右键菜单构建
- [ ] 托盘交互处理

### 2. 创建 Tray IPC Client (1h)
- [ ] TrayIPCClient
- [ ] useTray hook

### 3. 托盘状态管理 (1h)
- [ ] 托盘状态同步
- [ ] 动态菜单更新

## 技术规范

### Tray Handler
```typescript
// main/modules/platform/tray-handler.ts
import { ipcMain, Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import { logger } from '@/infrastructure/logger';
import path from 'path';

export interface TrayState {
  visible: boolean;
  tooltip: string;
  badge?: string | number;
}

export interface TrayMenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  visible?: boolean;
  click?: () => void;
  submenu?: TrayMenuItem[];
}

class TrayHandler {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private state: TrayState = {
    visible: true,
    tooltip: 'DailyUse',
  };
  private customMenuItems: TrayMenuItem[] = [];

  register(): void {
    ipcMain.handle('tray:get-state', this.getState.bind(this));
    ipcMain.handle('tray:set-tooltip', this.setTooltip.bind(this));
    ipcMain.handle('tray:set-badge', this.setBadge.bind(this));
    ipcMain.handle('tray:clear-badge', this.clearBadge.bind(this));
    ipcMain.handle('tray:set-icon', this.setIcon.bind(this));
    ipcMain.handle('tray:show', this.show.bind(this));
    ipcMain.handle('tray:hide', this.hide.bind(this));
    ipcMain.handle('tray:update-menu', this.updateMenu.bind(this));

    logger.info('[TrayHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async initialize(): Promise<void> {
    // Get icon path based on platform
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'trayTemplate.png';
    const iconPath = path.join(__dirname, '../../assets', iconName);

    try {
      const icon = nativeImage.createFromPath(iconPath);
      this.tray = new Tray(icon);

      // Set tooltip
      this.tray.setToolTip(this.state.tooltip);

      // Build context menu
      this.buildContextMenu();

      // Handle click
      this.tray.on('click', () => {
        this.handleClick();
      });

      // Handle double click (Windows)
      this.tray.on('double-click', () => {
        this.showMainWindow();
      });

      // Handle right click (macOS)
      this.tray.on('right-click', () => {
        this.tray?.popUpContextMenu();
      });

      logger.info('[TrayHandler] Initialized');
    } catch (error) {
      logger.error('[TrayHandler] Failed to initialize:', error);
    }
  }

  private handleClick(): void {
    if (process.platform === 'darwin') {
      // On macOS, show context menu on left click
      this.tray?.popUpContextMenu();
    } else {
      // On Windows/Linux, toggle window
      this.toggleMainWindow();
    }
  }

  private toggleMainWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showMainWindow();
    }
  }

  private showMainWindow(): void {
    if (!this.mainWindow) return;

    this.mainWindow.show();
    this.mainWindow.focus();

    // On Windows, restore from tray
    if (process.platform === 'win32' && this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
  }

  private buildContextMenu(): void {
    const menuItems: Electron.MenuItemConstructorOptions[] = [
      {
        label: '打开 DailyUse',
        click: () => this.showMainWindow(),
      },
      { type: 'separator' },
      {
        label: '快速添加任务',
        accelerator: 'CommandOrControl+Shift+T',
        click: () => {
          this.showMainWindow();
          this.mainWindow?.webContents.send('shortcut:action', { action: 'task:quick-add' });
        },
      },
      {
        label: '开始专注',
        click: () => {
          this.showMainWindow();
          this.mainWindow?.webContents.send('shortcut:action', { action: 'focus:start' });
        },
      },
      { type: 'separator' },
      // Insert custom menu items
      ...this.buildCustomMenuItems(),
      { type: 'separator' },
      {
        label: '偏好设置',
        accelerator: 'CommandOrControl+,',
        click: () => {
          this.showMainWindow();
          this.mainWindow?.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        },
      },
    ];

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray?.setContextMenu(contextMenu);
  }

  private buildCustomMenuItems(): Electron.MenuItemConstructorOptions[] {
    return this.customMenuItems.map((item) => this.convertMenuItem(item));
  }

  private convertMenuItem(item: TrayMenuItem): Electron.MenuItemConstructorOptions {
    const menuItem: Electron.MenuItemConstructorOptions = {
      id: item.id,
      label: item.label,
      type: item.type || 'normal',
      checked: item.checked,
      enabled: item.enabled ?? true,
      visible: item.visible ?? true,
    };

    if (item.submenu) {
      menuItem.submenu = item.submenu.map((subItem) => this.convertMenuItem(subItem));
    } else {
      menuItem.click = () => {
        this.mainWindow?.webContents.send('tray:menu-click', {
          id: item.id,
          checked: item.type === 'checkbox' ? !item.checked : undefined,
        });
      };
    }

    return menuItem;
  }

  // IPC Handlers
  private async getState(): Promise<TrayState> {
    return this.state;
  }

  private async setTooltip(_: Electron.IpcMainInvokeEvent, tooltip: string): Promise<void> {
    this.state.tooltip = tooltip;
    this.tray?.setToolTip(tooltip);
  }

  private async setBadge(
    _: Electron.IpcMainInvokeEvent,
    badge: string | number
  ): Promise<void> {
    this.state.badge = badge;

    // Update tray icon with badge indicator
    if (process.platform === 'darwin') {
      app.dock?.setBadge(String(badge));
    } else {
      // For Windows/Linux, we'd need to overlay the icon
      // This is a simplified version
      this.updateTrayTitle(badge);
    }
  }

  private async clearBadge(): Promise<void> {
    this.state.badge = undefined;

    if (process.platform === 'darwin') {
      app.dock?.setBadge('');
    } else {
      this.updateTrayTitle(undefined);
    }
  }

  private updateTrayTitle(badge?: string | number): void {
    if (badge !== undefined) {
      this.tray?.setTitle(String(badge));
    } else {
      this.tray?.setTitle('');
    }
  }

  private async setIcon(_: Electron.IpcMainInvokeEvent, iconPath: string): Promise<void> {
    try {
      const icon = nativeImage.createFromPath(iconPath);
      this.tray?.setImage(icon);
    } catch (error) {
      logger.error('[TrayHandler] Failed to set icon:', error);
    }
  }

  private async show(): Promise<void> {
    // Tray can't be shown/hidden after creation in Electron
    // We'd need to recreate it
    if (!this.tray) {
      await this.initialize();
    }
    this.state.visible = true;
  }

  private async hide(): Promise<void> {
    this.tray?.destroy();
    this.tray = null;
    this.state.visible = false;
  }

  private async updateMenu(
    _: Electron.IpcMainInvokeEvent,
    items: TrayMenuItem[]
  ): Promise<void> {
    this.customMenuItems = items;
    this.buildContextMenu();
  }

  // Public method to update menu from main process
  updateMenuFromMain(items: TrayMenuItem[]): void {
    this.customMenuItems = items;
    this.buildContextMenu();
  }

  // Destroy tray on app quit
  destroy(): void {
    this.tray?.destroy();
    this.tray = null;
  }
}

export const trayHandler = new TrayHandler();

// Cleanup on quit
app.on('will-quit', () => {
  trayHandler.destroy();
});
```

### Tray IPC Client
```typescript
// renderer/modules/platform/infrastructure/ipc/tray-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';

export interface TrayState {
  visible: boolean;
  tooltip: string;
  badge?: string | number;
}

export interface TrayMenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator' | 'checkbox' | 'radio';
  checked?: boolean;
  enabled?: boolean;
  visible?: boolean;
  submenu?: TrayMenuItem[];
}

class TrayIPCClient extends BaseIPCClient {
  constructor() {
    super('tray');
  }

  async getState(): Promise<TrayState> {
    return this.invoke<TrayState>('get-state');
  }

  async setTooltip(tooltip: string): Promise<void> {
    return this.invoke<void>('set-tooltip', tooltip);
  }

  async setBadge(badge: string | number): Promise<void> {
    return this.invoke<void>('set-badge', badge);
  }

  async clearBadge(): Promise<void> {
    return this.invoke<void>('clear-badge');
  }

  async setIcon(iconPath: string): Promise<void> {
    return this.invoke<void>('set-icon', iconPath);
  }

  async show(): Promise<void> {
    return this.invoke<void>('show');
  }

  async hide(): Promise<void> {
    return this.invoke<void>('hide');
  }

  async updateMenu(items: TrayMenuItem[]): Promise<void> {
    return this.invoke<void>('update-menu', items);
  }

  onMenuClick(callback: (data: { id: string; checked?: boolean }) => void): () => void {
    return this.on('menu-click', callback);
  }
}

export const trayIPCClient = new TrayIPCClient();
```

### useTray Hook
```typescript
// renderer/modules/platform/infrastructure/ipc/use-tray.ts
import { useState, useEffect, useCallback } from 'react';
import { trayIPCClient, type TrayState, type TrayMenuItem } from './tray-ipc-client';

export function useTray() {
  const [state, setState] = useState<TrayState>({
    visible: true,
    tooltip: 'DailyUse',
  });

  useEffect(() => {
    // Load initial state
    trayIPCClient.getState().then(setState);
  }, []);

  const setTooltip = useCallback(async (tooltip: string) => {
    await trayIPCClient.setTooltip(tooltip);
    setState((prev) => ({ ...prev, tooltip }));
  }, []);

  const setBadge = useCallback(async (badge: string | number) => {
    await trayIPCClient.setBadge(badge);
    setState((prev) => ({ ...prev, badge }));
  }, []);

  const clearBadge = useCallback(async () => {
    await trayIPCClient.clearBadge();
    setState((prev) => ({ ...prev, badge: undefined }));
  }, []);

  const updateMenu = useCallback(async (items: TrayMenuItem[]) => {
    await trayIPCClient.updateMenu(items);
  }, []);

  const show = useCallback(async () => {
    await trayIPCClient.show();
    setState((prev) => ({ ...prev, visible: true }));
  }, []);

  const hide = useCallback(async () => {
    await trayIPCClient.hide();
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    ...state,
    setTooltip,
    setBadge,
    clearBadge,
    updateMenu,
    show,
    hide,
  };
}

export function useTrayMenuHandler(handlers: Record<string, (checked?: boolean) => void>) {
  useEffect(() => {
    const unsubscribe = trayIPCClient.onMenuClick(({ id, checked }) => {
      const handler = handlers[id];
      if (handler) {
        handler(checked);
      }
    });

    return () => unsubscribe();
  }, [handlers]);
}
```

### Tray Settings Component
```typescript
// renderer/modules/platform/presentation/components/TraySettings.tsx
import React from 'react';
import { useTray } from '../../infrastructure/ipc';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Switch,
  Label,
} from '@dailyuse/ui';
import { Monitor } from 'lucide-react';

export const TraySettings: React.FC = () => {
  const { visible, show, hide } = useTray();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await show();
    } else {
      await hide();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          系统托盘
        </CardTitle>
        <CardDescription>系统托盘图标设置</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="tray-visible">显示系统托盘图标</Label>
            <p className="text-sm text-muted-foreground">
              关闭后，应用将不会显示在系统托盘中
            </p>
          </div>
          <Switch
            id="tray-visible"
            checked={visible}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};
```

### 动态托盘菜单示例
```typescript
// renderer/modules/platform/presentation/hooks/use-dynamic-tray.ts
import { useEffect } from 'react';
import { useTray, useTrayMenuHandler } from '../../infrastructure/ipc';
import { useTaskStore } from '@/modules/task/stores';
import { useFocusStore } from '@/modules/goal/stores';

export function useDynamicTray() {
  const { updateMenu, setBadge, clearBadge } = useTray();
  const { tasks } = useTaskStore();
  const { isActive: isFocusActive } = useFocusStore();

  // Update badge based on pending tasks
  useEffect(() => {
    const pendingCount = tasks.filter((t) => t.status === 'pending').length;
    if (pendingCount > 0) {
      setBadge(pendingCount);
    } else {
      clearBadge();
    }
  }, [tasks, setBadge, clearBadge]);

  // Update menu based on state
  useEffect(() => {
    const menuItems = [
      {
        id: 'focus-toggle',
        label: isFocusActive ? '暂停专注' : '开始专注',
        type: 'normal' as const,
      },
      {
        id: 'recent-tasks',
        label: '最近任务',
        submenu: tasks.slice(0, 5).map((task) => ({
          id: `task-${task.id}`,
          label: task.title,
          type: 'checkbox' as const,
          checked: task.status === 'completed',
        })),
      },
    ];

    updateMenu(menuItems);
  }, [tasks, isFocusActive, updateMenu]);

  // Handle menu clicks
  useTrayMenuHandler({
    'focus-toggle': () => {
      // Toggle focus
      if (isFocusActive) {
        // Pause focus
      } else {
        // Start focus
      }
    },
    // Handle task toggle
  });
}
```

## 验收标准

- [ ] 系统托盘图标正确显示
- [ ] 右键菜单正确显示
- [ ] 菜单项点击响应正确
- [ ] 托盘提示文本显示正确
- [ ] 徽章数字显示正确
- [ ] 动态菜单更新正常
- [ ] 托盘显示/隐藏功能正常
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/platform/tray-handler.ts`
- `renderer/modules/platform/infrastructure/ipc/tray-ipc-client.ts`
- `renderer/modules/platform/infrastructure/ipc/use-tray.ts`
- `renderer/modules/platform/presentation/components/TraySettings.tsx`
- `renderer/modules/platform/presentation/hooks/use-dynamic-tray.ts`
