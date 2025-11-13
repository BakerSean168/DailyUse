# Dashboard 功能产品需求文档（PRD）v2.0

**文档版本**: v2.0 ✅ **已基于现有代码重构**  
**创建日期**: 2025-11-12  
**修订日期**: 2025-11-12  
**产品经理**: Bmad Master Agent - PO  
**项目**: DailyUse Dashboard 完善

---

## ⚠️ **重要变更说明（v2.0）**

### 代码库现状发现

经过代码审查，发现以下**已实现**的基础设施：

✅ **Task/Goal/Reminder/Schedule Statistics 聚合根已存在**  
✅ **DDD 架构 + 事件驱动模式已成熟**  
✅ **Server/Client/Persistence DTO 分层已完善**  
✅ **recalculate() 和事件处理器已实现**  
✅ **统计数据计算逻辑完善**（分布统计、时间范围、完成率等）

### 本次修订重点

- ❌ **删除冗余需求**：不再创建已存在的 Statistics 服务
- 🎯 **聚焦缺失功能**：Dashboard 聚合层、Widget 系统、缓存层
- 📉 **降低工作量**：从 130 SP → 85 SP
- 🔧 **利用现有代码**：直接调用现有 Statistics 聚合根

---

## 1. 背景与目标

### 1.1 项目背景

DailyUse 是一个综合性的日常管理应用，目前已经实现了以下核心功能模块：

#### 已实现的 Statistics 基础设施

| 模块         | 聚合根               | 文件路径                                 | 核心功能                                         |
| ------------ | -------------------- | ---------------------------------------- | ------------------------------------------------ |
| **Task**     | `TaskStatistics`     | `domain-server/src/task/aggregates/`     | 模板统计、实例统计、完成统计、时间统计、分布统计 |
| **Goal**     | `GoalStatistics`     | `domain-server/src/goal/aggregates/`     | 目标统计、关键结果、进度追踪、分类统计、回顾统计 |
| **Reminder** | `ReminderStatistics` | `domain-server/src/reminder/aggregates/` | 模板统计、分组统计、触发统计、成功率             |
| **Schedule** | `ScheduleStatistics` | `domain-server/src/schedule/aggregates/` | 任务统计、执行统计、模块级统计、性能统计         |

**现有统计基础设施完善度：90%**

#### 当前 Dashboard 的缺失功能

1. ❌ **跨模块数据聚合**：各模块 Statistics 独立存在，无 Dashboard 级别汇总
2. ❌ **模块化 Widget 系统**：无法将统计数据展示为可复用组件
3. ❌ **缓存与性能优化**：每次查询都重算，无 Redis 缓存层
4. ❌ **用户体验提升**：无骨架屏、无加载状态、无自定义布局

### 1.2 业务目标

1. **提升用户体验**：通过模块化 Widget 和可定制布局，让用户快速获取关键信息
2. **提高性能**：通过 Redis 缓存层，减少 90% 的统计数据查询时间（从 500ms → 50ms）
3. **增强可扩展性**：Widget 注册机制支持未来新增模块（如习惯追踪、财务管理）
4. **降低开发成本**：**利用现有 Statistics 聚合根**，避免重复开发

### 1.3 成功指标

| 指标                | 基线（当前） | 目标（3个月后） | 衡量方式               |
| ------------------- | ------------ | --------------- | ---------------------- |
| Dashboard 加载时间  | 1.5s         | ≤ 0.5s          | Performance API        |
| Statistics 查询时间 | 500ms        | ≤ 50ms          | Redis 缓存命中率 ≥ 95% |
| Widget 可复用率     | 0%           | ≥ 80%           | 代码复用度分析         |
| 用户满意度          | -            | ≥ 4.5/5.0       | 用户问卷调查           |
| 跨模块统计支持      | 0%           | 100%            | 支持 4 个模块聚合      |

---

## 2. 功能需求

### 2.1 核心功能清单

#### ✅ 保留现有功能（无需重新开发）

| 功能               | 状态      | 文件路径                                                      | 主要方法                                    |
| ------------------ | --------- | ------------------------------------------------------------- | ------------------------------------------- |
| TaskStatistics     | ✅ 已完善 | `domain-server/src/task/aggregates/TaskStatistics.ts`         | `recalculate()`, `getTodayCompletionRate()` |
| GoalStatistics     | ✅ 已完善 | `domain-server/src/goal/aggregates/GoalStatistics.ts`         | `recalculate()`, `getCompletionRate()`      |
| ReminderStatistics | ✅ 已完善 | `domain-server/src/reminder/aggregates/ReminderStatistics.ts` | `recalculate()`, `getTodaySuccessRate()`    |
| ScheduleStatistics | ✅ 已完善 | `domain-server/src/schedule/aggregates/ScheduleStatistics.ts` | `recordExecution()`, `getModuleStats()`     |

#### 🆕 新增功能（本次实现）

| 优先级 | 功能                                | 说明                                                   | 工作量       |
| ------ | ----------------------------------- | ------------------------------------------------------ | ------------ |
| **P0** | DashboardStatisticsAggregateService | 聚合 4 个模块的 Statistics 数据                        | 20 SP        |
| **P0** | StatisticsCacheService（Redis）     | TTL 5分钟，支持失效刷新                                | 15 SP        |
| **P0** | Dashboard API 接口                  | `GET /api/dashboard/statistics`                        | 10 SP        |
| **P1** | WidgetRegistry 系统                 | Widget 注册、配置、发现                                | 15 SP        |
| **P1** | 模块化 Widget 组件                  | TaskWidget, GoalWidget, ReminderWidget, ScheduleWidget | 20 SP        |
| **P2** | Skeleton 加载屏                     | 骨架屏组件 + 加载状态机                                | 5 SP         |
| **P3** | 自定义布局（拖拽）                  | 布局持久化                                             | 0 SP（延后） |

**总工作量：85 SP**（4 个 Sprint，每个 Sprint 20-25 SP）

---

### 2.2 功能详细说明

#### 功能 1: DashboardStatisticsAggregateService ⭐ **P0**

**业务价值**：将 4 个模块的独立统计数据聚合为 Dashboard 全局视图

**功能描述**：

- 创建 `DashboardStatisticsAggregateService`（应用服务层）
- 并行查询现有的 `TaskStatistics`, `GoalStatistics`, `ReminderStatistics`, `ScheduleStatistics`
- 输出统一的 `DashboardStatisticsDTO`

**接口设计**：

```typescript
interface DashboardStatisticsDTO {
  accountUuid: string;

  // 汇总数据
  summary: {
    totalTasks: number;
    totalGoals: number;
    totalReminders: number;
    totalScheduleTasks: number;
    overallCompletionRate: number;
  };

  // 各模块详细统计
  taskStats: TaskStatisticsClientDTO;
  goalStats: GoalStatisticsClientDTO;
  reminderStats: ReminderStatisticsClientDTO;
  scheduleStats: ScheduleStatisticsClientDTO;

  // 元数据
  calculatedAt: number;
  cacheHit: boolean;
}
```

**技术实现**：

```typescript
// apps/api/src/dashboard/services/DashboardStatisticsAggregateService.ts
export class DashboardStatisticsAggregateService {
  constructor(
    private taskStatisticsRepository: TaskStatisticsRepository,
    private goalStatisticsRepository: GoalStatisticsRepository,
    private reminderStatisticsRepository: ReminderStatisticsRepository,
    private scheduleStatisticsRepository: ScheduleStatisticsRepository,
    private cacheService: StatisticsCacheService,
  ) {}

  async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
    // 1. 尝试从缓存读取
    const cached = await this.cacheService.get(accountUuid);
    if (cached) return cached;

    // 2. 并行查询各模块 Statistics
    const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
      this.taskStatisticsRepository.findByAccountUuid(accountUuid),
      this.goalStatisticsRepository.findByAccountUuid(accountUuid),
      this.reminderStatisticsRepository.findByAccountUuid(accountUuid),
      this.scheduleStatisticsRepository.findByAccountUuid(accountUuid),
    ]);

    // 3. 聚合数据
    const dashboardStats: DashboardStatisticsDTO = {
      accountUuid,
      summary: {
        totalTasks: taskStats.totalTasks,
        totalGoals: goalStats.totalGoals,
        totalReminders: reminderStats.templateStats.totalTemplates,
        totalScheduleTasks: scheduleStats.totalTasks,
        overallCompletionRate: this.calculateOverallCompletionRate(taskStats, goalStats),
      },
      taskStats: taskStats.toClientDTO(),
      goalStats: goalStats.toClientDTO(),
      reminderStats: reminderStats.toClientDTO(),
      scheduleStats: scheduleStats.toClientDTO(),
      calculatedAt: Date.now(),
      cacheHit: false,
    };

    // 4. 写入缓存
    await this.cacheService.set(accountUuid, dashboardStats, 300); // TTL 5分钟

    return dashboardStats;
  }
}
```

**验收标准**：

- ✅ 能够并行查询 4 个模块的 Statistics
- ✅ 聚合数据结构符合 `DashboardStatisticsDTO` 接口
- ✅ 总体完成率计算正确
- ✅ 响应时间 ≤ 100ms（无缓存）

---

#### 功能 2: StatisticsCacheService（Redis）⭐ **P0**

**业务价值**：减少 90% 的数据库查询，提升 Dashboard 加载速度

**功能描述**：

- 基于 Redis 实现统计数据缓存
- 支持 TTL 过期（默认 5 分钟）
- 支持主动失效（当统计数据更新时）

**技术实现**：

```typescript
// packages/utils/src/cache/StatisticsCacheService.ts
export class StatisticsCacheService {
  private readonly CACHE_KEY_PREFIX = 'dashboard:stats:';

  constructor(private redis: Redis) {}

  async get(accountUuid: string): Promise<DashboardStatisticsDTO | null> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    const cached = await this.redis.get(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    data.cacheHit = true;
    return data;
  }

  async set(accountUuid: string, data: DashboardStatisticsDTO, ttl: number = 300): Promise<void> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
  }

  async invalidate(accountUuid: string): Promise<void> {
    const key = `${this.CACHE_KEY_PREFIX}${accountUuid}`;
    await this.redis.del(key);
  }
}
```

**缓存失效策略**：

监听 Statistics 更新事件，主动失效缓存：

```typescript
// 监听 TaskStatistics 更新事件
eventBus.on('task.statistics.updated', async (event) => {
  await cacheService.invalidate(event.accountUuid);
});

// 监听 GoalStatistics 更新事件
eventBus.on('goal_statistics.recalculated', async (event) => {
  await cacheService.invalidate(event.accountUuid);
});

// ... 其他模块同理
```

**验收标准**：

- ✅ 缓存命中率 ≥ 95%
- ✅ 缓存查询时间 ≤ 10ms
- ✅ 统计数据更新后，缓存自动失效

---

#### 功能 3: Dashboard API 接口 ⭐ **P0**

**业务价值**：为前端提供统一的 Dashboard 数据查询接口

**接口定义**：

```
GET /api/dashboard/statistics
Authorization: Bearer <token>
```

**响应示例**：

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
    "totalTemplates": 30,
    "activeTemplates": 15,
    "instanceStats": { ... },
    "completionStats": { ... }
  },
  "goalStats": {
    "totalGoals": 12,
    "activeGoals": 8,
    "completedGoals": 4,
    "averageProgress": 62.3
  },
  "reminderStats": { ... },
  "scheduleStats": { ... },
  "calculatedAt": 1731398400000,
  "cacheHit": true
}
```

**实现代码**：

```typescript
// apps/api/src/dashboard/routes/dashboard.routes.ts
router.get('/statistics', authMiddleware, async (req, res) => {
  const accountUuid = req.user.accountUuid;

  const stats = await dashboardStatisticsAggregateService.aggregateStatistics(accountUuid);

  res.json(stats);
});
```

**验收标准**：

- ✅ 返回完整的 Dashboard 统计数据
- ✅ 支持 JWT 鉴权
- ✅ 响应时间 ≤ 100ms（缓存命中）

---

#### 功能 3.5: 错误处理与用户反馈 ⭐ **P0**

**业务价值**：提升系统可靠性和用户体验，确保在异常情况下用户能够得到清晰的反馈

**功能描述**：

- Dashboard 加载失败时显示友好的错误提示
- 提供重试机制（一键重试/自动重试）
- 错误日志上报到监控系统（Sentry）
- 优雅降级（部分模块失败不影响其他模块）

**用户故事**：

**作为** 用户  
**我想要** 当 Dashboard 加载失败时看到友好的错误提示  
**以便于** 了解问题并采取行动（重试或联系支持）

**场景示例**：

1. **网络超时**：
   - 显示："网络连接超时，请检查网络后重试"
   - 提供"重试"按钮
   - 自动重试 3 次（间隔 2s）

2. **服务器错误**：
   - 显示："服务暂时不可用，我们正在修复中"
   - 记录错误到 Sentry（包含 requestId）
   - 提供"联系支持"链接

3. **部分模块失败**：
   - 优雅降级：仅显示加载成功的模块
   - 失败模块显示："该模块加载失败，点击重试"

**技术实现**：

```typescript
// apps/web/src/modules/dashboard/composables/useDashboardStatistics.ts
export function useDashboardStatistics() {
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  const loadStatistics = async (retry = 3) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await dashboardApi.getStatistics();
      return response.data;
    } catch (e) {
      error.value = e as Error;

      // 记录错误到 Sentry
      Sentry.captureException(e, {
        tags: { module: 'dashboard' },
        extra: { retry, timestamp: Date.now() },
      });

      // 自动重试
      if (retry > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return loadStatistics(retry - 1);
      }

      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return { loadStatistics, error, isLoading };
}
```

**错误提示组件**：

```vue
<!-- apps/web/src/modules/dashboard/components/DashboardErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-container">
    <v-icon color="error" size="48">mdi-alert-circle</v-icon>
    <h3>{{ errorMessage }}</h3>
    <p class="error-details">{{ errorDetails }}</p>

    <div class="error-actions">
      <v-btn color="primary" @click="handleRetry">
        <v-icon left>mdi-refresh</v-icon>
        重试
      </v-btn>
      <v-btn variant="text" @click="handleSupport"> 联系支持 </v-btn>
    </div>

    <p class="error-id">错误ID: {{ errorId }}</p>
  </div>
</template>
```

**验收标准**：

- ✅ 显示清晰的错误消息（区分网络错误、服务器错误、权限错误）
- ✅ 提供重试按钮，点击可重新加载
- ✅ 自动重试机制（最多 3 次，间隔 2s）
- ✅ 错误日志上报到 Sentry（包含 requestId、timestamp、用户信息）
- ✅ 优雅降级：部分模块失败不影响其他模块显示
- ✅ 错误 ID 显示（便于用户反馈和问题追踪）

---

#### 功能 4: WidgetRegistry 系统 ⭐ **P1**

**业务价值**：支持动态注册 Widget，提升系统可扩展性

**功能描述**：

- Widget 注册表（支持运行时注册）
- Widget 配置管理（显示/隐藏、顺序、尺寸）
- Widget 发现机制

**技术实现**：

```typescript
// apps/web/src/modules/dashboard/infrastructure/WidgetRegistry.ts
interface WidgetConfig {
  id: string;
  name: string;
  component: Component;
  defaultSize: 'small' | 'medium' | 'large';
  defaultOrder: number;
  defaultVisible: boolean;
}

class WidgetRegistry {
  private widgets = new Map<string, WidgetConfig>();

  register(config: WidgetConfig): void {
    this.widgets.set(config.id, config);
  }

  getWidget(id: string): WidgetConfig | undefined {
    return this.widgets.get(id);
  }

  getAllWidgets(): WidgetConfig[] {
    return Array.from(this.widgets.values()).sort((a, b) => a.defaultOrder - b.defaultOrder);
  }
}

// 注册内置 Widgets
widgetRegistry.register({
  id: 'task-stats',
  name: '任务统计',
  component: TaskStatsWidget,
  defaultSize: 'medium',
  defaultOrder: 1,
  defaultVisible: true,
});

widgetRegistry.register({
  id: 'goal-stats',
  name: '目标统计',
  component: GoalStatsWidget,
  defaultSize: 'medium',
  defaultOrder: 2,
  defaultVisible: true,
});
```

**验收标准**：

- ✅ 支持运行时注册 Widget
- ✅ 支持 Widget 配置持久化
- ✅ 支持 Widget 显示/隐藏切换

---

#### 功能 5: 模块化 Widget 组件 ⭐ **P1**

**业务价值**：将统计数据展示为可复用、可配置的 UI 组件

**组件清单**：

| Widget                | 展示内容                     | 数据来源        |
| --------------------- | ---------------------------- | --------------- |
| `TaskStatsWidget`     | 今日任务、完成率、周统计     | `taskStats`     |
| `GoalStatsWidget`     | 活跃目标、平均进度、关键结果 | `goalStats`     |
| `ReminderStatsWidget` | 提醒触发次数、成功率         | `reminderStats` |
| `ScheduleStatsWidget` | 调度任务、执行成功率         | `scheduleStats` |

**组件实现示例**：

```vue
<!-- apps/web/src/modules/dashboard/presentation/components/TaskStatsWidget.vue -->
<template>
  <v-card class="task-stats-widget">
    <v-card-title>任务统计</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="6">
          <div class="stat-item">
            <div class="stat-value">{{ stats.instanceStats.todayInstances }}</div>
            <div class="stat-label">今日任务</div>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="stat-item">
            <div class="stat-value">{{ completionRate }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </v-col>
      </v-row>
      <v-divider class="my-4" />
      <v-progress-linear :model-value="completionRate" color="primary" height="8" />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskStatisticsClientDTO } from '@dailyuse/contracts';

const props = defineProps<{
  stats: TaskStatisticsClientDTO;
}>();

const completionRate = computed(() => {
  const { todayInstances, completedInstances } = props.stats.instanceStats;
  return todayInstances > 0 ? Math.round((completedInstances / todayInstances) * 100) : 0;
});
</script>
```

**验收标准**：

- ✅ 4 个 Widget 组件实现完成
- ✅ 支持响应式布局
- ✅ 支持 Skeleton 加载状态

---

#### 功能 6: Skeleton 加载屏 ⭐ **P2**

**业务价值**：提升用户体验，避免白屏等待

**功能描述**：

- Dashboard 页面骨架屏
- Widget 级别骨架屏
- 加载状态管理（loading/success/error）

**技术实现**：

```vue
<!-- apps/web/src/modules/dashboard/presentation/components/DashboardSkeleton.vue -->
<template>
  <v-container>
    <v-row>
      <v-col v-for="i in 4" :key="i" cols="12" md="6">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>
  </v-container>
</template>
```

**验收标准**：

- ✅ 骨架屏与实际组件布局一致
- ✅ 加载时间 ≤ 0.5s 时不显示骨架屏（避免闪烁）

---

## 3. 非功能需求

### 3.1 性能要求

| 指标               | 要求    | 优化策略              |
| ------------------ | ------- | --------------------- |
| Dashboard 首屏加载 | ≤ 0.5s  | Redis 缓存 + Skeleton |
| Statistics 查询    | ≤ 100ms | 并行查询 + 索引优化   |
| 缓存命中率         | ≥ 95%   | TTL 5分钟 + 事件失效  |
| Widget 渲染        | ≤ 50ms  | Vue 3 响应式优化      |

### 3.2 可扩展性

- **Widget 可插拔**：新增模块只需注册 Widget，无需修改核心代码
- **统计数据可扩展**：新增统计字段只需修改 Statistics 聚合根
- **缓存策略可配置**：TTL、失效策略可通过配置文件调整

### 3.3 可维护性

- **DDD 架构**：利用现有 Statistics 聚合根，保持领域逻辑一致性
- **DTO 分层**：Server/Client/Persistence DTO 清晰分离
- **事件驱动**：统计更新自动触发缓存失效

---

## 4. 用户故事

### Story 1: 快速查看 Dashboard 统计

**作为** 用户  
**我想要** 打开 Dashboard 时快速看到所有模块的统计数据  
**以便于** 一目了然地了解我的任务、目标、提醒和日程状态

**验收标准**：

- ✅ Dashboard 加载时间 ≤ 0.5s
- ✅ 显示 4 个模块的核心指标
- ✅ 数据来自缓存，保证最新（5 分钟内）

### Story 2: 自定义 Widget 显示

**作为** 用户  
**我想要** 选择显示哪些 Widget  
**以便于** 只关注我关心的模块

**验收标准**：

- ✅ 可以隐藏/显示任意 Widget
- ✅ 配置持久化到后端

### Story 3: 查看详细统计

**作为** 用户  
**我想要** 点击 Widget 查看该模块的详细统计  
**以便于** 深入了解某个模块的数据

**验收标准**：

- ✅ 点击 Widget 跳转到对应模块页面
- ✅ 携带统计数据作为查询条件

---

## 5. 技术架构（修订版）

### 5.1 后端架构

```
┌─────────────────────────────────────────────┐
│         Dashboard API Layer                  │
│  GET /api/dashboard/statistics               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  DashboardStatisticsAggregateService  🆕     │
│  - aggregateStatistics(accountUuid)          │
│  - calculateOverallCompletionRate()          │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┼───────────┬───────────┐
      │           │           │           │
┌─────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼─────┐
│   Task   │ │  Goal  │ │Reminder│ │Schedule │
│Statistics│ │Statisti│ │Statisti│ │Statisti │
│ ✅已存在 │ │cs ✅   │ │cs ✅   │ │cs ✅    │
└──────────┘ └────────┘ └────────┘ └─────────┘
      │           │           │           │
      └───────────┼───────────┴───────────┘
                  │
        ┌─────────▼─────────┐
        │ StatisticsCache   │
        │   Service (Redis) │
        │       🆕          │
        └───────────────────┘
```

**关键修改**：

- ❌ **删除**：TaskStatisticsService, GoalStatisticsService 等（**已存在聚合根**）
- ✅ **保留**：现有 Statistics 聚合根（直接调用）
- 🆕 **新增**：DashboardStatisticsAggregateService（聚合器）
- 🆕 **新增**：StatisticsCacheService（Redis 缓存层）

### 5.2 前端架构

```
┌─────────────────────────────────────────────┐
│         Dashboard Page                       │
│  - 使用 useDashboardStatistics()             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  useDashboardStatistics (Composable)  🆕     │
│  - fetchAllStatistics()                      │
│  - statistics: Ref<DashboardStatisticsDTO>   │
│  - loading: Ref<boolean>                     │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┼───────────┬───────────┐
      │           │           │           │
┌─────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼─────┐
│TaskStats │ │GoalStat│ │Reminder│ │Schedule │
│  Widget  │ │s Widget│ │Stats   │ │Stats    │
│   🆕     │ │  🆕    │ │Widget  │ │Widget   │
│          │ │        │ │  🆕    │ │  🆕     │
└──────────┘ └────────┘ └────────┘ └─────────┘
      │           │           │           │
      └───────────┴───────────┴───────────┘
                  │
        ┌─────────▼─────────┐
        │   WidgetRegistry  │
        │       🆕          │
        └───────────────────┘
```

---

## 6. 数据模型（不变）

现有 Statistics 聚合根已包含所有必要字段，**无需修改数据库 Schema**。

仅需新增：

```typescript
// Dashboard 配置（用户级别）
interface DashboardConfig {
  accountUuid: string;
  widgetConfig: {
    [widgetId: string]: {
      visible: boolean;
      order: number;
      size: 'small' | 'medium' | 'large';
    };
  };
  createdAt: number;
  updatedAt: number;
}
```

---

## 7. 里程碑与交付

### Phase 1: 核心聚合层（Sprint 1，3周）- 25 SP

- ✅ DashboardStatisticsAggregateService
- ✅ StatisticsCacheService（Redis）
- ✅ Dashboard API 接口
- ✅ 单元测试 + 集成测试

**交付物**：

- 可工作的 Dashboard API
- 缓存命中率 ≥ 95%
- 接口文档

### Phase 2: Widget 系统（Sprint 2，3周）- 25 SP

- ✅ WidgetRegistry 系统
- ✅ 4 个 Widget 组件（Task/Goal/Reminder/Schedule）
- ✅ Widget 配置持久化
- ✅ E2E 测试

**交付物**：

- 可复用的 Widget 组件库
- Widget 注册机制
- 用户配置管理

### Phase 3: 用户体验优化（Sprint 3，2周）- 20 SP

- ✅ Skeleton 加载屏
- ✅ 加载状态管理
- ✅ 错误处理 + 重试机制
- ✅ 性能优化

**交付物**：

- 流畅的加载体验
- 完善的错误处理

### Phase 4: 测试与发布（Sprint 4，2周）- 15 SP

- ✅ 性能测试
- ✅ 用户验收测试
- ✅ 文档编写
- ✅ 生产环境部署

**交付物**：

- 生产环境可用的 Dashboard
- 完整的用户文档
- 性能报告

---

## 8. 风险与挑战

| 风险                    | 影响 | 概率 | 缓解措施                  |
| ----------------------- | ---- | ---- | ------------------------- |
| Redis 缓存一致性问题    | 高   | 中   | 事件驱动失效 + TTL 兜底   |
| Statistics 查询性能瓶颈 | 中   | 低   | 数据库索引优化 + 并行查询 |
| Widget 扩展性不足       | 中   | 低   | 设计时预留扩展点          |
| 缓存雪崩                | 高   | 低   | 错峰 TTL + 熔断机制       |

---

## 9. 附录

### 9.1 现有 Statistics 聚合根方法清单

#### TaskStatistics

```typescript
- recalculate(templates: any[], instances: any[]): void
- getTodayCompletionRate(): number
- getWeekCompletionRate(): number
- getEfficiencyTrend(): 'UP' | 'DOWN' | 'STABLE'
```

#### GoalStatistics

```typescript
- recalculate(goals: GoalServerDTO[]): void
- getCompletionRate(): number
- getAverageGoalsPerMonth(): number
```

#### ReminderStatistics

```typescript
- recalculate(templates: any[], groups: any[]): void
- getTodaySuccessRate(): number
- getWeekSuccessRate(): number
- getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE'
```

#### ScheduleStatistics

```typescript
- recordExecution(status, duration, sourceModule): void
- getModuleStats(moduleName): ModuleStatisticsServerDTO
- calculateSuccessRate(): number
- calculateAverageDuration(): number
```

### 9.2 参考资料

- [DDD 架构设计指南](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Redis 缓存最佳实践](https://redis.io/docs/manual/patterns/)
- [Vue 3 性能优化](https://vuejs.org/guide/best-practices/performance.html)

---

**文档状态**: ✅ 已完成  
**审核状态**: ⏳ 待 SM 和 Tech Lead 审核  
**最后更新**: 2025-11-12
