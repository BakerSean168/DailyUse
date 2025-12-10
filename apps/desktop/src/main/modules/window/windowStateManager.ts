/**
 * WindowStateManager
 *
 * Manages the persistence of the application window's state (size, position, maximized, fullscreen).
 * Ensures the window restores to its previous location and stays within visible screen bounds.
 *
 * @module modules/window
 */

import { app, BrowserWindow, screen } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Represents the saved state of a window.
 */
export interface WindowState {
  /** X coordinate of the window. */
  x?: number;
  /** Y coordinate of the window. */
  y?: number;
  /** Window width in pixels. */
  width: number;
  /** Window height in pixels. */
  height: number;
  /** Whether the window is maximized. */
  isMaximized: boolean;
  /** Whether the window is in full-screen mode. */
  isFullScreen: boolean;
}

/**
 * Configuration options for the WindowStateManager.
 */
export interface WindowStateConfig {
  /** Default window width if no state is saved. */
  defaultWidth?: number;
  /** Default window height if no state is saved. */
  defaultHeight?: number;
  /** Filename for storing the state JSON. Defaults to 'window-state.json'. */
  file?: string;
}

/**
 * Class for managing window state persistence.
 */
export class WindowStateManager {
  private state: WindowState;
  private stateFilePath: string;
  private window: BrowserWindow | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Creates an instance of WindowStateManager.
   * Loads existing state from disk if available, otherwise initializes defaults.
   *
   * @param {WindowStateConfig} [config={}] - Configuration options.
   */
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

    // Ensure the window is within the visible area of any screen
    this.ensureVisibleOnScreen();
  }

  /**
   * Loads the saved window state from the JSON file.
   *
   * @returns {WindowState | null} The loaded state or null if not found/invalid.
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
   * Saves the current window state to the JSON file.
   */
  private saveState(): void {
    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('[WindowStateManager] Failed to save state:', error);
    }
  }

  /**
   * Checks if the saved window coordinates are visible on any currently connected display.
   * If not (e.g., monitor disconnected), resets coordinates to center.
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
      // Reset to default positioning (usually center)
      delete this.state.x;
      delete this.state.y;
    }
  }

  /**
   * Retrieves the current window state configuration.
   *
   * @returns {WindowState} The current state.
   */
  getState(): WindowState {
    return { ...this.state };
  }

  /**
   * Attaches the manager to a BrowserWindow instance.
   * Restores the window's state and sets up listeners for state changes.
   *
   * @param {BrowserWindow} window - The window to manage.
   */
  manage(window: BrowserWindow): void {
    this.window = window;

    // Restore maximized/fullscreen state
    if (this.state.isMaximized) {
      window.maximize();
    }
    if (this.state.isFullScreen) {
      window.setFullScreen(true);
    }

    // Listen for window events to update state
    window.on('resize', () => this.scheduleUpdate());
    window.on('move', () => this.scheduleUpdate());
    window.on('maximize', () => this.scheduleUpdate());
    window.on('unmaximize', () => this.scheduleUpdate());
    window.on('enter-full-screen', () => this.scheduleUpdate());
    window.on('leave-full-screen', () => this.scheduleUpdate());
    window.on('close', () => this.saveState());
  }

  /**
   * Schedules a state update with a debounce to avoid frequent writes during resizing/moving.
   */
  private scheduleUpdate(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.updateState(), 100);
  }

  /**
   * Updates the internal state object based on the current window properties.
   */
  private updateState(): void {
    if (!this.window) return;

    const isMaximized = this.window.isMaximized();
    const isFullScreen = this.window.isFullScreen();

    // Only update position/size if not maximized or fullscreen
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
   * Deletes the saved state file, effectively resetting the window state to defaults on next launch.
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
