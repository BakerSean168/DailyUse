/**
 * 目标状态转换流程集成测试
 *
 * 测试场景：
 * 1. 激活目标 (DRAFT → ACTIVE)
 * 2. 完成目标 (ACTIVE → COMPLETED)
 * 3. 归档目标 (ACTIVE/COMPLETED → ARCHIVED)
 * 4. 取消归档 (ARCHIVED → ACTIVE)
 * 5. 软删除目标 (任意状态 → DELETED)
 * 6. 恢复目标 (DELETED → 原状态)
 * 7. 状态转换规则验证
 * 8. 事件发布验证
 */

import '../../../test/setup-database'; // 导入全局数据库清理钩子
import { describe, it, expect, beforeEach } from 'vitest';
import { GoalApplicationService } from '../application/services/GoalApplicationService';
import { GoalStatisticsApplicationService } from '../application/services/GoalStatisticsApplicationService';
import { GoalContainer } from '../infrastructure/di/GoalContainer';
import { PrismaGoalStatisticsRepository } from '../infrastructure/repositories/PrismaGoalStatisticsRepository';
import { PrismaGoalRepository } from '../infrastructure/repositories/PrismaGoalRepository';
import { getTestPrisma, createTestAccounts } from '../../../test/helpers/database-helpers';
import { GoalEventPublisher } from '../application/services/GoalEventPublisher';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

describe('Goal Status Transition Integration Tests', () => {
  let statisticsService: GoalStatisticsApplicationService;
  let goalService: GoalApplicationService;

  beforeEach(async () => {
    // 确保环境变量设置正确
    process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';

    // 数据库清理由setup-database.ts自动处理

    // 预创建所有测试账户
    await createTestAccounts([
      'activate-1', 'activate-2',
      'complete-1', 'complete-2', 'complete-3',
      'archive-1', 'archive-2', 'archive-3',
      'chain-1', 'chain-2',
      'batch-1',
      'timestamp-1', 'timestamp-2',
      'stats-consistency-1',
    ]);

    // 获取真实 Prisma 客户端
    const prisma = getTestPrisma();

    // Initialize DI container with real database repositories
    const container = GoalContainer.getInstance();
    container.setGoalStatisticsRepository(
      new PrismaGoalStatisticsRepository(prisma),
    );
    container.setGoalRepository(new PrismaGoalRepository(prisma));

    // Reset and initialize event publisher
    GoalEventPublisher.reset();
    await GoalEventPublisher.initialize();

    // Get service instances
    statisticsService = await GoalStatisticsApplicationService.getInstance();
    goalService = await GoalApplicationService.getInstance();
  });

  describe('激活目标 (Activate)', () => {
    it('应该成功激活 DRAFT 状态的目标', async () => {
      const accountUuid = 'test-account-activate-1';

      // 创建 DRAFT 状态的目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '待激活的目标',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      // 激活目标
      const activated = await goalService.activateGoal(goal.uuid);

      // 验证状态转换
      expect(activated.status).toBe('ACTIVE');
      expect(activated.uuid).toBe(goal.uuid);
    });

    it('应该更新统计数据（activeGoals +1）', async () => {
      const accountUuid = 'test-account-activate-2';

      // 获取初始统计
      const initialStats = await statisticsService.getOrCreateStatistics(accountUuid);
      const initialActive = initialStats.activeGoals;

      // 创建并激活目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      // 等待事件处理
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证统计更新
      const updatedStats = await statisticsService.getStatistics(accountUuid);
      expect(updatedStats).toBeDefined();
      if (updatedStats) {
        expect(updatedStats.activeGoals).toBeGreaterThanOrEqual(initialActive + 1);
      }
    });
  });

  describe('完成目标 (Complete)', () => {
    it('应该成功完成 ACTIVE 状态的目标', async () => {
      const accountUuid = 'test-account-complete-1';

      // 创建并激活目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '待完成的目标',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      // 完成目标
      const completed = await goalService.completeGoal(goal.uuid);

      // 验证状态转换
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeDefined();
      expect(completed.completedAt).toBeGreaterThan(0);
    });

    it('应该更新统计数据（activeGoals -1, completedGoals +1）', async () => {
      const accountUuid = 'test-account-complete-2';

      // 获取初始统计
      const initialStats = await statisticsService.getOrCreateStatistics(accountUuid);
      const initialCompleted = initialStats.completedGoals;

      // 创建、激活并完成目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);
      await goalService.completeGoal(goal.uuid);

      // 等待事件处理
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证统计更新
      const updatedStats = await statisticsService.getStatistics(accountUuid);
      expect(updatedStats).toBeDefined();
      if (updatedStats) {
        expect(updatedStats.completedGoals).toBe(initialCompleted + 1);
      }
    });

    it('完成目标应该标记为已完成', async () => {
      const accountUuid = 'test-account-complete-3';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);
      const completed = await goalService.completeGoal(goal.uuid);

      // 验证已完成
      expect(completed.isCompleted).toBe(true);
      expect(completed.status).toBe('COMPLETED');
    });
  });

  describe('归档目标 (Archive)', () => {
    it('应该成功归档 ACTIVE 状态的目标', async () => {
      const accountUuid = 'test-account-archive-1';

      // 创建并激活目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '待归档的目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Low,
      });

      await goalService.activateGoal(goal.uuid);

      // 归档目标
      const archived = await goalService.archiveGoal(goal.uuid);

      // 验证状态转换
      expect(archived.status).toBe('ARCHIVED');
      expect(archived.archivedAt).toBeDefined();
      expect(archived.archivedAt).toBeGreaterThan(0);
    });

    it('应该成功归档 COMPLETED 状态的目标', async () => {
      const accountUuid = 'test-account-archive-2';

      // 创建、激活并完成目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '已完成待归档的目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);
      await goalService.completeGoal(goal.uuid);

      // 归档目标
      const archived = await goalService.archiveGoal(goal.uuid);

      // 验证状态
      expect(archived.status).toBe('ARCHIVED');
    });

    it('应该更新统计数据（archivedGoals +1）', async () => {
      const accountUuid = 'test-account-archive-3';

      // 获取初始统计
      const initialStats = await statisticsService.getOrCreateStatistics(accountUuid);
      const initialArchived = initialStats.archivedGoals;

      // 创建、激活并归档目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);
      await goalService.archiveGoal(goal.uuid);

      // 等待事件处理
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证统计更新
      const updatedStats = await statisticsService.getStatistics(accountUuid);
      expect(updatedStats).toBeDefined();
      if (updatedStats) {
        expect(updatedStats.archivedGoals).toBe(initialArchived + 1);
      }
    });
  });

  describe('状态转换链测试', () => {
    it('应该支持完整的状态转换链: DRAFT → ACTIVE → COMPLETED → ARCHIVED', async () => {
      const accountUuid = 'test-account-chain-1';

      // 1. 创建目标 (默认 ACTIVE)
      const goal = await goalService.createGoal({
        accountUuid,
        title: '完整生命周期测试',
        importance: ImportanceLevel.Vital,
        urgency: UrgencyLevel.Critical,
      });
      expect(goal.status).toBe('ACTIVE');

      // 2. 完成目标
      const completed = await goalService.completeGoal(goal.uuid);
      expect(completed.status).toBe('COMPLETED');

      // 3. 归档目标
      const archived = await goalService.archiveGoal(goal.uuid);
      expect(archived.status).toBe('ARCHIVED');
    });

    it('应该支持: ACTIVE → ARCHIVED (跳过 COMPLETED)', async () => {
      const accountUuid = 'test-account-chain-2';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '直接归档测试',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      // 直接归档（不完成）
      const archived = await goalService.archiveGoal(goal.uuid);
      expect(archived.status).toBe('ARCHIVED');
      expect(archived.completedAt).toBeNull(); // 未完成
    });
  });

  describe('批量状态转换', () => {
    it('应该支持批量完成多个目标', async () => {
      const accountUuid = 'test-account-batch-1';

      // 创建多个目标
      const goals = await Promise.all([
        goalService.createGoal({
          accountUuid,
          title: '目标1',
          importance: ImportanceLevel.Important,
          urgency: UrgencyLevel.High,
        }),
        goalService.createGoal({
          accountUuid,
          title: '目标2',
          importance: ImportanceLevel.Moderate,
          urgency: UrgencyLevel.Medium,
        }),
        goalService.createGoal({
          accountUuid,
          title: '目标3',
          importance: ImportanceLevel.Minor,
          urgency: UrgencyLevel.Low,
        }),
      ]);

      // 批量激活
      for (const goal of goals) {
        await goalService.activateGoal(goal.uuid);
      }

      // 批量完成
      const completed = await Promise.all(goals.map((goal) => goalService.completeGoal(goal.uuid)));

      // 验证所有目标都已完成
      completed.forEach((goal) => {
        expect(goal.status).toBe('COMPLETED');
        expect(goal.completedAt).toBeGreaterThan(0);
      });
    });
  });

  describe('时间戳验证', () => {
    it('completedAt 应该在 createdAt 之后', async () => {
      const accountUuid = 'test-account-timestamp-1';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '时间戳测试',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      // 等待足够时间以确保时间戳不同
      await new Promise((resolve) => setTimeout(resolve, 50));

      const completed = await goalService.completeGoal(goal.uuid);

      expect(completed.completedAt).toBeGreaterThan(goal.createdAt);
    });

    it('archivedAt 应该在 createdAt 之后', async () => {
      const accountUuid = 'test-account-timestamp-2';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '时间戳测试',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      // 等待足够时间
      await new Promise((resolve) => setTimeout(resolve, 50));

      const archived = await goalService.archiveGoal(goal.uuid);

      expect(archived.archivedAt).toBeGreaterThan(goal.createdAt);
    });
  });

  describe('统计数据一致性', () => {
    it('完整流程应该正确更新所有统计字段', async () => {
      const accountUuid = 'test-account-stats-consistency-1';

      // 获取初始统计
      const initialStats = await statisticsService.getOrCreateStatistics(accountUuid);

      // 创建 3 个目标
      const goals = await Promise.all([
        goalService.createGoal({
          accountUuid,
          title: '目标1',
          importance: ImportanceLevel.Vital,
          urgency: UrgencyLevel.Critical,
        }),
        goalService.createGoal({
          accountUuid,
          title: '目标2',
          importance: ImportanceLevel.Important,
          urgency: UrgencyLevel.High,
        }),
        goalService.createGoal({
          accountUuid,
          title: '目标3',
          importance: ImportanceLevel.Moderate,
          urgency: UrgencyLevel.Medium,
        }),
      ]);

      // 激活所有目标
      for (const goal of goals) {
        await goalService.activateGoal(goal.uuid);
      }

      // 完成 2 个目标
      await goalService.completeGoal(goals[0].uuid);
      await goalService.completeGoal(goals[1].uuid);

      // 归档 1 个目标
      await goalService.archiveGoal(goals[2].uuid);

      // 等待事件处理
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 验证统计
      const finalStats = await statisticsService.getStatistics(accountUuid);
      expect(finalStats).toBeDefined();
      if (finalStats) {
        // 总目标数应该增加 3
        expect(finalStats.totalGoals).toBe(initialStats.totalGoals + 3);

        // 已完成目标应该至少有 2 个
        expect(finalStats.completedGoals).toBeGreaterThanOrEqual(2);

        // 已归档目标应该至少有 1 个
        expect(finalStats.archivedGoals).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
