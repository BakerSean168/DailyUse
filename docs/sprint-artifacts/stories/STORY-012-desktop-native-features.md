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

## 📝 Task 分解

### Task 12.1: 系统托盘 (1 天)

**子任务**:
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
