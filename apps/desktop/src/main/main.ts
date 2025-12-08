/**
 * Electron Main Process Entry Point
 *
 * 遵循 ADR-006: IPC invoke/handle 模式
 * 遵循 STORY-002: 主进程 DI 初始化
 * 遵循 STORY-003: Preload API 暴露
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, closeDatabase, startMemoryCleanup, stopMemoryCleanup, getDatabase } from './database';
import { configureMainProcessDependencies, isDIConfigured, getLazyModuleStats } from './di';
import { registerAllIpcHandlers } from './ipc';
import { initNotificationService, initSyncManager, getSyncManager } from './services';
import { initMemoryMonitorForDev, registerCacheIpcHandlers, getIpcCache } from './utils';

// STORY-10: Desktop Native Features
import { TrayManager } from './modules/tray';
import { ShortcutManager } from './modules/shortcuts';
import { AutoLaunchManager } from './modules/autolaunch';

// ESM 兼容的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保持对窗口的引用，避免被垃圾回收
let mainWindow: BrowserWindow | null = null;

// STORY-10: Desktop Native Features managers
let trayManager: TrayManager | null = null;
let shortcutManager: ShortcutManager | null = null;
let autoLaunchManager: AutoLaunchManager | null = null;

/**
 * 创建主窗口
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // 窗口准备好后再显示，避免白屏
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    // 开发模式：加载 Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的 HTML
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 应用初始化
 * 
 * EPIC-003: 性能优化
 * - 添加启动时间测量
 * - 核心模块优先加载
 * - 非核心模块懒加载
 */
async function initializeApp(): Promise<void> {
  const startTime = performance.now();
  console.log('[App] Initializing...');

  // 1. 初始化数据库
  const db = initializeDatabase();
  console.log('[App] Database initialized');

  // 2. EPIC-004: 初始化同步管理器
  initSyncManager(db);
  console.log('[App] Sync manager initialized');

  // 3. 配置依赖注入（核心模块立即加载，非核心懒加载）
  configureMainProcessDependencies();
  console.log('[App] DI configured');

  // 4. 初始化事件监听器
  const { initializeEventListeners } = await import('./events/initialize-event-listeners');
  await initializeEventListeners();
  console.log('[App] Event listeners initialized');

  // 5. 注册 IPC 处理器
  registerIpcHandlers();
  console.log('[App] IPC handlers registered');

  // 6. 启动数据库内存清理定时器
  startMemoryCleanup();

  // 7. EPIC-003: 初始化性能监控工具
  initMemoryMonitorForDev();
  registerCacheIpcHandlers();
  console.log('[App] Performance monitoring initialized');

  const initTime = performance.now() - startTime;
  console.log(`[App] Initialization complete in ${initTime.toFixed(2)}ms`);
  
  // 发送启动完成信号（用于性能测试）
  if (process.env.BENCHMARK_MODE === 'true') {
    console.log('[BENCHMARK] READY');
  }
}

/**
 * 注册 IPC 处理器
 * 遵循 ADR-006: 使用 invoke/handle 模式
 */
function registerIpcHandlers(): void {
  // ========== System Channels ==========
  ipcMain.handle('system:getDIStatus', async () => {
    return isDIConfigured();
  });

  ipcMain.handle('system:getAppVersion', async () => {
    return app.getVersion();
  });

  // ========== EPIC-003: 性能监控 ==========
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

  // EPIC-003: IPC Cache Stats
  ipcMain.handle('system:getIpcCacheStats', async () => {
    return getIpcCache().getStats();
  });

  // ========== STORY-10: Desktop Features ==========
  
  // 开机自启
  ipcMain.handle('desktop:autoLaunch:isEnabled', async () => {
    return autoLaunchManager?.isEnabled() ?? false;
  });

  ipcMain.handle('desktop:autoLaunch:enable', async () => {
    return autoLaunchManager?.enable() ?? false;
  });

  ipcMain.handle('desktop:autoLaunch:disable', async () => {
    return autoLaunchManager?.disable() ?? false;
  });

  // 快捷键
  ipcMain.handle('desktop:shortcuts:getAll', async () => {
    return shortcutManager?.getShortcuts() ?? [];
  });

  ipcMain.handle('desktop:shortcuts:update', async (_, accelerator: string, newConfig: { enabled?: boolean }) => {
    if (!shortcutManager) return false;
    if (newConfig.enabled === false) {
      shortcutManager.unregister(accelerator);
    } else {
      const shortcuts = shortcutManager.getShortcuts();
      const existing = shortcuts.find(s => s.accelerator === accelerator);
      if (existing) {
        shortcutManager.register({ ...existing, enabled: true });
      }
    }
    return true;
  });

  // 托盘
  ipcMain.handle('desktop:tray:flash', async () => {
    trayManager?.startFlashing();
  });

  ipcMain.handle('desktop:tray:stopFlash', async () => {
    trayManager?.stopFlashing();
  });

  // ========== EPIC-004: Sync Channels ==========
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

  // Conflict handlers
  ipcMain.handle('sync:conflict:getUnresolved', async (_, entityType?: string) => {
    try {
      return getSyncManager().getConflictManager().getUnresolvedConflicts(entityType);
    } catch {
      return [];
    }
  });

  ipcMain.handle('sync:conflict:getCount', async (_, entityType?: string) => {
    try {
      return getSyncManager().getConflictManager().getUnresolvedCount(entityType);
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

  // Device handlers
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

  // TODO: sync:device:list requires backend API

  // ========== App Info Channels ==========
  ipcMain.handle('app:getInfo', async () => {
    return {
      platform: process.platform,
      version: app.getVersion(),
    };
  });

  ipcMain.handle('app:checkDIStatus', async () => {
    return isDIConfigured();
  });

  // ========== All Module IPC Handlers ==========
  // 使用模块化的 IPC 处理器注册
  registerAllIpcHandlers();
}

// ========== App Lifecycle ==========

app.whenReady().then(async () => {
  await initializeApp();
  createWindow();

  // 初始化通知服务（需要在窗口创建后）
  if (mainWindow) {
    initNotificationService(mainWindow);
    console.log('[App] Notification service initialized');

    // STORY-10: 初始化桌面特性
    initDesktopFeatures(mainWindow);
  }

  app.on('activate', () => {
    // macOS: 点击 dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * STORY-10: 初始化桌面特有功能
 * - 系统托盘
 * - 全局快捷键
 * - 开机自启
 */
function initDesktopFeatures(window: BrowserWindow): void {
  console.log('[App] Initializing desktop features...');

  // 1. 系统托盘
  trayManager = new TrayManager(window, {
    tooltip: 'DailyUse - 效率提升工具',
    hideOnClose: true,
  });
  trayManager.init();
  console.log('[App] Tray manager initialized');

  // 2. 全局快捷键
  shortcutManager = new ShortcutManager(window);
  shortcutManager.init();
  console.log('[App] Shortcut manager initialized');

  // 3. 开机自启管理器
  autoLaunchManager = new AutoLaunchManager({
    name: 'DailyUse',
    isHidden: true,
  });
  autoLaunchManager.init();
  console.log('[App] Auto-launch manager initialized');
}

app.on('window-all-closed', () => {
  // macOS: 保持应用活跃直到明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // 停止定时任务
  stopMemoryCleanup();
  
  // STORY-10: 清理桌面特性资源
  shortcutManager?.unregisterAll();
  trayManager?.destroy();
  
  // 关闭数据库连接
  closeDatabase();
});

// 安全性：阻止创建新窗口
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
