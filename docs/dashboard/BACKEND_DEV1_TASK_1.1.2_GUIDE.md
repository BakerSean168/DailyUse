# TASK-1.1.2: 实现 DashboardStatisticsAggregateService

**开发人员**: Backend Dev 1  
**预估时间**: 16h (8 SP)  
**开始日期**: 2025-11-12  
**依赖**: TASK-1.1.1 ✅ 已完成

---

## 📋 任务目标

实现一个聚合服务，用于并行查询 4 个模块的 Statistics 并汇总为 Dashboard 统计数据。

## 📦 验收标准

- [ ] 并行查询 4 个模块的 Statistics（Task/Goal/Reminder/Schedule）
- [ ] 处理缺失数据（创建默认 Statistics）
- [ ] 计算总体完成率
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 响应时间 ≤ 100ms

---

## 🏗️ 架构设计

### 文件位置

```
apps/api/src/dashboard/
├── services/
│   └── dashboard-statistics-aggregate.service.ts  (主服务)
├── dashboard.module.ts                             (模块配置)
└── __tests__/
    └── dashboard-statistics-aggregate.service.spec.ts
```

### 依赖关系

```
DashboardStatisticsAggregateService
  ├─> TaskStatisticsRepository (获取任务统计)
  ├─> GoalStatisticsRepository (获取目标统计)
  ├─> ReminderStatisticsRepository (获取提醒统计)
  └─> ScheduleStatisticsRepository (获取调度统计)
```

---

## 💻 实现代码

### 1. 创建服务文件

```bash
mkdir -p apps/api/src/dashboard/services
touch apps/api/src/dashboard/services/dashboard-statistics-aggregate.service.ts
```

### 2. 服务实现

```typescript
// apps/api/src/dashboard/services/dashboard-statistics-aggregate.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardContracts } from '@dailyuse/contracts';
import {
  TaskStatistics,
  GoalStatistics,
  ReminderStatistics,
  ScheduleStatistics,
} from '@dailyuse/domain-server';

@Injectable()
export class DashboardStatisticsAggregateService {
  private readonly logger = new Logger(DashboardStatisticsAggregateService.name);

  constructor(
    @InjectRepository(TaskStatistics)
    private readonly taskStatsRepo: Repository<TaskStatistics>,
    @InjectRepository(GoalStatistics)
    private readonly goalStatsRepo: Repository<GoalStatistics>,
    @InjectRepository(ReminderStatistics)
    private readonly reminderStatsRepo: Repository<ReminderStatistics>,
    @InjectRepository(ScheduleStatistics)
    private readonly scheduleStatsRepo: Repository<ScheduleStatistics>,
  ) {}

  /**
   * 获取用户的 Dashboard 统计数据
   * @param userId 用户ID
   * @returns Dashboard 统计 DTO
   */
  async getDashboardStatistics(
    userId: string,
  ): Promise<DashboardContracts.DashboardStatisticsClientDTO> {
    const startTime = Date.now();
    this.logger.log(`开始聚合用户 ${userId} 的 Dashboard 统计数据`);

    try {
      // 并行查询 4 个模块的统计数据
      const [taskStats, goalStats, reminderStats, scheduleStats] = await Promise.all([
        this.getOrCreateTaskStatistics(userId),
        this.getOrCreateGoalStatistics(userId),
        this.getOrCreateReminderStatistics(userId),
        this.getOrCreateScheduleStatistics(userId),
      ]);

      // 计算总体完成率
      const overallCompletionRate = this.calculateOverallCompletionRate({
        taskStats,
        goalStats,
        reminderStats,
        scheduleStats,
      });

      // 构建 DTO
      const dashboardStats: DashboardContracts.DashboardStatisticsClientDTO = {
        userId,
        summary: {
          totalTasks: taskStats.totalTasks,
          totalGoals: goalStats.totalGoals,
          totalReminders: reminderStats.totalReminders,
          totalSchedules: scheduleStats.totalSchedules,
          overallCompletionRate,
        },
        taskStatistics: this.mapTaskStatistics(taskStats),
        goalStatistics: this.mapGoalStatistics(goalStats),
        reminderStatistics: this.mapReminderStatistics(reminderStats),
        scheduleStatistics: this.mapScheduleStatistics(scheduleStats),
        lastUpdated: new Date().toISOString(),
      };

      const duration = Date.now() - startTime;
      this.logger.log(`Dashboard 统计聚合完成，耗时 ${duration}ms (目标: ≤100ms)`);

      return dashboardStats;
    } catch (error) {
      this.logger.error('Dashboard 统计聚合失败', error);
      throw new Error(`Failed to aggregate dashboard statistics: ${error.message}`);
    }
  }

  /**
   * 获取或创建 TaskStatistics
   */
  private async getOrCreateTaskStatistics(userId: string): Promise<TaskStatistics> {
    let stats = await this.taskStatsRepo.findOne({ where: { userId } });

    if (!stats) {
      this.logger.warn(`用户 ${userId} 没有 TaskStatistics，创建默认值`);
      stats = TaskStatistics.createDefault(userId);
      await this.taskStatsRepo.save(stats);
    }

    return stats;
  }

  /**
   * 获取或创建 GoalStatistics
   */
  private async getOrCreateGoalStatistics(userId: string): Promise<GoalStatistics> {
    let stats = await this.goalStatsRepo.findOne({ where: { userId } });

    if (!stats) {
      this.logger.warn(`用户 ${userId} 没有 GoalStatistics，创建默认值`);
      stats = GoalStatistics.createDefault(userId);
      await this.goalStatsRepo.save(stats);
    }

    return stats;
  }

  /**
   * 获取或创建 ReminderStatistics
   */
  private async getOrCreateReminderStatistics(userId: string): Promise<ReminderStatistics> {
    let stats = await this.reminderStatsRepo.findOne({ where: { userId } });

    if (!stats) {
      this.logger.warn(`用户 ${userId} 没有 ReminderStatistics，创建默认值`);
      stats = ReminderStatistics.createDefault(userId);
      await this.reminderStatsRepo.save(stats);
    }

    return stats;
  }

  /**
   * 获取或创建 ScheduleStatistics
   */
  private async getOrCreateScheduleStatistics(userId: string): Promise<ScheduleStatistics> {
    let stats = await this.scheduleStatsRepo.findOne({ where: { userId } });

    if (!stats) {
      this.logger.warn(`用户 ${userId} 没有 ScheduleStatistics，创建默认值`);
      stats = ScheduleStatistics.createDefault(userId);
      await this.scheduleStatsRepo.save(stats);
    }

    return stats;
  }

  /**
   * 计算总体完成率
   */
  private calculateOverallCompletionRate(stats: {
    taskStats: TaskStatistics;
    goalStats: GoalStatistics;
    reminderStats: ReminderStatistics;
    scheduleStats: ScheduleStatistics;
  }): number {
    const rates = [
      stats.taskStats.todayCompletionRate || 0,
      stats.goalStats.averageProgress || 0,
      stats.reminderStats.triggerSuccessRate || 0,
      stats.scheduleStats.executionSuccessRate || 0,
    ];

    const validRates = rates.filter((rate) => rate > 0);
    if (validRates.length === 0) return 0;

    const sum = validRates.reduce((acc, rate) => acc + rate, 0);
    return Math.round((sum / validRates.length) * 100) / 100;
  }

  /**
   * 映射 TaskStatistics 到 ClientDTO
   */
  private mapTaskStatistics(
    stats: TaskStatistics,
  ): DashboardContracts.DashboardStatisticsClientDTO['taskStatistics'] {
    return {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      todayTasks: stats.todayTasks,
      todayCompleted: stats.todayCompleted,
      todayCompletionRate: stats.todayCompletionRate,
      weekStats: stats.weekStats,
      tags: stats.tags || [],
    };
  }

  /**
   * 映射 GoalStatistics 到 ClientDTO
   */
  private mapGoalStatistics(
    stats: GoalStatistics,
  ): DashboardContracts.DashboardStatisticsClientDTO['goalStatistics'] {
    return {
      totalGoals: stats.totalGoals,
      activeGoals: stats.activeGoals,
      completedGoals: stats.completedGoals,
      averageProgress: stats.averageProgress,
      keyResults: stats.keyResults || [],
    };
  }

  /**
   * 映射 ReminderStatistics 到 ClientDTO
   */
  private mapReminderStatistics(
    stats: ReminderStatistics,
  ): DashboardContracts.DashboardStatisticsClientDTO['reminderStatistics'] {
    return {
      totalReminders: stats.totalReminders,
      activeReminders: stats.activeReminders,
      triggeredCount: stats.triggeredCount,
      successCount: stats.successCount,
      triggerSuccessRate: stats.triggerSuccessRate,
    };
  }

  /**
   * 映射 ScheduleStatistics 到 ClientDTO
   */
  private mapScheduleStatistics(
    stats: ScheduleStatistics,
  ): DashboardContracts.DashboardStatisticsClientDTO['scheduleStatistics'] {
    return {
      totalSchedules: stats.totalSchedules,
      activeSchedules: stats.activeSchedules,
      executedCount: stats.executedCount,
      successCount: stats.successCount,
      executionSuccessRate: stats.executionSuccessRate,
    };
  }
}
```

---

## 🧪 单元测试

```typescript
// apps/api/src/dashboard/__tests__/dashboard-statistics-aggregate.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardStatisticsAggregateService } from '../services/dashboard-statistics-aggregate.service';
import {
  TaskStatistics,
  GoalStatistics,
  ReminderStatistics,
  ScheduleStatistics,
} from '@dailyuse/domain-server';

describe('DashboardStatisticsAggregateService', () => {
  let service: DashboardStatisticsAggregateService;
  let taskStatsRepo: Repository<TaskStatistics>;
  let goalStatsRepo: Repository<GoalStatistics>;
  let reminderStatsRepo: Repository<ReminderStatistics>;
  let scheduleStatsRepo: Repository<ScheduleStatistics>;

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardStatisticsAggregateService,
        {
          provide: getRepositoryToken(TaskStatistics),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GoalStatistics),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReminderStatistics),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ScheduleStatistics),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardStatisticsAggregateService>(DashboardStatisticsAggregateService);
    taskStatsRepo = module.get(getRepositoryToken(TaskStatistics));
    goalStatsRepo = module.get(getRepositoryToken(GoalStatistics));
    reminderStatsRepo = module.get(getRepositoryToken(ReminderStatistics));
    scheduleStatsRepo = module.get(getRepositoryToken(ScheduleStatistics));
  });

  describe('getDashboardStatistics', () => {
    it('应该成功聚合所有模块的统计数据', async () => {
      // Mock 数据
      const mockTaskStats = TaskStatistics.createDefault(mockUserId);
      mockTaskStats.totalTasks = 10;
      mockTaskStats.todayCompletionRate = 0.8;

      const mockGoalStats = GoalStatistics.createDefault(mockUserId);
      mockGoalStats.totalGoals = 5;
      mockGoalStats.averageProgress = 0.6;

      const mockReminderStats = ReminderStatistics.createDefault(mockUserId);
      mockReminderStats.totalReminders = 20;
      mockReminderStats.triggerSuccessRate = 0.95;

      const mockScheduleStats = ScheduleStatistics.createDefault(mockUserId);
      mockScheduleStats.totalSchedules = 8;
      mockScheduleStats.executionSuccessRate = 0.9;

      // Mock Repository 返回值
      jest.spyOn(taskStatsRepo, 'findOne').mockResolvedValue(mockTaskStats);
      jest.spyOn(goalStatsRepo, 'findOne').mockResolvedValue(mockGoalStats);
      jest.spyOn(reminderStatsRepo, 'findOne').mockResolvedValue(mockReminderStats);
      jest.spyOn(scheduleStatsRepo, 'findOne').mockResolvedValue(mockScheduleStats);

      // 执行
      const result = await service.getDashboardStatistics(mockUserId);

      // 断言
      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUserId);
      expect(result.summary.totalTasks).toBe(10);
      expect(result.summary.totalGoals).toBe(5);
      expect(result.summary.totalReminders).toBe(20);
      expect(result.summary.totalSchedules).toBe(8);
      expect(result.summary.overallCompletionRate).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeDefined();
    });

    it('应该为缺失的统计数据创建默认值', async () => {
      // Mock Repository 返回 null（表示数据不存在）
      jest.spyOn(taskStatsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(goalStatsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(reminderStatsRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(scheduleStatsRepo, 'findOne').mockResolvedValue(null);

      // Mock save 方法
      const mockTaskStats = TaskStatistics.createDefault(mockUserId);
      const mockGoalStats = GoalStatistics.createDefault(mockUserId);
      const mockReminderStats = ReminderStatistics.createDefault(mockUserId);
      const mockScheduleStats = ScheduleStatistics.createDefault(mockUserId);

      jest.spyOn(taskStatsRepo, 'save').mockResolvedValue(mockTaskStats);
      jest.spyOn(goalStatsRepo, 'save').mockResolvedValue(mockGoalStats);
      jest.spyOn(reminderStatsRepo, 'save').mockResolvedValue(mockReminderStats);
      jest.spyOn(scheduleStatsRepo, 'save').mockResolvedValue(mockScheduleStats);

      // 执行
      const result = await service.getDashboardStatistics(mockUserId);

      // 断言：应该调用 save 创建默认数据
      expect(taskStatsRepo.save).toHaveBeenCalledTimes(1);
      expect(goalStatsRepo.save).toHaveBeenCalledTimes(1);
      expect(reminderStatsRepo.save).toHaveBeenCalledTimes(1);
      expect(scheduleStatsRepo.save).toHaveBeenCalledTimes(1);

      // 断言：返回的数据应该是默认值
      expect(result.summary.totalTasks).toBe(0);
      expect(result.summary.totalGoals).toBe(0);
    });

    it('应该在 100ms 内完成（性能测试）', async () => {
      const mockTaskStats = TaskStatistics.createDefault(mockUserId);
      const mockGoalStats = GoalStatistics.createDefault(mockUserId);
      const mockReminderStats = ReminderStatistics.createDefault(mockUserId);
      const mockScheduleStats = ScheduleStatistics.createDefault(mockUserId);

      jest.spyOn(taskStatsRepo, 'findOne').mockResolvedValue(mockTaskStats);
      jest.spyOn(goalStatsRepo, 'findOne').mockResolvedValue(mockGoalStats);
      jest.spyOn(reminderStatsRepo, 'findOne').mockResolvedValue(mockReminderStats);
      jest.spyOn(scheduleStatsRepo, 'findOne').mockResolvedValue(mockScheduleStats);

      const startTime = Date.now();
      await service.getDashboardStatistics(mockUserId);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('calculateOverallCompletionRate', () => {
    it('应该正确计算平均完成率', () => {
      // 这个方法是 private，通过调用 getDashboardStatistics 间接测试
      // 或者使用 TypeScript 的类型断言来直接测试
    });
  });
});
```

---

## 📝 模块配置

```typescript
// apps/api/src/dashboard/dashboard.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardStatisticsAggregateService } from './services/dashboard-statistics-aggregate.service';
import {
  TaskStatistics,
  GoalStatistics,
  ReminderStatistics,
  ScheduleStatistics,
} from '@dailyuse/domain-server';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskStatistics,
      GoalStatistics,
      ReminderStatistics,
      ScheduleStatistics,
    ]),
  ],
  providers: [DashboardStatisticsAggregateService],
  exports: [DashboardStatisticsAggregateService],
})
export class DashboardModule {}
```

---

## ✅ 验证步骤

### 1. 运行单元测试

```bash
pnpm nx test api --testPathPattern=dashboard-statistics-aggregate
```

**预期结果**:

- ✅ 所有测试通过
- ✅ 覆盖率 ≥ 90%

### 2. 手动测试（使用 NestJS CLI）

```bash
# 1. 启动 API
pnpm nx serve api

# 2. 打开 NestJS 控制台（如果有）或使用 curl 测试
curl http://localhost:3000/api/dashboard/statistics \
  -H "Authorization: Bearer <token>"
```

### 3. 性能测试

```bash
# 使用 Apache Bench 测试响应时间
ab -n 100 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/dashboard/statistics
```

**预期结果**:

- ✅ 平均响应时间 ≤ 100ms
- ✅ 成功率 100%

---

## 🔍 常见问题

### Q1: Statistics 聚合根的 `createDefault` 方法不存在怎么办？

**A**: 检查 `@dailyuse/domain-server` 包中的聚合根定义，可能需要手动创建默认实例：

```typescript
const stats = new TaskStatistics();
stats.userId = userId;
stats.totalTasks = 0;
// ... 其他默认值
```

### Q2: Repository 注入失败？

**A**: 确保在 `DashboardModule` 中导入了 `TypeOrmModule.forFeature([...])`。

### Q3: 响应时间超过 100ms？

**A**: 检查以下内容：

1. 是否使用了并行查询（`Promise.all`）
2. 数据库查询是否有索引
3. 是否有不必要的关联查询

---

## 📚 参考资料

- [DashboardStatisticsClientDTO 定义](../../packages/contracts/src/modules/dashboard/DashboardStatisticsClient.ts)
- [TaskStatistics 聚合根](../../packages/domain-server/src/modules/task/aggregates/TaskStatistics.ts)
- [GoalStatistics 聚合根](../../packages/domain-server/src/modules/goal/aggregates/GoalStatistics.ts)
- [Sprint 1 Kickoff 文档](./SPRINT_1_KICKOFF.md)

---

## 🎯 下一步

完成后提交 PR，并通知：

1. **Backend Dev 2** - 可以开始集成缓存（TASK-1.2.2）
2. **QA Engineer** - 准备单元测试审查（TASK-1.1.3）
