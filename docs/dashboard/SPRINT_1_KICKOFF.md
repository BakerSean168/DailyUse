# Sprint 1 Kickoff - Dashboard 统计聚合

**Sprint**: Sprint 1  
**日期**: 2025-11-12 → 2025-12-08（3周）  
**目标**: Dashboard 统计聚合层 + 缓存层 + API  
**工作量**: 25 SP  
**团队**: 2 名 Backend Dev + 1 名 QA

---

## 🎯 Sprint 目标

实现 Dashboard 统计数据的聚合、缓存和 API 接口，为前端 Widget 系统提供数据支持。

### 核心交付物

1. ✅ `DashboardStatisticsAggregateService` - 聚合 4 个模块的统计数据
2. ✅ `StatisticsCacheService` - Redis 缓存层（TTL 5分钟）
3. ✅ `GET /api/dashboard/statistics` - Dashboard API 接口
4. ✅ 单元测试 + 集成测试 + E2E 测试（覆盖率 ≥ 90%）
5. ✅ API 文档（Swagger）

---

## 📋 任务分配

### Backend Dev 1 - 统计聚合层（12 SP）

#### Task 1.1.1: 定义 DashboardStatisticsDTO（2 SP）✅ 已完成

**文件**: `packages/contracts/src/modules/dashboard/DashboardStatisticsClient.ts`

```typescript
/**
 * Dashboard 统计数据传输对象
 *
 * 职责：聚合 Task/Goal/Reminder/Schedule 4 个模块的统计数据
 */
export interface DashboardStatisticsClientDTO {
  accountUuid: string;

  // 汇总数据
  summary: {
    totalTasks: number;
    totalGoals: number;
    totalReminders: number;
    totalScheduleTasks: number;
    overallCompletionRate: number; // 加权平均完成率
  };

  // 各模块详细统计
  taskStats: TaskStatisticsClientDTO;
  goalStats: GoalStatisticsClientDTO;
  reminderStats: ReminderStatisticsClientDTO;
  scheduleStats: ScheduleStatisticsClientDTO;

  // 元数据
  calculatedAt: number; // Unix timestamp
  cacheHit: boolean; // 是否命中缓存
}
```

**验收标准**:

- ✅ TypeScript 类型检查通过
- ✅ 导出到 contracts 包（遵循模块规范）
- ✅ 包含所有必需字段
- ✅ 添加 JSDoc 注释
- ✅ 放在 modules/dashboard 目录下

**预估时间**: 4 小时  
**完成时间**: 2025-11-12  
**状态**: ✅ 已完成

---

#### Task 1.1.2: 实现 DashboardStatisticsAggregateService（8 SP）✅ 开始

**文件**: `apps/api/src/dashboard/services/DashboardStatisticsAggregateService.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { TaskStatisticsRepository } from '@domain/task/repositories/TaskStatisticsRepository';
import { GoalStatisticsRepository } from '@domain/goal/repositories/GoalStatisticsRepository';
import { ReminderStatisticsRepository } from '@domain/reminder/repositories/ReminderStatisticsRepository';
import { ScheduleStatisticsRepository } from '@domain/schedule/repositories/ScheduleStatisticsRepository';
import { DashboardStatisticsClientDTO } from '@contracts/dashboard';

/**
 * Dashboard 统计聚合服务
 *
 * 职责：
 * 1. 并行查询 4 个模块的 Statistics 聚合根
 * 2. 聚合为 DashboardStatisticsDTO
 * 3. 计算总体完成率
 */
@Injectable()
export class DashboardStatisticsAggregateService {
  private readonly logger = new Logger(DashboardStatisticsAggregateService.name);

  constructor(
    private readonly taskStatisticsRepo: TaskStatisticsRepository,
    private readonly goalStatisticsRepo: GoalStatisticsRepository,
    private readonly reminderStatisticsRepo: ReminderStatisticsRepository,
    private readonly scheduleStatisticsRepo: ScheduleStatisticsRepository,
  ) {}

  /**
   * 聚合 Dashboard 统计数据
   *
   * 策略：
   * 1. 并行查询 4 个模块（Promise.all）
   * 2. 转换为 ClientDTO
   * 3. 计算汇总数据
   *
   * @param accountUuid - 用户 UUID
   * @returns Dashboard 统计数据
   */
  async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
    const startTime = Date.now();

    try {
      // 并行查询 4 个模块的 Statistics
      const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
        this.taskStatisticsRepo.findByAccountUuid(accountUuid),
        this.goalStatisticsRepo.findByAccountUuid(accountUuid),
        this.reminderStatisticsRepo.findByAccountUuid(accountUuid),
        this.scheduleStatisticsRepo.findByAccountUuid(accountUuid),
      ]);

      // 计算汇总数据
      const summary = {
        totalTasks: taskStats?.getTemplateStats().totalTemplates ?? 0,
        totalGoals: goalStats?.getTotalGoals() ?? 0,
        totalReminders: reminderStats?.getTotalReminders() ?? 0,
        totalScheduleTasks: scheduleStats?.getTotalTasks() ?? 0,
        overallCompletionRate: this.calculateOverallCompletionRate(taskStats, goalStats),
      };

      // 转换为 ClientDTO
      const result: DashboardStatisticsDTO = {
        accountUuid,
        summary,
        taskStats: taskStats?.toClientDTO() ?? this.getEmptyTaskStats(),
        goalStats: goalStats?.toClientDTO() ?? this.getEmptyGoalStats(),
        reminderStats: reminderStats?.toClientDTO() ?? this.getEmptyReminderStats(),
        scheduleStats: scheduleStats?.toClientDTO() ?? this.getEmptyScheduleStats(),
        calculatedAt: Date.now(),
        cacheHit: false, // 将由 CacheService 设置
      };

      const duration = Date.now() - startTime;
      this.logger.debug(`Aggregated statistics for ${accountUuid} in ${duration}ms`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to aggregate statistics for ${accountUuid}`, error.stack);
      throw error;
    }
  }

  /**
   * 计算总体完成率
   *
   * 策略：Task 60% + Goal 40%（加权平均）
   */
  private calculateOverallCompletionRate(
    taskStats: TaskStatistics | null,
    goalStats: GoalStatistics | null,
  ): number {
    const taskRate = taskStats?.getTodayCompletionRate() ?? 0;
    const goalRate = goalStats?.getCompletionRate() ?? 0;

    // 加权平均：Task 60%, Goal 40%
    const weightedRate = taskRate * 0.6 + goalRate * 0.4;

    return Math.round(weightedRate * 10) / 10; // 保留 1 位小数
  }

  // 空数据兜底方法
  private getEmptyTaskStats(): TaskStatisticsClientDTO {
    /* ... */
  }
  private getEmptyGoalStats(): GoalStatisticsClientDTO {
    /* ... */
  }
  private getEmptyReminderStats(): ReminderStatisticsClientDTO {
    /* ... */
  }
  private getEmptyScheduleStats(): ScheduleStatisticsClientDTO {
    /* ... */
  }
}
```

**验收标准**:

- ✅ 并行查询 4 个模块（使用 `Promise.all()`）
- ✅ 正确转换为 ClientDTO
- ✅ 总体完成率计算正确（Task 60% + Goal 40%）
- ✅ 错误处理完善（日志记录）
- ✅ 单元测试覆盖率 ≥ 90%

**预估时间**: 16 小时  
**截止日期**: 2025-11-18 18:00

---

#### Task 1.1.3: 单元测试（2 SP）

**文件**: `apps/api/src/dashboard/services/__tests__/DashboardStatisticsAggregateService.test.ts`

**测试用例**:

1. ✅ 成功聚合 4 个模块的统计数据
2. ✅ 空数据兜底（部分模块无数据）
3. ✅ 总体完成率计算正确
4. ✅ 并行查询性能（≤ 500ms）
5. ✅ 错误处理（Repository 查询失败）

**预估时间**: 4 小时  
**截止日期**: 2025-11-19 18:00

---

### Backend Dev 2 - 缓存层 + API（13 SP）

#### Task 1.2.1: 实现 StatisticsCacheService（5 SP）✅ 开始

**文件**: `apps/api/src/dashboard/services/StatisticsCacheService.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { DashboardStatisticsDTO } from '@contracts/dashboard/DashboardStatisticsDTO';

/**
 * 统计数据缓存服务
 *
 * 职责：
 * 1. Redis 缓存读写
 * 2. TTL 管理（默认 5 分钟）
 * 3. 缓存失效
 */
@Injectable()
export class StatisticsCacheService {
  private readonly logger = new Logger(StatisticsCacheService.name);
  private readonly CACHE_KEY_PREFIX = 'dashboard:stats:';
  private readonly DEFAULT_TTL = 300; // 5分钟

  constructor(private readonly redis: Redis) {}

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

      this.logger.debug(`Cache hit for ${accountUuid}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to read cache for ${accountUuid}`, error.stack);
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
      // 添加随机 TTL（4-6分钟），避免缓存雪崩
      const randomTTL = ttl + Math.floor(Math.random() * 120 - 60);

      await this.redis.set(key, JSON.stringify(data), 'EX', randomTTL);
      this.logger.debug(`Cached statistics for ${accountUuid}, TTL=${randomTTL}s`);
    } catch (error) {
      this.logger.error(`Failed to write cache for ${accountUuid}`, error.stack);
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
        this.logger.info(`Invalidated cache for ${accountUuid}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for ${accountUuid}`, error.stack);
    }
  }

  private getCacheKey(accountUuid: string): string {
    return `${this.CACHE_KEY_PREFIX}${accountUuid}`;
  }
}
```

**验收标准**:

- ✅ Redis 读写正确
- ✅ TTL 随机化（避免缓存雪崩）
- ✅ 缓存命中标记（cacheHit）
- ✅ 错误处理（Redis 连接失败不影响业务）
- ✅ 单元测试覆盖率 ≥ 90%

**预估时间**: 10 小时  
**截止日期**: 2025-11-20 18:00

---

#### Task 1.2.2: 实现事件驱动缓存失效（2 SP）

**文件**: `apps/api/src/dashboard/listeners/DashboardCacheInvalidationListener.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StatisticsCacheService } from '../services/StatisticsCacheService';

/**
 * Dashboard 缓存失效监听器
 *
 * 职责：监听 Statistics 更新事件，自动失效缓存
 */
@Injectable()
export class DashboardCacheInvalidationListener {
  private readonly logger = new Logger(DashboardCacheInvalidationListener.name);

  constructor(private readonly cacheService: StatisticsCacheService) {}

  @OnEvent('task.statistics.updated')
  async onTaskStatisticsUpdated(payload: { accountUuid: string }): Promise<void> {
    this.logger.debug(`Task statistics updated for ${payload.accountUuid}`);
    await this.cacheService.invalidate(payload.accountUuid);
  }

  @OnEvent('goal.statistics.updated')
  async onGoalStatisticsUpdated(payload: { accountUuid: string }): Promise<void> {
    this.logger.debug(`Goal statistics updated for ${payload.accountUuid}`);
    await this.cacheService.invalidate(payload.accountUuid);
  }

  @OnEvent('reminder.statistics.updated')
  async onReminderStatisticsUpdated(payload: { accountUuid: string }): Promise<void> {
    this.logger.debug(`Reminder statistics updated for ${payload.accountUuid}`);
    await this.cacheService.invalidate(payload.accountUuid);
  }

  @OnEvent('schedule.statistics.updated')
  async onScheduleStatisticsUpdated(payload: { accountUuid: string }): Promise<void> {
    this.logger.debug(`Schedule statistics updated for ${payload.accountUuid}`);
    await this.cacheService.invalidate(payload.accountUuid);
  }
}
```

**验收标准**:

- ✅ 监听 4 个模块的统计更新事件
- ✅ 自动失效对应用户的缓存
- ✅ 集成测试通过

**预估时间**: 4 小时  
**截止日期**: 2025-11-21 18:00

---

#### Task 1.3.1: 实现 Dashboard API（2 SP）

**文件**: `apps/api/src/dashboard/controllers/DashboardController.ts`

```typescript
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/guards/jwt-auth.guard';
import { DashboardStatisticsAggregateService } from '../services/DashboardStatisticsAggregateService';
import { StatisticsCacheService } from '../services/StatisticsCacheService';
import { DashboardStatisticsDTO } from '@contracts/dashboard/DashboardStatisticsDTO';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly aggregateService: DashboardStatisticsAggregateService,
    private readonly cacheService: StatisticsCacheService,
  ) {}

  @Get('statistics')
  @ApiOperation({ summary: '获取 Dashboard 统计数据' })
  @ApiResponse({
    status: 200,
    description: '成功返回统计数据',
    type: DashboardStatisticsDTO,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async getStatistics(@Req() req): Promise<DashboardStatisticsDTO> {
    const accountUuid = req.user.accountUuid;

    // 1. 尝试从缓存读取
    const cached = await this.cacheService.get(accountUuid);
    if (cached) {
      return cached;
    }

    // 2. 缓存未命中，查询并缓存
    const stats = await this.aggregateService.aggregateStatistics(accountUuid);
    await this.cacheService.set(accountUuid, stats);

    return stats;
  }
}
```

**验收标准**:

- ✅ API 端点可用（`GET /api/dashboard/statistics`）
- ✅ JWT 鉴权生效
- ✅ 缓存优先策略（Cache-Aside）
- ✅ Swagger 文档完整

**预估时间**: 4 小时  
**截止日期**: 2025-11-22 18:00

---

#### Task 1.3.2: E2E 测试（2 SP）

**文件**: `apps/api/src/dashboard/__tests__/dashboard.e2e.test.ts`

**测试用例**:

1. ✅ 成功返回统计数据（有效 Token）
2. ✅ 401 未授权（无 Token）
3. ✅ 缓存命中（第二次请求 ≤ 50ms）
4. ✅ 缓存失效后重新计算
5. ✅ 并发请求（100 个请求）

**预估时间**: 4 小时  
**截止日期**: 2025-11-23 18:00

---

#### Task 1.3.3: API 文档（2 SP）

**文件**: `apps/api/src/dashboard/dashboard.swagger.ts`

**内容包括**:

- ✅ API 端点说明
- ✅ 请求示例（curl）
- ✅ 响应示例（200/401/500）
- ✅ 错误码说明

**预估时间**: 4 小时  
**截止日期**: 2025-11-24 18:00

---

### QA - 测试与质量保证（额外）

#### 集成测试（贯穿开发过程）

**测试场景**:

1. ✅ 完整流程测试（API → Cache → Aggregate → Repository）
2. ✅ 缓存命中率测试（1000 次请求，≥ 95%）
3. ✅ 性能测试（加载时间 ≤ 500ms）
4. ✅ 事件驱动缓存失效测试

---

## 🏗️ 开发环境准备

### 1. Redis 配置

```bash
# 启动 Redis（Docker）
cd /workspaces/DailyUse
docker-compose up -d redis

# 验证 Redis 连接
docker exec -it dailyuse_redis redis-cli ping
# 应返回: PONG
```

### 2. 代码分支

```bash
# 创建 Sprint 1 开发分支
git checkout -b feature/dashboard-sprint-1

# 推送到远程
git push -u origin feature/dashboard-sprint-1
```

### 3. 依赖安装

```bash
# 安装依赖（如果需要）
pnpm install

# 验证构建
pnpm nx build api
```

---

## 📊 进度跟踪

### Daily Standup（每日站会）

**时间**: 每天 10:00（15分钟）  
**内容**:

1. 昨天完成了什么？
2. 今天计划做什么？
3. 有什么阻塞？

### 进度看板

| 任务       | 负责人        | 状态    | 预估 | 实际 | 阻塞 |
| ---------- | ------------- | ------- | ---- | ---- | ---- |
| TASK-1.1.1 | Backend Dev 1 | ⏳ TODO | 4h   | -    | -    |
| TASK-1.1.2 | Backend Dev 1 | ⏳ TODO | 16h  | -    | -    |
| TASK-1.1.3 | Backend Dev 1 | ⏳ TODO | 4h   | -    | -    |
| TASK-1.2.1 | Backend Dev 2 | ⏳ TODO | 10h  | -    | -    |
| TASK-1.2.2 | Backend Dev 2 | ⏳ TODO | 4h   | -    | -    |
| TASK-1.3.1 | Backend Dev 2 | ⏳ TODO | 4h   | -    | -    |
| TASK-1.3.2 | Backend Dev 2 | ⏳ TODO | 4h   | -    | -    |
| TASK-1.3.3 | Backend Dev 2 | ⏳ TODO | 4h   | -    | -    |

**总计**: 50 小时 ≈ 25 SP（1 SP = 2 小时）

---

## 🎯 Sprint Review（Sprint 结束）

**日期**: 2025-12-08 14:00  
**内容**:

1. 演示 Dashboard API 功能
2. 展示缓存命中率数据
3. 性能测试结果
4. PO 验收

---

## 🚨 风险与缓解

| 风险              | 概率 | 影响 | 缓解措施                              |
| ----------------- | ---- | ---- | ------------------------------------- |
| Redis 连接不稳定  | 中   | 高   | 错误处理 + 降级策略（无缓存也能工作） |
| Statistics 查询慢 | 低   | 中   | 并行查询 + 数据库索引优化             |
| 任务延期          | 中   | 中   | 每日站会跟踪 + 及时调整               |

---

## 📚 参考文档

- [Product Requirements V2](./DASHBOARD_PRODUCT_REQUIREMENTS_V2.md)
- [Sprint Planning V2](./DASHBOARD_SPRINT_PLANNING_V2.md)
- [Technical Design V2](./DASHBOARD_TECHNICAL_DESIGN_V2.md)
- [Document Review Report](./DOCUMENT_REVIEW_REPORT.md)

---

**Kickoff 状态**: ✅ 已完成  
**开发状态**: 🚧 进行中  
**下次会议**: 每日站会（明天 10:00）

🚀 **Let's build it!**
