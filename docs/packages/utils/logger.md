# Logger 系统文档

> **模块**: @dailyuse/utils/logger  
> **版本**: 2.0  
> **类型**: 跨平台日志系统

---

## 📋 概述

全新的跨平台日志系统，实现了 Node.js 和 Browser 环境的完美隔离与统一接口。

### 核心特性

- **跨平台**: 支持 Node.js (API/Desktop) 和 Browser (Web)。
- **隔离设计**: Node.js 端使用 Winston，Browser 端使用轻量级实现，避免依赖污染。
- **统一接口**: `ILogger` 接口定义了统一的日志方法。
- **多传输器**: 支持 Console, File, HTTP 等多种日志传输方式。
- **结构化日志**: 支持 JSON 格式的结构化日志。

---

## 🏗️ 架构设计

- **接口层**: `ILogger` 定义统一标准。
- **Node.js 端**: 使用 `WinstonLogger` (封装 winston)，支持文件轮转、彩色控制台。
  - *注意*: 必须从 `@dailyuse/utils/winston` 导入以避免污染前端构建。
- **Browser 端**: 使用轻量级 `Logger` + `ConsoleTransport` (开发调试) + `HttpTransport` (生产上报)。

---

## 💻 使用指南

### 通用使用

```typescript
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('MyContext');

logger.info('Operation started', { id: 123 });
logger.error('Operation failed', new Error('Network Error'));
```

### Node.js API 配置

```typescript
import { LoggerFactory } from '@dailyuse/utils';
import { WinstonLogger } from '@dailyuse/utils/winston'; // 专用入口

// 注册 Winston 实现
LoggerFactory.registerProvider((context) => new WinstonLogger(context));
```

### Browser Web 配置

```typescript
import { LoggerFactory, ConsoleTransport, HttpTransport, LogLevel } from '@dailyuse/utils';

LoggerFactory.configure({
  level: 'info',
  transports: [
    new ConsoleTransport(),
    new HttpTransport({
      url: '/api/logs', // 日志上报接口
      level: LogLevel.WARN, // 仅上报警告及以上
      batchSize: 5
    })
  ]
});
```

---

## 📝 最佳实践

1.  **独立 Logger**: 为每个模块创建独立的 logger，便于追踪。
    ```typescript
    const logger = LoggerFactory.create('GoalService');
    ```
2.  **结构化日志**: 使用对象传递元数据，而不是拼接字符串。
    ```typescript
    // ✅ 推荐
    logger.info('Goal created', { goalId, userId });
    // ❌ 避免
    logger.info(`Goal created: ${goalId} by ${userId}`);
    ```
3.  **错误处理**: 传递 Error 对象以获取堆栈信息。
    ```typescript
    logger.error('Failed', error);
    ```
