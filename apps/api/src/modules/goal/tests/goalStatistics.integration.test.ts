import '../../../test/setup-database'; // 导入全局数据库清理钩子
import { describe, it, expect, beforeEach } from 'vitest';
import { GoalStatisticsApplicationService } from '../application/services/GoalStatisticsApplicationService';
import { GoalApplicationService } from '../application/services/GoalApplicationService';
import { GoalContainer } from '../infrastructure/di/GoalContainer';
import { PrismaGoalStatisticsRepository } from '../infrastructure/repositories/PrismaGoalStatisticsRepository';
import { PrismaGoalRepository } from '../infrastructure/repositories/PrismaGoalRepository';
import { getTestPrisma, createTestAccounts } from '../../../test/helpers/database-helpers';
import { GoalEventPublisher } from '../application/services/GoalEventPublisher';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';

describe('Goal Statistics Integration Tests', () => {
  let statisticsService: GoalStatisticsApplicationService;
  let goalService: GoalApplicationService;

  beforeEach(async () => {
    // 确保环境变量设置正确
    process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';

    // 数据库清理由setup-database.ts自动处理

    // 预创建测试账户（简化的账户ID）
    await createTestAccounts(['123', '456', '789', 'batch', 'recalc', 'perf', 'init', 'delete']);

    // 获取真实 Prisma 客户端
    const prisma = getTestPrisma();

    // Initialize container with real database repositories
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

  describe('Event-driven statistics updates', () => {
    it('should initialize empty statistics for new account', async () => {
      const accountUuid = 'test-account-123';

      // Get or create statistics
      const stats = await statisticsService.getOrCreateStatistics(accountUuid);

      // Verify initial state
      expect(stats).toBeDefined();
      expect(stats.accountUuid).toBe(accountUuid);
      expect(stats.totalGoals).toBe(0);
      expect(stats.activeGoals).toBe(0);
      expect(stats.completedGoals).toBe(0);
    });

    it('should increment statistics when goal is created', async () => {
      const accountUuid = 'test-account-456';

      // Create a goal
      await goalService.createGoal({
        accountUuid,
        title: 'Test Goal 1',
        description: 'Test description',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.None,
      });

      // Wait for event processing (async)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get statistics
      const stats = await statisticsService.getOrCreateStatistics(accountUuid);

      // Verify statistics were updated
      expect(stats.totalGoals).toBe(1);
      expect(stats.activeGoals).toBe(1); // New goals are ACTIVE by default
      expect(stats.completedGoals).toBe(0);
    });

    it('should update statistics when goal is completed', async () => {
      const accountUuid = 'test-account-789';

      // Create a goal
      const goal = await goalService.createGoal({
        accountUuid,
        title: 'Test Goal 2',
        description: 'To be completed',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Medium,
      });

      // Complete the goal
      await goalService.completeGoal(goal.uuid);

      // Wait for event processing (async)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get statistics
      const stats = await statisticsService.getOrCreateStatistics(accountUuid);

      // Verify statistics
      expect(stats.totalGoals).toBe(1);
      expect(stats.activeGoals).toBe(0); // Goal is no longer active
      expect(stats.completedGoals).toBe(1);
    });

    it('should handle recalculation correctly', async () => {
      const accountUuid = 'test-account-recalc';

      // Create multiple goals
      await goalService.createGoal({
        accountUuid,
        title: 'Goal 1',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.None,
      });

      await goalService.createGoal({
        accountUuid,
        title: 'Goal 2',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      // Wait for event processing (async)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Recalculate statistics
      const result = await statisticsService.recalculateStatistics({
        accountUuid,
        force: true,
      });

      // Verify recalculation
      expect(result.success).toBe(true);
      expect(result.statistics.totalGoals).toBe(2);
      expect(result.statistics.activeGoals).toBe(2);
    });
  });

  describe('Performance validation', () => {
    it('should perform O(1) query for statistics', async () => {
      const accountUuid = 'test-account-perf';

      // Initialize statistics
      await statisticsService.initializeStatistics({ accountUuid });

      // Measure query time
      const start = Date.now();
      await statisticsService.getOrCreateStatistics(accountUuid);
      const duration = Date.now() - start;

      // Should be fast (< 50ms even with overhead)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('CRUD operations via Controller endpoints (simulated)', () => {
    it('should initialize statistics from existing goals', async () => {
      const accountUuid = 'test-account-init';

      // Create goals first (before statistics exist)
      await goalService.createGoal({
        accountUuid,
        title: 'Pre-existing Goal 1',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.None,
      });

      await goalService.createGoal({
        accountUuid,
        title: 'Pre-existing Goal 2',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Medium,
      });

      // Wait for event processing (async)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Initialize statistics (like POST /api/goals/statistics/initialize)
      const result = await statisticsService.initializeStatistics({ accountUuid });

      // Verify initialization
      expect(result.success).toBe(true);
      expect(result.statistics.totalGoals).toBe(2);
      expect(result.statistics.activeGoals).toBe(2);
    });

    it('should delete statistics successfully', async () => {
      const accountUuid = 'test-account-delete';

      // Create statistics
      await statisticsService.getOrCreateStatistics(accountUuid);

      // Delete statistics (like DELETE /api/goals/statistics)
      const success = await statisticsService.deleteStatistics(accountUuid);

      // Verify deletion
      expect(success).toBe(true);

      // Verify statistics no longer exist
      const stats = await statisticsService.getStatistics(accountUuid);
      expect(stats).toBeNull();
    });
  });
});

