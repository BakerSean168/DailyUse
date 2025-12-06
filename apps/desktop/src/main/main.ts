/**
 * Electron Main Process Entry Point
 *
 * 遵循 ADR-006: IPC invoke/handle 模式
 * 遵循 STORY-002: 主进程 DI 初始化
 * 遵循 STORY-003: Preload API 暴露
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase, closeDatabase } from './database';
import { configureMainProcessDependencies, isDIConfigured } from './di';
import { registerAllIpcHandlers } from './ipc';

// 保持对窗口的引用，避免被垃圾回收
let mainWindow: BrowserWindow | null = null;

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
 */
async function initializeApp(): Promise<void> {
  console.log('[App] Initializing...');

  // 1. 初始化数据库
  initializeDatabase();
  console.log('[App] Database initialized');

  // 2. 配置依赖注入
  configureMainProcessDependencies();
  console.log('[App] DI configured');

  // 3. 注册 IPC 处理器
  registerIpcHandlers();
  console.log('[App] IPC handlers registered');

  console.log('[App] Initialization complete');
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

  app.on('activate', () => {
    // macOS: 点击 dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // macOS: 保持应用活跃直到明确退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // 关闭数据库连接
  closeDatabase();
});

// 安全性：阻止创建新窗口
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});
