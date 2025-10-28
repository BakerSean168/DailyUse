# Initialize 系统

> **位置**: `packages/utils/src/initializationManager.ts` + 各项目的初始化管理器  
> **适用范围**: API、Web、Desktop 项目  
> **依赖**: 无

---

## 📋 概述

Initialize 系统提供统一的应用初始化流程管理,确保各个模块按照正确的顺序初始化,并提供完整的生命周期钩子。

### 核心特性

- ✅ **统一初始化流程**: 标准化的初始化步骤
- ✅ **依赖管理**: 自动处理模块间依赖
- ✅ **生命周期钩子**: beforeInit/afterInit/onError
- ✅ **并行初始化**: 无依赖模块并行加载
- ✅ **错误处理**: 完善的错误恢复机制
- ✅ **初始化状态**: 跟踪每个模块的初始化状态

---

## 🏗️ 架构设计

### 初始化流程

```
应用启动
    ↓
1. 初始化日志系统 (Logger)
    ↓
2. 初始化配置系统 (Config)
    ↓
3. 初始化数据库连接 (Database) [API项目]
    ↓
4. 初始化事件系统 (EventBus)
    ↓
5. 注册事件处理器 (Event Handlers)
    ↓
6. 初始化模块 (Modules)
    ├→ Account Module
    ├→ Goal Module
    ├→ Task Module
    └→ ...
    ↓
7. 应用就绪 (Ready)
```

### 核心概念

```typescript
// 初始化器接口
interface Initializer {
  name: string; // 模块名称
  priority?: number; // 优先级（数字越小越先执行）
  dependencies?: string[]; // 依赖的模块
  initialize: () => Promise<void>; // 初始化函数
  cleanup?: () => Promise<void>; // 清理函数
}

// 初始化管理器
class InitializationManager {
  register(initializer: Initializer): void;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}
```

---

## 🚀 快速开始

### 1. Web 项目初始化

```typescript
// apps/web/src/shared/initialization/AppInitializationManager.ts
import { AccountEventHandlers } from '@/modules/account/application/events';
import { GoalEventHandlers } from '@/modules/goal/application/events';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AppInitialization');

export class AppInitializationManager {
  private static initialized = false;

  static async initializeApp(): Promise<void> {
    if (this.initialized) {
      logger.warn('Application already initialized');
      return;
    }

    try {
      logger.info('🚀 Starting application initialization...');

      // 1. 初始化事件处理器
      logger.info('Initializing event handlers...');
      AccountEventHandlers.initializeEventHandlers();
      GoalEventHandlers.initializeEventHandlers();
      logger.info('✅ Event handlers initialized');

      // 2. 初始化其他模块
      logger.info('Initializing application modules...');
      await this.initializeModules();
      logger.info('✅ Modules initialized');

      this.initialized = true;
      logger.info('✅ Application initialization complete');
    } catch (error) {
      logger.error('❌ Application initialization failed', error);
      throw error;
    }
  }

  private static async initializeModules(): Promise<void> {
    // 初始化各个模块
    // 可以按需添加
  }

  static async cleanup(): Promise<void> {
    logger.info('Cleaning up application...');
    this.initialized = false;
  }
}
```

```typescript
// apps/web/src/main.ts
import { createApp } from 'vue';
import { initializeLogger } from './config/logger.config';
import { AppInitializationManager } from './shared/initialization/AppInitializationManager';
import App from './App.vue';

// 1. 初始化日志
initializeLogger();

// 2. 初始化应用
AppInitializationManager.initializeApp()
  .then(() => {
    // 3. 创建 Vue 应用
    const app = createApp(App);
    app.mount('#app');
  })
  .catch((error) => {
    console.error('Failed to initialize app:', error);
  });
```

### 2. API 项目初始化

```typescript
// apps/api/src/initialization/ApiInitializationManager.ts
import { createLogger } from '@dailyuse/utils';
import { connectDatabase } from '@/infrastructure/database';
import { startScheduler } from '@/modules/schedule';

const logger = createLogger('ApiInitialization');

export class ApiInitializationManager {
  static async initialize(): Promise<void> {
    logger.info('🚀 Starting API server initialization...');

    try {
      // 1. 连接数据库
      logger.info('Connecting to database...');
      await connectDatabase();
      logger.info('✅ Database connected');

      // 2. 初始化调度器
      logger.info('Starting schedule task scheduler...');
      await startScheduler();
      logger.info('✅ Scheduler started');

      // 3. 其他初始化...

      logger.info('✅ API server initialization complete');
    } catch (error) {
      logger.error('❌ API server initialization failed', error);
      throw error;
    }
  }

  static async cleanup(): Promise<void> {
    logger.info('Shutting down API server...');

    // 清理资源
    // - 关闭数据库连接
    // - 停止调度器
    // - 清理临时文件

    logger.info('✅ API server shutdown complete');
  }
}
```

```typescript
// apps/api/src/index.ts
import { initializeLogger } from './config/logger.config';
import { ApiInitializationManager } from './initialization/ApiInitializationManager';
import { createApp } from './app';

async function bootstrap() {
  // 1. 初始化日志
  initializeLogger();

  // 2. 初始化 API 服务
  await ApiInitializationManager.initialize();

  // 3. 启动 Express 服务器
  const app = createApp();
  const PORT = process.env.PORT || 3888;

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
  });

  // 4. 优雅关闭
  process.on('SIGINT', async () => {
    await ApiInitializationManager.cleanup();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
```

---

## 📐 高级用法

### 使用 InitializationManager 基类

```typescript
// packages/utils/src/initializationManager.ts
export interface Initializer {
  name: string;
  priority?: number;
  dependencies?: string[];
  initialize: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export class InitializationManager {
  private initializers: Map<string, Initializer> = new Map();
  private initialized: Set<string> = new Set();

  register(initializer: Initializer): void {
    this.initializers.set(initializer.name, initializer);
  }

  async initialize(): Promise<void> {
    const sorted = this.topologicalSort();

    for (const name of sorted) {
      const initializer = this.initializers.get(name)!;
      await initializer.initialize();
      this.initialized.add(name);
    }
  }

  async cleanup(): Promise<void> {
    const sorted = this.topologicalSort().reverse();

    for (const name of sorted) {
      const initializer = this.initializers.get(name)!;
      if (initializer.cleanup) {
        await initializer.cleanup();
      }
    }

    this.initialized.clear();
  }

  private topologicalSort(): string[] {
    // 拓扑排序实现（处理依赖关系）
    // ...
  }
}
```

### 使用示例

```typescript
import { InitializationManager } from '@dailyuse/utils';

const manager = new InitializationManager();

// 注册初始化器
manager.register({
  name: 'logger',
  priority: 0, // 最先执行
  initialize: async () => {
    initializeLogger();
  },
});

manager.register({
  name: 'database',
  priority: 1,
  dependencies: ['logger'], // 依赖 logger
  initialize: async () => {
    await connectDatabase();
  },
  cleanup: async () => {
    await disconnectDatabase();
  },
});

manager.register({
  name: 'eventBus',
  priority: 2,
  dependencies: ['logger'],
  initialize: async () => {
    initializeEventHandlers();
  },
});

manager.register({
  name: 'modules',
  priority: 3,
  dependencies: ['database', 'eventBus'],
  initialize: async () => {
    await initializeModules();
  },
});

// 执行初始化
await manager.initialize();

// 优雅关闭
process.on('SIGINT', async () => {
  await manager.cleanup();
  process.exit(0);
});
```

---

## 💡 最佳实践

### 1. 明确的初始化顺序

```typescript
// ✅ 推荐：使用优先级或依赖关系
manager.register({
  name: 'logger',
  priority: 0, // 最先执行
  initialize: async () => initializeLogger(),
});

manager.register({
  name: 'database',
  priority: 1,
  dependencies: ['logger'], // 明确依赖
  initialize: async () => connectDatabase(),
});
```

### 2. 完整的错误处理

```typescript
export class AppInitializationManager {
  static async initializeApp(): Promise<void> {
    try {
      await this.doInitialize();
    } catch (error) {
      logger.error('Initialization failed', error);

      // 尝试清理已初始化的资源
      await this.cleanup();

      // 重新抛出错误
      throw error;
    }
  }
}
```

### 3. 提供清理函数

```typescript
manager.register({
  name: 'database',
  initialize: async () => {
    await connectDatabase();
  },
  cleanup: async () => {
    // ✅ 清理资源
    await disconnectDatabase();
  },
});
```

### 4. 使用日志记录进度

```typescript
logger.info('🚀 Starting initialization...');
logger.info('Initializing logger...');
logger.info('✅ Logger initialized');
logger.info('Connecting to database...');
logger.info('✅ Database connected');
logger.info('✅ Initialization complete');
```

---

## 🔍 实战案例

### Goal 模块初始化

```typescript
// apps/web/src/modules/goal/initialization/goalInitialization.ts
import { createLogger } from '@dailyuse/utils';
import { GoalEventHandlers } from '../application/events';

const logger = createLogger('GoalInitialization');

export async function initializeGoalModule(): Promise<void> {
  logger.info('Initializing Goal module...');

  // 1. 注册事件处理器
  GoalEventHandlers.initializeEventHandlers();
  logger.info('Goal event handlers registered');

  // 2. 预加载必要数据
  // await preloadGoalFolderectories();

  logger.info('✅ Goal module initialized');
}

export async function cleanupGoalModule(): Promise<void> {
  logger.info('Cleaning up Goal module...');

  // 清理资源

  logger.info('✅ Goal module cleaned up');
}
```

---

## 📚 API 参考

### InitializationManager

| 方法           | 签名                                       | 说明         |
| -------------- | ------------------------------------------ | ------------ |
| `register()`   | `register(initializer: Initializer): void` | 注册初始化器 |
| `initialize()` | `initialize(): Promise<void>`              | 执行初始化   |
| `cleanup()`    | `cleanup(): Promise<void>`                 | 清理资源     |

### Initializer 接口

```typescript
interface Initializer {
  name: string; // 模块名称
  priority?: number; // 优先级（默认100）
  dependencies?: string[]; // 依赖的模块
  initialize: () => Promise<void>; // 初始化函数
  cleanup?: () => Promise<void>; // 清理函数（可选）
}
```

---

## 🔗 相关文档

- [[事件总线系统]] - 事件系统初始化
- [[日志系统]] - 日志系统初始化
- `GOAL_INITIALIZATION_QUICK_REFERENCE.md` - Goal 模块初始化

---

**维护者**: DailyUse Team  
**最后更新**: 2025-10-03
