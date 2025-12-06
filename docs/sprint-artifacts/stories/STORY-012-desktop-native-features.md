# STORY-012: 桌面原生功能

## 📋 Story 概述

**Story ID**: STORY-012  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P1 (核心价值)  
**预估工时**: 3-4 天  
**状态**: 🔵 Ready for Dev  
**前置依赖**: STORY-002

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 应用能深度集成系统功能（托盘、快捷键、开机自启）  
**以便于** 获得原生桌面应用的使用体验  

---

## 📋 验收标准

### 功能验收 - 系统托盘

- [ ] 系统托盘图标
- [ ] 托盘右键菜单
- [ ] 托盘图标闪烁（有通知时）
- [ ] 点击托盘显示/隐藏窗口
- [ ] 关闭窗口最小化到托盘

### 功能验收 - 全局快捷键

- [ ] 快速记录快捷键（全局）
- [ ] 显示/隐藏窗口快捷键
- [ ] 自定义快捷键配置
- [ ] 快捷键冲突检测

### 功能验收 - 开机自启

- [ ] 开机自启动设置
- [ ] 启动时最小化选项
- [ ] 登录项管理（macOS）
- [ ] 注册表管理（Windows）

### 功能验收 - 其他原生功能

- [ ] 文件关联（打开特定文件类型）
- [ ] 深度链接（dailyuse:// 协议）
- [ ] 窗口状态记忆（位置、大小）

### 技术验收

- [ ] 跨平台兼容（Windows/macOS/Linux）
- [ ] 资源正确释放
- [ ] 优雅退出处理

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/
├── main/
│   ├── modules/
│   │   ├── tray/
│   │   │   └── trayManager.ts          # 托盘管理
│   │   ├── shortcuts/
│   │   │   └── shortcutManager.ts      # 快捷键管理
│   │   ├── autolaunch/
│   │   │   └── autoLaunchManager.ts    # 自启动管理
│   │   └── deeplink/
│   │       └── deeplinkHandler.ts      # 深度链接处理
│   │
│   └── shared/
│       └── windowState.ts              # 窗口状态管理
│
├── renderer/
│   └── views/
│       └── settings/
│           ├── GeneralSettingsView.vue  # 通用设置
│           ├── ShortcutSettingsView.vue # 快捷键设置
│           └── components/
│               ├── ShortcutRecorder.vue # 快捷键录制
│               └── AutoLaunchToggle.vue # 自启动开关
│
└── shared/
    └── composables/
        └── useAppSettings.ts            # 应用设置逻辑
```

### 托盘管理器

```typescript
// apps/desktop/src/main/modules/tray/trayManager.ts
import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'node:path';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private isFlashing = false;
  private flashInterval: NodeJS.Timeout | null = null;
  
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }
  
  init(): void {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    
    this.tray.setToolTip('DailyUse');
    this.tray.setContextMenu(this.createContextMenu());
    
    // 点击托盘图标
    this.tray.on('click', () => {
      this.toggleWindow();
    });
    
    // 双击托盘图标
    this.tray.on('double-click', () => {
      this.showWindow();
    });
  }
  
  private createContextMenu(): Menu {
    return Menu.buildFromTemplate([
      {
        label: '打开 DailyUse',
        click: () => this.showWindow(),
      },
      { type: 'separator' },
      {
        label: '快速记录',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          this.showWindow();
          this.mainWindow.webContents.send('action:quickNote');
        },
      },
      {
        label: '今日任务',
        click: () => {
          this.showWindow();
          this.mainWindow.webContents.send('navigate', '/tasks/today');
        },
      },
      { type: 'separator' },
      {
        label: '设置',
        click: () => {
          this.showWindow();
          this.mainWindow.webContents.send('navigate', '/settings');
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]);
  }
  
  private toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }
  
  private showWindow(): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
    this.stopFlash();
  }
  
  // 托盘图标闪烁
  startFlash(): void {
    if (this.isFlashing) return;
    
    this.isFlashing = true;
    const normalIcon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'tray-icon.png')
    );
    const alertIcon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'tray-icon-alert.png')
    );
    
    let isAlert = false;
    this.flashInterval = setInterval(() => {
      isAlert = !isAlert;
      this.tray?.setImage(isAlert ? alertIcon : normalIcon);
    }, 500);
  }
  
  stopFlash(): void {
    if (!this.isFlashing) return;
    
    this.isFlashing = false;
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    
    const normalIcon = nativeImage.createFromPath(
      path.join(__dirname, 'assets', 'tray-icon.png')
    );
    this.tray?.setImage(normalIcon);
  }
  
  destroy(): void {
    this.stopFlash();
    this.tray?.destroy();
    this.tray = null;
  }
}
```

### 快捷键管理器

```typescript
// apps/desktop/src/main/modules/shortcuts/shortcutManager.ts
import { globalShortcut, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';

interface ShortcutConfig {
  quickNote: string;
  toggleWindow: string;
  [key: string]: string;
}

const defaultShortcuts: ShortcutConfig = {
  quickNote: 'CmdOrCtrl+Shift+N',
  toggleWindow: 'CmdOrCtrl+Shift+D',
};

export class ShortcutManager {
  private mainWindow: BrowserWindow;
  private store: Store<{ shortcuts: ShortcutConfig }>;
  private registeredShortcuts: string[] = [];
  
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.store = new Store({
      defaults: { shortcuts: defaultShortcuts },
    });
  }
  
  init(): void {
    this.registerAllShortcuts();
    this.setupIpcHandlers();
  }
  
  private registerAllShortcuts(): void {
    const shortcuts = this.store.get('shortcuts');
    
    // 快速记录
    this.registerShortcut(shortcuts.quickNote, () => {
      this.showWindowAndEmit('action:quickNote');
    });
    
    // 显示/隐藏窗口
    this.registerShortcut(shortcuts.toggleWindow, () => {
      if (this.mainWindow.isVisible()) {
        this.mainWindow.hide();
      } else {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });
  }
  
  private registerShortcut(accelerator: string, callback: () => void): boolean {
    try {
      const success = globalShortcut.register(accelerator, callback);
      if (success) {
        this.registeredShortcuts.push(accelerator);
      }
      return success;
    } catch (error) {
      console.error(`Failed to register shortcut: ${accelerator}`, error);
      return false;
    }
  }
  
  private showWindowAndEmit(action: string): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
    this.mainWindow.webContents.send(action);
  }
  
  private setupIpcHandlers(): void {
    // 获取快捷键配置
    ipcMain.handle('shortcuts:get', () => {
      return this.store.get('shortcuts');
    });
    
    // 更新快捷键
    ipcMain.handle('shortcuts:update', (_, { key, accelerator }) => {
      // 检查冲突
      const shortcuts = this.store.get('shortcuts');
      const conflict = Object.entries(shortcuts).find(
        ([k, v]) => k !== key && v === accelerator
      );
      
      if (conflict) {
        return { success: false, error: `与 "${conflict[0]}" 冲突` };
      }
      
      // 注销旧快捷键
      const oldAccelerator = shortcuts[key];
      if (oldAccelerator) {
        globalShortcut.unregister(oldAccelerator);
        this.registeredShortcuts = this.registeredShortcuts.filter(
          s => s !== oldAccelerator
        );
      }
      
      // 注册新快捷键
      const success = globalShortcut.register(accelerator, () => {
        this.handleShortcut(key);
      });
      
      if (success) {
        shortcuts[key] = accelerator;
        this.store.set('shortcuts', shortcuts);
        this.registeredShortcuts.push(accelerator);
        return { success: true };
      }
      
      return { success: false, error: '快捷键无效或被占用' };
    });
    
    // 重置快捷键
    ipcMain.handle('shortcuts:reset', () => {
      this.unregisterAll();
      this.store.set('shortcuts', defaultShortcuts);
      this.registerAllShortcuts();
      return { success: true };
    });
  }
  
  private handleShortcut(key: string): void {
    switch (key) {
      case 'quickNote':
        this.showWindowAndEmit('action:quickNote');
        break;
      case 'toggleWindow':
        if (this.mainWindow.isVisible()) {
          this.mainWindow.hide();
        } else {
          this.mainWindow.show();
          this.mainWindow.focus();
        }
        break;
    }
  }
  
  unregisterAll(): void {
    for (const accelerator of this.registeredShortcuts) {
      globalShortcut.unregister(accelerator);
    }
    this.registeredShortcuts = [];
  }
  
  destroy(): void {
    this.unregisterAll();
  }
}
```

### 自启动管理器

```typescript
// apps/desktop/src/main/modules/autolaunch/autoLaunchManager.ts
import { app, ipcMain } from 'electron';

export class AutoLaunchManager {
  private isEnabled = false;
  
  constructor() {
    this.isEnabled = app.getLoginItemSettings().openAtLogin;
  }
  
  init(): void {
    this.setupIpcHandlers();
  }
  
  private setupIpcHandlers(): void {
    // 获取自启动状态
    ipcMain.handle('autolaunch:get', () => {
      return app.getLoginItemSettings().openAtLogin;
    });
    
    // 设置自启动
    ipcMain.handle('autolaunch:set', (_, enabled: boolean) => {
      try {
        app.setLoginItemSettings({
          openAtLogin: enabled,
          openAsHidden: true, // macOS: 启动时隐藏
          args: ['--minimized'], // 传递参数用于判断
        });
        
        this.isEnabled = enabled;
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }
  
  isAutoLaunchEnabled(): boolean {
    return this.isEnabled;
  }
}
```

### 窗口状态管理

```typescript
// apps/desktop/src/main/shared/windowState.ts
import { BrowserWindow, screen } from 'electron';
import Store from 'electron-store';

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

const defaultState: WindowState = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
  isMaximized: false,
};

export class WindowStateManager {
  private store: Store<{ windowState: WindowState }>;
  private state: WindowState;
  private window: BrowserWindow | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    this.store = new Store({
      defaults: { windowState: defaultState },
    });
    this.state = this.loadState();
  }
  
  private loadState(): WindowState {
    const state = this.store.get('windowState');
    
    // 验证窗口是否在可见屏幕内
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(display => {
      const { x, y, width, height } = display.workArea;
      return (
        state.x >= x &&
        state.y >= y &&
        state.x + state.width <= x + width &&
        state.y + state.height <= y + height
      );
    });
    
    if (!isVisible) {
      return defaultState;
    }
    
    return state;
  }
  
  getState(): WindowState {
    return { ...this.state };
  }
  
  track(window: BrowserWindow): void {
    this.window = window;
    
    const saveState = () => {
      if (!this.window) return;
      
      // 防抖
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      
      this.saveTimeout = setTimeout(() => {
        if (!this.window) return;
        
        const bounds = this.window.getBounds();
        this.state = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isMaximized: this.window.isMaximized(),
        };
        
        this.store.set('windowState', this.state);
      }, 500);
    };
    
    window.on('resize', saveState);
    window.on('move', saveState);
    window.on('close', saveState);
  }
  
    untrack(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.window = null;
  }
}
```

---

## 🏗️ 技术实现方案 (架构师补充)

> 本节由架构师 Agent 补充，提供详细技术实现指导

### 1. IPC 通道与服务映射 (12 通道)

#### 托盘模块 (3 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `tray:getStatus` | TrayManager.getStatus() | 获取托盘状态 |
| `tray:setBadge` | TrayManager.setBadge() | 设置角标数字 |
| `tray:flash` | TrayManager.flash() | 闪烁提醒 |

#### 快捷键模块 (4 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `shortcuts:get` | ShortcutManager.getShortcuts() | 获取配置 |
| `shortcuts:update` | ShortcutManager.updateShortcut() | 更新单个 |
| `shortcuts:reset` | ShortcutManager.reset() | 重置默认 |
| `shortcuts:available` | ShortcutManager.isAvailable() | 检查占用 |

#### 自启动模块 (2 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `autolaunch:get` | AutoLaunchManager.isEnabled() | 获取状态 |
| `autolaunch:set` | AutoLaunchManager.setEnabled() | 设置启用 |

#### 窗口控制 (3 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `window:minimize` | WindowController.minimize() | 最小化 |
| `window:maximize` | WindowController.toggleMaximize() | 切换最大化 |
| `window:close` | WindowController.close() | 关闭(->托盘) |

### 2. 主进程事件 (Push to Renderer)

| 事件名 | 数据 | 触发场景 |
|-------|------|---------|
| `action:quickNote` | void | 快捷键触发快速记录 |
| `action:showWindow` | void | 托盘点击显示窗口 |
| `deeplink:open` | `{ url: string }` | 深度链接触发 |
| `tray:menu-click` | `{ action: string }` | 托盘菜单点击 |

### 3. 跨平台差异处理

```typescript
// apps/desktop/src/main/shared/platform.ts

export const platform = {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
};

// 托盘图标路径
export function getTrayIconPath(hasNotification = false): string {
  const iconName = hasNotification ? 'tray-alert' : 'tray';
  
  if (platform.isWindows) {
    return path.join(__dirname, `../resources/${iconName}.ico`);
  } else if (platform.isMac) {
    // macOS Template 图标自动适应暗色模式
    return path.join(__dirname, `../resources/${iconName}Template.png`);
  } else {
    return path.join(__dirname, `../resources/${iconName}.png`);
  }
}

// 自启动配置
export function getLoginItemSettings(enabled: boolean) {
  const settings: Electron.Settings = {
    openAtLogin: enabled,
    openAsHidden: true,
  };

  if (platform.isMac) {
    // macOS 特有
    settings.path = app.getPath('exe');
  }

  if (platform.isWindows) {
    // Windows: 传递启动参数
    settings.args = ['--minimized'];
  }

  return settings;
}

// 快捷键格式化
export function formatAccelerator(accelerator: string): string {
  if (platform.isMac) {
    return accelerator
      .replace('CommandOrControl', '⌘')
      .replace('Shift', '⇧')
      .replace('Alt', '⌥')
      .replace('Ctrl', '⌃');
  }
  return accelerator.replace('CommandOrControl', 'Ctrl');
}
```

### 4. 深度链接处理

```typescript
// apps/desktop/src/main/modules/deeplink/deeplinkHandler.ts
import { app, BrowserWindow } from 'electron';

const PROTOCOL = 'dailyuse';

export class DeepLinkHandler {
  private mainWindow: BrowserWindow | null = null;
  private pendingUrl: string | null = null;

  constructor(window: BrowserWindow) {
    this.mainWindow = window;
    this.register();
  }

  private register(): void {
    // 注册协议 (开发模式需要)
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
          path.resolve(process.argv[1]),
        ]);
      }
    } else {
      app.setAsDefaultProtocolClient(PROTOCOL);
    }

    // macOS: 通过 open-url 事件
    app.on('open-url', (event, url) => {
      event.preventDefault();
      this.handleUrl(url);
    });

    // Windows/Linux: 检查启动参数
    const argv = process.argv;
    const url = argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (url) {
      this.handleUrl(url);
    }

    // Windows: 单实例锁定时的第二实例
    app.on('second-instance', (_, argv) => {
      const url = argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
      if (url) {
        this.handleUrl(url);
      }
    });
  }

  private handleUrl(url: string): void {
    // 解析 URL: dailyuse://action/param
    // 例如: dailyuse://goal/123
    //       dailyuse://quick-note
    //       dailyuse://schedule/today

    const parsed = new URL(url);
    const action = parsed.hostname;
    const params = parsed.pathname.slice(1); // 移除前导 /

    if (!this.mainWindow) {
      this.pendingUrl = url;
      return;
    }

    // 显示窗口
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();

    // 发送到 Renderer
    this.mainWindow.webContents.send('deeplink:open', {
      action,
      params,
      url,
    });
  }

  processPending(): void {
    if (this.pendingUrl) {
      this.handleUrl(this.pendingUrl);
      this.pendingUrl = null;
    }
  }
}

// Renderer 侧处理
// apps/desktop/src/renderer/plugins/deeplink.ts
export function setupDeepLinkHandler(router: Router) {
  window.electronAPI.on('deeplink:open', (_, data) => {
    const { action, params } = data;
    
    switch (action) {
      case 'goal':
        router.push(`/goals/${params}`);
        break;
      case 'task':
        router.push(`/tasks/${params}`);
        break;
      case 'schedule':
        if (params === 'today') {
          router.push('/schedule?view=day');
        } else {
          router.push(`/schedule/${params}`);
        }
        break;
      case 'quick-note':
        // 打开快速记录弹窗
        eventBus.emit('open:quick-note');
        break;
      default:
        console.warn('Unknown deep link action:', action);
    }
  });
}
```

### 5. 主进程初始化顺序

```typescript
// apps/desktop/src/main/main.ts
import { app, BrowserWindow } from 'electron';
import { TrayManager } from './modules/tray/trayManager';
import { ShortcutManager } from './modules/shortcuts/shortcutManager';
import { AutoLaunchManager } from './modules/autolaunch/autoLaunchManager';
import { DeepLinkHandler } from './modules/deeplink/deeplinkHandler';
import { WindowStateManager } from './shared/windowState';

let mainWindow: BrowserWindow | null = null;
let trayManager: TrayManager | null = null;
let shortcutManager: ShortcutManager | null = null;
let autoLaunchManager: AutoLaunchManager | null = null;
let deepLinkHandler: DeepLinkHandler | null = null;
let windowStateManager: WindowStateManager | null = null;

// 单实例锁定
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('ready', async () => {
  // 1. 恢复窗口状态
  windowStateManager = new WindowStateManager();
  const windowState = windowStateManager.getState();
  
  // 2. 创建主窗口
  mainWindow = new BrowserWindow({
    ...windowState,
    show: false, // 等待 ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  
  // 3. 跟踪窗口状态
  windowStateManager.track(mainWindow);
  
  // 4. 加载内容
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
  } else {
    await mainWindow.loadFile('dist/index.html');
  }
  
  // 5. 初始化原生模块 (窗口创建后)
  trayManager = new TrayManager(mainWindow);
  trayManager.init();
  
  shortcutManager = new ShortcutManager(mainWindow);
  shortcutManager.init();
  
  autoLaunchManager = new AutoLaunchManager();
  autoLaunchManager.init();
  
  deepLinkHandler = new DeepLinkHandler(mainWindow);
  
  // 6. 显示窗口
  mainWindow.once('ready-to-show', () => {
    // 检查是否以最小化模式启动
    const startMinimized = process.argv.includes('--minimized');
    
    if (!startMinimized) {
      mainWindow!.show();
      if (windowState.isMaximized) {
        mainWindow!.maximize();
      }
    }
    
    // 处理启动时的深度链接
    deepLinkHandler?.processPending();
  });
});

// 优雅退出
app.on('before-quit', () => {
  shortcutManager?.destroy();
  trayManager?.destroy();
  windowStateManager?.untrack();
});

app.on('window-all-closed', () => {
  // macOS 保持运行
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 6. 托盘图标资源规范

| 平台 | 文件名 | 尺寸 | 格式 |
|------|-------|------|------|
| Windows | tray.ico | 16x16, 32x32, 48x48 | ICO |
| macOS | trayTemplate.png | 16x16, 32x32 (@2x) | PNG (黑色) |
| macOS | trayTemplate@2x.png | 32x32 | PNG (黑色) |
| Linux | tray.png | 22x22, 24x24 | PNG |

> **macOS Template 图标**: 必须使用纯黑色 + 透明背景，系统自动根据暗色/亮色模式调整颜色

### 7. Renderer 侧设置界面

```typescript
// apps/desktop/src/renderer/composables/useDesktopSettings.ts
import { ref, onMounted } from 'vue';

interface DesktopSettings {
  autoLaunch: boolean;
  minimizeToTray: boolean;
  shortcuts: Record<string, string>;
}

export function useDesktopSettings() {
  const autoLaunch = ref(false);
  const minimizeToTray = ref(true);
  const shortcuts = ref<Record<string, string>>({});
  const isLoading = ref(false);
  
  async function loadSettings() {
    isLoading.value = true;
    try {
      const [autoLaunchEnabled, shortcutConfig] = await Promise.all([
        window.electronAPI.invoke<boolean>('autolaunch:get'),
        window.electronAPI.invoke<Record<string, string>>('shortcuts:get'),
      ]);
      
      autoLaunch.value = autoLaunchEnabled;
      shortcuts.value = shortcutConfig;
    } finally {
      isLoading.value = false;
    }
  }
  
  async function setAutoLaunch(enabled: boolean) {
    const result = await window.electronAPI.invoke<{ success: boolean }>('autolaunch:set', enabled);
    if (result.success) {
      autoLaunch.value = enabled;
    }
    return result;
  }
  
  async function updateShortcut(key: string, accelerator: string) {
    const result = await window.electronAPI.invoke<{ success: boolean; error?: string }>(
      'shortcuts:update',
      { key, accelerator }
    );
    if (result.success) {
      shortcuts.value[key] = accelerator;
    }
    return result;
  }
  
  async function resetShortcuts() {
    const result = await window.electronAPI.invoke<{ success: boolean }>('shortcuts:reset');
    if (result.success) {
      await loadSettings();
    }
    return result;
  }
  
  onMounted(loadSettings);
  
  return {
    autoLaunch,
    minimizeToTray,
    shortcuts,
    isLoading,
    setAutoLaunch,
    updateShortcut,
    resetShortcuts,
  };
}
```

---

## 📝 Task 分解

### Task 12.1: 系统托盘 (1 天)**子任务**:
- [ ] 实现 TrayManager
- [ ] 托盘菜单配置
- [ ] 托盘图标资源
- [ ] 托盘交互逻辑
- [ ] 关闭最小化到托盘

### Task 12.2: 全局快捷键 (1 天)

**子任务**:
- [ ] 实现 ShortcutManager
- [ ] 注册 shortcuts IPC handlers
- [ ] 创建 ShortcutSettingsView.vue
- [ ] 创建 ShortcutRecorder.vue
- [ ] 快捷键冲突检测

### Task 12.3: 开机自启动 (0.5 天)

**子任务**:
- [ ] 实现 AutoLaunchManager
- [ ] 注册 autolaunch IPC handlers
- [ ] 创建 AutoLaunchToggle.vue
- [ ] 启动参数处理（--minimized）

### Task 12.4: 窗口状态与其他 (0.5-1 天)

**子任务**:
- [ ] 实现 WindowStateManager
- [ ] 窗口位置/大小记忆
- [ ] 深度链接处理（dailyuse://）
- [ ] 优雅退出流程

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-002 (主进程基础设施)

### 后续影响

- 🔜 原生体验提升
- 🔜 用户留存

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 跨平台兼容性 | 中 | 高 | 平台特定代码分支 |
| 快捷键冲突 | 中 | 低 | 冲突检测 + 提示 |
| 托盘图标模糊 | 低 | 低 | 多分辨率图标 |

---

## 🎨 资源需求

### 图标资源

- `tray-icon.png` - 托盘图标（16x16, 32x32）
- `tray-icon-alert.png` - 通知状态托盘图标
- 各平台适配（Windows .ico, macOS .icns）

---

## ✅ 完成定义 (DoD)

- [ ] 托盘功能正常（Windows/macOS/Linux）
- [ ] 快捷键注册/自定义正常
- [ ] 开机自启功能正常
- [ ] 窗口状态记忆正常
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 2 (Week 4-5)
