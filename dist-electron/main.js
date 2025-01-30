var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BrowserWindow, ipcMain, dialog, app, globalShortcut, clipboard, nativeImage, Tray, Menu, screen } from "electron";
import { fileURLToPath } from "node:url";
import path$1 from "node:path";
import { promises } from "fs";
import path, { join } from "path";
import { exec } from "child_process";
class PluginManager {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
    __publicField(this, "initialized", false);
  }
  async register(plugin) {
    console.log(`[PluginManager] 1. 开始注册插件: ${plugin.metadata.name}`);
    if (this.plugins.has(plugin.metadata.name)) {
      console.error(`[PluginManager] 错误: 插件 ${plugin.metadata.name} 已经注册过了`);
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }
    this.plugins.set(plugin.metadata.name, plugin);
    console.log(`[PluginManager] 2. 插件 ${plugin.metadata.name} 注册成功`);
    if (this.initialized) {
      console.log(`[PluginManager] 3. PluginManager已初始化，立即初始化新插件: ${plugin.metadata.name}`);
      await plugin.init();
    }
  }
  async unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      await plugin.destroy();
      this.plugins.delete(pluginName);
    }
  }
  async initializeAll() {
    console.log("[PluginManager] 开始初始化所有插件...");
    this.initialized = true;
    for (const [name, plugin] of this.plugins) {
      console.log(`[PluginManager] 正在初始化插件: ${name}`);
      try {
        await plugin.init();
        console.log(`[PluginManager] 插件 ${name} 初始化成功`);
      } catch (error) {
        console.error(`[PluginManager] 插件 ${name} 初始化失败:`, error);
      }
    }
    console.log("[PluginManager] 所有插件初始化完成");
  }
  async destroyAll() {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy();
    }
    this.plugins.clear();
    this.initialized = false;
  }
  getPlugin(name) {
    console.log(`[PluginManager] 获取插件: ${name}`);
    return this.plugins.get(name);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}
const MAIN_DIST$1 = process.env.MAIN_DIST ?? path.join(process.env.APP_ROOT ?? process.cwd(), "dist-electron");
class QuickLauncherMainPlugin {
  constructor() {
    __publicField(this, "metadata", {
      name: "quickLauncher",
      version: "1.0.0",
      description: "Quick application launcher with shortcuts",
      author: "bakersean"
    });
    __publicField(this, "quickLauncherWindow", null);
  }
  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      if (this.quickLauncherWindow.isVisible()) {
        this.quickLauncherWindow.hide();
      } else {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
      return;
    }
    const preloadPath = path.resolve(MAIN_DIST$1, "quickLauncher_preload.mjs");
    console.log("Creating quick launcher window with preload path:", preloadPath);
    this.quickLauncherWindow = new BrowserWindow({
      width: 1024,
      height: 576,
      frame: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
        webSecurity: true
      }
    });
    this.quickLauncherWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    });
    this.quickLauncherWindow.once("ready-to-show", () => {
      if (this.quickLauncherWindow) {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`);
    } else {
      this.quickLauncherWindow.loadFile(
        path.join(process.env.APP_ROOT || "", "dist/src/plugins/quickLauncher/index.html")
      );
    }
    this.quickLauncherWindow.on("closed", () => {
      this.quickLauncherWindow = null;
    });
  }
  async init() {
    console.log("[QuickLauncherMain] 1. 开始初始化主进程插件");
    this.registerIpcHandlers();
    this.registerShortcuts();
    console.log("[QuickLauncherMain] 3. 快捷键注册完成");
  }
  registerIpcHandlers() {
    console.log("[QuickLauncherMain] 注册IPC处理器...");
    ipcMain.handle("launch-application", async (_, path2) => {
      console.log("[QuickLauncherMain] 收到启动应用请求:", path2);
      return new Promise((resolve, reject) => {
        exec(`start "" "${path2}"`, (error) => {
          if (error) {
            console.error("[QuickLauncherMain] 启动应用失败:", error);
            reject(error);
          } else {
            console.log("[QuickLauncherMain] 启动应用成功");
            resolve(true);
          }
        });
      });
    });
    ipcMain.handle("select-file", async () => {
      console.log("[QuickLauncherMain] 打开文件选择对话框");
      const result = await dialog.showOpenDialog({
        properties: ["openFile"]
      });
      console.log("[QuickLauncherMain] 文件选择结果:", result.filePaths);
      return result;
    });
    ipcMain.handle("get-file-icon", async (_event, filePath) => {
      try {
        const icon = await app.getFileIcon(filePath, {
          size: "large"
          // 可选值: 'small', 'normal', 'large'
        });
        return icon.toDataURL();
      } catch (error) {
        console.error("获取文件图标失败:", error);
        return null;
      }
    });
  }
  registerShortcuts() {
    console.log("[QuickLauncherMain] 注册全局快捷键...");
    globalShortcut.register("Alt+Space", () => {
      console.log("[QuickLauncherMain] 触发Alt+Space快捷键");
      if (this.quickLauncherWindow) {
        if (this.quickLauncherWindow.isVisible()) {
          this.quickLauncherWindow.hide();
        } else {
          this.quickLauncherWindow.show();
          this.quickLauncherWindow.focus();
        }
      } else {
        this.createQuickLauncherWindow();
      }
    });
  }
  async destroy() {
    globalShortcut.unregister("Alt+Space");
    ipcMain.removeHandler("launch-application");
    ipcMain.removeHandler("select-file");
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.close();
      this.quickLauncherWindow = null;
    }
  }
}
const notificationWindows = /* @__PURE__ */ new Map();
const __dirname = path$1.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.MAIN_DIST = MAIN_DIST;
process.env.RENDERER_DIST = RENDERER_DIST;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let tray = null;
let pluginManager = null;
function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path$1.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      preload: path$1.join(MAIN_DIST, "main_preload.mjs"),
      additionalArguments: ["--enable-features=SharedArrayBuffer"]
    },
    width: 1400,
    height: 800
  });
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });
  pluginManager = new PluginManager();
  if (win) {
    pluginManager.register(new QuickLauncherMainPlugin());
    pluginManager.initializeAll();
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
  win.setMinimumSize(800, 600);
  createTray(win);
  win.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win == null ? void 0 : win.hide();
    }
    return false;
  });
}
function createTray(win2) {
  const icon = nativeImage.createFromPath(join(__dirname, "../public/DailyUse-16.png"));
  tray = new Tray(icon);
  tray.setToolTip("DailyUse");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        win2.show();
      }
    },
    {
      label: "设置",
      click: () => {
        win2.show();
        win2.webContents.send("navigate-to", "/setting");
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    win2.show();
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
ipcMain.handle("createFolder", async (_event, filePath) => {
  await promises.mkdir(filePath, { recursive: true });
});
ipcMain.handle("createFile", async (_event, filePath, content = "") => {
  await promises.writeFile(filePath, content, "utf8");
});
ipcMain.handle("deleteFileOrFolder", async (_event, path2, isDirectory) => {
  if (isDirectory) {
    await promises.rm(path2, { recursive: true, force: true });
  } else {
    await promises.unlink(path2);
  }
});
ipcMain.handle("selectFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (result.canceled) {
    return null;
  } else {
    const folderPath = result.filePaths[0];
    const files = await promises.readdir(folderPath).then(
      (fileNames) => Promise.all(
        fileNames.map(async (fileName) => {
          const filePath = path$1.join(folderPath, fileName);
          const stats = await promises.lstat(filePath);
          return {
            name: fileName,
            path: filePath,
            isDirectory: stats.isDirectory()
          };
        })
      )
    );
    return { folderPath, files };
  }
});
ipcMain.handle("readFile", async (_event, filePath) => {
  return await promises.readFile(filePath, "utf8");
});
ipcMain.handle("writeFile", async (_event, filePath, content) => {
  try {
    await promises.writeFile(filePath, content, "utf8");
    return true;
  } catch (error) {
    console.error("写入文件失败:", error);
    throw error;
  }
});
ipcMain.handle("getRootDir", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled) {
    const directoryPath = result.filePaths[0];
    const folderTreeData = await generateTree(directoryPath);
    return { folderTreeData, directoryPath };
  }
  return null;
});
async function generateTree(dir) {
  try {
    const items = await promises.readdir(dir, { withFileTypes: true });
    const children = await Promise.all(
      items.map(async (item) => {
        const fullPath = path$1.join(dir, item.name);
        const fileType = item.isDirectory() ? "directory" : path$1.extname(item.name).slice(1) || "file";
        if (item.isDirectory()) {
          return {
            title: item.name,
            key: fullPath,
            fileType,
            children: await generateTree(fullPath)
          };
        } else {
          return {
            title: item.name,
            key: fullPath,
            fileType,
            isLeaf: true
          };
        }
      })
    );
    return children.filter(Boolean);
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}
const NOTIFICATION_WIDTH = 320;
const NOTIFICATION_HEIGHT = 120;
const NOTIFICATION_MARGIN = 10;
function getNotificationPosition() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;
  const x = screenWidth - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN;
  const y = NOTIFICATION_MARGIN + notificationWindows.size * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN);
  return { x, y };
}
function reorderNotifications() {
  let index = 0;
  for (const [, window] of notificationWindows) {
    const y = NOTIFICATION_MARGIN + index * (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN);
    window.setPosition(window.getPosition()[0], y);
    index++;
  }
}
ipcMain.handle("show-notification", async (_event, options) => {
  console.log("主进程收到显示通知请求:", options);
  if (!win) {
    console.error("主窗口未创建，无法显示通知");
    return;
  }
  if (notificationWindows.has(options.id)) {
    console.log("关闭已存在的相同ID通知:", options.id);
    const existingWindow = notificationWindows.get(options.id);
    existingWindow == null ? void 0 : existingWindow.close();
    notificationWindows.delete(options.id);
    reorderNotifications();
  }
  const { x, y } = getNotificationPosition();
  console.log("新通知位置:", { x, y });
  console.log("创建通知窗口...");
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
      preload: path$1.join(MAIN_DIST, "main_preload.mjs"),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false
    }
  });
  notificationWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });
  notificationWindows.set(options.id, notificationWindow);
  console.log("通知窗口已存储，当前活动通知数:", notificationWindows.size);
  notificationWindow.on("closed", () => {
    console.log("通知窗口已关闭:", options.id);
    notificationWindows.delete(options.id);
    reorderNotifications();
  });
  const queryParams = new URLSearchParams({
    id: options.id,
    title: options.title,
    body: options.body,
    urgency: options.urgency || "normal"
  });
  if (options.icon) {
    queryParams.append("icon", options.icon);
  }
  if (options.actions) {
    queryParams.append("actions", encodeURIComponent(JSON.stringify(options.actions)));
  }
  const notificationUrl = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#/notification?${queryParams.toString()}` : `file://${RENDERER_DIST}/index.html#/notification?${queryParams.toString()}`;
  console.log("加载通知页面:", notificationUrl);
  await notificationWindow.loadURL(notificationUrl);
  notificationWindow.show();
  console.log("通知窗口已显示");
  return options.id;
});
ipcMain.on("close-notification", (_event, id) => {
  console.log("收到关闭通知请求:", id);
  const window = notificationWindows.get(id);
  if (window && !window.isDestroyed()) {
    window.close();
  }
});
ipcMain.on("notification-action", (_event, id, action) => {
  console.log("收到通知动作:", id, action);
  const window = notificationWindows.get(id);
  if (window && !window.isDestroyed()) {
    if (action.type === "confirm" || action.type === "cancel") {
      window.close();
    }
    win == null ? void 0 : win.webContents.send("notification-action-received", id, action);
  }
});
ipcMain.handle("renameFileOrFolder", async (_event, oldPath, newPath) => {
  try {
    const exists = await promises.access(newPath).then(() => true).catch(() => false);
    if (exists) {
      const { response } = await dialog.showMessageBox({
        type: "question",
        buttons: ["覆盖", "取消"],
        defaultId: 1,
        title: "确认覆盖",
        message: "目标已存在，是否覆盖？",
        detail: `目标路径: ${newPath}`
      });
      if (response === 1) {
        return false;
      }
    }
    await promises.rename(oldPath, newPath);
    return true;
  } catch (error) {
    console.error("Rename error:", error);
    throw error;
  }
});
ipcMain.handle("readClipboard", () => {
  return clipboard.readText();
});
ipcMain.handle("writeClipboard", (_event, text) => {
  clipboard.writeText(text);
});
ipcMain.handle("readClipboardFiles", () => {
  const formats = clipboard.availableFormats();
  if (formats.includes("FileNameW")) {
    return clipboard.read("FileNameW").split("\0").filter(Boolean);
  }
  return [];
});
ipcMain.handle("writeClipboardFiles", (_event, filePaths) => {
  clipboard.writeBuffer("FileNameW", Buffer.from(filePaths.join("\0") + "\0", "ucs2"));
});
ipcMain.handle("refreshFolder", async (_event, directoryPath) => {
  const folderTreeData = await generateTree(directoryPath);
  return { folderTreeData, directoryPath };
});
ipcMain.on("window-control", (_event, command) => {
  switch (command) {
    case "minimize":
      win == null ? void 0 : win.minimize();
      break;
    case "maximize":
      if (win == null ? void 0 : win.isMaximized()) {
        win == null ? void 0 : win.unmaximize();
      } else {
        win == null ? void 0 : win.maximize();
      }
      break;
    case "close":
      win == null ? void 0 : win.close();
      break;
  }
});
ipcMain.handle("get-auto-launch", () => {
  return app.getLoginItemSettings().openAtLogin;
});
ipcMain.handle("set-auto-launch", (_event, enable) => {
  if (process.platform === "win32") {
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath
    });
  }
  return app.getLoginItemSettings().openAtLogin;
});
app.on("before-quit", () => {
  app.isQuitting = true;
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
