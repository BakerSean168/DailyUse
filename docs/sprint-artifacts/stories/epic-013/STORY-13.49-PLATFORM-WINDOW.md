# Story 13.49: Platform 模块 - 窗口管理

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.49 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 6: 平台集成 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | Platform |

## 目标

实现窗口管理功能，包括窗口状态控制、多窗口支持、窗口位置记忆等。

## 任务列表

### 1. 创建 Window Handler (2.5h)
- [ ] WindowHandler 类
- [ ] 窗口状态控制
- [ ] 多窗口管理
- [ ] 窗口位置/大小记忆

### 2. 创建 Window IPC Client (1.5h)
- [ ] WindowIPCClient
- [ ] useWindow hook
- [ ] useWindowState hook

### 3. 窗口状态 Store (1h)
- [ ] windowStore
- [ ] 窗口状态持久化

### 4. 窗口控制组件 (1h)
- [ ] WindowControls 组件
- [ ] 窗口工具栏

## 技术规范

### Window Handler
```typescript
// main/modules/platform/window-handler.ts
import { ipcMain, BrowserWindow, screen, app } from 'electron';
import { db } from '@/infrastructure/database';
import { logger } from '@/infrastructure/logger';
import path from 'path';

export interface WindowState {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface WindowConfig {
  id: string;
  title: string;
  url?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  frame?: boolean;
  alwaysOnTop?: boolean;
}

const defaultWindowState: WindowState = {
  width: 1200,
  height: 800,
  x: undefined,
  y: undefined,
  isMaximized: false,
  isFullScreen: false,
};

class WindowHandler {
  private mainWindow: BrowserWindow | null = null;
  private windows: Map<string, BrowserWindow> = new Map();
  private windowStates: Map<string, WindowState> = new Map();

  register(): void {
    // Window state
    ipcMain.handle('window:get-state', this.getWindowState.bind(this));
    ipcMain.handle('window:set-always-on-top', this.setAlwaysOnTop.bind(this));
    ipcMain.handle('window:get-always-on-top', this.getAlwaysOnTop.bind(this));
    
    // Window controls
    ipcMain.handle('window:minimize', this.minimize.bind(this));
    ipcMain.handle('window:maximize', this.maximize.bind(this));
    ipcMain.handle('window:unmaximize', this.unmaximize.bind(this));
    ipcMain.handle('window:close', this.close.bind(this));
    ipcMain.handle('window:toggle-maximize', this.toggleMaximize.bind(this));
    ipcMain.handle('window:toggle-fullscreen', this.toggleFullScreen.bind(this));
    ipcMain.handle('window:center', this.center.bind(this));
    
    // Window position/size
    ipcMain.handle('window:set-size', this.setSize.bind(this));
    ipcMain.handle('window:set-position', this.setPosition.bind(this));
    ipcMain.handle('window:set-minimum-size', this.setMinimumSize.bind(this));
    
    // Multi-window
    ipcMain.handle('window:create', this.createWindow.bind(this));
    ipcMain.handle('window:close-window', this.closeWindow.bind(this));
    ipcMain.handle('window:focus-window', this.focusWindow.bind(this));
    ipcMain.handle('window:get-windows', this.getWindows.bind(this));

    logger.info('[WindowHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    this.windows.set('main', window);
    
    // Setup window event listeners
    this.setupWindowListeners(window, 'main');
    
    // Restore window state
    this.restoreWindowState(window, 'main');
  }

  private setupWindowListeners(window: BrowserWindow, windowId: string): void {
    // Track state changes
    window.on('resize', () => {
      this.updateWindowState(windowId);
    });

    window.on('move', () => {
      this.updateWindowState(windowId);
    });

    window.on('maximize', () => {
      this.updateWindowState(windowId);
      this.emitStateChange(windowId, 'maximized');
    });

    window.on('unmaximize', () => {
      this.updateWindowState(windowId);
      this.emitStateChange(windowId, 'unmaximized');
    });

    window.on('enter-full-screen', () => {
      this.updateWindowState(windowId);
      this.emitStateChange(windowId, 'enter-fullscreen');
    });

    window.on('leave-full-screen', () => {
      this.updateWindowState(windowId);
      this.emitStateChange(windowId, 'leave-fullscreen');
    });

    window.on('focus', () => {
      this.emitStateChange(windowId, 'focus');
    });

    window.on('blur', () => {
      this.emitStateChange(windowId, 'blur');
    });

    window.on('closed', () => {
      this.windows.delete(windowId);
      this.saveWindowState(windowId);
    });
  }

  private updateWindowState(windowId: string): void {
    const window = this.windows.get(windowId);
    if (!window) return;

    const bounds = window.getBounds();
    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen(),
    };

    this.windowStates.set(windowId, state);
  }

  private async saveWindowState(windowId: string): Promise<void> {
    const state = this.windowStates.get(windowId);
    if (!state) return;

    try {
      await db.windowState.upsert({
        where: { windowId },
        create: { windowId, ...state },
        update: state,
      });
    } catch (error) {
      logger.error('[WindowHandler] Failed to save window state:', error);
    }
  }

  private async restoreWindowState(window: BrowserWindow, windowId: string): Promise<void> {
    try {
      const savedState = await db.windowState.findUnique({
        where: { windowId },
      });

      if (savedState) {
        const state: WindowState = savedState;
        
        // Validate position is on a screen
        const bounds = { x: state.x || 0, y: state.y || 0, width: state.width, height: state.height };
        const display = screen.getDisplayMatching(bounds);
        
        if (display) {
          if (!state.isMaximized && !state.isFullScreen) {
            window.setBounds({
              x: state.x,
              y: state.y,
              width: state.width,
              height: state.height,
            });
          }
          
          if (state.isMaximized) {
            window.maximize();
          }
          
          if (state.isFullScreen) {
            window.setFullScreen(true);
          }
        }
        
        this.windowStates.set(windowId, state);
      }
    } catch (error) {
      logger.error('[WindowHandler] Failed to restore window state:', error);
    }
  }

  private emitStateChange(windowId: string, event: string): void {
    const window = this.windows.get(windowId);
    if (window) {
      window.webContents.send('window:state-changed', {
        windowId,
        event,
        state: this.getWindowStateSync(windowId),
      });
    }
  }

  private getWindowStateSync(windowId: string): WindowState | null {
    const window = this.windows.get(windowId);
    if (!window) return null;

    const bounds = window.getBounds();
    return {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen(),
    };
  }

  // IPC Handlers
  private async getWindowState(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<WindowState | null> {
    return this.getWindowStateSync(windowId);
  }

  private async setAlwaysOnTop(
    _: Electron.IpcMainInvokeEvent,
    alwaysOnTop: boolean,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.setAlwaysOnTop(alwaysOnTop);
    }
  }

  private async getAlwaysOnTop(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<boolean> {
    const window = this.windows.get(windowId);
    return window?.isAlwaysOnTop() ?? false;
  }

  private async minimize(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.minimize();
    }
  }

  private async maximize(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.maximize();
    }
  }

  private async unmaximize(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.unmaximize();
    }
  }

  private async close(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      await this.saveWindowState(windowId);
      window.close();
    }
  }

  private async toggleMaximize(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  }

  private async toggleFullScreen(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.setFullScreen(!window.isFullScreen());
    }
  }

  private async center(
    _: Electron.IpcMainInvokeEvent,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.center();
    }
  }

  private async setSize(
    _: Electron.IpcMainInvokeEvent,
    width: number,
    height: number,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.setSize(width, height);
    }
  }

  private async setPosition(
    _: Electron.IpcMainInvokeEvent,
    x: number,
    y: number,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.setPosition(x, y);
    }
  }

  private async setMinimumSize(
    _: Electron.IpcMainInvokeEvent,
    width: number,
    height: number,
    windowId: string = 'main'
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      window.setMinimumSize(width, height);
    }
  }

  private async createWindow(
    _: Electron.IpcMainInvokeEvent,
    config: WindowConfig
  ): Promise<string> {
    const { id, title, url, ...options } = config;

    if (this.windows.has(id)) {
      const existingWindow = this.windows.get(id)!;
      existingWindow.focus();
      return id;
    }

    const window = new BrowserWindow({
      width: options.width || 800,
      height: options.height || 600,
      minWidth: options.minWidth || 400,
      minHeight: options.minHeight || 300,
      resizable: options.resizable ?? true,
      frame: options.frame ?? true,
      alwaysOnTop: options.alwaysOnTop ?? false,
      title,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
      },
    });

    this.windows.set(id, window);
    this.setupWindowListeners(window, id);

    if (url) {
      if (url.startsWith('http')) {
        await window.loadURL(url);
      } else {
        // Load internal route
        const mainUrl = this.mainWindow?.webContents.getURL() || '';
        const baseUrl = mainUrl.split('#')[0];
        await window.loadURL(`${baseUrl}#${url}`);
      }
    }

    return id;
  }

  private async closeWindow(
    _: Electron.IpcMainInvokeEvent,
    windowId: string
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window && windowId !== 'main') {
      await this.saveWindowState(windowId);
      window.close();
    }
  }

  private async focusWindow(
    _: Electron.IpcMainInvokeEvent,
    windowId: string
  ): Promise<void> {
    const window = this.windows.get(windowId);
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  }

  private async getWindows(): Promise<Array<{ id: string; title: string }>> {
    return Array.from(this.windows.entries()).map(([id, window]) => ({
      id,
      title: window.getTitle(),
    }));
  }

  // Save all window states on app quit
  async saveAllWindowStates(): Promise<void> {
    for (const windowId of this.windows.keys()) {
      await this.saveWindowState(windowId);
    }
  }
}

export const windowHandler = new WindowHandler();

// Save states on quit
app.on('before-quit', async () => {
  await windowHandler.saveAllWindowStates();
});
```

### Window IPC Client
```typescript
// renderer/modules/platform/infrastructure/ipc/window-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';

export interface WindowState {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface WindowConfig {
  id: string;
  title: string;
  url?: string;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  frame?: boolean;
  alwaysOnTop?: boolean;
}

class WindowIPCClient extends BaseIPCClient {
  constructor() {
    super('window');
  }

  // State
  async getState(windowId?: string): Promise<WindowState | null> {
    return this.invoke<WindowState | null>('get-state', windowId);
  }

  async setAlwaysOnTop(alwaysOnTop: boolean, windowId?: string): Promise<void> {
    return this.invoke<void>('set-always-on-top', alwaysOnTop, windowId);
  }

  async getAlwaysOnTop(windowId?: string): Promise<boolean> {
    return this.invoke<boolean>('get-always-on-top', windowId);
  }

  // Controls
  async minimize(windowId?: string): Promise<void> {
    return this.invoke<void>('minimize', windowId);
  }

  async maximize(windowId?: string): Promise<void> {
    return this.invoke<void>('maximize', windowId);
  }

  async unmaximize(windowId?: string): Promise<void> {
    return this.invoke<void>('unmaximize', windowId);
  }

  async close(windowId?: string): Promise<void> {
    return this.invoke<void>('close', windowId);
  }

  async toggleMaximize(windowId?: string): Promise<void> {
    return this.invoke<void>('toggle-maximize', windowId);
  }

  async toggleFullScreen(windowId?: string): Promise<void> {
    return this.invoke<void>('toggle-fullscreen', windowId);
  }

  async center(windowId?: string): Promise<void> {
    return this.invoke<void>('center', windowId);
  }

  // Position/Size
  async setSize(width: number, height: number, windowId?: string): Promise<void> {
    return this.invoke<void>('set-size', width, height, windowId);
  }

  async setPosition(x: number, y: number, windowId?: string): Promise<void> {
    return this.invoke<void>('set-position', x, y, windowId);
  }

  async setMinimumSize(width: number, height: number, windowId?: string): Promise<void> {
    return this.invoke<void>('set-minimum-size', width, height, windowId);
  }

  // Multi-window
  async createWindow(config: WindowConfig): Promise<string> {
    return this.invoke<string>('create', config);
  }

  async closeWindow(windowId: string): Promise<void> {
    return this.invoke<void>('close-window', windowId);
  }

  async focusWindow(windowId: string): Promise<void> {
    return this.invoke<void>('focus-window', windowId);
  }

  async getWindows(): Promise<Array<{ id: string; title: string }>> {
    return this.invoke<Array<{ id: string; title: string }>>('get-windows');
  }

  // Events
  onStateChanged(
    callback: (data: { windowId: string; event: string; state: WindowState | null }) => void
  ): () => void {
    return this.on('state-changed', callback);
  }
}

export const windowIPCClient = new WindowIPCClient();
```

### useWindow Hook
```typescript
// renderer/modules/platform/infrastructure/ipc/use-window.ts
import { useState, useEffect, useCallback } from 'react';
import { windowIPCClient, type WindowState } from './window-ipc-client';

export function useWindow(windowId?: string) {
  const [state, setState] = useState<WindowState | null>(null);
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  useEffect(() => {
    // Load initial state
    windowIPCClient.getState(windowId).then(setState);
    windowIPCClient.getAlwaysOnTop(windowId).then(setIsAlwaysOnTop);

    // Listen for state changes
    const unsubscribe = windowIPCClient.onStateChanged((data) => {
      if (!windowId || data.windowId === windowId) {
        setState(data.state);
      }
    });

    return () => unsubscribe();
  }, [windowId]);

  const minimize = useCallback(() => {
    return windowIPCClient.minimize(windowId);
  }, [windowId]);

  const maximize = useCallback(() => {
    return windowIPCClient.maximize(windowId);
  }, [windowId]);

  const unmaximize = useCallback(() => {
    return windowIPCClient.unmaximize(windowId);
  }, [windowId]);

  const close = useCallback(() => {
    return windowIPCClient.close(windowId);
  }, [windowId]);

  const toggleMaximize = useCallback(() => {
    return windowIPCClient.toggleMaximize(windowId);
  }, [windowId]);

  const toggleFullScreen = useCallback(() => {
    return windowIPCClient.toggleFullScreen(windowId);
  }, [windowId]);

  const center = useCallback(() => {
    return windowIPCClient.center(windowId);
  }, [windowId]);

  const setAlwaysOnTop = useCallback(async (value: boolean) => {
    await windowIPCClient.setAlwaysOnTop(value, windowId);
    setIsAlwaysOnTop(value);
  }, [windowId]);

  return {
    state,
    isMaximized: state?.isMaximized ?? false,
    isFullScreen: state?.isFullScreen ?? false,
    isAlwaysOnTop,
    minimize,
    maximize,
    unmaximize,
    close,
    toggleMaximize,
    toggleFullScreen,
    center,
    setAlwaysOnTop,
  };
}

export function useWindowControls() {
  const { minimize, maximize, close, toggleMaximize, isMaximized } = useWindow();

  return {
    minimize,
    maximize,
    close,
    toggleMaximize,
    isMaximized,
  };
}
```

### Window Store
```typescript
// renderer/modules/platform/stores/window-store.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { windowIPCClient, type WindowState } from '../infrastructure/ipc';

interface WindowStoreState {
  currentWindowState: WindowState | null;
  isAlwaysOnTop: boolean;
  windows: Array<{ id: string; title: string }>;
  activeWindowId: string;
}

interface WindowStoreActions {
  initialize: () => Promise<void>;
  setWindowState: (state: WindowState | null) => void;
  setAlwaysOnTop: (value: boolean) => Promise<void>;
  loadWindows: () => Promise<void>;
  createWindow: (
    id: string,
    title: string,
    options?: { url?: string; width?: number; height?: number }
  ) => Promise<void>;
  closeWindow: (id: string) => Promise<void>;
  focusWindow: (id: string) => Promise<void>;
}

type WindowStore = WindowStoreState & WindowStoreActions;

export const useWindowStore = create<WindowStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        currentWindowState: null,
        isAlwaysOnTop: false,
        windows: [],
        activeWindowId: 'main',

        // Actions
        initialize: async () => {
          const state = await windowIPCClient.getState();
          const isAlwaysOnTop = await windowIPCClient.getAlwaysOnTop();
          const windows = await windowIPCClient.getWindows();

          set({
            currentWindowState: state,
            isAlwaysOnTop,
            windows,
          });

          // Listen for state changes
          windowIPCClient.onStateChanged((data) => {
            if (data.windowId === 'main') {
              set({ currentWindowState: data.state });
            }
            get().loadWindows();
          });
        },

        setWindowState: (state) => {
          set({ currentWindowState: state });
        },

        setAlwaysOnTop: async (value) => {
          await windowIPCClient.setAlwaysOnTop(value);
          set({ isAlwaysOnTop: value });
        },

        loadWindows: async () => {
          const windows = await windowIPCClient.getWindows();
          set({ windows });
        },

        createWindow: async (id, title, options = {}) => {
          await windowIPCClient.createWindow({
            id,
            title,
            ...options,
          });
          await get().loadWindows();
        },

        closeWindow: async (id) => {
          await windowIPCClient.closeWindow(id);
          await get().loadWindows();
        },

        focusWindow: async (id) => {
          await windowIPCClient.focusWindow(id);
          set({ activeWindowId: id });
        },
      }),
      {
        name: 'window-store',
        partialize: (state) => ({
          isAlwaysOnTop: state.isAlwaysOnTop,
        }),
      }
    )
  )
);
```

### Window Controls Component
```typescript
// renderer/modules/platform/presentation/components/WindowControls.tsx
import React from 'react';
import { useWindowControls } from '../../infrastructure/ipc';
import { Button } from '@dailyuse/ui';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { cn } from '@dailyuse/ui/lib/utils';

interface WindowControlsProps {
  className?: string;
  showLabels?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  className,
  showLabels = false,
}) => {
  const { minimize, toggleMaximize, close, isMaximized } = useWindowControls();

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        className
      )}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-accent"
        onClick={minimize}
        title="最小化"
      >
        <Minus className="w-4 h-4" />
        {showLabels && <span className="sr-only">最小化</span>}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-accent"
        onClick={toggleMaximize}
        title={isMaximized ? '还原' : '最大化'}
      >
        {isMaximized ? (
          <Square className="w-3.5 h-3.5" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
        {showLabels && <span className="sr-only">{isMaximized ? '还原' : '最大化'}</span>}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
        onClick={close}
        title="关闭"
      >
        <X className="w-4 h-4" />
        {showLabels && <span className="sr-only">关闭</span>}
      </Button>
    </div>
  );
};

// Title bar component with window controls
export const TitleBar: React.FC<{
  title?: string;
  className?: string;
}> = ({ title, className }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between h-8 px-2 bg-background border-b',
        className
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex-1 text-sm font-medium truncate">
        {title}
      </div>
      <WindowControls />
    </div>
  );
};
```

## 验收标准

- [ ] 窗口最小化、最大化、关闭正常
- [ ] 窗口状态正确记忆和恢复
- [ ] 多窗口创建和管理正常
- [ ] 窗口置顶功能正常
- [ ] 全屏切换正常
- [ ] 窗口位置/大小记忆正确
- [ ] UI 控件响应正确
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/platform/window-handler.ts`
- `renderer/modules/platform/infrastructure/ipc/window-ipc-client.ts`
- `renderer/modules/platform/infrastructure/ipc/use-window.ts`
- `renderer/modules/platform/stores/window-store.ts`
- `renderer/modules/platform/presentation/components/WindowControls.tsx`
