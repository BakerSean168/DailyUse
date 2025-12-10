/**
 * System IPC Handlers
 * 
 * Centralized registration for system-level IPC channels, including:
 * - app:* - Application information and status checks.
 * - system:* - System utilities (DI status, memory usage, performance stats).
 * - desktop:* - Desktop features (auto-launch, shortcuts, tray).
 * - sync:* - Synchronization operations and status.
 *
 * @module ipc/system-handlers
 */

import { app, ipcMain } from 'electron';
import type { TrayManager } from '../modules/tray';
import type { ShortcutManager } from '../modules/shortcuts';
import type { AutoLaunchManager } from '../modules/autolaunch';
import { isDIConfigured, getLazyModuleStats } from '../di';
import { getSyncManager } from '../services';
import { getIpcCache } from '../utils';

/**
 * Registers application information IPC handlers.
 * Channels: 'app:getInfo', 'app:checkDIStatus'
 */
function registerAppInfoHandlers(): void {
  ipcMain.handle('app:getInfo', async () => {
    return {
      platform: process.platform,
      version: app.getVersion(),
    };
  });

  ipcMain.handle('app:checkDIStatus', async () => {
    return isDIConfigured();
  });
}

/**
 * Registers system-level utility IPC handlers.
 * Channels: 'system:getDIStatus', 'system:getAppVersion', 'system:getLazyModuleStats',
 * 'system:getMemoryUsage', 'system:getIpcCacheStats'
 */
function registerSystemHandlers(): void {
  ipcMain.handle('system:getDIStatus', async () => {
    return isDIConfigured();
  });

  ipcMain.handle('system:getAppVersion', async () => {
    return app.getVersion();
  });

  ipcMain.handle('system:getLazyModuleStats', async () => {
    return getLazyModuleStats();
  });

  ipcMain.handle('system:getMemoryUsage', async () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
    };
  });

  ipcMain.handle('system:getIpcCacheStats', async () => {
    return getIpcCache().getStats();
  });
}

/**
 * Registers desktop feature IPC handlers (Tray, Shortcuts, AutoLaunch).
 * Channels start with 'desktop:'.
 *
 * @param {TrayManager | null} trayManager - The tray manager instance.
 * @param {ShortcutManager | null} shortcutManager - The shortcut manager instance.
 * @param {AutoLaunchManager | null} autoLaunchManager - The auto-launch manager instance.
 */
function registerDesktopFeaturesHandlers(
  trayManager: TrayManager | null,
  shortcutManager: ShortcutManager | null,
  autoLaunchManager: AutoLaunchManager | null
): void {
  // ========== Auto Launch ==========
  ipcMain.handle('desktop:autoLaunch:isEnabled', async () => {
    return autoLaunchManager?.isEnabled() ?? false;
  });

  ipcMain.handle('desktop:autoLaunch:enable', async () => {
    return autoLaunchManager?.enable() ?? false;
  });

  ipcMain.handle('desktop:autoLaunch:disable', async () => {
    return autoLaunchManager?.disable() ?? false;
  });

  // Shortcuts
  ipcMain.handle('desktop:shortcuts:getAll', async () => {
    return shortcutManager?.getShortcuts() ?? [];
  });

  ipcMain.handle('desktop:shortcuts:update', async (_, accelerator: string, newConfig: { enabled?: boolean }) => {
    if (!shortcutManager) return false;
    if (newConfig.enabled === false) {
      shortcutManager.unregister(accelerator);
    } else {
      const shortcuts = shortcutManager.getShortcuts();
      const existing = shortcuts.find((s: any) => s.accelerator === accelerator);
      if (existing) {
        shortcutManager.register({ ...existing, enabled: true });
      }
    }
    return true;
  });

  // Tray
  ipcMain.handle('desktop:tray:flash', async () => {
    trayManager?.startFlashing();
  });

  ipcMain.handle('desktop:tray:stopFlash', async () => {
    trayManager?.stopFlashing();
  });
}

/**
 * Registers synchronization IPC handlers.
 * Channels start with 'sync:'.
 */
function registerSyncHandlers(): void {
  // ========== Basic Sync Channels ==========
  ipcMain.handle('sync:getSummary', async () => {
    try {
      return getSyncManager().getSyncSummary();
    } catch {
      return null;
    }
  });

  ipcMain.handle('sync:getStats', async () => {
    try {
      return getSyncManager().getStats();
    } catch {
      return null;
    }
  });

  ipcMain.handle('sync:getPendingCount', async () => {
    try {
      return getSyncManager().getSyncLogService().getPendingCount();
    } catch {
      return 0;
    }
  });

  ipcMain.handle('sync:getState', async () => {
    try {
      return getSyncManager().getSyncStateService().getState();
    } catch {
      return null;
    }
  });

  ipcMain.handle('sync:triggerSync', async () => {
    try {
      getSyncManager().triggerSync();
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('sync:forceSync', async () => {
    try {
      return getSyncManager().forceSync();
    } catch (e) {
      return { status: 'error', error: String(e) };
    }
  });

  ipcMain.handle('sync:isOnline', async () => {
    try {
      return getSyncManager().isOnline();
    } catch {
      return false;
    }
  });

  // ========== Conflict Handlers ==========
  ipcMain.handle('sync:conflict:getUnresolved', async (_, entityType?: string) => {
    try {
      return getSyncManager().getConflictManager().getUnresolvedConflicts(entityType ?? '');
    } catch {
      return [];
    }
  });

  ipcMain.handle('sync:conflict:getCount', async (_, entityType?: string) => {
    try {
      return getSyncManager().getConflictManager().getUnresolvedCount(entityType ?? '');
    } catch {
      return 0;
    }
  });

  ipcMain.handle('sync:conflict:resolve', async (_, conflictId: string, fieldSelections: Record<string, 'local' | 'server'>) => {
    try {
      return getSyncManager().getConflictManager().resolveManually(conflictId, fieldSelections);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('sync:conflict:resolveWithLocal', async (_, conflictId: string) => {
    try {
      return getSyncManager().getConflictManager().resolveWithLocal(conflictId);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('sync:conflict:resolveWithServer', async (_, conflictId: string) => {
    try {
      return getSyncManager().getConflictManager().resolveWithServer(conflictId);
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('sync:conflict:getHistory', async (_, filter?: unknown, pagination?: unknown) => {
    try {
      return getSyncManager().getConflictManager().queryHistory(filter as never, pagination as never);
    } catch {
      return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }
  });

  ipcMain.handle('sync:conflict:getStats', async () => {
    try {
      return getSyncManager().getConflictManager().getStats();
    } catch {
      return null;
    }
  });

  // ========== Device Handlers ==========
  ipcMain.handle('sync:device:getInfo', async () => {
    try {
      return getSyncManager().getDeviceService().getDeviceInfo();
    } catch {
      return null;
    }
  });

  ipcMain.handle('sync:device:rename', async (_, newName: string) => {
    try {
      getSyncManager().getDeviceService().updateDeviceName(newName);
      return { success: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}

/**
 * Registers all system-level IPC handlers.
 *
 * @param {TrayManager | null} trayManager - The tray manager instance.
 * @param {ShortcutManager | null} shortcutManager - The shortcut manager instance.
 * @param {AutoLaunchManager | null} autoLaunchManager - The auto-launch manager instance.
 */
export function registerSystemIpcHandlers(
  trayManager: TrayManager | null,
  shortcutManager: ShortcutManager | null,
  autoLaunchManager: AutoLaunchManager | null
): void {
  // ========== App Info Channels ==========
  registerAppInfoHandlers();

  // ========== System Channels ==========
  registerSystemHandlers();

  // ========== Desktop Features Channels ==========
  registerDesktopFeaturesHandlers(trayManager, shortcutManager, autoLaunchManager);

  // ========== Sync Channels ==========
  registerSyncHandlers();
}
