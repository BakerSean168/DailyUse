var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BrowserWindow, ipcMain, dialog, app, shell, globalShortcut, screen, protocol, clipboard, nativeImage, Tray, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path, { resolve, join, relative, sep } from "node:path";
import { exec, spawn } from "child_process";
import * as sysPath from "path";
import sysPath__default from "path";
import fs, { lstat, stat, readdir, realpath } from "node:fs/promises";
import "node:fs";
import BetterSqlite3 from "better-sqlite3";
import bcrypt from "bcrypt";
import crypto, { randomFillSync, randomUUID } from "crypto";
import fs$1, { realpath as realpath$1, stat as stat$1, lstat as lstat$1, open, readdir as readdir$1 } from "fs/promises";
import { Buffer as Buffer$1 } from "buffer";
import { Buffer as Buffer$2 } from "node:buffer";
import require$$0$1, { unwatchFile, watchFile, watch as watch$1, stat as stat$2 } from "fs";
import require$$1 from "tty";
import require$$1$1 from "util";
import require$$0, { type } from "os";
import { EventEmitter } from "node:events";
import require$$0$2, { EventEmitter as EventEmitter$1 } from "events";
import { Readable } from "node:stream";
class PluginManager {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
    __publicField(this, "initialized", false);
  }
  async register(plugin) {
    if (this.plugins.has(plugin.metadata.name)) {
      console.error(`[PluginManager] 错误: 插件 ${plugin.metadata.name} 已经注册过了`);
      throw new Error(`Plugin ${plugin.metadata.name} is already registered`);
    }
    this.plugins.set(plugin.metadata.name, plugin);
    if (this.initialized) {
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
    this.initialized = true;
    for (const [name, plugin] of this.plugins) {
      try {
        await plugin.init();
      } catch (error) {
        console.error(`[PluginManager] 插件 ${name} 初始化失败:`, error);
      }
    }
  }
  async destroyAll() {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy();
    }
    this.plugins.clear();
    this.initialized = false;
  }
  getPlugin(name) {
    return this.plugins.get(name);
  }
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}
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
    const preloadPath = sysPath__default.resolve(MAIN_DIST, "quickLauncher_preload.mjs");
    this.quickLauncherWindow = new BrowserWindow({
      width: 1024,
      height: 576,
      frame: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        sandbox: false,
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
    if (VITE_DEV_SERVER_URL) {
      this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`);
    } else {
      this.quickLauncherWindow.loadFile(
        sysPath__default.join(RENDERER_DIST, "src/plugins/quickLauncher/index.html")
      );
    }
    this.quickLauncherWindow.on("closed", () => {
      this.quickLauncherWindow = null;
    });
  }
  async init() {
    this.registerIpcHandlers();
    this.registerShortcuts();
  }
  registerIpcHandlers() {
    ipcMain.handle("launch-application", async (_, path2) => {
      return new Promise((resolve2, reject) => {
        const options = { windowsHide: false };
        exec(`start "" "${path2}"`, options, (error) => {
          if (error) {
            console.error("[QuickLauncherMain] 启动应用失败:", error);
            reject(error);
          } else {
            resolve2(true);
          }
        });
      });
    });
    ipcMain.handle("select-file", async () => {
      const result = await dialog.showOpenDialog({
        properties: ["openFile"]
      });
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
    ipcMain.handle("get-link-file-target-path", async (_, shortcutPath) => {
      try {
        const normalizedPath = sysPath__default.win32.normalize(shortcutPath);
        const target = shell.readShortcutLink(normalizedPath);
        const targetPath = target.target;
        return targetPath;
      } catch (error) {
        console.error("Failed to read shortcut target path:", error);
        return "";
      }
    });
    ipcMain.handle("reveal-in-explorer", async (_, filePath) => {
      try {
        shell.showItemInFolder(filePath);
        return true;
      } catch (error) {
        console.error("Failed to reveal in explorer:", error);
        return false;
      }
    });
    ipcMain.handle("hide-window", async () => {
      var _a2;
      try {
        (_a2 = this.quickLauncherWindow) == null ? void 0 : _a2.hide();
        return true;
      } catch (error) {
        console.error("failed to hide window", error);
        return false;
      }
    });
  }
  registerShortcuts() {
    globalShortcut.register("Alt+Space", () => {
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
const __filename = fileURLToPath(import.meta.url);
const __dirname$2 = path.dirname(__filename);
globalThis.__filename = __filename;
globalThis.__dirname = __dirname$2;
let db = null;
let isInitializing = false;
async function initializeDatabase() {
  if (db !== null) return db;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve2) => setTimeout(resolve2, 50));
    }
    if (db !== null) return db;
  }
  isInitializing = true;
  try {
    const dbDir = path.join(app.getPath("userData"), "database");
    try {
      await fs.access(dbDir);
    } catch {
      await fs.mkdir(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, "dailyuse.db");
    db = new BetterSqlite3(dbPath, {
      verbose: process.env.NODE_ENV !== "production" ? console.log : void 0
    });
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        avatar TEXT,
        email TEXT,
        phone TEXT,
        accountType TEXT DEFAULT 'local',
        onlineId TEXT,
        createdAt INTEGER NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT, -- 加密存储，只有记住密码时才有值
        token TEXT, -- 存储会话令牌
        accountType TEXT NOT NULL CHECK(accountType IN ('local', 'online')) DEFAULT 'local',
        rememberMe BOOLEAN NOT NULL DEFAULT 0,
        lastLoginTime INTEGER NOT NULL,
        autoLogin BOOLEAN NOT NULL DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        UNIQUE(username, accountType) -- 同一用户名和账户类型组合唯一
      )
    `);
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_store_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        store_name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(username, store_name),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
      )
    `);
    try {
      db.exec(`ALTER TABLE login_sessions ADD COLUMN token TEXT`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate column name")) {
      } else {
        console.error("添加 token 字段失败:", error);
      }
    }
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_login_sessions_username ON login_sessions(username);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_active ON login_sessions(isActive);
      CREATE INDEX IF NOT EXISTS idx_login_sessions_auto_login ON login_sessions(autoLogin);
    `);
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_store_username ON user_store_data(username);
      CREATE INDEX IF NOT EXISTS idx_user_store_name ON user_store_data(store_name);
    `);
    return db;
  } catch (error) {
    console.error("数据库初始化失败:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}
async function getDatabase() {
  if (db === null) {
    return await initializeDatabase();
  }
  return db;
}
async function closeDatabase() {
  if (db) {
    try {
      db.close();
      db = null;
    } catch (error) {
      console.error("关闭数据库失败:", error);
    }
  }
}
if (typeof process !== "undefined") {
  process.on("exit", () => {
    if (db) {
      try {
        db.close();
      } catch (error) {
        console.error("退出时关闭数据库失败:", error);
      }
    }
  });
  process.on("SIGINT", async () => {
    await closeDatabase();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await closeDatabase();
    process.exit(0);
  });
}
class UserModel {
  /**
   * 私有构造函数，防止直接实例化
   */
  constructor() {
    __publicField(this, "db", null);
  }
  /**
   * 静态方法创建实例
   * @returns UserModel 实例
   */
  static async create() {
    const instance = new UserModel();
    instance.db = await initializeDatabase();
    return instance;
  }
  /**
   * 确保数据库连接存在
   */
  async ensureDatabase() {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }
  /**
   * 添加新用户
   * @param userData 用户数据对象
   * @returns 添加是否成功
   */
  async addUser(userData) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
        INSERT INTO users (
          username,
          password,
          avatar,
          email,
          phone,
          accountType,
          onlineId,
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      const result = stmt.run(
        userData.username,
        userData.password,
        userData.avatar || null,
        userData.email || null,
        userData.phone || null,
        userData.accountType || "local",
        userData.onlineId || null,
        userData.createdAt
      );
      return result.changes > 0;
    } catch (error) {
      console.error("添加用户失败:", error);
      return false;
    }
  }
  /**
   * 删除用户
   * @param username 用户名
   * @returns 删除是否成功
   */
  async removeUser(username) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("DELETE FROM users WHERE username = ?");
      const result = stmt.run(username);
      return result.changes > 0;
    } catch (error) {
      console.error("删除用户失败:", error);
      return false;
    }
  }
  /**
   * 通过用户名查找用户
   * @param username 用户名
   * @returns 用户对象，未找到则返回null
   */
  async findUserByUsername(username) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("SELECT * FROM users WHERE username = ?");
      const user = stmt.get(username);
      return user || null;
    } catch (error) {
      console.error("查找用户失败:", error);
      return null;
    }
  }
  /**
   * 获取所有用户
   * @returns 用户对象数组
   */
  async getAllUsers() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("SELECT * FROM users");
      return stmt.all();
    } catch (error) {
      console.error("failed to get all users:", error);
      return [];
    }
  }
  /**
   * 按账户类型查询用户
   * @param accountType 账户类型（例如：'local', 'online'）
   * @returns 用户对象数组
   */
  async findUsersByAccountType(accountType) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("SELECT * FROM users WHERE accountType = ?");
      return stmt.all(accountType);
    } catch (error) {
      console.error(`获取${accountType}类型用户列表失败:`, error);
      return [];
    }
  }
  /**
   * 更新用户信息
   * @param username 用户名（主键，不可更改）
   * @param userData 需要更新的用户数据，可以是部分字段
   * @returns 更新是否成功
   */
  async updateUser(username, userData) {
    try {
      const db2 = await this.ensureDatabase();
      const { username: _, ...updateData } = userData;
      if (Object.keys(updateData).length === 0) {
        return true;
      }
      const fields = Object.keys(updateData).map((key) => `${key} = ?`);
      const sql = `UPDATE users SET ${fields.join(", ")} WHERE username = ?`;
      const values = [...Object.values(updateData), username];
      const stmt = db2.prepare(sql);
      const result = stmt.run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error("更新用户信息失败:", error);
      return false;
    }
  }
  /**
   * 检查用户是否存在
   * @param username 用户名
   * @returns 用户是否存在
   */
  async userExists(username) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("SELECT 1 FROM users WHERE username = ?");
      const result = stmt.get(username);
      return result !== void 0;
    } catch (error) {
      console.error("检查用户存在失败:", error);
      return false;
    }
  }
  /**
   * 获取用户总数
   * @returns 用户总数
   */
  async getUserCount() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("SELECT COUNT(*) as count FROM users");
      const result = stmt.get();
      return result.count;
    } catch (error) {
      console.error("获取用户数量失败:", error);
      return 0;
    }
  }
  /**
   * 更新用户在线状态
   * @param username 用户名
   * @param onlineId 在线ID
   * @returns 更新是否成功
   */
  async updateUserOnlineStatus(username, onlineId) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
        UPDATE users 
        SET accountType = 'online', onlineId = ? 
        WHERE username = ?
      `);
      const result = stmt.run(onlineId, username);
      return result.changes > 0;
    } catch (error) {
      console.error("更新用户在线状态失败:", error);
      return false;
    }
  }
}
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset2 = 0) {
  return (byteToHex[arr[offset2 + 0]] + byteToHex[arr[offset2 + 1]] + byteToHex[arr[offset2 + 2]] + byteToHex[arr[offset2 + 3]] + "-" + byteToHex[arr[offset2 + 4]] + byteToHex[arr[offset2 + 5]] + "-" + byteToHex[arr[offset2 + 6]] + byteToHex[arr[offset2 + 7]] + "-" + byteToHex[arr[offset2 + 8]] + byteToHex[arr[offset2 + 9]] + "-" + byteToHex[arr[offset2 + 10]] + byteToHex[arr[offset2 + 11]] + byteToHex[arr[offset2 + 12]] + byteToHex[arr[offset2 + 13]] + byteToHex[arr[offset2 + 14]] + byteToHex[arr[offset2 + 15]]).toLowerCase();
}
const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
const native = { randomUUID };
function v4(options, buf, offset2) {
  var _a2;
  if (native.randomUUID && true && !options) {
    return native.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? ((_a2 = options.rng) == null ? void 0 : _a2.call(options)) ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  return unsafeStringify(rnds);
}
const _UserService = class _UserService {
  /**
   * 私有构造函数，初始化用户数据模型
   */
  constructor(userModel) {
    __publicField(this, "userModel");
    this.userModel = userModel;
  }
  /**
   * 获取UserService单例
   * @returns UserService实例
   */
  static async getInstance() {
    if (!_UserService.instance) {
      const userModel = await UserModel.create();
      _UserService.instance = new _UserService(userModel);
    }
    return _UserService.instance;
  }
  /**
   * 用户注册
   * @param data 注册数据
   * @returns 响应结果
   */
  async register(data) {
    try {
      if (!data.username || !data.password) {
        return {
          success: false,
          message: "用户名和密码不能为空"
        };
      }
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: "两次输入的密码不一致"
        };
      }
      const existingUser = await this.userModel.findUserByUsername(data.username);
      if (existingUser) {
        return {
          success: false,
          message: "用户名已存在"
        };
      }
      const hashedPassword = await this.hashPassword(data.password);
      const userData = {
        id: v4(),
        // 使用UUID生成唯一ID
        username: data.username,
        password: hashedPassword,
        email: data.email,
        phone: data.phone,
        accountType: "local",
        createdAt: Date.now()
      };
      const success = await this.userModel.addUser(userData);
      if (success) {
        return {
          success: true,
          message: "注册成功",
          data: {
            username: userData.username,
            avatar: userData.avatar,
            email: userData.email,
            phone: userData.phone,
            accountType: userData.accountType,
            createdAt: userData.createdAt
          }
        };
      } else {
        return {
          success: false,
          message: "注册失败，请重试"
        };
      }
    } catch (error) {
      console.error("注册过程中发生错误:", error);
      return {
        success: false,
        message: "注册失败，服务器错误"
      };
    }
  }
  /**
   * 用户登录
   * @param data 登录数据
   * @returns 响应结果
   */
  async login(data) {
    try {
      if (!data.username || !data.password) {
        return {
          success: false,
          message: "用户名和密码不能为空"
        };
      }
      const user = await this.userModel.findUserByUsername(data.username);
      if (!user) {
        return {
          success: false,
          message: "用户不存在"
        };
      }
      const isPasswordValid = await this.verifyPassword(data.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: "密码错误"
        };
      }
      return {
        success: true,
        message: "登录成功",
        data: {
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          phone: user.phone,
          accountType: user.accountType,
          onlineId: user.onlineId,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      console.error("登录过程中发生错误:", error);
      return {
        success: false,
        message: "登录失败，服务器错误"
      };
    }
  }
  /**
   * 获取用户信息
   * @param username 用户名
   * @returns 响应结果
   */
  async getUserInfo(username) {
    try {
      if (!username) {
        return {
          success: false,
          message: "用户名不能为空"
        };
      }
      const user = await this.userModel.findUserByUsername(username);
      if (!user) {
        return {
          success: false,
          message: "用户不存在"
        };
      }
      return {
        success: true,
        message: "获取用户信息成功",
        data: {
          username: user.username,
          avatar: user.avatar,
          email: user.email,
          phone: user.phone,
          accountType: user.accountType,
          onlineId: user.onlineId,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return {
        success: false,
        message: "获取用户信息失败"
      };
    }
  }
  /**
   * 更新用户信息
   * @param username 用户名
   * @param data 更新数据
   * @returns 响应结果
   */
  async updateUserInfo(username, data) {
    try {
      if (!username) {
        return {
          success: false,
          message: "用户名不能为空"
        };
      }
      const existingUser = await this.userModel.findUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: "用户不存在"
        };
      }
      if (data.password) {
        data.password = await this.hashPassword(data.password);
      }
      const success = await this.userModel.updateUser(username, data);
      if (success) {
        return {
          success: true,
          message: "更新成功"
        };
      } else {
        return {
          success: false,
          message: "更新失败"
        };
      }
    } catch (error) {
      console.error("更新用户信息失败:", error);
      return {
        success: false,
        message: "更新失败，服务器错误"
      };
    }
  }
  /**
   * 删除用户账号
   * @param username 用户名
   * @returns 响应结果
   */
  async deleteUser(username) {
    try {
      if (!username) {
        return {
          success: false,
          message: "用户名不能为空"
        };
      }
      const existingUser = await this.userModel.findUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: "用户不存在"
        };
      }
      const success = await this.userModel.removeUser(username);
      if (success) {
        return {
          success: true,
          message: "账号删除成功"
        };
      } else {
        return {
          success: false,
          message: "删除失败"
        };
      }
    } catch (error) {
      console.error("删除用户失败:", error);
      return {
        success: false,
        message: "删除失败，服务器错误"
      };
    }
  }
  /**
   * 升级为在线账号
   * @param username 用户名
   * @param onlineId 在线ID
   * @returns 响应结果
   */
  async upgradeToOnlineAccount(username, onlineId) {
    try {
      if (!username || !onlineId) {
        return {
          success: false,
          message: "参数不能为空"
        };
      }
      const existingUser = await this.userModel.findUserByUsername(username);
      if (!existingUser) {
        return {
          success: false,
          message: "用户不存在"
        };
      }
      const success = await this.userModel.updateUserOnlineStatus(username, onlineId);
      if (success) {
        return {
          success: true,
          message: "升级为在线账号成功"
        };
      } else {
        return {
          success: false,
          message: "升级失败"
        };
      }
    } catch (error) {
      console.error("升级账号失败:", error);
      return {
        success: false,
        message: "升级失败，服务器错误"
      };
    }
  }
  /**
   * 获取所有用户列表
   * @returns 响应结果
   */
  async getAllUsers() {
    try {
      const users = await this.userModel.getAllUsers();
      const safeUsers = users.map((user) => ({
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
        onlineId: user.onlineId,
        createdAt: user.createdAt
      }));
      return {
        success: true,
        message: "获取用户列表成功",
        data: safeUsers
      };
    } catch (error) {
      console.error("获取用户列表失败:", error);
      return {
        success: false,
        message: "获取用户列表失败"
      };
    }
  }
  /**
   * 密码哈希加密
   * @param password 原始密码
   * @returns 加密后的密码
   */
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }
  /**
   * 验证密码
   * @param password 输入的原始密码
   * @param hashedPassword 数据库中的加密密码
   * @returns 密码是否匹配
   */
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
};
__publicField(_UserService, "instance");
let UserService = _UserService;
const userService = UserService.getInstance();
const userService$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  UserService,
  userService
}, Symbol.toStringTag, { value: "Module" }));
async function setupUserHandlers() {
  try {
    const service = await userService;
    ipcMain.handle("user:register", async (_event, form) => {
      try {
        const response = await service.register(form);
        return response;
      } catch (error) {
        console.error("IPC: 注册异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "注册失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:login", async (_event, credentials) => {
      try {
        const response = await service.login(credentials);
        return response;
      } catch (error) {
        console.error("IPC: 登录异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "登录失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:getUserInfo", async (_event, username) => {
      try {
        const response = await service.getUserInfo(username);
        return response;
      } catch (error) {
        console.error("IPC: 获取用户信息异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取用户信息失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:update", async (_event, username, newData) => {
      try {
        const response = await service.updateUserInfo(username, newData);
        return response;
      } catch (error) {
        console.error("IPC: 更新用户信息异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "更新用户信息失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:deregistration", async (_event, username) => {
      try {
        const response = await service.deleteUser(username);
        return response;
      } catch (error) {
        console.error("IPC: 删除用户账号异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "删除账号失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:upgradeToOnline", async (_event, username, onlineId) => {
      try {
        const response = await service.upgradeToOnlineAccount(username, onlineId);
        return response;
      } catch (error) {
        console.error("IPC: 升级为在线账号异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "升级账号失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:getAllUsers", async (_event) => {
      var _a2;
      try {
        const response = await service.getAllUsers();
        console.log("IPC: 获取用户列表结果", {
          success: response.success,
          userCount: ((_a2 = response.data) == null ? void 0 : _a2.length) || 0
        });
        return response;
      } catch (error) {
        console.error("IPC: 获取用户列表异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "获取用户列表失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:verifyPassword", async (_event, username, password) => {
      try {
        const response = await service.login({ username, password, remember: false });
        if (response.success) {
          return {
            success: true,
            message: "密码验证成功"
          };
        } else {
          return {
            success: false,
            message: "密码验证失败"
          };
        }
      } catch (error) {
        console.error("IPC: 验证密码异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "密码验证失败，未知错误"
        };
      }
    });
    ipcMain.handle("user:changePassword", async (_event, username, oldPassword, newPassword) => {
      try {
        const verifyResult = await service.login({ username, password: oldPassword, remember: false });
        if (!verifyResult.success) {
          return {
            success: false,
            message: "当前密码验证失败"
          };
        }
        const updateResult = await service.updateUserInfo(username, { password: newPassword });
        if (updateResult.success) {
          return {
            success: true,
            message: "密码修改成功"
          };
        } else {
          return updateResult;
        }
      } catch (error) {
        console.error("IPC: 修改密码异常", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "修改密码失败，未知错误"
        };
      }
    });
  } catch (error) {
    console.error("设置用户 IPC 处理器失败:", error);
    throw error;
  }
}
class LoginSessionModel {
  /**
   * 私有构造函数，防止直接实例化
   * 确保只能通过静态工厂方法创建实例，保证数据库连接的正确初始化
   */
  constructor() {
    /** 数据库连接实例，初始化后不为空 */
    __publicField(this, "db", null);
  }
  /**
   * 静态工厂方法，创建并初始化 LoginSessionModel 实例
   * @returns {Promise<LoginSessionModel>} 已初始化的 LoginSessionModel 实例
   * @throws {Error} 当数据库初始化失败时抛出错误
   */
  static async create() {
    const instance = new LoginSessionModel();
    instance.db = await initializeDatabase();
    return instance;
  }
  /**
   * 确保数据库连接存在的私有方法
   * 如果连接不存在则重新初始化，提供双重保障
   * @returns {Promise<Database>} 数据库连接实例
   * @private
   */
  async ensureDatabase() {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }
  /**
   * 添加新的登录会话记录
   * 使用 INSERT 策略，仅插入新记录，如果存在重复记录会失败
   * 适用于确定要创建新记录的场景
   * 
   * @param {Omit<TLoginSessionData, "id" | "createdAt" | "updatedAt">} sessionData - 会话数据
   * @returns {Promise<boolean>} 添加是否成功
   */
  async addLoginSession(sessionData) {
    try {
      const db2 = await this.ensureDatabase();
      const now2 = Date.now();
      const stmt = db2.prepare(`
          INSERT INTO login_sessions (
            username,
            accountType,
            rememberMe,
            password,
            token,
            lastLoginTime,
            autoLogin,
            isActive,
            createdAt,
            updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
      const result = stmt.run(
        sessionData.username,
        sessionData.accountType,
        sessionData.rememberMe ? 1 : 0,
        sessionData.password || null,
        sessionData.token || null,
        sessionData.lastLoginTime,
        sessionData.autoLogin ? 1 : 0,
        sessionData.isActive ? 1 : 0,
        now2,
        now2
      );
      return result.changes > 0;
    } catch (error) {
      console.error("添加登录会话失败:", error);
      return false;
    }
  }
  /**
   * 获取指定用户的登录会话信息
   * 通过用户名和账户类型精确查询记录
   * 
   * @param {string} username - 用户名
   * @param {string} accountType - 账户类型（'local' 或 'online'）
   * @returns {Promise<TLoginSessionData | null>} 登录会话数据，如果不存在则返回 null
   */
  async getSession(username, accountType) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
          SELECT * FROM login_sessions 
          WHERE username = ? AND accountType = ?
        `);
      const session = stmt.get(username, accountType);
      return session || null;
    } catch (error) {
      console.error("获取登录会话失败:", error);
      return null;
    }
  }
  /**
   * 更新指定用户的会话信息
   * 通过用户名和账户类型定位记录，更新传入的字段
   * 自动过滤不可更新的字段（id, username, accountType, createdAt）
   * 自动更新 updatedAt 字段为当前时间
   * 
   * @param {string} username - 用户名，用于定位记录
   * @param {string} accountType - 账户类型，用于定位记录
   * @param {Partial<TLoginSessionData>} updates - 要更新的字段集合
   * @returns {Promise<boolean>} 更新是否成功，如果没有匹配的记录则返回 false
   */
  async updateSession(username, accountType, updates) {
    try {
      const db2 = await this.ensureDatabase();
      const fields = Object.keys(updates).filter(
        (key) => !["id", "username", "accountType", "createdAt"].includes(key)
      ).map((key) => `${key} = ?`);
      if (fields.length === 0) return true;
      fields.push("updatedAt = ?");
      const sql = `UPDATE login_sessions SET ${fields.join(
        ", "
      )} WHERE username = ? AND accountType = ?`;
      const values = [
        ...Object.keys(updates).filter(
          (key) => !["id", "username", "accountType", "createdAt"].includes(key)
        ).map((key) => updates[key]),
        Date.now(),
        // updatedAt 的值
        username,
        // WHERE 条件：用户名
        accountType
        // WHERE 条件：账户类型
      ];
      const stmt = db2.prepare(sql);
      const result = stmt.run(...values);
      return result.changes > 0;
    } catch (error) {
      console.error("更新会话失败:", error);
      return false;
    }
  }
  /**
   * 删除指定的登录会话记录
   * 通过用户名和账户类型的组合精确删除记录
   * 
   * @param {string} username - 用户名
   * @param {string} accountType - 账户类型（'local' 或 'online'）
   * @returns {Promise<boolean>} 删除是否成功，如果记录不存在则返回 false
   */
  async deleteSession(username, accountType) {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(
        "DELETE FROM login_sessions WHERE username = ? AND accountType = ?"
      );
      const result = stmt.run(username, accountType);
      return result.changes > 0;
    } catch (error) {
      console.error("删除会话失败:", error);
      return false;
    }
  }
  /**
   * 获取所有登录会话历史记录
   * 按最后登录时间降序排列，最近的登录记录排在前面
   * 
   * @returns {Promise<TLoginSessionData[]>} 所有登录会话数据数组，失败时返回空数组
   */
  async getAllLoginSessions() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
          SELECT * FROM login_sessions 
          ORDER BY lastLoginTime DESC
        `);
      return stmt.all();
    } catch (error) {
      console.error("获取登录历史失败:", error);
      return [];
    }
  }
  /**
   * 获取所有记住密码的会话记录
   * 返回 rememberMe 为 true 的所有会话，按最后登录时间降序排列
   * 用于登录页面显示历史登录账号列表
   * 
   * @returns {Promise<TLoginSessionData[]>} 记住密码的会话数据数组，失败时返回空数组
   */
  async getRememberedSessions() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
          SELECT * FROM login_sessions 
          WHERE rememberMe = 1 
          ORDER BY lastLoginTime DESC
        `);
      return stmt.all();
    } catch (error) {
      console.error("获取记住的会话失败:", error);
      return [];
    }
  }
  /**
   * 获取设置为自动登录的会话记录
   * 返回最近一次设置为自动登录的会话，用于应用启动时的自动登录功能
   * 
   * @returns {Promise<TLoginSessionData | null>} 自动登录会话数据，不存在时返回 null
   */
  async getAutoLoginSession() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
          SELECT * FROM login_sessions 
          WHERE autoLogin = 1 
          ORDER BY lastLoginTime DESC 
          LIMIT 1
        `);
      return stmt.get() || null;
    } catch (error) {
      console.error("获取自动登录会话失败:", error);
      return null;
    }
  }
  /**
   * 获取当前活跃的会话记录
   * 返回标记为活跃状态的会话，正常情况下应该只有一个活跃会话
   * 用于获取当前登录用户的信息
   * 
   * @returns {Promise<TLoginSessionData | null>} 当前活跃会话数据，不存在时返回 null
   */
  async getActiveSession() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare(`
          SELECT * FROM login_sessions 
          WHERE isActive = 1 
          LIMIT 1
        `);
      return stmt.get() || null;
    } catch (error) {
      console.error("获取活跃会话失败:", error);
      return null;
    }
  }
  /**
   * 清除所有登录会话记录
   * 删除数据库中的所有会话数据，用于重置或清理功能
   * 注意：此操作不可逆，请谨慎使用
   * 
   * @returns {Promise<boolean>} 清除是否成功，即使没有记录也返回 true
   */
  async clearAllSessions() {
    try {
      const db2 = await this.ensureDatabase();
      const stmt = db2.prepare("DELETE FROM login_sessions");
      const result = stmt.run();
      return result.changes >= 0;
    } catch (error) {
      console.error("清除所有会话失败:", error);
      return false;
    }
  }
}
const _LoginSessionService = class _LoginSessionService {
  // 256位密钥
  /**
   * 私有构造函数，初始化登录会话模型和加密配置
   */
  constructor(loginSessionModel) {
    __publicField(this, "loginSessionModel");
    // AES加密配置
    __publicField(this, "algorithm", "aes-256-cbc");
    __publicField(this, "secretKey");
    __publicField(this, "keyLength", 32);
    this.loginSessionModel = loginSessionModel;
    this.secretKey = this.generateSecretKey();
  }
  /**
   * 获取 LoginSessionService 单例
   * @returns LoginSessionService 实例
   */
  static async getInstance() {
    if (!_LoginSessionService.instance) {
      const loginSessionModel = await LoginSessionModel.create();
      _LoginSessionService.instance = new _LoginSessionService(loginSessionModel);
    }
    return _LoginSessionService.instance;
  }
  /**
   * 创建登录会话
   * 用户登录成功后调用此方法保存会话信息
   *
   * @param sessionData 会话数据
   * @param sessionData.username 用户名
   * @param sessionData.password 原始密码（如果记住密码）
   * @param sessionData.accountType 账户类型
   * @param sessionData.rememberMe 是否记住密码
   * @param sessionData.autoLogin 是否自动登录
   * @returns 操作结果
   */
  async addSession(sessionData) {
    try {
      if (!sessionData.username || !sessionData.accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空"
        };
      }
      let encryptedPassword;
      if (sessionData.rememberMe && sessionData.password) {
        encryptedPassword = await this.encryptPassword(sessionData.password);
      }
      const loginSessionData = {
        username: sessionData.username,
        password: encryptedPassword,
        token: sessionData.token,
        accountType: sessionData.accountType,
        rememberMe: sessionData.rememberMe ? 1 : 0,
        lastLoginTime: Date.now(),
        autoLogin: sessionData.autoLogin ? 1 : 0,
        isActive: 1
        // 使用数字而不是布尔值
      };
      const success = await this.loginSessionModel.addLoginSession(
        loginSessionData
      );
      if (success) {
        return {
          success: true,
          message: "会话创建成功",
          data: {
            username: sessionData.username,
            accountType: sessionData.accountType,
            rememberMe: sessionData.rememberMe,
            autoLogin: sessionData.autoLogin
          }
        };
      } else {
        return {
          success: false,
          message: "会话创建失败"
        };
      }
    } catch (error) {
      console.error("创建登录会话失败:", error);
      return {
        success: false,
        message: "创建会话失败，服务器错误"
      };
    }
  }
  /**
   * 获取登录会话
   * 根据用户名和账户类型获取会话信息
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 会话数据
   */
  async getSession(username, accountType) {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空"
        };
      }
      const session = await this.loginSessionModel.getSession(
        username,
        accountType
      );
      if (session) {
        const { password, ...sessionData } = session;
        return {
          success: true,
          message: "获取会话成功",
          data: sessionData
        };
      } else {
        return {
          success: false,
          message: "未找到会话信息"
        };
      }
    } catch (error) {
      console.error("获取登录会话失败:", error);
      return {
        success: false,
        message: "获取会话失败，服务器错误"
      };
    }
  }
  /**
   * 快速登录
   * 使用保存的加密密码进行快速登录
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 登录结果
   */
  async quickLogin(username, accountType) {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空"
        };
      }
      const sessions = await this.loginSessionModel.getRememberedSessions();
      const targetSession = sessions.find(
        (session) => session.username === username && session.accountType === accountType
      );
      if (!targetSession || !targetSession.password) {
        return {
          success: false,
          message: "未找到保存的登录信息"
        };
      }
      try {
        const decryptedPassword = await this.decryptPassword(
          targetSession.password
        );
        const { userService: userService2 } = await Promise.resolve().then(() => userService$1);
        const service = await userService2;
        const loginResult = await service.login({
          username,
          password: decryptedPassword,
          remember: true
        });
        if (loginResult.success) {
          await this.loginSessionModel.updateSession(username, accountType, {
            lastLoginTime: Date.now(),
            isActive: 1
          });
          return {
            success: true,
            message: "快速登录成功",
            data: loginResult.data
          };
        } else {
          await this.loginSessionModel.updateSession(username, accountType, {
            password: void 0,
            rememberMe: 0,
            isActive: 0
          });
          return {
            success: false,
            message: "保存的密码已失效，请重新登录"
          };
        }
      } catch (decryptError) {
        console.error("解密密码失败:", decryptError);
        await this.loginSessionModel.updateSession(username, accountType, {
          password: void 0,
          rememberMe: 0,
          isActive: 0
        });
        return {
          success: false,
          message: "登录信息已损坏，请重新登录"
        };
      }
    } catch (error) {
      console.error("快速登录失败:", error);
      return {
        success: false,
        message: "快速登录失败，服务器错误"
      };
    }
  }
  /**
   * 更新会话信息
   * 更新指定用户的会话数据
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param updates 要更新的字段
   * @returns 操作结果
   */
  async updateSession(username, accountType, updates) {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空"
        };
      }
      const updateData = { ...updates };
      if (typeof updateData.rememberMe === "boolean") {
        updateData.rememberMe = updateData.rememberMe ? 1 : 0;
      }
      if (typeof updateData.autoLogin === "boolean") {
        updateData.autoLogin = updateData.autoLogin ? 1 : 0;
      }
      if (typeof updateData.isActive === "boolean") {
        updateData.isActive = updateData.isActive ? 1 : 0;
      }
      if (updates.password) {
        updateData.password = await this.encryptPassword(updates.password);
      }
      updateData.lastLoginTime = Date.now();
      const success = await this.loginSessionModel.updateSession(
        username,
        accountType,
        updateData
      );
      if (success) {
        return {
          success: true,
          message: "会话更新成功"
        };
      } else {
        return {
          success: false,
          message: "会话不存在或更新失败"
        };
      }
    } catch (error) {
      console.error("更新会话失败:", error);
      return {
        success: false,
        message: "更新会话失败，服务器错误"
      };
    }
  }
  /**
   * 获取记住密码的用户列表
   * 用于登录页面显示历史登录用户
   *
   * @returns 记住密码的用户列表（消除了敏感信息）
   * ```typescript
   * {
   *   success: boolean;      // 操作是否成功
   *   message: string;      // 信息（错误信息 || 成功信息）
   *   data: Array<{
   *     username: string;    // 用户名
   *     accountType: string;  // 账户类型
   *     lastLoginTime: number; // 最后登录时间
   *     autoLogin: boolean;    // 是否启用自动登录
   *  }>;
   * ```
   */
  async getRememberedUsers() {
    try {
      const sessions = await this.loginSessionModel.getRememberedSessions();
      const userList = sessions.map((session) => ({
        username: session.username,
        accountType: session.accountType,
        lastLoginTime: session.lastLoginTime,
        autoLogin: !!session.autoLogin
      }));
      return {
        success: true,
        message: "获取记住的用户列表成功",
        data: userList
      };
    } catch (error) {
      console.error("获取记住的用户失败:", error);
      return {
        success: false,
        message: "获取用户列表失败"
      };
    }
  }
  /**
   * 验证记住的密码
   * 用于快速登录时验证保存的密码
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param inputPassword 用户输入的密码
   * @returns 验证结果
   */
  async validateRememberedPassword(username, accountType, inputPassword) {
    try {
      if (!username || !accountType || !inputPassword) {
        return {
          success: false,
          message: "参数不能为空"
        };
      }
      const sessions = await this.loginSessionModel.getRememberedSessions();
      const targetSession = sessions.find(
        (session) => session.username === username && session.accountType === accountType
      );
      if (!targetSession || !targetSession.password) {
        return {
          success: false,
          message: "未找到保存的密码信息"
        };
      }
      try {
        const decryptedPassword = await this.decryptPassword(
          targetSession.password
        );
        if (inputPassword === decryptedPassword) {
          await this.loginSessionModel.updateSession(username, accountType, {
            lastLoginTime: Date.now(),
            isActive: 1
          });
          return {
            success: true,
            message: "密码验证成功"
          };
        } else {
          return {
            success: false,
            message: "密码验证失败"
          };
        }
      } catch (decryptError) {
        console.error("解密密码失败:", decryptError);
        return {
          success: false,
          message: "密码信息已损坏，请重新登录"
        };
      }
    } catch (error) {
      console.error("验证记住的密码失败:", error);
      return {
        success: false,
        message: "密码验证失败，服务器错误"
      };
    }
  }
  /**
   * 获取自动登录信息
   * 应用启动时检查是否有用户设置了自动登录
   *
   * @returns 自动登录信息
   */
  async getAutoLoginInfo() {
    try {
      const session = await this.loginSessionModel.getAutoLoginSession();
      if (session) {
        return {
          success: true,
          message: "找到自动登录信息",
          data: {
            username: session.username,
            accountType: session.accountType,
            lastLoginTime: session.lastLoginTime,
            hasPassword: !!session.password
          }
        };
      } else {
        return {
          success: false,
          message: "未设置自动登录"
        };
      }
    } catch (error) {
      console.error("获取自动登录信息失败:", error);
      return {
        success: false,
        message: "获取自动登录信息失败"
      };
    }
  }
  /**
   * 获取当前活跃会话
   * 获取当前登录的用户信息
   *
   * @returns 当前活跃会话信息
   */
  async getCurrentSession() {
    try {
      const session = await this.loginSessionModel.getActiveSession();
      if (session) {
        return {
          success: true,
          message: "获取当前会话成功",
          data: {
            username: session.username,
            accountType: session.accountType,
            lastLoginTime: session.lastLoginTime,
            autoLogin: !!session.autoLogin,
            rememberMe: !!session.rememberMe
          }
        };
      } else {
        return {
          success: false,
          message: "当前无活跃会话"
        };
      }
    } catch (error) {
      console.error("获取当前会话失败:", error);
      return {
        success: false,
        message: "获取当前会话失败"
      };
    }
  }
  /**
   * 删除指定用户的会话
   * 用于移除记住的用户信息
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @returns 操作结果
   */
  async removeSession(username, accountType) {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空"
        };
      }
      const success = await this.loginSessionModel.deleteSession(
        username,
        accountType
      );
      if (success) {
        return {
          success: true,
          message: "会话删除成功"
        };
      } else {
        return {
          success: false,
          message: "会话不存在或删除失败"
        };
      }
    } catch (error) {
      console.error("删除会话失败:", error);
      return {
        success: false,
        message: "删除会话失败，服务器错误"
      };
    }
  }
  /**
   * 用户退出登录
   * 将当前活跃会话设为非活跃状态
   *
   * @param username 用户名
   * @param accountType 账户类型
   * @param keepRemembered 是否保留记住密码信息
   * @returns 操作结果
   */
  async logout(username, accountType, keepRemembered = true) {
    try {
      if (!username || !accountType) {
        return {
          success: false,
          message: "用户名和账户类型不能为空"
        };
      }
      if (keepRemembered) {
        const success = await this.loginSessionModel.updateSession(
          username,
          accountType,
          {
            isActive: 0,
            autoLogin: 0
            // 退出时取消自动登录
          }
        );
        if (success) {
          return {
            success: true,
            message: "退出登录成功"
          };
        } else {
          return {
            success: false,
            message: "退出登录失败"
          };
        }
      } else {
        return await this.removeSession(username, accountType);
      }
    } catch (error) {
      console.error("退出登录失败:", error);
      return {
        success: false,
        message: "退出登录失败，服务器错误"
      };
    }
  }
  /**
   * 清除所有会话数据
   * 清理所有保存的登录信息，用于重置功能
   *
   * @returns 操作结果
   */
  async clearAllSessions() {
    try {
      const success = await this.loginSessionModel.clearAllSessions();
      if (success) {
        return {
          success: true,
          message: "清除所有会话成功"
        };
      } else {
        return {
          success: false,
          message: "清除会话失败"
        };
      }
    } catch (error) {
      console.error("清除所有会话失败:", error);
      return {
        success: false,
        message: "清除会话失败，服务器错误"
      };
    }
  }
  /**
   * 获取登录历史记录
   * 获取所有登录会话的历史记录
   *
   * @returns 登录历史列表
   */
  async getLoginHistory() {
    try {
      const sessions = await this.loginSessionModel.getAllLoginSessions();
      const history = sessions.map((session) => ({
        username: session.username,
        accountType: session.accountType,
        lastLoginTime: session.lastLoginTime,
        isActive: !!session.isActive,
        rememberMe: !!session.rememberMe,
        autoLogin: !!session.autoLogin
      }));
      return {
        success: true,
        message: "获取登录历史成功",
        data: history
      };
    } catch (error) {
      console.error("获取登录历史失败:", error);
      return {
        success: false,
        message: "获取登录历史失败"
      };
    }
  }
  /**
   * 生成应用程序密钥
   * 基于应用程序特定信息生成密钥
   *
   * @returns 32字节密钥
   * @private
   */
  generateSecretKey() {
    const appSecret = "DailyUse-App-Secret-Key-2024";
    return crypto.scryptSync(appSecret, "session-salt", this.keyLength).toString("hex");
  }
  /**
   * AES密码加密
   * 使用AES-256-CBC算法对密码进行可逆加密
   *
   * @param password 原始密码
   * @returns 加密后的密码（包含IV）
   * @private
   */
  async encryptPassword(password) {
    try {
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(this.secretKey, "hex");
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(password, "utf8", "hex");
      encrypted += cipher.final("hex");
      const result = iv.toString("hex") + ":" + encrypted;
      return result;
    } catch (error) {
      console.error("密码加密失败:", error);
      throw new Error("密码加密失败");
    }
  }
  /**
   * AES密码解密
   * 解密使用AES-256-CBC算法加密的密码
   *
   * @param encryptedData 加密的密码数据（包含IV）
   * @returns 解密后的原始密码
   * @private
   */
  async decryptPassword(encryptedData) {
    try {
      const parts = encryptedData.split(":");
      if (parts.length !== 2) {
        throw new Error("加密数据格式错误");
      }
      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];
      const key = Buffer.from(this.secretKey, "hex");
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("密码解密失败:", error);
      throw new Error("密码解密失败");
    }
  }
};
__publicField(_LoginSessionService, "instance");
let LoginSessionService = _LoginSessionService;
const loginSessionService = LoginSessionService.getInstance();
async function setupLoginSessionHandlers() {
  try {
    const sessionService = await loginSessionService;
    ipcMain.handle(
      "session:saveSession",
      async (_event, sessionData) => {
        try {
          const sessionService2 = await loginSessionService;
          const existingResult = await sessionService2.getSession(
            sessionData.username,
            sessionData.accountType
          );
          if (existingResult.success && existingResult.data) {
            const updateResult = await sessionService2.updateSession(
              sessionData.username,
              sessionData.accountType,
              {
                password: sessionData.password,
                token: sessionData.token,
                rememberMe: sessionData.rememberMe,
                autoLogin: sessionData.autoLogin,
                isActive: true
              }
            );
            return {
              ...updateResult,
              message: updateResult.success ? "会话更新成功" : updateResult.message
            };
          } else {
            const createResult = await sessionService2.addSession(sessionData);
            return {
              ...createResult,
              message: createResult.success ? "会话创建成功" : createResult.message
            };
          }
        } catch (error) {
          console.error("IPC: 保存会话异常", error);
          return {
            success: false,
            message: error instanceof Error ? error.message : "保存会话失败，未知错误"
          };
        }
      }
    );
    ipcMain.handle(
      "session:quickLogin",
      async (_event, username, accountType) => {
        try {
          const result = await sessionService.quickLogin(username, accountType);
          return result;
        } catch (error) {
          console.error("IPC: 快速登录异常", error);
          return {
            success: false,
            message: error instanceof Error ? error.message : "快速登录失败，未知错误"
          };
        }
      }
    );
    ipcMain.handle(
      "session:create",
      async (_event, sessionData) => {
        console.log("IPC: 创建登录会话", {
          username: sessionData.username,
          accountType: sessionData.accountType
        });
        try {
          const existingResult = await sessionService.getSession(
            sessionData.username,
            sessionData.accountType
          );
          if (existingResult.success && existingResult.data) {
            console.log("IPC: 会话已存在，执行更新操作", {
              username: sessionData.username,
              accountType: sessionData.accountType
            });
            const updateResult = await sessionService.updateSession(
              sessionData.username,
              sessionData.accountType,
              {
                password: sessionData.password,
                token: sessionData.token,
                rememberMe: sessionData.rememberMe,
                autoLogin: sessionData.autoLogin,
                isActive: true
              }
            );
            return {
              ...updateResult,
              message: updateResult.success ? "会话更新成功" : updateResult.message
            };
          } else {
            console.log("IPC: 会话不存在，创建新会话", {
              username: sessionData.username,
              accountType: sessionData.accountType
            });
            const createResult = await sessionService.addSession(sessionData);
            return {
              ...createResult,
              message: createResult.success ? "会话创建成功" : createResult.message
            };
          }
        } catch (error) {
          console.error("IPC: 创建会话异常", error);
          return {
            success: false,
            message: error instanceof Error ? error.message : "创建会话失败，未知错误"
          };
        }
      }
    );
    ipcMain.handle(
      "session:update",
      async (_event, username, accountType, updates) => {
        return await sessionService.updateSession(
          username,
          accountType,
          updates
        );
      }
    );
    ipcMain.handle(
      "session:getRememberedUsers",
      async (_event) => {
        return await sessionService.getRememberedUsers();
      }
    );
    ipcMain.handle(
      "session:validatePassword",
      async (_event, username, accountType, inputPassword) => {
        return await sessionService.validateRememberedPassword(
          username,
          accountType,
          inputPassword
        );
      }
    );
    ipcMain.handle(
      "session:getAutoLoginInfo",
      async (_event) => {
        return await sessionService.getAutoLoginInfo();
      }
    );
    ipcMain.handle(
      "session:getCurrentSession",
      async (_event) => {
        return await sessionService.getCurrentSession();
      }
    );
    ipcMain.handle(
      "session:removeSession",
      async (_event, username, accountType) => {
        return await sessionService.removeSession(username, accountType);
      }
    );
    ipcMain.handle(
      "session:logout",
      async (_event, username, accountType, keepRemembered = true) => {
        console.log("IPC: 用户退出登录", {
          username,
          accountType,
          keepRemembered
        });
        return await sessionService.logout(
          username,
          accountType,
          keepRemembered
        );
      }
    );
    ipcMain.handle("session:clearAll", async (_event) => {
      return await sessionService.clearAllSessions();
    });
    ipcMain.handle(
      "session:getLoginHistory",
      async (_event) => {
        return await sessionService.getLoginHistory();
      }
    );
  } catch (error) {
    console.error("设置登录会话 IPC 处理器失败:", error);
    throw error;
  }
}
const _StoreService = class _StoreService {
  /**
   * 私有构造函数，确保单例模式
   */
  constructor() {
    __publicField(this, "db", null);
    __publicField(this, "isInitialized", false);
    __publicField(this, "initPromise", null);
  }
  /**
   * 获取 StoreService 的单例实例
   * @returns StoreService 实例
   */
  static getInstance() {
    if (!_StoreService.instance) {
      _StoreService.instance = new _StoreService();
    }
    return _StoreService.instance;
  }
  /**
   * 确保服务已初始化
   */
  async ensureInitialized() {
    if (this.isInitialized) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = this.initializeAsync();
    await this.initPromise;
    this.isInitialized = true;
  }
  /**
   * 异步初始化
   */
  async initializeAsync() {
    try {
      this.db = await getDatabase();
    } catch (error) {
      console.error("StoreService 初始化失败:", error);
      throw error;
    }
  }
  /**
   * 获取数据库实例
   */
  async getDB() {
    await this.ensureInitialized();
    if (!this.db) {
      throw new Error("数据库未初始化");
    }
    return this.db;
  }
  /**
   * 读取用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   * @returns 存储的数据或null
   */
  async readUserStore(username, storeName) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        SELECT data FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const result = stmt.get(username, storeName);
      if (result) {
        const parsedData = JSON.parse(result.data);
        return {
          success: true,
          data: parsedData,
          message: "读取数据成功"
        };
      }
      return {
        success: true,
        data: null,
        message: "未找到数据"
      };
    } catch (error) {
      console.error(`读取用户数据失败 (${storeName}):`, error);
      return {
        success: false,
        data: null,
        message: `读取数据失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 写入用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   * @param data 要存储的数据
   * 通过 IPC 传进来的数据是 JSON 格式的，先将其转换回对象，进行数据处理，再转回 JSON 字符串存储
   */
  async writeUserStore(username, storeName, data) {
    try {
      console.log(`写入用户数据 (${storeName})`, { username, data }, typeof data);
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        INSERT OR REPLACE INTO user_store_data 
        (username, store_name, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const now2 = Date.now();
      const existingStmt = db2.prepare(`
        SELECT created_at FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const existing = existingStmt.get(username, storeName);
      const createdAt = existing ? existing.created_at : now2;
      stmt.run(
        username,
        storeName,
        data,
        createdAt,
        now2
      );
      return {
        success: true,
        data: void 0,
        message: "写入数据成功"
      };
    } catch (error) {
      console.error(`写入用户数据失败 (${storeName}):`, error);
      return {
        success: false,
        data: void 0,
        message: `写入数据失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 删除用户特定的存储数据
   * @param username 用户名
   * @param storeName 存储名称
   */
  async deleteUserStore(username, storeName) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        DELETE FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const result = stmt.run(username, storeName);
      return {
        success: true,
        data: void 0,
        message: `删除数据成功，影响行数: ${result.changes}`
      };
    } catch (error) {
      console.error(`删除用户数据失败 (${storeName}):`, error);
      return {
        success: false,
        data: void 0,
        message: `删除数据失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户所有存储数据的列表
   * @param username 用户名
   */
  async getUserStoreList(username) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        SELECT store_name FROM user_store_data 
        WHERE username = ?
        ORDER BY store_name
      `);
      const results = stmt.all(username);
      const storeNames = results.map((row) => row.store_name);
      return {
        success: true,
        data: storeNames,
        message: `找到 ${storeNames.length} 个存储`
      };
    } catch (error) {
      console.error("获取用户存储列表失败:", error);
      return {
        success: false,
        data: [],
        message: `获取存储列表失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 导出用户所有数据
   * @param username 用户名
   * @param exportPath 导出文件路径（可选）
   */
  async exportUserData(username, exportPath) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        SELECT store_name, data, created_at, updated_at 
        FROM user_store_data 
        WHERE username = ?
        ORDER BY store_name
      `);
      const results = stmt.all(username);
      const stores = {};
      let totalSize = 0;
      for (const row of results) {
        try {
          stores[row.store_name] = JSON.parse(row.data);
          totalSize += row.data.length;
        } catch (parseError) {
          console.warn(`解析存储数据失败 (${row.store_name}):`, parseError);
          stores[row.store_name] = { _error: "数据解析失败", _rawData: row.data };
        }
      }
      const exportData = {
        username,
        exportTime: Date.now(),
        stores,
        metadata: {
          totalStores: Object.keys(stores).length,
          dataSize: totalSize
        }
      };
      if (exportPath) {
        try {
          await fs$1.writeFile(exportPath, JSON.stringify(exportData, null, 2), "utf-8");
        } catch (writeError) {
          console.error("写入导出文件失败:", writeError);
          return {
            success: false,
            data: exportData,
            message: `导出数据成功但写入文件失败: ${writeError instanceof Error ? writeError.message : "未知错误"}`
          };
        }
      }
      return {
        success: true,
        data: exportData,
        message: `导出 ${exportData.metadata.totalStores} 个存储数据成功`
      };
    } catch (error) {
      console.error("导出用户数据失败:", error);
      return {
        success: false,
        data: {},
        message: `导出数据失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 导入用户数据
   * @param username 用户名
   * @param importData 要导入的数据
   * @param overwrite 是否覆盖现有数据
   */
  async importUserData(username, importData, overwrite = false) {
    try {
      const db2 = await this.getDB();
      const insertStmt = db2.prepare(`
        INSERT OR ${overwrite ? "REPLACE" : "IGNORE"} INTO user_store_data 
        (username, store_name, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      let imported = 0;
      let skipped = 0;
      let errors = 0;
      const now2 = Date.now();
      const transaction = db2.transaction(() => {
        for (const [storeName, storeData] of Object.entries(importData.stores)) {
          try {
            const result = insertStmt.run(
              username,
              storeName,
              JSON.stringify(storeData),
              now2,
              now2
            );
            if (result.changes > 0) {
              imported++;
            } else {
              skipped++;
            }
          } catch (storeError) {
            console.error(`导入存储数据失败 (${storeName}):`, storeError);
            errors++;
          }
        }
      });
      transaction();
      return {
        success: true,
        data: { imported, skipped, errors },
        message: `导入完成: ${imported} 个成功, ${skipped} 个跳过, ${errors} 个错误`
      };
    } catch (error) {
      console.error("导入用户数据失败:", error);
      return {
        success: false,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入数据失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 删除用户所有数据
   * @param username 用户名
   */
  async clearUserData(username) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`DELETE FROM user_store_data WHERE username = ?`);
      const result = stmt.run(username);
      return {
        success: true,
        data: result.changes,
        message: `删除了 ${result.changes} 条用户数据`
      };
    } catch (error) {
      console.error("清除用户数据失败:", error);
      return {
        success: false,
        data: 0,
        message: `清除数据失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户数据统计信息
   * @param username 用户名
   */
  async getUserDataStats(username) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        SELECT store_name, LENGTH(data) as size, created_at, updated_at
        FROM user_store_data 
        WHERE username = ?
        ORDER BY updated_at DESC
      `);
      const results = stmt.all(username);
      const totalSize = results.reduce((sum, row) => sum + row.size, 0);
      const lastUpdated = results.length > 0 ? results[0].updated_at : null;
      const storeDetails = results.map((row) => ({
        storeName: row.store_name,
        size: row.size,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      return {
        success: true,
        data: {
          totalStores: results.length,
          totalSize,
          lastUpdated,
          storeDetails
        },
        message: "获取统计信息成功"
      };
    } catch (error) {
      console.error("获取用户数据统计失败:", error);
      return {
        success: false,
        data: {
          totalStores: 0,
          totalSize: 0,
          lastUpdated: null,
          storeDetails: []
        },
        message: `获取统计信息失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 检查存储是否存在
   * @param username 用户名
   * @param storeName 存储名称
   */
  async hasUserStore(username, storeName) {
    try {
      const db2 = await this.getDB();
      const stmt = db2.prepare(`
        SELECT 1 FROM user_store_data 
        WHERE username = ? AND store_name = ?
      `);
      const result = stmt.get(username, storeName);
      return {
        success: true,
        data: !!result,
        message: result ? "存储存在" : "存储不存在"
      };
    } catch (error) {
      console.error("检查存储存在性失败:", error);
      return {
        success: false,
        data: false,
        message: `检查失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
};
// 单例实例
__publicField(_StoreService, "instance");
let StoreService = _StoreService;
const storeService = StoreService.getInstance();
class StoreIpc {
  /**
   * 注册所有 Store 相关的 IPC 处理程序
   */
  static registerHandlers() {
    ipcMain.handle("store:read", this.handleReadUserStore.bind(this));
    ipcMain.handle("store:write", this.handleWriteUserStore.bind(this));
    ipcMain.handle("store:delete", this.handleDeleteUserStore.bind(this));
    ipcMain.handle("store:has", this.handleHasUserStore.bind(this));
    ipcMain.handle("store:list", this.handleGetUserStoreList.bind(this));
    ipcMain.handle("store:clear", this.handleClearUserData.bind(this));
    ipcMain.handle("store:stats", this.handleGetUserDataStats.bind(this));
    ipcMain.handle("store:export", this.handleExportUserData.bind(this));
    ipcMain.handle("store:export-to-file", this.handleExportUserDataToFile.bind(this));
    ipcMain.handle("store:import", this.handleImportUserData.bind(this));
    ipcMain.handle("store:import-from-file", this.handleImportUserDataFromFile.bind(this));
  }
  /**
   * 移除所有 Store 相关的 IPC 处理程序
   */
  static removeHandlers() {
    const channels = [
      "store:read",
      "store:write",
      "store:delete",
      "store:has",
      "store:list",
      "store:clear",
      "store:stats",
      "store:export",
      "store:export-to-file",
      "store:import",
      "store:import-from-file"
    ];
    channels.forEach((channel) => {
      ipcMain.removeAllListeners(channel);
    });
  }
  /**
   * 读取用户存储数据
   */
  static async handleReadUserStore(_event, username, storeName) {
    try {
      return await storeService.readUserStore(username, storeName);
    } catch (error) {
      console.error("IPC: 读取用户存储数据失败:", error);
      return {
        success: false,
        data: null,
        message: `读取失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 写入用户存储数据
   */
  static async handleWriteUserStore(_event, username, storeName, data) {
    try {
      return await storeService.writeUserStore(username, storeName, data);
    } catch (error) {
      console.error("IPC: 写入用户存储数据失败:", error);
      return {
        success: false,
        data: void 0,
        message: `写入失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 删除用户存储数据
   */
  static async handleDeleteUserStore(_event, username, storeName) {
    try {
      return await storeService.deleteUserStore(username, storeName);
    } catch (error) {
      console.error("IPC: 删除用户存储数据失败:", error);
      return {
        success: false,
        data: void 0,
        message: `删除失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 检查用户存储数据是否存在
   */
  static async handleHasUserStore(_event, username, storeName) {
    try {
      return await storeService.hasUserStore(username, storeName);
    } catch (error) {
      console.error("IPC: 检查用户存储数据失败:", error);
      return {
        success: false,
        data: false,
        message: `检查失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户所有存储数据列表
   */
  static async handleGetUserStoreList(_event, username) {
    try {
      return await storeService.getUserStoreList(username);
    } catch (error) {
      console.error("IPC: 获取用户存储列表失败:", error);
      return {
        success: false,
        data: [],
        message: `获取列表失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 清除用户所有数据
   */
  static async handleClearUserData(_event, username) {
    try {
      return await storeService.clearUserData(username);
    } catch (error) {
      console.error("IPC: 清除用户数据失败:", error);
      return {
        success: false,
        data: 0,
        message: `清除失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 获取用户数据统计信息
   */
  static async handleGetUserDataStats(_event, username) {
    try {
      return await storeService.getUserDataStats(username);
    } catch (error) {
      console.error("IPC: 获取用户数据统计失败:", error);
      return {
        success: false,
        data: {
          totalStores: 0,
          totalSize: 0,
          lastUpdated: null,
          storeDetails: []
        },
        message: `获取统计失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 导出用户数据（仅返回数据，不写入文件）
   */
  static async handleExportUserData(_event, username) {
    try {
      return await storeService.exportUserData(username);
    } catch (error) {
      console.error("IPC: 导出用户数据失败:", error);
      return {
        success: false,
        data: {},
        message: `导出失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 导出用户数据到文件（显示保存对话框）
   */
  static async handleExportUserDataToFile(_event, username) {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "导出用户数据",
        defaultPath: `${username}_data_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`,
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
          { name: "所有文件", extensions: ["*"] }
        ]
      });
      if (canceled || !filePath) {
        return {
          success: false,
          data: {},
          message: "用户取消了导出操作"
        };
      }
      return await storeService.exportUserData(username, filePath);
    } catch (error) {
      console.error("IPC: 导出用户数据到文件失败:", error);
      return {
        success: false,
        data: {},
        message: `导出失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 导入用户数据
   */
  static async handleImportUserData(_event, username, importData, overwrite = false) {
    try {
      return await storeService.importUserData(username, importData, overwrite);
    } catch (error) {
      console.error("IPC: 导入用户数据失败:", error);
      return {
        success: false,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
  /**
   * 从文件导入用户数据（显示打开对话框）
   */
  static async handleImportUserDataFromFile(_event, username, overwrite = false) {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "选择导入文件",
        filters: [
          { name: "JSON 文件", extensions: ["json"] },
          { name: "所有文件", extensions: ["*"] }
        ],
        properties: ["openFile"]
      });
      if (canceled || filePaths.length === 0) {
        return {
          success: false,
          data: { imported: 0, skipped: 0, errors: 0 },
          message: "用户取消了导入操作"
        };
      }
      const filePath = filePaths[0];
      const fs2 = await import("fs/promises");
      const fileContent = await fs2.readFile(filePath, "utf-8");
      const importData = JSON.parse(fileContent);
      if (!importData.username || !importData.stores) {
        return {
          success: false,
          data: { imported: 0, skipped: 0, errors: 0 },
          message: "无效的数据格式"
        };
      }
      return await storeService.importUserData(username, importData, overwrite);
    } catch (error) {
      console.error("IPC: 从文件导入用户数据失败:", error);
      return {
        success: false,
        data: { imported: 0, skipped: 0, errors: 0 },
        message: `导入失败: ${error instanceof Error ? error.message : "未知错误"}`
      };
    }
  }
}
function registerFileSystemHandlers() {
  ipcMain.handle("open-file-explorer", async () => {
    shell.openPath(sysPath__default.join(__dirname, "..", "..", "..", "src"));
  });
  ipcMain.handle("open-file-in-explorer", async (_event, filePath) => {
    try {
      const fileExists = await fs$1.access(filePath).then(() => true).catch(() => false);
      if (fileExists) {
        shell.showItemInFolder(filePath);
      } else {
        throw new Error(`File does not exist: ${filePath}`);
      }
    } catch (error) {
      console.error("Error opening file in explorer:", error);
      throw error;
    }
  });
  ipcMain.handle("read-folder", async (_, folderPath) => {
    try {
      const files = await fs$1.readdir(folderPath, { withFileTypes: true });
      return files.map((file) => ({
        name: file.name,
        path: sysPath__default.join(folderPath, file.name),
        isDirectory: file.isDirectory(),
        key: sysPath__default.join(folderPath, file.name)
      }));
    } catch (error) {
      console.error("Error reading folder:", error);
      throw error;
    }
  });
  ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    if (result.canceled) {
      return {
        success: false,
        message: "Folder selected canceled",
        data: null
      };
    } else {
      const folderPath = result.filePaths[0];
      const files = await fs$1.readdir(folderPath).then(
        (fileNames) => Promise.all(
          fileNames.map(async (fileName) => {
            const filePath = sysPath__default.join(folderPath, fileName);
            const stats = await fs$1.lstat(filePath);
            return {
              name: fileName,
              path: filePath,
              isDirectory: stats.isDirectory()
            };
          })
        )
      );
      return {
        success: true,
        message: "Folder selected successfully",
        data: { folderPath, files }
      };
    }
  });
  ipcMain.handle("file-or-folder-exists", async (_event, path2) => {
    try {
      await fs$1.access(path2);
      return true;
    } catch (error) {
      return false;
    }
  });
  ipcMain.handle("create-folder", async (_event, filePath) => {
    await fs$1.mkdir(filePath, { recursive: true });
  });
  ipcMain.handle("create-file", async (_event, filePath, content = "") => {
    await fs$1.writeFile(filePath, content, "utf8");
  });
  ipcMain.handle("rename-file-or-folder", async (_event, oldPath, newPath) => {
    try {
      const exists = await fs$1.access(newPath).then(() => true).catch(() => false);
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
      await fs$1.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error("Rename error:", error);
      throw error;
    }
  });
  ipcMain.handle("delete-file-or-folder", async (_event, path2, isDirectory) => {
    if (isDirectory) {
      await shell.trashItem(path2);
    } else {
      await shell.trashItem(path2);
    }
  });
  ipcMain.handle("read-file", async (_event, path2, encoding = "utf-8") => {
    try {
      return await fs$1.readFile(path2, encoding);
    } catch (error) {
      console.error("读取文件失败:", error);
      throw error;
    }
  });
  ipcMain.handle("write-file", async (_event, path2, data, encoding) => {
    try {
      const options = {
        encoding: encoding ?? (typeof data === "string" ? "utf-8" : null),
        flag: "w"
      };
      await fs$1.writeFile(path2, data, options);
    } catch (error) {
      console.error("写入文件失败:", error);
      throw error;
    }
  });
  ipcMain.handle("get-folder-tree", async (_event, folderPath) => {
    const folderTreeData = await generateTree(folderPath);
    return folderTreeData;
  });
  async function generateTree(dir) {
    try {
      const items = await fs$1.readdir(dir, { withFileTypes: true });
      const children = await Promise.all(
        items.map(async (item) => {
          const fullPath = sysPath__default.join(dir, item.name);
          const fileType = item.isDirectory() ? "directory" : sysPath__default.extname(item.name).slice(1) || "file";
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
  ipcMain.handle("refresh-folder", async (_event, folderPath) => {
    const folderTreeData = await generateTree(folderPath);
    return {
      success: true,
      message: "Folder refreshed successfully",
      data: {
        folderTreeData,
        folderPath
      }
    };
  });
  ipcMain.handle("arrayBuffer-to-buffer", async (_event, arrayBuffer) => {
    return Buffer$1.from(arrayBuffer);
  });
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var dist$1 = {};
var src$1 = {};
var src = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s2 = 1e3;
  var m = s2 * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type2 = typeof val;
    if (type2 === "string" && val.length > 0) {
      return parse3(val);
    } else if (type2 === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse3(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match2 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match2) {
      return;
    }
    var n2 = parseFloat(match2[1]);
    var type2 = (match2[2] || "ms").toLowerCase();
    switch (type2) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n2 * y;
      case "weeks":
      case "week":
      case "w":
        return n2 * w;
      case "days":
      case "day":
      case "d":
        return n2 * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n2 * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n2 * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n2 * s2;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n2;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s2) {
      return Math.round(ms2 / s2) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s2) {
      return plural(ms2, msAbs, s2, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n2, name) {
    var isPlural = msAbs >= n2 * 1.5;
    return Math.round(ms2 / n2) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var common;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = requireMs();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug2(...args) {
        if (!debug2.enabled) {
          return;
        }
        const self2 = debug2;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match2, format) => {
          if (match2 === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match2 = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match2;
        });
        createDebug.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug.log;
        logFn.apply(self2, args);
      }
      debug2.namespace = namespace;
      debug2.useColors = createDebug.useColors();
      debug2.color = createDebug.selectColor(namespace);
      debug2.extend = extend;
      debug2.destroy = createDebug.destroy;
      Object.defineProperty(debug2, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug2);
      }
      return debug2;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  common = setup;
  return common;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module, exports) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match2) => {
        if (match2 === "%%") {
          return;
        }
        index++;
        if (match2 === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = requireCommon()(exports);
    const { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var node = { exports: {} };
var hasFlag;
var hasRequiredHasFlag;
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag;
  hasRequiredHasFlag = 1;
  hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
  return hasFlag;
}
var supportsColor_1;
var hasRequiredSupportsColor;
function requireSupportsColor() {
  if (hasRequiredSupportsColor) return supportsColor_1;
  hasRequiredSupportsColor = 1;
  const os = require$$0;
  const tty = require$$1;
  const hasFlag2 = requireHasFlag();
  const { env } = process;
  let forceColor;
  if (hasFlag2("no-color") || hasFlag2("no-colors") || hasFlag2("color=false") || hasFlag2("color=never")) {
    forceColor = 0;
  } else if (hasFlag2("color") || hasFlag2("colors") || hasFlag2("color=true") || hasFlag2("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag2("color=16m") || hasFlag2("color=full") || hasFlag2("color=truecolor")) {
      return 3;
    }
    if (hasFlag2("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream, stream && stream.isTTY);
    return translateLevel(level);
  }
  supportsColor_1 = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
  return supportsColor_1;
}
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function(module, exports) {
    const tty = require$$1;
    const util = require$$1$1;
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = requireSupportsColor();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = requireCommon()(exports);
    const { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  })(node, node.exports);
  return node.exports;
}
if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
  src.exports = requireBrowser();
} else {
  src.exports = requireNode();
}
var srcExports = src.exports;
const debug = /* @__PURE__ */ getDefaultExportFromCjs(srcExports);
(function(exports) {
  var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  const fs_1 = require$$0$1;
  const debug_1 = __importDefault(srcExports);
  const log = debug_1.default("@kwsites/file-exists");
  function check(path2, isFile, isDirectory) {
    log(`checking %s`, path2);
    try {
      const stat2 = fs_1.statSync(path2);
      if (stat2.isFile() && isFile) {
        log(`[OK] path represents a file`);
        return true;
      }
      if (stat2.isDirectory() && isDirectory) {
        log(`[OK] path represents a directory`);
        return true;
      }
      log(`[FAIL] path represents something other than a file or directory`);
      return false;
    } catch (e) {
      if (e.code === "ENOENT") {
        log(`[FAIL] path is not accessible: %o`, e);
        return false;
      }
      log(`[FATAL] %o`, e);
      throw e;
    }
  }
  function exists(path2, type2 = exports.READABLE) {
    return check(path2, (type2 & exports.FILE) > 0, (type2 & exports.FOLDER) > 0);
  }
  exports.exists = exists;
  exports.FILE = 1;
  exports.FOLDER = 2;
  exports.READABLE = exports.FILE + exports.FOLDER;
})(src$1);
(function(exports) {
  function __export2(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
  }
  Object.defineProperty(exports, "__esModule", { value: true });
  __export2(src$1);
})(dist$1);
var dist = {};
Object.defineProperty(dist, "__esModule", { value: true });
var createDeferred = dist.createDeferred = deferred_1 = dist.deferred = void 0;
function deferred() {
  let done;
  let fail;
  let status = "pending";
  const promise = new Promise((_done, _fail) => {
    done = _done;
    fail = _fail;
  });
  return {
    promise,
    done(result) {
      if (status === "pending") {
        status = "resolved";
        done(result);
      }
    },
    fail(error) {
      if (status === "pending") {
        status = "rejected";
        fail(error);
      }
    },
    get fulfilled() {
      return status !== "pending";
    },
    get status() {
      return status;
    }
  };
}
var deferred_1 = dist.deferred = deferred;
createDeferred = dist.createDeferred = deferred;
dist.default = deferred;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp2({}, "__esModule", { value: true }), mod);
function pathspec(...paths) {
  const key = new String(paths);
  cache.set(key, paths);
  return key;
}
function isPathSpec(path2) {
  return path2 instanceof String && cache.has(path2);
}
function toPaths(pathSpec) {
  return cache.get(pathSpec) || [];
}
var cache;
var init_pathspec = __esm({
  "src/lib/args/pathspec.ts"() {
    cache = /* @__PURE__ */ new WeakMap();
  }
});
var GitError;
var init_git_error = __esm({
  "src/lib/errors/git-error.ts"() {
    GitError = class extends Error {
      constructor(task, message) {
        super(message);
        this.task = task;
        Object.setPrototypeOf(this, new.target.prototype);
      }
    };
  }
});
var GitResponseError;
var init_git_response_error = __esm({
  "src/lib/errors/git-response-error.ts"() {
    init_git_error();
    GitResponseError = class extends GitError {
      constructor(git, message) {
        super(void 0, message || String(git));
        this.git = git;
      }
    };
  }
});
var TaskConfigurationError;
var init_task_configuration_error = __esm({
  "src/lib/errors/task-configuration-error.ts"() {
    init_git_error();
    TaskConfigurationError = class extends GitError {
      constructor(message) {
        super(void 0, message);
      }
    };
  }
});
function asFunction(source) {
  if (typeof source !== "function") {
    return NOOP;
  }
  return source;
}
function isUserFunction(source) {
  return typeof source === "function" && source !== NOOP;
}
function splitOn(input, char) {
  const index = input.indexOf(char);
  if (index <= 0) {
    return [input, ""];
  }
  return [input.substr(0, index), input.substr(index + 1)];
}
function first(input, offset2 = 0) {
  return isArrayLike(input) && input.length > offset2 ? input[offset2] : void 0;
}
function last(input, offset2 = 0) {
  if (isArrayLike(input) && input.length > offset2) {
    return input[input.length - 1 - offset2];
  }
}
function isArrayLike(input) {
  return !!(input && typeof input.length === "number");
}
function toLinesWithContent(input = "", trimmed2 = true, separator = "\n") {
  return input.split(separator).reduce((output, line) => {
    const lineContent = trimmed2 ? line.trim() : line;
    if (lineContent) {
      output.push(lineContent);
    }
    return output;
  }, []);
}
function forEachLineWithContent(input, callback) {
  return toLinesWithContent(input, true).map((line) => callback(line));
}
function folderExists(path2) {
  return dist$1.exists(path2, dist$1.FOLDER);
}
function append(target, item) {
  if (Array.isArray(target)) {
    if (!target.includes(item)) {
      target.push(item);
    }
  } else {
    target.add(item);
  }
  return item;
}
function including(target, item) {
  if (Array.isArray(target) && !target.includes(item)) {
    target.push(item);
  }
  return target;
}
function remove$1(target, item) {
  if (Array.isArray(target)) {
    const index = target.indexOf(item);
    if (index >= 0) {
      target.splice(index, 1);
    }
  } else {
    target.delete(item);
  }
  return item;
}
function asArray(source) {
  return Array.isArray(source) ? source : [source];
}
function asCamelCase(str) {
  return str.replace(/[\s-]+(.)/g, (_all, chr) => {
    return chr.toUpperCase();
  });
}
function asStringArray(source) {
  return asArray(source).map(String);
}
function asNumber$1(source, onNaN = 0) {
  if (source == null) {
    return onNaN;
  }
  const num = parseInt(source, 10);
  return isNaN(num) ? onNaN : num;
}
function prefixedArray(input, prefix) {
  const output = [];
  for (let i = 0, max = input.length; i < max; i++) {
    output.push(prefix, input[i]);
  }
  return output;
}
function bufferToString(input) {
  return (Array.isArray(input) ? Buffer$2.concat(input) : input).toString("utf-8");
}
function pick$1(source, properties) {
  return Object.assign(
    {},
    ...properties.map((property) => property in source ? { [property]: source[property] } : {})
  );
}
function delay(duration = 0) {
  return new Promise((done) => setTimeout(done, duration));
}
function orVoid(input) {
  if (input === false) {
    return void 0;
  }
  return input;
}
var NULL, NOOP, objectToString;
var init_util = __esm({
  "src/lib/utils/util.ts"() {
    NULL = "\0";
    NOOP = () => {
    };
    objectToString = Object.prototype.toString.call.bind(Object.prototype.toString);
  }
});
function filterType(input, filter, def) {
  if (filter(input)) {
    return input;
  }
  return arguments.length > 2 ? def : void 0;
}
function filterPrimitives(input, omit) {
  const type2 = isPathSpec(input) ? "string" : typeof input;
  return /number|string|boolean/.test(type2) && (!omit || !omit.includes(type2));
}
function filterPlainObject(input) {
  return !!input && objectToString(input) === "[object Object]";
}
function filterFunction(input) {
  return typeof input === "function";
}
var filterArray, filterString, filterStringArray, filterStringOrStringArray, filterHasLength;
var init_argument_filters = __esm({
  "src/lib/utils/argument-filters.ts"() {
    init_util();
    init_pathspec();
    filterArray = (input) => {
      return Array.isArray(input);
    };
    filterString = (input) => {
      return typeof input === "string";
    };
    filterStringArray = (input) => {
      return Array.isArray(input) && input.every(filterString);
    };
    filterStringOrStringArray = (input) => {
      return filterString(input) || Array.isArray(input) && input.every(filterString);
    };
    filterHasLength = (input) => {
      if (input == null || "number|boolean|function".includes(typeof input)) {
        return false;
      }
      return Array.isArray(input) || typeof input === "string" || typeof input.length === "number";
    };
  }
});
var ExitCodes;
var init_exit_codes = __esm({
  "src/lib/utils/exit-codes.ts"() {
    ExitCodes = /* @__PURE__ */ ((ExitCodes2) => {
      ExitCodes2[ExitCodes2["SUCCESS"] = 0] = "SUCCESS";
      ExitCodes2[ExitCodes2["ERROR"] = 1] = "ERROR";
      ExitCodes2[ExitCodes2["NOT_FOUND"] = -2] = "NOT_FOUND";
      ExitCodes2[ExitCodes2["UNCLEAN"] = 128] = "UNCLEAN";
      return ExitCodes2;
    })(ExitCodes || {});
  }
});
var GitOutputStreams;
var init_git_output_streams = __esm({
  "src/lib/utils/git-output-streams.ts"() {
    GitOutputStreams = class _GitOutputStreams {
      constructor(stdOut, stdErr) {
        this.stdOut = stdOut;
        this.stdErr = stdErr;
      }
      asStrings() {
        return new _GitOutputStreams(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
      }
    };
  }
});
var LineParser, RemoteLineParser;
var init_line_parser = __esm({
  "src/lib/utils/line-parser.ts"() {
    LineParser = class {
      constructor(regExp, useMatches) {
        this.matches = [];
        this.parse = (line, target) => {
          this.resetMatches();
          if (!this._regExp.every((reg, index) => this.addMatch(reg, index, line(index)))) {
            return false;
          }
          return this.useMatches(target, this.prepareMatches()) !== false;
        };
        this._regExp = Array.isArray(regExp) ? regExp : [regExp];
        if (useMatches) {
          this.useMatches = useMatches;
        }
      }
      // @ts-ignore
      useMatches(target, match2) {
        throw new Error(`LineParser:useMatches not implemented`);
      }
      resetMatches() {
        this.matches.length = 0;
      }
      prepareMatches() {
        return this.matches;
      }
      addMatch(reg, index, line) {
        const matched = line && reg.exec(line);
        if (matched) {
          this.pushMatch(index, matched);
        }
        return !!matched;
      }
      pushMatch(_index, matched) {
        this.matches.push(...matched.slice(1));
      }
    };
    RemoteLineParser = class extends LineParser {
      addMatch(reg, index, line) {
        return /^remote:\s/.test(String(line)) && super.addMatch(reg, index, line);
      }
      pushMatch(index, matched) {
        if (index > 0 || matched.length > 1) {
          super.pushMatch(index, matched);
        }
      }
    };
  }
});
function createInstanceConfig(...options) {
  const baseDir = process.cwd();
  const config = Object.assign(
    { baseDir, ...defaultOptions$1 },
    ...options.filter((o) => typeof o === "object" && o)
  );
  config.baseDir = config.baseDir || baseDir;
  config.trimmed = config.trimmed === true;
  return config;
}
var defaultOptions$1;
var init_simple_git_options = __esm({
  "src/lib/utils/simple-git-options.ts"() {
    defaultOptions$1 = {
      binary: "git",
      maxConcurrentProcesses: 5,
      config: [],
      trimmed: false
    };
  }
});
function appendTaskOptions(options, commands = []) {
  if (!filterPlainObject(options)) {
    return commands;
  }
  return Object.keys(options).reduce((commands2, key) => {
    const value = options[key];
    if (isPathSpec(value)) {
      commands2.push(value);
    } else if (filterPrimitives(value, ["boolean"])) {
      commands2.push(key + "=" + value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        if (!filterPrimitives(v, ["string", "number"])) {
          commands2.push(key + "=" + v);
        }
      }
    } else {
      commands2.push(key);
    }
    return commands2;
  }, commands);
}
function getTrailingOptions(args, initialPrimitive = 0, objectOnly = false) {
  const command = [];
  for (let i = 0, max = initialPrimitive < 0 ? args.length : initialPrimitive; i < max; i++) {
    if ("string|number".includes(typeof args[i])) {
      command.push(String(args[i]));
    }
  }
  appendTaskOptions(trailingOptionsArgument(args), command);
  if (!objectOnly) {
    command.push(...trailingArrayArgument(args));
  }
  return command;
}
function trailingArrayArgument(args) {
  const hasTrailingCallback = typeof last(args) === "function";
  return filterType(last(args, hasTrailingCallback ? 1 : 0), filterArray, []);
}
function trailingOptionsArgument(args) {
  const hasTrailingCallback = filterFunction(last(args));
  return filterType(last(args, hasTrailingCallback ? 1 : 0), filterPlainObject);
}
function trailingFunctionArgument(args, includeNoop = true) {
  const callback = asFunction(last(args));
  return includeNoop || isUserFunction(callback) ? callback : void 0;
}
var init_task_options = __esm({
  "src/lib/utils/task-options.ts"() {
    init_argument_filters();
    init_util();
    init_pathspec();
  }
});
function callTaskParser(parser4, streams) {
  return parser4(streams.stdOut, streams.stdErr);
}
function parseStringResponse(result, parsers12, texts, trim = true) {
  asArray(texts).forEach((text) => {
    for (let lines = toLinesWithContent(text, trim), i = 0, max = lines.length; i < max; i++) {
      const line = (offset2 = 0) => {
        if (i + offset2 >= max) {
          return;
        }
        return lines[i + offset2];
      };
      parsers12.some(({ parse: parse3 }) => parse3(line, result));
    }
  });
  return result;
}
var init_task_parser = __esm({
  "src/lib/utils/task-parser.ts"() {
    init_util();
  }
});
var utils_exports = {};
__export(utils_exports, {
  ExitCodes: () => ExitCodes,
  GitOutputStreams: () => GitOutputStreams,
  LineParser: () => LineParser,
  NOOP: () => NOOP,
  NULL: () => NULL,
  RemoteLineParser: () => RemoteLineParser,
  append: () => append,
  appendTaskOptions: () => appendTaskOptions,
  asArray: () => asArray,
  asCamelCase: () => asCamelCase,
  asFunction: () => asFunction,
  asNumber: () => asNumber$1,
  asStringArray: () => asStringArray,
  bufferToString: () => bufferToString,
  callTaskParser: () => callTaskParser,
  createInstanceConfig: () => createInstanceConfig,
  delay: () => delay,
  filterArray: () => filterArray,
  filterFunction: () => filterFunction,
  filterHasLength: () => filterHasLength,
  filterPlainObject: () => filterPlainObject,
  filterPrimitives: () => filterPrimitives,
  filterString: () => filterString,
  filterStringArray: () => filterStringArray,
  filterStringOrStringArray: () => filterStringOrStringArray,
  filterType: () => filterType,
  first: () => first,
  folderExists: () => folderExists,
  forEachLineWithContent: () => forEachLineWithContent,
  getTrailingOptions: () => getTrailingOptions,
  including: () => including,
  isUserFunction: () => isUserFunction,
  last: () => last,
  objectToString: () => objectToString,
  orVoid: () => orVoid,
  parseStringResponse: () => parseStringResponse,
  pick: () => pick$1,
  prefixedArray: () => prefixedArray,
  remove: () => remove$1,
  splitOn: () => splitOn,
  toLinesWithContent: () => toLinesWithContent,
  trailingFunctionArgument: () => trailingFunctionArgument,
  trailingOptionsArgument: () => trailingOptionsArgument
});
var init_utils = __esm({
  "src/lib/utils/index.ts"() {
    init_argument_filters();
    init_exit_codes();
    init_git_output_streams();
    init_line_parser();
    init_simple_git_options();
    init_task_options();
    init_task_parser();
    init_util();
  }
});
var check_is_repo_exports = {};
__export(check_is_repo_exports, {
  CheckRepoActions: () => CheckRepoActions,
  checkIsBareRepoTask: () => checkIsBareRepoTask,
  checkIsRepoRootTask: () => checkIsRepoRootTask,
  checkIsRepoTask: () => checkIsRepoTask
});
function checkIsRepoTask(action) {
  switch (action) {
    case "bare":
      return checkIsBareRepoTask();
    case "root":
      return checkIsRepoRootTask();
  }
  const commands = ["rev-parse", "--is-inside-work-tree"];
  return {
    commands,
    format: "utf-8",
    onError,
    parser: parser$1
  };
}
function checkIsRepoRootTask() {
  const commands = ["rev-parse", "--git-dir"];
  return {
    commands,
    format: "utf-8",
    onError,
    parser(path2) {
      return /^\.(git)?$/.test(path2.trim());
    }
  };
}
function checkIsBareRepoTask() {
  const commands = ["rev-parse", "--is-bare-repository"];
  return {
    commands,
    format: "utf-8",
    onError,
    parser: parser$1
  };
}
function isNotRepoMessage(error) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(error));
}
var CheckRepoActions, onError, parser$1;
var init_check_is_repo = __esm({
  "src/lib/tasks/check-is-repo.ts"() {
    init_utils();
    CheckRepoActions = /* @__PURE__ */ ((CheckRepoActions2) => {
      CheckRepoActions2["BARE"] = "bare";
      CheckRepoActions2["IN_TREE"] = "tree";
      CheckRepoActions2["IS_REPO_ROOT"] = "root";
      return CheckRepoActions2;
    })(CheckRepoActions || {});
    onError = ({ exitCode }, error, done, fail) => {
      if (exitCode === 128 && isNotRepoMessage(error)) {
        return done(Buffer.from("false"));
      }
      fail(error);
    };
    parser$1 = (text) => {
      return text.trim() === "true";
    };
  }
});
function cleanSummaryParser(dryRun, text) {
  const summary = new CleanResponse(dryRun);
  const regexp = dryRun ? dryRunRemovalRegexp : removalRegexp;
  toLinesWithContent(text).forEach((line) => {
    const removed = line.replace(regexp, "");
    summary.paths.push(removed);
    (isFolderRegexp.test(removed) ? summary.folders : summary.files).push(removed);
  });
  return summary;
}
var CleanResponse, removalRegexp, dryRunRemovalRegexp, isFolderRegexp;
var init_CleanSummary = __esm({
  "src/lib/responses/CleanSummary.ts"() {
    init_utils();
    CleanResponse = class {
      constructor(dryRun) {
        this.dryRun = dryRun;
        this.paths = [];
        this.files = [];
        this.folders = [];
      }
    };
    removalRegexp = /^[a-z]+\s*/i;
    dryRunRemovalRegexp = /^[a-z]+\s+[a-z]+\s*/i;
    isFolderRegexp = /\/$/;
  }
});
var task_exports = {};
__export(task_exports, {
  EMPTY_COMMANDS: () => EMPTY_COMMANDS,
  adhocExecTask: () => adhocExecTask,
  configurationErrorTask: () => configurationErrorTask,
  isBufferTask: () => isBufferTask,
  isEmptyTask: () => isEmptyTask,
  straightThroughBufferTask: () => straightThroughBufferTask,
  straightThroughStringTask: () => straightThroughStringTask
});
function adhocExecTask(parser4) {
  return {
    commands: EMPTY_COMMANDS,
    format: "empty",
    parser: parser4
  };
}
function configurationErrorTask(error) {
  return {
    commands: EMPTY_COMMANDS,
    format: "empty",
    parser() {
      throw typeof error === "string" ? new TaskConfigurationError(error) : error;
    }
  };
}
function straightThroughStringTask(commands, trimmed2 = false) {
  return {
    commands,
    format: "utf-8",
    parser(text) {
      return trimmed2 ? String(text).trim() : text;
    }
  };
}
function straightThroughBufferTask(commands) {
  return {
    commands,
    format: "buffer",
    parser(buffer) {
      return buffer;
    }
  };
}
function isBufferTask(task) {
  return task.format === "buffer";
}
function isEmptyTask(task) {
  return task.format === "empty" || !task.commands.length;
}
var EMPTY_COMMANDS;
var init_task = __esm({
  "src/lib/tasks/task.ts"() {
    init_task_configuration_error();
    EMPTY_COMMANDS = [];
  }
});
var clean_exports = {};
__export(clean_exports, {
  CONFIG_ERROR_INTERACTIVE_MODE: () => CONFIG_ERROR_INTERACTIVE_MODE,
  CONFIG_ERROR_MODE_REQUIRED: () => CONFIG_ERROR_MODE_REQUIRED,
  CONFIG_ERROR_UNKNOWN_OPTION: () => CONFIG_ERROR_UNKNOWN_OPTION,
  CleanOptions: () => CleanOptions,
  cleanTask: () => cleanTask,
  cleanWithOptionsTask: () => cleanWithOptionsTask,
  isCleanOptionsArray: () => isCleanOptionsArray
});
function cleanWithOptionsTask(mode, customArgs) {
  const { cleanMode, options, valid } = getCleanOptions(mode);
  if (!cleanMode) {
    return configurationErrorTask(CONFIG_ERROR_MODE_REQUIRED);
  }
  if (!valid.options) {
    return configurationErrorTask(CONFIG_ERROR_UNKNOWN_OPTION + JSON.stringify(mode));
  }
  options.push(...customArgs);
  if (options.some(isInteractiveMode)) {
    return configurationErrorTask(CONFIG_ERROR_INTERACTIVE_MODE);
  }
  return cleanTask(cleanMode, options);
}
function cleanTask(mode, customArgs) {
  const commands = ["clean", `-${mode}`, ...customArgs];
  return {
    commands,
    format: "utf-8",
    parser(text) {
      return cleanSummaryParser(mode === "n", text);
    }
  };
}
function isCleanOptionsArray(input) {
  return Array.isArray(input) && input.every((test) => CleanOptionValues.has(test));
}
function getCleanOptions(input) {
  let cleanMode;
  let options = [];
  let valid = { cleanMode: false, options: true };
  input.replace(/[^a-z]i/g, "").split("").forEach((char) => {
    if (isCleanMode(char)) {
      cleanMode = char;
      valid.cleanMode = true;
    } else {
      valid.options = valid.options && isKnownOption(options[options.length] = `-${char}`);
    }
  });
  return {
    cleanMode,
    options,
    valid
  };
}
function isCleanMode(cleanMode) {
  return cleanMode === "f" || cleanMode === "n";
}
function isKnownOption(option) {
  return /^-[a-z]$/i.test(option) && CleanOptionValues.has(option.charAt(1));
}
function isInteractiveMode(option) {
  if (/^-[^\-]/.test(option)) {
    return option.indexOf("i") > 0;
  }
  return option === "--interactive";
}
var CONFIG_ERROR_INTERACTIVE_MODE, CONFIG_ERROR_MODE_REQUIRED, CONFIG_ERROR_UNKNOWN_OPTION, CleanOptions, CleanOptionValues;
var init_clean = __esm({
  "src/lib/tasks/clean.ts"() {
    init_CleanSummary();
    init_utils();
    init_task();
    CONFIG_ERROR_INTERACTIVE_MODE = "Git clean interactive mode is not supported";
    CONFIG_ERROR_MODE_REQUIRED = 'Git clean mode parameter ("n" or "f") is required';
    CONFIG_ERROR_UNKNOWN_OPTION = "Git clean unknown option found in: ";
    CleanOptions = /* @__PURE__ */ ((CleanOptions2) => {
      CleanOptions2["DRY_RUN"] = "n";
      CleanOptions2["FORCE"] = "f";
      CleanOptions2["IGNORED_INCLUDED"] = "x";
      CleanOptions2["IGNORED_ONLY"] = "X";
      CleanOptions2["EXCLUDING"] = "e";
      CleanOptions2["QUIET"] = "q";
      CleanOptions2["RECURSIVE"] = "d";
      return CleanOptions2;
    })(CleanOptions || {});
    CleanOptionValues = /* @__PURE__ */ new Set([
      "i",
      ...asStringArray(Object.values(CleanOptions))
    ]);
  }
});
function configListParser(text) {
  const config = new ConfigList();
  for (const item of configParser(text)) {
    config.addValue(item.file, String(item.key), item.value);
  }
  return config;
}
function configGetParser(text, key) {
  let value = null;
  const values = [];
  const scopes = /* @__PURE__ */ new Map();
  for (const item of configParser(text, key)) {
    if (item.key !== key) {
      continue;
    }
    values.push(value = item.value);
    if (!scopes.has(item.file)) {
      scopes.set(item.file, []);
    }
    scopes.get(item.file).push(value);
  }
  return {
    key,
    paths: Array.from(scopes.keys()),
    scopes,
    value,
    values
  };
}
function configFilePath(filePath) {
  return filePath.replace(/^(file):/, "");
}
function* configParser(text, requestedKey = null) {
  const lines = text.split("\0");
  for (let i = 0, max = lines.length - 1; i < max; ) {
    const file = configFilePath(lines[i++]);
    let value = lines[i++];
    let key = requestedKey;
    if (value.includes("\n")) {
      const line = splitOn(value, "\n");
      key = line[0];
      value = line[1];
    }
    yield { file, key, value };
  }
}
var ConfigList;
var init_ConfigList = __esm({
  "src/lib/responses/ConfigList.ts"() {
    init_utils();
    ConfigList = class {
      constructor() {
        this.files = [];
        this.values = /* @__PURE__ */ Object.create(null);
      }
      get all() {
        if (!this._all) {
          this._all = this.files.reduce((all, file) => {
            return Object.assign(all, this.values[file]);
          }, {});
        }
        return this._all;
      }
      addFile(file) {
        if (!(file in this.values)) {
          const latest = last(this.files);
          this.values[file] = latest ? Object.create(this.values[latest]) : {};
          this.files.push(file);
        }
        return this.values[file];
      }
      addValue(file, key, value) {
        const values = this.addFile(file);
        if (!values.hasOwnProperty(key)) {
          values[key] = value;
        } else if (Array.isArray(values[key])) {
          values[key].push(value);
        } else {
          values[key] = [values[key], value];
        }
        this._all = void 0;
      }
    };
  }
});
function asConfigScope(scope, fallback) {
  if (typeof scope === "string" && GitConfigScope.hasOwnProperty(scope)) {
    return scope;
  }
  return fallback;
}
function addConfigTask(key, value, append2, scope) {
  const commands = ["config", `--${scope}`];
  if (append2) {
    commands.push("--add");
  }
  commands.push(key, value);
  return {
    commands,
    format: "utf-8",
    parser(text) {
      return text;
    }
  };
}
function getConfigTask(key, scope) {
  const commands = ["config", "--null", "--show-origin", "--get-all", key];
  if (scope) {
    commands.splice(1, 0, `--${scope}`);
  }
  return {
    commands,
    format: "utf-8",
    parser(text) {
      return configGetParser(text, key);
    }
  };
}
function listConfigTask(scope) {
  const commands = ["config", "--list", "--show-origin", "--null"];
  if (scope) {
    commands.push(`--${scope}`);
  }
  return {
    commands,
    format: "utf-8",
    parser(text) {
      return configListParser(text);
    }
  };
}
function config_default() {
  return {
    addConfig(key, value, ...rest) {
      return this._runTask(
        addConfigTask(
          key,
          value,
          rest[0] === true,
          asConfigScope(
            rest[1],
            "local"
            /* local */
          )
        ),
        trailingFunctionArgument(arguments)
      );
    },
    getConfig(key, scope) {
      return this._runTask(
        getConfigTask(key, asConfigScope(scope, void 0)),
        trailingFunctionArgument(arguments)
      );
    },
    listConfig(...rest) {
      return this._runTask(
        listConfigTask(asConfigScope(rest[0], void 0)),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var GitConfigScope;
var init_config = __esm({
  "src/lib/tasks/config.ts"() {
    init_ConfigList();
    init_utils();
    GitConfigScope = /* @__PURE__ */ ((GitConfigScope2) => {
      GitConfigScope2["system"] = "system";
      GitConfigScope2["global"] = "global";
      GitConfigScope2["local"] = "local";
      GitConfigScope2["worktree"] = "worktree";
      return GitConfigScope2;
    })(GitConfigScope || {});
  }
});
function isDiffNameStatus(input) {
  return diffNameStatus.has(input);
}
var DiffNameStatus, diffNameStatus;
var init_diff_name_status = __esm({
  "src/lib/tasks/diff-name-status.ts"() {
    DiffNameStatus = /* @__PURE__ */ ((DiffNameStatus2) => {
      DiffNameStatus2["ADDED"] = "A";
      DiffNameStatus2["COPIED"] = "C";
      DiffNameStatus2["DELETED"] = "D";
      DiffNameStatus2["MODIFIED"] = "M";
      DiffNameStatus2["RENAMED"] = "R";
      DiffNameStatus2["CHANGED"] = "T";
      DiffNameStatus2["UNMERGED"] = "U";
      DiffNameStatus2["UNKNOWN"] = "X";
      DiffNameStatus2["BROKEN"] = "B";
      return DiffNameStatus2;
    })(DiffNameStatus || {});
    diffNameStatus = new Set(Object.values(DiffNameStatus));
  }
});
function grepQueryBuilder(...params) {
  return new GrepQuery().param(...params);
}
function parseGrep(grep) {
  const paths = /* @__PURE__ */ new Set();
  const results = {};
  forEachLineWithContent(grep, (input) => {
    const [path2, line, preview] = input.split(NULL);
    paths.add(path2);
    (results[path2] = results[path2] || []).push({
      line: asNumber$1(line),
      path: path2,
      preview
    });
  });
  return {
    paths,
    results
  };
}
function grep_default() {
  return {
    grep(searchTerm) {
      const then = trailingFunctionArgument(arguments);
      const options = getTrailingOptions(arguments);
      for (const option of disallowedOptions) {
        if (options.includes(option)) {
          return this._runTask(
            configurationErrorTask(`git.grep: use of "${option}" is not supported.`),
            then
          );
        }
      }
      if (typeof searchTerm === "string") {
        searchTerm = grepQueryBuilder().param(searchTerm);
      }
      const commands = ["grep", "--null", "-n", "--full-name", ...options, ...searchTerm];
      return this._runTask(
        {
          commands,
          format: "utf-8",
          parser(stdOut) {
            return parseGrep(stdOut);
          }
        },
        then
      );
    }
  };
}
var disallowedOptions, Query, _a, GrepQuery;
var init_grep = __esm({
  "src/lib/tasks/grep.ts"() {
    init_utils();
    init_task();
    disallowedOptions = ["-h"];
    Query = Symbol("grepQuery");
    GrepQuery = class {
      constructor() {
        this[_a] = [];
      }
      *[(_a = Query, Symbol.iterator)]() {
        for (const query of this[Query]) {
          yield query;
        }
      }
      and(...and) {
        and.length && this[Query].push("--and", "(", ...prefixedArray(and, "-e"), ")");
        return this;
      }
      param(...param) {
        this[Query].push(...prefixedArray(param, "-e"));
        return this;
      }
    };
  }
});
var reset_exports = {};
__export(reset_exports, {
  ResetMode: () => ResetMode,
  getResetMode: () => getResetMode,
  resetTask: () => resetTask
});
function resetTask(mode, customArgs) {
  const commands = ["reset"];
  if (isValidResetMode(mode)) {
    commands.push(`--${mode}`);
  }
  commands.push(...customArgs);
  return straightThroughStringTask(commands);
}
function getResetMode(mode) {
  if (isValidResetMode(mode)) {
    return mode;
  }
  switch (typeof mode) {
    case "string":
    case "undefined":
      return "soft";
  }
  return;
}
function isValidResetMode(mode) {
  return ResetModes.includes(mode);
}
var ResetMode, ResetModes;
var init_reset = __esm({
  "src/lib/tasks/reset.ts"() {
    init_task();
    ResetMode = /* @__PURE__ */ ((ResetMode2) => {
      ResetMode2["MIXED"] = "mixed";
      ResetMode2["SOFT"] = "soft";
      ResetMode2["HARD"] = "hard";
      ResetMode2["MERGE"] = "merge";
      ResetMode2["KEEP"] = "keep";
      return ResetMode2;
    })(ResetMode || {});
    ResetModes = Array.from(Object.values(ResetMode));
  }
});
function createLog() {
  return debug("simple-git");
}
function prefixedLogger(to, prefix, forward) {
  if (!prefix || !String(prefix).replace(/\s*/, "")) {
    return !forward ? to : (message, ...args) => {
      to(message, ...args);
      forward(message, ...args);
    };
  }
  return (message, ...args) => {
    to(`%s ${message}`, prefix, ...args);
    if (forward) {
      forward(message, ...args);
    }
  };
}
function childLoggerName(name, childDebugger, { namespace: parentNamespace }) {
  if (typeof name === "string") {
    return name;
  }
  const childNamespace = childDebugger && childDebugger.namespace || "";
  if (childNamespace.startsWith(parentNamespace)) {
    return childNamespace.substr(parentNamespace.length + 1);
  }
  return childNamespace || parentNamespace;
}
function createLogger(label, verbose, initialStep, infoDebugger = createLog()) {
  const labelPrefix = label && `[${label}]` || "";
  const spawned = [];
  const debugDebugger = typeof verbose === "string" ? infoDebugger.extend(verbose) : verbose;
  const key = childLoggerName(filterType(verbose, filterString), debugDebugger, infoDebugger);
  return step(initialStep);
  function sibling(name, initial) {
    return append(
      spawned,
      createLogger(label, key.replace(/^[^:]+/, name), initial, infoDebugger)
    );
  }
  function step(phase) {
    const stepPrefix = phase && `[${phase}]` || "";
    const debug2 = debugDebugger && prefixedLogger(debugDebugger, stepPrefix) || NOOP;
    const info = prefixedLogger(infoDebugger, `${labelPrefix} ${stepPrefix}`, debug2);
    return Object.assign(debugDebugger ? debug2 : info, {
      label,
      sibling,
      info,
      step
    });
  }
}
var init_git_logger = __esm({
  "src/lib/git-logger.ts"() {
    init_utils();
    debug.formatters.L = (value) => String(filterHasLength(value) ? value.length : "-");
    debug.formatters.B = (value) => {
      if (Buffer.isBuffer(value)) {
        return value.toString("utf8");
      }
      return objectToString(value);
    };
  }
});
var TasksPendingQueue;
var init_tasks_pending_queue = __esm({
  "src/lib/runners/tasks-pending-queue.ts"() {
    var _a2;
    init_git_error();
    init_git_logger();
    TasksPendingQueue = (_a2 = class {
      constructor(logLabel = "GitExecutor") {
        this.logLabel = logLabel;
        this._queue = /* @__PURE__ */ new Map();
      }
      withProgress(task) {
        return this._queue.get(task);
      }
      createProgress(task) {
        const name = _a2.getName(task.commands[0]);
        const logger = createLogger(this.logLabel, name);
        return {
          task,
          logger,
          name
        };
      }
      push(task) {
        const progress = this.createProgress(task);
        progress.logger("Adding task to the queue, commands = %o", task.commands);
        this._queue.set(task, progress);
        return progress;
      }
      fatal(err) {
        for (const [task, { logger }] of Array.from(this._queue.entries())) {
          if (task === err.task) {
            logger.info(`Failed %o`, err);
            logger(
              `Fatal exception, any as-yet un-started tasks run through this executor will not be attempted`
            );
          } else {
            logger.info(
              `A fatal exception occurred in a previous task, the queue has been purged: %o`,
              err.message
            );
          }
          this.complete(task);
        }
        if (this._queue.size !== 0) {
          throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
        }
      }
      complete(task) {
        const progress = this.withProgress(task);
        if (progress) {
          this._queue.delete(task);
        }
      }
      attempt(task) {
        const progress = this.withProgress(task);
        if (!progress) {
          throw new GitError(void 0, "TasksPendingQueue: attempt called for an unknown task");
        }
        progress.logger("Starting task");
        return progress;
      }
      static getName(name = "empty") {
        return `task:${name}:${++_a2.counter}`;
      }
    }, _a2.counter = 0, _a2);
  }
});
function pluginContext(task, commands) {
  return {
    method: first(task.commands) || "",
    commands
  };
}
function onErrorReceived(target, logger) {
  return (err) => {
    logger(`[ERROR] child process exception %o`, err);
    target.push(Buffer.from(String(err.stack), "ascii"));
  };
}
function onDataReceived(target, name, logger, output) {
  return (buffer) => {
    logger(`%s received %L bytes`, name, buffer);
    output(`%B`, buffer);
    target.push(buffer);
  };
}
var GitExecutorChain;
var init_git_executor_chain = __esm({
  "src/lib/runners/git-executor-chain.ts"() {
    init_git_error();
    init_task();
    init_utils();
    init_tasks_pending_queue();
    GitExecutorChain = class {
      constructor(_executor, _scheduler, _plugins) {
        this._executor = _executor;
        this._scheduler = _scheduler;
        this._plugins = _plugins;
        this._chain = Promise.resolve();
        this._queue = new TasksPendingQueue();
      }
      get cwd() {
        return this._cwd || this._executor.cwd;
      }
      set cwd(cwd) {
        this._cwd = cwd;
      }
      get env() {
        return this._executor.env;
      }
      get outputHandler() {
        return this._executor.outputHandler;
      }
      chain() {
        return this;
      }
      push(task) {
        this._queue.push(task);
        return this._chain = this._chain.then(() => this.attemptTask(task));
      }
      async attemptTask(task) {
        const onScheduleComplete = await this._scheduler.next();
        const onQueueComplete = () => this._queue.complete(task);
        try {
          const { logger } = this._queue.attempt(task);
          return await (isEmptyTask(task) ? this.attemptEmptyTask(task, logger) : this.attemptRemoteTask(task, logger));
        } catch (e) {
          throw this.onFatalException(task, e);
        } finally {
          onQueueComplete();
          onScheduleComplete();
        }
      }
      onFatalException(task, e) {
        const gitError = e instanceof GitError ? Object.assign(e, { task }) : new GitError(task, e && String(e));
        this._chain = Promise.resolve();
        this._queue.fatal(gitError);
        return gitError;
      }
      async attemptRemoteTask(task, logger) {
        const binary = this._plugins.exec("spawn.binary", "", pluginContext(task, task.commands));
        const args = this._plugins.exec(
          "spawn.args",
          [...task.commands],
          pluginContext(task, task.commands)
        );
        const raw = await this.gitResponse(
          task,
          binary,
          args,
          this.outputHandler,
          logger.step("SPAWN")
        );
        const outputStreams = await this.handleTaskData(task, args, raw, logger.step("HANDLE"));
        logger(`passing response to task's parser as a %s`, task.format);
        if (isBufferTask(task)) {
          return callTaskParser(task.parser, outputStreams);
        }
        return callTaskParser(task.parser, outputStreams.asStrings());
      }
      async attemptEmptyTask(task, logger) {
        logger(`empty task bypassing child process to call to task's parser`);
        return task.parser(this);
      }
      handleTaskData(task, args, result, logger) {
        const { exitCode, rejection, stdOut, stdErr } = result;
        return new Promise((done, fail) => {
          logger(`Preparing to handle process response exitCode=%d stdOut=`, exitCode);
          const { error } = this._plugins.exec(
            "task.error",
            { error: rejection },
            {
              ...pluginContext(task, args),
              ...result
            }
          );
          if (error && task.onError) {
            logger.info(`exitCode=%s handling with custom error handler`);
            return task.onError(
              result,
              error,
              (newStdOut) => {
                logger.info(`custom error handler treated as success`);
                logger(`custom error returned a %s`, objectToString(newStdOut));
                done(
                  new GitOutputStreams(
                    Array.isArray(newStdOut) ? Buffer.concat(newStdOut) : newStdOut,
                    Buffer.concat(stdErr)
                  )
                );
              },
              fail
            );
          }
          if (error) {
            logger.info(
              `handling as error: exitCode=%s stdErr=%s rejection=%o`,
              exitCode,
              stdErr.length,
              rejection
            );
            return fail(error);
          }
          logger.info(`retrieving task output complete`);
          done(new GitOutputStreams(Buffer.concat(stdOut), Buffer.concat(stdErr)));
        });
      }
      async gitResponse(task, command, args, outputHandler, logger) {
        const outputLogger = logger.sibling("output");
        const spawnOptions = this._plugins.exec(
          "spawn.options",
          {
            cwd: this.cwd,
            env: this.env,
            windowsHide: true
          },
          pluginContext(task, task.commands)
        );
        return new Promise((done) => {
          const stdOut = [];
          const stdErr = [];
          logger.info(`%s %o`, command, args);
          logger("%O", spawnOptions);
          let rejection = this._beforeSpawn(task, args);
          if (rejection) {
            return done({
              stdOut,
              stdErr,
              exitCode: 9901,
              rejection
            });
          }
          this._plugins.exec("spawn.before", void 0, {
            ...pluginContext(task, args),
            kill(reason) {
              rejection = reason || rejection;
            }
          });
          const spawned = spawn(command, args, spawnOptions);
          spawned.stdout.on(
            "data",
            onDataReceived(stdOut, "stdOut", logger, outputLogger.step("stdOut"))
          );
          spawned.stderr.on(
            "data",
            onDataReceived(stdErr, "stdErr", logger, outputLogger.step("stdErr"))
          );
          spawned.on("error", onErrorReceived(stdErr, logger));
          if (outputHandler) {
            logger(`Passing child process stdOut/stdErr to custom outputHandler`);
            outputHandler(command, spawned.stdout, spawned.stderr, [...args]);
          }
          this._plugins.exec("spawn.after", void 0, {
            ...pluginContext(task, args),
            spawned,
            close(exitCode, reason) {
              done({
                stdOut,
                stdErr,
                exitCode,
                rejection: rejection || reason
              });
            },
            kill(reason) {
              if (spawned.killed) {
                return;
              }
              rejection = reason;
              spawned.kill("SIGINT");
            }
          });
        });
      }
      _beforeSpawn(task, args) {
        let rejection;
        this._plugins.exec("spawn.before", void 0, {
          ...pluginContext(task, args),
          kill(reason) {
            rejection = reason || rejection;
          }
        });
        return rejection;
      }
    };
  }
});
var git_executor_exports = {};
__export(git_executor_exports, {
  GitExecutor: () => GitExecutor
});
var GitExecutor;
var init_git_executor = __esm({
  "src/lib/runners/git-executor.ts"() {
    init_git_executor_chain();
    GitExecutor = class {
      constructor(cwd, _scheduler, _plugins) {
        this.cwd = cwd;
        this._scheduler = _scheduler;
        this._plugins = _plugins;
        this._chain = new GitExecutorChain(this, this._scheduler, this._plugins);
      }
      chain() {
        return new GitExecutorChain(this, this._scheduler, this._plugins);
      }
      push(task) {
        return this._chain.push(task);
      }
    };
  }
});
function taskCallback(task, response, callback = NOOP) {
  const onSuccess = (data) => {
    callback(null, data);
  };
  const onError2 = (err) => {
    if ((err == null ? void 0 : err.task) === task) {
      callback(
        err instanceof GitResponseError ? addDeprecationNoticeToError(err) : err,
        void 0
      );
    }
  };
  response.then(onSuccess, onError2);
}
function addDeprecationNoticeToError(err) {
  let log = (name) => {
    console.warn(
      `simple-git deprecation notice: accessing GitResponseError.${name} should be GitResponseError.git.${name}, this will no longer be available in version 3`
    );
    log = NOOP;
  };
  return Object.create(err, Object.getOwnPropertyNames(err.git).reduce(descriptorReducer, {}));
  function descriptorReducer(all, name) {
    if (name in err) {
      return all;
    }
    all[name] = {
      enumerable: false,
      configurable: false,
      get() {
        log(name);
        return err.git[name];
      }
    };
    return all;
  }
}
var init_task_callback = __esm({
  "src/lib/task-callback.ts"() {
    init_git_response_error();
    init_utils();
  }
});
function changeWorkingDirectoryTask(directory, root) {
  return adhocExecTask((instance) => {
    if (!folderExists(directory)) {
      throw new Error(`Git.cwd: cannot change to non-directory "${directory}"`);
    }
    return (root || instance).cwd = directory;
  });
}
var init_change_working_directory = __esm({
  "src/lib/tasks/change-working-directory.ts"() {
    init_utils();
    init_task();
  }
});
function checkoutTask(args) {
  const commands = ["checkout", ...args];
  if (commands[1] === "-b" && commands.includes("-B")) {
    commands[1] = remove$1(commands, "-B");
  }
  return straightThroughStringTask(commands);
}
function checkout_default() {
  return {
    checkout() {
      return this._runTask(
        checkoutTask(getTrailingOptions(arguments, 1)),
        trailingFunctionArgument(arguments)
      );
    },
    checkoutBranch(branchName, startPoint) {
      return this._runTask(
        checkoutTask(["-b", branchName, startPoint, ...getTrailingOptions(arguments)]),
        trailingFunctionArgument(arguments)
      );
    },
    checkoutLocalBranch(branchName) {
      return this._runTask(
        checkoutTask(["-b", branchName, ...getTrailingOptions(arguments)]),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var init_checkout = __esm({
  "src/lib/tasks/checkout.ts"() {
    init_utils();
    init_task();
  }
});
function countObjectsResponse() {
  return {
    count: 0,
    garbage: 0,
    inPack: 0,
    packs: 0,
    prunePackable: 0,
    size: 0,
    sizeGarbage: 0,
    sizePack: 0
  };
}
function count_objects_default() {
  return {
    countObjects() {
      return this._runTask({
        commands: ["count-objects", "--verbose"],
        format: "utf-8",
        parser(stdOut) {
          return parseStringResponse(countObjectsResponse(), [parser2], stdOut);
        }
      });
    }
  };
}
var parser2;
var init_count_objects = __esm({
  "src/lib/tasks/count-objects.ts"() {
    init_utils();
    parser2 = new LineParser(
      /([a-z-]+): (\d+)$/,
      (result, [key, value]) => {
        const property = asCamelCase(key);
        if (result.hasOwnProperty(property)) {
          result[property] = asNumber$1(value);
        }
      }
    );
  }
});
function parseCommitResult(stdOut) {
  const result = {
    author: null,
    branch: "",
    commit: "",
    root: false,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0
    }
  };
  return parseStringResponse(result, parsers, stdOut);
}
var parsers;
var init_parse_commit = __esm({
  "src/lib/parsers/parse-commit.ts"() {
    init_utils();
    parsers = [
      new LineParser(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (result, [branch, root, commit]) => {
        result.branch = branch;
        result.commit = commit;
        result.root = !!root;
      }),
      new LineParser(/\s*Author:\s(.+)/i, (result, [author]) => {
        const parts = author.split("<");
        const email = parts.pop();
        if (!email || !email.includes("@")) {
          return;
        }
        result.author = {
          email: email.substr(0, email.length - 1),
          name: parts.join("<").trim()
        };
      }),
      new LineParser(
        /(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g,
        (result, [changes, insertions, deletions]) => {
          result.summary.changes = parseInt(changes, 10) || 0;
          result.summary.insertions = parseInt(insertions, 10) || 0;
          result.summary.deletions = parseInt(deletions, 10) || 0;
        }
      ),
      new LineParser(
        /^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/,
        (result, [changes, lines, direction]) => {
          result.summary.changes = parseInt(changes, 10) || 0;
          const count = parseInt(lines, 10) || 0;
          if (direction === "-") {
            result.summary.deletions = count;
          } else if (direction === "+") {
            result.summary.insertions = count;
          }
        }
      )
    ];
  }
});
function commitTask(message, files, customArgs) {
  const commands = [
    "-c",
    "core.abbrev=40",
    "commit",
    ...prefixedArray(message, "-m"),
    ...files,
    ...customArgs
  ];
  return {
    commands,
    format: "utf-8",
    parser: parseCommitResult
  };
}
function commit_default() {
  return {
    commit(message, ...rest) {
      const next2 = trailingFunctionArgument(arguments);
      const task = rejectDeprecatedSignatures(message) || commitTask(
        asArray(message),
        asArray(filterType(rest[0], filterStringOrStringArray, [])),
        [...filterType(rest[1], filterArray, []), ...getTrailingOptions(arguments, 0, true)]
      );
      return this._runTask(task, next2);
    }
  };
  function rejectDeprecatedSignatures(message) {
    return !filterStringOrStringArray(message) && configurationErrorTask(
      `git.commit: requires the commit message to be supplied as a string/string[]`
    );
  }
}
var init_commit = __esm({
  "src/lib/tasks/commit.ts"() {
    init_parse_commit();
    init_utils();
    init_task();
  }
});
function first_commit_default() {
  return {
    firstCommit() {
      return this._runTask(
        straightThroughStringTask(["rev-list", "--max-parents=0", "HEAD"], true),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var init_first_commit = __esm({
  "src/lib/tasks/first-commit.ts"() {
    init_utils();
    init_task();
  }
});
function hashObjectTask(filePath, write) {
  const commands = ["hash-object", filePath];
  if (write) {
    commands.push("-w");
  }
  return straightThroughStringTask(commands, true);
}
var init_hash_object = __esm({
  "src/lib/tasks/hash-object.ts"() {
    init_task();
  }
});
function parseInit(bare, path2, text) {
  const response = String(text).trim();
  let result;
  if (result = initResponseRegex.exec(response)) {
    return new InitSummary(bare, path2, false, result[1]);
  }
  if (result = reInitResponseRegex.exec(response)) {
    return new InitSummary(bare, path2, true, result[1]);
  }
  let gitDir = "";
  const tokens = response.split(" ");
  while (tokens.length) {
    const token = tokens.shift();
    if (token === "in") {
      gitDir = tokens.join(" ");
      break;
    }
  }
  return new InitSummary(bare, path2, /^re/i.test(response), gitDir);
}
var InitSummary, initResponseRegex, reInitResponseRegex;
var init_InitSummary = __esm({
  "src/lib/responses/InitSummary.ts"() {
    InitSummary = class {
      constructor(bare, path2, existing, gitDir) {
        this.bare = bare;
        this.path = path2;
        this.existing = existing;
        this.gitDir = gitDir;
      }
    };
    initResponseRegex = /^Init.+ repository in (.+)$/;
    reInitResponseRegex = /^Rein.+ in (.+)$/;
  }
});
function hasBareCommand(command) {
  return command.includes(bareCommand);
}
function initTask(bare = false, path2, customArgs) {
  const commands = ["init", ...customArgs];
  if (bare && !hasBareCommand(commands)) {
    commands.splice(1, 0, bareCommand);
  }
  return {
    commands,
    format: "utf-8",
    parser(text) {
      return parseInit(commands.includes("--bare"), path2, text);
    }
  };
}
var bareCommand;
var init_init = __esm({
  "src/lib/tasks/init.ts"() {
    init_InitSummary();
    bareCommand = "--bare";
  }
});
function logFormatFromCommand(customArgs) {
  for (let i = 0; i < customArgs.length; i++) {
    const format = logFormatRegex.exec(customArgs[i]);
    if (format) {
      return `--${format[1]}`;
    }
  }
  return "";
}
function isLogFormat(customArg) {
  return logFormatRegex.test(customArg);
}
var logFormatRegex;
var init_log_format = __esm({
  "src/lib/args/log-format.ts"() {
    logFormatRegex = /^--(stat|numstat|name-only|name-status)(=|$)/;
  }
});
var DiffSummary;
var init_DiffSummary = __esm({
  "src/lib/responses/DiffSummary.ts"() {
    DiffSummary = class {
      constructor() {
        this.changed = 0;
        this.deletions = 0;
        this.insertions = 0;
        this.files = [];
      }
    };
  }
});
function getDiffParser(format = "") {
  const parser4 = diffSummaryParsers[format];
  return (stdOut) => parseStringResponse(new DiffSummary(), parser4, stdOut, false);
}
var statParser, numStatParser, nameOnlyParser, nameStatusParser, diffSummaryParsers;
var init_parse_diff_summary = __esm({
  "src/lib/parsers/parse-diff-summary.ts"() {
    init_log_format();
    init_DiffSummary();
    init_diff_name_status();
    init_utils();
    statParser = [
      new LineParser(
        /^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/,
        (result, [file, changes, alterations = ""]) => {
          result.files.push({
            file: file.trim(),
            changes: asNumber$1(changes),
            insertions: alterations.replace(/[^+]/g, "").length,
            deletions: alterations.replace(/[^-]/g, "").length,
            binary: false
          });
        }
      ),
      new LineParser(
        /^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/,
        (result, [file, before, after]) => {
          result.files.push({
            file: file.trim(),
            before: asNumber$1(before),
            after: asNumber$1(after),
            binary: true
          });
        }
      ),
      new LineParser(
        /(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/,
        (result, [changed, summary]) => {
          const inserted = /(\d+) i/.exec(summary);
          const deleted = /(\d+) d/.exec(summary);
          result.changed = asNumber$1(changed);
          result.insertions = asNumber$1(inserted == null ? void 0 : inserted[1]);
          result.deletions = asNumber$1(deleted == null ? void 0 : deleted[1]);
        }
      )
    ];
    numStatParser = [
      new LineParser(
        /(\d+)\t(\d+)\t(.+)$/,
        (result, [changesInsert, changesDelete, file]) => {
          const insertions = asNumber$1(changesInsert);
          const deletions = asNumber$1(changesDelete);
          result.changed++;
          result.insertions += insertions;
          result.deletions += deletions;
          result.files.push({
            file,
            changes: insertions + deletions,
            insertions,
            deletions,
            binary: false
          });
        }
      ),
      new LineParser(/-\t-\t(.+)$/, (result, [file]) => {
        result.changed++;
        result.files.push({
          file,
          after: 0,
          before: 0,
          binary: true
        });
      })
    ];
    nameOnlyParser = [
      new LineParser(/(.+)$/, (result, [file]) => {
        result.changed++;
        result.files.push({
          file,
          changes: 0,
          insertions: 0,
          deletions: 0,
          binary: false
        });
      })
    ];
    nameStatusParser = [
      new LineParser(
        /([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/,
        (result, [status, similarity, from, _to, to]) => {
          result.changed++;
          result.files.push({
            file: to ?? from,
            changes: 0,
            insertions: 0,
            deletions: 0,
            binary: false,
            status: orVoid(isDiffNameStatus(status) && status),
            from: orVoid(!!to && from !== to && from),
            similarity: asNumber$1(similarity)
          });
        }
      )
    ];
    diffSummaryParsers = {
      [
        ""
        /* NONE */
      ]: statParser,
      [
        "--stat"
        /* STAT */
      ]: statParser,
      [
        "--numstat"
        /* NUM_STAT */
      ]: numStatParser,
      [
        "--name-status"
        /* NAME_STATUS */
      ]: nameStatusParser,
      [
        "--name-only"
        /* NAME_ONLY */
      ]: nameOnlyParser
    };
  }
});
function lineBuilder(tokens, fields) {
  return fields.reduce(
    (line, field, index) => {
      line[field] = tokens[index] || "";
      return line;
    },
    /* @__PURE__ */ Object.create({ diff: null })
  );
}
function createListLogSummaryParser(splitter = SPLITTER, fields = defaultFieldNames, logFormat = "") {
  const parseDiffResult = getDiffParser(logFormat);
  return function(stdOut) {
    const all = toLinesWithContent(
      stdOut.trim(),
      false,
      START_BOUNDARY
    ).map(function(item) {
      const lineDetail = item.split(COMMIT_BOUNDARY);
      const listLogLine = lineBuilder(lineDetail[0].split(splitter), fields);
      if (lineDetail.length > 1 && !!lineDetail[1].trim()) {
        listLogLine.diff = parseDiffResult(lineDetail[1]);
      }
      return listLogLine;
    });
    return {
      all,
      latest: all.length && all[0] || null,
      total: all.length
    };
  };
}
var START_BOUNDARY, COMMIT_BOUNDARY, SPLITTER, defaultFieldNames;
var init_parse_list_log_summary = __esm({
  "src/lib/parsers/parse-list-log-summary.ts"() {
    init_utils();
    init_parse_diff_summary();
    init_log_format();
    START_BOUNDARY = "òòòòòò ";
    COMMIT_BOUNDARY = " òò";
    SPLITTER = " ò ";
    defaultFieldNames = ["hash", "date", "message", "refs", "author_name", "author_email"];
  }
});
var diff_exports = {};
__export(diff_exports, {
  diffSummaryTask: () => diffSummaryTask,
  validateLogFormatConfig: () => validateLogFormatConfig
});
function diffSummaryTask(customArgs) {
  let logFormat = logFormatFromCommand(customArgs);
  const commands = ["diff"];
  if (logFormat === "") {
    logFormat = "--stat";
    commands.push("--stat=4096");
  }
  commands.push(...customArgs);
  return validateLogFormatConfig(commands) || {
    commands,
    format: "utf-8",
    parser: getDiffParser(logFormat)
  };
}
function validateLogFormatConfig(customArgs) {
  const flags = customArgs.filter(isLogFormat);
  if (flags.length > 1) {
    return configurationErrorTask(
      `Summary flags are mutually exclusive - pick one of ${flags.join(",")}`
    );
  }
  if (flags.length && customArgs.includes("-z")) {
    return configurationErrorTask(
      `Summary flag ${flags} parsing is not compatible with null termination option '-z'`
    );
  }
}
var init_diff = __esm({
  "src/lib/tasks/diff.ts"() {
    init_log_format();
    init_parse_diff_summary();
    init_task();
  }
});
function prettyFormat(format, splitter) {
  const fields = [];
  const formatStr = [];
  Object.keys(format).forEach((field) => {
    fields.push(field);
    formatStr.push(String(format[field]));
  });
  return [fields, formatStr.join(splitter)];
}
function userOptions(input) {
  return Object.keys(input).reduce((out, key) => {
    if (!(key in excludeOptions)) {
      out[key] = input[key];
    }
    return out;
  }, {});
}
function parseLogOptions(opt = {}, customArgs = []) {
  const splitter = filterType(opt.splitter, filterString, SPLITTER);
  const format = filterPlainObject(opt.format) ? opt.format : {
    hash: "%H",
    date: opt.strictDate === false ? "%ai" : "%aI",
    message: "%s",
    refs: "%D",
    body: opt.multiLine ? "%B" : "%b",
    author_name: opt.mailMap !== false ? "%aN" : "%an",
    author_email: opt.mailMap !== false ? "%aE" : "%ae"
  };
  const [fields, formatStr] = prettyFormat(format, splitter);
  const suffix = [];
  const command = [
    `--pretty=format:${START_BOUNDARY}${formatStr}${COMMIT_BOUNDARY}`,
    ...customArgs
  ];
  const maxCount = opt.n || opt["max-count"] || opt.maxCount;
  if (maxCount) {
    command.push(`--max-count=${maxCount}`);
  }
  if (opt.from || opt.to) {
    const rangeOperator = opt.symmetric !== false ? "..." : "..";
    suffix.push(`${opt.from || ""}${rangeOperator}${opt.to || ""}`);
  }
  if (filterString(opt.file)) {
    command.push("--follow", pathspec(opt.file));
  }
  appendTaskOptions(userOptions(opt), command);
  return {
    fields,
    splitter,
    commands: [...command, ...suffix]
  };
}
function logTask(splitter, fields, customArgs) {
  const parser4 = createListLogSummaryParser(splitter, fields, logFormatFromCommand(customArgs));
  return {
    commands: ["log", ...customArgs],
    format: "utf-8",
    parser: parser4
  };
}
function log_default() {
  return {
    log(...rest) {
      const next2 = trailingFunctionArgument(arguments);
      const options = parseLogOptions(
        trailingOptionsArgument(arguments),
        filterType(arguments[0], filterArray)
      );
      const task = rejectDeprecatedSignatures(...rest) || validateLogFormatConfig(options.commands) || createLogTask(options);
      return this._runTask(task, next2);
    }
  };
  function createLogTask(options) {
    return logTask(options.splitter, options.fields, options.commands);
  }
  function rejectDeprecatedSignatures(from, to) {
    return filterString(from) && filterString(to) && configurationErrorTask(
      `git.log(string, string) should be replaced with git.log({ from: string, to: string })`
    );
  }
}
var excludeOptions;
var init_log = __esm({
  "src/lib/tasks/log.ts"() {
    init_log_format();
    init_pathspec();
    init_parse_list_log_summary();
    init_utils();
    init_task();
    init_diff();
    excludeOptions = /* @__PURE__ */ ((excludeOptions2) => {
      excludeOptions2[excludeOptions2["--pretty"] = 0] = "--pretty";
      excludeOptions2[excludeOptions2["max-count"] = 1] = "max-count";
      excludeOptions2[excludeOptions2["maxCount"] = 2] = "maxCount";
      excludeOptions2[excludeOptions2["n"] = 3] = "n";
      excludeOptions2[excludeOptions2["file"] = 4] = "file";
      excludeOptions2[excludeOptions2["format"] = 5] = "format";
      excludeOptions2[excludeOptions2["from"] = 6] = "from";
      excludeOptions2[excludeOptions2["to"] = 7] = "to";
      excludeOptions2[excludeOptions2["splitter"] = 8] = "splitter";
      excludeOptions2[excludeOptions2["symmetric"] = 9] = "symmetric";
      excludeOptions2[excludeOptions2["mailMap"] = 10] = "mailMap";
      excludeOptions2[excludeOptions2["multiLine"] = 11] = "multiLine";
      excludeOptions2[excludeOptions2["strictDate"] = 12] = "strictDate";
      return excludeOptions2;
    })(excludeOptions || {});
  }
});
var MergeSummaryConflict, MergeSummaryDetail;
var init_MergeSummary = __esm({
  "src/lib/responses/MergeSummary.ts"() {
    MergeSummaryConflict = class {
      constructor(reason, file = null, meta) {
        this.reason = reason;
        this.file = file;
        this.meta = meta;
      }
      toString() {
        return `${this.file}:${this.reason}`;
      }
    };
    MergeSummaryDetail = class {
      constructor() {
        this.conflicts = [];
        this.merges = [];
        this.result = "success";
      }
      get failed() {
        return this.conflicts.length > 0;
      }
      get reason() {
        return this.result;
      }
      toString() {
        if (this.conflicts.length) {
          return `CONFLICTS: ${this.conflicts.join(", ")}`;
        }
        return "OK";
      }
    };
  }
});
var PullSummary, PullFailedSummary;
var init_PullSummary = __esm({
  "src/lib/responses/PullSummary.ts"() {
    PullSummary = class {
      constructor() {
        this.remoteMessages = {
          all: []
        };
        this.created = [];
        this.deleted = [];
        this.files = [];
        this.deletions = {};
        this.insertions = {};
        this.summary = {
          changes: 0,
          deletions: 0,
          insertions: 0
        };
      }
    };
    PullFailedSummary = class {
      constructor() {
        this.remote = "";
        this.hash = {
          local: "",
          remote: ""
        };
        this.branch = {
          local: "",
          remote: ""
        };
        this.message = "";
      }
      toString() {
        return this.message;
      }
    };
  }
});
function objectEnumerationResult(remoteMessages) {
  return remoteMessages.objects = remoteMessages.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: { count: 0, delta: 0 },
    total: { count: 0, delta: 0 }
  };
}
function asObjectCount(source) {
  const count = /^\s*(\d+)/.exec(source);
  const delta = /delta (\d+)/i.exec(source);
  return {
    count: asNumber$1(count && count[1] || "0"),
    delta: asNumber$1(delta && delta[1] || "0")
  };
}
var remoteMessagesObjectParsers;
var init_parse_remote_objects = __esm({
  "src/lib/parsers/parse-remote-objects.ts"() {
    init_utils();
    remoteMessagesObjectParsers = [
      new RemoteLineParser(
        /^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i,
        (result, [action, count]) => {
          const key = action.toLowerCase();
          const enumeration = objectEnumerationResult(result.remoteMessages);
          Object.assign(enumeration, { [key]: asNumber$1(count) });
        }
      ),
      new RemoteLineParser(
        /^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i,
        (result, [action, count]) => {
          const key = action.toLowerCase();
          const enumeration = objectEnumerationResult(result.remoteMessages);
          Object.assign(enumeration, { [key]: asNumber$1(count) });
        }
      ),
      new RemoteLineParser(
        /total ([^,]+), reused ([^,]+), pack-reused (\d+)/i,
        (result, [total, reused, packReused]) => {
          const objects = objectEnumerationResult(result.remoteMessages);
          objects.total = asObjectCount(total);
          objects.reused = asObjectCount(reused);
          objects.packReused = asNumber$1(packReused);
        }
      )
    ];
  }
});
function parseRemoteMessages(_stdOut, stdErr) {
  return parseStringResponse({ remoteMessages: new RemoteMessageSummary() }, parsers2, stdErr);
}
var parsers2, RemoteMessageSummary;
var init_parse_remote_messages = __esm({
  "src/lib/parsers/parse-remote-messages.ts"() {
    init_utils();
    init_parse_remote_objects();
    parsers2 = [
      new RemoteLineParser(/^remote:\s*(.+)$/, (result, [text]) => {
        result.remoteMessages.all.push(text.trim());
        return false;
      }),
      ...remoteMessagesObjectParsers,
      new RemoteLineParser(
        [/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/],
        (result, [pullRequestUrl]) => {
          result.remoteMessages.pullRequestUrl = pullRequestUrl;
        }
      ),
      new RemoteLineParser(
        [/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/],
        (result, [count, summary, url]) => {
          result.remoteMessages.vulnerabilities = {
            count: asNumber$1(count),
            summary,
            url
          };
        }
      )
    ];
    RemoteMessageSummary = class {
      constructor() {
        this.all = [];
      }
    };
  }
});
function parsePullErrorResult(stdOut, stdErr) {
  const pullError = parseStringResponse(new PullFailedSummary(), errorParsers, [stdOut, stdErr]);
  return pullError.message && pullError;
}
var FILE_UPDATE_REGEX, SUMMARY_REGEX, ACTION_REGEX, parsers3, errorParsers, parsePullDetail, parsePullResult;
var init_parse_pull = __esm({
  "src/lib/parsers/parse-pull.ts"() {
    init_PullSummary();
    init_utils();
    init_parse_remote_messages();
    FILE_UPDATE_REGEX = /^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/;
    SUMMARY_REGEX = /(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/;
    ACTION_REGEX = /^(create|delete) mode \d+ (.+)/;
    parsers3 = [
      new LineParser(FILE_UPDATE_REGEX, (result, [file, insertions, deletions]) => {
        result.files.push(file);
        if (insertions) {
          result.insertions[file] = insertions.length;
        }
        if (deletions) {
          result.deletions[file] = deletions.length;
        }
      }),
      new LineParser(SUMMARY_REGEX, (result, [changes, , insertions, , deletions]) => {
        if (insertions !== void 0 || deletions !== void 0) {
          result.summary.changes = +changes || 0;
          result.summary.insertions = +insertions || 0;
          result.summary.deletions = +deletions || 0;
          return true;
        }
        return false;
      }),
      new LineParser(ACTION_REGEX, (result, [action, file]) => {
        append(result.files, file);
        append(action === "create" ? result.created : result.deleted, file);
      })
    ];
    errorParsers = [
      new LineParser(/^from\s(.+)$/i, (result, [remote]) => void (result.remote = remote)),
      new LineParser(/^fatal:\s(.+)$/, (result, [message]) => void (result.message = message)),
      new LineParser(
        /([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/,
        (result, [hashLocal, hashRemote, branchLocal, branchRemote]) => {
          result.branch.local = branchLocal;
          result.hash.local = hashLocal;
          result.branch.remote = branchRemote;
          result.hash.remote = hashRemote;
        }
      )
    ];
    parsePullDetail = (stdOut, stdErr) => {
      return parseStringResponse(new PullSummary(), parsers3, [stdOut, stdErr]);
    };
    parsePullResult = (stdOut, stdErr) => {
      return Object.assign(
        new PullSummary(),
        parsePullDetail(stdOut, stdErr),
        parseRemoteMessages(stdOut, stdErr)
      );
    };
  }
});
var parsers4, parseMergeResult, parseMergeDetail;
var init_parse_merge = __esm({
  "src/lib/parsers/parse-merge.ts"() {
    init_MergeSummary();
    init_utils();
    init_parse_pull();
    parsers4 = [
      new LineParser(/^Auto-merging\s+(.+)$/, (summary, [autoMerge]) => {
        summary.merges.push(autoMerge);
      }),
      new LineParser(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (summary, [reason, file]) => {
        summary.conflicts.push(new MergeSummaryConflict(reason, file));
      }),
      new LineParser(
        /^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/,
        (summary, [reason, file, deleteRef]) => {
          summary.conflicts.push(new MergeSummaryConflict(reason, file, { deleteRef }));
        }
      ),
      new LineParser(/^CONFLICT\s+\((.+)\):/, (summary, [reason]) => {
        summary.conflicts.push(new MergeSummaryConflict(reason, null));
      }),
      new LineParser(/^Automatic merge failed;\s+(.+)$/, (summary, [result]) => {
        summary.result = result;
      })
    ];
    parseMergeResult = (stdOut, stdErr) => {
      return Object.assign(parseMergeDetail(stdOut, stdErr), parsePullResult(stdOut, stdErr));
    };
    parseMergeDetail = (stdOut) => {
      return parseStringResponse(new MergeSummaryDetail(), parsers4, stdOut);
    };
  }
});
function mergeTask(customArgs) {
  if (!customArgs.length) {
    return configurationErrorTask("Git.merge requires at least one option");
  }
  return {
    commands: ["merge", ...customArgs],
    format: "utf-8",
    parser(stdOut, stdErr) {
      const merge = parseMergeResult(stdOut, stdErr);
      if (merge.failed) {
        throw new GitResponseError(merge);
      }
      return merge;
    }
  };
}
var init_merge = __esm({
  "src/lib/tasks/merge.ts"() {
    init_git_response_error();
    init_parse_merge();
    init_task();
  }
});
function pushResultPushedItem(local, remote, status) {
  const deleted = status.includes("deleted");
  const tag = status.includes("tag") || /^refs\/tags/.test(local);
  const alreadyUpdated = !status.includes("new");
  return {
    deleted,
    tag,
    branch: !tag,
    new: !alreadyUpdated,
    alreadyUpdated,
    local,
    remote
  };
}
var parsers5, parsePushResult, parsePushDetail;
var init_parse_push = __esm({
  "src/lib/parsers/parse-push.ts"() {
    init_utils();
    init_parse_remote_messages();
    parsers5 = [
      new LineParser(/^Pushing to (.+)$/, (result, [repo]) => {
        result.repo = repo;
      }),
      new LineParser(/^updating local tracking ref '(.+)'/, (result, [local]) => {
        result.ref = {
          ...result.ref || {},
          local
        };
      }),
      new LineParser(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (result, [local, remote, type2]) => {
        result.pushed.push(pushResultPushedItem(local, remote, type2));
      }),
      new LineParser(
        /^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/,
        (result, [local, remote, remoteName]) => {
          result.branch = {
            ...result.branch || {},
            local,
            remote,
            remoteName
          };
        }
      ),
      new LineParser(
        /^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/,
        (result, [local, remote, from, to]) => {
          result.update = {
            head: {
              local,
              remote
            },
            hash: {
              from,
              to
            }
          };
        }
      )
    ];
    parsePushResult = (stdOut, stdErr) => {
      const pushDetail = parsePushDetail(stdOut, stdErr);
      const responseDetail = parseRemoteMessages(stdOut, stdErr);
      return {
        ...pushDetail,
        ...responseDetail
      };
    };
    parsePushDetail = (stdOut, stdErr) => {
      return parseStringResponse({ pushed: [] }, parsers5, [stdOut, stdErr]);
    };
  }
});
var push_exports = {};
__export(push_exports, {
  pushTagsTask: () => pushTagsTask,
  pushTask: () => pushTask
});
function pushTagsTask(ref = {}, customArgs) {
  append(customArgs, "--tags");
  return pushTask(ref, customArgs);
}
function pushTask(ref = {}, customArgs) {
  const commands = ["push", ...customArgs];
  if (ref.branch) {
    commands.splice(1, 0, ref.branch);
  }
  if (ref.remote) {
    commands.splice(1, 0, ref.remote);
  }
  remove$1(commands, "-v");
  append(commands, "--verbose");
  append(commands, "--porcelain");
  return {
    commands,
    format: "utf-8",
    parser: parsePushResult
  };
}
var init_push = __esm({
  "src/lib/tasks/push.ts"() {
    init_parse_push();
    init_utils();
  }
});
function show_default() {
  return {
    showBuffer() {
      const commands = ["show", ...getTrailingOptions(arguments, 1)];
      if (!commands.includes("--binary")) {
        commands.splice(1, 0, "--binary");
      }
      return this._runTask(
        straightThroughBufferTask(commands),
        trailingFunctionArgument(arguments)
      );
    },
    show() {
      const commands = ["show", ...getTrailingOptions(arguments, 1)];
      return this._runTask(
        straightThroughStringTask(commands),
        trailingFunctionArgument(arguments)
      );
    }
  };
}
var init_show = __esm({
  "src/lib/tasks/show.ts"() {
    init_utils();
    init_task();
  }
});
var fromPathRegex, FileStatusSummary;
var init_FileStatusSummary = __esm({
  "src/lib/responses/FileStatusSummary.ts"() {
    fromPathRegex = /^(.+)\0(.+)$/;
    FileStatusSummary = class {
      constructor(path2, index, working_dir) {
        this.path = path2;
        this.index = index;
        this.working_dir = working_dir;
        if (index === "R" || working_dir === "R") {
          const detail = fromPathRegex.exec(path2) || [null, path2, path2];
          this.from = detail[2] || "";
          this.path = detail[1] || "";
        }
      }
    };
  }
});
function renamedFile(line) {
  const [to, from] = line.split(NULL);
  return {
    from: from || to,
    to
  };
}
function parser3(indexX, indexY, handler) {
  return [`${indexX}${indexY}`, handler];
}
function conflicts(indexX, ...indexY) {
  return indexY.map((y) => parser3(indexX, y, (result, file) => append(result.conflicted, file)));
}
function splitLine(result, lineStr) {
  const trimmed2 = lineStr.trim();
  switch (" ") {
    case trimmed2.charAt(2):
      return data(trimmed2.charAt(0), trimmed2.charAt(1), trimmed2.substr(3));
    case trimmed2.charAt(1):
      return data(" ", trimmed2.charAt(0), trimmed2.substr(2));
    default:
      return;
  }
  function data(index, workingDir, path2) {
    const raw = `${index}${workingDir}`;
    const handler = parsers6.get(raw);
    if (handler) {
      handler(result, path2);
    }
    if (raw !== "##" && raw !== "!!") {
      result.files.push(new FileStatusSummary(path2, index, workingDir));
    }
  }
}
var StatusSummary, parsers6, parseStatusSummary;
var init_StatusSummary = __esm({
  "src/lib/responses/StatusSummary.ts"() {
    init_utils();
    init_FileStatusSummary();
    StatusSummary = class {
      constructor() {
        this.not_added = [];
        this.conflicted = [];
        this.created = [];
        this.deleted = [];
        this.ignored = void 0;
        this.modified = [];
        this.renamed = [];
        this.files = [];
        this.staged = [];
        this.ahead = 0;
        this.behind = 0;
        this.current = null;
        this.tracking = null;
        this.detached = false;
        this.isClean = () => {
          return !this.files.length;
        };
      }
    };
    parsers6 = new Map([
      parser3(
        " ",
        "A",
        (result, file) => append(result.created, file)
      ),
      parser3(
        " ",
        "D",
        (result, file) => append(result.deleted, file)
      ),
      parser3(
        " ",
        "M",
        (result, file) => append(result.modified, file)
      ),
      parser3(
        "A",
        " ",
        (result, file) => append(result.created, file) && append(result.staged, file)
      ),
      parser3(
        "A",
        "M",
        (result, file) => append(result.created, file) && append(result.staged, file) && append(result.modified, file)
      ),
      parser3(
        "D",
        " ",
        (result, file) => append(result.deleted, file) && append(result.staged, file)
      ),
      parser3(
        "M",
        " ",
        (result, file) => append(result.modified, file) && append(result.staged, file)
      ),
      parser3(
        "M",
        "M",
        (result, file) => append(result.modified, file) && append(result.staged, file)
      ),
      parser3("R", " ", (result, file) => {
        append(result.renamed, renamedFile(file));
      }),
      parser3("R", "M", (result, file) => {
        const renamed = renamedFile(file);
        append(result.renamed, renamed);
        append(result.modified, renamed.to);
      }),
      parser3("!", "!", (_result, _file) => {
        append(_result.ignored = _result.ignored || [], _file);
      }),
      parser3(
        "?",
        "?",
        (result, file) => append(result.not_added, file)
      ),
      ...conflicts(
        "A",
        "A",
        "U"
        /* UNMERGED */
      ),
      ...conflicts(
        "D",
        "D",
        "U"
        /* UNMERGED */
      ),
      ...conflicts(
        "U",
        "A",
        "D",
        "U"
        /* UNMERGED */
      ),
      [
        "##",
        (result, line) => {
          const aheadReg = /ahead (\d+)/;
          const behindReg = /behind (\d+)/;
          const currentReg = /^(.+?(?=(?:\.{3}|\s|$)))/;
          const trackingReg = /\.{3}(\S*)/;
          const onEmptyBranchReg = /\son\s([\S]+)$/;
          let regexResult;
          regexResult = aheadReg.exec(line);
          result.ahead = regexResult && +regexResult[1] || 0;
          regexResult = behindReg.exec(line);
          result.behind = regexResult && +regexResult[1] || 0;
          regexResult = currentReg.exec(line);
          result.current = regexResult && regexResult[1];
          regexResult = trackingReg.exec(line);
          result.tracking = regexResult && regexResult[1];
          regexResult = onEmptyBranchReg.exec(line);
          result.current = regexResult && regexResult[1] || result.current;
          result.detached = /\(no branch\)/.test(line);
        }
      ]
    ]);
    parseStatusSummary = function(text) {
      const lines = text.split(NULL);
      const status = new StatusSummary();
      for (let i = 0, l2 = lines.length; i < l2; ) {
        let line = lines[i++].trim();
        if (!line) {
          continue;
        }
        if (line.charAt(0) === "R") {
          line += NULL + (lines[i++] || "");
        }
        splitLine(status, line);
      }
      return status;
    };
  }
});
function statusTask(customArgs) {
  const commands = [
    "status",
    "--porcelain",
    "-b",
    "-u",
    "--null",
    ...customArgs.filter((arg) => !ignoredOptions.includes(arg))
  ];
  return {
    format: "utf-8",
    commands,
    parser(text) {
      return parseStatusSummary(text);
    }
  };
}
var ignoredOptions;
var init_status = __esm({
  "src/lib/tasks/status.ts"() {
    init_StatusSummary();
    ignoredOptions = ["--null", "-z"];
  }
});
function versionResponse(major = 0, minor = 0, patch = 0, agent = "", installed = true) {
  return Object.defineProperty(
    {
      major,
      minor,
      patch,
      agent,
      installed
    },
    "toString",
    {
      value() {
        return `${this.major}.${this.minor}.${this.patch}`;
      },
      configurable: false,
      enumerable: false
    }
  );
}
function notInstalledResponse() {
  return versionResponse(0, 0, 0, "", false);
}
function version_default() {
  return {
    version() {
      return this._runTask({
        commands: ["--version"],
        format: "utf-8",
        parser: versionParser,
        onError(result, error, done, fail) {
          if (result.exitCode === -2) {
            return done(Buffer.from(NOT_INSTALLED));
          }
          fail(error);
        }
      });
    }
  };
}
function versionParser(stdOut) {
  if (stdOut === NOT_INSTALLED) {
    return notInstalledResponse();
  }
  return parseStringResponse(versionResponse(0, 0, 0, stdOut), parsers7, stdOut);
}
var NOT_INSTALLED, parsers7;
var init_version = __esm({
  "src/lib/tasks/version.ts"() {
    init_utils();
    NOT_INSTALLED = "installed=false";
    parsers7 = [
      new LineParser(
        /version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/,
        (result, [major, minor, patch, agent = ""]) => {
          Object.assign(
            result,
            versionResponse(asNumber$1(major), asNumber$1(minor), asNumber$1(patch), agent)
          );
        }
      ),
      new LineParser(
        /version (\d+)\.(\d+)\.(\D+)(.+)?$/,
        (result, [major, minor, patch, agent = ""]) => {
          Object.assign(result, versionResponse(asNumber$1(major), asNumber$1(minor), patch, agent));
        }
      )
    ];
  }
});
var simple_git_api_exports = {};
__export(simple_git_api_exports, {
  SimpleGitApi: () => SimpleGitApi
});
var SimpleGitApi;
var init_simple_git_api = __esm({
  "src/lib/simple-git-api.ts"() {
    init_task_callback();
    init_change_working_directory();
    init_checkout();
    init_count_objects();
    init_commit();
    init_config();
    init_first_commit();
    init_grep();
    init_hash_object();
    init_init();
    init_log();
    init_merge();
    init_push();
    init_show();
    init_status();
    init_task();
    init_version();
    init_utils();
    SimpleGitApi = class {
      constructor(_executor) {
        this._executor = _executor;
      }
      _runTask(task, then) {
        const chain = this._executor.chain();
        const promise = chain.push(task);
        if (then) {
          taskCallback(task, promise, then);
        }
        return Object.create(this, {
          then: { value: promise.then.bind(promise) },
          catch: { value: promise.catch.bind(promise) },
          _executor: { value: chain }
        });
      }
      add(files) {
        return this._runTask(
          straightThroughStringTask(["add", ...asArray(files)]),
          trailingFunctionArgument(arguments)
        );
      }
      cwd(directory) {
        const next2 = trailingFunctionArgument(arguments);
        if (typeof directory === "string") {
          return this._runTask(changeWorkingDirectoryTask(directory, this._executor), next2);
        }
        if (typeof (directory == null ? void 0 : directory.path) === "string") {
          return this._runTask(
            changeWorkingDirectoryTask(
              directory.path,
              directory.root && this._executor || void 0
            ),
            next2
          );
        }
        return this._runTask(
          configurationErrorTask("Git.cwd: workingDirectory must be supplied as a string"),
          next2
        );
      }
      hashObject(path2, write) {
        return this._runTask(
          hashObjectTask(path2, write === true),
          trailingFunctionArgument(arguments)
        );
      }
      init(bare) {
        return this._runTask(
          initTask(bare === true, this._executor.cwd, getTrailingOptions(arguments)),
          trailingFunctionArgument(arguments)
        );
      }
      merge() {
        return this._runTask(
          mergeTask(getTrailingOptions(arguments)),
          trailingFunctionArgument(arguments)
        );
      }
      mergeFromTo(remote, branch) {
        if (!(filterString(remote) && filterString(branch))) {
          return this._runTask(
            configurationErrorTask(
              `Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings`
            )
          );
        }
        return this._runTask(
          mergeTask([remote, branch, ...getTrailingOptions(arguments)]),
          trailingFunctionArgument(arguments, false)
        );
      }
      outputHandler(handler) {
        this._executor.outputHandler = handler;
        return this;
      }
      push() {
        const task = pushTask(
          {
            remote: filterType(arguments[0], filterString),
            branch: filterType(arguments[1], filterString)
          },
          getTrailingOptions(arguments)
        );
        return this._runTask(task, trailingFunctionArgument(arguments));
      }
      stash() {
        return this._runTask(
          straightThroughStringTask(["stash", ...getTrailingOptions(arguments)]),
          trailingFunctionArgument(arguments)
        );
      }
      status() {
        return this._runTask(
          statusTask(getTrailingOptions(arguments)),
          trailingFunctionArgument(arguments)
        );
      }
    };
    Object.assign(
      SimpleGitApi.prototype,
      checkout_default(),
      commit_default(),
      config_default(),
      count_objects_default(),
      first_commit_default(),
      grep_default(),
      log_default(),
      show_default(),
      version_default()
    );
  }
});
var scheduler_exports = {};
__export(scheduler_exports, {
  Scheduler: () => Scheduler
});
var createScheduledTask, Scheduler;
var init_scheduler = __esm({
  "src/lib/runners/scheduler.ts"() {
    init_utils();
    init_git_logger();
    createScheduledTask = /* @__PURE__ */ (() => {
      let id = 0;
      return () => {
        id++;
        const { promise, done } = createDeferred();
        return {
          promise,
          done,
          id
        };
      };
    })();
    Scheduler = class {
      constructor(concurrency = 2) {
        this.concurrency = concurrency;
        this.logger = createLogger("", "scheduler");
        this.pending = [];
        this.running = [];
        this.logger(`Constructed, concurrency=%s`, concurrency);
      }
      schedule() {
        if (!this.pending.length || this.running.length >= this.concurrency) {
          this.logger(
            `Schedule attempt ignored, pending=%s running=%s concurrency=%s`,
            this.pending.length,
            this.running.length,
            this.concurrency
          );
          return;
        }
        const task = append(this.running, this.pending.shift());
        this.logger(`Attempting id=%s`, task.id);
        task.done(() => {
          this.logger(`Completing id=`, task.id);
          remove$1(this.running, task);
          this.schedule();
        });
      }
      next() {
        const { promise, id } = append(this.pending, createScheduledTask());
        this.logger(`Scheduling id=%s`, id);
        this.schedule();
        return promise;
      }
    };
  }
});
var apply_patch_exports = {};
__export(apply_patch_exports, {
  applyPatchTask: () => applyPatchTask
});
function applyPatchTask(patches, customArgs) {
  return straightThroughStringTask(["apply", ...customArgs, ...patches]);
}
var init_apply_patch = __esm({
  "src/lib/tasks/apply-patch.ts"() {
    init_task();
  }
});
function branchDeletionSuccess(branch, hash) {
  return {
    branch,
    hash,
    success: true
  };
}
function branchDeletionFailure(branch) {
  return {
    branch,
    hash: null,
    success: false
  };
}
var BranchDeletionBatch;
var init_BranchDeleteSummary = __esm({
  "src/lib/responses/BranchDeleteSummary.ts"() {
    BranchDeletionBatch = class {
      constructor() {
        this.all = [];
        this.branches = {};
        this.errors = [];
      }
      get success() {
        return !this.errors.length;
      }
    };
  }
});
function hasBranchDeletionError(data, processExitCode) {
  return processExitCode === 1 && deleteErrorRegex.test(data);
}
var deleteSuccessRegex, deleteErrorRegex, parsers8, parseBranchDeletions;
var init_parse_branch_delete = __esm({
  "src/lib/parsers/parse-branch-delete.ts"() {
    init_BranchDeleteSummary();
    init_utils();
    deleteSuccessRegex = /(\S+)\s+\(\S+\s([^)]+)\)/;
    deleteErrorRegex = /^error[^']+'([^']+)'/m;
    parsers8 = [
      new LineParser(deleteSuccessRegex, (result, [branch, hash]) => {
        const deletion = branchDeletionSuccess(branch, hash);
        result.all.push(deletion);
        result.branches[branch] = deletion;
      }),
      new LineParser(deleteErrorRegex, (result, [branch]) => {
        const deletion = branchDeletionFailure(branch);
        result.errors.push(deletion);
        result.all.push(deletion);
        result.branches[branch] = deletion;
      })
    ];
    parseBranchDeletions = (stdOut, stdErr) => {
      return parseStringResponse(new BranchDeletionBatch(), parsers8, [stdOut, stdErr]);
    };
  }
});
var BranchSummaryResult;
var init_BranchSummary = __esm({
  "src/lib/responses/BranchSummary.ts"() {
    BranchSummaryResult = class {
      constructor() {
        this.all = [];
        this.branches = {};
        this.current = "";
        this.detached = false;
      }
      push(status, detached, name, commit, label) {
        if (status === "*") {
          this.detached = detached;
          this.current = name;
        }
        this.all.push(name);
        this.branches[name] = {
          current: status === "*",
          linkedWorkTree: status === "+",
          name,
          commit,
          label
        };
      }
    };
  }
});
function branchStatus(input) {
  return input ? input.charAt(0) : "";
}
function parseBranchSummary(stdOut) {
  return parseStringResponse(new BranchSummaryResult(), parsers9, stdOut);
}
var parsers9;
var init_parse_branch = __esm({
  "src/lib/parsers/parse-branch.ts"() {
    init_BranchSummary();
    init_utils();
    parsers9 = [
      new LineParser(
        /^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/,
        (result, [current, name, commit, label]) => {
          result.push(branchStatus(current), true, name, commit, label);
        }
      ),
      new LineParser(
        /^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s,
        (result, [current, name, commit, label]) => {
          result.push(branchStatus(current), false, name, commit, label);
        }
      )
    ];
  }
});
var branch_exports = {};
__export(branch_exports, {
  branchLocalTask: () => branchLocalTask,
  branchTask: () => branchTask,
  containsDeleteBranchCommand: () => containsDeleteBranchCommand,
  deleteBranchTask: () => deleteBranchTask,
  deleteBranchesTask: () => deleteBranchesTask
});
function containsDeleteBranchCommand(commands) {
  const deleteCommands = ["-d", "-D", "--delete"];
  return commands.some((command) => deleteCommands.includes(command));
}
function branchTask(customArgs) {
  const isDelete = containsDeleteBranchCommand(customArgs);
  const commands = ["branch", ...customArgs];
  if (commands.length === 1) {
    commands.push("-a");
  }
  if (!commands.includes("-v")) {
    commands.splice(1, 0, "-v");
  }
  return {
    format: "utf-8",
    commands,
    parser(stdOut, stdErr) {
      if (isDelete) {
        return parseBranchDeletions(stdOut, stdErr).all[0];
      }
      return parseBranchSummary(stdOut);
    }
  };
}
function branchLocalTask() {
  const parser4 = parseBranchSummary;
  return {
    format: "utf-8",
    commands: ["branch", "-v"],
    parser: parser4
  };
}
function deleteBranchesTask(branches, forceDelete = false) {
  return {
    format: "utf-8",
    commands: ["branch", "-v", forceDelete ? "-D" : "-d", ...branches],
    parser(stdOut, stdErr) {
      return parseBranchDeletions(stdOut, stdErr);
    },
    onError({ exitCode, stdOut }, error, done, fail) {
      if (!hasBranchDeletionError(String(error), exitCode)) {
        return fail(error);
      }
      done(stdOut);
    }
  };
}
function deleteBranchTask(branch, forceDelete = false) {
  const task = {
    format: "utf-8",
    commands: ["branch", "-v", forceDelete ? "-D" : "-d", branch],
    parser(stdOut, stdErr) {
      return parseBranchDeletions(stdOut, stdErr).branches[branch];
    },
    onError({ exitCode, stdErr, stdOut }, error, _, fail) {
      if (!hasBranchDeletionError(String(error), exitCode)) {
        return fail(error);
      }
      throw new GitResponseError(
        task.parser(bufferToString(stdOut), bufferToString(stdErr)),
        String(error)
      );
    }
  };
  return task;
}
var init_branch = __esm({
  "src/lib/tasks/branch.ts"() {
    init_git_response_error();
    init_parse_branch_delete();
    init_parse_branch();
    init_utils();
  }
});
var parseCheckIgnore;
var init_CheckIgnore = __esm({
  "src/lib/responses/CheckIgnore.ts"() {
    parseCheckIgnore = (text) => {
      return text.split(/\n/g).map((line) => line.trim()).filter((file) => !!file);
    };
  }
});
var check_ignore_exports = {};
__export(check_ignore_exports, {
  checkIgnoreTask: () => checkIgnoreTask
});
function checkIgnoreTask(paths) {
  return {
    commands: ["check-ignore", ...paths],
    format: "utf-8",
    parser: parseCheckIgnore
  };
}
var init_check_ignore = __esm({
  "src/lib/tasks/check-ignore.ts"() {
    init_CheckIgnore();
  }
});
var clone_exports = {};
__export(clone_exports, {
  cloneMirrorTask: () => cloneMirrorTask,
  cloneTask: () => cloneTask
});
function disallowedCommand(command) {
  return /^--upload-pack(=|$)/.test(command);
}
function cloneTask(repo, directory, customArgs) {
  const commands = ["clone", ...customArgs];
  filterString(repo) && commands.push(repo);
  filterString(directory) && commands.push(directory);
  const banned = commands.find(disallowedCommand);
  if (banned) {
    return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
  }
  return straightThroughStringTask(commands);
}
function cloneMirrorTask(repo, directory, customArgs) {
  append(customArgs, "--mirror");
  return cloneTask(repo, directory, customArgs);
}
var init_clone = __esm({
  "src/lib/tasks/clone.ts"() {
    init_task();
    init_utils();
  }
});
function parseFetchResult(stdOut, stdErr) {
  const result = {
    raw: stdOut,
    remote: null,
    branches: [],
    tags: [],
    updated: [],
    deleted: []
  };
  return parseStringResponse(result, parsers10, [stdOut, stdErr]);
}
var parsers10;
var init_parse_fetch = __esm({
  "src/lib/parsers/parse-fetch.ts"() {
    init_utils();
    parsers10 = [
      new LineParser(/From (.+)$/, (result, [remote]) => {
        result.remote = remote;
      }),
      new LineParser(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
        result.branches.push({
          name,
          tracking
        });
      }),
      new LineParser(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (result, [name, tracking]) => {
        result.tags.push({
          name,
          tracking
        });
      }),
      new LineParser(/- \[deleted]\s+\S+\s*-> (.+)$/, (result, [tracking]) => {
        result.deleted.push({
          tracking
        });
      }),
      new LineParser(
        /\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/,
        (result, [from, to, name, tracking]) => {
          result.updated.push({
            name,
            tracking,
            to,
            from
          });
        }
      )
    ];
  }
});
var fetch_exports = {};
__export(fetch_exports, {
  fetchTask: () => fetchTask
});
function disallowedCommand2(command) {
  return /^--upload-pack(=|$)/.test(command);
}
function fetchTask(remote, branch, customArgs) {
  const commands = ["fetch", ...customArgs];
  if (remote && branch) {
    commands.push(remote, branch);
  }
  const banned = commands.find(disallowedCommand2);
  if (banned) {
    return configurationErrorTask(`git.fetch: potential exploit argument blocked.`);
  }
  return {
    commands,
    format: "utf-8",
    parser: parseFetchResult
  };
}
var init_fetch = __esm({
  "src/lib/tasks/fetch.ts"() {
    init_parse_fetch();
    init_task();
  }
});
function parseMoveResult(stdOut) {
  return parseStringResponse({ moves: [] }, parsers11, stdOut);
}
var parsers11;
var init_parse_move = __esm({
  "src/lib/parsers/parse-move.ts"() {
    init_utils();
    parsers11 = [
      new LineParser(/^Renaming (.+) to (.+)$/, (result, [from, to]) => {
        result.moves.push({ from, to });
      })
    ];
  }
});
var move_exports = {};
__export(move_exports, {
  moveTask: () => moveTask
});
function moveTask(from, to) {
  return {
    commands: ["mv", "-v", ...asArray(from), to],
    format: "utf-8",
    parser: parseMoveResult
  };
}
var init_move = __esm({
  "src/lib/tasks/move.ts"() {
    init_parse_move();
    init_utils();
  }
});
var pull_exports = {};
__export(pull_exports, {
  pullTask: () => pullTask
});
function pullTask(remote, branch, customArgs) {
  const commands = ["pull", ...customArgs];
  if (remote && branch) {
    commands.splice(1, 0, remote, branch);
  }
  return {
    commands,
    format: "utf-8",
    parser(stdOut, stdErr) {
      return parsePullResult(stdOut, stdErr);
    },
    onError(result, _error, _done, fail) {
      const pullError = parsePullErrorResult(
        bufferToString(result.stdOut),
        bufferToString(result.stdErr)
      );
      if (pullError) {
        return fail(new GitResponseError(pullError));
      }
      fail(_error);
    }
  };
}
var init_pull = __esm({
  "src/lib/tasks/pull.ts"() {
    init_git_response_error();
    init_parse_pull();
    init_utils();
  }
});
function parseGetRemotes(text) {
  const remotes = {};
  forEach(text, ([name]) => remotes[name] = { name });
  return Object.values(remotes);
}
function parseGetRemotesVerbose(text) {
  const remotes = {};
  forEach(text, ([name, url, purpose]) => {
    if (!remotes.hasOwnProperty(name)) {
      remotes[name] = {
        name,
        refs: { fetch: "", push: "" }
      };
    }
    if (purpose && url) {
      remotes[name].refs[purpose.replace(/[^a-z]/g, "")] = url;
    }
  });
  return Object.values(remotes);
}
function forEach(text, handler) {
  forEachLineWithContent(text, (line) => handler(line.split(/\s+/)));
}
var init_GetRemoteSummary = __esm({
  "src/lib/responses/GetRemoteSummary.ts"() {
    init_utils();
  }
});
var remote_exports = {};
__export(remote_exports, {
  addRemoteTask: () => addRemoteTask,
  getRemotesTask: () => getRemotesTask,
  listRemotesTask: () => listRemotesTask,
  remoteTask: () => remoteTask,
  removeRemoteTask: () => removeRemoteTask
});
function addRemoteTask(remoteName, remoteRepo, customArgs) {
  return straightThroughStringTask(["remote", "add", ...customArgs, remoteName, remoteRepo]);
}
function getRemotesTask(verbose) {
  const commands = ["remote"];
  if (verbose) {
    commands.push("-v");
  }
  return {
    commands,
    format: "utf-8",
    parser: verbose ? parseGetRemotesVerbose : parseGetRemotes
  };
}
function listRemotesTask(customArgs) {
  const commands = [...customArgs];
  if (commands[0] !== "ls-remote") {
    commands.unshift("ls-remote");
  }
  return straightThroughStringTask(commands);
}
function remoteTask(customArgs) {
  const commands = [...customArgs];
  if (commands[0] !== "remote") {
    commands.unshift("remote");
  }
  return straightThroughStringTask(commands);
}
function removeRemoteTask(remoteName) {
  return straightThroughStringTask(["remote", "remove", remoteName]);
}
var init_remote = __esm({
  "src/lib/tasks/remote.ts"() {
    init_GetRemoteSummary();
    init_task();
  }
});
var stash_list_exports = {};
__export(stash_list_exports, {
  stashListTask: () => stashListTask
});
function stashListTask(opt = {}, customArgs) {
  const options = parseLogOptions(opt);
  const commands = ["stash", "list", ...options.commands, ...customArgs];
  const parser4 = createListLogSummaryParser(
    options.splitter,
    options.fields,
    logFormatFromCommand(commands)
  );
  return validateLogFormatConfig(commands) || {
    commands,
    format: "utf-8",
    parser: parser4
  };
}
var init_stash_list = __esm({
  "src/lib/tasks/stash-list.ts"() {
    init_log_format();
    init_parse_list_log_summary();
    init_diff();
    init_log();
  }
});
var sub_module_exports = {};
__export(sub_module_exports, {
  addSubModuleTask: () => addSubModuleTask,
  initSubModuleTask: () => initSubModuleTask,
  subModuleTask: () => subModuleTask,
  updateSubModuleTask: () => updateSubModuleTask
});
function addSubModuleTask(repo, path2) {
  return subModuleTask(["add", repo, path2]);
}
function initSubModuleTask(customArgs) {
  return subModuleTask(["init", ...customArgs]);
}
function subModuleTask(customArgs) {
  const commands = [...customArgs];
  if (commands[0] !== "submodule") {
    commands.unshift("submodule");
  }
  return straightThroughStringTask(commands);
}
function updateSubModuleTask(customArgs) {
  return subModuleTask(["update", ...customArgs]);
}
var init_sub_module = __esm({
  "src/lib/tasks/sub-module.ts"() {
    init_task();
  }
});
function singleSorted(a, b) {
  const aIsNum = isNaN(a);
  const bIsNum = isNaN(b);
  if (aIsNum !== bIsNum) {
    return aIsNum ? 1 : -1;
  }
  return aIsNum ? sorted$2(a, b) : 0;
}
function sorted$2(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}
function trimmed(input) {
  return input.trim();
}
function toNumber(input) {
  if (typeof input === "string") {
    return parseInt(input.replace(/^\D+/g, ""), 10) || 0;
  }
  return 0;
}
var TagList, parseTagList;
var init_TagList = __esm({
  "src/lib/responses/TagList.ts"() {
    TagList = class {
      constructor(all, latest) {
        this.all = all;
        this.latest = latest;
      }
    };
    parseTagList = function(data, customSort = false) {
      const tags = data.split("\n").map(trimmed).filter(Boolean);
      if (!customSort) {
        tags.sort(function(tagA, tagB) {
          const partsA = tagA.split(".");
          const partsB = tagB.split(".");
          if (partsA.length === 1 || partsB.length === 1) {
            return singleSorted(toNumber(partsA[0]), toNumber(partsB[0]));
          }
          for (let i = 0, l2 = Math.max(partsA.length, partsB.length); i < l2; i++) {
            const diff2 = sorted$2(toNumber(partsA[i]), toNumber(partsB[i]));
            if (diff2) {
              return diff2;
            }
          }
          return 0;
        });
      }
      const latest = customSort ? tags[0] : [...tags].reverse().find((tag) => tag.indexOf(".") >= 0);
      return new TagList(tags, latest);
    };
  }
});
var tag_exports = {};
__export(tag_exports, {
  addAnnotatedTagTask: () => addAnnotatedTagTask,
  addTagTask: () => addTagTask,
  tagListTask: () => tagListTask
});
function tagListTask(customArgs = []) {
  const hasCustomSort = customArgs.some((option) => /^--sort=/.test(option));
  return {
    format: "utf-8",
    commands: ["tag", "-l", ...customArgs],
    parser(text) {
      return parseTagList(text, hasCustomSort);
    }
  };
}
function addTagTask(name) {
  return {
    format: "utf-8",
    commands: ["tag", name],
    parser() {
      return { name };
    }
  };
}
function addAnnotatedTagTask(name, tagMessage) {
  return {
    format: "utf-8",
    commands: ["tag", "-a", "-m", tagMessage, name],
    parser() {
      return { name };
    }
  };
}
var init_tag = __esm({
  "src/lib/tasks/tag.ts"() {
    init_TagList();
  }
});
var require_git = __commonJS({
  "src/git.js"(exports, module) {
    var { GitExecutor: GitExecutor2 } = (init_git_executor(), __toCommonJS(git_executor_exports));
    var { SimpleGitApi: SimpleGitApi2 } = (init_simple_git_api(), __toCommonJS(simple_git_api_exports));
    var { Scheduler: Scheduler2 } = (init_scheduler(), __toCommonJS(scheduler_exports));
    var { configurationErrorTask: configurationErrorTask2 } = (init_task(), __toCommonJS(task_exports));
    var {
      asArray: asArray2,
      filterArray: filterArray2,
      filterPrimitives: filterPrimitives2,
      filterString: filterString2,
      filterStringOrStringArray: filterStringOrStringArray2,
      filterType: filterType2,
      getTrailingOptions: getTrailingOptions2,
      trailingFunctionArgument: trailingFunctionArgument2,
      trailingOptionsArgument: trailingOptionsArgument2
    } = (init_utils(), __toCommonJS(utils_exports));
    var { applyPatchTask: applyPatchTask2 } = (init_apply_patch(), __toCommonJS(apply_patch_exports));
    var {
      branchTask: branchTask2,
      branchLocalTask: branchLocalTask2,
      deleteBranchesTask: deleteBranchesTask2,
      deleteBranchTask: deleteBranchTask2
    } = (init_branch(), __toCommonJS(branch_exports));
    var { checkIgnoreTask: checkIgnoreTask2 } = (init_check_ignore(), __toCommonJS(check_ignore_exports));
    var { checkIsRepoTask: checkIsRepoTask2 } = (init_check_is_repo(), __toCommonJS(check_is_repo_exports));
    var { cloneTask: cloneTask2, cloneMirrorTask: cloneMirrorTask2 } = (init_clone(), __toCommonJS(clone_exports));
    var { cleanWithOptionsTask: cleanWithOptionsTask2, isCleanOptionsArray: isCleanOptionsArray2 } = (init_clean(), __toCommonJS(clean_exports));
    var { diffSummaryTask: diffSummaryTask2 } = (init_diff(), __toCommonJS(diff_exports));
    var { fetchTask: fetchTask2 } = (init_fetch(), __toCommonJS(fetch_exports));
    var { moveTask: moveTask2 } = (init_move(), __toCommonJS(move_exports));
    var { pullTask: pullTask2 } = (init_pull(), __toCommonJS(pull_exports));
    var { pushTagsTask: pushTagsTask2 } = (init_push(), __toCommonJS(push_exports));
    var {
      addRemoteTask: addRemoteTask2,
      getRemotesTask: getRemotesTask2,
      listRemotesTask: listRemotesTask2,
      remoteTask: remoteTask2,
      removeRemoteTask: removeRemoteTask2
    } = (init_remote(), __toCommonJS(remote_exports));
    var { getResetMode: getResetMode2, resetTask: resetTask2 } = (init_reset(), __toCommonJS(reset_exports));
    var { stashListTask: stashListTask2 } = (init_stash_list(), __toCommonJS(stash_list_exports));
    var {
      addSubModuleTask: addSubModuleTask2,
      initSubModuleTask: initSubModuleTask2,
      subModuleTask: subModuleTask2,
      updateSubModuleTask: updateSubModuleTask2
    } = (init_sub_module(), __toCommonJS(sub_module_exports));
    var { addAnnotatedTagTask: addAnnotatedTagTask2, addTagTask: addTagTask2, tagListTask: tagListTask2 } = (init_tag(), __toCommonJS(tag_exports));
    var { straightThroughBufferTask: straightThroughBufferTask2, straightThroughStringTask: straightThroughStringTask2 } = (init_task(), __toCommonJS(task_exports));
    function Git2(options, plugins) {
      this._plugins = plugins;
      this._executor = new GitExecutor2(
        options.baseDir,
        new Scheduler2(options.maxConcurrentProcesses),
        plugins
      );
      this._trimmed = options.trimmed;
    }
    (Git2.prototype = Object.create(SimpleGitApi2.prototype)).constructor = Git2;
    Git2.prototype.customBinary = function(command) {
      this._plugins.reconfigure("binary", command);
      return this;
    };
    Git2.prototype.env = function(name, value) {
      if (arguments.length === 1 && typeof name === "object") {
        this._executor.env = name;
      } else {
        (this._executor.env = this._executor.env || {})[name] = value;
      }
      return this;
    };
    Git2.prototype.stashList = function(options) {
      return this._runTask(
        stashListTask2(
          trailingOptionsArgument2(arguments) || {},
          filterArray2(options) && options || []
        ),
        trailingFunctionArgument2(arguments)
      );
    };
    function createCloneTask(api, task, repoPath, localPath) {
      if (typeof repoPath !== "string") {
        return configurationErrorTask2(`git.${api}() requires a string 'repoPath'`);
      }
      return task(repoPath, filterType2(localPath, filterString2), getTrailingOptions2(arguments));
    }
    Git2.prototype.clone = function() {
      return this._runTask(
        createCloneTask("clone", cloneTask2, ...arguments),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.mirror = function() {
      return this._runTask(
        createCloneTask("mirror", cloneMirrorTask2, ...arguments),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.mv = function(from, to) {
      return this._runTask(moveTask2(from, to), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.checkoutLatestTag = function(then) {
      var git = this;
      return this.pull(function() {
        git.tags(function(err, tags) {
          git.checkout(tags.latest, then);
        });
      });
    };
    Git2.prototype.pull = function(remote, branch, options, then) {
      return this._runTask(
        pullTask2(
          filterType2(remote, filterString2),
          filterType2(branch, filterString2),
          getTrailingOptions2(arguments)
        ),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.fetch = function(remote, branch) {
      return this._runTask(
        fetchTask2(
          filterType2(remote, filterString2),
          filterType2(branch, filterString2),
          getTrailingOptions2(arguments)
        ),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.silent = function(silence) {
      console.warn(
        "simple-git deprecation notice: git.silent: logging should be configured using the `debug` library / `DEBUG` environment variable, this will be an error in version 3"
      );
      return this;
    };
    Git2.prototype.tags = function(options, then) {
      return this._runTask(
        tagListTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.rebase = function() {
      return this._runTask(
        straightThroughStringTask2(["rebase", ...getTrailingOptions2(arguments)]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.reset = function(mode) {
      return this._runTask(
        resetTask2(getResetMode2(mode), getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.revert = function(commit) {
      const next2 = trailingFunctionArgument2(arguments);
      if (typeof commit !== "string") {
        return this._runTask(configurationErrorTask2("Commit must be a string"), next2);
      }
      return this._runTask(
        straightThroughStringTask2(["revert", ...getTrailingOptions2(arguments, 0, true), commit]),
        next2
      );
    };
    Git2.prototype.addTag = function(name) {
      const task = typeof name === "string" ? addTagTask2(name) : configurationErrorTask2("Git.addTag requires a tag name");
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.addAnnotatedTag = function(tagName, tagMessage) {
      return this._runTask(
        addAnnotatedTagTask2(tagName, tagMessage),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.deleteLocalBranch = function(branchName, forceDelete, then) {
      return this._runTask(
        deleteBranchTask2(branchName, typeof forceDelete === "boolean" ? forceDelete : false),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.deleteLocalBranches = function(branchNames, forceDelete, then) {
      return this._runTask(
        deleteBranchesTask2(branchNames, typeof forceDelete === "boolean" ? forceDelete : false),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.branch = function(options, then) {
      return this._runTask(
        branchTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.branchLocal = function(then) {
      return this._runTask(branchLocalTask2(), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.raw = function(commands) {
      const createRestCommands = !Array.isArray(commands);
      const command = [].slice.call(createRestCommands ? arguments : commands, 0);
      for (let i = 0; i < command.length && createRestCommands; i++) {
        if (!filterPrimitives2(command[i])) {
          command.splice(i, command.length - i);
          break;
        }
      }
      command.push(...getTrailingOptions2(arguments, 0, true));
      var next2 = trailingFunctionArgument2(arguments);
      if (!command.length) {
        return this._runTask(
          configurationErrorTask2("Raw: must supply one or more command to execute"),
          next2
        );
      }
      return this._runTask(straightThroughStringTask2(command, this._trimmed), next2);
    };
    Git2.prototype.submoduleAdd = function(repo, path2, then) {
      return this._runTask(addSubModuleTask2(repo, path2), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.submoduleUpdate = function(args, then) {
      return this._runTask(
        updateSubModuleTask2(getTrailingOptions2(arguments, true)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.submoduleInit = function(args, then) {
      return this._runTask(
        initSubModuleTask2(getTrailingOptions2(arguments, true)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.subModule = function(options, then) {
      return this._runTask(
        subModuleTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.listRemote = function() {
      return this._runTask(
        listRemotesTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.addRemote = function(remoteName, remoteRepo, then) {
      return this._runTask(
        addRemoteTask2(remoteName, remoteRepo, getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.removeRemote = function(remoteName, then) {
      return this._runTask(removeRemoteTask2(remoteName), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.getRemotes = function(verbose, then) {
      return this._runTask(getRemotesTask2(verbose === true), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.remote = function(options, then) {
      return this._runTask(
        remoteTask2(getTrailingOptions2(arguments)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.tag = function(options, then) {
      const command = getTrailingOptions2(arguments);
      if (command[0] !== "tag") {
        command.unshift("tag");
      }
      return this._runTask(straightThroughStringTask2(command), trailingFunctionArgument2(arguments));
    };
    Git2.prototype.updateServerInfo = function(then) {
      return this._runTask(
        straightThroughStringTask2(["update-server-info"]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.pushTags = function(remote, then) {
      const task = pushTagsTask2(
        { remote: filterType2(remote, filterString2) },
        getTrailingOptions2(arguments)
      );
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.rm = function(files) {
      return this._runTask(
        straightThroughStringTask2(["rm", "-f", ...asArray2(files)]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.rmKeepLocal = function(files) {
      return this._runTask(
        straightThroughStringTask2(["rm", "--cached", ...asArray2(files)]),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.catFile = function(options, then) {
      return this._catFile("utf-8", arguments);
    };
    Git2.prototype.binaryCatFile = function() {
      return this._catFile("buffer", arguments);
    };
    Git2.prototype._catFile = function(format, args) {
      var handler = trailingFunctionArgument2(args);
      var command = ["cat-file"];
      var options = args[0];
      if (typeof options === "string") {
        return this._runTask(
          configurationErrorTask2("Git.catFile: options must be supplied as an array of strings"),
          handler
        );
      }
      if (Array.isArray(options)) {
        command.push.apply(command, options);
      }
      const task = format === "buffer" ? straightThroughBufferTask2(command) : straightThroughStringTask2(command);
      return this._runTask(task, handler);
    };
    Git2.prototype.diff = function(options, then) {
      const task = filterString2(options) ? configurationErrorTask2(
        "git.diff: supplying options as a single string is no longer supported, switch to an array of strings"
      ) : straightThroughStringTask2(["diff", ...getTrailingOptions2(arguments)]);
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.diffSummary = function() {
      return this._runTask(
        diffSummaryTask2(getTrailingOptions2(arguments, 1)),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.applyPatch = function(patches) {
      const task = !filterStringOrStringArray2(patches) ? configurationErrorTask2(
        `git.applyPatch requires one or more string patches as the first argument`
      ) : applyPatchTask2(asArray2(patches), getTrailingOptions2([].slice.call(arguments, 1)));
      return this._runTask(task, trailingFunctionArgument2(arguments));
    };
    Git2.prototype.revparse = function() {
      const commands = ["rev-parse", ...getTrailingOptions2(arguments, true)];
      return this._runTask(
        straightThroughStringTask2(commands, true),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.clean = function(mode, options, then) {
      const usingCleanOptionsArray = isCleanOptionsArray2(mode);
      const cleanMode = usingCleanOptionsArray && mode.join("") || filterType2(mode, filterString2) || "";
      const customArgs = getTrailingOptions2([].slice.call(arguments, usingCleanOptionsArray ? 1 : 0));
      return this._runTask(
        cleanWithOptionsTask2(cleanMode, customArgs),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.exec = function(then) {
      const task = {
        commands: [],
        format: "utf-8",
        parser() {
          if (typeof then === "function") {
            then();
          }
        }
      };
      return this._runTask(task);
    };
    Git2.prototype.clearQueue = function() {
      return this;
    };
    Git2.prototype.checkIgnore = function(pathnames, then) {
      return this._runTask(
        checkIgnoreTask2(asArray2(filterType2(pathnames, filterStringOrStringArray2, []))),
        trailingFunctionArgument2(arguments)
      );
    };
    Git2.prototype.checkIsRepo = function(checkType, then) {
      return this._runTask(
        checkIsRepoTask2(filterType2(checkType, filterString2)),
        trailingFunctionArgument2(arguments)
      );
    };
    module.exports = Git2;
  }
});
init_pathspec();
init_git_error();
var GitConstructError = class extends GitError {
  constructor(config, message) {
    super(void 0, message);
    this.config = config;
  }
};
init_git_error();
init_git_error();
var GitPluginError = class extends GitError {
  constructor(task, plugin, message) {
    super(task, message);
    this.task = task;
    this.plugin = plugin;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
init_git_response_error();
init_task_configuration_error();
init_check_is_repo();
init_clean();
init_config();
init_diff_name_status();
init_grep();
init_reset();
function abortPlugin(signal) {
  if (!signal) {
    return;
  }
  const onSpawnAfter = {
    type: "spawn.after",
    action(_data, context) {
      function kill() {
        context.kill(new GitPluginError(void 0, "abort", "Abort signal received"));
      }
      signal.addEventListener("abort", kill);
      context.spawned.on("close", () => signal.removeEventListener("abort", kill));
    }
  };
  const onSpawnBefore = {
    type: "spawn.before",
    action(_data, context) {
      if (signal.aborted) {
        context.kill(new GitPluginError(void 0, "abort", "Abort already signaled"));
      }
    }
  };
  return [onSpawnBefore, onSpawnAfter];
}
function isConfigSwitch(arg) {
  return typeof arg === "string" && arg.trim().toLowerCase() === "-c";
}
function preventProtocolOverride(arg, next2) {
  if (!isConfigSwitch(arg)) {
    return;
  }
  if (!/^\s*protocol(.[a-z]+)?.allow/.test(next2)) {
    return;
  }
  throw new GitPluginError(
    void 0,
    "unsafe",
    "Configuring protocol.allow is not permitted without enabling allowUnsafeExtProtocol"
  );
}
function preventUploadPack(arg, method) {
  if (/^\s*--(upload|receive)-pack/.test(arg)) {
    throw new GitPluginError(
      void 0,
      "unsafe",
      `Use of --upload-pack or --receive-pack is not permitted without enabling allowUnsafePack`
    );
  }
  if (method === "clone" && /^\s*-u\b/.test(arg)) {
    throw new GitPluginError(
      void 0,
      "unsafe",
      `Use of clone with option -u is not permitted without enabling allowUnsafePack`
    );
  }
  if (method === "push" && /^\s*--exec\b/.test(arg)) {
    throw new GitPluginError(
      void 0,
      "unsafe",
      `Use of push with option --exec is not permitted without enabling allowUnsafePack`
    );
  }
}
function blockUnsafeOperationsPlugin({
  allowUnsafeProtocolOverride = false,
  allowUnsafePack = false
} = {}) {
  return {
    type: "spawn.args",
    action(args, context) {
      args.forEach((current, index) => {
        const next2 = index < args.length ? args[index + 1] : "";
        allowUnsafeProtocolOverride || preventProtocolOverride(current, next2);
        allowUnsafePack || preventUploadPack(current, context.method);
      });
      return args;
    }
  };
}
init_utils();
function commandConfigPrefixingPlugin(configuration) {
  const prefix = prefixedArray(configuration, "-c");
  return {
    type: "spawn.args",
    action(data) {
      return [...prefix, ...data];
    }
  };
}
init_utils();
var never = deferred_1().promise;
function completionDetectionPlugin({
  onClose = true,
  onExit = 50
} = {}) {
  function createEvents() {
    let exitCode = -1;
    const events2 = {
      close: deferred_1(),
      closeTimeout: deferred_1(),
      exit: deferred_1(),
      exitTimeout: deferred_1()
    };
    const result = Promise.race([
      onClose === false ? never : events2.closeTimeout.promise,
      onExit === false ? never : events2.exitTimeout.promise
    ]);
    configureTimeout(onClose, events2.close, events2.closeTimeout);
    configureTimeout(onExit, events2.exit, events2.exitTimeout);
    return {
      close(code) {
        exitCode = code;
        events2.close.done();
      },
      exit(code) {
        exitCode = code;
        events2.exit.done();
      },
      get exitCode() {
        return exitCode;
      },
      result
    };
  }
  function configureTimeout(flag, event, timeout) {
    if (flag === false) {
      return;
    }
    (flag === true ? event.promise : event.promise.then(() => delay(flag))).then(timeout.done);
  }
  return {
    type: "spawn.after",
    async action(_data, { spawned, close }) {
      var _a2, _b;
      const events2 = createEvents();
      let deferClose = true;
      let quickClose = () => void (deferClose = false);
      (_a2 = spawned.stdout) == null ? void 0 : _a2.on("data", quickClose);
      (_b = spawned.stderr) == null ? void 0 : _b.on("data", quickClose);
      spawned.on("error", quickClose);
      spawned.on("close", (code) => events2.close(code));
      spawned.on("exit", (code) => events2.exit(code));
      try {
        await events2.result;
        if (deferClose) {
          await delay(50);
        }
        close(events2.exitCode);
      } catch (err) {
        close(events2.exitCode, err);
      }
    }
  };
}
init_utils();
var WRONG_NUMBER_ERR = `Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings`;
var WRONG_CHARS_ERR = `Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option`;
function isBadArgument(arg) {
  return !arg || !/^([a-z]:)?([a-z0-9/.\\_-]+)$/i.test(arg);
}
function toBinaryConfig(input, allowUnsafe) {
  if (input.length < 1 || input.length > 2) {
    throw new GitPluginError(void 0, "binary", WRONG_NUMBER_ERR);
  }
  const isBad = input.some(isBadArgument);
  if (isBad) {
    if (allowUnsafe) {
      console.warn(WRONG_CHARS_ERR);
    } else {
      throw new GitPluginError(void 0, "binary", WRONG_CHARS_ERR);
    }
  }
  const [binary, prefix] = input;
  return {
    binary,
    prefix
  };
}
function customBinaryPlugin(plugins, input = ["git"], allowUnsafe = false) {
  let config = toBinaryConfig(asArray(input), allowUnsafe);
  plugins.on("binary", (input2) => {
    config = toBinaryConfig(asArray(input2), allowUnsafe);
  });
  plugins.append("spawn.binary", () => {
    return config.binary;
  });
  plugins.append("spawn.args", (data) => {
    return config.prefix ? [config.prefix, ...data] : data;
  });
}
init_git_error();
function isTaskError(result) {
  return !!(result.exitCode && result.stdErr.length);
}
function getErrorMessage(result) {
  return Buffer.concat([...result.stdOut, ...result.stdErr]);
}
function errorDetectionHandler(overwrite = false, isError = isTaskError, errorMessage = getErrorMessage) {
  return (error, result) => {
    if (!overwrite && error || !isError(result)) {
      return error;
    }
    return errorMessage(result);
  };
}
function errorDetectionPlugin(config) {
  return {
    type: "task.error",
    action(data, context) {
      const error = config(data.error, {
        stdErr: context.stdErr,
        stdOut: context.stdOut,
        exitCode: context.exitCode
      });
      if (Buffer.isBuffer(error)) {
        return { error: new GitError(void 0, error.toString("utf-8")) };
      }
      return {
        error
      };
    }
  };
}
init_utils();
var PluginStore = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Set();
    this.events = new EventEmitter();
  }
  on(type2, listener) {
    this.events.on(type2, listener);
  }
  reconfigure(type2, data) {
    this.events.emit(type2, data);
  }
  append(type2, action) {
    const plugin = append(this.plugins, { type: type2, action });
    return () => this.plugins.delete(plugin);
  }
  add(plugin) {
    const plugins = [];
    asArray(plugin).forEach((plugin2) => plugin2 && this.plugins.add(append(plugins, plugin2)));
    return () => {
      plugins.forEach((plugin2) => this.plugins.delete(plugin2));
    };
  }
  exec(type2, data, context) {
    let output = data;
    const contextual = Object.freeze(Object.create(context));
    for (const plugin of this.plugins) {
      if (plugin.type === type2) {
        output = plugin.action(output, contextual);
      }
    }
    return output;
  }
};
init_utils();
function progressMonitorPlugin(progress) {
  const progressCommand = "--progress";
  const progressMethods = ["checkout", "clone", "fetch", "pull", "push"];
  const onProgress = {
    type: "spawn.after",
    action(_data, context) {
      var _a2;
      if (!context.commands.includes(progressCommand)) {
        return;
      }
      (_a2 = context.spawned.stderr) == null ? void 0 : _a2.on("data", (chunk) => {
        const message = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(chunk.toString("utf8"));
        if (!message) {
          return;
        }
        progress({
          method: context.method,
          stage: progressEventStage(message[1]),
          progress: asNumber$1(message[2]),
          processed: asNumber$1(message[3]),
          total: asNumber$1(message[4])
        });
      });
    }
  };
  const onArgs = {
    type: "spawn.args",
    action(args, context) {
      if (!progressMethods.includes(context.method)) {
        return args;
      }
      return including(args, progressCommand);
    }
  };
  return [onArgs, onProgress];
}
function progressEventStage(input) {
  return String(input.toLowerCase().split(" ", 1)) || "unknown";
}
init_utils();
function spawnOptionsPlugin(spawnOptions) {
  const options = pick$1(spawnOptions, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(data) {
      return { ...options, ...data };
    }
  };
}
function timeoutPlugin({
  block,
  stdErr = true,
  stdOut = true
}) {
  if (block > 0) {
    return {
      type: "spawn.after",
      action(_data, context) {
        var _a2, _b;
        let timeout;
        function wait() {
          timeout && clearTimeout(timeout);
          timeout = setTimeout(kill, block);
        }
        function stop() {
          var _a3, _b2;
          (_a3 = context.spawned.stdout) == null ? void 0 : _a3.off("data", wait);
          (_b2 = context.spawned.stderr) == null ? void 0 : _b2.off("data", wait);
          context.spawned.off("exit", stop);
          context.spawned.off("close", stop);
          timeout && clearTimeout(timeout);
        }
        function kill() {
          stop();
          context.kill(new GitPluginError(void 0, "timeout", `block timeout reached`));
        }
        stdOut && ((_a2 = context.spawned.stdout) == null ? void 0 : _a2.on("data", wait));
        stdErr && ((_b = context.spawned.stderr) == null ? void 0 : _b.on("data", wait));
        context.spawned.on("exit", stop);
        context.spawned.on("close", stop);
        wait();
      }
    };
  }
}
init_pathspec();
function suffixPathsPlugin() {
  return {
    type: "spawn.args",
    action(data) {
      const prefix = [];
      let suffix;
      function append2(args) {
        (suffix = suffix || []).push(...args);
      }
      for (let i = 0; i < data.length; i++) {
        const param = data[i];
        if (isPathSpec(param)) {
          append2(toPaths(param));
          continue;
        }
        if (param === "--") {
          append2(
            data.slice(i + 1).flatMap((item) => isPathSpec(item) && toPaths(item) || item)
          );
          break;
        }
        prefix.push(param);
      }
      return !suffix ? prefix : [...prefix, "--", ...suffix.map(String)];
    }
  };
}
init_utils();
var Git = require_git();
function gitInstanceFactory(baseDir, options) {
  var _a2;
  const plugins = new PluginStore();
  const config = createInstanceConfig(
    baseDir && (typeof baseDir === "string" ? { baseDir } : baseDir) || {},
    options
  );
  if (!folderExists(config.baseDir)) {
    throw new GitConstructError(
      config,
      `Cannot use simple-git on a directory that does not exist`
    );
  }
  if (Array.isArray(config.config)) {
    plugins.add(commandConfigPrefixingPlugin(config.config));
  }
  plugins.add(blockUnsafeOperationsPlugin(config.unsafe));
  plugins.add(suffixPathsPlugin());
  plugins.add(completionDetectionPlugin(config.completion));
  config.abort && plugins.add(abortPlugin(config.abort));
  config.progress && plugins.add(progressMonitorPlugin(config.progress));
  config.timeout && plugins.add(timeoutPlugin(config.timeout));
  config.spawnOptions && plugins.add(spawnOptionsPlugin(config.spawnOptions));
  plugins.add(errorDetectionPlugin(errorDetectionHandler(true)));
  config.errors && plugins.add(errorDetectionPlugin(config.errors));
  customBinaryPlugin(plugins, config.binary, (_a2 = config.unsafe) == null ? void 0 : _a2.allowUnsafeCustomBinary);
  return new Git(config, plugins);
}
init_git_response_error();
var esm_default = gitInstanceFactory;
const EntryTypes = {
  FILE_TYPE: "files",
  DIR_TYPE: "directories",
  FILE_DIR_TYPE: "files_directories",
  EVERYTHING_TYPE: "all"
};
const defaultOptions = {
  root: ".",
  fileFilter: (_entryInfo) => true,
  directoryFilter: (_entryInfo) => true,
  type: EntryTypes.FILE_TYPE,
  lstat: false,
  depth: 2147483648,
  alwaysStat: false,
  highWaterMark: 4096
};
Object.freeze(defaultOptions);
const RECURSIVE_ERROR_CODE = "READDIRP_RECURSIVE_ERROR";
const NORMAL_FLOW_ERRORS = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", RECURSIVE_ERROR_CODE]);
const ALL_TYPES = [
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE
];
const DIR_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE
]);
const FILE_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE
]);
const isNormalFlowError = (error) => NORMAL_FLOW_ERRORS.has(error.code);
const wantBigintFsStats = process.platform === "win32";
const emptyFn = (_entryInfo) => true;
const normalizeFilter = (filter) => {
  if (filter === void 0)
    return emptyFn;
  if (typeof filter === "function")
    return filter;
  if (typeof filter === "string") {
    const fl = filter.trim();
    return (entry) => entry.basename === fl;
  }
  if (Array.isArray(filter)) {
    const trItems = filter.map((item) => item.trim());
    return (entry) => trItems.some((f) => entry.basename === f);
  }
  return emptyFn;
};
class ReaddirpStream extends Readable {
  constructor(options = {}) {
    super({
      objectMode: true,
      autoDestroy: true,
      highWaterMark: options.highWaterMark
    });
    const opts = { ...defaultOptions, ...options };
    const { root, type: type2 } = opts;
    this._fileFilter = normalizeFilter(opts.fileFilter);
    this._directoryFilter = normalizeFilter(opts.directoryFilter);
    const statMethod = opts.lstat ? lstat : stat;
    if (wantBigintFsStats) {
      this._stat = (path2) => statMethod(path2, { bigint: true });
    } else {
      this._stat = statMethod;
    }
    this._maxDepth = opts.depth ?? defaultOptions.depth;
    this._wantsDir = type2 ? DIR_TYPES.has(type2) : false;
    this._wantsFile = type2 ? FILE_TYPES.has(type2) : false;
    this._wantsEverything = type2 === EntryTypes.EVERYTHING_TYPE;
    this._root = resolve(root);
    this._isDirent = !opts.alwaysStat;
    this._statsProp = this._isDirent ? "dirent" : "stats";
    this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent };
    this.parents = [this._exploreDir(root, 1)];
    this.reading = false;
    this.parent = void 0;
  }
  async _read(batch) {
    if (this.reading)
      return;
    this.reading = true;
    try {
      while (!this.destroyed && batch > 0) {
        const par = this.parent;
        const fil = par && par.files;
        if (fil && fil.length > 0) {
          const { path: path2, depth } = par;
          const slice = fil.splice(0, batch).map((dirent) => this._formatEntry(dirent, path2));
          const awaited = await Promise.all(slice);
          for (const entry of awaited) {
            if (!entry)
              continue;
            if (this.destroyed)
              return;
            const entryType = await this._getEntryType(entry);
            if (entryType === "directory" && this._directoryFilter(entry)) {
              if (depth <= this._maxDepth) {
                this.parents.push(this._exploreDir(entry.fullPath, depth + 1));
              }
              if (this._wantsDir) {
                this.push(entry);
                batch--;
              }
            } else if ((entryType === "file" || this._includeAsFile(entry)) && this._fileFilter(entry)) {
              if (this._wantsFile) {
                this.push(entry);
                batch--;
              }
            }
          }
        } else {
          const parent = this.parents.pop();
          if (!parent) {
            this.push(null);
            break;
          }
          this.parent = await parent;
          if (this.destroyed)
            return;
        }
      }
    } catch (error) {
      this.destroy(error);
    } finally {
      this.reading = false;
    }
  }
  async _exploreDir(path2, depth) {
    let files;
    try {
      files = await readdir(path2, this._rdOptions);
    } catch (error) {
      this._onError(error);
    }
    return { files, depth, path: path2 };
  }
  async _formatEntry(dirent, path2) {
    let entry;
    const basename = this._isDirent ? dirent.name : dirent;
    try {
      const fullPath = resolve(join(path2, basename));
      entry = { path: relative(this._root, fullPath), fullPath, basename };
      entry[this._statsProp] = this._isDirent ? dirent : await this._stat(fullPath);
    } catch (err) {
      this._onError(err);
      return;
    }
    return entry;
  }
  _onError(err) {
    if (isNormalFlowError(err) && !this.destroyed) {
      this.emit("warn", err);
    } else {
      this.destroy(err);
    }
  }
  async _getEntryType(entry) {
    if (!entry && this._statsProp in entry) {
      return "";
    }
    const stats = entry[this._statsProp];
    if (stats.isFile())
      return "file";
    if (stats.isDirectory())
      return "directory";
    if (stats && stats.isSymbolicLink()) {
      const full = entry.fullPath;
      try {
        const entryRealPath = await realpath(full);
        const entryRealPathStats = await lstat(entryRealPath);
        if (entryRealPathStats.isFile()) {
          return "file";
        }
        if (entryRealPathStats.isDirectory()) {
          const len = entryRealPath.length;
          if (full.startsWith(entryRealPath) && full.substr(len, 1) === sep) {
            const recursiveError = new Error(`Circular symlink detected: "${full}" points to "${entryRealPath}"`);
            recursiveError.code = RECURSIVE_ERROR_CODE;
            return this._onError(recursiveError);
          }
          return "directory";
        }
      } catch (error) {
        this._onError(error);
        return "";
      }
    }
  }
  _includeAsFile(entry) {
    const stats = entry && entry[this._statsProp];
    return stats && this._wantsEverything && !stats.isDirectory();
  }
}
function readdirp(root, options = {}) {
  let type2 = options.entryType || options.type;
  if (type2 === "both")
    type2 = EntryTypes.FILE_DIR_TYPE;
  if (type2)
    options.type = type2;
  if (!root) {
    throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
  } else if (typeof root !== "string") {
    throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
  } else if (type2 && !ALL_TYPES.includes(type2)) {
    throw new Error(`readdirp: Invalid type passed. Use one of ${ALL_TYPES.join(", ")}`);
  }
  options.root = root;
  return new ReaddirpStream(options);
}
const STR_DATA = "data";
const STR_END = "end";
const STR_CLOSE = "close";
const EMPTY_FN = () => {
};
const pl = process.platform;
const isWindows = pl === "win32";
const isMacos = pl === "darwin";
const isLinux = pl === "linux";
const isFreeBSD = pl === "freebsd";
const isIBMi = type() === "OS400";
const EVENTS = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error"
};
const EV = EVENTS;
const THROTTLE_MODE_WATCH = "watch";
const statMethods = { lstat: lstat$1, stat: stat$1 };
const KEY_LISTENERS = "listeners";
const KEY_ERR = "errHandlers";
const KEY_RAW = "rawEmitters";
const HANDLER_KEYS = [KEY_LISTENERS, KEY_ERR, KEY_RAW];
const binaryExtensions = /* @__PURE__ */ new Set([
  "3dm",
  "3ds",
  "3g2",
  "3gp",
  "7z",
  "a",
  "aac",
  "adp",
  "afdesign",
  "afphoto",
  "afpub",
  "ai",
  "aif",
  "aiff",
  "alz",
  "ape",
  "apk",
  "appimage",
  "ar",
  "arj",
  "asf",
  "au",
  "avi",
  "bak",
  "baml",
  "bh",
  "bin",
  "bk",
  "bmp",
  "btif",
  "bz2",
  "bzip2",
  "cab",
  "caf",
  "cgm",
  "class",
  "cmx",
  "cpio",
  "cr2",
  "cur",
  "dat",
  "dcm",
  "deb",
  "dex",
  "djvu",
  "dll",
  "dmg",
  "dng",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotm",
  "dra",
  "DS_Store",
  "dsk",
  "dts",
  "dtshd",
  "dvb",
  "dwg",
  "dxf",
  "ecelp4800",
  "ecelp7470",
  "ecelp9600",
  "egg",
  "eol",
  "eot",
  "epub",
  "exe",
  "f4v",
  "fbs",
  "fh",
  "fla",
  "flac",
  "flatpak",
  "fli",
  "flv",
  "fpx",
  "fst",
  "fvt",
  "g3",
  "gh",
  "gif",
  "graffle",
  "gz",
  "gzip",
  "h261",
  "h263",
  "h264",
  "icns",
  "ico",
  "ief",
  "img",
  "ipa",
  "iso",
  "jar",
  "jpeg",
  "jpg",
  "jpgv",
  "jpm",
  "jxr",
  "key",
  "ktx",
  "lha",
  "lib",
  "lvp",
  "lz",
  "lzh",
  "lzma",
  "lzo",
  "m3u",
  "m4a",
  "m4v",
  "mar",
  "mdi",
  "mht",
  "mid",
  "midi",
  "mj2",
  "mka",
  "mkv",
  "mmr",
  "mng",
  "mobi",
  "mov",
  "movie",
  "mp3",
  "mp4",
  "mp4a",
  "mpeg",
  "mpg",
  "mpga",
  "mxu",
  "nef",
  "npx",
  "numbers",
  "nupkg",
  "o",
  "odp",
  "ods",
  "odt",
  "oga",
  "ogg",
  "ogv",
  "otf",
  "ott",
  "pages",
  "pbm",
  "pcx",
  "pdb",
  "pdf",
  "pea",
  "pgm",
  "pic",
  "png",
  "pnm",
  "pot",
  "potm",
  "potx",
  "ppa",
  "ppam",
  "ppm",
  "pps",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "psd",
  "pya",
  "pyc",
  "pyo",
  "pyv",
  "qt",
  "rar",
  "ras",
  "raw",
  "resources",
  "rgb",
  "rip",
  "rlc",
  "rmf",
  "rmvb",
  "rpm",
  "rtf",
  "rz",
  "s3m",
  "s7z",
  "scpt",
  "sgi",
  "shar",
  "snap",
  "sil",
  "sketch",
  "slk",
  "smv",
  "snk",
  "so",
  "stl",
  "suo",
  "sub",
  "swf",
  "tar",
  "tbz",
  "tbz2",
  "tga",
  "tgz",
  "thmx",
  "tif",
  "tiff",
  "tlz",
  "ttc",
  "ttf",
  "txz",
  "udf",
  "uvh",
  "uvi",
  "uvm",
  "uvp",
  "uvs",
  "uvu",
  "viv",
  "vob",
  "war",
  "wav",
  "wax",
  "wbmp",
  "wdp",
  "weba",
  "webm",
  "webp",
  "whl",
  "wim",
  "wm",
  "wma",
  "wmv",
  "wmx",
  "woff",
  "woff2",
  "wrm",
  "wvx",
  "xbm",
  "xif",
  "xla",
  "xlam",
  "xls",
  "xlsb",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
  "xm",
  "xmind",
  "xpi",
  "xpm",
  "xwd",
  "xz",
  "z",
  "zip",
  "zipx"
]);
const isBinaryPath = (filePath) => binaryExtensions.has(sysPath.extname(filePath).slice(1).toLowerCase());
const foreach = (val, fn) => {
  if (val instanceof Set) {
    val.forEach(fn);
  } else {
    fn(val);
  }
};
const addAndConvert = (main, prop, item) => {
  let container = main[prop];
  if (!(container instanceof Set)) {
    main[prop] = container = /* @__PURE__ */ new Set([container]);
  }
  container.add(item);
};
const clearItem = (cont) => (key) => {
  const set = cont[key];
  if (set instanceof Set) {
    set.clear();
  } else {
    delete cont[key];
  }
};
const delFromSet = (main, prop, item) => {
  const container = main[prop];
  if (container instanceof Set) {
    container.delete(item);
  } else if (container === item) {
    delete main[prop];
  }
};
const isEmptySet = (val) => val instanceof Set ? val.size === 0 : !val;
const FsWatchInstances = /* @__PURE__ */ new Map();
function createFsWatchInstance(path2, options, listener, errHandler, emitRaw) {
  const handleEvent = (rawEvent, evPath) => {
    listener(path2);
    emitRaw(rawEvent, evPath, { watchedPath: path2 });
    if (evPath && path2 !== evPath) {
      fsWatchBroadcast(sysPath.resolve(path2, evPath), KEY_LISTENERS, sysPath.join(path2, evPath));
    }
  };
  try {
    return watch$1(path2, {
      persistent: options.persistent
    }, handleEvent);
  } catch (error) {
    errHandler(error);
    return void 0;
  }
}
const fsWatchBroadcast = (fullPath, listenerType, val1, val2, val3) => {
  const cont = FsWatchInstances.get(fullPath);
  if (!cont)
    return;
  foreach(cont[listenerType], (listener) => {
    listener(val1, val2, val3);
  });
};
const setFsWatchListener = (path2, fullPath, options, handlers) => {
  const { listener, errHandler, rawEmitter } = handlers;
  let cont = FsWatchInstances.get(fullPath);
  let watcher;
  if (!options.persistent) {
    watcher = createFsWatchInstance(path2, options, listener, errHandler, rawEmitter);
    if (!watcher)
      return;
    return watcher.close.bind(watcher);
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_ERR, errHandler);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    watcher = createFsWatchInstance(
      path2,
      options,
      fsWatchBroadcast.bind(null, fullPath, KEY_LISTENERS),
      errHandler,
      // no need to use broadcast here
      fsWatchBroadcast.bind(null, fullPath, KEY_RAW)
    );
    if (!watcher)
      return;
    watcher.on(EV.ERROR, async (error) => {
      const broadcastErr = fsWatchBroadcast.bind(null, fullPath, KEY_ERR);
      if (cont)
        cont.watcherUnusable = true;
      if (isWindows && error.code === "EPERM") {
        try {
          const fd = await open(path2, "r");
          await fd.close();
          broadcastErr(error);
        } catch (err) {
        }
      } else {
        broadcastErr(error);
      }
    });
    cont = {
      listeners: listener,
      errHandlers: errHandler,
      rawEmitters: rawEmitter,
      watcher
    };
    FsWatchInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_ERR, errHandler);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      cont.watcher.close();
      FsWatchInstances.delete(fullPath);
      HANDLER_KEYS.forEach(clearItem(cont));
      cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
const FsWatchFileInstances = /* @__PURE__ */ new Map();
const setFsWatchFileListener = (path2, fullPath, options, handlers) => {
  const { listener, rawEmitter } = handlers;
  let cont = FsWatchFileInstances.get(fullPath);
  const copts = cont && cont.options;
  if (copts && (copts.persistent < options.persistent || copts.interval > options.interval)) {
    unwatchFile(fullPath);
    cont = void 0;
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    cont = {
      listeners: listener,
      rawEmitters: rawEmitter,
      options,
      watcher: watchFile(fullPath, options, (curr, prev2) => {
        foreach(cont.rawEmitters, (rawEmitter2) => {
          rawEmitter2(EV.CHANGE, fullPath, { curr, prev: prev2 });
        });
        const currmtime = curr.mtimeMs;
        if (curr.size !== prev2.size || currmtime > prev2.mtimeMs || currmtime === 0) {
          foreach(cont.listeners, (listener2) => listener2(path2, curr));
        }
      })
    };
    FsWatchFileInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      FsWatchFileInstances.delete(fullPath);
      unwatchFile(fullPath);
      cont.options = cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
class NodeFsHandler {
  constructor(fsW) {
    this.fsw = fsW;
    this._boundHandleError = (error) => fsW._handleError(error);
  }
  /**
   * Watch file for changes with fs_watchFile or fs_watch.
   * @param path to file or dir
   * @param listener on fs change
   * @returns closer for the watcher instance
   */
  _watchWithNodeFs(path2, listener) {
    const opts = this.fsw.options;
    const directory = sysPath.dirname(path2);
    const basename = sysPath.basename(path2);
    const parent = this.fsw._getWatchedDir(directory);
    parent.add(basename);
    const absolutePath = sysPath.resolve(path2);
    const options = {
      persistent: opts.persistent
    };
    if (!listener)
      listener = EMPTY_FN;
    let closer;
    if (opts.usePolling) {
      const enableBin = opts.interval !== opts.binaryInterval;
      options.interval = enableBin && isBinaryPath(basename) ? opts.binaryInterval : opts.interval;
      closer = setFsWatchFileListener(path2, absolutePath, options, {
        listener,
        rawEmitter: this.fsw._emitRaw
      });
    } else {
      closer = setFsWatchListener(path2, absolutePath, options, {
        listener,
        errHandler: this._boundHandleError,
        rawEmitter: this.fsw._emitRaw
      });
    }
    return closer;
  }
  /**
   * Watch a file and emit add event if warranted.
   * @returns closer for the watcher instance
   */
  _handleFile(file, stats, initialAdd) {
    if (this.fsw.closed) {
      return;
    }
    const dirname = sysPath.dirname(file);
    const basename = sysPath.basename(file);
    const parent = this.fsw._getWatchedDir(dirname);
    let prevStats = stats;
    if (parent.has(basename))
      return;
    const listener = async (path2, newStats) => {
      if (!this.fsw._throttle(THROTTLE_MODE_WATCH, file, 5))
        return;
      if (!newStats || newStats.mtimeMs === 0) {
        try {
          const newStats2 = await stat$1(file);
          if (this.fsw.closed)
            return;
          const at = newStats2.atimeMs;
          const mt = newStats2.mtimeMs;
          if (!at || at <= mt || mt !== prevStats.mtimeMs) {
            this.fsw._emit(EV.CHANGE, file, newStats2);
          }
          if ((isMacos || isLinux || isFreeBSD) && prevStats.ino !== newStats2.ino) {
            this.fsw._closeFile(path2);
            prevStats = newStats2;
            const closer2 = this._watchWithNodeFs(file, listener);
            if (closer2)
              this.fsw._addPathCloser(path2, closer2);
          } else {
            prevStats = newStats2;
          }
        } catch (error) {
          this.fsw._remove(dirname, basename);
        }
      } else if (parent.has(basename)) {
        const at = newStats.atimeMs;
        const mt = newStats.mtimeMs;
        if (!at || at <= mt || mt !== prevStats.mtimeMs) {
          this.fsw._emit(EV.CHANGE, file, newStats);
        }
        prevStats = newStats;
      }
    };
    const closer = this._watchWithNodeFs(file, listener);
    if (!(initialAdd && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(file)) {
      if (!this.fsw._throttle(EV.ADD, file, 0))
        return;
      this.fsw._emit(EV.ADD, file, stats);
    }
    return closer;
  }
  /**
   * Handle symlinks encountered while reading a dir.
   * @param entry returned by readdirp
   * @param directory path of dir being read
   * @param path of this item
   * @param item basename of this item
   * @returns true if no more processing is needed for this entry.
   */
  async _handleSymlink(entry, directory, path2, item) {
    if (this.fsw.closed) {
      return;
    }
    const full = entry.fullPath;
    const dir = this.fsw._getWatchedDir(directory);
    if (!this.fsw.options.followSymlinks) {
      this.fsw._incrReadyCount();
      let linkPath;
      try {
        linkPath = await realpath$1(path2);
      } catch (e) {
        this.fsw._emitReady();
        return true;
      }
      if (this.fsw.closed)
        return;
      if (dir.has(item)) {
        if (this.fsw._symlinkPaths.get(full) !== linkPath) {
          this.fsw._symlinkPaths.set(full, linkPath);
          this.fsw._emit(EV.CHANGE, path2, entry.stats);
        }
      } else {
        dir.add(item);
        this.fsw._symlinkPaths.set(full, linkPath);
        this.fsw._emit(EV.ADD, path2, entry.stats);
      }
      this.fsw._emitReady();
      return true;
    }
    if (this.fsw._symlinkPaths.has(full)) {
      return true;
    }
    this.fsw._symlinkPaths.set(full, true);
  }
  _handleRead(directory, initialAdd, wh, target, dir, depth, throttler) {
    directory = sysPath.join(directory, "");
    throttler = this.fsw._throttle("readdir", directory, 1e3);
    if (!throttler)
      return;
    const previous = this.fsw._getWatchedDir(wh.path);
    const current = /* @__PURE__ */ new Set();
    let stream = this.fsw._readdirp(directory, {
      fileFilter: (entry) => wh.filterPath(entry),
      directoryFilter: (entry) => wh.filterDir(entry)
    });
    if (!stream)
      return;
    stream.on(STR_DATA, async (entry) => {
      if (this.fsw.closed) {
        stream = void 0;
        return;
      }
      const item = entry.path;
      let path2 = sysPath.join(directory, item);
      current.add(item);
      if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path2, item)) {
        return;
      }
      if (this.fsw.closed) {
        stream = void 0;
        return;
      }
      if (item === target || !target && !previous.has(item)) {
        this.fsw._incrReadyCount();
        path2 = sysPath.join(dir, sysPath.relative(dir, path2));
        this._addToNodeFs(path2, initialAdd, wh, depth + 1);
      }
    }).on(EV.ERROR, this._boundHandleError);
    return new Promise((resolve2, reject) => {
      if (!stream)
        return reject();
      stream.once(STR_END, () => {
        if (this.fsw.closed) {
          stream = void 0;
          return;
        }
        const wasThrottled = throttler ? throttler.clear() : false;
        resolve2(void 0);
        previous.getChildren().filter((item) => {
          return item !== directory && !current.has(item);
        }).forEach((item) => {
          this.fsw._remove(directory, item);
        });
        stream = void 0;
        if (wasThrottled)
          this._handleRead(directory, false, wh, target, dir, depth, throttler);
      });
    });
  }
  /**
   * Read directory to add / remove files from `@watched` list and re-read it on change.
   * @param dir fs path
   * @param stats
   * @param initialAdd
   * @param depth relative to user-supplied path
   * @param target child path targeted for watch
   * @param wh Common watch helpers for this path
   * @param realpath
   * @returns closer for the watcher instance.
   */
  async _handleDir(dir, stats, initialAdd, depth, target, wh, realpath2) {
    const parentDir = this.fsw._getWatchedDir(sysPath.dirname(dir));
    const tracked = parentDir.has(sysPath.basename(dir));
    if (!(initialAdd && this.fsw.options.ignoreInitial) && !target && !tracked) {
      this.fsw._emit(EV.ADD_DIR, dir, stats);
    }
    parentDir.add(sysPath.basename(dir));
    this.fsw._getWatchedDir(dir);
    let throttler;
    let closer;
    const oDepth = this.fsw.options.depth;
    if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath2)) {
      if (!target) {
        await this._handleRead(dir, initialAdd, wh, target, dir, depth, throttler);
        if (this.fsw.closed)
          return;
      }
      closer = this._watchWithNodeFs(dir, (dirPath, stats2) => {
        if (stats2 && stats2.mtimeMs === 0)
          return;
        this._handleRead(dirPath, false, wh, target, dir, depth, throttler);
      });
    }
    return closer;
  }
  /**
   * Handle added file, directory, or glob pattern.
   * Delegates call to _handleFile / _handleDir after checks.
   * @param path to file or ir
   * @param initialAdd was the file added at watch instantiation?
   * @param priorWh depth relative to user-supplied path
   * @param depth Child path actually targeted for watch
   * @param target Child path actually targeted for watch
   */
  async _addToNodeFs(path2, initialAdd, priorWh, depth, target) {
    const ready = this.fsw._emitReady;
    if (this.fsw._isIgnored(path2) || this.fsw.closed) {
      ready();
      return false;
    }
    const wh = this.fsw._getWatchHelpers(path2);
    if (priorWh) {
      wh.filterPath = (entry) => priorWh.filterPath(entry);
      wh.filterDir = (entry) => priorWh.filterDir(entry);
    }
    try {
      const stats = await statMethods[wh.statMethod](wh.watchPath);
      if (this.fsw.closed)
        return;
      if (this.fsw._isIgnored(wh.watchPath, stats)) {
        ready();
        return false;
      }
      const follow = this.fsw.options.followSymlinks;
      let closer;
      if (stats.isDirectory()) {
        const absPath = sysPath.resolve(path2);
        const targetPath = follow ? await realpath$1(path2) : path2;
        if (this.fsw.closed)
          return;
        closer = await this._handleDir(wh.watchPath, stats, initialAdd, depth, target, wh, targetPath);
        if (this.fsw.closed)
          return;
        if (absPath !== targetPath && targetPath !== void 0) {
          this.fsw._symlinkPaths.set(absPath, targetPath);
        }
      } else if (stats.isSymbolicLink()) {
        const targetPath = follow ? await realpath$1(path2) : path2;
        if (this.fsw.closed)
          return;
        const parent = sysPath.dirname(wh.watchPath);
        this.fsw._getWatchedDir(parent).add(wh.watchPath);
        this.fsw._emit(EV.ADD, wh.watchPath, stats);
        closer = await this._handleDir(parent, stats, initialAdd, depth, path2, wh, targetPath);
        if (this.fsw.closed)
          return;
        if (targetPath !== void 0) {
          this.fsw._symlinkPaths.set(sysPath.resolve(path2), targetPath);
        }
      } else {
        closer = this._handleFile(wh.watchPath, stats, initialAdd);
      }
      ready();
      if (closer)
        this.fsw._addPathCloser(path2, closer);
      return false;
    } catch (error) {
      if (this.fsw._handleError(error)) {
        ready();
        return path2;
      }
    }
  }
}
/*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) */
const SLASH = "/";
const SLASH_SLASH = "//";
const ONE_DOT = ".";
const TWO_DOTS = "..";
const STRING_TYPE = "string";
const BACK_SLASH_RE = /\\/g;
const DOUBLE_SLASH_RE = /\/\//;
const DOT_RE = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/;
const REPLACER_RE = /^\.[/\\]/;
function arrify(item) {
  return Array.isArray(item) ? item : [item];
}
const isMatcherObject = (matcher) => typeof matcher === "object" && matcher !== null && !(matcher instanceof RegExp);
function createPattern(matcher) {
  if (typeof matcher === "function")
    return matcher;
  if (typeof matcher === "string")
    return (string) => matcher === string;
  if (matcher instanceof RegExp)
    return (string) => matcher.test(string);
  if (typeof matcher === "object" && matcher !== null) {
    return (string) => {
      if (matcher.path === string)
        return true;
      if (matcher.recursive) {
        const relative2 = sysPath.relative(matcher.path, string);
        if (!relative2) {
          return false;
        }
        return !relative2.startsWith("..") && !sysPath.isAbsolute(relative2);
      }
      return false;
    };
  }
  return () => false;
}
function normalizePath(path2) {
  if (typeof path2 !== "string")
    throw new Error("string expected");
  path2 = sysPath.normalize(path2);
  path2 = path2.replace(/\\/g, "/");
  let prepend = false;
  if (path2.startsWith("//"))
    prepend = true;
  const DOUBLE_SLASH_RE2 = /\/\//;
  while (path2.match(DOUBLE_SLASH_RE2))
    path2 = path2.replace(DOUBLE_SLASH_RE2, "/");
  if (prepend)
    path2 = "/" + path2;
  return path2;
}
function matchPatterns(patterns, testString, stats) {
  const path2 = normalizePath(testString);
  for (let index = 0; index < patterns.length; index++) {
    const pattern = patterns[index];
    if (pattern(path2, stats)) {
      return true;
    }
  }
  return false;
}
function anymatch(matchers, testString) {
  if (matchers == null) {
    throw new TypeError("anymatch: specify first argument");
  }
  const matchersArray = arrify(matchers);
  const patterns = matchersArray.map((matcher) => createPattern(matcher));
  {
    return (testString2, stats) => {
      return matchPatterns(patterns, testString2, stats);
    };
  }
}
const unifyPaths = (paths_) => {
  const paths = arrify(paths_).flat();
  if (!paths.every((p) => typeof p === STRING_TYPE)) {
    throw new TypeError(`Non-string provided as watch path: ${paths}`);
  }
  return paths.map(normalizePathToUnix);
};
const toUnix = (string) => {
  let str = string.replace(BACK_SLASH_RE, SLASH);
  let prepend = false;
  if (str.startsWith(SLASH_SLASH)) {
    prepend = true;
  }
  while (str.match(DOUBLE_SLASH_RE)) {
    str = str.replace(DOUBLE_SLASH_RE, SLASH);
  }
  if (prepend) {
    str = SLASH + str;
  }
  return str;
};
const normalizePathToUnix = (path2) => toUnix(sysPath.normalize(toUnix(path2)));
const normalizeIgnored = (cwd = "") => (path2) => {
  if (typeof path2 === "string") {
    return normalizePathToUnix(sysPath.isAbsolute(path2) ? path2 : sysPath.join(cwd, path2));
  } else {
    return path2;
  }
};
const getAbsolutePath = (path2, cwd) => {
  if (sysPath.isAbsolute(path2)) {
    return path2;
  }
  return sysPath.join(cwd, path2);
};
const EMPTY_SET = Object.freeze(/* @__PURE__ */ new Set());
class DirEntry {
  constructor(dir, removeWatcher) {
    this.path = dir;
    this._removeWatcher = removeWatcher;
    this.items = /* @__PURE__ */ new Set();
  }
  add(item) {
    const { items } = this;
    if (!items)
      return;
    if (item !== ONE_DOT && item !== TWO_DOTS)
      items.add(item);
  }
  async remove(item) {
    const { items } = this;
    if (!items)
      return;
    items.delete(item);
    if (items.size > 0)
      return;
    const dir = this.path;
    try {
      await readdir$1(dir);
    } catch (err) {
      if (this._removeWatcher) {
        this._removeWatcher(sysPath.dirname(dir), sysPath.basename(dir));
      }
    }
  }
  has(item) {
    const { items } = this;
    if (!items)
      return;
    return items.has(item);
  }
  getChildren() {
    const { items } = this;
    if (!items)
      return [];
    return [...items.values()];
  }
  dispose() {
    this.items.clear();
    this.path = "";
    this._removeWatcher = EMPTY_FN;
    this.items = EMPTY_SET;
    Object.freeze(this);
  }
}
const STAT_METHOD_F = "stat";
const STAT_METHOD_L = "lstat";
class WatchHelper {
  constructor(path2, follow, fsw) {
    this.fsw = fsw;
    const watchPath = path2;
    this.path = path2 = path2.replace(REPLACER_RE, "");
    this.watchPath = watchPath;
    this.fullWatchPath = sysPath.resolve(watchPath);
    this.dirParts = [];
    this.dirParts.forEach((parts) => {
      if (parts.length > 1)
        parts.pop();
    });
    this.followSymlinks = follow;
    this.statMethod = follow ? STAT_METHOD_F : STAT_METHOD_L;
  }
  entryPath(entry) {
    return sysPath.join(this.watchPath, sysPath.relative(this.watchPath, entry.fullPath));
  }
  filterPath(entry) {
    const { stats } = entry;
    if (stats && stats.isSymbolicLink())
      return this.filterDir(entry);
    const resolvedPath = this.entryPath(entry);
    return this.fsw._isntIgnored(resolvedPath, stats) && this.fsw._hasReadPermissions(stats);
  }
  filterDir(entry) {
    return this.fsw._isntIgnored(this.entryPath(entry), entry.stats);
  }
}
class FSWatcher extends EventEmitter$1 {
  // Not indenting methods for history sake; for now.
  constructor(_opts = {}) {
    super();
    this.closed = false;
    this._closers = /* @__PURE__ */ new Map();
    this._ignoredPaths = /* @__PURE__ */ new Set();
    this._throttled = /* @__PURE__ */ new Map();
    this._streams = /* @__PURE__ */ new Set();
    this._symlinkPaths = /* @__PURE__ */ new Map();
    this._watched = /* @__PURE__ */ new Map();
    this._pendingWrites = /* @__PURE__ */ new Map();
    this._pendingUnlinks = /* @__PURE__ */ new Map();
    this._readyCount = 0;
    this._readyEmitted = false;
    const awf = _opts.awaitWriteFinish;
    const DEF_AWF = { stabilityThreshold: 2e3, pollInterval: 100 };
    const opts = {
      // Defaults
      persistent: true,
      ignoreInitial: false,
      ignorePermissionErrors: false,
      interval: 100,
      binaryInterval: 300,
      followSymlinks: true,
      usePolling: false,
      // useAsync: false,
      atomic: true,
      // NOTE: overwritten later (depends on usePolling)
      ..._opts,
      // Change format
      ignored: _opts.ignored ? arrify(_opts.ignored) : arrify([]),
      awaitWriteFinish: awf === true ? DEF_AWF : typeof awf === "object" ? { ...DEF_AWF, ...awf } : false
    };
    if (isIBMi)
      opts.usePolling = true;
    if (opts.atomic === void 0)
      opts.atomic = !opts.usePolling;
    const envPoll = process.env.CHOKIDAR_USEPOLLING;
    if (envPoll !== void 0) {
      const envLower = envPoll.toLowerCase();
      if (envLower === "false" || envLower === "0")
        opts.usePolling = false;
      else if (envLower === "true" || envLower === "1")
        opts.usePolling = true;
      else
        opts.usePolling = !!envLower;
    }
    const envInterval = process.env.CHOKIDAR_INTERVAL;
    if (envInterval)
      opts.interval = Number.parseInt(envInterval, 10);
    let readyCalls = 0;
    this._emitReady = () => {
      readyCalls++;
      if (readyCalls >= this._readyCount) {
        this._emitReady = EMPTY_FN;
        this._readyEmitted = true;
        process.nextTick(() => this.emit(EVENTS.READY));
      }
    };
    this._emitRaw = (...args) => this.emit(EVENTS.RAW, ...args);
    this._boundRemove = this._remove.bind(this);
    this.options = opts;
    this._nodeFsHandler = new NodeFsHandler(this);
    Object.freeze(opts);
  }
  _addIgnoredPath(matcher) {
    if (isMatcherObject(matcher)) {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher.path && ignored.recursive === matcher.recursive) {
          return;
        }
      }
    }
    this._ignoredPaths.add(matcher);
  }
  _removeIgnoredPath(matcher) {
    this._ignoredPaths.delete(matcher);
    if (typeof matcher === "string") {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher) {
          this._ignoredPaths.delete(ignored);
        }
      }
    }
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(paths_, _origAdd, _internal) {
    const { cwd } = this.options;
    this.closed = false;
    this._closePromise = void 0;
    let paths = unifyPaths(paths_);
    if (cwd) {
      paths = paths.map((path2) => {
        const absPath = getAbsolutePath(path2, cwd);
        return absPath;
      });
    }
    paths.forEach((path2) => {
      this._removeIgnoredPath(path2);
    });
    this._userIgnored = void 0;
    if (!this._readyCount)
      this._readyCount = 0;
    this._readyCount += paths.length;
    Promise.all(paths.map(async (path2) => {
      const res = await this._nodeFsHandler._addToNodeFs(path2, !_internal, void 0, 0, _origAdd);
      if (res)
        this._emitReady();
      return res;
    })).then((results) => {
      if (this.closed)
        return;
      results.forEach((item) => {
        if (item)
          this.add(sysPath.dirname(item), sysPath.basename(_origAdd || item));
      });
    });
    return this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(paths_) {
    if (this.closed)
      return this;
    const paths = unifyPaths(paths_);
    const { cwd } = this.options;
    paths.forEach((path2) => {
      if (!sysPath.isAbsolute(path2) && !this._closers.has(path2)) {
        if (cwd)
          path2 = sysPath.join(cwd, path2);
        path2 = sysPath.resolve(path2);
      }
      this._closePath(path2);
      this._addIgnoredPath(path2);
      if (this._watched.has(path2)) {
        this._addIgnoredPath({
          path: path2,
          recursive: true
        });
      }
      this._userIgnored = void 0;
    });
    return this;
  }
  /**
   * Close watchers and remove all listeners from watched paths.
   */
  close() {
    if (this._closePromise) {
      return this._closePromise;
    }
    this.closed = true;
    this.removeAllListeners();
    const closers = [];
    this._closers.forEach((closerList) => closerList.forEach((closer) => {
      const promise = closer();
      if (promise instanceof Promise)
        closers.push(promise);
    }));
    this._streams.forEach((stream) => stream.destroy());
    this._userIgnored = void 0;
    this._readyCount = 0;
    this._readyEmitted = false;
    this._watched.forEach((dirent) => dirent.dispose());
    this._closers.clear();
    this._watched.clear();
    this._streams.clear();
    this._symlinkPaths.clear();
    this._throttled.clear();
    this._closePromise = closers.length ? Promise.all(closers).then(() => void 0) : Promise.resolve();
    return this._closePromise;
  }
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched() {
    const watchList = {};
    this._watched.forEach((entry, dir) => {
      const key = this.options.cwd ? sysPath.relative(this.options.cwd, dir) : dir;
      const index = key || ONE_DOT;
      watchList[index] = entry.getChildren().sort();
    });
    return watchList;
  }
  emitWithAll(event, args) {
    this.emit(event, ...args);
    if (event !== EVENTS.ERROR)
      this.emit(EVENTS.ALL, event, ...args);
  }
  // Common helpers
  // --------------
  /**
   * Normalize and emit events.
   * Calling _emit DOES NOT MEAN emit() would be called!
   * @param event Type of event
   * @param path File or directory path
   * @param stats arguments to be passed with event
   * @returns the error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  async _emit(event, path2, stats) {
    if (this.closed)
      return;
    const opts = this.options;
    if (isWindows)
      path2 = sysPath.normalize(path2);
    if (opts.cwd)
      path2 = sysPath.relative(opts.cwd, path2);
    const args = [path2];
    if (stats != null)
      args.push(stats);
    const awf = opts.awaitWriteFinish;
    let pw;
    if (awf && (pw = this._pendingWrites.get(path2))) {
      pw.lastChange = /* @__PURE__ */ new Date();
      return this;
    }
    if (opts.atomic) {
      if (event === EVENTS.UNLINK) {
        this._pendingUnlinks.set(path2, [event, ...args]);
        setTimeout(() => {
          this._pendingUnlinks.forEach((entry, path22) => {
            this.emit(...entry);
            this.emit(EVENTS.ALL, ...entry);
            this._pendingUnlinks.delete(path22);
          });
        }, typeof opts.atomic === "number" ? opts.atomic : 100);
        return this;
      }
      if (event === EVENTS.ADD && this._pendingUnlinks.has(path2)) {
        event = EVENTS.CHANGE;
        this._pendingUnlinks.delete(path2);
      }
    }
    if (awf && (event === EVENTS.ADD || event === EVENTS.CHANGE) && this._readyEmitted) {
      const awfEmit = (err, stats2) => {
        if (err) {
          event = EVENTS.ERROR;
          args[0] = err;
          this.emitWithAll(event, args);
        } else if (stats2) {
          if (args.length > 1) {
            args[1] = stats2;
          } else {
            args.push(stats2);
          }
          this.emitWithAll(event, args);
        }
      };
      this._awaitWriteFinish(path2, awf.stabilityThreshold, event, awfEmit);
      return this;
    }
    if (event === EVENTS.CHANGE) {
      const isThrottled = !this._throttle(EVENTS.CHANGE, path2, 50);
      if (isThrottled)
        return this;
    }
    if (opts.alwaysStat && stats === void 0 && (event === EVENTS.ADD || event === EVENTS.ADD_DIR || event === EVENTS.CHANGE)) {
      const fullPath = opts.cwd ? sysPath.join(opts.cwd, path2) : path2;
      let stats2;
      try {
        stats2 = await stat$1(fullPath);
      } catch (err) {
      }
      if (!stats2 || this.closed)
        return;
      args.push(stats2);
    }
    this.emitWithAll(event, args);
    return this;
  }
  /**
   * Common handler for errors
   * @returns The error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  _handleError(error) {
    const code = error && error.code;
    if (error && code !== "ENOENT" && code !== "ENOTDIR" && (!this.options.ignorePermissionErrors || code !== "EPERM" && code !== "EACCES")) {
      this.emit(EVENTS.ERROR, error);
    }
    return error || this.closed;
  }
  /**
   * Helper utility for throttling
   * @param actionType type being throttled
   * @param path being acted upon
   * @param timeout duration of time to suppress duplicate actions
   * @returns tracking object or false if action should be suppressed
   */
  _throttle(actionType, path2, timeout) {
    if (!this._throttled.has(actionType)) {
      this._throttled.set(actionType, /* @__PURE__ */ new Map());
    }
    const action = this._throttled.get(actionType);
    if (!action)
      throw new Error("invalid throttle");
    const actionPath = action.get(path2);
    if (actionPath) {
      actionPath.count++;
      return false;
    }
    let timeoutObject;
    const clear = () => {
      const item = action.get(path2);
      const count = item ? item.count : 0;
      action.delete(path2);
      clearTimeout(timeoutObject);
      if (item)
        clearTimeout(item.timeoutObject);
      return count;
    };
    timeoutObject = setTimeout(clear, timeout);
    const thr = { timeoutObject, clear, count: 0 };
    action.set(path2, thr);
    return thr;
  }
  _incrReadyCount() {
    return this._readyCount++;
  }
  /**
   * Awaits write operation to finish.
   * Polls a newly created file for size variations. When files size does not change for 'threshold' milliseconds calls callback.
   * @param path being acted upon
   * @param threshold Time in milliseconds a file size must be fixed before acknowledging write OP is finished
   * @param event
   * @param awfEmit Callback to be called when ready for event to be emitted.
   */
  _awaitWriteFinish(path2, threshold, event, awfEmit) {
    const awf = this.options.awaitWriteFinish;
    if (typeof awf !== "object")
      return;
    const pollInterval = awf.pollInterval;
    let timeoutHandler;
    let fullPath = path2;
    if (this.options.cwd && !sysPath.isAbsolute(path2)) {
      fullPath = sysPath.join(this.options.cwd, path2);
    }
    const now2 = /* @__PURE__ */ new Date();
    const writes = this._pendingWrites;
    function awaitWriteFinishFn(prevStat) {
      stat$2(fullPath, (err, curStat) => {
        if (err || !writes.has(path2)) {
          if (err && err.code !== "ENOENT")
            awfEmit(err);
          return;
        }
        const now22 = Number(/* @__PURE__ */ new Date());
        if (prevStat && curStat.size !== prevStat.size) {
          writes.get(path2).lastChange = now22;
        }
        const pw = writes.get(path2);
        const df = now22 - pw.lastChange;
        if (df >= threshold) {
          writes.delete(path2);
          awfEmit(void 0, curStat);
        } else {
          timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval, curStat);
        }
      });
    }
    if (!writes.has(path2)) {
      writes.set(path2, {
        lastChange: now2,
        cancelWait: () => {
          writes.delete(path2);
          clearTimeout(timeoutHandler);
          return event;
        }
      });
      timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval);
    }
  }
  /**
   * Determines whether user has asked to ignore this path.
   */
  _isIgnored(path2, stats) {
    if (this.options.atomic && DOT_RE.test(path2))
      return true;
    if (!this._userIgnored) {
      const { cwd } = this.options;
      const ign = this.options.ignored;
      const ignored = (ign || []).map(normalizeIgnored(cwd));
      const ignoredPaths = [...this._ignoredPaths];
      const list = [...ignoredPaths.map(normalizeIgnored(cwd)), ...ignored];
      this._userIgnored = anymatch(list);
    }
    return this._userIgnored(path2, stats);
  }
  _isntIgnored(path2, stat2) {
    return !this._isIgnored(path2, stat2);
  }
  /**
   * Provides a set of common helpers and properties relating to symlink handling.
   * @param path file or directory pattern being watched
   */
  _getWatchHelpers(path2) {
    return new WatchHelper(path2, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(directory) {
    const dir = sysPath.resolve(directory);
    if (!this._watched.has(dir))
      this._watched.set(dir, new DirEntry(dir, this._boundRemove));
    return this._watched.get(dir);
  }
  // File helpers
  // ------------
  /**
   * Check for read permissions: https://stackoverflow.com/a/11781404/1358405
   */
  _hasReadPermissions(stats) {
    if (this.options.ignorePermissionErrors)
      return true;
    return Boolean(Number(stats.mode) & 256);
  }
  /**
   * Handles emitting unlink events for
   * files and directories, and via recursion, for
   * files and directories within directories that are unlinked
   * @param directory within which the following item is located
   * @param item      base path of item/directory
   */
  _remove(directory, item, isDirectory) {
    const path2 = sysPath.join(directory, item);
    const fullPath = sysPath.resolve(path2);
    isDirectory = isDirectory != null ? isDirectory : this._watched.has(path2) || this._watched.has(fullPath);
    if (!this._throttle("remove", path2, 100))
      return;
    if (!isDirectory && this._watched.size === 1) {
      this.add(directory, item, true);
    }
    const wp = this._getWatchedDir(path2);
    const nestedDirectoryChildren = wp.getChildren();
    nestedDirectoryChildren.forEach((nested) => this._remove(path2, nested));
    const parent = this._getWatchedDir(directory);
    const wasTracked = parent.has(item);
    parent.remove(item);
    if (this._symlinkPaths.has(fullPath)) {
      this._symlinkPaths.delete(fullPath);
    }
    let relPath = path2;
    if (this.options.cwd)
      relPath = sysPath.relative(this.options.cwd, path2);
    if (this.options.awaitWriteFinish && this._pendingWrites.has(relPath)) {
      const event = this._pendingWrites.get(relPath).cancelWait();
      if (event === EVENTS.ADD)
        return;
    }
    this._watched.delete(path2);
    this._watched.delete(fullPath);
    const eventName = isDirectory ? EVENTS.UNLINK_DIR : EVENTS.UNLINK;
    if (wasTracked && !this._isIgnored(path2))
      this._emit(eventName, path2);
    this._closePath(path2);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(path2) {
    this._closeFile(path2);
    const dir = sysPath.dirname(path2);
    this._getWatchedDir(dir).remove(sysPath.basename(path2));
  }
  /**
   * Closes only file-specific watchers
   */
  _closeFile(path2) {
    const closers = this._closers.get(path2);
    if (!closers)
      return;
    closers.forEach((closer) => closer());
    this._closers.delete(path2);
  }
  _addPathCloser(path2, closer) {
    if (!closer)
      return;
    let list = this._closers.get(path2);
    if (!list) {
      list = [];
      this._closers.set(path2, list);
    }
    list.push(closer);
  }
  _readdirp(root, opts) {
    if (this.closed)
      return;
    const options = { type: EVENTS.ALL, alwaysStat: true, lstat: true, ...opts, depth: 0 };
    let stream = readdirp(root, options);
    this._streams.add(stream);
    stream.once(STR_CLOSE, () => {
      stream = void 0;
    });
    stream.once(STR_END, () => {
      if (stream) {
        this._streams.delete(stream);
        stream = void 0;
      }
    });
    return stream;
  }
}
function watch(paths, options = {}) {
  const watcher = new FSWatcher(options);
  watcher.add(paths);
  return watcher;
}
const chokidar = { watch, FSWatcher };
class GitService {
  constructor() {
    __publicField(this, "git", null);
    __publicField(this, "watcher", null);
    __publicField(this, "workingDirectory", "");
    __publicField(this, "debounceTimeout", null);
  }
  initializeWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }
    this.watcher = chokidar.watch(this.workingDirectory, {
      ignored: [
        /(^|[\/\\])\../,
        // 忽略隐藏文件
        "**/node_modules/**",
        "**/.git/**"
      ],
      persistent: true
    });
    this.watcher.on("add", () => this.notifyChanges()).on("change", () => this.notifyChanges()).on("unlink", () => this.notifyChanges());
    console.log(`Watching for file changes in ${this.workingDirectory}`);
  }
  async notifyChanges() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(async () => {
      const status = await this.getStatus();
      ipcMain.emit("git:status-changed", status);
    }, 300);
  }
  dispose() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
  async getStatus() {
    if (!this.git) {
      return {
        success: false,
        error: "Git not initialized"
      };
    }
    try {
      const status = await this.git.status([
        "--untracked-files=all",
        "--ignored=no",
        "--porcelain=v1"
      ]);
      const isClean = status.isClean();
      return {
        success: true,
        data: {
          current: status.current || "",
          tracking: status.tracking || "",
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          not_added: status.not_added,
          created: status.created,
          modified: status.modified,
          deleted: status.deleted,
          conflicted: status.conflicted,
          files: status.files,
          isClean,
          detached: status.detached
        }
      };
    } catch (error) {
      console.error("Git status error:", error);
      return {
        success: false,
        error: "Failed to get status"
      };
    }
  }
  async initialize(workingDirectory) {
    try {
      this.git = esm_default(workingDirectory);
      const isRepo = await this.git.checkIsRepo();
      this.workingDirectory = workingDirectory;
      this.initializeWatcher();
      if (!isRepo) {
        return {
          success: false,
          error: "Not a git repository"
        };
      }
      const status = await this.git.status([
        "--untracked-files=all",
        "--ignored=no",
        "--porcelain=v1"
      ]);
      const isClean = status.isClean();
      return {
        success: true,
        data: {
          current: status.current || "",
          tracking: status.tracking || "",
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          not_added: status.not_added,
          created: status.created,
          modified: status.modified,
          deleted: status.deleted,
          conflicted: status.conflicted,
          files: status.files,
          isClean,
          detached: status.detached
        }
      };
    } catch (error) {
      console.error("Git initialization error:", error);
      return {
        success: false,
        error: "Failed to initialize git"
      };
    }
  }
  async checkIsRepo(workingDirectory) {
    try {
      const tempGit = esm_default(workingDirectory);
      return await tempGit.checkIsRepo();
    } catch (error) {
      console.error("Failed to check git repository:", error);
      return false;
    }
  }
  async initRepo(workingDirectory) {
    try {
      const git = esm_default(workingDirectory);
      await git.init();
      this.git = git;
      return true;
    } catch (error) {
      console.error("Failed to initialize repository:", error);
      return false;
    }
  }
  async add(files) {
    if (!this.git) throw new Error("Git not initialized");
    await this.git.add(files);
    await this.notifyChanges();
  }
  async stage(files) {
    if (!this.git) throw new Error("Git not initialized");
    return await this.git.add(files);
  }
  async unstage(files) {
    if (!this.git) throw new Error("Git not initialized");
    return await this.git.reset(["--", ...files]);
  }
  async commit(message) {
    if (!this.git) throw new Error("Git not initialized");
    return await this.git.commit(message);
  }
  async stageAll() {
    if (!this.git) throw new Error("Git not initialized");
    await this.git.add(".");
  }
  async unstageAll() {
    if (!this.git) {
      return { success: false, error: "Git not initialized" };
    }
    try {
      const hasCommits = await this.hasCommits();
      if (hasCommits) {
        await this.git.reset(["HEAD"]);
      } else {
        await this.git.reset();
      }
      return { success: true };
    } catch (error) {
      console.error("Git unstage all error:", error);
      return { success: false, error: "Failed to unstage all changes" };
    }
  }
  // 添加辅助方法检查是否有提交
  async hasCommits() {
    try {
      if (!this.git) return false;
      const log = await this.git.log(["--oneline"]);
      return log.total > 0;
    } catch (error) {
      return false;
    }
  }
  async discardAll() {
    if (!this.git) throw new Error("Git not initialized");
    await this.git.checkout(["--", "."]);
  }
  async getLog() {
    if (!this.git) {
      return { success: false, error: "Git not initialized" };
    }
    try {
      const logResult = await this.git.log([]);
      const commits = logResult.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        refs: commit.refs,
        body: commit.body,
        author_name: commit.author_name,
        author_email: commit.author_email
      }));
      console.log("Commits:", logResult);
      return {
        success: true,
        data: { commits }
      };
    } catch (error) {
      console.error("Git log error:", error);
      return {
        success: false,
        error: "Failed to get commit history"
      };
    }
  }
}
const gitService = new GitService();
function registerGitHandlers() {
  ipcMain.handle("git:initialize", async (_event, workingDirectory) => {
    return await gitService.initialize(workingDirectory);
  });
  ipcMain.handle("git:checkIsRepo", async (_event, workingDirectory) => {
    return await gitService.checkIsRepo(workingDirectory);
  });
  ipcMain.handle("git:init", async (_event, workingDirectory) => {
    return await gitService.initRepo(workingDirectory);
  });
  ipcMain.handle("git:status", async () => {
    return await gitService.getStatus();
  });
  ipcMain.handle("git:add", async (_event, files) => {
    return await gitService.add(files);
  });
  ipcMain.handle("git:stage", async (_event, files) => {
    return await gitService.stage(files);
  });
  ipcMain.handle("git:unstage", async (_event, files) => {
    return await gitService.unstage(files);
  });
  ipcMain.handle("git:commit", async (_event, message) => {
    return await gitService.commit(message);
  });
  ipcMain.handle("git:stageAll", async () => {
    return await gitService.stageAll();
  });
  ipcMain.handle("git:unstageAll", async () => {
    return await gitService.unstageAll();
  });
  ipcMain.handle("git:discardAll", async () => {
    return await gitService.discardAll();
  });
  ipcMain.handle("git:getLog", async () => {
    return await gitService.getLog();
  });
}
var luxon$1 = {};
Object.defineProperty(luxon$1, "__esModule", { value: true });
class LuxonError extends Error {
}
class InvalidDateTimeError extends LuxonError {
  constructor(reason) {
    super(`Invalid DateTime: ${reason.toMessage()}`);
  }
}
class InvalidIntervalError extends LuxonError {
  constructor(reason) {
    super(`Invalid Interval: ${reason.toMessage()}`);
  }
}
class InvalidDurationError extends LuxonError {
  constructor(reason) {
    super(`Invalid Duration: ${reason.toMessage()}`);
  }
}
class ConflictingSpecificationError extends LuxonError {
}
class InvalidUnitError extends LuxonError {
  constructor(unit) {
    super(`Invalid unit ${unit}`);
  }
}
class InvalidArgumentError extends LuxonError {
}
class ZoneIsAbstractError extends LuxonError {
  constructor() {
    super("Zone is an abstract class");
  }
}
const n = "numeric", s = "short", l = "long";
const DATE_SHORT = {
  year: n,
  month: n,
  day: n
};
const DATE_MED = {
  year: n,
  month: s,
  day: n
};
const DATE_MED_WITH_WEEKDAY = {
  year: n,
  month: s,
  day: n,
  weekday: s
};
const DATE_FULL = {
  year: n,
  month: l,
  day: n
};
const DATE_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l
};
const TIME_SIMPLE = {
  hour: n,
  minute: n
};
const TIME_WITH_SECONDS = {
  hour: n,
  minute: n,
  second: n
};
const TIME_WITH_SHORT_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  timeZoneName: s
};
const TIME_WITH_LONG_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  timeZoneName: l
};
const TIME_24_SIMPLE = {
  hour: n,
  minute: n,
  hourCycle: "h23"
};
const TIME_24_WITH_SECONDS = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23"
};
const TIME_24_WITH_SHORT_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
  timeZoneName: s
};
const TIME_24_WITH_LONG_OFFSET = {
  hour: n,
  minute: n,
  second: n,
  hourCycle: "h23",
  timeZoneName: l
};
const DATETIME_SHORT = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: n
};
const DATETIME_SHORT_WITH_SECONDS = {
  year: n,
  month: n,
  day: n,
  hour: n,
  minute: n,
  second: n
};
const DATETIME_MED = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: n
};
const DATETIME_MED_WITH_SECONDS = {
  year: n,
  month: s,
  day: n,
  hour: n,
  minute: n,
  second: n
};
const DATETIME_MED_WITH_WEEKDAY = {
  year: n,
  month: s,
  day: n,
  weekday: s,
  hour: n,
  minute: n
};
const DATETIME_FULL = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: n,
  timeZoneName: s
};
const DATETIME_FULL_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  hour: n,
  minute: n,
  second: n,
  timeZoneName: s
};
const DATETIME_HUGE = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: n,
  timeZoneName: l
};
const DATETIME_HUGE_WITH_SECONDS = {
  year: n,
  month: l,
  day: n,
  weekday: l,
  hour: n,
  minute: n,
  second: n,
  timeZoneName: l
};
class Zone {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new ZoneIsAbstractError();
  }
  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new ZoneIsAbstractError();
  }
  /**
   * The IANA name of this zone.
   * Defaults to `name` if not overwritten by a subclass.
   * @abstract
   * @type {string}
   */
  get ianaName() {
    return this.name;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  get isUniversal() {
    throw new ZoneIsAbstractError();
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, opts) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new ZoneIsAbstractError();
  }
}
let singleton$1 = null;
class SystemZone extends Zone {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    if (singleton$1 === null) {
      singleton$1 = new SystemZone();
    }
    return singleton$1;
  }
  /** @override **/
  get type() {
    return "system";
  }
  /** @override **/
  get name() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  /** @override **/
  get isUniversal() {
    return false;
  }
  /** @override **/
  offsetName(ts, {
    format,
    locale
  }) {
    return parseZoneInfo(ts, format, locale);
  }
  /** @override **/
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }
  /** @override **/
  offset(ts) {
    return -new Date(ts).getTimezoneOffset();
  }
  /** @override **/
  equals(otherZone) {
    return otherZone.type === "system";
  }
  /** @override **/
  get isValid() {
    return true;
  }
}
const dtfCache = /* @__PURE__ */ new Map();
function makeDTF(zoneName) {
  let dtf = dtfCache.get(zoneName);
  if (dtf === void 0) {
    dtf = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeZone: zoneName,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      era: "short"
    });
    dtfCache.set(zoneName, dtf);
  }
  return dtf;
}
const typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6
};
function hackyOffset(dtf, date2) {
  const formatted = dtf.format(date2).replace(/\u200E/g, ""), parsed = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted), [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;
  return [fYear, fMonth, fDay, fadOrBc, fHour, fMinute, fSecond];
}
function partsOffset(dtf, date2) {
  const formatted = dtf.formatToParts(date2);
  const filled = [];
  for (let i = 0; i < formatted.length; i++) {
    const {
      type: type2,
      value
    } = formatted[i];
    const pos = typeToPos[type2];
    if (type2 === "era") {
      filled[pos] = value;
    } else if (!isUndefined(pos)) {
      filled[pos] = parseInt(value, 10);
    }
  }
  return filled;
}
const ianaZoneCache = /* @__PURE__ */ new Map();
class IANAZone extends Zone {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(name) {
    let zone = ianaZoneCache.get(name);
    if (zone === void 0) {
      ianaZoneCache.set(name, zone = new IANAZone(name));
    }
    return zone;
  }
  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    ianaZoneCache.clear();
    dtfCache.clear();
  }
  /**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
   * @return {boolean}
   */
  static isValidSpecifier(s2) {
    return this.isValidZone(s2);
  }
  /**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */
  static isValidZone(zone) {
    if (!zone) {
      return false;
    }
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone: zone
      }).format();
      return true;
    } catch (e) {
      return false;
    }
  }
  constructor(name) {
    super();
    this.zoneName = name;
    this.valid = IANAZone.isValidZone(name);
  }
  /**
   * The type of zone. `iana` for all instances of `IANAZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "iana";
  }
  /**
   * The name of this zone (i.e. the IANA zone name).
   * @override
   * @type {string}
   */
  get name() {
    return this.zoneName;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns false for all IANA zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return false;
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, {
    format,
    locale
  }) {
    return parseZoneInfo(ts, format, locale, this.name);
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    if (!this.valid) return NaN;
    const date2 = new Date(ts);
    if (isNaN(date2)) return NaN;
    const dtf = makeDTF(this.name);
    let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts ? partsOffset(dtf, date2) : hackyOffset(dtf, date2);
    if (adOrBc === "BC") {
      year = -Math.abs(year) + 1;
    }
    const adjustedHour = hour === 24 ? 0 : hour;
    const asUTC = objToLocalTS({
      year,
      month,
      day,
      hour: adjustedHour,
      minute,
      second,
      millisecond: 0
    });
    let asTS = +date2;
    const over = asTS % 1e3;
    asTS -= over >= 0 ? over : 1e3 + over;
    return (asUTC - asTS) / (60 * 1e3);
  }
  /**
   * Return whether this Zone is equal to another zone
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return otherZone.type === "iana" && otherZone.name === this.name;
  }
  /**
   * Return whether this Zone is valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return this.valid;
  }
}
let intlLFCache = {};
function getCachedLF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlLFCache[key];
  if (!dtf) {
    dtf = new Intl.ListFormat(locString, opts);
    intlLFCache[key] = dtf;
  }
  return dtf;
}
const intlDTCache = /* @__PURE__ */ new Map();
function getCachedDTF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlDTCache.get(key);
  if (dtf === void 0) {
    dtf = new Intl.DateTimeFormat(locString, opts);
    intlDTCache.set(key, dtf);
  }
  return dtf;
}
const intlNumCache = /* @__PURE__ */ new Map();
function getCachedINF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let inf = intlNumCache.get(key);
  if (inf === void 0) {
    inf = new Intl.NumberFormat(locString, opts);
    intlNumCache.set(key, inf);
  }
  return inf;
}
const intlRelCache = /* @__PURE__ */ new Map();
function getCachedRTF(locString, opts = {}) {
  const {
    base,
    ...cacheKeyOpts
  } = opts;
  const key = JSON.stringify([locString, cacheKeyOpts]);
  let inf = intlRelCache.get(key);
  if (inf === void 0) {
    inf = new Intl.RelativeTimeFormat(locString, opts);
    intlRelCache.set(key, inf);
  }
  return inf;
}
let sysLocaleCache = null;
function systemLocale() {
  if (sysLocaleCache) {
    return sysLocaleCache;
  } else {
    sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
    return sysLocaleCache;
  }
}
const intlResolvedOptionsCache = /* @__PURE__ */ new Map();
function getCachedIntResolvedOptions(locString) {
  let opts = intlResolvedOptionsCache.get(locString);
  if (opts === void 0) {
    opts = new Intl.DateTimeFormat(locString).resolvedOptions();
    intlResolvedOptionsCache.set(locString, opts);
  }
  return opts;
}
const weekInfoCache = /* @__PURE__ */ new Map();
function getCachedWeekInfo(locString) {
  let data = weekInfoCache.get(locString);
  if (!data) {
    const locale = new Intl.Locale(locString);
    data = "getWeekInfo" in locale ? locale.getWeekInfo() : locale.weekInfo;
    if (!("minimalDays" in data)) {
      data = {
        ...fallbackWeekSettings,
        ...data
      };
    }
    weekInfoCache.set(locString, data);
  }
  return data;
}
function parseLocaleString(localeStr) {
  const xIndex = localeStr.indexOf("-x-");
  if (xIndex !== -1) {
    localeStr = localeStr.substring(0, xIndex);
  }
  const uIndex = localeStr.indexOf("-u-");
  if (uIndex === -1) {
    return [localeStr];
  } else {
    let options;
    let selectedStr;
    try {
      options = getCachedDTF(localeStr).resolvedOptions();
      selectedStr = localeStr;
    } catch (e) {
      const smaller = localeStr.substring(0, uIndex);
      options = getCachedDTF(smaller).resolvedOptions();
      selectedStr = smaller;
    }
    const {
      numberingSystem,
      calendar
    } = options;
    return [selectedStr, numberingSystem, calendar];
  }
}
function intlConfigString(localeStr, numberingSystem, outputCalendar) {
  if (outputCalendar || numberingSystem) {
    if (!localeStr.includes("-u-")) {
      localeStr += "-u";
    }
    if (outputCalendar) {
      localeStr += `-ca-${outputCalendar}`;
    }
    if (numberingSystem) {
      localeStr += `-nu-${numberingSystem}`;
    }
    return localeStr;
  } else {
    return localeStr;
  }
}
function mapMonths(f) {
  const ms2 = [];
  for (let i = 1; i <= 12; i++) {
    const dt = DateTime.utc(2009, i, 1);
    ms2.push(f(dt));
  }
  return ms2;
}
function mapWeekdays(f) {
  const ms2 = [];
  for (let i = 1; i <= 7; i++) {
    const dt = DateTime.utc(2016, 11, 13 + i);
    ms2.push(f(dt));
  }
  return ms2;
}
function listStuff(loc, length, englishFn, intlFn) {
  const mode = loc.listingMode();
  if (mode === "error") {
    return null;
  } else if (mode === "en") {
    return englishFn(length);
  } else {
    return intlFn(length);
  }
}
function supportsFastNumbers(loc) {
  if (loc.numberingSystem && loc.numberingSystem !== "latn") {
    return false;
  } else {
    return loc.numberingSystem === "latn" || !loc.locale || loc.locale.startsWith("en") || getCachedIntResolvedOptions(loc.locale).numberingSystem === "latn";
  }
}
class PolyNumberFormatter {
  constructor(intl, forceSimple, opts) {
    this.padTo = opts.padTo || 0;
    this.floor = opts.floor || false;
    const {
      padTo,
      floor,
      ...otherOpts
    } = opts;
    if (!forceSimple || Object.keys(otherOpts).length > 0) {
      const intlOpts = {
        useGrouping: false,
        ...opts
      };
      if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
      this.inf = getCachedINF(intl, intlOpts);
    }
  }
  format(i) {
    if (this.inf) {
      const fixed = this.floor ? Math.floor(i) : i;
      return this.inf.format(fixed);
    } else {
      const fixed = this.floor ? Math.floor(i) : roundTo(i, 3);
      return padStart(fixed, this.padTo);
    }
  }
}
class PolyDateFormatter {
  constructor(dt, intl, opts) {
    this.opts = opts;
    this.originalZone = void 0;
    let z = void 0;
    if (this.opts.timeZone) {
      this.dt = dt;
    } else if (dt.zone.type === "fixed") {
      const gmtOffset = -1 * (dt.offset / 60);
      const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
      if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
        z = offsetZ;
        this.dt = dt;
      } else {
        z = "UTC";
        this.dt = dt.offset === 0 ? dt : dt.setZone("UTC").plus({
          minutes: dt.offset
        });
        this.originalZone = dt.zone;
      }
    } else if (dt.zone.type === "system") {
      this.dt = dt;
    } else if (dt.zone.type === "iana") {
      this.dt = dt;
      z = dt.zone.name;
    } else {
      z = "UTC";
      this.dt = dt.setZone("UTC").plus({
        minutes: dt.offset
      });
      this.originalZone = dt.zone;
    }
    const intlOpts = {
      ...this.opts
    };
    intlOpts.timeZone = intlOpts.timeZone || z;
    this.dtf = getCachedDTF(intl, intlOpts);
  }
  format() {
    if (this.originalZone) {
      return this.formatToParts().map(({
        value
      }) => value).join("");
    }
    return this.dtf.format(this.dt.toJSDate());
  }
  formatToParts() {
    const parts = this.dtf.formatToParts(this.dt.toJSDate());
    if (this.originalZone) {
      return parts.map((part) => {
        if (part.type === "timeZoneName") {
          const offsetName = this.originalZone.offsetName(this.dt.ts, {
            locale: this.dt.locale,
            format: this.opts.timeZoneName
          });
          return {
            ...part,
            value: offsetName
          };
        } else {
          return part;
        }
      });
    }
    return parts;
  }
  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}
class PolyRelFormatter {
  constructor(intl, isEnglish, opts) {
    this.opts = {
      style: "long",
      ...opts
    };
    if (!isEnglish && hasRelative()) {
      this.rtf = getCachedRTF(intl, opts);
    }
  }
  format(count, unit) {
    if (this.rtf) {
      return this.rtf.format(count, unit);
    } else {
      return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
    }
  }
  formatToParts(count, unit) {
    if (this.rtf) {
      return this.rtf.formatToParts(count, unit);
    } else {
      return [];
    }
  }
}
const fallbackWeekSettings = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};
class Locale {
  static fromOpts(opts) {
    return Locale.create(opts.locale, opts.numberingSystem, opts.outputCalendar, opts.weekSettings, opts.defaultToEN);
  }
  static create(locale, numberingSystem, outputCalendar, weekSettings, defaultToEN = false) {
    const specifiedLocale = locale || Settings.defaultLocale;
    const localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale());
    const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
    const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
    const weekSettingsR = validateWeekSettings(weekSettings) || Settings.defaultWeekSettings;
    return new Locale(localeR, numberingSystemR, outputCalendarR, weekSettingsR, specifiedLocale);
  }
  static resetCache() {
    sysLocaleCache = null;
    intlDTCache.clear();
    intlNumCache.clear();
    intlRelCache.clear();
    intlResolvedOptionsCache.clear();
    weekInfoCache.clear();
  }
  static fromObject({
    locale,
    numberingSystem,
    outputCalendar,
    weekSettings
  } = {}) {
    return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
  }
  constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
    const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);
    this.locale = parsedLocale;
    this.numberingSystem = numbering || parsedNumberingSystem || null;
    this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
    this.weekSettings = weekSettings;
    this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
    this.weekdaysCache = {
      format: {},
      standalone: {}
    };
    this.monthsCache = {
      format: {},
      standalone: {}
    };
    this.meridiemCache = null;
    this.eraCache = {};
    this.specifiedLocale = specifiedLocale;
    this.fastNumbersCached = null;
  }
  get fastNumbers() {
    if (this.fastNumbersCached == null) {
      this.fastNumbersCached = supportsFastNumbers(this);
    }
    return this.fastNumbersCached;
  }
  listingMode() {
    const isActuallyEn = this.isEnglish();
    const hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
    return isActuallyEn && hasNoWeirdness ? "en" : "intl";
  }
  clone(alts) {
    if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
      return this;
    } else {
      return Locale.create(alts.locale || this.specifiedLocale, alts.numberingSystem || this.numberingSystem, alts.outputCalendar || this.outputCalendar, validateWeekSettings(alts.weekSettings) || this.weekSettings, alts.defaultToEN || false);
    }
  }
  redefaultToEN(alts = {}) {
    return this.clone({
      ...alts,
      defaultToEN: true
    });
  }
  redefaultToSystem(alts = {}) {
    return this.clone({
      ...alts,
      defaultToEN: false
    });
  }
  months(length, format = false) {
    return listStuff(this, length, months, () => {
      const intl = format ? {
        month: length,
        day: "numeric"
      } : {
        month: length
      }, formatStr = format ? "format" : "standalone";
      if (!this.monthsCache[formatStr][length]) {
        this.monthsCache[formatStr][length] = mapMonths((dt) => this.extract(dt, intl, "month"));
      }
      return this.monthsCache[formatStr][length];
    });
  }
  weekdays(length, format = false) {
    return listStuff(this, length, weekdays, () => {
      const intl = format ? {
        weekday: length,
        year: "numeric",
        month: "long",
        day: "numeric"
      } : {
        weekday: length
      }, formatStr = format ? "format" : "standalone";
      if (!this.weekdaysCache[formatStr][length]) {
        this.weekdaysCache[formatStr][length] = mapWeekdays((dt) => this.extract(dt, intl, "weekday"));
      }
      return this.weekdaysCache[formatStr][length];
    });
  }
  meridiems() {
    return listStuff(this, void 0, () => meridiems, () => {
      if (!this.meridiemCache) {
        const intl = {
          hour: "numeric",
          hourCycle: "h12"
        };
        this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map((dt) => this.extract(dt, intl, "dayperiod"));
      }
      return this.meridiemCache;
    });
  }
  eras(length) {
    return listStuff(this, length, eras, () => {
      const intl = {
        era: length
      };
      if (!this.eraCache[length]) {
        this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map((dt) => this.extract(dt, intl, "era"));
      }
      return this.eraCache[length];
    });
  }
  extract(dt, intlOpts, field) {
    const df = this.dtFormatter(dt, intlOpts), results = df.formatToParts(), matching = results.find((m) => m.type.toLowerCase() === field);
    return matching ? matching.value : null;
  }
  numberFormatter(opts = {}) {
    return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
  }
  dtFormatter(dt, intlOpts = {}) {
    return new PolyDateFormatter(dt, this.intl, intlOpts);
  }
  relFormatter(opts = {}) {
    return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
  }
  listFormatter(opts = {}) {
    return getCachedLF(this.intl, opts);
  }
  isEnglish() {
    return this.locale === "en" || this.locale.toLowerCase() === "en-us" || getCachedIntResolvedOptions(this.intl).locale.startsWith("en-us");
  }
  getWeekSettings() {
    if (this.weekSettings) {
      return this.weekSettings;
    } else if (!hasLocaleWeekInfo()) {
      return fallbackWeekSettings;
    } else {
      return getCachedWeekInfo(this.locale);
    }
  }
  getStartOfWeek() {
    return this.getWeekSettings().firstDay;
  }
  getMinDaysInFirstWeek() {
    return this.getWeekSettings().minimalDays;
  }
  getWeekendDays() {
    return this.getWeekSettings().weekend;
  }
  equals(other) {
    return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
  }
  toString() {
    return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
  }
}
let singleton = null;
class FixedOffsetZone extends Zone {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    if (singleton === null) {
      singleton = new FixedOffsetZone(0);
    }
    return singleton;
  }
  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(offset2) {
    return offset2 === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset2);
  }
  /**
   * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
   * @param {string} s - The offset string to parse
   * @example FixedOffsetZone.parseSpecifier("UTC+6")
   * @example FixedOffsetZone.parseSpecifier("UTC+06")
   * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
   * @return {FixedOffsetZone}
   */
  static parseSpecifier(s2) {
    if (s2) {
      const r = s2.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
      if (r) {
        return new FixedOffsetZone(signedOffset(r[1], r[2]));
      }
    }
    return null;
  }
  constructor(offset2) {
    super();
    this.fixed = offset2;
  }
  /**
   * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "fixed";
  }
  /**
   * The name of this zone.
   * All fixed zones' names always start with "UTC" (plus optional offset)
   * @override
   * @type {string}
   */
  get name() {
    return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
  }
  /**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */
  get ianaName() {
    if (this.fixed === 0) {
      return "Etc/UTC";
    } else {
      return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
    }
  }
  /**
   * Returns the offset's common name at the specified timestamp.
   *
   * For fixed offset zones this equals to the zone name.
   * @override
   */
  offsetName() {
    return this.name;
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    return formatOffset(this.fixed, format);
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns true for all fixed offset zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return true;
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   *
   * For fixed offset zones, this is constant and does not depend on a timestamp.
   * @override
   * @return {number}
   */
  offset() {
    return this.fixed;
  }
  /**
   * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
  }
  /**
   * Return whether this Zone is valid:
   * All fixed offset zones are valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return true;
  }
}
class InvalidZone extends Zone {
  constructor(zoneName) {
    super();
    this.zoneName = zoneName;
  }
  /** @override **/
  get type() {
    return "invalid";
  }
  /** @override **/
  get name() {
    return this.zoneName;
  }
  /** @override **/
  get isUniversal() {
    return false;
  }
  /** @override **/
  offsetName() {
    return null;
  }
  /** @override **/
  formatOffset() {
    return "";
  }
  /** @override **/
  offset() {
    return NaN;
  }
  /** @override **/
  equals() {
    return false;
  }
  /** @override **/
  get isValid() {
    return false;
  }
}
function normalizeZone(input, defaultZone2) {
  if (isUndefined(input) || input === null) {
    return defaultZone2;
  } else if (input instanceof Zone) {
    return input;
  } else if (isString(input)) {
    const lowered = input.toLowerCase();
    if (lowered === "default") return defaultZone2;
    else if (lowered === "local" || lowered === "system") return SystemZone.instance;
    else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
    else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
  } else if (isNumber(input)) {
    return FixedOffsetZone.instance(input);
  } else if (typeof input === "object" && "offset" in input && typeof input.offset === "function") {
    return input;
  } else {
    return new InvalidZone(input);
  }
}
const numberingSystems = {
  arab: "[٠-٩]",
  arabext: "[۰-۹]",
  bali: "[᭐-᭙]",
  beng: "[০-৯]",
  deva: "[०-९]",
  fullwide: "[０-９]",
  gujr: "[૦-૯]",
  hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
  khmr: "[០-៩]",
  knda: "[೦-೯]",
  laoo: "[໐-໙]",
  limb: "[᥆-᥏]",
  mlym: "[൦-൯]",
  mong: "[᠐-᠙]",
  mymr: "[၀-၉]",
  orya: "[୦-୯]",
  tamldec: "[௦-௯]",
  telu: "[౦-౯]",
  thai: "[๐-๙]",
  tibt: "[༠-༩]",
  latn: "\\d"
};
const numberingSystemsUTF16 = {
  arab: [1632, 1641],
  arabext: [1776, 1785],
  bali: [6992, 7001],
  beng: [2534, 2543],
  deva: [2406, 2415],
  fullwide: [65296, 65303],
  gujr: [2790, 2799],
  khmr: [6112, 6121],
  knda: [3302, 3311],
  laoo: [3792, 3801],
  limb: [6470, 6479],
  mlym: [3430, 3439],
  mong: [6160, 6169],
  mymr: [4160, 4169],
  orya: [2918, 2927],
  tamldec: [3046, 3055],
  telu: [3174, 3183],
  thai: [3664, 3673],
  tibt: [3872, 3881]
};
const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
function parseDigits(str) {
  let value = parseInt(str, 10);
  if (isNaN(value)) {
    value = "";
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (str[i].search(numberingSystems.hanidec) !== -1) {
        value += hanidecChars.indexOf(str[i]);
      } else {
        for (const key in numberingSystemsUTF16) {
          const [min, max] = numberingSystemsUTF16[key];
          if (code >= min && code <= max) {
            value += code - min;
          }
        }
      }
    }
    return parseInt(value, 10);
  } else {
    return value;
  }
}
const digitRegexCache = /* @__PURE__ */ new Map();
function resetDigitRegexCache() {
  digitRegexCache.clear();
}
function digitRegex({
  numberingSystem
}, append2 = "") {
  const ns = numberingSystem || "latn";
  let appendCache = digitRegexCache.get(ns);
  if (appendCache === void 0) {
    appendCache = /* @__PURE__ */ new Map();
    digitRegexCache.set(ns, appendCache);
  }
  let regex = appendCache.get(append2);
  if (regex === void 0) {
    regex = new RegExp(`${numberingSystems[ns]}${append2}`);
    appendCache.set(append2, regex);
  }
  return regex;
}
let now = () => Date.now(), defaultZone = "system", defaultLocale = null, defaultNumberingSystem = null, defaultOutputCalendar = null, twoDigitCutoffYear = 60, throwOnInvalid, defaultWeekSettings = null;
class Settings {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return now;
  }
  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(n2) {
    now = n2;
  }
  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(zone) {
    defaultZone = zone;
  }
  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return normalizeZone(defaultZone, SystemZone.instance);
  }
  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return defaultLocale;
  }
  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(locale) {
    defaultLocale = locale;
  }
  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return defaultNumberingSystem;
  }
  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(numberingSystem) {
    defaultNumberingSystem = numberingSystem;
  }
  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return defaultOutputCalendar;
  }
  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(outputCalendar) {
    defaultOutputCalendar = outputCalendar;
  }
  /**
   * @typedef {Object} WeekSettings
   * @property {number} firstDay
   * @property {number} minimalDays
   * @property {number[]} weekend
   */
  /**
   * @return {WeekSettings|null}
   */
  static get defaultWeekSettings() {
    return defaultWeekSettings;
  }
  /**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */
  static set defaultWeekSettings(weekSettings) {
    defaultWeekSettings = validateWeekSettings(weekSettings);
  }
  /**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return twoDigitCutoffYear;
  }
  /**
   * Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   * @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
   * @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
   * @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
   * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
   * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
   */
  static set twoDigitCutoffYear(cutoffYear) {
    twoDigitCutoffYear = cutoffYear % 100;
  }
  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return throwOnInvalid;
  }
  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(t) {
    throwOnInvalid = t;
  }
  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    Locale.resetCache();
    IANAZone.resetCache();
    DateTime.resetCache();
    resetDigitRegexCache();
  }
}
class Invalid {
  constructor(reason, explanation) {
    this.reason = reason;
    this.explanation = explanation;
  }
  toMessage() {
    if (this.explanation) {
      return `${this.reason}: ${this.explanation}`;
    } else {
      return this.reason;
    }
  }
}
const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function unitOutOfRange(unit, value) {
  return new Invalid("unit out of range", `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`);
}
function dayOfWeek(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (year < 100 && year >= 0) {
    d.setUTCFullYear(d.getUTCFullYear() - 1900);
  }
  const js = d.getUTCDay();
  return js === 0 ? 7 : js;
}
function computeOrdinal(year, month, day) {
  return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}
function uncomputeOrdinal(year, ordinal) {
  const table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex((i) => i < ordinal), day = ordinal - table[month0];
  return {
    month: month0 + 1,
    day
  };
}
function isoWeekdayToLocal(isoWeekday, startOfWeek) {
  return (isoWeekday - startOfWeek + 7) % 7 + 1;
}
function gregorianToWeek(gregObj, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const {
    year,
    month,
    day
  } = gregObj, ordinal = computeOrdinal(year, month, day), weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);
  let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7), weekYear;
  if (weekNumber < 1) {
    weekYear = year - 1;
    weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
  } else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
    weekYear = year + 1;
    weekNumber = 1;
  } else {
    weekYear = year;
  }
  return {
    weekYear,
    weekNumber,
    weekday,
    ...timeObject(gregObj)
  };
}
function weekToGregorian(weekData, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const {
    weekYear,
    weekNumber,
    weekday
  } = weekData, weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek), yearInDays = daysInYear(weekYear);
  let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek, year;
  if (ordinal < 1) {
    year = weekYear - 1;
    ordinal += daysInYear(year);
  } else if (ordinal > yearInDays) {
    year = weekYear + 1;
    ordinal -= daysInYear(weekYear);
  } else {
    year = weekYear;
  }
  const {
    month,
    day
  } = uncomputeOrdinal(year, ordinal);
  return {
    year,
    month,
    day,
    ...timeObject(weekData)
  };
}
function gregorianToOrdinal(gregData) {
  const {
    year,
    month,
    day
  } = gregData;
  const ordinal = computeOrdinal(year, month, day);
  return {
    year,
    ordinal,
    ...timeObject(gregData)
  };
}
function ordinalToGregorian(ordinalData) {
  const {
    year,
    ordinal
  } = ordinalData;
  const {
    month,
    day
  } = uncomputeOrdinal(year, ordinal);
  return {
    year,
    month,
    day,
    ...timeObject(ordinalData)
  };
}
function usesLocalWeekValues(obj, loc) {
  const hasLocaleWeekData = !isUndefined(obj.localWeekday) || !isUndefined(obj.localWeekNumber) || !isUndefined(obj.localWeekYear);
  if (hasLocaleWeekData) {
    const hasIsoWeekData = !isUndefined(obj.weekday) || !isUndefined(obj.weekNumber) || !isUndefined(obj.weekYear);
    if (hasIsoWeekData) {
      throw new ConflictingSpecificationError("Cannot mix locale-based week fields with ISO-based week fields");
    }
    if (!isUndefined(obj.localWeekday)) obj.weekday = obj.localWeekday;
    if (!isUndefined(obj.localWeekNumber)) obj.weekNumber = obj.localWeekNumber;
    if (!isUndefined(obj.localWeekYear)) obj.weekYear = obj.localWeekYear;
    delete obj.localWeekday;
    delete obj.localWeekNumber;
    delete obj.localWeekYear;
    return {
      minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
      startOfWeek: loc.getStartOfWeek()
    };
  } else {
    return {
      minDaysInFirstWeek: 4,
      startOfWeek: 1
    };
  }
}
function hasInvalidWeekData(obj, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const validYear = isInteger(obj.weekYear), validWeek = integerBetween(obj.weekNumber, 1, weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)), validWeekday = integerBetween(obj.weekday, 1, 7);
  if (!validYear) {
    return unitOutOfRange("weekYear", obj.weekYear);
  } else if (!validWeek) {
    return unitOutOfRange("week", obj.weekNumber);
  } else if (!validWeekday) {
    return unitOutOfRange("weekday", obj.weekday);
  } else return false;
}
function hasInvalidOrdinalData(obj) {
  const validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validOrdinal) {
    return unitOutOfRange("ordinal", obj.ordinal);
  } else return false;
}
function hasInvalidGregorianData(obj) {
  const validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validMonth) {
    return unitOutOfRange("month", obj.month);
  } else if (!validDay) {
    return unitOutOfRange("day", obj.day);
  } else return false;
}
function hasInvalidTimeData(obj) {
  const {
    hour,
    minute,
    second,
    millisecond
  } = obj;
  const validHour = integerBetween(hour, 0, 23) || hour === 24 && minute === 0 && second === 0 && millisecond === 0, validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
  if (!validHour) {
    return unitOutOfRange("hour", hour);
  } else if (!validMinute) {
    return unitOutOfRange("minute", minute);
  } else if (!validSecond) {
    return unitOutOfRange("second", second);
  } else if (!validMillisecond) {
    return unitOutOfRange("millisecond", millisecond);
  } else return false;
}
function isUndefined(o) {
  return typeof o === "undefined";
}
function isNumber(o) {
  return typeof o === "number";
}
function isInteger(o) {
  return typeof o === "number" && o % 1 === 0;
}
function isString(o) {
  return typeof o === "string";
}
function isDate(o) {
  return Object.prototype.toString.call(o) === "[object Date]";
}
function hasRelative() {
  try {
    return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
  } catch (e) {
    return false;
  }
}
function hasLocaleWeekInfo() {
  try {
    return typeof Intl !== "undefined" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
  } catch (e) {
    return false;
  }
}
function maybeArray(thing) {
  return Array.isArray(thing) ? thing : [thing];
}
function bestBy(arr, by, compare) {
  if (arr.length === 0) {
    return void 0;
  }
  return arr.reduce((best, next2) => {
    const pair = [by(next2), next2];
    if (!best) {
      return pair;
    } else if (compare(best[0], pair[0]) === best[0]) {
      return best;
    } else {
      return pair;
    }
  }, null)[1];
}
function pick(obj, keys) {
  return keys.reduce((a, k) => {
    a[k] = obj[k];
    return a;
  }, {});
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function validateWeekSettings(settings) {
  if (settings == null) {
    return null;
  } else if (typeof settings !== "object") {
    throw new InvalidArgumentError("Week settings must be an object");
  } else {
    if (!integerBetween(settings.firstDay, 1, 7) || !integerBetween(settings.minimalDays, 1, 7) || !Array.isArray(settings.weekend) || settings.weekend.some((v) => !integerBetween(v, 1, 7))) {
      throw new InvalidArgumentError("Invalid week settings");
    }
    return {
      firstDay: settings.firstDay,
      minimalDays: settings.minimalDays,
      weekend: Array.from(settings.weekend)
    };
  }
}
function integerBetween(thing, bottom, top) {
  return isInteger(thing) && thing >= bottom && thing <= top;
}
function floorMod(x, n2) {
  return x - n2 * Math.floor(x / n2);
}
function padStart(input, n2 = 2) {
  const isNeg = input < 0;
  let padded;
  if (isNeg) {
    padded = "-" + ("" + -input).padStart(n2, "0");
  } else {
    padded = ("" + input).padStart(n2, "0");
  }
  return padded;
}
function parseInteger(string) {
  if (isUndefined(string) || string === null || string === "") {
    return void 0;
  } else {
    return parseInt(string, 10);
  }
}
function parseFloating(string) {
  if (isUndefined(string) || string === null || string === "") {
    return void 0;
  } else {
    return parseFloat(string);
  }
}
function parseMillis(fraction) {
  if (isUndefined(fraction) || fraction === null || fraction === "") {
    return void 0;
  } else {
    const f = parseFloat("0." + fraction) * 1e3;
    return Math.floor(f);
  }
}
function roundTo(number, digits, towardZero = false) {
  const factor = 10 ** digits, rounder = towardZero ? Math.trunc : Math.round;
  return rounder(number * factor) / factor;
}
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}
function daysInMonth(year, month) {
  const modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
  if (modMonth === 2) {
    return isLeapYear(modYear) ? 29 : 28;
  } else {
    return [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
  }
}
function objToLocalTS(obj) {
  let d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond);
  if (obj.year < 100 && obj.year >= 0) {
    d = new Date(d);
    d.setUTCFullYear(obj.year, obj.month - 1, obj.day);
  }
  return +d;
}
function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
  const fwdlw = isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek);
  return -fwdlw + minDaysInFirstWeek - 1;
}
function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
  const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
  return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}
function untruncateYear(year) {
  if (year > 99) {
    return year;
  } else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2e3 + year;
}
function parseZoneInfo(ts, offsetFormat, locale, timeZone = null) {
  const date2 = new Date(ts), intlOpts = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };
  if (timeZone) {
    intlOpts.timeZone = timeZone;
  }
  const modified = {
    timeZoneName: offsetFormat,
    ...intlOpts
  };
  const parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date2).find((m) => m.type.toLowerCase() === "timezonename");
  return parsed ? parsed.value : null;
}
function signedOffset(offHourStr, offMinuteStr) {
  let offHour = parseInt(offHourStr, 10);
  if (Number.isNaN(offHour)) {
    offHour = 0;
  }
  const offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
  return offHour * 60 + offMinSigned;
}
function asNumber(value) {
  const numericValue = Number(value);
  if (typeof value === "boolean" || value === "" || Number.isNaN(numericValue)) throw new InvalidArgumentError(`Invalid unit value ${value}`);
  return numericValue;
}
function normalizeObject(obj, normalizer) {
  const normalized = {};
  for (const u in obj) {
    if (hasOwnProperty(obj, u)) {
      const v = obj[u];
      if (v === void 0 || v === null) continue;
      normalized[normalizer(u)] = asNumber(v);
    }
  }
  return normalized;
}
function formatOffset(offset2, format) {
  const hours = Math.trunc(Math.abs(offset2 / 60)), minutes = Math.trunc(Math.abs(offset2 % 60)), sign = offset2 >= 0 ? "+" : "-";
  switch (format) {
    case "short":
      return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
    case "narrow":
      return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
    case "techie":
      return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
    default:
      throw new RangeError(`Value format ${format} is out of range for property format`);
  }
}
function timeObject(obj) {
  return pick(obj, ["hour", "minute", "second", "millisecond"]);
}
const monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthsNarrow = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
function months(length) {
  switch (length) {
    case "narrow":
      return [...monthsNarrow];
    case "short":
      return [...monthsShort];
    case "long":
      return [...monthsLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}
const weekdaysLong = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdaysNarrow = ["M", "T", "W", "T", "F", "S", "S"];
function weekdays(length) {
  switch (length) {
    case "narrow":
      return [...weekdaysNarrow];
    case "short":
      return [...weekdaysShort];
    case "long":
      return [...weekdaysLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}
const meridiems = ["AM", "PM"];
const erasLong = ["Before Christ", "Anno Domini"];
const erasShort = ["BC", "AD"];
const erasNarrow = ["B", "A"];
function eras(length) {
  switch (length) {
    case "narrow":
      return [...erasNarrow];
    case "short":
      return [...erasShort];
    case "long":
      return [...erasLong];
    default:
      return null;
  }
}
function meridiemForDateTime(dt) {
  return meridiems[dt.hour < 12 ? 0 : 1];
}
function weekdayForDateTime(dt, length) {
  return weekdays(length)[dt.weekday - 1];
}
function monthForDateTime(dt, length) {
  return months(length)[dt.month - 1];
}
function eraForDateTime(dt, length) {
  return eras(length)[dt.year < 0 ? 0 : 1];
}
function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
  const units = {
    years: ["year", "yr."],
    quarters: ["quarter", "qtr."],
    months: ["month", "mo."],
    weeks: ["week", "wk."],
    days: ["day", "day", "days"],
    hours: ["hour", "hr."],
    minutes: ["minute", "min."],
    seconds: ["second", "sec."]
  };
  const lastable = ["hours", "minutes", "seconds"].indexOf(unit) === -1;
  if (numeric === "auto" && lastable) {
    const isDay = unit === "days";
    switch (count) {
      case 1:
        return isDay ? "tomorrow" : `next ${units[unit][0]}`;
      case -1:
        return isDay ? "yesterday" : `last ${units[unit][0]}`;
      case 0:
        return isDay ? "today" : `this ${units[unit][0]}`;
    }
  }
  const isInPast = Object.is(count, -0) || count < 0, fmtValue = Math.abs(count), singular = fmtValue === 1, lilUnits = units[unit], fmtUnit = narrow ? singular ? lilUnits[1] : lilUnits[2] || lilUnits[1] : singular ? units[unit][0] : unit;
  return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
}
function stringifyTokens(splits, tokenToString) {
  let s2 = "";
  for (const token of splits) {
    if (token.literal) {
      s2 += token.val;
    } else {
      s2 += tokenToString(token.val);
    }
  }
  return s2;
}
const macroTokenToFormatOpts = {
  D: DATE_SHORT,
  DD: DATE_MED,
  DDD: DATE_FULL,
  DDDD: DATE_HUGE,
  t: TIME_SIMPLE,
  tt: TIME_WITH_SECONDS,
  ttt: TIME_WITH_SHORT_OFFSET,
  tttt: TIME_WITH_LONG_OFFSET,
  T: TIME_24_SIMPLE,
  TT: TIME_24_WITH_SECONDS,
  TTT: TIME_24_WITH_SHORT_OFFSET,
  TTTT: TIME_24_WITH_LONG_OFFSET,
  f: DATETIME_SHORT,
  ff: DATETIME_MED,
  fff: DATETIME_FULL,
  ffff: DATETIME_HUGE,
  F: DATETIME_SHORT_WITH_SECONDS,
  FF: DATETIME_MED_WITH_SECONDS,
  FFF: DATETIME_FULL_WITH_SECONDS,
  FFFF: DATETIME_HUGE_WITH_SECONDS
};
class Formatter {
  static create(locale, opts = {}) {
    return new Formatter(locale, opts);
  }
  static parseFormat(fmt) {
    let current = null, currentFull = "", bracketed = false;
    const splits = [];
    for (let i = 0; i < fmt.length; i++) {
      const c = fmt.charAt(i);
      if (c === "'") {
        if (currentFull.length > 0) {
          splits.push({
            literal: bracketed || /^\s+$/.test(currentFull),
            val: currentFull
          });
        }
        current = null;
        currentFull = "";
        bracketed = !bracketed;
      } else if (bracketed) {
        currentFull += c;
      } else if (c === current) {
        currentFull += c;
      } else {
        if (currentFull.length > 0) {
          splits.push({
            literal: /^\s+$/.test(currentFull),
            val: currentFull
          });
        }
        currentFull = c;
        current = c;
      }
    }
    if (currentFull.length > 0) {
      splits.push({
        literal: bracketed || /^\s+$/.test(currentFull),
        val: currentFull
      });
    }
    return splits;
  }
  static macroTokenToFormatOpts(token) {
    return macroTokenToFormatOpts[token];
  }
  constructor(locale, formatOpts) {
    this.opts = formatOpts;
    this.loc = locale;
    this.systemLoc = null;
  }
  formatWithSystemDefault(dt, opts) {
    if (this.systemLoc === null) {
      this.systemLoc = this.loc.redefaultToSystem();
    }
    const df = this.systemLoc.dtFormatter(dt, {
      ...this.opts,
      ...opts
    });
    return df.format();
  }
  dtFormatter(dt, opts = {}) {
    return this.loc.dtFormatter(dt, {
      ...this.opts,
      ...opts
    });
  }
  formatDateTime(dt, opts) {
    return this.dtFormatter(dt, opts).format();
  }
  formatDateTimeParts(dt, opts) {
    return this.dtFormatter(dt, opts).formatToParts();
  }
  formatInterval(interval, opts) {
    const df = this.dtFormatter(interval.start, opts);
    return df.dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
  }
  resolvedOptions(dt, opts) {
    return this.dtFormatter(dt, opts).resolvedOptions();
  }
  num(n2, p = 0) {
    if (this.opts.forceSimple) {
      return padStart(n2, p);
    }
    const opts = {
      ...this.opts
    };
    if (p > 0) {
      opts.padTo = p;
    }
    return this.loc.numberFormatter(opts).format(n2);
  }
  formatDateTimeFromString(dt, fmt) {
    const knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", string = (opts, extract) => this.loc.extract(dt, opts, extract), formatOffset2 = (opts) => {
      if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) {
        return "Z";
      }
      return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
    }, meridiem = () => knownEnglish ? meridiemForDateTime(dt) : string({
      hour: "numeric",
      hourCycle: "h12"
    }, "dayperiod"), month = (length, standalone) => knownEnglish ? monthForDateTime(dt, length) : string(standalone ? {
      month: length
    } : {
      month: length,
      day: "numeric"
    }, "month"), weekday = (length, standalone) => knownEnglish ? weekdayForDateTime(dt, length) : string(standalone ? {
      weekday: length
    } : {
      weekday: length,
      month: "long",
      day: "numeric"
    }, "weekday"), maybeMacro = (token) => {
      const formatOpts = Formatter.macroTokenToFormatOpts(token);
      if (formatOpts) {
        return this.formatWithSystemDefault(dt, formatOpts);
      } else {
        return token;
      }
    }, era = (length) => knownEnglish ? eraForDateTime(dt, length) : string({
      era: length
    }, "era"), tokenToString = (token) => {
      switch (token) {
        case "S":
          return this.num(dt.millisecond);
        case "u":
        case "SSS":
          return this.num(dt.millisecond, 3);
        case "s":
          return this.num(dt.second);
        case "ss":
          return this.num(dt.second, 2);
        case "uu":
          return this.num(Math.floor(dt.millisecond / 10), 2);
        case "uuu":
          return this.num(Math.floor(dt.millisecond / 100));
        case "m":
          return this.num(dt.minute);
        case "mm":
          return this.num(dt.minute, 2);
        case "h":
          return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
        case "hh":
          return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
        case "H":
          return this.num(dt.hour);
        case "HH":
          return this.num(dt.hour, 2);
        case "Z":
          return formatOffset2({
            format: "narrow",
            allowZ: this.opts.allowZ
          });
        case "ZZ":
          return formatOffset2({
            format: "short",
            allowZ: this.opts.allowZ
          });
        case "ZZZ":
          return formatOffset2({
            format: "techie",
            allowZ: this.opts.allowZ
          });
        case "ZZZZ":
          return dt.zone.offsetName(dt.ts, {
            format: "short",
            locale: this.loc.locale
          });
        case "ZZZZZ":
          return dt.zone.offsetName(dt.ts, {
            format: "long",
            locale: this.loc.locale
          });
        case "z":
          return dt.zoneName;
        case "a":
          return meridiem();
        case "d":
          return useDateTimeFormatter ? string({
            day: "numeric"
          }, "day") : this.num(dt.day);
        case "dd":
          return useDateTimeFormatter ? string({
            day: "2-digit"
          }, "day") : this.num(dt.day, 2);
        case "c":
          return this.num(dt.weekday);
        case "ccc":
          return weekday("short", true);
        case "cccc":
          return weekday("long", true);
        case "ccccc":
          return weekday("narrow", true);
        case "E":
          return this.num(dt.weekday);
        case "EEE":
          return weekday("short", false);
        case "EEEE":
          return weekday("long", false);
        case "EEEEE":
          return weekday("narrow", false);
        case "L":
          return useDateTimeFormatter ? string({
            month: "numeric",
            day: "numeric"
          }, "month") : this.num(dt.month);
        case "LL":
          return useDateTimeFormatter ? string({
            month: "2-digit",
            day: "numeric"
          }, "month") : this.num(dt.month, 2);
        case "LLL":
          return month("short", true);
        case "LLLL":
          return month("long", true);
        case "LLLLL":
          return month("narrow", true);
        case "M":
          return useDateTimeFormatter ? string({
            month: "numeric"
          }, "month") : this.num(dt.month);
        case "MM":
          return useDateTimeFormatter ? string({
            month: "2-digit"
          }, "month") : this.num(dt.month, 2);
        case "MMM":
          return month("short", false);
        case "MMMM":
          return month("long", false);
        case "MMMMM":
          return month("narrow", false);
        case "y":
          return useDateTimeFormatter ? string({
            year: "numeric"
          }, "year") : this.num(dt.year);
        case "yy":
          return useDateTimeFormatter ? string({
            year: "2-digit"
          }, "year") : this.num(dt.year.toString().slice(-2), 2);
        case "yyyy":
          return useDateTimeFormatter ? string({
            year: "numeric"
          }, "year") : this.num(dt.year, 4);
        case "yyyyyy":
          return useDateTimeFormatter ? string({
            year: "numeric"
          }, "year") : this.num(dt.year, 6);
        case "G":
          return era("short");
        case "GG":
          return era("long");
        case "GGGGG":
          return era("narrow");
        case "kk":
          return this.num(dt.weekYear.toString().slice(-2), 2);
        case "kkkk":
          return this.num(dt.weekYear, 4);
        case "W":
          return this.num(dt.weekNumber);
        case "WW":
          return this.num(dt.weekNumber, 2);
        case "n":
          return this.num(dt.localWeekNumber);
        case "nn":
          return this.num(dt.localWeekNumber, 2);
        case "ii":
          return this.num(dt.localWeekYear.toString().slice(-2), 2);
        case "iiii":
          return this.num(dt.localWeekYear, 4);
        case "o":
          return this.num(dt.ordinal);
        case "ooo":
          return this.num(dt.ordinal, 3);
        case "q":
          return this.num(dt.quarter);
        case "qq":
          return this.num(dt.quarter, 2);
        case "X":
          return this.num(Math.floor(dt.ts / 1e3));
        case "x":
          return this.num(dt.ts);
        default:
          return maybeMacro(token);
      }
    };
    return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
  }
  formatDurationFromString(dur, fmt) {
    const tokenToField = (token) => {
      switch (token[0]) {
        case "S":
          return "millisecond";
        case "s":
          return "second";
        case "m":
          return "minute";
        case "h":
          return "hour";
        case "d":
          return "day";
        case "w":
          return "week";
        case "M":
          return "month";
        case "y":
          return "year";
        default:
          return null;
      }
    }, tokenToString = (lildur) => (token) => {
      const mapped = tokenToField(token);
      if (mapped) {
        return this.num(lildur.get(mapped), token.length);
      } else {
        return token;
      }
    }, tokens = Formatter.parseFormat(fmt), realTokens = tokens.reduce((found, {
      literal,
      val
    }) => literal ? found : found.concat(val), []), collapsed = dur.shiftTo(...realTokens.map(tokenToField).filter((t) => t));
    return stringifyTokens(tokens, tokenToString(collapsed));
  }
}
const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function combineRegexes(...regexes) {
  const full = regexes.reduce((f, r) => f + r.source, "");
  return RegExp(`^${full}$`);
}
function combineExtractors(...extractors) {
  return (m) => extractors.reduce(([mergedVals, mergedZone, cursor], ex) => {
    const [val, zone, next2] = ex(m, cursor);
    return [{
      ...mergedVals,
      ...val
    }, zone || mergedZone, next2];
  }, [{}, null, 1]).slice(0, 2);
}
function parse(s2, ...patterns) {
  if (s2 == null) {
    return [null, null];
  }
  for (const [regex, extractor] of patterns) {
    const m = regex.exec(s2);
    if (m) {
      return extractor(m);
    }
  }
  return [null, null];
}
function simpleParse(...keys) {
  return (match2, cursor) => {
    const ret = {};
    let i;
    for (i = 0; i < keys.length; i++) {
      ret[keys[i]] = parseInteger(match2[cursor + i]);
    }
    return [ret, null, cursor + i];
  };
}
const offsetRegex = /(?:(Z)|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:T${isoTimeRegex.source})?`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/;
const sqlTimeRegex = RegExp(`${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
function int(match2, pos, fallback) {
  const m = match2[pos];
  return isUndefined(m) ? fallback : parseInteger(m);
}
function extractISOYmd(match2, cursor) {
  const item = {
    year: int(match2, cursor),
    month: int(match2, cursor + 1, 1),
    day: int(match2, cursor + 2, 1)
  };
  return [item, null, cursor + 3];
}
function extractISOTime(match2, cursor) {
  const item = {
    hours: int(match2, cursor, 0),
    minutes: int(match2, cursor + 1, 0),
    seconds: int(match2, cursor + 2, 0),
    milliseconds: parseMillis(match2[cursor + 3])
  };
  return [item, null, cursor + 4];
}
function extractISOOffset(match2, cursor) {
  const local = !match2[cursor] && !match2[cursor + 1], fullOffset = signedOffset(match2[cursor + 1], match2[cursor + 2]), zone = local ? null : FixedOffsetZone.instance(fullOffset);
  return [{}, zone, cursor + 3];
}
function extractIANAZone(match2, cursor) {
  const zone = match2[cursor] ? IANAZone.create(match2[cursor]) : null;
  return [{}, zone, cursor + 1];
}
const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
const isoDuration = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function extractISODuration(match2) {
  const [s2, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] = match2;
  const hasNegativePrefix = s2[0] === "-";
  const negativeSeconds = secondStr && secondStr[0] === "-";
  const maybeNegate = (num, force = false) => num !== void 0 && (force || num && hasNegativePrefix) ? -num : num;
  return [{
    years: maybeNegate(parseFloating(yearStr)),
    months: maybeNegate(parseFloating(monthStr)),
    weeks: maybeNegate(parseFloating(weekStr)),
    days: maybeNegate(parseFloating(dayStr)),
    hours: maybeNegate(parseFloating(hourStr)),
    minutes: maybeNegate(parseFloating(minuteStr)),
    seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
    milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
  }];
}
const obsOffsets = {
  GMT: 0,
  EDT: -4 * 60,
  EST: -5 * 60,
  CDT: -5 * 60,
  CST: -6 * 60,
  MDT: -6 * 60,
  MST: -7 * 60,
  PDT: -7 * 60,
  PST: -8 * 60
};
function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
  const result = {
    year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
    month: monthsShort.indexOf(monthStr) + 1,
    day: parseInteger(dayStr),
    hour: parseInteger(hourStr),
    minute: parseInteger(minuteStr)
  };
  if (secondStr) result.second = parseInteger(secondStr);
  if (weekdayStr) {
    result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
  }
  return result;
}
const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function extractRFC2822(match2) {
  const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr, obsOffset, milOffset, offHourStr, offMinuteStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  let offset2;
  if (obsOffset) {
    offset2 = obsOffsets[obsOffset];
  } else if (milOffset) {
    offset2 = 0;
  } else {
    offset2 = signedOffset(offHourStr, offMinuteStr);
  }
  return [result, new FixedOffsetZone(offset2)];
}
function preprocessRFC2822(s2) {
  return s2.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function extractRFC1123Or850(match2) {
  const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}
function extractASCII(match2) {
  const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}
const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
const extractISOYmdTimeAndOffset = combineExtractors(extractISOYmd, extractISOTime, extractISOOffset, extractIANAZone);
const extractISOWeekTimeAndOffset = combineExtractors(extractISOWeekData, extractISOTime, extractISOOffset, extractIANAZone);
const extractISOOrdinalDateAndTime = combineExtractors(extractISOOrdinalData, extractISOTime, extractISOOffset, extractIANAZone);
const extractISOTimeAndOffset = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseISODate(s2) {
  return parse(s2, [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset], [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime], [isoTimeCombinedRegex, extractISOTimeAndOffset]);
}
function parseRFC2822Date(s2) {
  return parse(preprocessRFC2822(s2), [rfc2822, extractRFC2822]);
}
function parseHTTPDate(s2) {
  return parse(s2, [rfc1123, extractRFC1123Or850], [rfc850, extractRFC1123Or850], [ascii, extractASCII]);
}
function parseISODuration(s2) {
  return parse(s2, [isoDuration, extractISODuration]);
}
const extractISOTimeOnly = combineExtractors(extractISOTime);
function parseISOTimeOnly(s2) {
  return parse(s2, [isoTimeOnly, extractISOTimeOnly]);
}
const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
const extractISOTimeOffsetAndIANAZone = combineExtractors(extractISOTime, extractISOOffset, extractIANAZone);
function parseSQL(s2) {
  return parse(s2, [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset], [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]);
}
const INVALID$2 = "Invalid Duration";
const lowOrderMatrix = {
  weeks: {
    days: 7,
    hours: 7 * 24,
    minutes: 7 * 24 * 60,
    seconds: 7 * 24 * 60 * 60,
    milliseconds: 7 * 24 * 60 * 60 * 1e3
  },
  days: {
    hours: 24,
    minutes: 24 * 60,
    seconds: 24 * 60 * 60,
    milliseconds: 24 * 60 * 60 * 1e3
  },
  hours: {
    minutes: 60,
    seconds: 60 * 60,
    milliseconds: 60 * 60 * 1e3
  },
  minutes: {
    seconds: 60,
    milliseconds: 60 * 1e3
  },
  seconds: {
    milliseconds: 1e3
  }
}, casualMatrix = {
  years: {
    quarters: 4,
    months: 12,
    weeks: 52,
    days: 365,
    hours: 365 * 24,
    minutes: 365 * 24 * 60,
    seconds: 365 * 24 * 60 * 60,
    milliseconds: 365 * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: 13,
    days: 91,
    hours: 91 * 24,
    minutes: 91 * 24 * 60,
    seconds: 91 * 24 * 60 * 60,
    milliseconds: 91 * 24 * 60 * 60 * 1e3
  },
  months: {
    weeks: 4,
    days: 30,
    hours: 30 * 24,
    minutes: 30 * 24 * 60,
    seconds: 30 * 24 * 60 * 60,
    milliseconds: 30 * 24 * 60 * 60 * 1e3
  },
  ...lowOrderMatrix
}, daysInYearAccurate = 146097 / 400, daysInMonthAccurate = 146097 / 4800, accurateMatrix = {
  years: {
    quarters: 4,
    months: 12,
    weeks: daysInYearAccurate / 7,
    days: daysInYearAccurate,
    hours: daysInYearAccurate * 24,
    minutes: daysInYearAccurate * 24 * 60,
    seconds: daysInYearAccurate * 24 * 60 * 60,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: daysInYearAccurate / 28,
    days: daysInYearAccurate / 4,
    hours: daysInYearAccurate * 24 / 4,
    minutes: daysInYearAccurate * 24 * 60 / 4,
    seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3 / 4
  },
  months: {
    weeks: daysInMonthAccurate / 7,
    days: daysInMonthAccurate,
    hours: daysInMonthAccurate * 24,
    minutes: daysInMonthAccurate * 24 * 60,
    seconds: daysInMonthAccurate * 24 * 60 * 60,
    milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1e3
  },
  ...lowOrderMatrix
};
const orderedUnits$1 = ["years", "quarters", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds"];
const reverseUnits = orderedUnits$1.slice(0).reverse();
function clone$1(dur, alts, clear = false) {
  const conf = {
    values: clear ? alts.values : {
      ...dur.values,
      ...alts.values || {}
    },
    loc: dur.loc.clone(alts.loc),
    conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
    matrix: alts.matrix || dur.matrix
  };
  return new Duration(conf);
}
function durationToMillis(matrix, vals) {
  var _vals$milliseconds;
  let sum = (_vals$milliseconds = vals.milliseconds) != null ? _vals$milliseconds : 0;
  for (const unit of reverseUnits.slice(1)) {
    if (vals[unit]) {
      sum += vals[unit] * matrix[unit]["milliseconds"];
    }
  }
  return sum;
}
function normalizeValues(matrix, vals) {
  const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;
  orderedUnits$1.reduceRight((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        const previousVal = vals[previous] * factor;
        const conv = matrix[current][previous];
        const rollUp = Math.floor(previousVal / conv);
        vals[current] += rollUp * factor;
        vals[previous] -= rollUp * conv * factor;
      }
      return current;
    } else {
      return previous;
    }
  }, null);
  orderedUnits$1.reduce((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        const fraction = vals[previous] % 1;
        vals[previous] -= fraction;
        vals[current] += fraction * matrix[previous][current];
      }
      return current;
    } else {
      return previous;
    }
  }, null);
}
function removeZeroes(vals) {
  const newVals = {};
  for (const [key, value] of Object.entries(vals)) {
    if (value !== 0) {
      newVals[key] = value;
    }
  }
  return newVals;
}
class Duration {
  /**
   * @private
   */
  constructor(config) {
    const accurate = config.conversionAccuracy === "longterm" || false;
    let matrix = accurate ? accurateMatrix : casualMatrix;
    if (config.matrix) {
      matrix = config.matrix;
    }
    this.values = config.values;
    this.loc = config.loc || Locale.create();
    this.conversionAccuracy = accurate ? "longterm" : "casual";
    this.invalid = config.invalid || null;
    this.matrix = matrix;
    this.isLuxonDuration = true;
  }
  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromMillis(count, opts) {
    return Duration.fromObject({
      milliseconds: count
    }, opts);
  }
  /**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
   * If this object is empty then a zero milliseconds duration is returned.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {Object} [opts=[]] - options for creating this Duration
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the custom conversion system to use
   * @return {Duration}
   */
  static fromObject(obj, opts = {}) {
    if (obj == null || typeof obj !== "object") {
      throw new InvalidArgumentError(`Duration.fromObject: argument expected to be an object, got ${obj === null ? "null" : typeof obj}`);
    }
    return new Duration({
      values: normalizeObject(obj, Duration.normalizeUnit),
      loc: Locale.fromObject(opts),
      conversionAccuracy: opts.conversionAccuracy,
      matrix: opts.matrix
    });
  }
  /**
   * Create a Duration from DurationLike.
   *
   * @param {Object | number | Duration} durationLike
   * One of:
   * - object with keys like 'years' and 'hours'.
   * - number representing milliseconds
   * - Duration instance
   * @return {Duration}
   */
  static fromDurationLike(durationLike) {
    if (isNumber(durationLike)) {
      return Duration.fromMillis(durationLike);
    } else if (Duration.isDuration(durationLike)) {
      return durationLike;
    } else if (typeof durationLike === "object") {
      return Duration.fromObject(durationLike);
    } else {
      throw new InvalidArgumentError(`Unknown duration argument ${durationLike} of type ${typeof durationLike}`);
    }
  }
  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the preset conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */
  static fromISO(text, opts) {
    const [parsed] = parseISODuration(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }
  /**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */
  static fromISOTime(text, opts) {
    const [parsed] = parseISOTimeOnly(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }
  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidDurationError(invalid);
    } else {
      return new Duration({
        invalid
      });
    }
  }
  /**
   * @private
   */
  static normalizeUnit(unit) {
    const normalized = {
      year: "years",
      years: "years",
      quarter: "quarters",
      quarters: "quarters",
      month: "months",
      months: "months",
      week: "weeks",
      weeks: "weeks",
      day: "days",
      days: "days",
      hour: "hours",
      hours: "hours",
      minute: "minutes",
      minutes: "minutes",
      second: "seconds",
      seconds: "seconds",
      millisecond: "milliseconds",
      milliseconds: "milliseconds"
    }[unit ? unit.toLowerCase() : unit];
    if (!normalized) throw new InvalidUnitError(unit);
    return normalized;
  }
  /**
   * Check if an object is a Duration. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDuration(o) {
    return o && o.isLuxonDuration || false;
  }
  /**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
   * * `S` for milliseconds
   * * `s` for seconds
   * * `m` for minutes
   * * `h` for hours
   * * `d` for days
   * * `w` for weeks
   * * `M` for months
   * * `y` for years
   * Notes:
   * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
   * * Tokens can be escaped by wrapping with single quotes.
   * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    const fmtOpts = {
      ...opts,
      floor: opts.round !== false && opts.floor !== false
    };
    return this.isValid ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt) : INVALID$2;
  }
  /**
   * Returns a string representation of a Duration with all units included.
   * To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
   * @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
   * @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
   * @example
   * ```js
   * var dur = Duration.fromObject({ days: 1, hours: 5, minutes: 6 })
   * dur.toHuman() //=> '1 day, 5 hours, 6 minutes'
   * dur.toHuman({ listStyle: "long" }) //=> '1 day, 5 hours, and 6 minutes'
   * dur.toHuman({ unitDisplay: "short" }) //=> '1 day, 5 hr, 6 min'
   * ```
   */
  toHuman(opts = {}) {
    if (!this.isValid) return INVALID$2;
    const l2 = orderedUnits$1.map((unit) => {
      const val = this.values[unit];
      if (isUndefined(val)) {
        return null;
      }
      return this.loc.numberFormatter({
        style: "unit",
        unitDisplay: "long",
        ...opts,
        unit: unit.slice(0, -1)
      }).format(val);
    }).filter((n2) => n2);
    return this.loc.listFormatter({
      type: "conjunction",
      style: opts.listStyle || "narrow",
      ...opts
    }).format(l2);
  }
  /**
   * Returns a JavaScript object with this Duration's values.
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */
  toObject() {
    if (!this.isValid) return {};
    return {
      ...this.values
    };
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
   * @return {string}
   */
  toISO() {
    if (!this.isValid) return null;
    let s2 = "P";
    if (this.years !== 0) s2 += this.years + "Y";
    if (this.months !== 0 || this.quarters !== 0) s2 += this.months + this.quarters * 3 + "M";
    if (this.weeks !== 0) s2 += this.weeks + "W";
    if (this.days !== 0) s2 += this.days + "D";
    if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0) s2 += "T";
    if (this.hours !== 0) s2 += this.hours + "H";
    if (this.minutes !== 0) s2 += this.minutes + "M";
    if (this.seconds !== 0 || this.milliseconds !== 0)
      s2 += roundTo(this.seconds + this.milliseconds / 1e3, 3) + "S";
    if (s2 === "P") s2 += "T0S";
    return s2;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
   * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
   * @return {string}
   */
  toISOTime(opts = {}) {
    if (!this.isValid) return null;
    const millis = this.toMillis();
    if (millis < 0 || millis >= 864e5) return null;
    opts = {
      suppressMilliseconds: false,
      suppressSeconds: false,
      includePrefix: false,
      format: "extended",
      ...opts,
      includeOffset: false
    };
    const dateTime = DateTime.fromMillis(millis, {
      zone: "UTC"
    });
    return dateTime.toISOTime(opts);
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */
  toString() {
    return this.toISO();
  }
  /**
   * Returns a string representation of this Duration appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `Duration { values: ${JSON.stringify(this.values)} }`;
    } else {
      return `Duration { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns an milliseconds value of this Duration.
   * @return {number}
   */
  toMillis() {
    if (!this.isValid) return NaN;
    return durationToMillis(this.matrix, this.values);
  }
  /**
   * Returns an milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration), result = {};
    for (const k of orderedUnits$1) {
      if (hasOwnProperty(dur.values, k) || hasOwnProperty(this.values, k)) {
        result[k] = dur.get(k) + this.get(k);
      }
    }
    return clone$1(this, {
      values: result
    }, true);
  }
  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return this.plus(dur.negate());
  }
  /**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
   * @return {Duration}
   */
  mapUnits(fn) {
    if (!this.isValid) return this;
    const result = {};
    for (const k of Object.keys(this.values)) {
      result[k] = asNumber(fn(this.values[k], k));
    }
    return clone$1(this, {
      values: result
    }, true);
  }
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
   * @return {number}
   */
  get(unit) {
    return this[Duration.normalizeUnit(unit)];
  }
  /**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */
  set(values) {
    if (!this.isValid) return this;
    const mixed = {
      ...this.values,
      ...normalizeObject(values, Duration.normalizeUnit)
    };
    return clone$1(this, {
      values: mixed
    });
  }
  /**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */
  reconfigure({
    locale,
    numberingSystem,
    conversionAccuracy,
    matrix
  } = {}) {
    const loc = this.loc.clone({
      locale,
      numberingSystem
    });
    const opts = {
      loc,
      matrix,
      conversionAccuracy
    };
    return clone$1(this, opts);
  }
  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */
  as(unit) {
    return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
  }
  /**
   * Reduce this Duration to its canonical representation in its current units.
   * Assuming the overall value of the Duration is positive, this means:
   * - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
   * - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
   *   the overall value would be negative, see third example)
   * - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
   *
   * If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
   * @return {Duration}
   */
  normalize() {
    if (!this.isValid) return this;
    const vals = this.toObject();
    normalizeValues(this.matrix, vals);
    return clone$1(this, {
      values: vals
    }, true);
  }
  /**
   * Rescale units to its largest representation
   * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
   * @return {Duration}
   */
  rescale() {
    if (!this.isValid) return this;
    const vals = removeZeroes(this.normalize().shiftToAll().toObject());
    return clone$1(this, {
      values: vals
    }, true);
  }
  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */
  shiftTo(...units) {
    if (!this.isValid) return this;
    if (units.length === 0) {
      return this;
    }
    units = units.map((u) => Duration.normalizeUnit(u));
    const built = {}, accumulated = {}, vals = this.toObject();
    let lastUnit;
    for (const k of orderedUnits$1) {
      if (units.indexOf(k) >= 0) {
        lastUnit = k;
        let own = 0;
        for (const ak in accumulated) {
          own += this.matrix[ak][k] * accumulated[ak];
          accumulated[ak] = 0;
        }
        if (isNumber(vals[k])) {
          own += vals[k];
        }
        const i = Math.trunc(own);
        built[k] = i;
        accumulated[k] = (own * 1e3 - i * 1e3) / 1e3;
      } else if (isNumber(vals[k])) {
        accumulated[k] = vals[k];
      }
    }
    for (const key in accumulated) {
      if (accumulated[key] !== 0) {
        built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
      }
    }
    normalizeValues(this.matrix, built);
    return clone$1(this, {
      values: built
    }, true);
  }
  /**
   * Shift this Duration to all available units.
   * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
   * @return {Duration}
   */
  shiftToAll() {
    if (!this.isValid) return this;
    return this.shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds");
  }
  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */
  negate() {
    if (!this.isValid) return this;
    const negated = {};
    for (const k of Object.keys(this.values)) {
      negated[k] = this.values[k] === 0 ? 0 : -this.values[k];
    }
    return clone$1(this, {
      values: negated
    }, true);
  }
  /**
   * Get the years.
   * @type {number}
   */
  get years() {
    return this.isValid ? this.values.years || 0 : NaN;
  }
  /**
   * Get the quarters.
   * @type {number}
   */
  get quarters() {
    return this.isValid ? this.values.quarters || 0 : NaN;
  }
  /**
   * Get the months.
   * @type {number}
   */
  get months() {
    return this.isValid ? this.values.months || 0 : NaN;
  }
  /**
   * Get the weeks
   * @type {number}
   */
  get weeks() {
    return this.isValid ? this.values.weeks || 0 : NaN;
  }
  /**
   * Get the days.
   * @type {number}
   */
  get days() {
    return this.isValid ? this.values.days || 0 : NaN;
  }
  /**
   * Get the hours.
   * @type {number}
   */
  get hours() {
    return this.isValid ? this.values.hours || 0 : NaN;
  }
  /**
   * Get the minutes.
   * @type {number}
   */
  get minutes() {
    return this.isValid ? this.values.minutes || 0 : NaN;
  }
  /**
   * Get the seconds.
   * @return {number}
   */
  get seconds() {
    return this.isValid ? this.values.seconds || 0 : NaN;
  }
  /**
   * Get the milliseconds.
   * @return {number}
   */
  get milliseconds() {
    return this.isValid ? this.values.milliseconds || 0 : NaN;
  }
  /**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }
    if (!this.loc.equals(other.loc)) {
      return false;
    }
    function eq2(v1, v2) {
      if (v1 === void 0 || v1 === 0) return v2 === void 0 || v2 === 0;
      return v1 === v2;
    }
    for (const u of orderedUnits$1) {
      if (!eq2(this.values[u], other.values[u])) {
        return false;
      }
    }
    return true;
  }
}
const INVALID$1 = "Invalid Interval";
function validateStartEnd(start, end) {
  if (!start || !start.isValid) {
    return Interval.invalid("missing or invalid start");
  } else if (!end || !end.isValid) {
    return Interval.invalid("missing or invalid end");
  } else if (end < start) {
    return Interval.invalid("end before start", `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`);
  } else {
    return null;
  }
}
class Interval {
  /**
   * @private
   */
  constructor(config) {
    this.s = config.start;
    this.e = config.end;
    this.invalid = config.invalid || null;
    this.isLuxonInterval = true;
  }
  /**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidIntervalError(invalid);
    } else {
      return new Interval({
        invalid
      });
    }
  }
  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(start, end) {
    const builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
    const validateError = validateStartEnd(builtStart, builtEnd);
    if (validateError == null) {
      return new Interval({
        start: builtStart,
        end: builtEnd
      });
    } else {
      return validateError;
    }
  }
  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(start, duration) {
    const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(start);
    return Interval.fromDateTimes(dt, dt.plus(dur));
  }
  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(end, duration) {
    const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(end);
    return Interval.fromDateTimes(dt.minus(dur), dt);
  }
  /**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */
  static fromISO(text, opts) {
    const [s2, e] = (text || "").split("/", 2);
    if (s2 && e) {
      let start, startIsValid;
      try {
        start = DateTime.fromISO(s2, opts);
        startIsValid = start.isValid;
      } catch (e2) {
        startIsValid = false;
      }
      let end, endIsValid;
      try {
        end = DateTime.fromISO(e, opts);
        endIsValid = end.isValid;
      } catch (e2) {
        endIsValid = false;
      }
      if (startIsValid && endIsValid) {
        return Interval.fromDateTimes(start, end);
      }
      if (startIsValid) {
        const dur = Duration.fromISO(e, opts);
        if (dur.isValid) {
          return Interval.after(start, dur);
        }
      } else if (endIsValid) {
        const dur = Duration.fromISO(s2, opts);
        if (dur.isValid) {
          return Interval.before(end, dur);
        }
      }
    }
    return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
  }
  /**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isInterval(o) {
    return o && o.isLuxonInterval || false;
  }
  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */
  get start() {
    return this.isValid ? this.s : null;
  }
  /**
   * Returns the end of the Interval
   * @type {DateTime}
   */
  get end() {
    return this.isValid ? this.e : null;
  }
  /**
   * Returns the last DateTime included in the interval (since end is not part of the interval)
   * @type {DateTime}
   */
  get lastDateTime() {
    return this.isValid ? this.e ? this.e.minus(1) : null : null;
  }
  /**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */
  get isValid() {
    return this.invalidReason === null;
  }
  /**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(unit = "milliseconds") {
    return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
  }
  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
   * @return {number}
   */
  count(unit = "milliseconds", opts) {
    if (!this.isValid) return NaN;
    const start = this.start.startOf(unit, opts);
    let end;
    if (opts != null && opts.useLocaleWeeks) {
      end = this.end.reconfigure({
        locale: start.locale
      });
    } else {
      end = this.end;
    }
    end = end.startOf(unit, opts);
    return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
  }
  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(unit) {
    return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
  }
  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  }
  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isAfter(dateTime) {
    if (!this.isValid) return false;
    return this.s > dateTime;
  }
  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isBefore(dateTime) {
    if (!this.isValid) return false;
    return this.e <= dateTime;
  }
  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(dateTime) {
    if (!this.isValid) return false;
    return this.s <= dateTime && this.e > dateTime;
  }
  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */
  set({
    start,
    end
  } = {}) {
    if (!this.isValid) return this;
    return Interval.fromDateTimes(start || this.s, end || this.e);
  }
  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...dateTimes) {
    if (!this.isValid) return [];
    const sorted2 = dateTimes.map(friendlyDateTime).filter((d) => this.contains(d)).sort((a, b) => a.toMillis() - b.toMillis()), results = [];
    let {
      s: s2
    } = this, i = 0;
    while (s2 < this.e) {
      const added = sorted2[i] || this.e, next2 = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s2, next2));
      s2 = next2;
      i += 1;
    }
    return results;
  }
  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(duration) {
    const dur = Duration.fromDurationLike(duration);
    if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) {
      return [];
    }
    let {
      s: s2
    } = this, idx = 1, next2;
    const results = [];
    while (s2 < this.e) {
      const added = this.start.plus(dur.mapUnits((x) => x * idx));
      next2 = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s2, next2));
      s2 = next2;
      idx += 1;
    }
    return results;
  }
  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */
  divideEqually(numberOfParts) {
    if (!this.isValid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  }
  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(other) {
    return this.e > other.s && this.s < other.e;
  }
  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(other) {
    if (!this.isValid) return false;
    return +this.e === +other.s;
  }
  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(other) {
    if (!this.isValid) return false;
    return +other.e === +this.s;
  }
  /**
   * Returns true if this Interval fully contains the specified Interval, specifically if the intersect (of this Interval and the other Interval) is equal to the other Interval; false otherwise.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(other) {
    if (!this.isValid) return false;
    return this.s <= other.s && this.e >= other.e;
  }
  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }
    return this.s.equals(other.s) && this.e.equals(other.e);
  }
  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(other) {
    if (!this.isValid) return this;
    const s2 = this.s > other.s ? this.s : other.s, e = this.e < other.e ? this.e : other.e;
    if (s2 >= e) {
      return null;
    } else {
      return Interval.fromDateTimes(s2, e);
    }
  }
  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(other) {
    if (!this.isValid) return this;
    const s2 = this.s < other.s ? this.s : other.s, e = this.e > other.e ? this.e : other.e;
    return Interval.fromDateTimes(s2, e);
  }
  /**
   * Merge an array of Intervals into an equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * The resulting array will contain the Intervals in ascending order, that is, starting with the earliest Interval
   * and ending with the latest.
   *
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(intervals) {
    const [found, final] = intervals.sort((a, b) => a.s - b.s).reduce(([sofar, current], item) => {
      if (!current) {
        return [sofar, item];
      } else if (current.overlaps(item) || current.abutsStart(item)) {
        return [sofar, current.union(item)];
      } else {
        return [sofar.concat([current]), item];
      }
    }, [[], null]);
    if (final) {
      found.push(final);
    }
    return found;
  }
  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(intervals) {
    let start = null, currentCount = 0;
    const results = [], ends = intervals.map((i) => [{
      time: i.s,
      type: "s"
    }, {
      time: i.e,
      type: "e"
    }]), flattened = Array.prototype.concat(...ends), arr = flattened.sort((a, b) => a.time - b.time);
    for (const i of arr) {
      currentCount += i.type === "s" ? 1 : -1;
      if (currentCount === 1) {
        start = i.time;
      } else {
        if (start && +start !== +i.time) {
          results.push(Interval.fromDateTimes(start, i.time));
        }
        start = null;
      }
    }
    return Interval.merge(results);
  }
  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...intervals) {
    return Interval.xor([this].concat(intervals)).map((i) => this.intersection(i)).filter((i) => i && !i.isEmpty());
  }
  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    if (!this.isValid) return INVALID$1;
    return `[${this.s.toISO()} – ${this.e.toISO()})`;
  }
  /**
   * Returns a string representation of this Interval appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;
    } else {
      return `Interval { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns a localized string representing this Interval. Accepts the same options as the
   * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
   * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
   * is browser-specific, but in general it will return an appropriate representation of the
   * Interval in the assigned locale. Defaults to the system's locale if no locale has been
   * specified.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
   * Intl.DateTimeFormat constructor options.
   * @param {Object} opts - Options to override the configuration of the start DateTime.
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this) : INVALID$1;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(opts) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
  }
  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISODate()}/${this.e.toISODate()}`;
  }
  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(opts) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
  }
  /**
   * Returns a string representation of this Interval formatted according to the specified format
   * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
   * formatting tool.
   * @param {string} dateFormat - The format string. This string formats the start and end time.
   * See {@link DateTime#toFormat} for details.
   * @param {Object} opts - Options.
   * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
   * representations.
   * @return {string}
   */
  toFormat(dateFormat, {
    separator = " – "
  } = {}) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
  }
  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(unit, opts) {
    if (!this.isValid) {
      return Duration.invalid(this.invalidReason);
    }
    return this.e.diff(this.s, unit, opts);
  }
  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(mapFn) {
    return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
  }
}
class Info {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(zone = Settings.defaultZone) {
    const proto = DateTime.now().setZone(zone).set({
      month: 12
    });
    return !zone.isUniversal && proto.offset !== proto.set({
      month: 6
    }).offset;
  }
  /**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */
  static isValidIANAZone(zone) {
    return IANAZone.isValidZone(zone);
  }
  /**
   * Converts the input into a {@link Zone} instance.
   *
   * * If `input` is already a Zone instance, it is returned unchanged.
   * * If `input` is a string containing a valid time zone name, a Zone instance
   *   with that name is returned.
   * * If `input` is a string that doesn't refer to a known time zone, a Zone
   *   instance with {@link Zone#isValid} == false is returned.
   * * If `input is a number, a Zone instance with the specified fixed offset
   *   in minutes is returned.
   * * If `input` is `null` or `undefined`, the default zone is returned.
   * @param {string|Zone|number} [input] - the value to be converted
   * @return {Zone}
   */
  static normalizeZone(input) {
    return normalizeZone(input, Settings.defaultZone);
  }
  /**
   * Get the weekday on which the week starts according to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number} the start of the week, 1 for Monday through 7 for Sunday
   */
  static getStartOfWeek({
    locale = null,
    locObj = null
  } = {}) {
    return (locObj || Locale.create(locale)).getStartOfWeek();
  }
  /**
   * Get the minimum number of days necessary in a week before it is considered part of the next year according
   * to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number}
   */
  static getMinimumDaysInFirstWeek({
    locale = null,
    locObj = null
  } = {}) {
    return (locObj || Locale.create(locale)).getMinDaysInFirstWeek();
  }
  /**
   * Get the weekdays, which are considered the weekend according to the given locale
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
   */
  static getWeekendWeekdays({
    locale = null,
    locObj = null
  } = {}) {
    return (locObj || Locale.create(locale)).getWeekendDays().slice();
  }
  /**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {Array}
   */
  static months(length = "long", {
    locale = null,
    numberingSystem = null,
    locObj = null,
    outputCalendar = "gregory"
  } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
  }
  /**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link Info#months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {Array}
   */
  static monthsFormat(length = "long", {
    locale = null,
    numberingSystem = null,
    locObj = null,
    outputCalendar = "gregory"
  } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
  }
  /**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {Array}
   */
  static weekdays(length = "long", {
    locale = null,
    numberingSystem = null,
    locObj = null
  } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
  }
  /**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link Info#weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @return {Array}
   */
  static weekdaysFormat(length = "long", {
    locale = null,
    numberingSystem = null,
    locObj = null
  } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
  }
  /**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
   * @return {Array}
   */
  static meridiems({
    locale = null
  } = {}) {
    return Locale.create(locale).meridiems();
  }
  /**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {Array}
   */
  static eras(length = "short", {
    locale = null
  } = {}) {
    return Locale.create(locale, null, "gregory").eras(length);
  }
  /**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `relative`: whether this environment supports relative time formatting
   * * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
   * @example Info.features() //=> { relative: false, localeWeek: true }
   * @return {Object}
   */
  static features() {
    return {
      relative: hasRelative(),
      localeWeek: hasLocaleWeekInfo()
    };
  }
}
function dayDiff(earlier, later) {
  const utcDayStart = (dt) => dt.toUTC(0, {
    keepLocalTime: true
  }).startOf("day").valueOf(), ms2 = utcDayStart(later) - utcDayStart(earlier);
  return Math.floor(Duration.fromMillis(ms2).as("days"));
}
function highOrderDiffs(cursor, later, units) {
  const differs = [["years", (a, b) => b.year - a.year], ["quarters", (a, b) => b.quarter - a.quarter + (b.year - a.year) * 4], ["months", (a, b) => b.month - a.month + (b.year - a.year) * 12], ["weeks", (a, b) => {
    const days = dayDiff(a, b);
    return (days - days % 7) / 7;
  }], ["days", dayDiff]];
  const results = {};
  const earlier = cursor;
  let lowestOrder, highWater;
  for (const [unit, differ] of differs) {
    if (units.indexOf(unit) >= 0) {
      lowestOrder = unit;
      results[unit] = differ(cursor, later);
      highWater = earlier.plus(results);
      if (highWater > later) {
        results[unit]--;
        cursor = earlier.plus(results);
        if (cursor > later) {
          highWater = cursor;
          results[unit]--;
          cursor = earlier.plus(results);
        }
      } else {
        cursor = highWater;
      }
    }
  }
  return [cursor, results, highWater, lowestOrder];
}
function diff(earlier, later, units, opts) {
  let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);
  const remainingMillis = later - cursor;
  const lowerOrderUnits = units.filter((u) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(u) >= 0);
  if (lowerOrderUnits.length === 0) {
    if (highWater < later) {
      highWater = cursor.plus({
        [lowestOrder]: 1
      });
    }
    if (highWater !== cursor) {
      results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
    }
  }
  const duration = Duration.fromObject(results, opts);
  if (lowerOrderUnits.length > 0) {
    return Duration.fromMillis(remainingMillis, opts).shiftTo(...lowerOrderUnits).plus(duration);
  } else {
    return duration;
  }
}
const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
function intUnit(regex, post = (i) => i) {
  return {
    regex,
    deser: ([s2]) => post(parseDigits(s2))
  };
}
const NBSP = String.fromCharCode(160);
const spaceOrNBSP = `[ ${NBSP}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
function fixListRegex(s2) {
  return s2.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
}
function stripInsensitivities(s2) {
  return s2.replace(/\./g, "").replace(spaceOrNBSPRegExp, " ").toLowerCase();
}
function oneOf(strings, startIndex) {
  if (strings === null) {
    return null;
  } else {
    return {
      regex: RegExp(strings.map(fixListRegex).join("|")),
      deser: ([s2]) => strings.findIndex((i) => stripInsensitivities(s2) === stripInsensitivities(i)) + startIndex
    };
  }
}
function offset(regex, groups) {
  return {
    regex,
    deser: ([, h, m]) => signedOffset(h, m),
    groups
  };
}
function simple(regex) {
  return {
    regex,
    deser: ([s2]) => s2
  };
}
function escapeToken(value) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function unitForToken(token, loc) {
  const one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = (t) => ({
    regex: RegExp(escapeToken(t.val)),
    deser: ([s2]) => s2,
    literal: true
  }), unitate = (t) => {
    if (token.literal) {
      return literal(t);
    }
    switch (t.val) {
      case "G":
        return oneOf(loc.eras("short"), 0);
      case "GG":
        return oneOf(loc.eras("long"), 0);
      case "y":
        return intUnit(oneToSix);
      case "yy":
        return intUnit(twoToFour, untruncateYear);
      case "yyyy":
        return intUnit(four);
      case "yyyyy":
        return intUnit(fourToSix);
      case "yyyyyy":
        return intUnit(six);
      case "M":
        return intUnit(oneOrTwo);
      case "MM":
        return intUnit(two);
      case "MMM":
        return oneOf(loc.months("short", true), 1);
      case "MMMM":
        return oneOf(loc.months("long", true), 1);
      case "L":
        return intUnit(oneOrTwo);
      case "LL":
        return intUnit(two);
      case "LLL":
        return oneOf(loc.months("short", false), 1);
      case "LLLL":
        return oneOf(loc.months("long", false), 1);
      case "d":
        return intUnit(oneOrTwo);
      case "dd":
        return intUnit(two);
      case "o":
        return intUnit(oneToThree);
      case "ooo":
        return intUnit(three);
      case "HH":
        return intUnit(two);
      case "H":
        return intUnit(oneOrTwo);
      case "hh":
        return intUnit(two);
      case "h":
        return intUnit(oneOrTwo);
      case "mm":
        return intUnit(two);
      case "m":
        return intUnit(oneOrTwo);
      case "q":
        return intUnit(oneOrTwo);
      case "qq":
        return intUnit(two);
      case "s":
        return intUnit(oneOrTwo);
      case "ss":
        return intUnit(two);
      case "S":
        return intUnit(oneToThree);
      case "SSS":
        return intUnit(three);
      case "u":
        return simple(oneToNine);
      case "uu":
        return simple(oneOrTwo);
      case "uuu":
        return intUnit(one);
      case "a":
        return oneOf(loc.meridiems(), 0);
      case "kkkk":
        return intUnit(four);
      case "kk":
        return intUnit(twoToFour, untruncateYear);
      case "W":
        return intUnit(oneOrTwo);
      case "WW":
        return intUnit(two);
      case "E":
      case "c":
        return intUnit(one);
      case "EEE":
        return oneOf(loc.weekdays("short", false), 1);
      case "EEEE":
        return oneOf(loc.weekdays("long", false), 1);
      case "ccc":
        return oneOf(loc.weekdays("short", true), 1);
      case "cccc":
        return oneOf(loc.weekdays("long", true), 1);
      case "Z":
      case "ZZ":
        return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
      case "ZZZ":
        return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
      case "z":
        return simple(/[a-z_+-/]{1,256}?/i);
      case " ":
        return simple(/[^\S\n\r]/);
      default:
        return literal(t);
    }
  };
  const unit = unitate(token) || {
    invalidReason: MISSING_FTP
  };
  unit.token = token;
  return unit;
}
const partTypeStyleToTokenVal = {
  year: {
    "2-digit": "yy",
    numeric: "yyyyy"
  },
  month: {
    numeric: "M",
    "2-digit": "MM",
    short: "MMM",
    long: "MMMM"
  },
  day: {
    numeric: "d",
    "2-digit": "dd"
  },
  weekday: {
    short: "EEE",
    long: "EEEE"
  },
  dayperiod: "a",
  dayPeriod: "a",
  hour12: {
    numeric: "h",
    "2-digit": "hh"
  },
  hour24: {
    numeric: "H",
    "2-digit": "HH"
  },
  minute: {
    numeric: "m",
    "2-digit": "mm"
  },
  second: {
    numeric: "s",
    "2-digit": "ss"
  },
  timeZoneName: {
    long: "ZZZZZ",
    short: "ZZZ"
  }
};
function tokenForPart(part, formatOpts, resolvedOpts) {
  const {
    type: type2,
    value
  } = part;
  if (type2 === "literal") {
    const isSpace = /^\s+$/.test(value);
    return {
      literal: !isSpace,
      val: isSpace ? " " : value
    };
  }
  const style = formatOpts[type2];
  let actualType = type2;
  if (type2 === "hour") {
    if (formatOpts.hour12 != null) {
      actualType = formatOpts.hour12 ? "hour12" : "hour24";
    } else if (formatOpts.hourCycle != null) {
      if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") {
        actualType = "hour12";
      } else {
        actualType = "hour24";
      }
    } else {
      actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
    }
  }
  let val = partTypeStyleToTokenVal[actualType];
  if (typeof val === "object") {
    val = val[style];
  }
  if (val) {
    return {
      literal: false,
      val
    };
  }
  return void 0;
}
function buildRegex(units) {
  const re = units.map((u) => u.regex).reduce((f, r) => `${f}(${r.source})`, "");
  return [`^${re}$`, units];
}
function match(input, regex, handlers) {
  const matches = input.match(regex);
  if (matches) {
    const all = {};
    let matchIndex = 1;
    for (const i in handlers) {
      if (hasOwnProperty(handlers, i)) {
        const h = handlers[i], groups = h.groups ? h.groups + 1 : 1;
        if (!h.literal && h.token) {
          all[h.token.val[0]] = h.deser(matches.slice(matchIndex, matchIndex + groups));
        }
        matchIndex += groups;
      }
    }
    return [matches, all];
  } else {
    return [matches, {}];
  }
}
function dateTimeFromMatches(matches) {
  const toField = (token) => {
    switch (token) {
      case "S":
        return "millisecond";
      case "s":
        return "second";
      case "m":
        return "minute";
      case "h":
      case "H":
        return "hour";
      case "d":
        return "day";
      case "o":
        return "ordinal";
      case "L":
      case "M":
        return "month";
      case "y":
        return "year";
      case "E":
      case "c":
        return "weekday";
      case "W":
        return "weekNumber";
      case "k":
        return "weekYear";
      case "q":
        return "quarter";
      default:
        return null;
    }
  };
  let zone = null;
  let specificOffset;
  if (!isUndefined(matches.z)) {
    zone = IANAZone.create(matches.z);
  }
  if (!isUndefined(matches.Z)) {
    if (!zone) {
      zone = new FixedOffsetZone(matches.Z);
    }
    specificOffset = matches.Z;
  }
  if (!isUndefined(matches.q)) {
    matches.M = (matches.q - 1) * 3 + 1;
  }
  if (!isUndefined(matches.h)) {
    if (matches.h < 12 && matches.a === 1) {
      matches.h += 12;
    } else if (matches.h === 12 && matches.a === 0) {
      matches.h = 0;
    }
  }
  if (matches.G === 0 && matches.y) {
    matches.y = -matches.y;
  }
  if (!isUndefined(matches.u)) {
    matches.S = parseMillis(matches.u);
  }
  const vals = Object.keys(matches).reduce((r, k) => {
    const f = toField(k);
    if (f) {
      r[f] = matches[k];
    }
    return r;
  }, {});
  return [vals, zone, specificOffset];
}
let dummyDateTimeCache = null;
function getDummyDateTime() {
  if (!dummyDateTimeCache) {
    dummyDateTimeCache = DateTime.fromMillis(1555555555555);
  }
  return dummyDateTimeCache;
}
function maybeExpandMacroToken(token, locale) {
  if (token.literal) {
    return token;
  }
  const formatOpts = Formatter.macroTokenToFormatOpts(token.val);
  const tokens = formatOptsToTokens(formatOpts, locale);
  if (tokens == null || tokens.includes(void 0)) {
    return token;
  }
  return tokens;
}
function expandMacroTokens(tokens, locale) {
  return Array.prototype.concat(...tokens.map((t) => maybeExpandMacroToken(t, locale)));
}
class TokenParser {
  constructor(locale, format) {
    this.locale = locale;
    this.format = format;
    this.tokens = expandMacroTokens(Formatter.parseFormat(format), locale);
    this.units = this.tokens.map((t) => unitForToken(t, locale));
    this.disqualifyingUnit = this.units.find((t) => t.invalidReason);
    if (!this.disqualifyingUnit) {
      const [regexString, handlers] = buildRegex(this.units);
      this.regex = RegExp(regexString, "i");
      this.handlers = handlers;
    }
  }
  explainFromTokens(input) {
    if (!this.isValid) {
      return {
        input,
        tokens: this.tokens,
        invalidReason: this.invalidReason
      };
    } else {
      const [rawMatches, matches] = match(input, this.regex, this.handlers), [result, zone, specificOffset] = matches ? dateTimeFromMatches(matches) : [null, null, void 0];
      if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) {
        throw new ConflictingSpecificationError("Can't include meridiem when specifying 24-hour format");
      }
      return {
        input,
        tokens: this.tokens,
        regex: this.regex,
        rawMatches,
        matches,
        result,
        zone,
        specificOffset
      };
    }
  }
  get isValid() {
    return !this.disqualifyingUnit;
  }
  get invalidReason() {
    return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
  }
}
function explainFromTokens(locale, input, format) {
  const parser4 = new TokenParser(locale, format);
  return parser4.explainFromTokens(input);
}
function parseFromTokens(locale, input, format) {
  const {
    result,
    zone,
    specificOffset,
    invalidReason
  } = explainFromTokens(locale, input, format);
  return [result, zone, specificOffset, invalidReason];
}
function formatOptsToTokens(formatOpts, locale) {
  if (!formatOpts) {
    return null;
  }
  const formatter = Formatter.create(locale, formatOpts);
  const df = formatter.dtFormatter(getDummyDateTime());
  const parts = df.formatToParts();
  const resolvedOpts = df.resolvedOptions();
  return parts.map((p) => tokenForPart(p, formatOpts, resolvedOpts));
}
const INVALID = "Invalid DateTime";
const MAX_DATE = 864e13;
function unsupportedZone(zone) {
  return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
}
function possiblyCachedWeekData(dt) {
  if (dt.weekData === null) {
    dt.weekData = gregorianToWeek(dt.c);
  }
  return dt.weekData;
}
function possiblyCachedLocalWeekData(dt) {
  if (dt.localWeekData === null) {
    dt.localWeekData = gregorianToWeek(dt.c, dt.loc.getMinDaysInFirstWeek(), dt.loc.getStartOfWeek());
  }
  return dt.localWeekData;
}
function clone(inst, alts) {
  const current = {
    ts: inst.ts,
    zone: inst.zone,
    c: inst.c,
    o: inst.o,
    loc: inst.loc,
    invalid: inst.invalid
  };
  return new DateTime({
    ...current,
    ...alts,
    old: current
  });
}
function fixOffset(localTS, o, tz) {
  let utcGuess = localTS - o * 60 * 1e3;
  const o2 = tz.offset(utcGuess);
  if (o === o2) {
    return [utcGuess, o];
  }
  utcGuess -= (o2 - o) * 60 * 1e3;
  const o3 = tz.offset(utcGuess);
  if (o2 === o3) {
    return [utcGuess, o2];
  }
  return [localTS - Math.min(o2, o3) * 60 * 1e3, Math.max(o2, o3)];
}
function tsToObj(ts, offset2) {
  ts += offset2 * 60 * 1e3;
  const d = new Date(ts);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    millisecond: d.getUTCMilliseconds()
  };
}
function objToTS(obj, offset2, zone) {
  return fixOffset(objToLocalTS(obj), offset2, zone);
}
function adjustTime(inst, dur) {
  const oPre = inst.o, year = inst.c.year + Math.trunc(dur.years), month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c = {
    ...inst.c,
    year,
    month,
    day: Math.min(inst.c.day, daysInMonth(year, month)) + Math.trunc(dur.days) + Math.trunc(dur.weeks) * 7
  }, millisToAdd = Duration.fromObject({
    years: dur.years - Math.trunc(dur.years),
    quarters: dur.quarters - Math.trunc(dur.quarters),
    months: dur.months - Math.trunc(dur.months),
    weeks: dur.weeks - Math.trunc(dur.weeks),
    days: dur.days - Math.trunc(dur.days),
    hours: dur.hours,
    minutes: dur.minutes,
    seconds: dur.seconds,
    milliseconds: dur.milliseconds
  }).as("milliseconds"), localTS = objToLocalTS(c);
  let [ts, o] = fixOffset(localTS, oPre, inst.zone);
  if (millisToAdd !== 0) {
    ts += millisToAdd;
    o = inst.zone.offset(ts);
  }
  return {
    ts,
    o
  };
}
function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
  const {
    setZone,
    zone
  } = opts;
  if (parsed && Object.keys(parsed).length !== 0 || parsedZone) {
    const interpretationZone = parsedZone || zone, inst = DateTime.fromObject(parsed, {
      ...opts,
      zone: interpretationZone,
      specificOffset
    });
    return setZone ? inst : inst.setZone(zone);
  } else {
    return DateTime.invalid(new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`));
  }
}
function toTechFormat(dt, format, allowZ = true) {
  return dt.isValid ? Formatter.create(Locale.create("en-US"), {
    allowZ,
    forceSimple: true
  }).formatDateTimeFromString(dt, format) : null;
}
function toISODate(o, extended) {
  const longFormat = o.c.year > 9999 || o.c.year < 0;
  let c = "";
  if (longFormat && o.c.year >= 0) c += "+";
  c += padStart(o.c.year, longFormat ? 6 : 4);
  if (extended) {
    c += "-";
    c += padStart(o.c.month);
    c += "-";
    c += padStart(o.c.day);
  } else {
    c += padStart(o.c.month);
    c += padStart(o.c.day);
  }
  return c;
}
function toISOTime(o, extended, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone) {
  let c = padStart(o.c.hour);
  if (extended) {
    c += ":";
    c += padStart(o.c.minute);
    if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) {
      c += ":";
    }
  } else {
    c += padStart(o.c.minute);
  }
  if (o.c.millisecond !== 0 || o.c.second !== 0 || !suppressSeconds) {
    c += padStart(o.c.second);
    if (o.c.millisecond !== 0 || !suppressMilliseconds) {
      c += ".";
      c += padStart(o.c.millisecond, 3);
    }
  }
  if (includeOffset) {
    if (o.isOffsetFixed && o.offset === 0 && !extendedZone) {
      c += "Z";
    } else if (o.o < 0) {
      c += "-";
      c += padStart(Math.trunc(-o.o / 60));
      c += ":";
      c += padStart(Math.trunc(-o.o % 60));
    } else {
      c += "+";
      c += padStart(Math.trunc(o.o / 60));
      c += ":";
      c += padStart(Math.trunc(o.o % 60));
    }
  }
  if (extendedZone) {
    c += "[" + o.zone.ianaName + "]";
  }
  return c;
}
const defaultUnitValues = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, defaultWeekUnitValues = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, defaultOrdinalUnitValues = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
};
const orderedUnits = ["year", "month", "day", "hour", "minute", "second", "millisecond"], orderedWeekUnits = ["weekYear", "weekNumber", "weekday", "hour", "minute", "second", "millisecond"], orderedOrdinalUnits = ["year", "ordinal", "hour", "minute", "second", "millisecond"];
function normalizeUnit(unit) {
  const normalized = {
    year: "year",
    years: "year",
    month: "month",
    months: "month",
    day: "day",
    days: "day",
    hour: "hour",
    hours: "hour",
    minute: "minute",
    minutes: "minute",
    quarter: "quarter",
    quarters: "quarter",
    second: "second",
    seconds: "second",
    millisecond: "millisecond",
    milliseconds: "millisecond",
    weekday: "weekday",
    weekdays: "weekday",
    weeknumber: "weekNumber",
    weeksnumber: "weekNumber",
    weeknumbers: "weekNumber",
    weekyear: "weekYear",
    weekyears: "weekYear",
    ordinal: "ordinal"
  }[unit.toLowerCase()];
  if (!normalized) throw new InvalidUnitError(unit);
  return normalized;
}
function normalizeUnitWithLocalWeeks(unit) {
  switch (unit.toLowerCase()) {
    case "localweekday":
    case "localweekdays":
      return "localWeekday";
    case "localweeknumber":
    case "localweeknumbers":
      return "localWeekNumber";
    case "localweekyear":
    case "localweekyears":
      return "localWeekYear";
    default:
      return normalizeUnit(unit);
  }
}
function guessOffsetForZone(zone) {
  if (zoneOffsetTs === void 0) {
    zoneOffsetTs = Settings.now();
  }
  if (zone.type !== "iana") {
    return zone.offset(zoneOffsetTs);
  }
  const zoneName = zone.name;
  let offsetGuess = zoneOffsetGuessCache.get(zoneName);
  if (offsetGuess === void 0) {
    offsetGuess = zone.offset(zoneOffsetTs);
    zoneOffsetGuessCache.set(zoneName, offsetGuess);
  }
  return offsetGuess;
}
function quickDT(obj, opts) {
  const zone = normalizeZone(opts.zone, Settings.defaultZone);
  if (!zone.isValid) {
    return DateTime.invalid(unsupportedZone(zone));
  }
  const loc = Locale.fromObject(opts);
  let ts, o;
  if (!isUndefined(obj.year)) {
    for (const u of orderedUnits) {
      if (isUndefined(obj[u])) {
        obj[u] = defaultUnitValues[u];
      }
    }
    const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
    if (invalid) {
      return DateTime.invalid(invalid);
    }
    const offsetProvis = guessOffsetForZone(zone);
    [ts, o] = objToTS(obj, offsetProvis, zone);
  } else {
    ts = Settings.now();
  }
  return new DateTime({
    ts,
    zone,
    loc,
    o
  });
}
function diffRelative(start, end, opts) {
  const round = isUndefined(opts.round) ? true : opts.round, format = (c, unit) => {
    c = roundTo(c, round || opts.calendary ? 0 : 2, true);
    const formatter = end.loc.clone(opts).relFormatter(opts);
    return formatter.format(c, unit);
  }, differ = (unit) => {
    if (opts.calendary) {
      if (!end.hasSame(start, unit)) {
        return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
      } else return 0;
    } else {
      return end.diff(start, unit).get(unit);
    }
  };
  if (opts.unit) {
    return format(differ(opts.unit), opts.unit);
  }
  for (const unit of opts.units) {
    const count = differ(unit);
    if (Math.abs(count) >= 1) {
      return format(count, unit);
    }
  }
  return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
}
function lastOpts(argList) {
  let opts = {}, args;
  if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
    opts = argList[argList.length - 1];
    args = Array.from(argList).slice(0, argList.length - 1);
  } else {
    args = Array.from(argList);
  }
  return [opts, args];
}
let zoneOffsetTs;
const zoneOffsetGuessCache = /* @__PURE__ */ new Map();
class DateTime {
  /**
   * @access private
   */
  constructor(config) {
    const zone = config.zone || Settings.defaultZone;
    let invalid = config.invalid || (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) || (!zone.isValid ? unsupportedZone(zone) : null);
    this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
    let c = null, o = null;
    if (!invalid) {
      const unchanged = config.old && config.old.ts === this.ts && config.old.zone.equals(zone);
      if (unchanged) {
        [c, o] = [config.old.c, config.old.o];
      } else {
        const ot = isNumber(config.o) && !config.old ? config.o : zone.offset(this.ts);
        c = tsToObj(this.ts, ot);
        invalid = Number.isNaN(c.year) ? new Invalid("invalid input") : null;
        c = invalid ? null : c;
        o = invalid ? null : ot;
      }
    }
    this._zone = zone;
    this.loc = config.loc || Locale.create();
    this.invalid = invalid;
    this.weekData = null;
    this.localWeekData = null;
    this.c = c;
    this.o = o;
    this.isLuxonDateTime = true;
  }
  // CONSTRUCT
  /**
   * Create a DateTime for the current instant, in the system's time zone.
   *
   * Use Settings to override these default values if needed.
   * @example DateTime.now().toISO() //~> now in the ISO format
   * @return {DateTime}
   */
  static now() {
    return new DateTime({});
  }
  /**
   * Create a local DateTime
   * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month, 1-indexed
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @example DateTime.local()                                  //~> now
   * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
   * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
   * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
   * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
   * @return {DateTime}
   */
  static local() {
    const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
    return quickDT({
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond
    }, opts);
  }
  /**
   * Create a DateTime in UTC
   * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @param {Object} options - configuration options for the DateTime
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.utc()                                              //~> now
   * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
   * @return {DateTime}
   */
  static utc() {
    const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
    opts.zone = FixedOffsetZone.utcInstance;
    return quickDT({
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond
    }, opts);
  }
  /**
   * Create a DateTime from a JavaScript Date object. Uses the default zone.
   * @param {Date} date - a JavaScript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */
  static fromJSDate(date2, options = {}) {
    const ts = isDate(date2) ? date2.valueOf() : NaN;
    if (Number.isNaN(ts)) {
      return DateTime.invalid("invalid input");
    }
    const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }
    return new DateTime({
      ts,
      zone: zoneToUse,
      loc: Locale.fromObject(options)
    });
  }
  /**
   * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromMillis(milliseconds, options = {}) {
    if (!isNumber(milliseconds)) {
      throw new InvalidArgumentError(`fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`);
    } else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
      return DateTime.invalid("Timestamp out of range");
    } else {
      return new DateTime({
        ts: milliseconds,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options)
      });
    }
  }
  /**
   * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} seconds - a number of seconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromSeconds(seconds, options = {}) {
    if (!isNumber(seconds)) {
      throw new InvalidArgumentError("fromSeconds requires a numerical input");
    } else {
      return new DateTime({
        ts: seconds * 1e3,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options)
      });
    }
  }
  /**
   * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.localWeekYear - a week year, according to the locale
   * @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
   * @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {Object} opts - options for creating this DateTime
   * @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
   * @return {DateTime}
   */
  static fromObject(obj, opts = {}) {
    obj = obj || {};
    const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }
    const loc = Locale.fromObject(opts);
    const normalized = normalizeObject(obj, normalizeUnitWithLocalWeeks);
    const {
      minDaysInFirstWeek,
      startOfWeek
    } = usesLocalWeekValues(normalized, loc);
    const tsNow = Settings.now(), offsetProvis = !isUndefined(opts.specificOffset) ? opts.specificOffset : zoneToUse.offset(tsNow), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    }
    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }
    const useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;
    let units, defaultValues, objNow = tsToObj(tsNow, offsetProvis);
    if (useWeekData) {
      units = orderedWeekUnits;
      defaultValues = defaultWeekUnitValues;
      objNow = gregorianToWeek(objNow, minDaysInFirstWeek, startOfWeek);
    } else if (containsOrdinal) {
      units = orderedOrdinalUnits;
      defaultValues = defaultOrdinalUnitValues;
      objNow = gregorianToOrdinal(objNow);
    } else {
      units = orderedUnits;
      defaultValues = defaultUnitValues;
    }
    let foundFirst = false;
    for (const u of units) {
      const v = normalized[u];
      if (!isUndefined(v)) {
        foundFirst = true;
      } else if (foundFirst) {
        normalized[u] = defaultValues[u];
      } else {
        normalized[u] = objNow[u];
      }
    }
    const higherOrderInvalid = useWeekData ? hasInvalidWeekData(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized), invalid = higherOrderInvalid || hasInvalidTimeData(normalized);
    if (invalid) {
      return DateTime.invalid(invalid);
    }
    const gregorian = useWeekData ? weekToGregorian(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? ordinalToGregorian(normalized) : normalized, [tsFinal, offsetFinal] = objToTS(gregorian, offsetProvis, zoneToUse), inst = new DateTime({
      ts: tsFinal,
      zone: zoneToUse,
      o: offsetFinal,
      loc
    });
    if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) {
      return DateTime.invalid("mismatched weekday", `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`);
    }
    if (!inst.isValid) {
      return DateTime.invalid(inst.invalid);
    }
    return inst;
  }
  /**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [opts.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */
  static fromISO(text, opts = {}) {
    const [vals, parsedZone] = parseISODate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
  }
  /**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */
  static fromRFC2822(text, opts = {}) {
    const [vals, parsedZone] = parseRFC2822Date(text);
    return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
  }
  /**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */
  static fromHTTP(text, opts = {}) {
    const [vals, parsedZone] = parseHTTPDate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
  }
  /**
   * Create a DateTime from an input string and format string.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromFormat(text, fmt, opts = {}) {
    if (isUndefined(text) || isUndefined(fmt)) {
      throw new InvalidArgumentError("fromFormat requires an input string and a format");
    }
    const {
      locale = null,
      numberingSystem = null
    } = opts, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    }), [vals, parsedZone, specificOffset, invalid] = parseFromTokens(localeToUse, text, fmt);
    if (invalid) {
      return DateTime.invalid(invalid);
    } else {
      return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
    }
  }
  /**
   * @deprecated use fromFormat instead
   */
  static fromString(text, fmt, opts = {}) {
    return DateTime.fromFormat(text, fmt, opts);
  }
  /**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */
  static fromSQL(text, opts = {}) {
    const [vals, parsedZone] = parseSQL(text);
    return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
  }
  /**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidDateTimeError(invalid);
    } else {
      return new DateTime({
        invalid
      });
    }
  }
  /**
   * Check if an object is an instance of DateTime. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDateTime(o) {
    return o && o.isLuxonDateTime || false;
  }
  /**
   * Produce the format string for a set of options
   * @param formatOpts
   * @param localeOpts
   * @returns {string}
   */
  static parseFormatForOpts(formatOpts, localeOpts = {}) {
    const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
    return !tokenList ? null : tokenList.map((t) => t ? t.val : null).join("");
  }
  /**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */
  static expandFormat(fmt, localeOpts = {}) {
    const expanded = expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts));
    return expanded.map((t) => t.val).join("");
  }
  static resetCache() {
    zoneOffsetTs = void 0;
    zoneOffsetGuessCache.clear();
  }
  // INFO
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */
  get(unit) {
    return this[unit];
  }
  /**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this DateTime is invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
   *
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
   *
   * @type {string}
   */
  get outputCalendar() {
    return this.isValid ? this.loc.outputCalendar : null;
  }
  /**
   * Get the time zone associated with this DateTime.
   * @type {Zone}
   */
  get zone() {
    return this._zone;
  }
  /**
   * Get the name of the time zone.
   * @type {string}
   */
  get zoneName() {
    return this.isValid ? this.zone.name : null;
  }
  /**
   * Get the year
   * @example DateTime.local(2017, 5, 25).year //=> 2017
   * @type {number}
   */
  get year() {
    return this.isValid ? this.c.year : NaN;
  }
  /**
   * Get the quarter
   * @example DateTime.local(2017, 5, 25).quarter //=> 2
   * @type {number}
   */
  get quarter() {
    return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
  }
  /**
   * Get the month (1-12).
   * @example DateTime.local(2017, 5, 25).month //=> 5
   * @type {number}
   */
  get month() {
    return this.isValid ? this.c.month : NaN;
  }
  /**
   * Get the day of the month (1-30ish).
   * @example DateTime.local(2017, 5, 25).day //=> 25
   * @type {number}
   */
  get day() {
    return this.isValid ? this.c.day : NaN;
  }
  /**
   * Get the hour of the day (0-23).
   * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
   * @type {number}
   */
  get hour() {
    return this.isValid ? this.c.hour : NaN;
  }
  /**
   * Get the minute of the hour (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
   * @type {number}
   */
  get minute() {
    return this.isValid ? this.c.minute : NaN;
  }
  /**
   * Get the second of the minute (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
   * @type {number}
   */
  get second() {
    return this.isValid ? this.c.second : NaN;
  }
  /**
   * Get the millisecond of the second (0-999).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
   * @type {number}
   */
  get millisecond() {
    return this.isValid ? this.c.millisecond : NaN;
  }
  /**
   * Get the week year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
   * @type {number}
   */
  get weekYear() {
    return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
  }
  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
  }
  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
  }
  /**
   * Returns true if this date is on a weekend according to the locale, false otherwise
   * @returns {boolean}
   */
  get isWeekend() {
    return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
  }
  /**
   * Get the day of the week according to the locale.
   * 1 is the first day of the week and 7 is the last day of the week.
   * If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
   * @returns {number}
   */
  get localWeekday() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekday : NaN;
  }
  /**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */
  get localWeekNumber() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekNumber : NaN;
  }
  /**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */
  get localWeekYear() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekYear : NaN;
  }
  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
  }
  /**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */
  get monthShort() {
    return this.isValid ? Info.months("short", {
      locObj: this.loc
    })[this.month - 1] : null;
  }
  /**
   * Get the human readable long month name, such as 'October'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthLong //=> October
   * @type {string}
   */
  get monthLong() {
    return this.isValid ? Info.months("long", {
      locObj: this.loc
    })[this.month - 1] : null;
  }
  /**
   * Get the human readable short weekday, such as 'Mon'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
   * @type {string}
   */
  get weekdayShort() {
    return this.isValid ? Info.weekdays("short", {
      locObj: this.loc
    })[this.weekday - 1] : null;
  }
  /**
   * Get the human readable long weekday, such as 'Monday'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
   * @type {string}
   */
  get weekdayLong() {
    return this.isValid ? Info.weekdays("long", {
      locObj: this.loc
    })[this.weekday - 1] : null;
  }
  /**
   * Get the UTC offset of this DateTime in minutes
   * @example DateTime.now().offset //=> -240
   * @example DateTime.utc().offset //=> 0
   * @type {number}
   */
  get offset() {
    return this.isValid ? +this.o : NaN;
  }
  /**
   * Get the short human name for the zone's current offset, for example "EST" or "EDT".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameShort() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "short",
        locale: this.locale
      });
    } else {
      return null;
    }
  }
  /**
   * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameLong() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "long",
        locale: this.locale
      });
    } else {
      return null;
    }
  }
  /**
   * Get whether this zone's offset ever changes, as in a DST.
   * @type {boolean}
   */
  get isOffsetFixed() {
    return this.isValid ? this.zone.isUniversal : null;
  }
  /**
   * Get whether the DateTime is in a DST.
   * @type {boolean}
   */
  get isInDST() {
    if (this.isOffsetFixed) {
      return false;
    } else {
      return this.offset > this.set({
        month: 1,
        day: 1
      }).offset || this.offset > this.set({
        month: 5
      }).offset;
    }
  }
  /**
   * Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
   * in this DateTime's zone. During DST changes local time can be ambiguous, for example
   * `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
   * This method will return both possible DateTimes if this DateTime's local time is ambiguous.
   * @returns {DateTime[]}
   */
  getPossibleOffsets() {
    if (!this.isValid || this.isOffsetFixed) {
      return [this];
    }
    const dayMs = 864e5;
    const minuteMs = 6e4;
    const localTS = objToLocalTS(this.c);
    const oEarlier = this.zone.offset(localTS - dayMs);
    const oLater = this.zone.offset(localTS + dayMs);
    const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
    const o2 = this.zone.offset(localTS - oLater * minuteMs);
    if (o1 === o2) {
      return [this];
    }
    const ts1 = localTS - o1 * minuteMs;
    const ts2 = localTS - o2 * minuteMs;
    const c1 = tsToObj(ts1, o1);
    const c2 = tsToObj(ts2, o2);
    if (c1.hour === c2.hour && c1.minute === c2.minute && c1.second === c2.second && c1.millisecond === c2.millisecond) {
      return [clone(this, {
        ts: ts1
      }), clone(this, {
        ts: ts2
      })];
    }
    return [this];
  }
  /**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */
  get isInLeapYear() {
    return isLeapYear(this.year);
  }
  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return daysInMonth(this.year, this.month);
  }
  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? daysInYear(this.year) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */
  get weeksInLocalWeekYear() {
    return this.isValid ? weeksInWeekYear(this.localWeekYear, this.loc.getMinDaysInFirstWeek(), this.loc.getStartOfWeek()) : NaN;
  }
  /**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */
  resolvedLocaleOptions(opts = {}) {
    const {
      locale,
      numberingSystem,
      calendar
    } = Formatter.create(this.loc.clone(opts), opts).resolvedOptions(this);
    return {
      locale,
      numberingSystem,
      outputCalendar: calendar
    };
  }
  // TRANSFORM
  /**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link DateTime#setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */
  toUTC(offset2 = 0, opts = {}) {
    return this.setZone(FixedOffsetZone.instance(offset2), opts);
  }
  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */
  toLocal() {
    return this.setZone(Settings.defaultZone);
  }
  /**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */
  setZone(zone, {
    keepLocalTime = false,
    keepCalendarTime = false
  } = {}) {
    zone = normalizeZone(zone, Settings.defaultZone);
    if (zone.equals(this.zone)) {
      return this;
    } else if (!zone.isValid) {
      return DateTime.invalid(unsupportedZone(zone));
    } else {
      let newTS = this.ts;
      if (keepLocalTime || keepCalendarTime) {
        const offsetGuess = zone.offset(this.ts);
        const asObj = this.toObject();
        [newTS] = objToTS(asObj, offsetGuess, zone);
      }
      return clone(this, {
        ts: newTS,
        zone
      });
    }
  }
  /**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */
  reconfigure({
    locale,
    numberingSystem,
    outputCalendar
  } = {}) {
    const loc = this.loc.clone({
      locale,
      numberingSystem,
      outputCalendar
    });
    return clone(this, {
      loc
    });
  }
  /**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */
  setLocale(locale) {
    return this.reconfigure({
      locale
    });
  }
  /**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
   *
   * This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
   * They cannot be mixed with ISO-week units like `weekday`.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */
  set(values) {
    if (!this.isValid) return this;
    const normalized = normalizeObject(values, normalizeUnitWithLocalWeeks);
    const {
      minDaysInFirstWeek,
      startOfWeek
    } = usesLocalWeekValues(normalized, this.loc);
    const settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError("Can't mix weekYear/weekNumber units with year/month/day or ordinals");
    }
    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }
    let mixed;
    if (settingWeekStuff) {
      mixed = weekToGregorian({
        ...gregorianToWeek(this.c, minDaysInFirstWeek, startOfWeek),
        ...normalized
      }, minDaysInFirstWeek, startOfWeek);
    } else if (!isUndefined(normalized.ordinal)) {
      mixed = ordinalToGregorian({
        ...gregorianToOrdinal(this.c),
        ...normalized
      });
    } else {
      mixed = {
        ...this.toObject(),
        ...normalized
      };
      if (isUndefined(normalized.day)) {
        mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
      }
    }
    const [ts, o] = objToTS(mixed, this.o, this.zone);
    return clone(this, {
      ts,
      o
    });
  }
  /**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.now().plus(123) //~> in 123 milliseconds
   * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
   * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
   * @return {DateTime}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return clone(this, adjustTime(this, dur));
  }
  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration).negate();
    return clone(this, adjustTime(this, dur));
  }
  /**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */
  startOf(unit, {
    useLocaleWeeks = false
  } = {}) {
    if (!this.isValid) return this;
    const o = {}, normalizedUnit = Duration.normalizeUnit(unit);
    switch (normalizedUnit) {
      case "years":
        o.month = 1;
      case "quarters":
      case "months":
        o.day = 1;
      case "weeks":
      case "days":
        o.hour = 0;
      case "hours":
        o.minute = 0;
      case "minutes":
        o.second = 0;
      case "seconds":
        o.millisecond = 0;
        break;
    }
    if (normalizedUnit === "weeks") {
      if (useLocaleWeeks) {
        const startOfWeek = this.loc.getStartOfWeek();
        const {
          weekday
        } = this;
        if (weekday < startOfWeek) {
          o.weekNumber = this.weekNumber - 1;
        }
        o.weekday = startOfWeek;
      } else {
        o.weekday = 1;
      }
    }
    if (normalizedUnit === "quarters") {
      const q = Math.ceil(this.month / 3);
      o.month = (q - 1) * 3 + 1;
    }
    return this.set(o);
  }
  /**
   * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */
  endOf(unit, opts) {
    return this.isValid ? this.plus({
      [unit]: 1
    }).startOf(unit, opts).minus(1) : this;
  }
  // OUTPUT
  /**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
   * Defaults to en-US if no locale has been specified, regardless of the system's locale.
   * @param {string} fmt - the format string
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
   * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    return this.isValid ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt) : INVALID;
  }
  /**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toLocaleString(); //=> 4/20/2017
   * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
   * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
   * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
   * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this) : INVALID;
  }
  /**
   * Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.now().toLocaleParts(); //=> [
   *                                   //=>   { type: 'day', value: '25' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'month', value: '05' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'year', value: '1982' }
   *                                   //=> ]
   */
  toLocaleParts(opts = {}) {
    return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=false] - add the time zone format extension
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
   * @return {string|null}
   */
  toISO({
    format = "extended",
    suppressSeconds = false,
    suppressMilliseconds = false,
    includeOffset = true,
    extendedZone = false
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    const ext = format === "extended";
    let c = toISODate(this, ext);
    c += "T";
    c += toISOTime(this, ext, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
    return c;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @return {string|null}
   */
  toISODate({
    format = "extended"
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, format === "extended");
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return toTechFormat(this, "kkkk-'W'WW-c");
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
   * @return {string}
   */
  toISOTime({
    suppressMilliseconds = false,
    suppressSeconds = false,
    includeOffset = true,
    includePrefix = false,
    extendedZone = false,
    format = "extended"
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    let c = includePrefix ? "T" : "";
    return c + toISOTime(this, format === "extended", suppressSeconds, suppressMilliseconds, includeOffset, extendedZone);
  }
  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */
  toHTTP() {
    return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string|null}
   */
  toSQLDate() {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, true);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */
  toSQLTime({
    includeOffset = true,
    includeZone = false,
    includeOffsetSpace = true
  } = {}) {
    let fmt = "HH:mm:ss.SSS";
    if (includeZone || includeOffset) {
      if (includeOffsetSpace) {
        fmt += " ";
      }
      if (includeZone) {
        fmt += "z";
      } else if (includeOffset) {
        fmt += "ZZ";
      }
    }
    return toTechFormat(this, fmt, true);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */
  toSQL(opts = {}) {
    if (!this.isValid) {
      return null;
    }
    return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
  }
  /**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */
  toString() {
    return this.isValid ? this.toISO() : INVALID;
  }
  /**
   * Returns a string representation of this DateTime appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
    } else {
      return `DateTime { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Returns the epoch milliseconds of this DateTime.
   * @return {number}
   */
  toMillis() {
    return this.isValid ? this.ts : NaN;
  }
  /**
   * Returns the epoch seconds (including milliseconds in the fractional part) of this DateTime.
   * @return {number}
   */
  toSeconds() {
    return this.isValid ? this.ts / 1e3 : NaN;
  }
  /**
   * Returns the epoch seconds (as a whole number) of this DateTime.
   * @return {number}
   */
  toUnixInteger() {
    return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
  }
  /**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns a BSON serializable equivalent to this DateTime.
   * @return {Date}
   */
  toBSON() {
    return this.toJSDate();
  }
  /**
   * Returns a JavaScript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */
  toObject(opts = {}) {
    if (!this.isValid) return {};
    const base = {
      ...this.c
    };
    if (opts.includeConfig) {
      base.outputCalendar = this.outputCalendar;
      base.numberingSystem = this.loc.numberingSystem;
      base.locale = this.loc.locale;
    }
    return base;
  }
  /**
   * Returns a JavaScript Date equivalent to this DateTime.
   * @return {Date}
   */
  toJSDate() {
    return new Date(this.isValid ? this.ts : NaN);
  }
  // COMPARE
  /**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */
  diff(otherDateTime, unit = "milliseconds", opts = {}) {
    if (!this.isValid || !otherDateTime.isValid) {
      return Duration.invalid("created by diffing an invalid DateTime");
    }
    const durOpts = {
      locale: this.locale,
      numberingSystem: this.numberingSystem,
      ...opts
    };
    const units = maybeArray(unit).map(Duration.normalizeUnit), otherIsLater = otherDateTime.valueOf() > this.valueOf(), earlier = otherIsLater ? this : otherDateTime, later = otherIsLater ? otherDateTime : this, diffed = diff(earlier, later, units, durOpts);
    return otherIsLater ? diffed.negate() : diffed;
  }
  /**
   * Return the difference between this DateTime and right now.
   * See {@link DateTime#diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  diffNow(unit = "milliseconds", opts = {}) {
    return this.diff(DateTime.now(), unit, opts);
  }
  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval|DateTime}
   */
  until(otherDateTime) {
    return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
  }
  /**
   * Return whether this DateTime is in the same unit of time as another DateTime.
   * Higher-order units must also be identical for this function to return `true`.
   * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
   * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
   * @return {boolean}
   */
  hasSame(otherDateTime, unit, opts) {
    if (!this.isValid) return false;
    const inputMs = otherDateTime.valueOf();
    const adjustedToZone = this.setZone(otherDateTime.zone, {
      keepLocalTime: true
    });
    return adjustedToZone.startOf(unit, opts) <= inputMs && inputMs <= adjustedToZone.endOf(unit, opts);
  }
  /**
   * Equality check
   * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
   * To compare just the millisecond values, use `+dt1 === +dt2`.
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */
  equals(other) {
    return this.isValid && other.isValid && this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc);
  }
  /**
   * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
   * platform supports Intl.RelativeTimeFormat. Rounds down by default.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
   * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
   * @param {boolean} [options.round=true] - whether to round the numbers in the output.
   * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
   * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
   * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
   * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
   * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
   * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
   */
  toRelative(options = {}) {
    if (!this.isValid) return null;
    const base = options.base || DateTime.fromObject({}, {
      zone: this.zone
    }), padding = options.padding ? this < base ? -options.padding : options.padding : 0;
    let units = ["years", "months", "days", "hours", "minutes", "seconds"];
    let unit = options.unit;
    if (Array.isArray(options.unit)) {
      units = options.unit;
      unit = void 0;
    }
    return diffRelative(base, this.plus(padding), {
      ...options,
      numeric: "always",
      units,
      unit
    });
  }
  /**
   * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
   * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
   * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
   * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
   */
  toRelativeCalendar(options = {}) {
    if (!this.isValid) return null;
    return diffRelative(options.base || DateTime.fromObject({}, {
      zone: this.zone
    }), this, {
      ...options,
      numeric: "auto",
      units: ["years", "months", "days"],
      calendary: true
    });
  }
  /**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */
  static min(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("min requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i) => i.valueOf(), Math.min);
  }
  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("max requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i) => i.valueOf(), Math.max);
  }
  // MISC
  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */
  static fromFormatExplain(text, fmt, options = {}) {
    const {
      locale = null,
      numberingSystem = null
    } = options, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    return explainFromTokens(localeToUse, text, fmt);
  }
  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(text, fmt, options = {}) {
    return DateTime.fromFormatExplain(text, fmt, options);
  }
  /**
   * Build a parser for `fmt` using the given locale. This parser can be passed
   * to {@link DateTime.fromFormatParser} to a parse a date in this format. This
   * can be used to optimize cases where many dates need to be parsed in a
   * specific format.
   *
   * @param {String} fmt - the format the string is expected to be in (see
   * description)
   * @param {Object} options - options used to set locale and numberingSystem
   * for parser
   * @returns {TokenParser} - opaque object to be used
   */
  static buildFormatParser(fmt, options = {}) {
    const {
      locale = null,
      numberingSystem = null
    } = options, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    return new TokenParser(localeToUse, fmt);
  }
  /**
   * Create a DateTime from an input string and format parser.
   *
   * The format parser must have been created with the same locale as this call.
   *
   * @param {String} text - the string to parse
   * @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
   * @param {Object} opts - options taken by fromFormat()
   * @returns {DateTime}
   */
  static fromFormatParser(text, formatParser, opts = {}) {
    if (isUndefined(text) || isUndefined(formatParser)) {
      throw new InvalidArgumentError("fromFormatParser requires an input string and a format parser");
    }
    const {
      locale = null,
      numberingSystem = null
    } = opts, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    if (!localeToUse.equals(formatParser.locale)) {
      throw new InvalidArgumentError(`fromFormatParser called with a locale of ${localeToUse}, but the format parser was created for ${formatParser.locale}`);
    }
    const {
      result,
      zone,
      specificOffset,
      invalidReason
    } = formatParser.explainFromTokens(text);
    if (invalidReason) {
      return DateTime.invalid(invalidReason);
    } else {
      return parseDataToDateTime(result, zone, opts, `format ${formatParser.format}`, text, specificOffset);
    }
  }
  // FORMAT PRESETS
  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return DATE_SHORT;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return DATE_MED;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return DATE_MED_WITH_WEEKDAY;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return DATE_FULL;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return DATE_HUGE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return TIME_SIMPLE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return TIME_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return TIME_WITH_SHORT_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return TIME_WITH_LONG_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return TIME_24_SIMPLE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return TIME_24_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return TIME_24_WITH_SHORT_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return TIME_24_WITH_LONG_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return DATETIME_SHORT;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return DATETIME_SHORT_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return DATETIME_MED;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return DATETIME_MED_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return DATETIME_MED_WITH_WEEKDAY;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return DATETIME_FULL;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return DATETIME_FULL_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return DATETIME_HUGE;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return DATETIME_HUGE_WITH_SECONDS;
  }
}
function friendlyDateTime(dateTimeish) {
  if (DateTime.isDateTime(dateTimeish)) {
    return dateTimeish;
  } else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) {
    return DateTime.fromJSDate(dateTimeish);
  } else if (dateTimeish && typeof dateTimeish === "object") {
    return DateTime.fromObject(dateTimeish);
  } else {
    throw new InvalidArgumentError(`Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`);
  }
}
const VERSION = "3.6.1";
luxon$1.DateTime = DateTime;
luxon$1.Duration = Duration;
luxon$1.FixedOffsetZone = FixedOffsetZone;
luxon$1.IANAZone = IANAZone;
luxon$1.Info = Info;
luxon$1.Interval = Interval;
luxon$1.InvalidZone = InvalidZone;
luxon$1.Settings = Settings;
luxon$1.SystemZone = SystemZone;
luxon$1.VERSION = VERSION;
luxon$1.Zone = Zone;
var luxon = luxon$1;
CronDate$3.prototype.addYear = function() {
  this._date = this._date.plus({ years: 1 });
};
CronDate$3.prototype.addMonth = function() {
  this._date = this._date.plus({ months: 1 }).startOf("month");
};
CronDate$3.prototype.addDay = function() {
  this._date = this._date.plus({ days: 1 }).startOf("day");
};
CronDate$3.prototype.addHour = function() {
  var prev2 = this._date;
  this._date = this._date.plus({ hours: 1 }).startOf("hour");
  if (this._date <= prev2) {
    this._date = this._date.plus({ hours: 1 });
  }
};
CronDate$3.prototype.addMinute = function() {
  var prev2 = this._date;
  this._date = this._date.plus({ minutes: 1 }).startOf("minute");
  if (this._date < prev2) {
    this._date = this._date.plus({ hours: 1 });
  }
};
CronDate$3.prototype.addSecond = function() {
  var prev2 = this._date;
  this._date = this._date.plus({ seconds: 1 }).startOf("second");
  if (this._date < prev2) {
    this._date = this._date.plus({ hours: 1 });
  }
};
CronDate$3.prototype.subtractYear = function() {
  this._date = this._date.minus({ years: 1 });
};
CronDate$3.prototype.subtractMonth = function() {
  this._date = this._date.minus({ months: 1 }).endOf("month").startOf("second");
};
CronDate$3.prototype.subtractDay = function() {
  this._date = this._date.minus({ days: 1 }).endOf("day").startOf("second");
};
CronDate$3.prototype.subtractHour = function() {
  var prev2 = this._date;
  this._date = this._date.minus({ hours: 1 }).endOf("hour").startOf("second");
  if (this._date >= prev2) {
    this._date = this._date.minus({ hours: 1 });
  }
};
CronDate$3.prototype.subtractMinute = function() {
  var prev2 = this._date;
  this._date = this._date.minus({ minutes: 1 }).endOf("minute").startOf("second");
  if (this._date > prev2) {
    this._date = this._date.minus({ hours: 1 });
  }
};
CronDate$3.prototype.subtractSecond = function() {
  var prev2 = this._date;
  this._date = this._date.minus({ seconds: 1 }).startOf("second");
  if (this._date > prev2) {
    this._date = this._date.minus({ hours: 1 });
  }
};
CronDate$3.prototype.getDate = function() {
  return this._date.day;
};
CronDate$3.prototype.getFullYear = function() {
  return this._date.year;
};
CronDate$3.prototype.getDay = function() {
  var weekday = this._date.weekday;
  return weekday == 7 ? 0 : weekday;
};
CronDate$3.prototype.getMonth = function() {
  return this._date.month - 1;
};
CronDate$3.prototype.getHours = function() {
  return this._date.hour;
};
CronDate$3.prototype.getMinutes = function() {
  return this._date.minute;
};
CronDate$3.prototype.getSeconds = function() {
  return this._date.second;
};
CronDate$3.prototype.getMilliseconds = function() {
  return this._date.millisecond;
};
CronDate$3.prototype.getTime = function() {
  return this._date.valueOf();
};
CronDate$3.prototype.getUTCDate = function() {
  return this._getUTC().day;
};
CronDate$3.prototype.getUTCFullYear = function() {
  return this._getUTC().year;
};
CronDate$3.prototype.getUTCDay = function() {
  var weekday = this._getUTC().weekday;
  return weekday == 7 ? 0 : weekday;
};
CronDate$3.prototype.getUTCMonth = function() {
  return this._getUTC().month - 1;
};
CronDate$3.prototype.getUTCHours = function() {
  return this._getUTC().hour;
};
CronDate$3.prototype.getUTCMinutes = function() {
  return this._getUTC().minute;
};
CronDate$3.prototype.getUTCSeconds = function() {
  return this._getUTC().second;
};
CronDate$3.prototype.toISOString = function() {
  return this._date.toUTC().toISO();
};
CronDate$3.prototype.toJSON = function() {
  return this._date.toJSON();
};
CronDate$3.prototype.setDate = function(d) {
  this._date = this._date.set({ day: d });
};
CronDate$3.prototype.setFullYear = function(y) {
  this._date = this._date.set({ year: y });
};
CronDate$3.prototype.setDay = function(d) {
  this._date = this._date.set({ weekday: d });
};
CronDate$3.prototype.setMonth = function(m) {
  this._date = this._date.set({ month: m + 1 });
};
CronDate$3.prototype.setHours = function(h) {
  this._date = this._date.set({ hour: h });
};
CronDate$3.prototype.setMinutes = function(m) {
  this._date = this._date.set({ minute: m });
};
CronDate$3.prototype.setSeconds = function(s2) {
  this._date = this._date.set({ second: s2 });
};
CronDate$3.prototype.setMilliseconds = function(s2) {
  this._date = this._date.set({ millisecond: s2 });
};
CronDate$3.prototype._getUTC = function() {
  return this._date.toUTC();
};
CronDate$3.prototype.toString = function() {
  return this.toDate().toString();
};
CronDate$3.prototype.toDate = function() {
  return this._date.toJSDate();
};
CronDate$3.prototype.isLastDayOfMonth = function() {
  var newDate = this._date.plus({ days: 1 }).startOf("day");
  return this._date.month !== newDate.month;
};
CronDate$3.prototype.isLastWeekdayOfMonth = function() {
  var newDate = this._date.plus({ days: 7 }).startOf("day");
  return this._date.month !== newDate.month;
};
function CronDate$3(timestamp, tz) {
  var dateOpts = { zone: tz };
  if (!timestamp) {
    this._date = luxon.DateTime.local();
  } else if (timestamp instanceof CronDate$3) {
    this._date = timestamp._date;
  } else if (timestamp instanceof Date) {
    this._date = luxon.DateTime.fromJSDate(timestamp, dateOpts);
  } else if (typeof timestamp === "number") {
    this._date = luxon.DateTime.fromMillis(timestamp, dateOpts);
  } else if (typeof timestamp === "string") {
    this._date = luxon.DateTime.fromISO(timestamp, dateOpts);
    this._date.isValid || (this._date = luxon.DateTime.fromRFC2822(timestamp, dateOpts));
    this._date.isValid || (this._date = luxon.DateTime.fromSQL(timestamp, dateOpts));
    this._date.isValid || (this._date = luxon.DateTime.fromFormat(timestamp, "EEE, d MMM yyyy HH:mm:ss", dateOpts));
  }
  if (!this._date || !this._date.isValid) {
    throw new Error("CronDate: unhandled timestamp: " + JSON.stringify(timestamp));
  }
  if (tz && tz !== this._date.zoneName) {
    this._date = this._date.setZone(tz);
  }
}
var date = CronDate$3;
function buildRange(item) {
  return {
    start: item,
    count: 1
  };
}
function completeRangeWithItem(range, item) {
  range.end = item;
  range.step = item - range.start;
  range.count = 2;
}
function finalizeCurrentRange(results, currentRange, currentItemRange) {
  if (currentRange) {
    if (currentRange.count === 2) {
      results.push(buildRange(currentRange.start));
      results.push(buildRange(currentRange.end));
    } else {
      results.push(currentRange);
    }
  }
  if (currentItemRange) {
    results.push(currentItemRange);
  }
}
function compactField$1(arr) {
  var results = [];
  var currentRange = void 0;
  for (var i = 0; i < arr.length; i++) {
    var currentItem = arr[i];
    if (typeof currentItem !== "number") {
      finalizeCurrentRange(results, currentRange, buildRange(currentItem));
      currentRange = void 0;
    } else if (!currentRange) {
      currentRange = buildRange(currentItem);
    } else if (currentRange.count === 1) {
      completeRangeWithItem(currentRange, currentItem);
    } else {
      if (currentRange.step === currentItem - currentRange.end) {
        currentRange.count++;
        currentRange.end = currentItem;
      } else if (currentRange.count === 2) {
        results.push(buildRange(currentRange.start));
        currentRange = buildRange(currentRange.end);
        completeRangeWithItem(currentRange, currentItem);
      } else {
        finalizeCurrentRange(results, currentRange);
        currentRange = buildRange(currentItem);
      }
    }
  }
  finalizeCurrentRange(results, currentRange);
  return results;
}
var field_compactor = compactField$1;
var compactField = field_compactor;
function stringifyField$1(arr, min, max) {
  var ranges = compactField(arr);
  if (ranges.length === 1) {
    var singleRange = ranges[0];
    var step = singleRange.step;
    if (step === 1 && singleRange.start === min && singleRange.end === max) {
      return "*";
    }
    if (step !== 1 && singleRange.start === min && singleRange.end === max - step + 1) {
      return "*/" + step;
    }
  }
  var result = [];
  for (var i = 0, l2 = ranges.length; i < l2; ++i) {
    var range = ranges[i];
    if (range.count === 1) {
      result.push(range.start);
      continue;
    }
    var step = range.step;
    if (range.step === 1) {
      result.push(range.start + "-" + range.end);
      continue;
    }
    var multiplier = range.start == 0 ? range.count - 1 : range.count;
    if (range.step * multiplier > range.end) {
      result = result.concat(
        Array.from({ length: range.end - range.start + 1 }).map(function(_, index) {
          var value = range.start + index;
          if ((value - range.start) % range.step === 0) {
            return value;
          }
          return null;
        }).filter(function(value) {
          return value != null;
        })
      );
    } else if (range.end === max - range.step + 1) {
      result.push(range.start + "/" + range.step);
    } else {
      result.push(range.start + "-" + range.end + "/" + range.step);
    }
  }
  return result.join(",");
}
var field_stringify = stringifyField$1;
var CronDate$2 = date;
var stringifyField = field_stringify;
var LOOP_LIMIT = 1e4;
function CronExpression$1(fields, options) {
  this._options = options;
  this._utc = options.utc || false;
  this._tz = this._utc ? "UTC" : options.tz;
  this._currentDate = new CronDate$2(options.currentDate, this._tz);
  this._startDate = options.startDate ? new CronDate$2(options.startDate, this._tz) : null;
  this._endDate = options.endDate ? new CronDate$2(options.endDate, this._tz) : null;
  this._isIterator = options.iterator || false;
  this._hasIterated = false;
  this._nthDayOfWeek = options.nthDayOfWeek || 0;
  this.fields = CronExpression$1._freezeFields(fields);
}
CronExpression$1.map = ["second", "minute", "hour", "dayOfMonth", "month", "dayOfWeek"];
CronExpression$1.predefined = {
  "@yearly": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@hourly": "0 * * * *"
};
CronExpression$1.constraints = [
  { min: 0, max: 59, chars: [] },
  // Second
  { min: 0, max: 59, chars: [] },
  // Minute
  { min: 0, max: 23, chars: [] },
  // Hour
  { min: 1, max: 31, chars: ["L"] },
  // Day of month
  { min: 1, max: 12, chars: [] },
  // Month
  { min: 0, max: 7, chars: ["L"] }
  // Day of week
];
CronExpression$1.daysInMonth = [
  31,
  29,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31
];
CronExpression$1.aliases = {
  month: {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  },
  dayOfWeek: {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
  }
};
CronExpression$1.parseDefaults = ["0", "*", "*", "*", "*", "*"];
CronExpression$1.standardValidCharacters = /^[,*\d/-]+$/;
CronExpression$1.dayOfWeekValidCharacters = /^[?,*\dL#/-]+$/;
CronExpression$1.dayOfMonthValidCharacters = /^[?,*\dL/-]+$/;
CronExpression$1.validCharacters = {
  second: CronExpression$1.standardValidCharacters,
  minute: CronExpression$1.standardValidCharacters,
  hour: CronExpression$1.standardValidCharacters,
  dayOfMonth: CronExpression$1.dayOfMonthValidCharacters,
  month: CronExpression$1.standardValidCharacters,
  dayOfWeek: CronExpression$1.dayOfWeekValidCharacters
};
CronExpression$1._isValidConstraintChar = function _isValidConstraintChar(constraints, value) {
  if (typeof value !== "string") {
    return false;
  }
  return constraints.chars.some(function(char) {
    return value.indexOf(char) > -1;
  });
};
CronExpression$1._parseField = function _parseField(field, value, constraints) {
  switch (field) {
    case "month":
    case "dayOfWeek":
      var aliases = CronExpression$1.aliases[field];
      value = value.replace(/[a-z]{3}/gi, function(match2) {
        match2 = match2.toLowerCase();
        if (typeof aliases[match2] !== "undefined") {
          return aliases[match2];
        } else {
          throw new Error('Validation error, cannot resolve alias "' + match2 + '"');
        }
      });
      break;
  }
  if (!CronExpression$1.validCharacters[field].test(value)) {
    throw new Error("Invalid characters, got value: " + value);
  }
  if (value.indexOf("*") !== -1) {
    value = value.replace(/\*/g, constraints.min + "-" + constraints.max);
  } else if (value.indexOf("?") !== -1) {
    value = value.replace(/\?/g, constraints.min + "-" + constraints.max);
  }
  function parseSequence(val) {
    var stack = [];
    function handleResult(result) {
      if (result instanceof Array) {
        for (var i2 = 0, c2 = result.length; i2 < c2; i2++) {
          var value2 = result[i2];
          if (CronExpression$1._isValidConstraintChar(constraints, value2)) {
            stack.push(value2);
            continue;
          }
          if (typeof value2 !== "number" || Number.isNaN(value2) || value2 < constraints.min || value2 > constraints.max) {
            throw new Error(
              "Constraint error, got value " + value2 + " expected range " + constraints.min + "-" + constraints.max
            );
          }
          stack.push(value2);
        }
      } else {
        if (CronExpression$1._isValidConstraintChar(constraints, result)) {
          stack.push(result);
          return;
        }
        var numResult = +result;
        if (Number.isNaN(numResult) || numResult < constraints.min || numResult > constraints.max) {
          throw new Error(
            "Constraint error, got value " + result + " expected range " + constraints.min + "-" + constraints.max
          );
        }
        if (field === "dayOfWeek") {
          numResult = numResult % 7;
        }
        stack.push(numResult);
      }
    }
    var atoms = val.split(",");
    if (!atoms.every(function(atom) {
      return atom.length > 0;
    })) {
      throw new Error("Invalid list value format");
    }
    if (atoms.length > 1) {
      for (var i = 0, c = atoms.length; i < c; i++) {
        handleResult(parseRepeat(atoms[i]));
      }
    } else {
      handleResult(parseRepeat(val));
    }
    stack.sort(CronExpression$1._sortCompareFn);
    return stack;
  }
  function parseRepeat(val) {
    var repeatInterval = 1;
    var atoms = val.split("/");
    if (atoms.length > 2) {
      throw new Error("Invalid repeat: " + val);
    }
    if (atoms.length > 1) {
      if (atoms[0] == +atoms[0]) {
        atoms = [atoms[0] + "-" + constraints.max, atoms[1]];
      }
      return parseRange(atoms[0], atoms[atoms.length - 1]);
    }
    return parseRange(val, repeatInterval);
  }
  function parseRange(val, repeatInterval) {
    var stack = [];
    var atoms = val.split("-");
    if (atoms.length > 1) {
      if (atoms.length < 2) {
        return +val;
      }
      if (!atoms[0].length) {
        if (!atoms[1].length) {
          throw new Error("Invalid range: " + val);
        }
        return +val;
      }
      var min = +atoms[0];
      var max = +atoms[1];
      if (Number.isNaN(min) || Number.isNaN(max) || min < constraints.min || max > constraints.max) {
        throw new Error(
          "Constraint error, got range " + min + "-" + max + " expected range " + constraints.min + "-" + constraints.max
        );
      } else if (min > max) {
        throw new Error("Invalid range: " + val);
      }
      var repeatIndex = +repeatInterval;
      if (Number.isNaN(repeatIndex) || repeatIndex <= 0) {
        throw new Error("Constraint error, cannot repeat at every " + repeatIndex + " time.");
      }
      if (field === "dayOfWeek" && max % 7 === 0) {
        stack.push(0);
      }
      for (var index = min, count = max; index <= count; index++) {
        var exists = stack.indexOf(index) !== -1;
        if (!exists && repeatIndex > 0 && repeatIndex % repeatInterval === 0) {
          repeatIndex = 1;
          stack.push(index);
        } else {
          repeatIndex++;
        }
      }
      return stack;
    }
    return Number.isNaN(+val) ? val : +val;
  }
  return parseSequence(value);
};
CronExpression$1._sortCompareFn = function(a, b) {
  var aIsNumber = typeof a === "number";
  var bIsNumber = typeof b === "number";
  if (aIsNumber && bIsNumber) {
    return a - b;
  }
  if (!aIsNumber && bIsNumber) {
    return 1;
  }
  if (aIsNumber && !bIsNumber) {
    return -1;
  }
  return a.localeCompare(b);
};
CronExpression$1._handleMaxDaysInMonth = function(mappedFields) {
  if (mappedFields.month.length === 1) {
    var daysInMonth2 = CronExpression$1.daysInMonth[mappedFields.month[0] - 1];
    if (mappedFields.dayOfMonth[0] > daysInMonth2) {
      throw new Error("Invalid explicit day of month definition");
    }
    return mappedFields.dayOfMonth.filter(function(dayOfMonth) {
      return dayOfMonth === "L" ? true : dayOfMonth <= daysInMonth2;
    }).sort(CronExpression$1._sortCompareFn);
  }
};
CronExpression$1._freezeFields = function(fields) {
  for (var i = 0, c = CronExpression$1.map.length; i < c; ++i) {
    var field = CronExpression$1.map[i];
    var value = fields[field];
    fields[field] = Object.freeze(value);
  }
  return Object.freeze(fields);
};
CronExpression$1.prototype._applyTimezoneShift = function(currentDate, dateMathVerb, method) {
  if (method === "Month" || method === "Day") {
    var prevTime = currentDate.getTime();
    currentDate[dateMathVerb + method]();
    var currTime = currentDate.getTime();
    if (prevTime === currTime) {
      if (currentDate.getMinutes() === 0 && currentDate.getSeconds() === 0) {
        currentDate.addHour();
      } else if (currentDate.getMinutes() === 59 && currentDate.getSeconds() === 59) {
        currentDate.subtractHour();
      }
    }
  } else {
    var previousHour = currentDate.getHours();
    currentDate[dateMathVerb + method]();
    var currentHour = currentDate.getHours();
    var diff2 = currentHour - previousHour;
    if (diff2 === 2) {
      if (this.fields.hour.length !== 24) {
        this._dstStart = currentHour;
      }
    } else if (diff2 === 0 && currentDate.getMinutes() === 0 && currentDate.getSeconds() === 0) {
      if (this.fields.hour.length !== 24) {
        this._dstEnd = currentHour;
      }
    }
  }
};
CronExpression$1.prototype._findSchedule = function _findSchedule(reverse) {
  function matchSchedule(value, sequence) {
    for (var i = 0, c = sequence.length; i < c; i++) {
      if (sequence[i] >= value) {
        return sequence[i] === value;
      }
    }
    return sequence[0] === value;
  }
  function isNthDayMatch(date2, nthDayOfWeek) {
    if (nthDayOfWeek < 6) {
      if (date2.getDate() < 8 && nthDayOfWeek === 1) {
        return true;
      }
      var offset2 = date2.getDate() % 7 ? 1 : 0;
      var adjustedDate = date2.getDate() - date2.getDate() % 7;
      var occurrence = Math.floor(adjustedDate / 7) + offset2;
      return occurrence === nthDayOfWeek;
    }
    return false;
  }
  function isLInExpressions(expressions) {
    return expressions.length > 0 && expressions.some(function(expression2) {
      return typeof expression2 === "string" && expression2.indexOf("L") >= 0;
    });
  }
  reverse = reverse || false;
  var dateMathVerb = reverse ? "subtract" : "add";
  var currentDate = new CronDate$2(this._currentDate, this._tz);
  var startDate = this._startDate;
  var endDate = this._endDate;
  var startTimestamp = currentDate.getTime();
  var stepCount = 0;
  function isLastWeekdayOfMonthMatch(expressions) {
    return expressions.some(function(expression2) {
      if (!isLInExpressions([expression2])) {
        return false;
      }
      var weekday = Number.parseInt(expression2[0]) % 7;
      if (Number.isNaN(weekday)) {
        throw new Error("Invalid last weekday of the month expression: " + expression2);
      }
      return currentDate.getDay() === weekday && currentDate.isLastWeekdayOfMonth();
    });
  }
  while (stepCount < LOOP_LIMIT) {
    stepCount++;
    if (reverse) {
      if (startDate && currentDate.getTime() - startDate.getTime() < 0) {
        throw new Error("Out of the timespan range");
      }
    } else {
      if (endDate && endDate.getTime() - currentDate.getTime() < 0) {
        throw new Error("Out of the timespan range");
      }
    }
    var dayOfMonthMatch = matchSchedule(currentDate.getDate(), this.fields.dayOfMonth);
    if (isLInExpressions(this.fields.dayOfMonth)) {
      dayOfMonthMatch = dayOfMonthMatch || currentDate.isLastDayOfMonth();
    }
    var dayOfWeekMatch = matchSchedule(currentDate.getDay(), this.fields.dayOfWeek);
    if (isLInExpressions(this.fields.dayOfWeek)) {
      dayOfWeekMatch = dayOfWeekMatch || isLastWeekdayOfMonthMatch(this.fields.dayOfWeek);
    }
    var isDayOfMonthWildcardMatch = this.fields.dayOfMonth.length >= CronExpression$1.daysInMonth[currentDate.getMonth()];
    var isDayOfWeekWildcardMatch = this.fields.dayOfWeek.length === CronExpression$1.constraints[5].max - CronExpression$1.constraints[5].min + 1;
    var currentHour = currentDate.getHours();
    if (!dayOfMonthMatch && (!dayOfWeekMatch || isDayOfWeekWildcardMatch)) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Day");
      continue;
    }
    if (!isDayOfMonthWildcardMatch && isDayOfWeekWildcardMatch && !dayOfMonthMatch) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Day");
      continue;
    }
    if (isDayOfMonthWildcardMatch && !isDayOfWeekWildcardMatch && !dayOfWeekMatch) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Day");
      continue;
    }
    if (this._nthDayOfWeek > 0 && !isNthDayMatch(currentDate, this._nthDayOfWeek)) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Day");
      continue;
    }
    if (!matchSchedule(currentDate.getMonth() + 1, this.fields.month)) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Month");
      continue;
    }
    if (!matchSchedule(currentHour, this.fields.hour)) {
      if (this._dstStart !== currentHour) {
        this._dstStart = null;
        this._applyTimezoneShift(currentDate, dateMathVerb, "Hour");
        continue;
      } else if (!matchSchedule(currentHour - 1, this.fields.hour)) {
        currentDate[dateMathVerb + "Hour"]();
        continue;
      }
    } else if (this._dstEnd === currentHour) {
      if (!reverse) {
        this._dstEnd = null;
        this._applyTimezoneShift(currentDate, "add", "Hour");
        continue;
      }
    }
    if (!matchSchedule(currentDate.getMinutes(), this.fields.minute)) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Minute");
      continue;
    }
    if (!matchSchedule(currentDate.getSeconds(), this.fields.second)) {
      this._applyTimezoneShift(currentDate, dateMathVerb, "Second");
      continue;
    }
    if (startTimestamp === currentDate.getTime()) {
      if (dateMathVerb === "add" || currentDate.getMilliseconds() === 0) {
        this._applyTimezoneShift(currentDate, dateMathVerb, "Second");
      } else {
        currentDate.setMilliseconds(0);
      }
      continue;
    }
    break;
  }
  if (stepCount >= LOOP_LIMIT) {
    throw new Error("Invalid expression, loop limit exceeded");
  }
  this._currentDate = new CronDate$2(currentDate, this._tz);
  this._hasIterated = true;
  return currentDate;
};
CronExpression$1.prototype.next = function next() {
  var schedule2 = this._findSchedule();
  if (this._isIterator) {
    return {
      value: schedule2,
      done: !this.hasNext()
    };
  }
  return schedule2;
};
CronExpression$1.prototype.prev = function prev() {
  var schedule2 = this._findSchedule(true);
  if (this._isIterator) {
    return {
      value: schedule2,
      done: !this.hasPrev()
    };
  }
  return schedule2;
};
CronExpression$1.prototype.hasNext = function() {
  var current = this._currentDate;
  var hasIterated = this._hasIterated;
  try {
    this._findSchedule();
    return true;
  } catch (err) {
    return false;
  } finally {
    this._currentDate = current;
    this._hasIterated = hasIterated;
  }
};
CronExpression$1.prototype.hasPrev = function() {
  var current = this._currentDate;
  var hasIterated = this._hasIterated;
  try {
    this._findSchedule(true);
    return true;
  } catch (err) {
    return false;
  } finally {
    this._currentDate = current;
    this._hasIterated = hasIterated;
  }
};
CronExpression$1.prototype.iterate = function iterate(steps, callback) {
  var dates = [];
  if (steps >= 0) {
    for (var i = 0, c = steps; i < c; i++) {
      try {
        var item = this.next();
        dates.push(item);
        if (callback) {
          callback(item, i);
        }
      } catch (err) {
        break;
      }
    }
  } else {
    for (var i = 0, c = steps; i > c; i--) {
      try {
        var item = this.prev();
        dates.push(item);
        if (callback) {
          callback(item, i);
        }
      } catch (err) {
        break;
      }
    }
  }
  return dates;
};
CronExpression$1.prototype.reset = function reset(newDate) {
  this._currentDate = new CronDate$2(newDate || this._options.currentDate);
};
CronExpression$1.prototype.stringify = function stringify(includeSeconds) {
  var resultArr = [];
  for (var i = includeSeconds ? 0 : 1, c = CronExpression$1.map.length; i < c; ++i) {
    var field = CronExpression$1.map[i];
    var value = this.fields[field];
    var constraint = CronExpression$1.constraints[i];
    if (field === "dayOfMonth" && this.fields.month.length === 1) {
      constraint = { min: 1, max: CronExpression$1.daysInMonth[this.fields.month[0] - 1] };
    } else if (field === "dayOfWeek") {
      constraint = { min: 0, max: 6 };
      value = value[value.length - 1] === 7 ? value.slice(0, -1) : value;
    }
    resultArr.push(stringifyField(value, constraint.min, constraint.max));
  }
  return resultArr.join(" ");
};
CronExpression$1.parse = function parse2(expression2, options) {
  var self2 = this;
  if (typeof options === "function") {
    options = {};
  }
  function parse3(expression3, options2) {
    if (!options2) {
      options2 = {};
    }
    if (typeof options2.currentDate === "undefined") {
      options2.currentDate = new CronDate$2(void 0, self2._tz);
    }
    if (CronExpression$1.predefined[expression3]) {
      expression3 = CronExpression$1.predefined[expression3];
    }
    var fields = [];
    var atoms = (expression3 + "").trim().split(/\s+/);
    if (atoms.length > 6) {
      throw new Error("Invalid cron expression");
    }
    var start = CronExpression$1.map.length - atoms.length;
    for (var i = 0, c = CronExpression$1.map.length; i < c; ++i) {
      var field = CronExpression$1.map[i];
      var value = atoms[atoms.length > c ? i : i - start];
      if (i < start || !value) {
        fields.push(
          CronExpression$1._parseField(
            field,
            CronExpression$1.parseDefaults[i],
            CronExpression$1.constraints[i]
          )
        );
      } else {
        var val = field === "dayOfWeek" ? parseNthDay(value) : value;
        fields.push(
          CronExpression$1._parseField(
            field,
            val,
            CronExpression$1.constraints[i]
          )
        );
      }
    }
    var mappedFields = {};
    for (var i = 0, c = CronExpression$1.map.length; i < c; i++) {
      var key = CronExpression$1.map[i];
      mappedFields[key] = fields[i];
    }
    var dayOfMonth = CronExpression$1._handleMaxDaysInMonth(mappedFields);
    mappedFields.dayOfMonth = dayOfMonth || mappedFields.dayOfMonth;
    return new CronExpression$1(mappedFields, options2);
    function parseNthDay(val2) {
      var atoms2 = val2.split("#");
      if (atoms2.length > 1) {
        var nthValue = +atoms2[atoms2.length - 1];
        if (/,/.test(val2)) {
          throw new Error("Constraint error, invalid dayOfWeek `#` and `,` special characters are incompatible");
        }
        if (/\//.test(val2)) {
          throw new Error("Constraint error, invalid dayOfWeek `#` and `/` special characters are incompatible");
        }
        if (/-/.test(val2)) {
          throw new Error("Constraint error, invalid dayOfWeek `#` and `-` special characters are incompatible");
        }
        if (atoms2.length > 2 || Number.isNaN(nthValue) || (nthValue < 1 || nthValue > 5)) {
          throw new Error("Constraint error, invalid dayOfWeek occurrence number (#)");
        }
        options2.nthDayOfWeek = nthValue;
        return atoms2[0];
      }
      return val2;
    }
  }
  return parse3(expression2, options);
};
CronExpression$1.fieldsToExpression = function fieldsToExpression(fields, options) {
  function validateConstraints(field2, values2, constraints) {
    if (!values2) {
      throw new Error("Validation error, Field " + field2 + " is missing");
    }
    if (values2.length === 0) {
      throw new Error("Validation error, Field " + field2 + " contains no values");
    }
    for (var i2 = 0, c2 = values2.length; i2 < c2; i2++) {
      var value = values2[i2];
      if (CronExpression$1._isValidConstraintChar(constraints, value)) {
        continue;
      }
      if (typeof value !== "number" || Number.isNaN(value) || value < constraints.min || value > constraints.max) {
        throw new Error(
          "Constraint error, got value " + value + " expected range " + constraints.min + "-" + constraints.max
        );
      }
    }
  }
  var mappedFields = {};
  for (var i = 0, c = CronExpression$1.map.length; i < c; ++i) {
    var field = CronExpression$1.map[i];
    var values = fields[field];
    validateConstraints(
      field,
      values,
      CronExpression$1.constraints[i]
    );
    var copy = [];
    var j = -1;
    while (++j < values.length) {
      copy[j] = values[j];
    }
    values = copy.sort(CronExpression$1._sortCompareFn).filter(function(item, pos, ary) {
      return !pos || item !== ary[pos - 1];
    });
    if (values.length !== copy.length) {
      throw new Error("Validation error, Field " + field + " contains duplicate values");
    }
    mappedFields[field] = values;
  }
  var dayOfMonth = CronExpression$1._handleMaxDaysInMonth(mappedFields);
  mappedFields.dayOfMonth = dayOfMonth || mappedFields.dayOfMonth;
  return new CronExpression$1(mappedFields, options || {});
};
var expression = CronExpression$1;
var CronExpression = expression;
function CronParser() {
}
CronParser._parseEntry = function _parseEntry(entry) {
  var atoms = entry.split(" ");
  if (atoms.length === 6) {
    return {
      interval: CronExpression.parse(entry)
    };
  } else if (atoms.length > 6) {
    return {
      interval: CronExpression.parse(
        atoms.slice(0, 6).join(" ")
      ),
      command: atoms.slice(6, atoms.length)
    };
  } else {
    throw new Error("Invalid entry: " + entry);
  }
};
CronParser.parseExpression = function parseExpression(expression2, options) {
  return CronExpression.parse(expression2, options);
};
CronParser.fieldsToExpression = function fieldsToExpression2(fields, options) {
  return CronExpression.fieldsToExpression(fields, options);
};
CronParser.parseString = function parseString(data) {
  var blocks = data.split("\n");
  var response = {
    variables: {},
    expressions: [],
    errors: {}
  };
  for (var i = 0, c = blocks.length; i < c; i++) {
    var block = blocks[i];
    var matches = null;
    var entry = block.trim();
    if (entry.length > 0) {
      if (entry.match(/^#/)) {
        continue;
      } else if (matches = entry.match(/^(.*)=(.*)$/)) {
        response.variables[matches[1]] = matches[2];
      } else {
        var result = null;
        try {
          result = CronParser._parseEntry("0 " + entry);
          response.expressions.push(result.interval);
        } catch (err) {
          response.errors[entry] = err;
        }
      }
    }
  }
  return response;
};
CronParser.parseFile = function parseFile(filePath, callback) {
  require$$0$1.readFile(filePath, function(err, data) {
    if (err) {
      callback(err);
      return;
    }
    return callback(null, CronParser.parseString(data.toString()));
  });
};
var parser = CronParser;
var sortedArrayFunctions = {};
sortedArrayFunctions.add = add;
sortedArrayFunctions.addFromFront = addFromFront;
sortedArrayFunctions.remove = remove;
sortedArrayFunctions.has = has;
sortedArrayFunctions.eq = eq;
sortedArrayFunctions.lte = lte;
sortedArrayFunctions.lt = lt$1;
sortedArrayFunctions.gte = gte;
sortedArrayFunctions.gt = gt;
sortedArrayFunctions.nearest = nearest;
function defaultCmp(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
function add(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var top = list.push(value) - 1;
  while (top) {
    if (cmp(list[top - 1], value) < 0) return;
    list[top] = list[top - 1];
    list[top - 1] = value;
    top--;
  }
}
function addFromFront(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var top = list.unshift(value) - 1;
  for (var i = 0; i < top; i++) {
    if (cmp(value, list[i + 1]) < 0) return;
    list[i] = list[i + 1];
    list[i + 1] = value;
  }
}
function lte(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var i = indexOf(list, value, cmp);
  if (i === -1) return -1;
  for (; i >= 0; i--) {
    var c = cmp(list[i], value);
    if (c <= 0) return i;
  }
  return -1;
}
function lt$1(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var i = indexOf(list, value, cmp);
  if (i === -1) return -1;
  for (; i >= 0; i--) {
    var c = cmp(list[i], value);
    if (c < 0) return i;
  }
  return -1;
}
function gte(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var i = indexOf(list, value, cmp);
  if (i === -1) return -1;
  for (; i < list.length; i++) {
    var c = cmp(list[i], value);
    if (c >= 0) return i;
  }
  return -1;
}
function gt(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var i = indexOf(list, value, cmp);
  if (i === -1) return -1;
  for (; i < list.length; i++) {
    var c = cmp(list[i], value);
    if (c > 0) return i;
  }
  return -1;
}
function eq(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var i = indexOf(list, value, cmp);
  if (i === -1) return -1;
  return cmp(list[i], value) === 0 ? i : -1;
}
function nearest(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var len = list.length;
  var top = len - 1;
  var btm = 0;
  var mid = -1;
  var trending = 1;
  while (top >= btm && btm >= 0 && top < len) {
    mid = Math.floor((top + btm) / 2);
    var c = cmp(list[mid], value);
    if (c === 0) return mid;
    if (c >= 0) {
      if (trending === 1) trending = 0;
      else if (trending === 2) {
        if (Math.abs(list[mid] - value) > Math.abs(list[mid - 1] - value)) return mid - 1;
        return mid;
      }
      top = mid - 1;
    } else {
      if (trending === 1) trending = 2;
      else if (trending === 0) return mid;
      btm = mid + 1;
    }
  }
  return mid;
}
function indexOf(list, value, cmp) {
  if (!cmp) cmp = defaultCmp;
  var len = list.length;
  var top = len - 1;
  var btm = 0;
  var mid = -1;
  while (top >= btm && btm >= 0 && top < len) {
    mid = Math.floor((top + btm) / 2);
    var c = cmp(list[mid], value);
    if (c === 0) return mid;
    if (c >= 0) {
      top = mid - 1;
    } else {
      btm = mid + 1;
    }
  }
  return mid;
}
function has(list, value, cmp) {
  return eq(list, value, cmp) > -1;
}
function remove(list, value, cmp) {
  var i = eq(list, value, cmp);
  if (i === -1) return false;
  list.splice(i, 1);
  return true;
}
var longTimeout = {};
(function(exports) {
  var TIMEOUT_MAX = 2147483647;
  exports.setTimeout = function(listener, after) {
    return new Timeout(listener, after);
  };
  exports.setInterval = function(listener, after) {
    return new Interval2(listener, after);
  };
  exports.clearTimeout = function(timer) {
    if (timer) timer.close();
  };
  exports.clearInterval = exports.clearTimeout;
  exports.Timeout = Timeout;
  exports.Interval = Interval2;
  function Timeout(listener, after) {
    this.listener = listener;
    this.after = after;
    this.unreffed = false;
    this.start();
  }
  Timeout.prototype.unref = function() {
    if (!this.unreffed) {
      this.unreffed = true;
      this.timeout.unref();
    }
  };
  Timeout.prototype.ref = function() {
    if (this.unreffed) {
      this.unreffed = false;
      this.timeout.ref();
    }
  };
  Timeout.prototype.start = function() {
    if (this.after <= TIMEOUT_MAX) {
      this.timeout = setTimeout(this.listener, this.after);
    } else {
      var self2 = this;
      this.timeout = setTimeout(function() {
        self2.after -= TIMEOUT_MAX;
        self2.start();
      }, TIMEOUT_MAX);
    }
    if (this.unreffed) {
      this.timeout.unref();
    }
  };
  Timeout.prototype.close = function() {
    clearTimeout(this.timeout);
  };
  function Interval2(listener, after) {
    this.listener = listener;
    this.after = this.timeLeft = after;
    this.unreffed = false;
    this.start();
  }
  Interval2.prototype.unref = function() {
    if (!this.unreffed) {
      this.unreffed = true;
      this.timeout.unref();
    }
  };
  Interval2.prototype.ref = function() {
    if (this.unreffed) {
      this.unreffed = false;
      this.timeout.ref();
    }
  };
  Interval2.prototype.start = function() {
    var self2 = this;
    if (this.timeLeft <= TIMEOUT_MAX) {
      this.timeout = setTimeout(function() {
        self2.listener();
        self2.timeLeft = self2.after;
        self2.start();
      }, this.timeLeft);
    } else {
      this.timeout = setTimeout(function() {
        self2.timeLeft -= TIMEOUT_MAX;
        self2.start();
      }, TIMEOUT_MAX);
    }
    if (this.unreffed) {
      this.timeout.unref();
    }
  };
  Interval2.prototype.close = function() {
    Timeout.prototype.close.apply(this, arguments);
  };
})(longTimeout);
const lt = longTimeout;
const CronDate$1 = date;
const sorted$1 = sortedArrayFunctions;
const invocations = [];
let currentInvocation = null;
const DoesntRecur = new RecurrenceRule$2();
DoesntRecur.recurs = false;
function Invocation$2(job, fireDate, recurrenceRule, endDate) {
  this.job = job;
  this.fireDate = fireDate;
  this.endDate = endDate;
  this.recurrenceRule = recurrenceRule || DoesntRecur;
  this.timerID = null;
}
function sorter$1(a, b) {
  return a.fireDate.getTime() - b.fireDate.getTime();
}
function Range$1(start, end, step) {
  this.start = start || 0;
  this.end = end || 60;
  this.step = step || 1;
}
Range$1.prototype.contains = function(val) {
  if (this.step === null || this.step === 1) {
    return val >= this.start && val <= this.end;
  } else {
    for (let i = this.start; i < this.end; i += this.step) {
      if (i === val) {
        return true;
      }
    }
    return false;
  }
};
function RecurrenceRule$2(year, month, date2, dayOfWeek2, hour, minute, second) {
  this.recurs = true;
  this.year = year == null ? null : year;
  this.month = month == null ? null : month;
  this.date = date2 == null ? null : date2;
  this.dayOfWeek = dayOfWeek2 == null ? null : dayOfWeek2;
  this.hour = hour == null ? null : hour;
  this.minute = minute == null ? null : minute;
  this.second = second == null ? 0 : second;
}
RecurrenceRule$2.prototype.isValid = function() {
  function isValidType(num) {
    if (Array.isArray(num) || num instanceof Array) {
      return num.every(function(e) {
        return isValidType(e);
      });
    }
    return !(Number.isNaN(Number(num)) && !(num instanceof Range$1));
  }
  if (this.month !== null && (this.month < 0 || this.month > 11 || !isValidType(this.month))) {
    return false;
  }
  if (this.dayOfWeek !== null && (this.dayOfWeek < 0 || this.dayOfWeek > 6 || !isValidType(this.dayOfWeek))) {
    return false;
  }
  if (this.hour !== null && (this.hour < 0 || this.hour > 23 || !isValidType(this.hour))) {
    return false;
  }
  if (this.minute !== null && (this.minute < 0 || this.minute > 59 || !isValidType(this.minute))) {
    return false;
  }
  if (this.second !== null && (this.second < 0 || this.second > 59 || !isValidType(this.second))) {
    return false;
  }
  if (this.date !== null) {
    if (!isValidType(this.date)) {
      return false;
    }
    switch (this.month) {
      case 3:
      case 5:
      case 8:
      case 10:
        if (this.date < 1 || this.date > 30) {
          return false;
        }
        break;
      case 1:
        if (this.date < 1 || this.date > 29) {
          return false;
        }
        break;
      default:
        if (this.date < 1 || this.date > 31) {
          return false;
        }
    }
  }
  return true;
};
RecurrenceRule$2.prototype.nextInvocationDate = function(base) {
  const next2 = this._nextInvocationDate(base);
  return next2 ? next2.toDate() : null;
};
RecurrenceRule$2.prototype._nextInvocationDate = function(base) {
  base = base instanceof CronDate$1 || base instanceof Date ? base : /* @__PURE__ */ new Date();
  if (!this.recurs) {
    return null;
  }
  if (!this.isValid()) {
    return null;
  }
  const now2 = new CronDate$1(Date.now(), this.tz);
  let fullYear = now2.getFullYear();
  if (this.year !== null && typeof this.year == "number" && this.year < fullYear) {
    return null;
  }
  let next2 = new CronDate$1(base.getTime(), this.tz);
  next2.addSecond();
  while (true) {
    if (this.year !== null) {
      fullYear = next2.getFullYear();
      if (typeof this.year == "number" && this.year < fullYear) {
        next2 = null;
        break;
      }
      if (!recurMatch(fullYear, this.year)) {
        next2.addYear();
        next2.setMonth(0);
        next2.setDate(1);
        next2.setHours(0);
        next2.setMinutes(0);
        next2.setSeconds(0);
        continue;
      }
    }
    if (this.month != null && !recurMatch(next2.getMonth(), this.month)) {
      next2.addMonth();
      continue;
    }
    if (this.date != null && !recurMatch(next2.getDate(), this.date)) {
      next2.addDay();
      continue;
    }
    if (this.dayOfWeek != null && !recurMatch(next2.getDay(), this.dayOfWeek)) {
      next2.addDay();
      continue;
    }
    if (this.hour != null && !recurMatch(next2.getHours(), this.hour)) {
      next2.addHour();
      continue;
    }
    if (this.minute != null && !recurMatch(next2.getMinutes(), this.minute)) {
      next2.addMinute();
      continue;
    }
    if (this.second != null && !recurMatch(next2.getSeconds(), this.second)) {
      next2.addSecond();
      continue;
    }
    break;
  }
  return next2;
};
function recurMatch(val, matcher) {
  if (matcher == null) {
    return true;
  }
  if (typeof matcher === "number") {
    return val === matcher;
  } else if (typeof matcher === "string") {
    return val === Number(matcher);
  } else if (matcher instanceof Range$1) {
    return matcher.contains(val);
  } else if (Array.isArray(matcher) || matcher instanceof Array) {
    for (let i = 0; i < matcher.length; i++) {
      if (recurMatch(val, matcher[i])) {
        return true;
      }
    }
  }
  return false;
}
function runOnDate(date2, job) {
  const now2 = Date.now();
  const then = date2.getTime();
  return lt.setTimeout(function() {
    if (then > Date.now())
      runOnDate(date2, job);
    else
      job();
  }, then < now2 ? 0 : then - now2);
}
function scheduleInvocation$1(invocation) {
  sorted$1.add(invocations, invocation, sorter$1);
  prepareNextInvocation();
  const date2 = invocation.fireDate instanceof CronDate$1 ? invocation.fireDate.toDate() : invocation.fireDate;
  invocation.job.emit("scheduled", date2);
}
function prepareNextInvocation() {
  if (invocations.length > 0 && currentInvocation !== invocations[0]) {
    if (currentInvocation !== null) {
      lt.clearTimeout(currentInvocation.timerID);
      currentInvocation.timerID = null;
      currentInvocation = null;
    }
    currentInvocation = invocations[0];
    const job = currentInvocation.job;
    const cinv = currentInvocation;
    currentInvocation.timerID = runOnDate(currentInvocation.fireDate, function() {
      currentInvocationFinished();
      if (job.callback) {
        job.callback();
      }
      if (cinv.recurrenceRule.recurs || cinv.recurrenceRule._endDate === null) {
        const inv = scheduleNextRecurrence$1(cinv.recurrenceRule, cinv.job, cinv.fireDate, cinv.endDate);
        if (inv !== null) {
          inv.job.trackInvocation(inv);
        }
      }
      job.stopTrackingInvocation(cinv);
      try {
        const result = job.invoke(cinv.fireDate instanceof CronDate$1 ? cinv.fireDate.toDate() : cinv.fireDate);
        job.emit("run");
        job.running += 1;
        if (result instanceof Promise) {
          result.then(function(value) {
            job.emit("success", value);
            job.running -= 1;
          }).catch(function(err) {
            job.emit("error", err);
            job.running -= 1;
          });
        } else {
          job.emit("success", result);
          job.running -= 1;
        }
      } catch (err) {
        job.emit("error", err);
        job.running -= 1;
      }
      if (job.isOneTimeJob) {
        job.deleteFromSchedule();
      }
    });
  }
}
function currentInvocationFinished() {
  invocations.shift();
  currentInvocation = null;
  prepareNextInvocation();
}
function cancelInvocation$1(invocation) {
  const idx = invocations.indexOf(invocation);
  if (idx > -1) {
    invocations.splice(idx, 1);
    if (invocation.timerID !== null) {
      lt.clearTimeout(invocation.timerID);
    }
    if (currentInvocation === invocation) {
      currentInvocation = null;
    }
    invocation.job.emit("canceled", invocation.fireDate);
    prepareNextInvocation();
  }
}
function scheduleNextRecurrence$1(rule, job, prevDate, endDate) {
  prevDate = prevDate instanceof CronDate$1 ? prevDate : new CronDate$1();
  const date2 = rule instanceof RecurrenceRule$2 ? rule._nextInvocationDate(prevDate) : rule.next();
  if (date2 === null) {
    return null;
  }
  if (endDate instanceof CronDate$1 && date2.getTime() > endDate.getTime()) {
    return null;
  }
  const inv = new Invocation$2(job, date2, rule, endDate);
  scheduleInvocation$1(inv);
  return inv;
}
var Invocation_1 = {
  Range: Range$1,
  RecurrenceRule: RecurrenceRule$2,
  Invocation: Invocation$2,
  cancelInvocation: cancelInvocation$1,
  scheduleInvocation: scheduleInvocation$1,
  scheduleNextRecurrence: scheduleNextRecurrence$1,
  sorter: sorter$1
};
function isValidDate$1(date2) {
  return date2.getTime() === date2.getTime();
}
var dateUtils = {
  isValidDate: isValidDate$1
};
const events = require$$0$2;
const cronParser = parser;
const CronDate = date;
const sorted = sortedArrayFunctions;
const { scheduleNextRecurrence, scheduleInvocation, cancelInvocation, RecurrenceRule: RecurrenceRule$1, sorter, Invocation: Invocation$1 } = Invocation_1;
const { isValidDate } = dateUtils;
const scheduledJobs$2 = {};
let anonJobCounter = 0;
function resolveAnonJobName() {
  const now2 = /* @__PURE__ */ new Date();
  if (anonJobCounter === Number.MAX_SAFE_INTEGER) {
    anonJobCounter = 0;
  }
  anonJobCounter++;
  return `<Anonymous Job ${anonJobCounter} ${now2.toISOString()}>`;
}
function Job$2(name, job, callback) {
  this.pendingInvocations = [];
  let triggeredJobs = 0;
  const jobName = name && typeof name === "string" ? name : resolveAnonJobName();
  this.job = name && typeof name === "function" ? name : job;
  if (this.job === name) {
    this.callback = typeof job === "function" ? job : false;
  } else {
    this.callback = typeof callback === "function" ? callback : false;
  }
  this.running = 0;
  if (typeof this.job === "function" && this.job.prototype && this.job.prototype.next) {
    this.job = (function() {
      return this.next().value;
    }).bind(this.job.call(this));
  }
  Object.defineProperty(this, "name", {
    value: jobName,
    writable: false,
    enumerable: true
  });
  this.trackInvocation = function(invocation) {
    sorted.add(this.pendingInvocations, invocation, sorter);
    return true;
  };
  this.stopTrackingInvocation = function(invocation) {
    const invIdx = this.pendingInvocations.indexOf(invocation);
    if (invIdx > -1) {
      this.pendingInvocations.splice(invIdx, 1);
      return true;
    }
    return false;
  };
  this.triggeredJobs = function() {
    return triggeredJobs;
  };
  this.setTriggeredJobs = function(triggeredJob) {
    triggeredJobs = triggeredJob;
  };
  this.deleteFromSchedule = function() {
    deleteScheduledJob(this.name);
  };
  this.cancel = function(reschedule) {
    reschedule = typeof reschedule == "boolean" ? reschedule : false;
    let inv, newInv;
    const newInvs = [];
    for (let j = 0; j < this.pendingInvocations.length; j++) {
      inv = this.pendingInvocations[j];
      cancelInvocation(inv);
      if (reschedule && (inv.recurrenceRule.recurs || inv.recurrenceRule.next)) {
        newInv = scheduleNextRecurrence(inv.recurrenceRule, this, inv.fireDate, inv.endDate);
        if (newInv !== null) {
          newInvs.push(newInv);
        }
      }
    }
    this.pendingInvocations = [];
    for (let k = 0; k < newInvs.length; k++) {
      this.trackInvocation(newInvs[k]);
    }
    if (!reschedule) {
      this.deleteFromSchedule();
    }
    return true;
  };
  this.cancelNext = function(reschedule) {
    reschedule = typeof reschedule == "boolean" ? reschedule : true;
    if (!this.pendingInvocations.length) {
      return false;
    }
    let newInv;
    const nextInv = this.pendingInvocations.shift();
    cancelInvocation(nextInv);
    if (reschedule && (nextInv.recurrenceRule.recurs || nextInv.recurrenceRule.next)) {
      newInv = scheduleNextRecurrence(nextInv.recurrenceRule, this, nextInv.fireDate, nextInv.endDate);
      if (newInv !== null) {
        this.trackInvocation(newInv);
      }
    }
    return true;
  };
  this.reschedule = function(spec) {
    let inv;
    const invocationsToCancel = this.pendingInvocations.slice();
    for (let j = 0; j < invocationsToCancel.length; j++) {
      inv = invocationsToCancel[j];
      cancelInvocation(inv);
    }
    this.pendingInvocations = [];
    if (this.schedule(spec)) {
      this.setTriggeredJobs(0);
      return true;
    } else {
      this.pendingInvocations = invocationsToCancel;
      return false;
    }
  };
  this.nextInvocation = function() {
    if (!this.pendingInvocations.length) {
      return null;
    }
    return this.pendingInvocations[0].fireDate;
  };
}
Object.setPrototypeOf(Job$2.prototype, events.EventEmitter.prototype);
Job$2.prototype.invoke = function(fireDate) {
  this.setTriggeredJobs(this.triggeredJobs() + 1);
  return this.job(fireDate);
};
Job$2.prototype.runOnDate = function(date2) {
  return this.schedule(date2);
};
Job$2.prototype.schedule = function(spec) {
  const self2 = this;
  let success = false;
  let inv;
  let start;
  let end;
  let tz;
  if (typeof spec === "object" && "tz" in spec) {
    tz = spec.tz;
  }
  if (typeof spec === "object" && spec.rule) {
    start = spec.start || void 0;
    end = spec.end || void 0;
    spec = spec.rule;
    if (start) {
      if (!(start instanceof Date)) {
        start = new Date(start);
      }
      start = new CronDate(start, tz);
      if (!isValidDate(start) || start.getTime() < Date.now()) {
        start = void 0;
      }
    }
    if (end && !(end instanceof Date) && !isValidDate(end = new Date(end))) {
      end = void 0;
    }
    if (end) {
      end = new CronDate(end, tz);
    }
  }
  try {
    const res = cronParser.parseExpression(spec, { currentDate: start, tz });
    inv = scheduleNextRecurrence(res, self2, start, end);
    if (inv !== null) {
      success = self2.trackInvocation(inv);
    }
  } catch (err) {
    const type2 = typeof spec;
    if (type2 === "string" || type2 === "number") {
      spec = new Date(spec);
    }
    if (spec instanceof Date && isValidDate(spec)) {
      spec = new CronDate(spec);
      self2.isOneTimeJob = true;
      if (spec.getTime() >= Date.now()) {
        inv = new Invocation$1(self2, spec);
        scheduleInvocation(inv);
        success = self2.trackInvocation(inv);
      }
    } else if (type2 === "object") {
      self2.isOneTimeJob = false;
      if (!(spec instanceof RecurrenceRule$1)) {
        const r = new RecurrenceRule$1();
        if ("year" in spec) {
          r.year = spec.year;
        }
        if ("month" in spec) {
          r.month = spec.month;
        }
        if ("date" in spec) {
          r.date = spec.date;
        }
        if ("dayOfWeek" in spec) {
          r.dayOfWeek = spec.dayOfWeek;
        }
        if ("hour" in spec) {
          r.hour = spec.hour;
        }
        if ("minute" in spec) {
          r.minute = spec.minute;
        }
        if ("second" in spec) {
          r.second = spec.second;
        }
        spec = r;
      }
      spec.tz = tz;
      inv = scheduleNextRecurrence(spec, self2, start, end);
      if (inv !== null) {
        success = self2.trackInvocation(inv);
      }
    }
  }
  scheduledJobs$2[this.name] = this;
  return success;
};
function deleteScheduledJob(name) {
  if (name) {
    delete scheduledJobs$2[name];
  }
}
var Job_1 = {
  Job: Job$2,
  scheduledJobs: scheduledJobs$2
};
const { Job: Job$1, scheduledJobs: scheduledJobs$1 } = Job_1;
function scheduleJob$1() {
  if (arguments.length < 2) {
    throw new RangeError("Invalid number of arguments");
  }
  const name = arguments.length >= 3 && typeof arguments[0] === "string" ? arguments[0] : null;
  const spec = name ? arguments[1] : arguments[0];
  const method = name ? arguments[2] : arguments[1];
  const callback = name ? arguments[3] : arguments[2];
  if (typeof method !== "function") {
    throw new RangeError("The job method must be a function.");
  }
  const job = new Job$1(name, method, callback);
  if (job.schedule(spec)) {
    return job;
  }
  return null;
}
function rescheduleJob$1(job, spec) {
  if (job instanceof Job$1) {
    if (job.reschedule(spec)) {
      return job;
    }
  } else if (typeof job === "string") {
    if (Object.prototype.hasOwnProperty.call(scheduledJobs$1, job)) {
      if (scheduledJobs$1[job].reschedule(spec)) {
        return scheduledJobs$1[job];
      }
    } else {
      throw new Error("Cannot reschedule one-off job by name, pass job reference instead");
    }
  }
  return null;
}
function cancelJob$1(job) {
  let success = false;
  if (job instanceof Job$1) {
    success = job.cancel();
  } else if (typeof job == "string" || job instanceof String) {
    if (job in scheduledJobs$1 && Object.prototype.hasOwnProperty.call(scheduledJobs$1, job)) {
      success = scheduledJobs$1[job].cancel();
    }
  }
  return success;
}
function gracefulShutdown$1() {
  const jobs = Object.keys(scheduledJobs$1).map((key) => scheduledJobs$1[key]);
  jobs.forEach(function(job) {
    job.cancel();
  });
  let running = false;
  for (let i = 0; i < jobs.length; i++) {
    if (jobs[i].running > 0) {
      running = true;
      break;
    }
  }
  return new Promise(function(resolve2) {
    if (running) {
      setInterval(function() {
        for (let i = 0; i < jobs.length; i++) {
          if (jobs[i].running > 0) {
            return;
          }
        }
        resolve2();
      }, 500);
    } else {
      resolve2();
    }
  });
}
var schedule = {
  scheduleJob: scheduleJob$1,
  rescheduleJob: rescheduleJob$1,
  scheduledJobs: scheduledJobs$1,
  cancelJob: cancelJob$1,
  gracefulShutdown: gracefulShutdown$1
};
const { cancelJob, rescheduleJob, scheduledJobs, scheduleJob, gracefulShutdown } = schedule;
const { Invocation, RecurrenceRule, Range } = Invocation_1;
const { Job } = Job_1;
var nodeSchedule = {
  Job,
  Invocation,
  Range,
  RecurrenceRule,
  cancelJob,
  rescheduleJob,
  scheduledJobs,
  scheduleJob,
  gracefulShutdown
};
const nodeSchedule$1 = /* @__PURE__ */ getDefaultExportFromCjs(nodeSchedule);
const scheduleJobs = /* @__PURE__ */ new Map();
function getValidWindow() {
  const windows = BrowserWindow.getAllWindows();
  return windows.find((win2) => !win2.isDestroyed()) || null;
}
function setupScheduleHandlers() {
  ipcMain.handle("create-schedule", async (_event, options) => {
    var _a2;
    try {
      if (scheduleJobs.has(options.id)) {
        (_a2 = scheduleJobs.get(options.id)) == null ? void 0 : _a2.cancel();
      }
      const job = nodeSchedule$1.scheduleJob(options.cron, () => {
        const win2 = getValidWindow();
        if (win2) {
          try {
            win2.webContents.send("schedule-triggered", {
              id: options.id,
              task: options.task
            });
          } catch (error) {
            console.error("Failed to send schedule-triggered event:", error);
          }
        }
      });
      scheduleJobs.set(options.id, job);
      return true;
    } catch (error) {
      console.error("Failed to create schedule:", error);
      return false;
    }
  });
  ipcMain.handle("cancel-schedule", (_event, id) => {
    const job = scheduleJobs.get(id);
    if (job) {
      job.cancel();
      scheduleJobs.delete(id);
      return true;
    }
    return false;
  });
  ipcMain.handle("update-schedule", async (_event, options) => {
    var _a2;
    try {
      if (scheduleJobs.has(options.id)) {
        (_a2 = scheduleJobs.get(options.id)) == null ? void 0 : _a2.cancel();
      }
      const job = nodeSchedule$1.scheduleJob(options.cron, () => {
        const win2 = getValidWindow();
        if (win2) {
          try {
            win2.webContents.send("schedule-triggered", {
              id: options.id,
              task: options.task
            });
          } catch (error) {
            console.error("Failed to send schedule-triggered event:", error);
          }
        }
      });
      scheduleJobs.set(options.id, job);
      return true;
    } catch (error) {
      console.error("Failed to create schedule:", error);
      return false;
    }
  });
  ipcMain.handle("get-schedules", () => {
    return Array.from(scheduleJobs.keys());
  });
}
const _NotificationWindowManager = class _NotificationWindowManager {
  constructor() {
    __publicField(this, "windows", /* @__PURE__ */ new Map());
  }
  /**
   * 创建通知窗口
   */
  createWindow(options) {
    this.closeWindow(options.id);
    const position = this.calculatePosition();
    const window2 = this.buildWindow(position);
    this.setupWindowEvents(window2, options.id);
    this.windows.set(options.id, window2);
    console.log("NotificationWindowManager - Window created:", options.id);
    return window2;
  }
  /**
   * 关闭指定窗口
   */
  closeWindow(id) {
    const window2 = this.windows.get(id);
    if (window2 && !window2.isDestroyed()) {
      window2.close();
      return true;
    }
    return false;
  }
  /**
   * 获取窗口
   */
  getWindow(id) {
    return this.windows.get(id);
  }
  /**
   * 获取所有窗口
   */
  getAllWindows() {
    return new Map(this.windows);
  }
  /**
   * 计算窗口位置
   */
  calculatePosition() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;
    const x = screenWidth - _NotificationWindowManager.WINDOW_CONFIG.WIDTH - _NotificationWindowManager.WINDOW_CONFIG.MARGIN;
    const y = _NotificationWindowManager.WINDOW_CONFIG.MARGIN + this.windows.size * (_NotificationWindowManager.WINDOW_CONFIG.HEIGHT + _NotificationWindowManager.WINDOW_CONFIG.MARGIN);
    return { x, y };
  }
  /**
   * 构建窗口
   */
  buildWindow(position) {
    return new BrowserWindow({
      width: _NotificationWindowManager.WINDOW_CONFIG.WIDTH,
      height: _NotificationWindowManager.WINDOW_CONFIG.HEIGHT,
      x: position.x,
      y: position.y,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: path.join(MAIN_DIST, "main_preload.mjs"),
        contextIsolation: true,
        nodeIntegration: true,
        webSecurity: false
      }
    });
  }
  /**
   * 设置窗口事件
   */
  setupWindowEvents(window2, id) {
    window2.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          ]
        }
      });
    });
    window2.on("closed", () => {
      this.windows.delete(id);
      this.reorderWindows();
    });
  }
  /**
   * 重新排列窗口位置
   */
  reorderWindows() {
    let index = 0;
    for (const [, window2] of this.windows) {
      if (!window2.isDestroyed()) {
        const y = _NotificationWindowManager.WINDOW_CONFIG.MARGIN + index * (_NotificationWindowManager.WINDOW_CONFIG.HEIGHT + _NotificationWindowManager.WINDOW_CONFIG.MARGIN);
        window2.setPosition(window2.getPosition()[0], y);
        index++;
      }
    }
  }
  /**
   * 构建通知URL
   */
  buildNotificationUrl(options) {
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
    return VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#/notification?${queryParams.toString()}` : `file://${RENDERER_DIST}/index.html#/notification?${queryParams.toString()}`;
  }
};
__publicField(_NotificationWindowManager, "WINDOW_CONFIG", {
  WIDTH: 620,
  HEIGHT: 920,
  MARGIN: 10
});
let NotificationWindowManager = _NotificationWindowManager;
class NotificationService {
  constructor() {
    __publicField(this, "windowManagementService", new NotificationWindowManager());
  }
  async showNotification(options) {
    try {
      const window2 = this.windowManagementService.createWindow(options);
      const url = this.windowManagementService.buildNotificationUrl(options);
      await window2.loadURL(url);
      window2.show();
      return {
        success: true,
        message: "Notification displayed successfully"
      };
    } catch (error) {
      console.error("NotificationService - showNotification Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  closeNotification(id) {
    try {
      const response = this.windowManagementService.closeWindow(id);
      if (!response) {
        throw new Error(
          `Notification with ID ${id} not found or already closed`
        );
      }
      return {
        success: true,
        message: "Notification closed successfully"
      };
    } catch (error) {
      console.error("NotificationService - closeNotification Error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  handleNotificationAction(id, action) {
    const window2 = this.windowManagementService.getWindow(id);
    if (window2) {
      if (action.type === "cancel" || action.type === "confirm") {
        window2.close();
      }
      window2.webContents.send("notification-action", { id, action });
    } else {
      console.warn(`Notification with ID ${id} not found.`);
    }
  }
}
const notificationService = new NotificationService();
function setupNotificationHandler() {
  ipcMain.handle("show-notification", async (_event, options) => {
    try {
      return await notificationService.showNotification(options);
    } catch (error) {
      console.error("IPC Error - show-notification:", error);
      throw error;
    }
  });
  ipcMain.on("close-notification", (_event, id) => {
    try {
      return notificationService.closeNotification(id);
    } catch (error) {
      console.error("IPC Error - close-notification:", error);
    }
  });
  ipcMain.on("notification-action", (_event, id, action) => {
    try {
      return notificationService.handleNotificationAction(id, action);
    } catch (error) {
      console.error("IPC Error - notification-action:", error);
    }
  });
}
function setupAccountModules() {
  console.log("Setting up Account modules...");
  setupUserHandlers();
  setupLoginSessionHandlers();
  StoreIpc.registerHandlers();
  console.log("✓ Account modules ready");
}
function setupSharedModules() {
  console.log("Setting up Shared modules...");
  registerFileSystemHandlers();
  registerGitHandlers();
  console.log("✓ Shared modules ready");
}
function setupWindowModules() {
  console.log("Setting up Window modules...");
  setupNotificationHandler();
  setupScheduleHandlers();
  console.log("✓ Window modules ready");
}
function initializeBasicModules() {
  setupSharedModules();
  setupAccountModules();
}
function initializeAllModules() {
  initializeBasicModules();
  setupWindowModules();
}
app.setName("DailyUse");
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.MAIN_DIST = MAIN_DIST;
process.env.RENDERER_DIST = RENDERER_DIST;
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let tray = null;
let pluginManager = null;
function createWindow() {
  win = new BrowserWindow({
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, "DailyUse.svg"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(MAIN_DIST, "main_preload.mjs"),
      additionalArguments: ["--enable-features=SharedArrayBuffer"],
      allowRunningInsecureContent: false
    },
    width: 1400,
    height: 800
  });
  win.webContents.openDevTools();
  const cspDirectives = {
    "default-src": ["'self'", "local:"],
    "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "local:"],
    "connect-src": ["'self'", "ws:", "wss:", "http:", "https:", "local:"]
  };
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const cspValue = Object.entries(cspDirectives).map(([key, values]) => `${key} ${values.join(" ")}`).join("; ");
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [cspValue]
      }
    });
  });
  pluginManager = new PluginManager();
  if (win) {
    pluginManager.register(new QuickLauncherMainPlugin());
    pluginManager.initializeAll();
  }
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
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
  const icon = nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, "DailyUse-16.png"));
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
  if (win) {
    initializeAllModules();
  }
  protocol.registerFileProtocol("local", (request, callback) => {
    const url = request.url.replace("local://", "");
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error(error);
    }
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
ipcMain.handle("open-external-url", async (_event, url) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    console.error("Failed to open URL:", error);
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
