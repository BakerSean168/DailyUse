/**
 * WindowStateManager
 *
 * 窗口状态管理器 - 记忆窗口位置和大小
 * Story-012: Desktop Native Features
 */

import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface WindowStateConfig {
  defaultWidth?: number;
  defaultHeight?: number;
  file?: string;
}

export class WindowStateManager {
  private state: WindowState;
  private stateFilePath: string;
  private window: BrowserWindow | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(config: WindowStateConfig = {}) {
    const defaultWidth = config.defaultWidth || 1200;
    const defaultHeight = config.defaultHeight || 800;
    const fileName = config.file || 'window-state.json';

    this.stateFilePath = path.join(app.getPath('userData'), fileName);
    this.state = this.loadState() || {
      width: defaultWidth,
      height: defaultHeight,
      isMaximized: false,
      isFullScreen: false,
    };

    // 确保窗口在可见屏幕范围内
    this.ensureVisibleOnScreen();
  }

  /**
   * 加载保存的状态
   */
  private loadState(): WindowState | null {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[WindowStateManager] Failed to load state:', error);
    }
    return null;
  }

  /**
   * 保存状态
   */
  private saveState(): void {
    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[WindowStateManager] Failed to save state:', error);
    }
  }

  /**
   * 确保窗口在可见屏幕范围内
   */
  private ensureVisibleOnScreen(): void {
    if (this.state.x === undefined || this.state.y === undefined) {
      return;
    }

    const displays = screen.getAllDisplays();
    let isVisible = false;

    for (const display of displays) {
      const bounds = display.bounds;
      if (
        this.state.x >= bounds.x &&
        this.state.y >= bounds.y &&
        this.state.x < bounds.x + bounds.width &&
        this.state.y < bounds.y + bounds.height
      ) {
        isVisible = true;
        break;
      }
    }

    if (!isVisible) {
      // 重置位置到主屏幕中心
      delete this.state.x;
      delete this.state.y;
    }
  }

  /**
   * 获取窗口状态
   */
  getState(): WindowState {
    return { ...this.state };
  }

  /**
   * 绑定窗口
   */
  manage(window: BrowserWindow): void {
    this.window = window;

    // 恢复最大化/全屏状态
    if (this.state.isMaximized) {
      window.maximize();
    }
    if (this.state.isFullScreen) {
      window.setFullScreen(true);
    }

    // 监听窗口事件
    window.on('resize', () => this.scheduleUpdate());
    window.on('move', () => this.scheduleUpdate());
    window.on('maximize', () => this.scheduleUpdate());
    window.on('unmaximize', () => this.scheduleUpdate());
    window.on('enter-full-screen', () => this.scheduleUpdate());
    window.on('leave-full-screen', () => this.scheduleUpdate());
    window.on('close', () => this.saveState());
  }

  /**
   * 延迟更新状态（避免频繁写入）
   */
  private scheduleUpdate(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.updateState(), 100);
  }

  /**
   * 更新状态
   */
  private updateState(): void {
    if (!this.window) return;

    const isMaximized = this.window.isMaximized();
    const isFullScreen = this.window.isFullScreen();

    // 只在非最大化/非全屏时记录尺寸和位置
    if (!isMaximized && !isFullScreen) {
      const bounds = this.window.getBounds();
      this.state.x = bounds.x;
      this.state.y = bounds.y;
      this.state.width = bounds.width;
      this.state.height = bounds.height;
    }

    this.state.isMaximized = isMaximized;
    this.state.isFullScreen = isFullScreen;
  }

  /**
   * 重置状态
   */
  reset(): void {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        fs.unlinkSync(this.stateFilePath);
      }
    } catch (error) {
      console.error('[WindowStateManager] Failed to reset state:', error);
    }
  }
}

export default WindowStateManager;
