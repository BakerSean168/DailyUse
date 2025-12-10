/**
 * ShortcutManager
 *
 * Manages global keyboard shortcuts for the application using Electron's `globalShortcut` module.
 * Allows registering, unregistering, and handling predefined system-wide hotkeys.
 *
 * @module modules/shortcuts
 */

import { globalShortcut, BrowserWindow, app } from 'electron';

/**
 * Configuration for a single shortcut.
 */
export interface ShortcutConfig {
  /** The key combination (e.g., 'CommandOrControl+Shift+D'). */
  accelerator: string;
  /** The internal action identifier associated with this shortcut. */
  action: string;
  /** Whether the shortcut is active. */
  enabled: boolean;
  /** Human-readable description of the shortcut's function. */
  description?: string;
}

/**
 * Configuration object for initializing the ShortcutManager.
 */
export interface ShortcutManagerConfig {
  /** List of shortcuts to register on initialization. */
  shortcuts: ShortcutConfig[];
}

/**
 * Class for managing global application shortcuts.
 */
export class ShortcutManager {
  private mainWindow: BrowserWindow;
  private registeredShortcuts: Map<string, ShortcutConfig> = new Map();
  private defaultShortcuts: ShortcutConfig[] = [
    {
      accelerator: 'CommandOrControl+Shift+D',
      action: 'toggle-window',
      enabled: true,
      description: 'Show/Hide Window',
    },
    {
      accelerator: 'CommandOrControl+Shift+N',
      action: 'quick-note',
      enabled: true,
      description: 'Quick Note',
    },
    {
      accelerator: 'CommandOrControl+Shift+T',
      action: 'today-tasks',
      enabled: true,
      description: 'Today Tasks',
    },
    {
      accelerator: 'CommandOrControl+Shift+G',
      action: 'goals',
      enabled: true,
      description: 'Goal Management',
    },
  ];

  /**
   * Creates an instance of ShortcutManager.
   *
   * @param {BrowserWindow} mainWindow - The main application window (target for actions).
   */
  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Initializes the shortcut manager, registering default or provided shortcuts.
   * Automatically unregisters shortcuts when the app quits.
   *
   * @param {ShortcutManagerConfig} [config] - Optional configuration overrides.
   */
  init(config?: ShortcutManagerConfig): void {
    const shortcuts = config?.shortcuts || this.defaultShortcuts;

    for (const shortcut of shortcuts) {
      if (shortcut.enabled) {
        this.register(shortcut);
      }
    }

    // Unregister all shortcuts when app quits to avoid conflicts
    app.on('will-quit', () => {
      this.unregisterAll();
    });
  }

  /**
   * Registers a global shortcut.
   *
   * @param {ShortcutConfig} config - The shortcut configuration.
   * @returns {boolean} True if registration was successful, false otherwise.
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
   * Unregisters a specific global shortcut.
   *
   * @param {string} accelerator - The key combination to unregister.
   */
  unregister(accelerator: string): void {
    if (this.registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator);
      this.registeredShortcuts.delete(accelerator);
      console.log(`[ShortcutManager] Unregistered: ${accelerator}`);
    }
  }

  /**
   * Unregisters all registered global shortcuts.
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
    console.log('[ShortcutManager] Unregistered all shortcuts');
  }

  /**
   * Checks if a specific accelerator is currently registered.
   *
   * @param {string} accelerator - The key combination.
   * @returns {boolean} True if registered.
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Retrieves all currently registered shortcuts managed by this instance.
   *
   * @returns {ShortcutConfig[]} List of active shortcut configurations.
   */
  getRegisteredShortcuts(): ShortcutConfig[] {
    return Array.from(this.registeredShortcuts.values());
  }

  /**
   * Alias for `getRegisteredShortcuts`.
   *
   * @returns {ShortcutConfig[]} List of active shortcuts.
   */
  getShortcuts(): ShortcutConfig[] {
    return this.getRegisteredShortcuts();
  }

  /**
   * Retrieves the list of default shortcuts provided by the application.
   *
   * @returns {ShortcutConfig[]} List of default shortcuts.
   */
  getDefaultShortcuts(): ShortcutConfig[] {
    return [...this.defaultShortcuts];
  }

  /**
   * Updates a shortcut by unregistering the old accelerator and registering the new configuration.
   *
   * @param {string} oldAccelerator - The previous key combination.
   * @param {ShortcutConfig} newConfig - The new shortcut configuration.
   * @returns {boolean} True if the update (re-registration) was successful.
   */
  updateShortcut(oldAccelerator: string, newConfig: ShortcutConfig): boolean {
    this.unregister(oldAccelerator);
    return this.register(newConfig);
  }

  /**
   * Handles the execution of a shortcut action.
   * Dispatches actions to the window or sends events to the renderer process.
   *
   * @param {string} action - The action identifier.
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
        // Send custom action to renderer
        this.mainWindow.webContents.send('shortcut:action', action);
        break;
    }
  }

  /**
   * Toggles the visibility of the main window.
   */
  private toggleWindow(): void {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  /**
   * Shows and focuses the main window.
   */
  private showWindow(): void {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * Shows the window and navigates the renderer to a specific route.
   *
   * @param {string} path - The route path to navigate to.
   */
  private showWindowAndNavigate(path: string): void {
    this.showWindow();
    this.mainWindow.webContents.send('navigate', path);
  }

  /**
   * Checks if an accelerator is already registered (possibly by another application).
   *
   * @param {string} accelerator - The key combination to check.
   * @returns {boolean} True if the accelerator is already taken.
   */
  checkConflict(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  /**
   * Cleans up resources by unregistering all shortcuts.
   */
  destroy(): void {
    this.unregisterAll();
  }
}

export default ShortcutManager;
