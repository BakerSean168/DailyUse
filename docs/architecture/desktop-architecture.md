# Desktop 应用架构

本文档描述 DailyUse Desktop 应用的技术架构，基于 Electron 构建。

---

## 架构概览

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DailyUse Desktop Application                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Renderer Process (Vue 3)                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │    │
│  │  │   Views     │  │ Components  │  │     Composables         │ │    │
│  │  │   Pages     │  │    UI       │  │     State Management    │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │    │
│  │         │                │                      │               │    │
│  │         ▼                ▼                      ▼               │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │            @dailyuse/infrastructure-client               │  │    │
│  │  │  ┌─────────────────────────────────────────────────────┐ │  │    │
│  │  │  │ GoalContainer │ TaskContainer │ ScheduleContainer │ │ │  │    │
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

## 目录结构

```
apps/desktop/
├── electron-builder.json5      # 打包配置
├── package.json
├── project.json                # Nx 项目配置
├── vite.config.ts              # Vite 配置
│
├── src/
│   ├── main/                   # 主进程代码
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
│   │   └── ipc/                # IPC 处理器
│   │       ├── handlers/
│   │       │   ├── goal.ipc-handler.ts
│   │       │   ├── task.ipc-handler.ts
│   │       │   └── ...
│   │       └── register-handlers.ts
│   │
│   ├── preload/                # Preload 脚本
│   │   └── index.ts            # contextBridge 暴露 API
│   │
│   └── renderer/               # 渲染进程 (Vue 应用)
│       ├── App.vue
│       ├── main.ts
│       ├── views/              # 页面组件
│       ├── components/         # 通用组件
│       ├── composables/        # Vue Composables
│       └── stores/             # Pinia Stores
│
├── dist-electron/              # 编译输出
└── release/                    # 打包输出
```

---

## 进程通信 (IPC)

### IPC 通道命名规范

```
{module}:{action}

示例:
- goal:getActive
- goal:create
- task:complete
- setting:get
- auth:login
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
}
```

### Preload Script

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Goal
  goal: {
    getActive: (accountUuid: string) => 
      ipcRenderer.invoke('goal:getActive', accountUuid),
    create: (data: CreateGoalDTO) => 
      ipcRenderer.invoke('goal:create', data),
    update: (uuid: string, data: UpdateGoalDTO) => 
      ipcRenderer.invoke('goal:update', uuid, data),
  },
  
  // Task
  task: {
    getByGoal: (goalUuid: string) => 
      ipcRenderer.invoke('task:getByGoal', goalUuid),
    complete: (uuid: string) => 
      ipcRenderer.invoke('task:complete', uuid),
  },
  
  // Setting
  setting: {
    get: (key: string) => 
      ipcRenderer.invoke('setting:get', key),
    set: (key: string, value: unknown) => 
      ipcRenderer.invoke('setting:set', key, value),
  },
});
```

### 渲染进程调用

```typescript
// src/renderer/composables/useGoals.ts
export function useGoals() {
  const goals = ref<GoalClientDTO[]>([]);
  
  const loadGoals = async (accountUuid: string) => {
    goals.value = await window.electronAPI.goal.getActive(accountUuid);
  };
  
  const createGoal = async (data: CreateGoalDTO) => {
    const newGoal = await window.electronAPI.goal.create(data);
    goals.value.push(newGoal);
    return newGoal;
  };
  
  return { goals, loadGoals, createGoal };
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
  // ... 其他 Containers
} from '@dailyuse/infrastructure-server';

import {
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteTaskTemplateRepository,
  // ... 其他 SQLite 适配器
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

  // Setting 模块
  SettingContainer.getInstance()
    .registerAppConfigRepository(new SqliteAppConfigRepository())
    .registerSettingRepository(new SqliteSettingRepository())
    .registerUserSettingRepository(new SqliteUserSettingRepository());

  // ... 其他模块配置
}
```

### 应用启动流程

```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import { initializeDatabase } from './database';
import { configureMainProcessDependencies } from './di/desktop-main.composition-root';
import { registerAllHandlers } from './ipc/register-handlers';

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(async () => {
  // 1. 初始化数据库
  await initializeDatabase();

  // 2. 配置依赖注入
  configureMainProcessDependencies();

  // 3. 注册 IPC 处理器
  registerAllHandlers();

  // 4. 创建窗口
  await createWindow();
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
  type: string;
  status: string;
  // ... 其他字段
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
            title = ?, type = ?, status = ?, updated_at = ?
          WHERE uuid = ?
        `).run(dto.title, dto.type, dto.status, dto.updatedAt, dto.uuid);
      } else {
        db.prepare(`
          INSERT INTO goals (uuid, account_uuid, title, type, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(dto.uuid, dto.accountUuid, dto.title, dto.type, dto.status, dto.createdAt, dto.updatedAt);
      }
    });
  }

  async findById(uuid: string): Promise<Goal | null> {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM goals WHERE uuid = ?')
      .get(uuid) as GoalRow | undefined;
    return row ? this.mapToEntity(row) : null;
  }

  private mapToEntity(row: GoalRow): Goal {
    const dto: GoalPersistenceDTO = {
      uuid: row.uuid,
      accountUuid: row.account_uuid,
      title: row.title,
      type: row.type as GoalType,
      status: row.status as GoalStatus,
      // ... 映射其他字段
    };
    return Goal.fromPersistenceDTO(dto);
  }
}
```

### 数据库事务

```typescript
// src/main/database/index.ts
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function transaction<T>(fn: () => T): T {
  const db = getDatabase();
  return db.transaction(fn)();
}

export async function initializeDatabase(): Promise<void> {
  const dbPath = join(app.getPath('userData'), 'dailyuse.db');
  db = new Database(dbPath);
  
  // 启用 WAL 模式
  db.pragma('journal_mode = WAL');
  
  // 运行迁移
  await runMigrations(db);
}
```

---

## IPC 通道清单

| 模块 | 通道 | 方法 | 描述 |
|------|------|------|------|
| **Goal** | `goal:getActive` | GET | 获取活跃目标 |
| | `goal:getById` | GET | 根据 ID 获取 |
| | `goal:create` | POST | 创建目标 |
| | `goal:update` | PUT | 更新目标 |
| | `goal:delete` | DELETE | 删除目标 |
| **Task** | `task:getByGoal` | GET | 获取目标下的任务 |
| | `task:create` | POST | 创建任务 |
| | `task:complete` | PUT | 完成任务 |
| **Schedule** | `schedule:getToday` | GET | 获取今日安排 |
| | `schedule:create` | POST | 创建安排 |
| **Setting** | `setting:get` | GET | 获取设置 |
| | `setting:set` | PUT | 保存设置 |
| **Auth** | `auth:login` | POST | 登录 |
| | `auth:logout` | POST | 登出 |
| | `auth:getCurrentUser` | GET | 获取当前用户 |

---

## 开发命令

```bash
# 开发模式
pnpm nx serve desktop

# 构建
pnpm nx build desktop

# 打包
pnpm nx package desktop

# 类型检查
pnpm nx typecheck desktop

# 运行测试
pnpm nx test desktop
```

---

## 相关文档

- [包使用规范](./package-usage.md)
- [系统架构概览](./system-overview.md)
- [DDD 类型架构](./ddd-type-architecture.md)

---

**更新日期**: 2025-12-07  
**维护者**: DailyUse Team
