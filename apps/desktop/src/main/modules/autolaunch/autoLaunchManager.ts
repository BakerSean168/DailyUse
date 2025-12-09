/**
 * AutoLaunchManager
 *
 * 开机自启动管理器
 * Story-012: Desktop Native Features
 */

import { app } from 'electron';

// auto-launch 是可选依赖，将在 init 中动态加载
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AutoLaunchClass: any = null;

export interface AutoLaunchConfig {
  name: string;
  isHidden?: boolean;
}

export class AutoLaunchManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private autoLauncher: any = null;
  private config: AutoLaunchConfig;
  private initialized = false;

  constructor(config?: Partial<AutoLaunchConfig>) {
    this.config = {
      name: config?.name || 'DailyUse',
      isHidden: config?.isHidden ?? true,
    };
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    // macOS 使用内置 API
    if (process.platform === 'darwin') {
      this.initialized = true;
      return;
    }

    // Windows/Linux 使用 auto-launch - 动态导入
    if (!AutoLaunchClass) {
      try {
        const autoLaunchModule = await import('auto-launch');
        AutoLaunchClass = autoLaunchModule.default || autoLaunchModule;
      } catch (error) {
        console.warn('[AutoLaunchManager] auto-launch module not available:', error);
        this.initialized = true;
        return;
      }
    }

    try {
      this.autoLauncher = new AutoLaunchClass({
        name: this.config.name,
        path: app.getPath('exe'),
        isHidden: this.config.isHidden,
      });
      this.initialized = true;
    } catch (error) {
      console.warn('[AutoLaunchManager] Failed to create AutoLaunch instance:', error);
      this.initialized = true;
    }
  }

  /**
   * 检查是否启用自启动
   */
  async isEnabled(): Promise<boolean> {
    if (process.platform === 'darwin') {
      const settings = app.getLoginItemSettings();
      return settings.openAtLogin;
    }

    if (!this.autoLauncher) {
      return false;
    }

    try {
      return await this.autoLauncher.isEnabled();
    } catch (error) {
      console.error('[AutoLaunchManager] Error checking status:', error);
      return false;
    }
  }

  /**
   * 启用自启动
   */
  async enable(): Promise<boolean> {
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin: true,
        openAsHidden: this.config.isHidden,
      });
      return true;
    }

    if (!this.autoLauncher) {
      return false;
    }

    try {
      await this.autoLauncher.enable();
      console.log('[AutoLaunchManager] Auto-launch enabled');
      return true;
    } catch (error) {
      console.error('[AutoLaunchManager] Error enabling:', error);
      return false;
    }
  }

  /**
   * 禁用自启动
   */
  async disable(): Promise<boolean> {
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin: false,
      });
      return true;
    }

    if (!this.autoLauncher) {
      return false;
    }

    try {
      await this.autoLauncher.disable();
      console.log('[AutoLaunchManager] Auto-launch disabled');
      return true;
    } catch (error) {
      console.error('[AutoLaunchManager] Error disabling:', error);
      return false;
    }
  }

  /**
   * 切换自启动状态
   */
  async toggle(): Promise<boolean> {
    const isEnabled = await this.isEnabled();
    if (isEnabled) {
      return this.disable();
    } else {
      return this.enable();
    }
  }

  /**
   * 设置是否隐藏启动
   */
  setHidden(isHidden: boolean): void {
    this.config.isHidden = isHidden;

    if (process.platform === 'darwin') {
      const settings = app.getLoginItemSettings();
      if (settings.openAtLogin) {
        app.setLoginItemSettings({
          openAtLogin: true,
          openAsHidden: isHidden,
        });
      }
    }
  }
}

export default AutoLaunchManager;
