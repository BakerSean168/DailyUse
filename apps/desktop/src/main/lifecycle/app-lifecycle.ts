/**
 * Application Lifecycle Management
 * 
 * 管理 Electron 应用的完整生命周期：
 * - app.whenReady() - 应用就绪，创建窗口
 * - app.on('activate') - macOS 重新激活
 * - app.on('window-all-closed') - 所有窗口关闭
 * - app.on('before-quit') - 应用退出前清理
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDesktopFeatures, cleanupDesktopFeatures } from '../desktop-features';
import { registerSystemIpcHandlers } from '../ipc/system-handlers';
import { getTrayManager, getShortcutManager, getAutoLaunchManager } from '../desktop-features';
import { initNotificationService } from '../services';
import { stopMemoryCleanup, closeDatabase } from '../database';
import { shutdownAllModules } from '../modules';
import { initializeEventListeners } from '../events/initialize-event-listeners';

// ESM 兼容的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * 创建主窗口
 */
export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload.cjs'),
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
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的 HTML
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

/**
 * 获取主窗口
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * 处理应用 ready 事件
 */
async function handleAppReady(initializeApp: () => Promise<void>): Promise<void> {
  // 应用核心初始化
  await initializeApp();

  // 初始化事件监听器
  await initializeEventListeners();
  console.log('[Lifecycle] Event listeners initialized');

  // 创建主窗口
  const win = createMainWindow();

  // 初始化通知服务（需要在窗口创建后）
  if (win) {
    initNotificationService(win);
    console.log('[Lifecycle] Notification service initialized');

    // 初始化桌面特性
    await initializeDesktopFeatures(win);

    // 注册系统 IPC 处理器（需要 managers）
    registerSystemIpcHandlers(
      getTrayManager(),
      getShortcutManager(),
      getAutoLaunchManager()
    );
    console.log('[Lifecycle] System IPC handlers registered');
  }

  // macOS: 点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

/**
 * 处理所有窗口关闭事件
 */
function handleWindowAllClosed(): void {
  // macOS: 保持应用活跃直到明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
}

/**
 * 处理应用退出前的清理工作
 */
async function handleBeforeQuit(): Promise<void> {
  console.log('[Lifecycle] Cleaning up before quit...');

  // 停止定时任务
  stopMemoryCleanup();

  // 清理桌面特性资源
  await cleanupDesktopFeatures();

  // 关闭所有模块（优雅关闭）
  await shutdownAllModules();

  // 关闭数据库连接
  closeDatabase();

  console.log('[Lifecycle] Cleanup complete');
}

/**
 * 阻止创建新窗口（安全性）
 */
function setupSecurityHandlers(): void {
  app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
}

/**
 * 注册所有应用生命周期事件
 * 
 * @param initializeApp 应用初始化函数
 */
export function registerAppLifecycleHandlers(initializeApp: () => Promise<void>): void {
  // 应用就绪时创建窗口
  app.whenReady().then(() => handleAppReady(initializeApp));

  // 所有窗口关闭时处理
  app.on('window-all-closed', handleWindowAllClosed);

  // 应用退出前清理
  app.on('before-quit', () => handleBeforeQuit());

  // 设置安全处理器
  setupSecurityHandlers();
}
