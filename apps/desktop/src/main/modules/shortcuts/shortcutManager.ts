/**
 * ShortcutManager
 *
 * 全局快捷键管理器
 * Story-012: Desktop Native Features
 */

import { globalShortcut, BrowserWindow, app } from 'electron';

export interface ShortcutConfig {
  accelerator: string;
  action: string;
  enabled: boolean;
  description?: string;
}

export interface ShortcutManagerConfig {
  shortcuts: ShortcutConfig[];
}

export class ShortcutManager {
  private mainWindow: BrowserWindow;
  private registeredShortcuts: Map<string, ShortcutConfig> = new Map();
  private defaultShortcuts: ShortcutConfig[] = [
    {
      accelerator: 'CommandOrControl+Shift+D',
      action: 'toggle-window',
      enabled: true,
      description: '显示/隐藏窗口',
    },
    {
      accelerator: 'CommandOrControl+Shift+N',
      action: 'quick-note',
      enabled: true,
      description: '快速记录',
    },
    {
      accelerator: 'CommandOrControl+Shift+T',
      action: 'today-tasks',
      enabled: true,
      description: '今日任务',
    },
    {
      accelerator: 'CommandOrControl+Shift+G',
      action: 'goals',
      enabled: true,
      description: '目标管理',
    },
  ];

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * 初始化快捷键
   */
  init(config?: ShortcutManagerConfig): void {
    const shortcuts = config?.shortcuts || this.defaultShortcuts;

    for (const shortcut of shortcuts) {
      if (shortcut.enabled) {
        this.register(shortcut);
      }
    }

    // 应用退出时注销所有快捷键
    app.on('will-quit', () => {
      this.unregisterAll();
    });
  }

  /**
   * 注册快捷键
   */
  register(config: ShortcutConfig): boolean {
    try {
      const success = globalShortcut.register(config.accelerator, () => {
        this.handleShortcut(config.action);
      });

      if (success) {
        this.registeredShortcuts.set(config.accelerator, config);
        console.log(`[ShortcutManager] Registered: ${config.accelerator} -> ${config.action}`);
      } else {
        console.warn(`[ShortcutManager] Failed to register: ${config.accelerator}`);
      }

      return success;
    } catch (error) {
      console.error(`[ShortcutManager] Error registering ${config.accelerator}:`, error);
      return false;
    }
  }

  /**
   * 注销快捷键
   */
  unregister(accelerator: string): void {
    if (this.registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator);
      this.registeredShortcuts.delete(accelerator);
      console.log(`[ShortcutManager] Unregistered: ${accelerator}`);
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    console.log('[ShortcutManager] Unregistered all shortcuts');
  }

  /**
   * 检查快捷键是否已注册
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * 获取所有已注册快捷键
   */
  getRegisteredShortcuts(): ShortcutConfig[] {
    return Array.from(this.registeredShortcuts.values());
  }

  /**
   * 获取所有快捷键（别名方法）
   */
  getShortcuts(): ShortcutConfig[] {
    return this.getRegisteredShortcuts();
  }

  /**
   * 获取默认快捷键
   */
  getDefaultShortcuts(): ShortcutConfig[] {
    return [...this.defaultShortcuts];
  }

  /**
   * 更新快捷键
   */
  updateShortcut(oldAccelerator: string, newConfig: ShortcutConfig): boolean {
    this.unregister(oldAccelerator);
    return this.register(newConfig);
  }

  /**
   * 处理快捷键动作
   */
  private handleShortcut(action: string): void {
    switch (action) {
      case 'toggle-window':
        this.toggleWindow();
        break;
      case 'quick-note':
        this.showWindowAndNavigate('/quick-note');
        break;
      case 'today-tasks':
        this.showWindowAndNavigate('/tasks/today');
        break;
      case 'goals':
        this.showWindowAndNavigate('/goals');
        break;
      default:
        // 发送自定义动作到渲染进程
        this.mainWindow.webContents.send('shortcut:action', action);
        break;
    }
  }

  /**
   * 切换窗口显示
   */
  private toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  /**
   * 显示窗口
   */
  private showWindow(): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * 显示窗口并导航
   */
  private showWindowAndNavigate(path: string): void {
    this.showWindow();
    this.mainWindow.webContents.send('navigate', path);
  }

  /**
   * 检测快捷键冲突
   */
  checkConflict(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.unregisterAll();
  }
}

export default ShortcutManager;
