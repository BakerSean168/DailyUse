/**
 * TrayManager
 *
 * 系统托盘管理器
 * Story-012: Desktop Native Features
 */

import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM 兼容的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TrayConfig {
  iconPath?: string;
  tooltip?: string;
  hideOnClose?: boolean;
}

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private config: TrayConfig;
  private isFlashing = false;
  private flashInterval: NodeJS.Timeout | null = null;
  private originalIcon: Electron.NativeImage | null = null;
  private emptyIcon: Electron.NativeImage | null = null;
  private isQuitting = false;

  constructor(mainWindow: BrowserWindow, config: TrayConfig = {}) {
    this.mainWindow = mainWindow;
    this.config = {
      tooltip: 'DailyUse',
      hideOnClose: true,
      ...config,
    };
  }

  /**
   * 初始化托盘
   */
  init(): void {
    // 获取图标路径
    const iconPath = this.config.iconPath || this.getDefaultIconPath();
    this.originalIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    this.emptyIcon = nativeImage.createEmpty();

    this.tray = new Tray(this.originalIcon);
    this.tray.setToolTip(this.config.tooltip || 'DailyUse');
    this.tray.setContextMenu(this.createContextMenu());

    // 点击托盘图标
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    // 双击托盘图标
    this.tray.on('double-click', () => {
      this.showWindow();
    });

    // 设置关闭行为
    if (this.config.hideOnClose) {
      this.setupHideOnClose();
    }
  }

  /**
   * 获取默认图标路径
   */
  private getDefaultIconPath(): string {
    // 根据平台选择不同的图标
    const platform = process.platform;
    const iconName = platform === 'win32' ? 'icon.ico' : 'icon.png';
    return path.join(__dirname, '..', '..', 'assets', iconName);
  }

  /**
   * 创建托盘菜单
   */
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
          this.destroy();
          app.quit();
        },
      },
    ]);
  }

  /**
   * 设置关闭时隐藏到托盘
   */
  private setupHideOnClose(): void {
    // 监听 before-quit 事件来标记正在退出
    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });
  }

  /**
   * 显示窗口
   */
  showWindow(): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * 隐藏窗口
   */
  hideWindow(): void {
    this.mainWindow.hide();
  }

  /**
   * 切换窗口显示/隐藏
   */
  toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.hideWindow();
    } else {
      this.showWindow();
    }
  }

  /**
   * 开始闪烁（有通知时）
   */
  startFlashing(interval = 500): void {
    if (this.isFlashing || !this.tray) return;

    this.isFlashing = true;
    let showIcon = true;

    this.flashInterval = setInterval(() => {
      if (!this.tray || !this.originalIcon || !this.emptyIcon) return;
      showIcon = !showIcon;
      this.tray.setImage(showIcon ? this.originalIcon : this.emptyIcon);
    }, interval);
  }

  /**
   * 停止闪烁
   */
  stopFlashing(): void {
    if (!this.isFlashing) return;

    this.isFlashing = false;
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }

    if (this.tray && this.originalIcon) {
      this.tray.setImage(this.originalIcon);
    }
  }

  /**
   * 设置托盘提示文字
   */
  setTooltip(tooltip: string): void {
    if (this.tray) {
      this.tray.setToolTip(tooltip);
    }
  }

  /**
   * 更新托盘图标
   */
  setIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      this.originalIcon = icon;
      this.tray.setImage(icon);
    }
  }

  /**
   * 销毁托盘
   */
  destroy(): void {
    this.stopFlashing();
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  /**
   * 是否已初始化
   */
  isInitialized(): boolean {
    return this.tray !== null;
  }
}

export default TrayManager;
