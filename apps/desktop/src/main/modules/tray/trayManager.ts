/**
 * TrayManager
 *
 * Manages the application's system tray presence.
 * Handles the tray icon, context menu creation, window toggling behavior,
 * and "flash" notifications.
 *
 * @module modules/tray
 */

import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration options for the TrayManager.
 */
export interface TrayConfig {
  /** Path to the tray icon file. If not provided, a default platform-specific icon is used. */
  iconPath?: string;
  /** Tooltip text to show on hover. Defaults to "DailyUse". */
  tooltip?: string;
  /** Whether to hide the window instead of quitting when the close button is clicked. Defaults to true. */
  hideOnClose?: boolean;
}

/**
 * Class for managing the system tray.
 */
export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private config: TrayConfig;
  private isFlashing = false;
  private flashInterval: NodeJS.Timeout | null = null;
  private originalIcon: Electron.NativeImage | null = null;
  private emptyIcon: Electron.NativeImage | null = null;
  private isQuitting = false;

  /**
   * Creates an instance of TrayManager.
   *
   * @param {BrowserWindow} mainWindow - The main application window to control.
   * @param {TrayConfig} [config={}] - Configuration options.
   */
  constructor(mainWindow: BrowserWindow, config: TrayConfig = {}) {
    this.mainWindow = mainWindow;
    this.config = {
      tooltip: 'DailyUse',
      hideOnClose: true,
      ...config,
    };
  }

  /**
   * Initializes the system tray.
   * Sets up the icon, tooltip, context menu, and event listeners.
   */
  init(): void {
    // Determine icon path
    const iconPath = this.config.iconPath || this.getDefaultIconPath();
    this.originalIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    this.emptyIcon = nativeImage.createEmpty();

    this.tray = new Tray(this.originalIcon);
    this.tray.setToolTip(this.config.tooltip || 'DailyUse');
    this.tray.setContextMenu(this.createContextMenu());

    // Click handler
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    // Double-click handler
    this.tray.on('double-click', () => {
      this.showWindow();
    });

    // Setup close behavior
    if (this.config.hideOnClose) {
      this.setupHideOnClose();
    }
  }

  /**
   * Resolves the default icon path based on the operating system.
   *
   * @returns {string} The path to the default icon.
   */
  private getDefaultIconPath(): string {
    const platform = process.platform;
    const iconName = platform === 'win32' ? 'icon.ico' : 'icon.png';
    return path.join(__dirname, '..', '..', 'assets', iconName);
  }

  /**
   * Creates the context menu for the tray icon.
   *
   * @returns {Menu} The constructed Electron Menu.
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
   * Configures the window to hide instead of closing when the close button is clicked,
   * unless the application is explicitly quitting.
   */
  private setupHideOnClose(): void {
    // Listen for before-quit to know when to actually close
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
   * Shows and focuses the main window.
   */
  showWindow(): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * Hides the main window.
   */
  hideWindow(): void {
    this.mainWindow.hide();
  }

  /**
   * Toggles the visibility of the main window.
   */
  toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.hideWindow();
    } else {
      this.showWindow();
    }
  }

  /**
   * Starts flashing the tray icon (toggling between the icon and empty image).
   * Useful for alerting the user to notifications.
   *
   * @param {number} [interval=500] - The interval in milliseconds between flashes.
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
   * Stops the tray icon from flashing and restores the original icon.
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
   * Updates the tooltip text shown when hovering over the tray icon.
   *
   * @param {string} tooltip - The new tooltip text.
   */
  setTooltip(tooltip: string): void {
    if (this.tray) {
      this.tray.setToolTip(tooltip);
    }
  }

  /**
   * Updates the tray icon image.
   *
   * @param {string} iconPath - The path to the new icon image.
   */
  setIcon(iconPath: string): void {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
      this.originalIcon = icon;
      this.tray.setImage(icon);
    }
  }

  /**
   * Destroys the tray icon and cleans up resources.
   * Should be called when the application is quitting.
   */
  destroy(): void {
    this.stopFlashing();
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  /**
   * Checks if the tray has been initialized.
   *
   * @returns {boolean} True if initialized.
   */
  isInitialized(): boolean {
    return this.tray !== null;
  }
}

export default TrayManager;
