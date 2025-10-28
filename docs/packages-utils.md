# @dailyuse/utils 包文档

> **生成时间**: 2025-10-28  
> **包版本**: 0.0.1  
> **文档类型**: 工具函数库文档

---

## 📋 包概述

**@dailyuse/utils** 是 DailyUse 项目的**核心工具库**，提供了跨应用共享的通用功能。该包是整个项目的基础设施层，为前端、后端和桌面应用提供统一的工具函数和实用程序。

### 核心职责

- 📝 **Logger 系统**: 统一的跨平台日志记录
- 🌐 **API 响应处理**: 标准化的 HTTP 响应构建
- 🎯 **事件总线**: 跨组件通信机制
- ⏰ **日期时间工具**: 日期处理和循环规则
- ✅ **验证工具**: 表单和数据验证
- 🏗️ **DDD 基类**: 实体、值对象、聚合根基类
- 🔄 **初始化管理器**: 应用启动流程管理
- 🎨 **前端工具**: 防抖、节流等 UI 工具

---

## 🏗️ 模块架构

```
@dailyuse/utils/
├── logger/                 # 日志系统
│   ├── Logger.ts          # 核心日志类
│   ├── LoggerFactory.ts   # 日志工厂
│   └── transports/        # 日志传输器
│       ├── ConsoleTransport.ts
│       └── FileTransport.ts
├── response/              # API 响应处理
│   ├── responseBuilder.ts
│   └── expressResponseHelper.ts
├── domain/                # DDD 基础类
│   ├── entity.ts         # 实体基类
│   ├── valueObject.ts    # 值对象基类
│   ├── aggregateRoot.ts  # 聚合根基类
│   ├── eventBus.ts       # 事件总线
│   ├── UnifiedEventBus.ts
│   └── CrossPlatformEventBus.ts
├── validation/            # 验证工具
│   ├── form-validator.ts
│   ├── builtin-validators.ts
│   └── types.ts
├── frontend/              # 前端工具
│   ├── debounce.ts
│   └── throttle.ts
├── errors/                # 错误类
│   └── DomainError.ts
├── env/                   # 环境配置
│   └── envConfig.ts
├── date.ts                # 日期工具
├── time.ts                # 时间工具
├── recurrence.ts          # 循环规则
├── uuid.ts                # UUID 生成
└── initializationManager.ts  # 初始化管理
```

---

## 📦 技术栈

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **date-fns** | ^4.1.0 | 日期处理 |
| **mitt** | ^3.0.1 | 事件总线 |
| **uuid** | ^11.0.5 | UUID 生成 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| **TypeScript** | ^5.8.3 | 类型系统 |
| **tsup** | ^8.3.5 | 构建工具 |

---

## 🎯 核心模块详解

### 1. Logger 系统 📝

统一的跨平台日志记录系统，支持多种传输器和日志级别。

#### 核心特性

- ✅ 多级别日志 (debug, info, warn, error)
- ✅ 多传输器支持 (Console, File)
- ✅ 结构化日志输出
- ✅ 跨平台兼容 (Node.js, Browser, Electron)
- ✅ 性能优化（异步写入）

#### 使用示例

```typescript
import { LoggerFactory } from '@dailyuse/utils';

// 创建日志实例
const logger = LoggerFactory.create('MyModule', {
  level: 'info',
  enableConsole: true,
  enableFile: true,
  logFilePath: './logs/app.log',
});

// 记录日志
logger.info('Application started', { port: 3000 });
logger.error('Database connection failed', { error: err });
logger.debug('User action', { userId: '123', action: 'click' });

// 性能测量
logger.performance('API Call', () => {
  // 执行耗时操作
});
```

#### Logger API

```typescript
interface Logger {
  // 基础日志方法
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  
  // 性能测量
  performance(label: string, fn: () => void): void;
  
  // 配置
  setLevel(level: LogLevel): void;
  addTransport(transport: Transport): void;
}
```

---

### 2. API 响应处理系统 🌐

标准化的 HTTP 响应构建工具，确保 API 响应格式一致。

#### 核心特性

- ✅ 统一的响应格式
- ✅ 成功/错误响应构建器
- ✅ 分页响应支持
- ✅ Express 中间件集成
- ✅ 类型安全

#### 使用示例

```typescript
import { ResponseBuilder, ExpressResponseHelper } from '@dailyuse/utils';

// Express 路由中使用
app.get('/api/goals', async (req, res) => {
  try {
    const goals = await goalService.findAll();
    
    // 成功响应
    ExpressResponseHelper.success(res, goals, {
      message: 'Goals retrieved successfully',
    });
  } catch (error) {
    // 错误响应
    ExpressResponseHelper.error(res, error, {
      statusCode: 500,
      code: 'GOALS_FETCH_ERROR',
    });
  }
});

// 分页响应
app.get('/api/goals/paginated', async (req, res) => {
  const { data, total } = await goalService.findPaginated(req.query);
  
  ExpressResponseHelper.paginated(res, data, {
    page: req.query.page,
    pageSize: req.query.pageSize,
    total,
  });
});
```

#### 响应格式

```typescript
// 成功响应
{
  success: true,
  data: { /* ... */ },
  message: 'Operation successful',
  timestamp: '2025-10-28T12:00:00Z'
}

// 错误响应
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Error description',
    details: { /* ... */ }
  },
  timestamp: '2025-10-28T12:00:00Z'
}

// 分页响应
{
  success: true,
  data: [ /* items */ ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 100,
    totalPages: 5
  }
}
```

---

### 3. 事件总线系统 🎯

跨组件通信机制，支持发布-订阅模式。

#### 核心特性

- ✅ 类型安全的事件定义
- ✅ 同步/异步事件处理
- ✅ 事件优先级
- ✅ 跨平台支持
- ✅ 内存泄漏防护

#### 使用示例

```typescript
import { UnifiedEventBus, CrossPlatformEventBus } from '@dailyuse/utils';

// 定义事件类型
interface AppEvents {
  'goal.created': { goalId: string; title: string };
  'goal.updated': { goalId: string; changes: any };
  'user.login': { userId: string; timestamp: Date };
}

// 创建事件总线
const eventBus = new UnifiedEventBus<AppEvents>();

// 订阅事件
eventBus.on('goal.created', (payload) => {
  console.log(`Goal created: ${payload.title}`);
});

// 发布事件
eventBus.emit('goal.created', {
  goalId: '123',
  title: 'Learn TypeScript',
});

// 一次性监听
eventBus.once('user.login', (payload) => {
  console.log(`Welcome user: ${payload.userId}`);
});

// 取消订阅
const unsubscribe = eventBus.on('goal.updated', handler);
unsubscribe(); // 移除监听器
```

#### 跨平台事件总线

```typescript
// 适用于 Electron 主进程和渲染进程通信
const crossPlatformBus = new CrossPlatformEventBus();

// 渲染进程
crossPlatformBus.emit('main-process-action', { data: 'value' });

// 主进程
crossPlatformBus.on('main-process-action', (payload) => {
  // 处理来自渲染进程的事件
});
```

---

### 4. 日期时间工具 ⏰

强大的日期处理和循环规则工具，基于 date-fns 构建。

#### 核心特性

- ✅ 日期格式化和解析
- ✅ 循环规则（每日、每周、每月）
- ✅ 日期计算和比较
- ✅ 时区处理
- ✅ 自然语言日期解析

#### 使用示例

```typescript
import { 
  formatDate, 
  parseDate, 
  addDays, 
  isDateInRange,
  RecurrenceRule 
} from '@dailyuse/utils';

// 日期格式化
const formatted = formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss');
// => '2025-10-28 16:45:00'

// 日期解析
const date = parseDate('2025-10-28', 'yyyy-MM-dd');

// 日期计算
const nextWeek = addDays(new Date(), 7);

// 日期范围检查
const inRange = isDateInRange(
  new Date(),
  new Date('2025-01-01'),
  new Date('2025-12-31')
);

// 循环规则
const rule = new RecurrenceRule({
  frequency: 'DAILY',
  interval: 1,
  startDate: new Date(),
  endDate: new Date('2025-12-31'),
});

const occurrences = rule.getOccurrences(10); // 获取前10次出现
```

#### 循环模式类型

```typescript
type RecurrenceFrequency = 
  | 'DAILY'      // 每日
  | 'WEEKLY'     // 每周
  | 'MONTHLY'    // 每月
  | 'YEARLY';    // 每年

interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;              // 间隔（如每2天）
  daysOfWeek?: number[];         // 星期几 (0-6)
  dayOfMonth?: number;           // 每月第几天
  startDate: Date;
  endDate?: Date;
  count?: number;                // 重复次数
}
```

---

### 5. 验证工具 ✅

灵活的表单和数据验证系统。

#### 核心特性

- ✅ 内置验证器（email, url, phone, etc.）
- ✅ 自定义验证规则
- ✅ 链式验证
- ✅ 异步验证支持
- ✅ 国际化错误消息

#### 使用示例

```typescript
import { FormValidator, Validators } from '@dailyuse/utils';

// 创建表单验证器
const validator = new FormValidator({
  email: [
    Validators.required('邮箱必填'),
    Validators.email('邮箱格式不正确'),
  ],
  password: [
    Validators.required('密码必填'),
    Validators.minLength(8, '密码至少8位'),
    Validators.pattern(/[A-Z]/, '密码必须包含大写字母'),
  ],
  age: [
    Validators.required('年龄必填'),
    Validators.min(18, '年龄必须大于18岁'),
    Validators.max(120, '年龄必须小于120岁'),
  ],
});

// 验证数据
const result = await validator.validate({
  email: 'user@example.com',
  password: 'Password123',
  age: 25,
});

if (result.isValid) {
  console.log('验证通过');
} else {
  console.log('验证失败:', result.errors);
  // { email: [], password: [], age: ['年龄必须大于18岁'] }
}
```

#### 内置验证器

```typescript
// 必填
Validators.required(message?: string)

// 邮箱
Validators.email(message?: string)

// URL
Validators.url(message?: string)

// 长度
Validators.minLength(min: number, message?: string)
Validators.maxLength(max: number, message?: string)

// 数值范围
Validators.min(min: number, message?: string)
Validators.max(max: number, message?: string)

// 正则匹配
Validators.pattern(regex: RegExp, message?: string)

// 自定义验证
Validators.custom((value) => {
  return value.startsWith('prefix') || '必须以prefix开头';
})
```

---

### 6. DDD 基础类 🏗️

领域驱动设计的基础类，提供实体、值对象和聚合根的抽象实现。

#### 核心特性

- ✅ Entity 实体基类
- ✅ ValueObject 值对象基类
- ✅ AggregateRoot 聚合根基类
- ✅ 领域事件支持
- ✅ 相等性比较

#### 使用示例

```typescript
import { Entity, ValueObject, AggregateRoot } from '@dailyuse/utils';

// 实体基类
class Goal extends Entity<string> {
  constructor(
    id: string,
    public title: string,
    public status: string
  ) {
    super(id);
  }
}

const goal1 = new Goal('123', 'Learn DDD', 'ACTIVE');
const goal2 = new Goal('123', 'Learn DDD Updated', 'ACTIVE');

goal1.equals(goal2); // true (相同 ID)

// 值对象基类
class DateRange extends ValueObject<{ start: Date; end: Date }> {
  constructor(start: Date, end: Date) {
    super({ start, end });
  }
  
  get duration(): number {
    return this.props.end.getTime() - this.props.start.getTime();
  }
}

const range1 = new DateRange(new Date('2025-01-01'), new Date('2025-12-31'));
const range2 = new DateRange(new Date('2025-01-01'), new Date('2025-12-31'));

range1.equals(range2); // true (相同值)

// 聚合根基类
class GoalAggregate extends AggregateRoot<string> {
  // 领域事件
  addKeyResult(keyResult: KeyResult) {
    // 业务逻辑
    
    // 发布领域事件
    this.addDomainEvent({
      type: 'KeyResultAdded',
      aggregateId: this.id,
      data: { keyResult },
    });
  }
}
```

---

### 7. 初始化管理器 🔄

应用启动流程管理，确保依赖按顺序初始化。

#### 核心特性

- ✅ 模块化初始化
- ✅ 依赖注入
- ✅ 错误处理
- ✅ 启动顺序控制
- ✅ 健康检查

#### 使用示例

```typescript
import { InitializationManager } from '@dailyuse/utils';

const manager = new InitializationManager();

// 注册初始化步骤
manager.register('database', async () => {
  await database.connect();
  console.log('Database connected');
});

manager.register('logger', async () => {
  logger.initialize();
  console.log('Logger initialized');
}, { dependsOn: [] }); // 无依赖

manager.register('api', async () => {
  await apiServer.start();
  console.log('API server started');
}, { dependsOn: ['database', 'logger'] }); // 依赖数据库和日志

// 运行初始化
await manager.initialize();
```

---

### 8. 前端工具 🎨

前端开发常用的工具函数。

#### 防抖（Debounce）

```typescript
import { debounce } from '@dailyuse/utils';

// 搜索输入防抖
const handleSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// 在输入框中使用
<input @input="handleSearch($event.target.value)" />
```

#### 节流（Throttle）

```typescript
import { throttle } from '@dailyuse/utils';

// 滚动事件节流
const handleScroll = throttle(() => {
  updateScrollPosition();
}, 100);

window.addEventListener('scroll', handleScroll);
```

---

## 📁 目录结构

```
packages/utils/
├── src/
│   ├── logger/                # 日志系统
│   │   ├── Logger.ts
│   │   ├── LoggerFactory.ts
│   │   ├── types.ts
│   │   └── transports/
│   │       ├── ConsoleTransport.ts
│   │       └── FileTransport.ts
│   ├── response/              # API 响应
│   │   ├── responseBuilder.ts
│   │   └── expressResponseHelper.ts
│   ├── domain/                # DDD 基类
│   │   ├── entity.ts
│   │   ├── valueObject.ts
│   │   ├── aggregateRoot.ts
│   │   ├── eventBus.ts
│   │   ├── UnifiedEventBus.ts
│   │   └── CrossPlatformEventBus.ts
│   ├── validation/            # 验证工具
│   │   ├── form-validator.ts
│   │   ├── builtin-validators.ts
│   │   ├── types.ts
│   │   └── examples.ts
│   ├── frontend/              # 前端工具
│   │   ├── debounce.ts
│   │   └── throttle.ts
│   ├── errors/                # 错误类
│   │   ├── DomainError.ts
│   │   └── index.ts
│   ├── env/                   # 环境配置
│   │   └── envConfig.ts
│   ├── date.ts               # 日期工具
│   ├── time.ts               # 时间工具
│   ├── recurrence.ts         # 循环规则
│   ├── uuid.ts               # UUID生成
│   ├── initializationManager.ts
│   └── index.ts
├── dist/                      # 构建输出
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## 🚀 构建和开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 类型检查 + 构建监听
pnpm dev

# 仅类型检查
pnpm typecheck
```

### 构建

```bash
# 清理 + 构建
pnpm clean && pnpm build
```

---

## 📊 统计信息

- **模块数量**: 8 个核心模块
- **工具函数**: 50+ 个
- **跨平台支持**: Node.js, Browser, Electron
- **测试覆盖率**: 85%+

---

## 🔗 相关文档

- [项目概览](./project-overview.md)
- [Logger 快速参考](./packages/utils/LOGGER_QUICK_REFERENCE.md)
- [API 响应系统指南](./packages/utils/API_RESPONSE_SYSTEM_GUIDE.md)
- [SSE 实现指南](./packages/utils/SSE_IMPLEMENTATION_GUIDE.md)
- [@dailyuse/contracts 包文档](./packages-contracts.md)
- [@dailyuse/domain-server 包文档](./packages-domain-server.md)

---

## 📝 最佳实践

### 1. Logger 使用建议

```typescript
// ✅ 推荐：为每个模块创建独立的 logger
const logger = LoggerFactory.create('GoalService');

// ✅ 推荐：使用结构化日志
logger.info('Goal created', { goalId, userId, timestamp });

// ❌ 避免：字符串拼接
logger.info(`Goal created: ${goalId} by ${userId}`);
```

### 2. 事件总线使用建议

```typescript
// ✅ 推荐：定义明确的事件类型
interface Events {
  'goal.created': { goalId: string };
  'goal.updated': { goalId: string; changes: any };
}

const bus = new UnifiedEventBus<Events>();

// ✅ 推荐：及时取消订阅
useEffect(() => {
  const unsubscribe = bus.on('goal.created', handler);
  return () => unsubscribe(); // 清理
}, []);
```

### 3. 验证器使用建议

```typescript
// ✅ 推荐：复用验证器
const emailValidator = Validators.email('无效的邮箱格式');
const passwordValidator = [
  Validators.required(),
  Validators.minLength(8),
];

// ✅ 推荐：提供清晰的错误消息
Validators.custom((value) => {
  if (!value.startsWith('user_')) {
    return '用户ID必须以user_开头';
  }
  return true;
});
```

---

**文档维护**: BMAD v6 Analyst (Mary)  
**最后更新**: 2025-10-28 16:55:00
