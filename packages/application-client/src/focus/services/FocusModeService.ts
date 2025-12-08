/**
 * FocusModeService - Focus Mode Management
 * 
 * Manages the immersive focus mode UI state, including:
 * - Full-screen focus view
 * - Keyboard shortcuts (Esc, Space, etc)
 * - Do-not-disturb mode integration
 * - Auto-hide controls
 */

import { pomodoroService, PomodoroSession } from './PomodoroService';

export type NotificationType = 'system' | 'inApp' | 'both';

export interface FocusModeState {
  isActive: boolean;
  fullscreen: boolean;
  showControls: boolean;
  controlsHideTimeout?: NodeJS.Timeout;
  currentTask?: {
    id: string;
    title: string;
    description?: string;
  };
  doNotDisturbEnabled: boolean;
  backgroundColor?: string;
  hideSystemUI: boolean;
}

export interface FocusModeSettings {
  autoFullscreen: boolean;
  autoHideControls: boolean;
  controlsHideDelay: number; // milliseconds
  notificationType: NotificationType;
  soundEnabled: boolean;
  doNotDisturbOnStart: boolean;
  hideSystemUI: boolean;
  backgroundColor: string;
  exitHotkey: string; // 'Escape' or 'Alt+Q'
  togglePauseHotkey: string; // ' ' (Space)
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * FocusModeService - Singleton service for focus mode management
 */
export class FocusModeService {
  private static instance: FocusModeService;
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();

  private state: FocusModeState = {
    isActive: false,
    fullscreen: false,
    showControls: false,
    doNotDisturbEnabled: false,
    hideSystemUI: false,
    backgroundColor: '#1a1a2e',
  };

  private settings: FocusModeSettings = {
    autoFullscreen: true,
    autoHideControls: true,
    controlsHideDelay: 3000, // 3 seconds
    notificationType: 'system',
    soundEnabled: true,
    doNotDisturbOnStart: true,
    hideSystemUI: true,
    backgroundColor: '#1a1a2e',
    exitHotkey: 'Escape',
    togglePauseHotkey: ' ',
  };

  // Events
  onFocusEnter: () => void = () => {};
  onFocusExit: () => void = () => {};
  onControlsShow: () => void = () => {};
  onControlsHide: () => void = () => {};
  onDoNotDisturbChange: (enabled: boolean) => void = () => {};

  private constructor() {
    this.setupPomodoroListeners();
  }

  public static getInstance(): FocusModeService {
    if (!FocusModeService.instance) {
      FocusModeService.instance = new FocusModeService();
    }
    return FocusModeService.instance;
  }

  /**
   * Enter focus mode
   */
  public enter(taskId?: string, taskTitle?: string, taskDescription?: string): void {
    if (this.state.isActive) {
      return;
    }

    this.state.isActive = true;
    this.state.fullscreen = this.settings.autoFullscreen;
    this.state.showControls = true;
    this.state.currentTask = taskId
      ? {
          id: taskId,
          title: taskTitle || 'Untitled Task',
          description: taskDescription,
        }
      : undefined;

    // Enable do-not-disturb if configured
    if (this.settings.doNotDisturbOnStart) {
      this.enableDoNotDisturb();
    }

    // Start auto-hide controls timer
    if (this.settings.autoHideControls) {
      this.startAutoHideTimer();
    }

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    this.onFocusEnter();
    this.clearCache('state');
  }

  /**
   * Exit focus mode
   */
  public exit(): void {
    if (!this.state.isActive) {
      return;
    }

    this.state.isActive = false;
    this.state.fullscreen = false;
    this.state.showControls = false;
    this.state.currentTask = undefined;

    // Disable do-not-disturb
    if (this.state.doNotDisturbEnabled) {
      this.disableDoNotDisturb();
    }

    // Clear timers and shortcuts
    this.clearAutoHideTimer();
    this.teardownKeyboardShortcuts();

    this.onFocusExit();
    this.clearCache('state');
  }

  /**
   * Toggle focus mode
   */
  public toggle(taskId?: string, taskTitle?: string): void {
    if (this.state.isActive) {
      this.exit();
    } else {
      this.enter(taskId, taskTitle);
    }
  }

  /**
   * Show controls with auto-hide
   */
  public showControls(): void {
    this.state.showControls = true;
    this.onControlsShow();

    if (this.settings.autoHideControls) {
      this.startAutoHideTimer();
    }
  }

  /**
   * Hide controls
   */
  public hideControls(): void {
    this.clearAutoHideTimer();
    this.state.showControls = false;
    this.onControlsHide();
  }

  /**
   * Handle mouse move (for auto-hide)
   */
  public onMouseMove(): void {
    if (!this.state.isActive) return;

    if (this.settings.autoHideControls) {
      this.showControls();
    }
  }

  /**
   * Toggle fullscreen
   */
  public toggleFullscreen(): void {
    this.state.fullscreen = !this.state.fullscreen;
    this.clearCache('state');
  }

  /**
   * Enable do-not-disturb mode
   */
  public enableDoNotDisturb(): void {
    if (this.state.doNotDisturbEnabled) {
      return;
    }

    this.state.doNotDisturbEnabled = true;
    // In real implementation: call OS API to enable DND
    // For now, just set state
    this.onDoNotDisturbChange(true);
    this.clearCache('state');
  }

  /**
   * Disable do-not-disturb mode
   */
  public disableDoNotDisturb(): void {
    if (!this.state.doNotDisturbEnabled) {
      return;
    }

    this.state.doNotDisturbEnabled = false;
    // In real implementation: call OS API to disable DND
    this.onDoNotDisturbChange(false);
    this.clearCache('state');
  }

  /**
   * Get current state
   */
  public getState(): FocusModeState {
    return { ...this.state };
  }

  /**
   * Get current settings
   */
  public getSettings(): FocusModeSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<FocusModeSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.clearCache('settings');
  }

  /**
   * Set current task
   */
  public setCurrentTask(taskId: string, taskTitle: string, taskDescription?: string): void {
    this.state.currentTask = {
      id: taskId,
      title: taskTitle,
      description: taskDescription,
    };
    this.clearCache('state');
  }

  /**
   * Clear task
   */
  public clearCurrentTask(): void {
    this.state.currentTask = undefined;
    this.clearCache('state');
  }

  /**
   * Get controls visibility
   */
  public areControlsVisible(): boolean {
    return this.state.showControls;
  }

  /**
   * Get focus mode active state
   */
  public isFocusActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Clear cache
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set cache expiry (in minutes)
   */
  public setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }

  // ==================== Private Methods ====================

  private startAutoHideTimer(): void {
    this.clearAutoHideTimer();

    this.state.controlsHideTimeout = setTimeout(() => {
      if (this.state.isActive) {
        this.hideControls();
      }
    }, this.settings.controlsHideDelay);
  }

  private clearAutoHideTimer(): void {
    if (this.state.controlsHideTimeout) {
      clearTimeout(this.state.controlsHideTimeout);
      this.state.controlsHideTimeout = undefined;
    }
  }

  private setupKeyboardShortcuts(): void {
    // This would be set up in the actual renderer process
    // For testing purposes, this is a placeholder
  }

  private teardownKeyboardShortcuts(): void {
    // This would be torn down in the actual renderer process
    // For testing purposes, this is a placeholder
  }

  private setupPomodoroListeners(): void {
    // Listen to pomodoro phase changes
    const originalPhaseComplete = pomodoroService.onPhaseComplete;
    pomodoroService.onPhaseComplete = (phase, nextPhase) => {
      if (phase === 'work' && this.state.isActive) {
        // Work phase ended, might show notification
      }
      originalPhaseComplete(phase, nextPhase);
    };
  }
}

export const focusModeService = FocusModeService.getInstance();
