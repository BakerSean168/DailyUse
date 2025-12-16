# Desktop 应用架构

> **更新时间**: 2025-12-16
> **技术版本**: Electron 39.2.6 + React 19.2.1

本文档描述 DailyUse Desktop 应用的技术架构，基于 Electron 构建。

---

## 架构概览

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DailyUse Desktop Application                     │
│                    Electron 39.2.6 + React 19.2.1                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Renderer Process (React 19)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │    │
│  │  │   Views     │  │ Components  │  │     Zustand Stores      │ │    │
│  │  │   Pages     │  │  shadcn/ui  │  │     State Management    │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │    │
│  │         │                │                      │               │    │
│  │         ▼                ▼                      ▼               │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │            @dailyuse/infrastructure-client               │  │    │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │    │
│  │  │  │ GoalIpcClient │ TaskIpcClient │ ScheduleIpcClient │ │ │  │    │
│  │  │  └─────────────────────────────────────────────────────┘ │  │    │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │    │
│  │  │  │        IPC Client (window.electronAPI)              │ │  │    │
│  │  │  └─────────────────────────────────────────────────────┘ │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    │ IPC (contextBridge)                │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       Preload Script                             │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  contextBridge.exposeInMainWorld('electronAPI', {...})    │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│                                    │ ipcMain.handle()                   │
│                                    ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Main Process (Node.js)                       │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │                    IPC Handlers                            │  │    │
│  │  │  goal.ipc-handler │ task.ipc-handler │ schedule.ipc-handler│  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                              │                                   │    │
│  │                              ▼                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │            @dailyuse/infrastructure-server                │  │    │
│  │  │  ┌─────────────────────────────────────────────────────┐  │  │    │
│  │  │  │ GoalContainer │ TaskContainer │ SettingContainer │  │  │  │    │
│  │  │  └─────────────────────────────────────────────────────┘  │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                              │                                   │    │
│  │                              ▼                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │              SQLite Repository Adapters                   │  │    │
│  │  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐  │  │    │
│  │  │  │ GoalRepository │  │ TaskRepository │  │SettingRepo  │  │  │    │
│  │  │  └────────────────┘  └────────────────┘  └─────────────┘  │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                              │                                   │    │
│  │                              ▼                                   │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │                   SQLite Database                         │  │    │
│  │  │                   (better-sqlite3)                        │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| **桌面框架** | Electron | 39.2.6 |
| **前端框架** | React | 19.2.1 |
| **状态管理** | Zustand | 5.0.5 |
| **UI 库** | shadcn/ui | - |
| **CSS 框架** | Tailwind CSS | 4.x |
| **路由** | React Router | 7.x |
| **本地数据库** | better-sqlite3 | 11.10.0 |
| **文件监控** | chokidar | 4.0.3 |
| **Git 集成** | simple-git | 3.27.0 |
| **任务调度** | node-schedule | 2.1.1 |
| **日志** | electron-log | 5.4.2 |
| **打包** | electron-builder | 26.0.12 |
| **自动更新** | electron-updater | 6.6.2 |

---

## 目录结构

```
apps/desktop/
├── electron-builder.json5      # 打包配置
├── package.json
├── project.json                # Nx 项目配置
├── vite.config.ts              # Vite 配置
│
├── src/
│   ├── main/                   # 主进程代码 (Node.js)
│   │   ├── index.ts            # 入口点
│   │   ├── database/           # SQLite 数据库
│   │   │   ├── index.ts        # 连接管理
│   │   │   └── migrations/     # 数据库迁移
│   │   ├── di/                 # 依赖注入
│   │   │   ├── desktop-main.composition-root.ts
│   │   │   └── sqlite-adapters/
│   │   │       ├── index.ts
│   │   │       ├── goal.sqlite-repository.ts
│   │   │       ├── task-template.sqlite-repository.ts
│   │   │       └── ...
│   │   ├── ipc/                # IPC 处理器
│   │   │   ├── handlers/
│   │   │   │   ├── goal.ipc-handler.ts
│   │   │   │   ├── task.ipc-handler.ts
│   │   │   │   └── ...
│   │   │   └── register-handlers.ts
│   │   ├── services/           # 主进程服务
│   │   │   ├── auto-update.service.ts
│   │   │   ├── tray.service.ts
│   │   │   └── notification.service.ts
│   │   └── window/             # 窗口管理
│   │       └── main-window.ts
│   │
│   ├── preload/                # Preload 脚本
│   │   └── index.ts            # contextBridge 暴露 API
│   │
│   └── renderer/               # 渲染进程 (React 应用)
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.html
│       ├── pages/              # 页面组件
│       │   ├── Dashboard.tsx
│       │   ├── Goals.tsx
│       │   ├── Tasks.tsx
│       │   └── Settings.tsx
│       ├── components/         # 通用组件
│       │   ├── ui/            # shadcn/ui 组件
│       │   └── common/        # 业务组件
│       ├── hooks/              # React Hooks
│       │   ├── useGoals.ts
│       │   ├── useTasks.ts
│       │   └── useSettings.ts
│       ├── stores/             # Zustand Stores
│       │   ├── goal.store.ts
│       │   ├── task.store.ts
│       │   └── settings.store.ts
│       └── styles/             # 样式文件
│           └── globals.css
│
├── dist-electron/              # 编译输出
└── release/                    # 打包输出
```

---

## 进程通信 (IPC)

### IPC 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        IPC 通信架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Renderer Process                          │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │  @dailyuse/infrastructure-client                    │    │   │
│  │  │                                                      │    │   │
│  │  │  GoalIpcClient ─────────────┐                       │    │   │
│  │  │  TaskIpcClient ─────────────┤                       │    │   │
│  │  │  ScheduleIpcClient ─────────┤                       │    │   │
│  │  │  ReminderIpcClient ─────────┤ window.electronAPI.X  │    │   │
│  │  │  NotificationIpcClient ─────┤                       │    │   │
│  │  │  SettingIpcClient ──────────┤                       │    │   │
│  │  │  AccountIpcClient ──────────┘                       │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────┬────────────────────────────────┘   │
│                               │                                     │
│                     contextBridge                                   │
│                               │                                     │
│  ┌────────────────────────────▼────────────────────────────────┐   │
│  │                    Preload Script                            │   │
│  │                                                              │   │
│  │  exposeInMainWorld('electronAPI', {                         │   │
│  │    goal: { getActive, create, update, delete, ... },        │   │
│  │    task: { getByGoal, create, complete, ... },              │   │
│  │    schedule: { getToday, create, ... },                     │   │
│  │    reminder: { getPending, create, trigger, ... },          │   │
│  │    setting: { get, set, getAll, ... },                      │   │
│  │    account: { getCurrentUser, login, logout, ... },         │   │
│  │    autoUpdate: { checkForUpdates, downloadUpdate, ... }     │   │
│  │  })                                                          │   │
│  └────────────────────────────┬────────────────────────────────┘   │
│                               │                                     │
│                     ipcMain.handle()                                │
│                               │                                     │
│  ┌────────────────────────────▼────────────────────────────────┐   │
│  │                    Main Process                              │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │  IPC Handlers (src/main/ipc/handlers/)              │    │   │
│  │  │                                                      │    │   │
│  │  │  goal.ipc-handler.ts ───────────┐                   │    │   │
│  │  │  task.ipc-handler.ts ───────────┤                   │    │   │
│  │  │  schedule.ipc-handler.ts ───────┤                   │    │   │
│  │  │  reminder.ipc-handler.ts ───────┤ DI Container      │    │   │
│  │  │  setting.ipc-handler.ts ────────┤                   │    │   │
│  │  │  account.ipc-handler.ts ────────┤                   │    │   │
│  │  │  auto-update.ipc-handler.ts ────┘                   │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### IPC 通道命名规范

```
{module}:{action}

示例:
- goal:getActive
- goal:create
- goal:update
- goal:delete
- task:getByGoal
- task:complete
- schedule:getToday
- setting:get
- setting:set
- auth:login
- auth:logout
- autoUpdate:checkForUpdates
- autoUpdate:downloadUpdate
- autoUpdate:quitAndInstall
```

### IPC Handler 实现

```typescript
// src/main/ipc/handlers/goal.ipc-handler.ts
import { ipcMain } from 'electron';
import { GoalContainer } from '@dailyuse/infrastructure-server';

export function registerGoalHandlers(): void {
  // 获取活跃目标
  ipcMain.handle('goal:getActive', async (_, accountUuid: string) => {
    const service = GoalContainer.getInstance().getGoalService();
    return await service.getActiveGoals(accountUuid);
  });

  // 创建目标
  ipcMain.handle('goal:create', async (_, data: CreateGoalDTO) => {
    const service = GoalContainer.getInstance().getGoalService();
    return await service.createGoal(data);
  });

  // 更新目标
  ipcMain.handle('goal:update', async (_, uuid: string, data: UpdateGoalDTO) => {
    const service = GoalContainer.getInstance().getGoalService();
    return await service.updateGoal(uuid, data);
  });

  // 删除目标
  ipcMain.handle('goal:delete', async (_, uuid: string) => {
    const service = GoalContainer.getInstance().getGoalService();
    return await service.deleteGoal(uuid);
  });
}
```

### Preload Script

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { 
  CreateGoalDTO, 
  UpdateGoalDTO,
  CreateTaskDTO 
} from '@dailyuse/contracts';

contextBridge.exposeInMainWorld('electronAPI', {
  // Goal
  goal: {
    getActive: (accountUuid: string) => 
      ipcRenderer.invoke('goal:getActive', accountUuid),
    create: (data: CreateGoalDTO) => 
      ipcRenderer.invoke('goal:create', data),
    update: (uuid: string, data: UpdateGoalDTO) => 
      ipcRenderer.invoke('goal:update', uuid, data),
    delete: (uuid: string) => 
      ipcRenderer.invoke('goal:delete', uuid),
  },
  
  // Task
  task: {
    getByGoal: (goalUuid: string) => 
      ipcRenderer.invoke('task:getByGoal', goalUuid),
    create: (data: CreateTaskDTO) => 
      ipcRenderer.invoke('task:create', data),
    complete: (uuid: string) => 
      ipcRenderer.invoke('task:complete', uuid),
  },
  
  // Setting
  setting: {
    get: (key: string) => 
      ipcRenderer.invoke('setting:get', key),
    set: (key: string, value: unknown) => 
      ipcRenderer.invoke('setting:set', key, value),
    getAll: () => 
      ipcRenderer.invoke('setting:getAll'),
  },
  
  // Auto Update
  autoUpdate: {
    checkForUpdates: () => 
      ipcRenderer.invoke('autoUpdate:checkForUpdates'),
    downloadUpdate: () => 
      ipcRenderer.invoke('autoUpdate:downloadUpdate'),
    quitAndInstall: () => 
      ipcRenderer.invoke('autoUpdate:quitAndInstall'),
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => 
      ipcRenderer.on('autoUpdate:available', (_, info) => callback(info)),
    onDownloadProgress: (callback: (progress: ProgressInfo) => void) => 
      ipcRenderer.on('autoUpdate:downloadProgress', (_, progress) => callback(progress)),
  },
});

// 类型声明
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
```

### 渲染进程调用

```typescript
// src/renderer/hooks/useGoals.ts
import { useState, useCallback } from 'react';
import type { GoalClientDTO, CreateGoalDTO } from '@dailyuse/contracts';

export function useGoals() {
  const [goals, setGoals] = useState<GoalClientDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadGoals = useCallback(async (accountUuid: string) => {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.goal.getActive(accountUuid);
      setGoals(data);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createGoal = useCallback(async (data: CreateGoalDTO) => {
    const newGoal = await window.electronAPI.goal.create(data);
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);
  
  return { goals, isLoading, loadGoals, createGoal };
}
```

---

## 依赖注入配置

### Composition Root

```typescript
// src/main/di/desktop-main.composition-root.ts
import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  SettingContainer,
  ReminderContainer,
  NotificationContainer,
  AccountContainer,
} from '@dailyuse/infrastructure-server';

import {
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteTaskTemplateRepository,
  SqliteTaskInstanceRepository,
  SqliteScheduleRepository,
  SqliteReminderRepository,
  SqliteSettingRepository,
  SqliteAccountRepository,
} from './sqlite-adapters';

export function configureMainProcessDependencies(): void {
  // Goal 模块
  GoalContainer.getInstance()
    .registerGoalRepository(new SqliteGoalRepository())
    .registerGoalFolderRepository(new SqliteGoalFolderRepository())
    .registerStatisticsRepository(new SqliteGoalStatisticsRepository());

  // Task 模块
  TaskContainer.getInstance()
    .registerTemplateRepository(new SqliteTaskTemplateRepository())
    .registerInstanceRepository(new SqliteTaskInstanceRepository())
    .registerStatisticsRepository(new SqliteTaskStatisticsRepository());

  // Schedule 模块
  ScheduleContainer.getInstance()
    .registerScheduleRepository(new SqliteScheduleRepository())
    .registerTimeSlotRepository(new SqliteTimeSlotRepository());

  // Reminder 模块
  ReminderContainer.getInstance()
    .registerReminderRepository(new SqliteReminderRepository())
    .registerTemplateRepository(new SqliteReminderTemplateRepository());

  // Setting 模块
  SettingContainer.getInstance()
    .registerAppConfigRepository(new SqliteAppConfigRepository())
    .registerSettingRepository(new SqliteSettingRepository())
    .registerUserSettingRepository(new SqliteUserSettingRepository());

  // Account 模块
  AccountContainer.getInstance()
    .registerAccountRepository(new SqliteAccountRepository());
}
```

### 应用启动流程

```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { initializeDatabase } from './database';
import { configureMainProcessDependencies } from './di/desktop-main.composition-root';
import { registerAllHandlers } from './ipc/register-handlers';
import { initAutoUpdater } from './services/auto-update.service';
import { initTray } from './services/tray.service';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // 加载渲染进程
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
}

app.whenReady().then(async () => {
  // 1. 初始化数据库
  await initializeDatabase();

  // 2. 配置依赖注入
  configureMainProcessDependencies();

  // 3. 注册 IPC 处理器
  registerAllHandlers();

  // 4. 创建主窗口
  await createWindow();

  // 5. 初始化系统托盘
  initTray(mainWindow!);

  // 6. 初始化自动更新
  initAutoUpdater(mainWindow!);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

---

## SQLite Repository 实现

### Repository 模式

```typescript
// src/main/di/sqlite-adapters/goal.sqlite-repository.ts
import type { IGoalRepository } from '@dailyuse/domain-server/goal';
import { Goal } from '@dailyuse/domain-server/goal';
import type { GoalPersistenceDTO } from '@dailyuse/contracts/goal';
import { getDatabase, transaction } from '../../database';

interface GoalRow {
  uuid: string;
  account_uuid: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  progress: number;
  target_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class SqliteGoalRepository implements IGoalRepository {
  async save(goal: Goal): Promise<void> {
    const db = getDatabase();
    const dto = goal.toPersistenceDTO();

    transaction(() => {
      const existing = db.prepare('SELECT uuid FROM goals WHERE uuid = ?')
        .get(dto.uuid) as { uuid: string } | undefined;

      if (existing) {
        db.prepare(`
          UPDATE goals SET 
            title = ?, description = ?, type = ?, status = ?, 
            progress = ?, target_date = ?, updated_at = ?
          WHERE uuid = ?
        `).run(
          dto.title, dto.description, dto.type, dto.status,
          dto.progress, dto.targetDate, new Date().toISOString(), dto.uuid
        );
      } else {
        db.prepare(`
          INSERT INTO goals (
            uuid, account_uuid, title, description, type, status, 
            progress, target_date, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          dto.uuid, dto.accountUuid, dto.title, dto.description,
          dto.type, dto.status, dto.progress, dto.targetDate,
          new Date().toISOString(), new Date().toISOString()
        );
      }
    });
  }

  async findById(uuid: string): Promise<Goal | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM goals WHERE uuid = ? AND deleted_at IS NULL')
      .get(uuid) as GoalRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  async findByAccount(accountUuid: string): Promise<Goal[]> {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM goals 
      WHERE account_uuid = ? AND deleted_at IS NULL 
      ORDER BY created_at DESC
    `).all(accountUuid) as GoalRow[];
    return rows.map(row => this.mapToEntity(row));
  }

  async delete(uuid: string): Promise<void> {
    const db = getDatabase();
    db.prepare(`
      UPDATE goals SET deleted_at = ? WHERE uuid = ?
    `).run(new Date().toISOString(), uuid);
  }

  private mapToEntity(row: GoalRow): Goal {
    const dto: GoalPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      title: row.title,
      description: row.description ?? undefined,
      type: row.type as GoalType,
      status: row.status as GoalStatus,
      progress: row.progress,
      targetDate: row.target_date ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return Goal.fromPersistenceDTO(dto);
  }
}
```

### 数据库事务

```typescript
// src/main/database/index.ts
import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { runMigrations } from './migrations';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function transaction<T>(fn: () => T): T {
  const db = getDatabase();
  return db.transaction(fn)();
}

export async function initializeDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = join(userDataPath, 'dailyuse.db');
  
  db = new Database(dbPath);
  
  // 启用 WAL 模式提升并发性能
  db.pragma('journal_mode = WAL');
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 运行迁移
  await runMigrations(db);
  
  console.log(`Database initialized at: ${dbPath}`);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

---

## 自动更新

### Auto Updater 服务

```typescript
// src/main/services/auto-update.service.ts
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  // 配置日志
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 事件监听
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('Update available:', info.version);
    mainWindow.webContents.send('autoUpdate:available', info);
  });

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available.');
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    mainWindow.webContents.send('autoUpdate:downloadProgress', progress);
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('Update downloaded:', info.version);
    mainWindow.webContents.send('autoUpdate:downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
    mainWindow.webContents.send('autoUpdate:error', error.message);
  });

  // IPC 处理
  ipcMain.handle('autoUpdate:checkForUpdates', async () => {
    return await autoUpdater.checkForUpdates();
  });

  ipcMain.handle('autoUpdate:downloadUpdate', async () => {
    return await autoUpdater.downloadUpdate();
  });

  ipcMain.handle('autoUpdate:quitAndInstall', () => {
    autoUpdater.quitAndInstall();
  });

  // 启动时检查更新
  if (process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdates();
  }
}
```

---

## IPC 通道清单

### Goal 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `goal:getActive` | GET | 获取活跃目标 |
| `goal:getById` | GET | 根据 ID 获取 |
| `goal:create` | POST | 创建目标 |
| `goal:update` | PUT | 更新目标 |
| `goal:delete` | DELETE | 删除目标 |
| `goal:archive` | PUT | 归档目标 |
| `goal:getStatistics` | GET | 获取统计数据 |

### Task 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `task:getByGoal` | GET | 获取目标下的任务 |
| `task:create` | POST | 创建任务 |
| `task:update` | PUT | 更新任务 |
| `task:complete` | PUT | 完成任务 |
| `task:delete` | DELETE | 删除任务 |

### Schedule 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `schedule:getToday` | GET | 获取今日安排 |
| `schedule:getByRange` | GET | 按日期范围获取 |
| `schedule:create` | POST | 创建安排 |
| `schedule:update` | PUT | 更新安排 |
| `schedule:delete` | DELETE | 删除安排 |

### Reminder 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `reminder:getPending` | GET | 获取待处理提醒 |
| `reminder:create` | POST | 创建提醒 |
| `reminder:trigger` | PUT | 触发提醒 |
| `reminder:snooze` | PUT | 延后提醒 |
| `reminder:dismiss` | PUT | 关闭提醒 |

### Setting 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `setting:get` | GET | 获取设置 |
| `setting:set` | PUT | 保存设置 |
| `setting:getAll` | GET | 获取所有设置 |
| `setting:reset` | PUT | 重置设置 |

### Account 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `account:getCurrentUser` | GET | 获取当前用户 |
| `account:login` | POST | 登录 |
| `account:logout` | POST | 登出 |
| `account:register` | POST | 注册 |

### Auto Update 模块

| 通道 | 方法 | 描述 |
|------|------|------|
| `autoUpdate:checkForUpdates` | GET | 检查更新 |
| `autoUpdate:downloadUpdate` | POST | 下载更新 |
| `autoUpdate:quitAndInstall` | POST | 退出并安装 |

---

## 开发命令

```bash
# 开发模式
pnpm nx serve desktop

# 构建
pnpm nx build desktop

# 打包
pnpm nx package desktop

# 发布 (带签名)
pnpm nx release desktop

# 类型检查
pnpm nx typecheck desktop

# 运行测试
pnpm nx test desktop
```

---

## 相关文档

- [系统架构概览](./system-overview.md)
- [ADR-004: Electron Desktop](./adr/004-electron-desktop-architecture.md)
- [ADR-006: Desktop IPC](./adr/ADR-006-desktop-ipc-communication.md)
- [ADR-007: Main Process SQLite](./adr/ADR-007-main-process-sqlite-access.md)
- [Infrastructure Server 包](../packages/infrastructure-server.md)
- [Infrastructure Client 包](../packages/infrastructure-client.md)

---

**更新日期**: 2025-12-16  
**维护者**: DailyUse Team
