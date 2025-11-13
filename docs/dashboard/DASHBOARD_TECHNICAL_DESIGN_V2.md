# Dashboard Technical Design v2.0

**文档版本**: v2.0 ✅ **基于现有代码架构重新设计**  
**创建日期**: 2025-11-12  
**Tech Lead**: Bmad Master Agent  
**项目**: DailyUse Dashboard 完善

---

## ⚠️ **重要变更说明（v2.0）**

### 架构调整

| 层级       | v1.0（旧）             | v2.0（新）                             | 原因                    |
| ---------- | ---------------------- | -------------------------------------- | ----------------------- |
| **数据层** | 创建新的 Statistics 表 | ✅ 复用现有 Statistics 表              | Statistics 聚合根已存在 |
| **领域层** | 创建 Statistics 服务   | ✅ 直接调用现有聚合根                  | DDD 架构已成熟          |
| **应用层** | TaskStatisticsService  | 🆕 DashboardStatisticsAggregateService | 聚合层模式              |
| **缓存层** | 无                     | 🆕 Redis 缓存层                        | 性能优化                |
| **展示层** | 简单组件               | 🆕 Widget 系统                         | 模块化设计              |

### 关键设计原则

1. **利用现有基础设施**：直接调用 `TaskStatistics`, `GoalStatistics`, `ReminderStatistics`, `ScheduleStatistics` 聚合根
2. **聚合层模式**：创建 `DashboardStatisticsAggregateService` 聚合 4 个模块的数据
3. **缓存优先**：Redis 缓存层，TTL 5 分钟，事件驱动失效
4. **Widget 可插拔**：注册机制支持动态扩展

---

## 1. 系统架构

### 1.1 整体架构图

```
┌────────────────────────────────────────────────────────────────┐
│                     Frontend Layer (Vue 3)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Dashboard Page                           │  │
│  │  - useDashboardStatistics() Composable                    │  │
│  └────────────┬─────────────────────────────────────────────┘  │
│               │                                                 │
│  ┌────────────▼─────────────────────────────────────────────┐  │
│  │                  Widget Layer                             │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │  │
│  │  │ Task   │  │ Goal   │  │Reminder│  │Schedule│         │  │
│  │  │ Widget │  │ Widget │  │ Widget │  │ Widget │         │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────┬───────────────────────────────────────────┘
                     │ HTTP GET /api/dashboard/statistics
                     │
┌────────────────────▼───────────────────────────────────────────┐
│                      API Layer (Express)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Dashboard Controller                            │  │
│  │  - GET /statistics (authMiddleware)                       │  │
│  └────────────┬─────────────────────────────────────────────┘  │
└───────────────┼────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────┐
│                  Application Service Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │     DashboardStatisticsAggregateService 🆕                │  │
│  │  - aggregateStatistics(accountUuid)                       │  │
│  │  - calculateOverallCompletionRate()                       │  │
│  └────┬───────────────────────────────────────────┬──────────┘  │
│       │                                            │             │
│  ┌────▼──────────┐                      ┌─────────▼─────────┐  │
│  │ StatisticsCache│  ← Cache Hit?       │  Cache Miss →     │  │
│  │ Service (Redis)│                     │  Query Database   │  │
│  └────────────────┘                     └─────────┬─────────┘  │
└────────────────────────────────────────────────────┼───────────┘
                                                     │
┌────────────────────────────────────────────────────▼───────────┐
│                      Domain Layer (DDD)                         │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              │
│  │  Task  │  │  Goal  │  │Reminder│  │Schedule│              │
│  │Statisti│  │Statisti│  │Statisti│  │Statisti│              │
│  │cs ✅   │  │cs ✅   │  │cs ✅   │  │cs ✅   │              │
│  └────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘              │
│       │           │           │           │                    │
│       │    recalculate()      │           │                    │
│       │    onXxxCreated()     │           │                    │
│       │    toClientDTO()      │           │                    │
│  └────┴───────────┴───────────┴───────────┴────────────────┘  │
└────────────────────────────────┬───────────────────────────────┘
                                 │
┌────────────────────────────────▼───────────────────────────────┐
│                   Persistence Layer (Prisma)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TaskStatistics Table  ✅ 已存在                         │  │
│  │  GoalStatistics Table  ✅ 已存在                         │  │
│  │  ReminderStatistics Table  ✅ 已存在                     │  │
│  │  ScheduleStatistics Table  ✅ 已存在                     │  │
│  │  DashboardConfig Table  🆕 新增（Widget 配置）           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心组件设计

### 2.1 DashboardStatisticsAggregateService（应用服务层）

**职责**：聚合 4 个模块的 Statistics 数据，提供统一的 Dashboard 视图

**设计模式**：聚合器模式（Aggregator Pattern）

**类图**：

```typescript
/**
 * Dashboard 统计聚合服务
 *
 * 职责：
 * 1. 并行查询 4 个模块的 Statistics 聚合根
 * 2. 聚合数据为 DashboardStatisticsDTO
 * 3. 集成 Redis 缓存层
 * 4. 计算跨模块的汇总指标
 */
export class DashboardStatisticsAggregateService {
  constructor(
    private taskStatisticsRepository: TaskStatisticsRepository,
    private goalStatisticsRepository: GoalStatisticsRepository,
    private reminderStatisticsRepository: ReminderStatisticsRepository,
    private scheduleStatisticsRepository: ScheduleStatisticsRepository,
    private cacheService: StatisticsCacheService,
    private logger: Logger,
  ) {}

  /**
   * 聚合所有模块的统计数据
   *
   * 流程：
   * 1. 尝试从 Redis 缓存读取
   * 2. 缓存未命中时，并行查询 4 个模块的 Statistics
   * 3. 聚合数据 + 计算汇总指标
   * 4. 写入缓存（TTL 5分钟）
   * 5. 返回 DashboardStatisticsDTO
   */
  async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
    // 1. 尝试从缓存读取
    const cached = await this.cacheService.get(accountUuid);
    if (cached) {
      this.logger.info(`[Dashboard] Cache hit for account=${accountUuid}`);
      return cached;
    }

    this.logger.info(`[Dashboard] Cache miss for account=${accountUuid}, querying database`);

    // 2. 并行查询所有 Statistics 聚合根
    const startTime = Date.now();
    const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
      this.taskStatisticsRepository.findByAccountUuid(accountUuid),
      this.goalStatisticsRepository.findByAccountUuid(accountUuid),
      this.reminderStatisticsRepository.findByAccountUuid(accountUuid),
      this.scheduleStatisticsRepository.findByAccountUuid(accountUuid),
    ]);
    const queryTime = Date.now() - startTime;

    this.logger.info(`[Dashboard] Database query completed in ${queryTime}ms`);

    // 3. 处理缺失数据（创建默认 Statistics）
    const task = taskStats ?? TaskStatistics.createDefault(accountUuid);
    const goal = goalStats ?? GoalStatistics.createDefault(accountUuid);
    const reminder = reminderStats ?? ReminderStatistics.create({ accountUuid });
    const schedule = scheduleStats ?? ScheduleStatistics.createEmpty(accountUuid);

    // 4. 计算汇总数据
    const summary = {
      totalTasks: task.totalTasks,
      totalGoals: goal.totalGoals,
      totalReminders: reminder.templateStats.totalTemplates,
      totalScheduleTasks: schedule.totalTasks,
      overallCompletionRate: this.calculateOverallCompletionRate(task, goal),
    };

    // 5. 聚合为 DTO
    const dashboardStats: DashboardStatisticsDTO = {
      accountUuid,
      summary,
      taskStats: task.toClientDTO(),
      goalStats: goal.toClientDTO(),
      reminderStats: reminder.toClientDTO(),
      scheduleStats: schedule.toClientDTO(),
      calculatedAt: Date.now(),
      cacheHit: false,
    };

    // 6. 写入缓存
    await this.cacheService.set(accountUuid, dashboardStats, 300); // TTL 5分钟

    this.logger.info(`[Dashboard] Statistics aggregated and cached for account=${accountUuid}`);

    return dashboardStats;
  }

  /**
   * 计算总体完成率
   *
   * 策略：取 Task 和 Goal 完成率的加权平均
   * 权重：Task 60%, Goal 40%（可配置）
   */
  private calculateOverallCompletionRate(
    taskStats: TaskStatistics,
    goalStats: GoalStatistics,
  ): number {
    const taskRate = taskStats.getTodayCompletionRate();
    const goalRate = goalStats.getCompletionRate();

    // 加权平均：Task 60%, Goal 40%
    const weightedRate = taskRate * 0.6 + goalRate * 0.4;

    return Math.round(weightedRate * 10) / 10; // 保留 1 位小数
  }

  /**
   * 强制刷新缓存（管理员操作）
   */
  async refreshCache(accountUuid: string): Promise<void> {
    await this.cacheService.invalidate(accountUuid);
    await this.aggregateStatistics(accountUuid);
  }
}
```

---

### 2.2 StatisticsCacheService（缓存层）

**职责**：基于 Redis 的统计数据缓存

**设计模式**：缓存代理模式（Cache-Aside Pattern）

```typescript
/**
 * 统计数据缓存服务
 *
 * 职责：
 * 1. Redis 缓存读写
 * 2. TTL 管理（默认 5 分钟）
 * 3. 缓存失效（主动 + 被动）
 */
export class StatisticsCacheService {
  private readonly CACHE_KEY_PREFIX = 'dashboard:stats:';
  private readonly DEFAULT_TTL = 300; // 5分钟

  constructor(
    private redis: Redis,
    private logger: Logger,
  ) {}

  /**
   * 从缓存读取统计数据
   */
  async get(accountUuid: string): Promise<DashboardStatisticsDTO | null> {
    const key = this.getCacheKey(accountUuid);

    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;

      const data = JSON.parse(cached);
      data.cacheHit = true;

      return data;
    } catch (error) {
      this.logger.error(`[Cache] Failed to read cache for ${accountUuid}`, error);
      return null;
    }
  }

  /**
   * 写入缓存
   */
  async set(
    accountUuid: string,
    data: DashboardStatisticsDTO,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const key = this.getCacheKey(accountUuid);

    try {
      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
      this.logger.debug(`[Cache] Cached statistics for ${accountUuid}, TTL=${ttl}s`);
    } catch (error) {
      this.logger.error(`[Cache] Failed to write cache for ${accountUuid}`, error);
    }
  }

  /**
   * 主动失效缓存
   */
  async invalidate(accountUuid: string): Promise<void> {
    const key = this.getCacheKey(accountUuid);

    try {
      const result = await this.redis.del(key);
      if (result > 0) {
        this.logger.info(`[Cache] Invalidated cache for ${accountUuid}`);
      }
    } catch (error) {
      this.logger.error(`[Cache] Failed to invalidate cache for ${accountUuid}`, error);
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(accountUuid: string): Promise<boolean> {
    const key = this.getCacheKey(accountUuid);
    return (await this.redis.exists(key)) === 1;
  }

  /**
   * 获取缓存 TTL
   */
  async getTTL(accountUuid: string): Promise<number> {
    const key = this.getCacheKey(accountUuid);
    return await this.redis.ttl(key);
  }

  /**
   * 批量失效（用于测试或管理）
   */
  async invalidatePattern(pattern: string = '*'): Promise<number> {
    const keys = await this.redis.keys(`${this.CACHE_KEY_PREFIX}${pattern}`);
    if (keys.length === 0) return 0;

    return await this.redis.del(...keys);
  }

  private getCacheKey(accountUuid: string): string {
    return `${this.CACHE_KEY_PREFIX}${accountUuid}`;
  }
}
```

---

### 2.3 事件驱动缓存失效机制

**职责**：监听 Statistics 更新事件，自动失效缓存

**设计模式**：观察者模式（Observer Pattern）

```typescript
/**
 * 统计缓存失效监听器
 *
 * 职责：
 * 1. 监听所有 Statistics 聚合根的更新事件
 * 2. 触发缓存失效
 * 3. 记录失效日志
 */
export class StatisticsCacheInvalidationListener {
  constructor(
    private eventBus: EventBus,
    private cacheService: StatisticsCacheService,
    private logger: Logger,
  ) {
    this.registerListeners();
  }

  private registerListeners(): void {
    // TaskStatistics 事件
    this.eventBus.on('task.statistics.updated', (event) => {
      this.invalidateCache(event.accountUuid, 'TaskStatistics');
    });

    this.eventBus.on('task.statistics.recalculated', (event) => {
      this.invalidateCache(event.accountUuid, 'TaskStatistics');
    });

    // GoalStatistics 事件
    this.eventBus.on('goal_statistics.recalculated', (event) => {
      this.invalidateCache(event.accountUuid, 'GoalStatistics');
    });

    // ReminderStatistics 事件
    this.eventBus.on('ReminderStatisticsUpdated', (event) => {
      this.invalidateCache(event.accountUuid, 'ReminderStatistics');
    });

    // ScheduleStatistics 事件
    this.eventBus.on('ScheduleStatisticsExecutionRecorded', (event) => {
      this.invalidateCache(event.accountUuid, 'ScheduleStatistics');
    });

    this.eventBus.on('ScheduleStatisticsTaskCountIncremented', (event) => {
      this.invalidateCache(event.accountUuid, 'ScheduleStatistics');
    });

    this.logger.info('[StatisticsCacheInvalidationListener] Event listeners registered');
  }

  private async invalidateCache(accountUuid: string, source: string): Promise<void> {
    try {
      await this.cacheService.invalidate(accountUuid);
      this.logger.info(`[Cache Invalidation] Triggered by ${source} for account=${accountUuid}`);
    } catch (error) {
      this.logger.error(
        `[Cache Invalidation] Failed to invalidate cache for account=${accountUuid}`,
        error,
      );
    }
  }
}
```

---

### 2.4 WidgetRegistry（前端 Widget 管理）

**职责**：Widget 注册、配置管理、发现机制

**设计模式**：注册表模式（Registry Pattern）

```typescript
/**
 * Widget 注册表
 *
 * 职责：
 * 1. 运行时注册 Widget
 * 2. Widget 配置管理
 * 3. Widget 发现机制
 */
interface WidgetConfig {
  id: string;
  name: string;
  component: Component;
  defaultSize: 'small' | 'medium' | 'large';
  defaultOrder: number;
  defaultVisible: boolean;
  icon?: string;
  category?: string;
}

class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets = new Map<string, WidgetConfig>();

  private constructor() {}

  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * 注册 Widget
   */
  register(config: WidgetConfig): void {
    if (this.widgets.has(config.id)) {
      console.warn(`[WidgetRegistry] Widget ${config.id} already registered`);
      return;
    }

    this.widgets.set(config.id, config);
    console.info(`[WidgetRegistry] Registered widget: ${config.id}`);
  }

  /**
   * 批量注册
   */
  registerMany(configs: WidgetConfig[]): void {
    configs.forEach((config) => this.register(config));
  }

  /**
   * 获取单个 Widget
   */
  getWidget(id: string): WidgetConfig | undefined {
    return this.widgets.get(id);
  }

  /**
   * 获取所有 Widget（按顺序）
   */
  getAllWidgets(): WidgetConfig[] {
    return Array.from(this.widgets.values()).sort((a, b) => a.defaultOrder - b.defaultOrder);
  }

  /**
   * 按分类获取 Widget
   */
  getWidgetsByCategory(category: string): WidgetConfig[] {
    return this.getAllWidgets().filter((w) => w.category === category);
  }

  /**
   * 注销 Widget（用于测试）
   */
  unregister(id: string): boolean {
    return this.widgets.delete(id);
  }

  /**
   * 清空所有 Widget（用于测试）
   */
  clear(): void {
    this.widgets.clear();
  }
}

export const widgetRegistry = WidgetRegistry.getInstance();

// 使用示例：注册内置 Widget
widgetRegistry.registerMany([
  {
    id: 'task-stats',
    name: '任务统计',
    component: TaskStatsWidget,
    defaultSize: 'medium',
    defaultOrder: 1,
    defaultVisible: true,
    icon: 'mdi-checkbox-marked-circle',
    category: 'statistics',
  },
  {
    id: 'goal-stats',
    name: '目标统计',
    component: GoalStatsWidget,
    defaultSize: 'medium',
    defaultOrder: 2,
    defaultVisible: true,
    icon: 'mdi-target',
    category: 'statistics',
  },
  {
    id: 'reminder-stats',
    name: '提醒统计',
    component: ReminderStatsWidget,
    defaultSize: 'small',
    defaultOrder: 3,
    defaultVisible: true,
    icon: 'mdi-bell',
    category: 'statistics',
  },
  {
    id: 'schedule-stats',
    name: '调度统计',
    component: ScheduleStatsWidget,
    defaultSize: 'small',
    defaultOrder: 4,
    defaultVisible: true,
    icon: 'mdi-clock-outline',
    category: 'statistics',
  },
]);
```

---

## 3. 数据模型

### 3.1 DashboardStatisticsDTO（跨层传输）

```typescript
/**
 * Dashboard 统计数据传输对象
 *
 * 用途：
 * - API 响应
 * - 前端状态管理
 * - 缓存存储
 */
export interface DashboardStatisticsDTO {
  accountUuid: string;

  // 汇总数据
  summary: {
    totalTasks: number;
    totalGoals: number;
    totalReminders: number;
    totalScheduleTasks: number;
    overallCompletionRate: number; // 总体完成率（0-100）
  };

  // 各模块详细统计
  taskStats: TaskStatisticsClientDTO;
  goalStats: GoalStatisticsClientDTO;
  reminderStats: ReminderStatisticsClientDTO;
  scheduleStats: ScheduleStatisticsClientDTO;

  // 元数据
  calculatedAt: number; // 计算时间戳
  cacheHit: boolean; // 是否命中缓存
}
```

### 3.2 DashboardConfig（Widget 配置）

```prisma
// schema.prisma
model DashboardConfig {
  id          Int      @id @default(autoincrement())
  accountUuid String   @unique @db.VarChar(36)

  // Widget 配置（JSON）
  widgetConfig Json    @default("{}")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("dashboard_configs")
}
```

```typescript
// Widget 配置结构
interface WidgetConfigData {
  [widgetId: string]: {
    visible: boolean;
    order: number;
    size: 'small' | 'medium' | 'large';
  };
}

// 示例
const defaultWidgetConfig: WidgetConfigData = {
  'task-stats': { visible: true, order: 1, size: 'medium' },
  'goal-stats': { visible: true, order: 2, size: 'medium' },
  'reminder-stats': { visible: true, order: 3, size: 'small' },
  'schedule-stats': { visible: true, order: 4, size: 'small' },
};
```

---

## 4. API 设计

### 4.1 Dashboard 统计 API

```
GET /api/dashboard/statistics
Authorization: Bearer <token>
```

**请求示例**：

```bash
curl -X GET https://api.dailyuse.com/api/dashboard/statistics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**成功响应（200 OK）**：

```json
{
  "accountUuid": "user-123",
  "summary": {
    "totalTasks": 45,
    "totalGoals": 12,
    "totalReminders": 8,
    "totalScheduleTasks": 23,
    "overallCompletionRate": 67.5
  },
  "taskStats": {
    "templateStats": {
      "totalTemplates": 30,
      "activeTemplates": 15,
      "pausedTemplates": 5,
      "archivedTemplates": 10,
      "oneTimeTemplates": 10,
      "recurringTemplates": 20
    },
    "instanceStats": {
      "todayInstances": 12,
      "weekInstances": 45,
      "monthInstances": 150,
      "completedInstances": 35,
      "pendingInstances": 10
    },
    "completionStats": {
      "todayCompleted": 8,
      "weekCompleted": 30,
      "completionRate": 77.8
    }
  },
  "goalStats": { ... },
  "reminderStats": { ... },
  "scheduleStats": { ... },
  "calculatedAt": 1731398400000,
  "cacheHit": true
}
```

**错误响应**：

#### 400 Bad Request - 请求参数错误

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "field": "accountUuid",
      "value": "invalid-uuid-format",
      "expected": "Valid UUID v4 format"
    },
    "timestamp": 1731398400000,
    "path": "/api/dashboard/statistics"
  }
}
```

**触发场景**：

- UUID 格式错误
- 缺少必需参数
- 参数类型错误

---

#### 401 Unauthorized - 未授权

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {
      "reason": "Token expired",
      "expiredAt": 1731398400000
    },
    "timestamp": 1731398400000,
    "path": "/api/dashboard/statistics"
  }
}
```

**触发场景**：

- Token 缺失
- Token 格式错误
- Token 已过期
- Token 签名验证失败

**客户端处理建议**：

```typescript
if (response.status === 401) {
  // 清除本地 Token
  localStorage.removeItem('authToken');

  // 跳转登录页
  router.push('/login');

  // 提示用户
  toast.error('登录已过期，请重新登录');
}
```

---

#### 403 Forbidden - 权限不足

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access this resource",
    "details": {
      "requiredPermission": "dashboard:read",
      "userPermissions": ["task:read", "goal:read"]
    },
    "timestamp": 1731398400000,
    "path": "/api/dashboard/statistics"
  }
}
```

**触发场景**：

- 用户无 Dashboard 访问权限
- 账户被禁用
- IP 限制

---

#### 429 Too Many Requests - 请求过多

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": 1731398460000
    },
    "timestamp": 1731398400000,
    "path": "/api/dashboard/statistics"
  }
}
```

**触发场景**：

- 超过 Rate Limit（100 requests/minute）

**客户端处理建议**：

```typescript
if (response.status === 429) {
  const resetAt = response.data.error.details.resetAt;
  const waitTime = Math.ceil((resetAt - Date.now()) / 1000);

  toast.warning(`请求过于频繁，请等待 ${waitTime} 秒后重试`);

  // 自动重试
  setTimeout(() => {
    retryRequest();
  }, waitTime * 1000);
}
```

---

#### 500 Internal Server Error - 服务器错误

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to aggregate statistics",
    "details": {
      "errorId": "err-20251112-abc123",
      "component": "DashboardStatisticsAggregateService",
      "operation": "aggregateStatistics"
    },
    "timestamp": 1731398400000,
    "path": "/api/dashboard/statistics"
  }
}
```

**触发场景**：

- 数据库连接失败
- Redis 连接失败
- Statistics 查询超时
- 未捕获的异常

**客户端处理建议**：

```typescript
if (response.status === 500) {
  const errorId = response.data.error.details.errorId;

  // 显示友好提示
  toast.error('服务暂时不可用，我们正在修复中');

  // 记录错误（用于用户反馈）
  console.error('[Dashboard] Server error:', errorId);

  // 提供反馈入口
  showErrorDialog({
    title: '加载失败',
    message: '抱歉，服务暂时不可用',
    errorId: errorId,
    actions: [
      { label: '重试', onClick: retryRequest },
      { label: '联系支持', onClick: () => openSupportChat(errorId) },
    ],
  });
}
```

---

#### 503 Service Unavailable - 服务不可用

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service temporarily unavailable",
    "details": {
      "reason": "Maintenance in progress",
      "estimatedRecoveryTime": 1731399000000
    },
    "timestamp": 1731398400000,
    "path": "/api/dashboard/statistics"
  }
}
```

**触发场景**：

- 系统维护
- Redis 不可用
- 数据库不可用

---

**统一错误处理示例**：

```typescript
// apps/web/src/utils/apiErrorHandler.ts
export function handleApiError(error: AxiosError): string {
  const status = error.response?.status;
  const data = error.response?.data as ApiError;

  switch (status) {
    case 400:
      return `请求错误: ${data.error.details.field} ${data.error.details.expected}`;

    case 401:
      router.push('/login');
      return '登录已过期，请重新登录';

    case 403:
      return '您没有权限访问此资源';

    case 429:
      const resetAt = data.error.details.resetAt;
      const waitTime = Math.ceil((resetAt - Date.now()) / 1000);
      return `请求过于频繁，请等待 ${waitTime} 秒`;

    case 500:
      Sentry.captureException(error, {
        tags: { errorId: data.error.details.errorId },
      });
      return '服务暂时不可用，我们正在修复中';

    case 503:
      return '系统维护中，请稍后再试';

    default:
      return '网络错误，请检查网络连接';
  }
}
```

---

### 4.2 Widget 配置 API

#### 获取配置

```
GET /api/dashboard/widget-config
Authorization: Bearer <token>
```

**响应**：

```json
{
  "task-stats": { "visible": true, "order": 1, "size": "medium" },
  "goal-stats": { "visible": true, "order": 2, "size": "medium" },
  "reminder-stats": { "visible": false, "order": 3, "size": "small" },
  "schedule-stats": { "visible": true, "order": 4, "size": "small" }
}
```

#### 更新配置

```
PUT /api/dashboard/widget-config
Authorization: Bearer <token>
Content-Type: application/json

{
  "configs": {
    "task-stats": { "visible": true, "order": 1, "size": "large" },
    "goal-stats": { "visible": false, "order": 2, "size": "medium" }
  }
}
```

---

## 5. 性能优化策略

### 5.1 缓存策略

| 场景                | 策略        | TTL             | 失效触发     |
| ------------------- | ----------- | --------------- | ------------ |
| **首次加载**        | Cache-Aside | 5分钟           | 无           |
| **Statistics 更新** | 主动失效    | 立即            | 事件驱动     |
| **高并发**          | 错峰 TTL    | 4-6分钟（随机） | 避免缓存雪崩 |
| **强制刷新**        | 管理员操作  | 立即失效        | API 触发     |

### 5.2 数据库查询优化

```sql
-- TaskStatistics 索引
CREATE INDEX idx_task_stats_account ON task_statistics(accountUuid);

-- GoalStatistics 索引
CREATE INDEX idx_goal_stats_account ON goal_statistics(accountUuid);

-- ReminderStatistics 索引
CREATE INDEX idx_reminder_stats_account ON reminder_statistics(accountUuid);

-- ScheduleStatistics 索引
CREATE UNIQUE INDEX idx_schedule_stats_account ON schedule_statistics(accountUuid);
```

### 5.3 并行查询

```typescript
// ✅ 好的实践：并行查询
const [task, goal, reminder, schedule] = await Promise.all([
  taskRepo.findByAccountUuid(accountUuid),
  goalRepo.findByAccountUuid(accountUuid),
  reminderRepo.findByAccountUuid(accountUuid),
  scheduleRepo.findByAccountUuid(accountUuid),
]);

// ❌ 避免：顺序查询
const task = await taskRepo.findByAccountUuid(accountUuid);
const goal = await goalRepo.findByAccountUuid(accountUuid);
// ... 串行执行，耗时 4x
```

---

## 6. 前端架构

### 6.1 Dashboard Page 组件

```vue
<!-- apps/web/src/modules/dashboard/presentation/pages/DashboardPage.vue -->
<template>
  <v-container fluid class="dashboard-page">
    <!-- 骨架屏加载 -->
    <DashboardSkeleton v-if="loading" />

    <!-- 错误状态 -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
      <v-btn @click="retry" variant="text" color="white">重试</v-btn>
    </v-alert>

    <!-- Widget 网格 -->
    <v-row v-else>
      <v-col
        v-for="widget in visibleWidgets"
        :key="widget.id"
        :cols="getColsBySize(widget.config.size)"
        :md="getMdColsBySize(widget.config.size)"
      >
        <component
          :is="widget.component"
          :stats="getStatsForWidget(widget.id)"
          @click="navigateToModule(widget.id)"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useDashboardStatistics } from '../composables/useDashboardStatistics';
import { useWidgetConfig } from '../composables/useWidgetConfig';
import { widgetRegistry } from '../infrastructure/WidgetRegistry';

const { statistics, loading, error, fetchStatistics, retry } = useDashboardStatistics();
const { widgetConfigs, loadConfig } = useWidgetConfig();

const visibleWidgets = computed(() => {
  return widgetRegistry
    .getAllWidgets()
    .filter((w) => widgetConfigs.value[w.id]?.visible !== false)
    .map((w) => ({
      ...w,
      config: widgetConfigs.value[w.id] || {
        visible: w.defaultVisible,
        order: w.defaultOrder,
        size: w.defaultSize,
      },
    }))
    .sort((a, b) => a.config.order - b.config.order);
});

const getStatsForWidget = (widgetId: string) => {
  if (!statistics.value) return null;

  switch (widgetId) {
    case 'task-stats':
      return statistics.value.taskStats;
    case 'goal-stats':
      return statistics.value.goalStats;
    case 'reminder-stats':
      return statistics.value.reminderStats;
    case 'schedule-stats':
      return statistics.value.scheduleStats;
    default:
      return null;
  }
};

onMounted(async () => {
  await Promise.all([fetchStatistics(), loadConfig()]);
});
</script>
```

### 6.2 useDashboardStatistics Composable

```typescript
// apps/web/src/modules/dashboard/presentation/composables/useDashboardStatistics.ts
import { ref, Ref } from 'vue';
import { dashboardApi } from '@/api';
import type { DashboardStatisticsDTO } from '@dailyuse/contracts';

export function useDashboardStatistics() {
  const statistics: Ref<DashboardStatisticsDTO | null> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStatistics = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await dashboardApi.getStatistics();
      statistics.value = response.data;
    } catch (err) {
      error.value = '加载统计数据失败，请稍后重试';
      console.error('[useDashboardStatistics] Fetch failed:', err);
    } finally {
      loading.value = false;
    }
  };

  const retry = () => {
    fetchStatistics();
  };

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    retry,
  };
}
```

---

## 7. 测试策略

### 7.1 单元测试

```typescript
// DashboardStatisticsAggregateService 单元测试
describe('DashboardStatisticsAggregateService', () => {
  let service: DashboardStatisticsAggregateService;
  let mockTaskRepo: jest.Mocked<TaskStatisticsRepository>;
  let mockCacheService: jest.Mocked<StatisticsCacheService>;

  beforeEach(() => {
    mockTaskRepo = createMockTaskRepo();
    mockCacheService = createMockCacheService();

    service = new DashboardStatisticsAggregateService(
      mockTaskRepo,
      mockGoalRepo,
      mockReminderRepo,
      mockScheduleRepo,
      mockCacheService,
      mockLogger,
    );
  });

  it('should return cached data if available', async () => {
    const cachedData = createMockDashboardStats();
    mockCacheService.get.mockResolvedValue(cachedData);

    const result = await service.aggregateStatistics('user-123');

    expect(result).toEqual(cachedData);
    expect(result.cacheHit).toBe(true);
    expect(mockTaskRepo.findByAccountUuid).not.toHaveBeenCalled();
  });

  it('should query database and cache result on cache miss', async () => {
    mockCacheService.get.mockResolvedValue(null);
    mockTaskRepo.findByAccountUuid.mockResolvedValue(createMockTaskStats());

    const result = await service.aggregateStatistics('user-123');

    expect(result.cacheHit).toBe(false);
    expect(mockCacheService.set).toHaveBeenCalledWith('user-123', result, 300);
  });
});
```

### 7.2 集成测试

```typescript
// Dashboard API 集成测试
describe('Dashboard API Integration', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should return dashboard statistics for authenticated user', async () => {
    const token = await getTestToken('user-123');

    const response = await request(app)
      .get('/api/dashboard/statistics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary');
    expect(response.body.summary).toHaveProperty('totalTasks');
  });
});
```

### 7.3 E2E 测试

```typescript
// Playwright E2E 测试
test('Dashboard loads and displays widgets', async ({ page }) => {
  await page.goto('/dashboard');

  // 等待骨架屏消失
  await page.waitForSelector('.dashboard-skeleton', { state: 'hidden' });

  // 检查 Widget 是否渲染
  await expect(page.locator('.task-stats-widget')).toBeVisible();
  await expect(page.locator('.goal-stats-widget')).toBeVisible();

  // 检查统计数据
  const taskCount = await page.locator('.task-stats-widget .stat-value').textContent();
  expect(Number(taskCount)).toBeGreaterThan(0);
});
```

---

## 8. 监控与日志

### 8.1 性能监控

```typescript
// 监控指标
const metrics = {
  'dashboard.api.latency': histogram(), // API 响应时间
  'dashboard.cache.hit_rate': gauge(), // 缓存命中率
  'dashboard.db.query_time': histogram(), // 数据库查询时间
  'dashboard.aggregation_time': histogram(), // 聚合耗时
};

// 在 AggregateService 中埋点
async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
  const startTime = Date.now();

  // ... 业务逻辑

  metrics['dashboard.aggregation_time'].observe(Date.now() - startTime);
}
```

### 8.2 日志规范

```typescript
// 结构化日志
logger.info('[Dashboard] Statistics aggregated', {
  accountUuid,
  cacheHit: false,
  queryTime: 87,
  totalTasks: 45,
  totalGoals: 12,
});

logger.warn('[Dashboard] Cache miss rate high', {
  accountUuid,
  missRate: 0.35,
  threshold: 0.05,
});

logger.error('[Dashboard] Failed to aggregate statistics', {
  accountUuid,
  error: error.message,
  stack: error.stack,
});
```

---

## 9. 部署与配置

### 9.1 环境变量

```bash
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
DASHBOARD_CACHE_TTL=300 # 5分钟

# 性能配置
DASHBOARD_QUERY_TIMEOUT=5000 # 5秒超时
DASHBOARD_MAX_CONCURRENT_QUERIES=10
```

### 9.2 Docker Compose

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data

  api:
    build: ./apps/api
    environment:
      - REDIS_HOST=redis
      - DASHBOARD_CACHE_TTL=300
    depends_on:
      - redis
```

---

**文档状态**: ✅ 已完成  
**审核状态**: ⏳ 待 PO 和 SM 审核  
**最后更新**: 2025-11-12
