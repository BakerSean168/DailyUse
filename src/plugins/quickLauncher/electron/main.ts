import { app, globalShortcut, ipcMain, BrowserWindow, dialog } from 'electron';
import { ElectronPlugin, PluginMetadata } from '../../core/types';
import { exec } from 'child_process';
import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// 获取主进程目录
const MAIN_DIST = process.env.MAIN_DIST ?? path.join(process.env.APP_ROOT ?? process.cwd(), 'dist-electron');

export class QuickLauncherMainPlugin implements ElectronPlugin {
  metadata: PluginMetadata = {
    name: 'quickLauncher',
    version: '1.0.0',
    description: 'Quick application launcher with shortcuts',
    author: 'bakersean',
  };

  private quickLauncherWindow: Electron.BrowserWindow | null = null;

  createQuickLauncherWindow() {
    if (this.quickLauncherWindow) {
      // 如果窗口存在，切换显示/隐藏状态
      if (this.quickLauncherWindow.isVisible()) {
        this.quickLauncherWindow.hide();
      } else {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
      return;
    }

    const preloadPath = path.resolve(MAIN_DIST, 'quickLauncher_preload.mjs');
    console.log('Creating quick launcher window with preload path:', preloadPath);

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

    // 设置内容安全策略
    this.quickLauncherWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
          ]
        }
      });
    });

    // 加载完成后再显示窗口，避免白屏
    this.quickLauncherWindow.once('ready-to-show', () => {
      if (this.quickLauncherWindow) {
        this.quickLauncherWindow.show();
        this.quickLauncherWindow.focus();
      }
    });

    // Load the quick launcher URL
    if (process.env.VITE_DEV_SERVER_URL) {
      this.quickLauncherWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/src/plugins/quickLauncher/index.html`);
    } else {
      this.quickLauncherWindow.loadFile(
        path.join(process.env.APP_ROOT || '', 'dist/src/plugins/quickLauncher/index.html')
      );
    }

    // 移除blur事件处理
    this.quickLauncherWindow.on('closed', () => {
      this.quickLauncherWindow = null;
    });
  }

  async init(): Promise<void> {
    console.log('[QuickLauncherMain] 1. 开始初始化主进程插件');
    this.registerIpcHandlers();
    this.registerShortcuts();
    console.log('[QuickLauncherMain] 3. 快捷键注册完成');
  }

  registerIpcHandlers(): void {
    console.log('[QuickLauncherMain] 注册IPC处理器...');
    
    // 注册IPC处理器来处理应用程序启动请求
    ipcMain.handle('launch-application', async (_, path: string) => {
      console.log('[QuickLauncherMain] 收到启动应用请求:', path);
      return new Promise((resolve, reject) => {
        exec(`start "" "${path}"`, (error) => {
          if (error) {
            console.error('[QuickLauncherMain] 启动应用失败:', error);
            reject(error);
          } else {
            console.log('[QuickLauncherMain] 启动应用成功');
            resolve(true);
          }
        });
      });
    });

    ipcMain.handle('select-file', async () => {
      console.log('[QuickLauncherMain] 打开文件选择对话框');
      const result = await dialog.showOpenDialog({
        properties: ['openFile']
      });
      console.log('[QuickLauncherMain] 文件选择结果:', result.filePaths);
      return result;
    });

    ipcMain.handle('get-file-icon', async (_event, filePath) => {
      try {
        // 获取文件图标
        const icon = await app.getFileIcon(filePath, {
          size: 'large' // 可选值: 'small', 'normal', 'large'
        });
        
        // 将图标转换为base64字符串
        return icon.toDataURL();
      } catch (error) {
        console.error('获取文件图标失败:', error);
        return null;
      }
    });
  }

  
  registerShortcuts(): void {
    console.log('[QuickLauncherMain] 注册全局快捷键...');
    // 注册全局快捷键
    globalShortcut.register('Alt+Space', () => {
      console.log('[QuickLauncherMain] 触发Alt+Space快捷键');
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

  async destroy(): Promise<void> {
    globalShortcut.unregister('Alt+Space');
    ipcMain.removeHandler('launch-application');
    ipcMain.removeHandler('select-file');
    if (this.quickLauncherWindow) {
      this.quickLauncherWindow.close();
      this.quickLauncherWindow = null;
    }
  }
}
