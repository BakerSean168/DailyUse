# STORY-013: 统一初始化流程

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 4  
> **预估**: 4 小时  
> **优先级**: P1  
> **依赖**: STORY-001 ~ STORY-012

---

## 📋 概述

所有模块完成后，需要统一应用初始化流程：
- 使用 InitializationManager 管理模块加载顺序
- 实现优雅的启动和关闭流程
- 添加启动错误处理和恢复机制

---

## 🎯 目标

1. 统一所有模块的注册和初始化
2. 实现分阶段启动（INFRASTRUCTURE → CORE_SERVICES → FEATURE_MODULES）
3. 添加启动错误处理和用户提示

---

## ✅ 验收标准 (AC)

### AC-1: 模块顺序加载
```gherkin
Given 应用启动
When InitializationManager 执行初始化
Then 模块应按以下顺序加载:
  1. INFRASTRUCTURE: 数据库连接、Container 初始化
  2. CORE_SERVICES: Account, Setting, Notification
  3. FEATURE_MODULES: Goal, Task, Schedule, Reminder, AI, Dashboard, Repository, Editor
```

### AC-2: 启动错误处理
```gherkin
Given 某个模块初始化失败
When 捕获到初始化错误
Then 应记录详细错误日志
And 根据模块重要性决定是否继续启动
And 向用户显示友好的错误提示
```

### AC-3: 优雅关闭
```gherkin
Given 应用关闭
When 用户退出应用
Then 应按逆序关闭模块
And 保存未保存的数据
And 清理临时资源
```

---

## 📁 任务清单

### Task 13.1: 创建统一模块注册入口

**文件**: `apps/desktop/src/main/modules/index.ts`

```typescript
/**
 * Desktop Main Process - Module Registry
 * 
 * 统一注册所有模块
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

// Infrastructure
import { initializeContainers } from './infrastructure';

// Core Services
import { registerAccountModule } from './account';
import { registerSettingModule } from './setting';
import { registerNotificationModule } from './notification';

// Feature Modules
import { registerGoalModule } from './goal';
import { registerTaskModule } from './task';
import { registerScheduleModule } from './schedule';
import { registerReminderModule } from './reminder';
import { registerAIModule } from './ai';
import { registerDashboardModule } from './dashboard';
import { registerRepositoryModule } from './repository';
import { registerEditorModule } from './editor';

const logger = createLogger('ModuleRegistry');

/**
 * 注册所有模块
 * 
 * 模块将按 InitializationPhase 顺序初始化:
 * 1. INFRASTRUCTURE - 基础设施（数据库、Container）
 * 2. CORE_SERVICES - 核心服务（Account, Setting, Notification）
 * 3. FEATURE_MODULES - 功能模块（Goal, Task, Schedule 等）
 */
export function registerAllModules(): void {
  const manager = InitializationManager.getInstance();

  // ===== Phase 1: INFRASTRUCTURE =====
  manager.registerModule(
    'infrastructure',
    InitializationPhase.INFRASTRUCTURE,
    async () => {
      logger.info('Initializing infrastructure...');
      await initializeContainers();
      logger.info('Infrastructure initialized');
    }
  );

  // ===== Phase 2: CORE_SERVICES =====
  registerAccountModule();
  registerSettingModule();
  registerNotificationModule();

  // ===== Phase 3: FEATURE_MODULES =====
  registerGoalModule();
  registerTaskModule();
  registerScheduleModule();
  registerReminderModule();
  registerAIModule();
  registerDashboardModule();
  registerRepositoryModule();
  registerEditorModule();

  logger.info('All modules registered');
}

/**
 * 初始化所有模块
 */
export async function initializeAllModules(): Promise<{
  success: boolean;
  failedModules: string[];
  duration: number;
}> {
  const startTime = Date.now();
  const failedModules: string[] = [];
  
  try {
    const manager = InitializationManager.getInstance();
    
    // 监听初始化事件
    manager.on('moduleInitialized', (moduleName: string, duration: number) => {
      logger.info(`Module initialized: ${moduleName}`, { duration: `${duration}ms` });
    });

    manager.on('moduleInitError', (moduleName: string, error: Error) => {
      logger.error(`Module initialization failed: ${moduleName}`, error);
      failedModules.push(moduleName);
    });

    // 执行初始化
    await manager.initialize();

    const duration = Date.now() - startTime;
    logger.info('All modules initialized', { 
      duration: `${duration}ms`,
      failedCount: failedModules.length 
    });

    return {
      success: failedModules.length === 0,
      failedModules,
      duration,
    };
  } catch (error) {
    logger.error('Module initialization failed', error);
    return {
      success: false,
      failedModules,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * 关闭所有模块（优雅关闭）
 */
export async function shutdownAllModules(): Promise<void> {
  logger.info('Shutting down all modules...');
  
  const manager = InitializationManager.getInstance();
  await manager.shutdown();
  
  logger.info('All modules shut down');
}
```

### Task 13.2: 创建 Infrastructure 初始化

**文件**: `apps/desktop/src/main/modules/infrastructure/index.ts`

```typescript
/**
 * Infrastructure Initialization
 * 
 * 初始化数据库连接和 DI Container
 */

import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AIContainer,
} from '@dailyuse/infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import { app } from 'electron';
import * as path from 'path';

const logger = createLogger('Infrastructure');

/**
 * 初始化所有 Container
 */
export async function initializeContainers(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'dailyuse.db');

  logger.info('Initializing containers', { dbPath });

  // 初始化各模块的 Container
  // Container 内部会设置 SQLite adapter
  
  try {
    // Goal Container
    GoalContainer.initialize({ dbPath });
    logger.debug('GoalContainer initialized');

    // Task Container
    TaskContainer.initialize({ dbPath });
    logger.debug('TaskContainer initialized');

    // Schedule Container
    ScheduleContainer.initialize({ dbPath });
    logger.debug('ScheduleContainer initialized');

    // Reminder Container
    ReminderContainer.initialize({ dbPath });
    logger.debug('ReminderContainer initialized');

    // AI Container (可能需要特殊配置)
    AIContainer.initialize({ dbPath });
    logger.debug('AIContainer initialized');

    logger.info('All containers initialized');
  } catch (error) {
    logger.error('Failed to initialize containers', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
export async function closeContainers(): Promise<void> {
  logger.info('Closing containers...');

  // 关闭各 Container 的数据库连接
  try {
    await GoalContainer.close?.();
    await TaskContainer.close?.();
    await ScheduleContainer.close?.();
    await ReminderContainer.close?.();
    await AIContainer.close?.();
    
    logger.info('All containers closed');
  } catch (error) {
    logger.error('Error closing containers', error);
  }
}
```

### Task 13.3: 更新 main.ts 入口

**文件**: `apps/desktop/src/main/main.ts` (需要修改)

```typescript
/**
 * Desktop Main Process Entry
 */

import { app, BrowserWindow } from 'electron';
import { createLogger } from '@dailyuse/utils';
import { registerAllModules, initializeAllModules, shutdownAllModules } from './modules';
import { setNotificationMainWindow } from './modules/notification';

const logger = createLogger('Main');

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // 设置主窗口引用给需要的模块
  setNotificationMainWindow(mainWindow);

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile('index.html');
  }
}

async function main(): Promise<void> {
  logger.info('Starting DailyUse Desktop...');
  const startTime = Date.now();

  // 注册所有模块
  registerAllModules();

  // 等待 Electron 就绪
  await app.whenReady();

  // 初始化所有模块
  const initResult = await initializeAllModules();
  
  if (!initResult.success) {
    logger.warn('Some modules failed to initialize', { 
      failed: initResult.failedModules 
    });
    // 可以选择显示警告对话框
  }

  logger.info('Application initialized', { 
    duration: `${Date.now() - startTime}ms` 
  });

  // 创建主窗口
  await createWindow();

  // macOS 特殊处理
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
}

// 应用退出处理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  event.preventDefault();
  
  logger.info('Application shutting down...');
  await shutdownAllModules();
  
  app.exit(0);
});

// 启动应用
main().catch((error) => {
  logger.error('Failed to start application', error);
  app.exit(1);
});
```

### Task 13.4: 添加启动画面支持（可选）

```typescript
// 可以添加启动画面显示初始化进度
// 通过 IPC 发送初始化状态到渲染进程
```

---

## 📚 技术上下文

### InitializationManager 用法

```typescript
// @dailyuse/utils 提供的初始化管理器
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

const manager = InitializationManager.getInstance();

// 注册模块
manager.registerModule(
  'moduleName',
  InitializationPhase.CORE_SERVICES,
  async () => { /* 初始化逻辑 */ },
  ['dependency1', 'dependency2'] // 可选依赖
);

// 执行初始化
await manager.initialize();

// 优雅关闭
await manager.shutdown();
```

### 初始化阶段

1. **INFRASTRUCTURE**: 数据库、Container、基础服务
2. **CORE_SERVICES**: Account、Setting、Notification
3. **FEATURE_MODULES**: 业务功能模块

---

## 🔗 依赖关系

- **依赖**: STORY-001 ~ STORY-012 (所有模块)
- **被依赖**: STORY-014 (测试需要完整初始化流程)

---

## 📝 备注

- 初始化失败的非关键模块不应阻止应用启动
- 关键模块（如 Account、Setting）失败应显示错误并退出
- 考虑添加初始化超时机制
