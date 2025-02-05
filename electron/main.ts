import { app, BrowserWindow, ipcMain, clipboard, screen, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { join } from 'path';
import { PluginManager } from '../src/plugins/core/PluginManager';
import { QuickLauncherMainPlugin } from '../src/plugins/quickLauncher/electron/main';
import { registerFileSystemHandlers } from './ipc/filesystem';

// 存储通知窗口的Map
const notificationWindows = new Map<string, BrowserWindow>();

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

// 设置环境变量供插件使用
process.env.MAIN_DIST = MAIN_DIST
process.env.RENDERER_DIST = RENDERER_DIST
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null;
let tray: Tray | null = null
let pluginManager: PluginManager | null = null;

function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, 'DailyUse.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(MAIN_DIST, 'main_preload.mjs'),
      additionalArguments: ['--enable-features=SharedArrayBuffer'],
    },
    width: 1400,
    height: 800,
  })

  // 设置 CSP
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });

  // Initialize plugin system
  pluginManager = new PluginManager();
  if (win) {
    pluginManager.register(new QuickLauncherMainPlugin());
    pluginManager.initializeAll();
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.setMinimumSize(800, 600)

  createTray(win)

  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      win?.hide()
    }
    return false
  })
}

function createTray(win: BrowserWindow) {
  // 使用已有的ico文件
  const icon = nativeImage.createFromPath(join(__dirname, '../public/DailyUse-16.png'))
  tray = new Tray(icon)

  // 设置托盘图标提示文字
  tray.setToolTip('DailyUse')

  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        win.show()
      }
    },
    {
      label: '设置',
      click: () => {
        win.show()
        win.webContents.send('navigate-to', '/setting')
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  // 设置托盘菜单
  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示主窗口
  tray.on('click', () => {
    win.show()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow();
  registerFileSystemHandlers();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 通知窗口的位置管理
const NOTIFICATION_WIDTH = 320;
const NOTIFICATION_HEIGHT = 120;
const NOTIFICATION_MARGIN = 10;

// 获取通知窗口的位置
function getNotificationPosition(): { x: number, y: number } {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  
  // 计算新通知的位置
  const x = screenWidth - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN;
  const y = NOTIFICATION_MARGIN + (notificationWindows.size * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN));
  
  return { x, y };
}

// 重新排列所有通知窗口
function reorderNotifications() {
  let index = 0;
  for (const [, window] of notificationWindows) {
    const y = NOTIFICATION_MARGIN + (index * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN));
    window.setPosition(window.getPosition()[0], y);
    index++;
  }
}

// 处理桌面通知
ipcMain.handle('show-notification', async (_event, options: {
  id: string
  title: string
  body: string
  icon?: string
  urgency?: 'normal' | 'critical' | 'low'
  actions?: Array<{ text: string, type: 'confirm' | 'cancel' | 'action' }>
}) => {
  if (!win) {
    return;
  }

  // 如果存在相同ID的通知，先关闭它
  if (notificationWindows.has(options.id)) {
    const existingWindow = notificationWindows.get(options.id);
    existingWindow?.close();
    notificationWindows.delete(options.id);
    reorderNotifications();
  }

  // 获取新通知的位置
  const { x, y } = getNotificationPosition();

  // 创建通知窗口
  const notificationWindow = new BrowserWindow({
    width: NOTIFICATION_WIDTH,
    height: NOTIFICATION_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(MAIN_DIST, 'main_preload.mjs'),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false
    }
  });

  // 设置通知窗口的 CSP
  notificationWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });

  // 存储窗口引用
  notificationWindows.set(options.id, notificationWindow);

  // 监听窗口关闭事件
  notificationWindow.on('closed', () => {
    notificationWindows.delete(options.id);
    reorderNotifications();
  });

  // 构建查询参数
  const queryParams = new URLSearchParams({
    id: options.id,
    title: options.title,
    body: options.body,
    urgency: options.urgency || 'normal'
  });

  if (options.icon) {
    queryParams.append('icon', options.icon);
  }

  if (options.actions) {
    queryParams.append('actions', encodeURIComponent(JSON.stringify(options.actions)));
  }

  // 加载通知页面
  const notificationUrl = VITE_DEV_SERVER_URL
    ? `${VITE_DEV_SERVER_URL}#/notification?${queryParams.toString()}`
    : `file://${RENDERER_DIST}/index.html#/notification?${queryParams.toString()}`;

  await notificationWindow.loadURL(notificationUrl);

  // 显示窗口
  notificationWindow.show();

  return options.id;
});

// 处理通知关闭请求
ipcMain.on('close-notification', (_event, id: string) => {
  const window = notificationWindows.get(id);
  if (window && !window.isDestroyed()) {
    window.close();
  }
});

// 处理通知动作
ipcMain.on('notification-action', (_event, id: string, action: { text: string, type: string }) => {
  const window = notificationWindows.get(id);
  if (window && !window.isDestroyed()) {
    // 如果是确认或取消按钮，关闭通知
    if (action.type === 'confirm' || action.type === 'cancel') {
      window.close();
    }
    // 转发动作到主窗口
    win?.webContents.send('notification-action-received', id, action);
  }
});



// 读取剪贴板文本
ipcMain.handle('readClipboard', () => {
  return clipboard.readText();
});

// 写入剪贴板文本
ipcMain.handle('writeClipboard', (_event, text: string) => {
  clipboard.writeText(text);
});

// 读取剪贴板文件列表
ipcMain.handle('readClipboardFiles', () => {
  // 在 Windows 上，可以通过 formats 检查是否有文件
  const formats = clipboard.availableFormats();
  if (formats.includes('FileNameW')) {
    // 读取文件列表
    return clipboard.read('FileNameW')
      .split('\0')  // 文件路径以 null 字符分隔
      .filter(Boolean);  // 移除空字符串
  }
  return [];
});

// 写入文件路径到剪贴板
ipcMain.handle('writeClipboardFiles', (_event, filePaths: string[]) => {
  clipboard.writeBuffer('FileNameW', Buffer.from(filePaths.join('\0') + '\0', 'ucs2'));
});



// 窗口控制
ipcMain.on('window-control', (_event, command) => {
  switch (command) {
    case 'minimize':
      win?.minimize()
      break
    case 'maximize':
      if (win?.isMaximized()) {
        win?.unmaximize()
      } else {
        win?.maximize()
      }
      break
    case 'close':
      win?.close()
      break
  }
})

// 设置开机自启动
ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('set-auto-launch', (_event, enable: boolean) => {
  if (process.platform === 'win32') {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
  }
  return app.getLoginItemSettings().openAtLogin;
});

app.on('before-quit', () => {
  app.isQuitting = true;
})