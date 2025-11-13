# Dashboard Sprint Planning v2.0

**文档版本**: v2.0 ✅ **基于现有代码重新规划**  
**创建日期**: 2025-11-12  
**Scrum Master**: Bmad Master Agent - SM  
**项目**: DailyUse Dashboard 完善

---

## ⚠️ **重要变更说明（v2.0）**

### 与 v1.0 的主要差异

| 维度              | v1.0（旧）           | v2.0（新）     | 变更原因                          |
| ----------------- | -------------------- | -------------- | --------------------------------- |
| **总工作量**      | 130 SP               | 85 SP          | 移除冗余任务（Statistics 已存在） |
| **Sprint 数量**   | 4 个                 | 4 个           | 保持不变                          |
| **Sprint 1 任务** | 创建 Statistics 服务 | 创建聚合层服务 | 利用现有聚合根                    |
| **开发周期**      | 12 周                | 10 周          | 减少 2 周                         |
| **风险等级**      | 中高                 | 低中           | 代码重用降低风险                  |

### 已删除的冗余任务

以下任务在 v1.0 中存在，但因**代码库已实现**而删除：

- ❌ Task 1.1.2: 实现 TaskStatisticsService（**TaskStatistics 聚合根已存在**）
- ❌ Task 1.1.3: 实现 GoalStatisticsService（**GoalStatistics 聚合根已存在**）
- ❌ Task 1.1.4: 实现 ReminderStatisticsService（**ReminderStatistics 聚合根已存在**）
- ❌ Task 1.1.5: 实现 ScheduleStatisticsService（**ScheduleStatistics 聚合根已存在**）
- ❌ Task 1.2.1: 定义统计数据表结构（**Prisma Schema 已完善**）
- ❌ Task 1.2.3: 实现 recalculate() 逻辑（**所有聚合根已实现**）

**累计节省：45 SP**

---

## 1. Sprint 概览

### 1.1 Sprint 分布

| Sprint       | 主题              | 工作量    | 周期      | 状态      |
| ------------ | ----------------- | --------- | --------- | --------- |
| **Sprint 1** | 核心聚合层 + 缓存 | 25 SP     | 3 周      | 📋 待开始 |
| **Sprint 2** | Widget 系统       | 25 SP     | 3 周      | 📋 待开始 |
| **Sprint 3** | 用户体验优化      | 20 SP     | 2 周      | 📋 待开始 |
| **Sprint 4** | 测试与发布        | 15 SP     | 2 周      | 📋 待开始 |
| **总计**     | -                 | **85 SP** | **10 周** | -         |

### 1.2 团队速率（Velocity）

- **预估速率**: 8-10 SP/周
- **团队规模**: 2 名开发 + 1 名 QA
- **每个 Sprint**: 20-25 SP

---

## 2. Sprint 1: 核心聚合层 + 缓存（25 SP）

**Sprint 目标**: 实现 Dashboard 统计数据聚合与 Redis 缓存层

**时间**: 第 1-3 周  
**优先级**: P0（最高）

### 2.1 User Story 1.1: 实现 Dashboard 统计聚合服务

**Story Point**: 12 SP

**验收标准**:

- ✅ 创建 `DashboardStatisticsAggregateService` 类
- ✅ 并行查询 4 个模块的 Statistics 聚合根
- ✅ 聚合数据符合 `DashboardStatisticsDTO` 接口
- ✅ 总体完成率计算正确
- ✅ 响应时间 ≤ 100ms（无缓存）

**任务拆分**:

#### Task 1.1.1: 定义 DashboardStatisticsDTO 接口（2 SP）

**负责人**: Backend Dev  
**依赖**: 现有 Statistics Contracts

**实施步骤**:

1. 在 `packages/contracts/src/dashboard/` 创建接口文件
2. 定义聚合数据结构：

```typescript
// packages/contracts/src/dashboard/DashboardStatisticsContracts.ts
export interface DashboardStatisticsDTO {
  accountUuid: string;
  summary: {
    totalTasks: number;
    totalGoals: number;
    totalReminders: number;
    totalScheduleTasks: number;
    overallCompletionRate: number;
  };
  taskStats: TaskStatisticsClientDTO;
  goalStats: GoalStatisticsClientDTO;
  reminderStats: ReminderStatisticsClientDTO;
  scheduleStats: ScheduleStatisticsClientDTO;
  calculatedAt: number;
  cacheHit: boolean;
}
```

3. 导出到 `@dailyuse/contracts` 包
4. 编写单元测试

**完成标准**:

- ✅ TypeScript 类型检查通过
- ✅ 接口文档生成完成

---

#### Task 1.1.2: 实现 DashboardStatisticsAggregateService（8 SP）

**负责人**: Backend Dev  
**依赖**: Task 1.1.1, 现有 Statistics Repositories

**实施步骤**:

1. 创建服务类：

```typescript
// apps/api/src/dashboard/services/DashboardStatisticsAggregateService.ts
export class DashboardStatisticsAggregateService {
  constructor(
    private taskStatsRepo: TaskStatisticsRepository,
    private goalStatsRepo: GoalStatisticsRepository,
    private reminderStatsRepo: ReminderStatisticsRepository,
    private scheduleStatsRepo: ScheduleStatisticsRepository,
  ) {}

  async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
    // 1. 并行查询所有 Statistics
    const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
      this.taskStatsRepo.findByAccountUuid(accountUuid),
      this.goalStatsRepo.findByAccountUuid(accountUuid),
      this.reminderStatsRepo.findByAccountUuid(accountUuid),
      this.scheduleStatsRepo.findByAccountUuid(accountUuid),
    ]);

    // 2. 处理缺失数据（创建默认 Statistics）
    const task = taskStats ?? TaskStatistics.createDefault(accountUuid);
    const goal = goalStats ?? GoalStatistics.createDefault(accountUuid);
    const reminder = reminderStats ?? ReminderStatistics.create({ accountUuid });
    const schedule = scheduleStats ?? ScheduleStatistics.createEmpty(accountUuid);

    // 3. 计算汇总数据
    const summary = {
      totalTasks: task.totalTasks,
      totalGoals: goal.totalGoals,
      totalReminders: reminder.templateStats.totalTemplates,
      totalScheduleTasks: schedule.totalTasks,
      overallCompletionRate: this.calculateOverallCompletionRate(task, goal),
    };

    // 4. 返回聚合数据
    return {
      accountUuid,
      summary,
      taskStats: task.toClientDTO(),
      goalStats: goal.toClientDTO(),
      reminderStats: reminder.toClientDTO(),
      scheduleStats: schedule.toClientDTO(),
      calculatedAt: Date.now(),
      cacheHit: false,
    };
  }

  private calculateOverallCompletionRate(
    taskStats: TaskStatistics,
    goalStats: GoalStatistics,
  ): number {
    const taskRate = taskStats.getTodayCompletionRate();
    const goalRate = goalStats.getCompletionRate();
    return (taskRate + goalRate) / 2;
  }
}
```

2. 注册服务到 DI 容器（如果有）或导出单例
3. 编写单元测试（Mock Repositories）
4. 编写集成测试（使用测试数据库）

**完成标准**:

- ✅ 单元测试覆盖率 ≥ 90%
- ✅ 集成测试通过
- ✅ 性能测试：响应时间 ≤ 100ms

---

#### Task 1.1.3: 编写单元测试与集成测试（2 SP）

**负责人**: QA + Backend Dev  
**依赖**: Task 1.1.2

**测试用例**:

```typescript
// apps/api/src/dashboard/services/__tests__/DashboardStatisticsAggregateService.test.ts
describe('DashboardStatisticsAggregateService', () => {
  it('should aggregate statistics from all modules', async () => {
    // Arrange
    const service = new DashboardStatisticsAggregateService(
      mockTaskStatsRepo,
      mockGoalStatsRepo,
      mockReminderStatsRepo,
      mockScheduleStatsRepo,
    );

    // Act
    const result = await service.aggregateStatistics('user-123');

    // Assert
    expect(result.summary.totalTasks).toBe(45);
    expect(result.summary.totalGoals).toBe(12);
    expect(result.taskStats).toBeDefined();
    expect(result.calculatedAt).toBeGreaterThan(0);
  });

  it('should handle missing statistics gracefully', async () => {
    // 测试当某个模块的 Statistics 不存在时，创建默认值
  });

  it('should calculate overall completion rate correctly', async () => {
    // 测试完成率计算逻辑
  });
});
```

**完成标准**:

- ✅ 测试覆盖率 ≥ 90%
- ✅ 所有测试通过

---

### 2.2 User Story 1.2: 实现 Redis 缓存层

**Story Point**: 8 SP

**验收标准**:

- ✅ Redis 缓存读写功能正常
- ✅ TTL 设置为 5 分钟
- ✅ 支持主动失效（事件驱动）
- ✅ 缓存命中率 ≥ 95%

**任务拆分**:

#### Task 1.2.1: 实现 StatisticsCacheService（5 SP）

**负责人**: Backend Dev  
**依赖**: Redis 已部署

**实施步骤**:

```typescript
// packages/utils/src/cache/StatisticsCacheService.ts
import Redis from 'ioredis';

export class StatisticsCacheService {
  private readonly CACHE_KEY_PREFIX = 'dashboard:stats:';
  private readonly DEFAULT_TTL = 300; // 5分钟

  constructor(private redis: Redis) {}

  async get(accountUuid: string): Promise<DashboardStatisticsDTO | null> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    const cached = await this.redis.get(key);

    if (!cached) return null;

    const data = JSON.parse(cached);
    data.cacheHit = true;
    return data;
  }

  async set(
    accountUuid: string,
    data: DashboardStatisticsDTO,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
  }

  async invalidate(accountUuid: string): Promise<void> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    await this.redis.del(key);
  }

  async exists(accountUuid: string): Promise<boolean> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    return (await this.redis.exists(key)) === 1;
  }
}
```

**完成标准**:

- ✅ Redis 连接正常
- ✅ 缓存读写功能测试通过
- ✅ TTL 生效

---

#### Task 1.2.2: 集成缓存到 AggregateService（2 SP）

**负责人**: Backend Dev  
**依赖**: Task 1.1.2, Task 1.2.1

**修改代码**:

```typescript
export class DashboardStatisticsAggregateService {
  constructor(
    // ... repositories
    private cacheService: StatisticsCacheService,
  ) {}

  async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
    // 1. 尝试从缓存读取
    const cached = await this.cacheService.get(accountUuid);
    if (cached) {
      console.log(`[Cache Hit] accountUuid=${accountUuid}`);
      return cached;
    }

    // 2. 查询数据库 + 聚合
    const stats = await this.aggregateFromDatabase(accountUuid);

    // 3. 写入缓存
    await this.cacheService.set(accountUuid, stats);

    return stats;
  }
}
```

**完成标准**:

- ✅ 缓存逻辑生效
- ✅ 日志输出缓存命中情况

---

#### Task 1.2.3: 实现事件驱动缓存失效（1 SP）

**负责人**: Backend Dev  
**依赖**: 现有事件系统

**实施步骤**:

```typescript
// apps/api/src/dashboard/listeners/StatisticsCacheInvalidationListener.ts
export class StatisticsCacheInvalidationListener {
  constructor(
    private eventBus: EventBus,
    private cacheService: StatisticsCacheService,
  ) {
    this.registerListeners();
  }

  private registerListeners(): void {
    // 监听 TaskStatistics 更新
    this.eventBus.on('task.statistics.updated', async (event) => {
      await this.cacheService.invalidate(event.accountUuid);
    });

    // 监听 GoalStatistics 更新
    this.eventBus.on('goal_statistics.recalculated', async (event) => {
      await this.cacheService.invalidate(event.accountUuid);
    });

    // 监听 ReminderStatistics 更新
    this.eventBus.on('ReminderStatisticsUpdated', async (event) => {
      await this.cacheService.invalidate(event.accountUuid);
    });

    // 监听 ScheduleStatistics 更新
    this.eventBus.on('ScheduleStatisticsExecutionRecorded', async (event) => {
      await this.cacheService.invalidate(event.accountUuid);
    });
  }
}
```

**完成标准**:

- ✅ 统计更新后缓存自动失效
- ✅ 日志记录缓存失效事件

---

### 2.3 User Story 1.3: 创建 Dashboard API 接口

**Story Point**: 5 SP

**验收标准**:

- ✅ API 端点 `GET /api/dashboard/statistics` 可用
- ✅ 支持 JWT 鉴权
- ✅ 返回完整的 Dashboard 统计数据
- ✅ 响应时间 ≤ 100ms（缓存命中）

**任务拆分**:

#### Task 1.3.1: 定义 API 路由（2 SP）

**负责人**: Backend Dev  
**依赖**: Task 1.1.2, Task 1.2.2

```typescript
// apps/api/src/dashboard/routes/dashboard.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const accountUuid = req.user.accountUuid;

    const stats = await dashboardStatisticsAggregateService.aggregateStatistics(accountUuid);

    res.json(stats);
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**完成标准**:

- ✅ 路由注册成功
- ✅ 鉴权中间件生效

---

#### Task 1.3.2: 编写 API 文档（1 SP）

**负责人**: Backend Dev

**Swagger 文档**:

```yaml
/api/dashboard/statistics:
  get:
    summary: 获取 Dashboard 统计数据
    tags:
      - Dashboard
    security:
      - bearerAuth: []
    responses:
      200:
        description: 成功返回统计数据
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DashboardStatisticsDTO'
      401:
        description: 未授权
      500:
        description: 服务器错误
```

---

#### Task 1.3.3: E2E 测试（2 SP）

**负责人**: QA

```typescript
// apps/api/src/dashboard/__tests__/dashboard.e2e.test.ts
describe('Dashboard API E2E', () => {
  it('should return dashboard statistics with valid token', async () => {
    const response = await request(app)
      .get('/api/dashboard/statistics')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('taskStats');
    expect(response.body.cacheHit).toBeDefined();
  });

  it('should return 401 without token', async () => {
    const response = await request(app).get('/api/dashboard/statistics');
    expect(response.status).toBe(401);
  });
});
```

**完成标准**:

- ✅ 所有 E2E 测试通过

---

### Sprint 1 交付物

- ✅ `DashboardStatisticsAggregateService` 类
- ✅ `StatisticsCacheService` 类
- ✅ `GET /api/dashboard/statistics` API 接口
- ✅ 单元测试（覆盖率 ≥ 90%）
- ✅ 集成测试
- ✅ E2E 测试
- ✅ API 文档

**Sprint 1 Review**: 演示 Dashboard API 返回聚合统计数据，展示缓存命中情况

---

## 3. Sprint 2: Widget 系统（25 SP）

**Sprint 目标**: 实现模块化 Widget 组件和注册系统

**时间**: 第 4-6 周  
**优先级**: P1（高）

### 3.1 User Story 2.1: 实现 WidgetRegistry 系统

**Story Point**: 10 SP

**验收标准**:

- ✅ Widget 注册机制可用
- ✅ Widget 配置管理（显示/隐藏、顺序、尺寸）
- ✅ Widget 配置持久化

**任务拆分**:

#### Task 2.1.1: 实现 WidgetRegistry 类（4 SP）

```typescript
// apps/web/src/modules/dashboard/infrastructure/WidgetRegistry.ts
interface WidgetConfig {
  id: string;
  name: string;
  component: Component;
  defaultSize: 'small' | 'medium' | 'large';
  defaultOrder: number;
  defaultVisible: boolean;
  icon?: string;
}

class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets = new Map<string, WidgetConfig>();

  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  register(config: WidgetConfig): void {
    if (this.widgets.has(config.id)) {
      console.warn(`Widget ${config.id} already registered`);
      return;
    }
    this.widgets.set(config.id, config);
  }

  getWidget(id: string): WidgetConfig | undefined {
    return this.widgets.get(id);
  }

  getAllWidgets(): WidgetConfig[] {
    return Array.from(this.widgets.values()).sort((a, b) => a.defaultOrder - b.defaultOrder);
  }
}

export const widgetRegistry = WidgetRegistry.getInstance();
```

---

#### Task 2.1.2: 实现 Widget 配置管理（4 SP）

```typescript
// apps/web/src/modules/dashboard/stores/widgetConfigStore.ts
import { defineStore } from 'pinia';

export const useWidgetConfigStore = defineStore('widgetConfig', {
  state: () => ({
    configs: {} as Record<
      string,
      {
        visible: boolean;
        order: number;
        size: 'small' | 'medium' | 'large';
      }
    >,
  }),

  actions: {
    async loadConfig() {
      const response = await api.get('/api/dashboard/widget-config');
      this.configs = response.data;
    },

    async saveConfig() {
      await api.put('/api/dashboard/widget-config', { configs: this.configs });
    },

    toggleVisibility(widgetId: string) {
      if (!this.configs[widgetId]) return;
      this.configs[widgetId].visible = !this.configs[widgetId].visible;
      this.saveConfig();
    },
  },
});
```

---

#### Task 2.1.3: 后端 Widget 配置 API（2 SP）

```typescript
// apps/api/src/dashboard/routes/widget-config.routes.ts
router.get('/widget-config', authMiddleware, async (req, res) => {
  const accountUuid = req.user.accountUuid;
  const config = await widgetConfigService.getConfig(accountUuid);
  res.json(config);
});

router.put('/widget-config', authMiddleware, async (req, res) => {
  const accountUuid = req.user.accountUuid;
  await widgetConfigService.saveConfig(accountUuid, req.body.configs);
  res.json({ success: true });
});
```

---

### 3.2 User Story 2.2: 实现 4 个 Widget 组件

**Story Point**: 15 SP（每个 Widget 约 3-4 SP）

#### Task 2.2.1: TaskStatsWidget（4 SP）

```vue
<!-- apps/web/src/modules/dashboard/presentation/components/TaskStatsWidget.vue -->
<template>
  <v-card class="task-stats-widget">
    <v-card-title>
      <v-icon left>mdi-checkbox-marked-circle</v-icon>
      任务统计
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="6">
          <StatItem
            :value="stats.instanceStats.todayInstances"
            label="今日任务"
            icon="mdi-calendar-today"
          />
        </v-col>
        <v-col cols="6">
          <StatItem
            :value="`${todayCompletionRate}%`"
            label="完成率"
            icon="mdi-chart-line"
            :trend="trend"
          />
        </v-col>
      </v-row>
      <v-divider class="my-4" />
      <v-progress-linear :model-value="todayCompletionRate" color="primary" height="8" rounded />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskStatisticsClientDTO } from '@dailyuse/contracts';

const props = defineProps<{
  stats: TaskStatisticsClientDTO;
}>();

const todayCompletionRate = computed(() => {
  const { todayInstances, completedInstances } = props.stats.instanceStats;
  return todayInstances > 0 ? Math.round((completedInstances / todayInstances) * 100) : 0;
});

const trend = computed(() => {
  // 获取周完成率对比
  const weekRate = props.stats.completionStats.completionRate;
  return todayCompletionRate.value > weekRate ? 'UP' : 'DOWN';
});
</script>
```

---

#### Task 2.2.2: GoalStatsWidget（4 SP）

#### Task 2.2.3: ReminderStatsWidget（4 SP）

#### Task 2.2.4: ScheduleStatsWidget（3 SP）

（实现方式类似，展示各自模块的关键指标）

---

### Sprint 2 交付物

- ✅ WidgetRegistry 系统
- ✅ 4 个 Widget 组件
- ✅ Widget 配置管理
- ✅ Widget 配置持久化 API
- ✅ 组件单元测试

**Sprint 2 Review**: 演示 Widget 系统，展示动态注册和配置功能

---

## 4. Sprint 3: 用户体验优化（20 SP）

**Sprint 目标**: Skeleton 加载屏、错误处理、性能优化

**时间**: 第 7-8 周  
**优先级**: P2（中）

---

### 4.1 User Story 3.1: Skeleton 加载屏（5 SP）

**验收标准**:

- ✅ Dashboard 加载时显示骨架屏
- ✅ 骨架屏样式与实际内容一致
- ✅ 加载完成后平滑过渡

**任务拆分**:

#### Task 3.1.1: 设计 Skeleton 组件（2 SP）

**负责人**: Frontend Dev

```vue
<!-- apps/web/src/modules/dashboard/components/DashboardSkeleton.vue -->
<template>
  <div class="dashboard-skeleton">
    <v-row>
      <v-col v-for="i in 4" :key="i" cols="12" md="6">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>
  </div>
</template>
```

**完成标准**:

- ✅ 4 个 Widget 骨架屏组件
- ✅ 响应式布局

---

#### Task 3.1.2: 集成加载状态（2 SP）

**负责人**: Frontend Dev

```typescript
// apps/web/src/modules/dashboard/views/DashboardView.vue
const { data, isLoading } = useDashboardStatistics();
```

```vue
<template>
  <DashboardSkeleton v-if="isLoading" />
  <DashboardContent v-else :data="data" />
</template>
```

---

#### Task 3.1.3: 测试加载体验（1 SP）

**负责人**: QA

- ✅ 模拟慢速网络测试
- ✅ 骨架屏与实际内容对比

---

### 4.2 User Story 3.2: 加载状态管理（5 SP）

**验收标准**:

- ✅ 加载中、成功、失败三种状态清晰
- ✅ 状态切换平滑
- ✅ 支持局部加载（单个 Widget）

**任务拆分**:

#### Task 3.2.1: 实现状态机（3 SP）

**负责人**: Frontend Dev

```typescript
// apps/web/src/modules/dashboard/stores/loadingStateStore.ts
export const useLoadingStateStore = defineStore('loadingState', {
  state: () => ({
    globalState: 'idle' as 'idle' | 'loading' | 'success' | 'error',
    widgetStates: {} as Record<string, 'loading' | 'success' | 'error'>,
  }),

  actions: {
    setGlobalState(state: 'idle' | 'loading' | 'success' | 'error') {
      this.globalState = state;
    },

    setWidgetState(widgetId: string, state: 'loading' | 'success' | 'error') {
      this.widgetStates[widgetId] = state;
    },
  },
});
```

---

#### Task 3.2.2: Widget 级别加载（2 SP）

**负责人**: Frontend Dev

```vue
<!-- 单个 Widget 可独立加载 -->
<template>
  <v-card>
    <v-progress-circular v-if="isLoading" />
    <WidgetContent v-else :data="data" />
  </v-card>
</template>
```

---

### 4.3 User Story 3.3: 错误处理与重试（5 SP）

**验收标准**:

- ✅ 显示清晰的错误消息
- ✅ 提供重试按钮
- ✅ 错误日志上报到 Sentry
- ✅ 优雅降级（部分模块失败不影响其他模块）

**任务拆分**:

#### Task 3.3.1: 实现错误边界组件（2 SP）

**负责人**: Frontend Dev

```vue
<!-- apps/web/src/modules/dashboard/components/DashboardErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-container">
    <v-icon color="error" size="48">mdi-alert-circle</v-icon>
    <h3>{{ getErrorMessage(error) }}</h3>

    <v-btn color="primary" @click="handleRetry">
      <v-icon left>mdi-refresh</v-icon>
      重试
    </v-btn>

    <p class="error-id">错误ID: {{ errorId }}</p>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import * as Sentry from '@sentry/vue';

const props = defineProps<{ error: Error | null }>();
const errorId = ref('');

watch(
  () => props.error,
  (err) => {
    if (err) {
      const eventId = Sentry.captureException(err, {
        tags: { module: 'dashboard' },
      });
      errorId.value = eventId;
    }
  },
);

function getErrorMessage(error: Error) {
  if (error.message.includes('timeout')) {
    return '网络连接超时，请检查网络后重试';
  } else if (error.message.includes('401')) {
    return '登录已过期，请重新登录';
  } else if (error.message.includes('500')) {
    return '服务暂时不可用，我们正在修复中';
  }
  return '加载失败，请重试';
}
</script>
```

---

#### Task 3.3.2: 实现自动重试逻辑（2 SP）

**负责人**: Frontend Dev

```typescript
// apps/web/src/modules/dashboard/composables/useDashboardStatistics.ts
export function useDashboardStatistics() {
  const MAX_RETRY = 3;
  const RETRY_DELAY = 2000;

  const loadWithRetry = async (retryCount = 0): Promise<DashboardStatisticsDTO> => {
    try {
      return await dashboardApi.getStatistics();
    } catch (error) {
      if (retryCount < MAX_RETRY) {
        console.warn(`Retry ${retryCount + 1}/${MAX_RETRY}...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return loadWithRetry(retryCount + 1);
      }
      throw error;
    }
  };

  return { loadWithRetry };
}
```

---

#### Task 3.3.3: 测试错误场景（1 SP）

**负责人**: QA

- ✅ 模拟网络超时
- ✅ 模拟 401/500 错误
- ✅ 验证自动重试
- ✅ 验证 Sentry 日志上报

---

### 4.4 User Story 3.4: 性能优化（5 SP）

**验收标准**:

- ✅ Dashboard 加载时间 ≤ 0.5s（缓存命中）
- ✅ 首次渲染时间 ≤ 1s
- ✅ Lighthouse 性能分数 ≥ 90

**任务拆分**:

#### Task 3.4.1: 并行加载优化（2 SP）

**负责人**: Backend Dev

```typescript
// 已在 Sprint 1 实现（DashboardStatisticsAggregateService 使用 Promise.all）
// 本任务验证并发查询效果
```

---

#### Task 3.4.2: 前端性能优化（2 SP）

**负责人**: Frontend Dev

```typescript
// 1. 懒加载 Widget 组件
const TaskStatsWidget = defineAsyncComponent(() => import('./widgets/TaskStatsWidget.vue'));

// 2. 虚拟滚动（如果 Widget 数量多）
import { useVirtualList } from '@vueuse/core';

// 3. 防抖/节流
import { useDebounceFn } from '@vueuse/core';
const debouncedRefresh = useDebounceFn(refreshStatistics, 1000);
```

---

#### Task 3.4.3: 性能监控（1 SP）

**负责人**: DevOps

```typescript
// 集成 Performance API
performance.mark('dashboard-start');
// ... 加载逻辑
performance.mark('dashboard-end');
performance.measure('dashboard-load', 'dashboard-start', 'dashboard-end');

// 上报到监控系统
const metrics = performance.getEntriesByName('dashboard-load');
analytics.track('dashboard_performance', { duration: metrics[0].duration });
```

---

### Sprint 3 交付物

- ✅ DashboardSkeleton 组件
- ✅ LoadingStateStore 状态管理
- ✅ DashboardErrorBoundary 组件
- ✅ 自动重试逻辑（最多 3 次）
- ✅ Sentry 错误上报集成
- ✅ 性能优化（并行加载、懒加载、虚拟滚动）
- ✅ 性能监控集成

**Sprint 3 Review**: 演示加载体验、错误处理、性能指标

---

## 5. Sprint 4: 测试与发布（15 SP）

**Sprint 目标**: 完整测试、文档、生产部署

**时间**: 第 9-10 周  
**优先级**: P0（最高）

---

### 5.1 User Story 4.1: 性能测试（5 SP）

**验收标准**:

- ✅ 缓存命中率 ≥ 95%
- ✅ Dashboard 加载时间 ≤ 0.5s（缓存命中）
- ✅ 并发 100 用户无性能退化

**任务拆分**:

#### Task 4.1.1: 编写性能测试脚本（2 SP）

**负责人**: QA

```typescript
// apps/api/src/dashboard/__tests__/performance.test.ts
import { performance } from 'perf_hooks';

describe('Dashboard Performance', () => {
  it('should load statistics within 500ms (cache hit)', async () => {
    const start = performance.now();

    await request(app).get('/api/dashboard/statistics').set('Authorization', `Bearer ${token}`);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100)
      .fill(null)
      .map(() =>
        request(app).get('/api/dashboard/statistics').set('Authorization', `Bearer ${token}`),
      );

    const start = performance.now();
    await Promise.all(requests);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(5000); // 平均 50ms/请求
  });
});
```

---

#### Task 4.1.2: 缓存命中率测试（2 SP）

**负责人**: Backend Dev

```typescript
// 监控 Redis 缓存命中率
const cacheStats = {
  hits: 0,
  misses: 0,
  hitRate: () => cacheStats.hits / (cacheStats.hits + cacheStats.misses),
};

// 测试 1000 次请求
for (let i = 0; i < 1000; i++) {
  const cached = await redis.get(key);
  if (cached) cacheStats.hits++;
  else cacheStats.misses++;
}

expect(cacheStats.hitRate()).toBeGreaterThan(0.95);
```

---

#### Task 4.1.3: 生成性能报告（1 SP）

**负责人**: QA

- ✅ Lighthouse 报告
- ✅ 性能指标汇总（LCP, FID, CLS）
- ✅ 缓存命中率报告

---

### 5.2 User Story 4.2: 用户验收测试（5 SP）

**验收标准**:

- ✅ PO 验收通过
- ✅ UAT 测试覆盖所有用户故事
- ✅ 无 P0/P1 Bug

**任务拆分**:

#### Task 4.2.1: 编写 UAT 测试用例（2 SP）

**负责人**: QA

| 用例 ID | 场景               | 步骤                       | 预期结果                         |
| ------- | ------------------ | -------------------------- | -------------------------------- |
| UAT-001 | 首次加载 Dashboard | 1. 登录 2. 访问 Dashboard  | 显示所有 Widget，加载时间 ≤ 0.5s |
| UAT-002 | 缓存命中           | 1. 刷新页面                | 立即显示数据（cacheHit=true）    |
| UAT-003 | 错误处理           | 1. 断网 2. 访问 Dashboard  | 显示错误提示 + 重试按钮          |
| UAT-004 | Widget 配置        | 1. 隐藏某个 Widget 2. 刷新 | Widget 保持隐藏状态              |

---

#### Task 4.2.2: 执行 UAT 测试（2 SP）

**负责人**: QA + PO

- ✅ 逐个执行测试用例
- ✅ 记录 Bug（使用 Jira）
- ✅ 回归测试（修复后重新测试）

---

#### Task 4.2.3: PO 验收（1 SP）

**负责人**: PO

- ✅ 验证所有功能符合需求
- ✅ 验证性能指标达标
- ✅ 签署验收报告

---

### 5.3 User Story 4.3: 文档与部署（5 SP）

**验收标准**:

- ✅ API 文档更新
- ✅ 用户手册更新
- ✅ 生产环境部署成功

**任务拆分**:

#### Task 4.3.1: 更新 API 文档（2 SP）

**负责人**: Backend Dev

```yaml
# Swagger 文档更新
/api/dashboard/statistics:
  get:
    summary: 获取 Dashboard 统计数据
    tags: [Dashboard]
    security:
      - bearerAuth: []
    responses:
      200:
        description: 成功返回统计数据
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DashboardStatisticsDTO'
      400:
        description: 请求参数错误
      401:
        description: 未授权
      500:
        description: 服务器内部错误
```

---

#### Task 4.3.2: 编写用户手册（2 SP）

**负责人**: Tech Writer

**内容包括**:

- Dashboard 功能介绍
- Widget 配置指南
- 常见问题（FAQ）
- 故障排查

---

#### Task 4.3.3: 生产部署（1 SP）

**负责人**: DevOps

**部署步骤**:

1. 数据库迁移（Prisma migrate）
2. Redis 配置检查
3. 部署 API 服务（滚动更新）
4. 部署前端（CDN）
5. 健康检查
6. 监控告警配置

---

### Sprint 4 交付物

- ✅ 性能测试报告
- ✅ UAT 测试报告
- ✅ PO 验收报告
- ✅ API 文档（Swagger）
- ✅ 用户手册
- ✅ 生产环境部署完成
- ✅ 监控告警配置

**Sprint 4 Review**: 演示完整系统，展示性能指标，交付生产环境

---

## 6. Definition of Done（完成标准）

每个 User Story 必须满足：

- ✅ 代码审查通过（至少 1 人审查）
- ✅ 单元测试覆盖率 ≥ 90%
- ✅ 集成测试通过
- ✅ E2E 测试通过
- ✅ 性能测试达标
- ✅ 文档更新完成
- ✅ 部署到测试环境
- ✅ PO 验收通过

---

## 7. 风险缓解计划

| 风险                 | 缓解措施                  | 负责人                   | 状态      |
| -------------------- | ------------------------- | ------------------------ | --------- |
| Redis 缓存一致性问题 | 事件驱动失效 + TTL 兜底   | Backend Dev              | ⏳ 待实施 |
| Statistics 查询慢    | 数据库索引优化 + 并行查询 | DBA + Backend Dev        | ⏳ 待实施 |
| Widget 扩展性不足    | 预留扩展点 + 接口设计评审 | Frontend Dev + Architect | ⏳ 待实施 |

---

**文档状态**: ✅ 已完成  
**审核状态**: ⏳ 待 Tech Lead 审核  
**最后更新**: 2025-11-12
