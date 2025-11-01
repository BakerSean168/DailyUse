/**
 * 权重快照集成测试
 *
 * 测试场景：
 * 1. 创建权重快照（手动调整）
 * 2. 查询快照历史（按 Goal、按 KR）
 * 3. 获取权重趋势数据
 * 4. 多时间点权重对比
 * 5. 权重总和验证
 * 6. 边界情况和错误处理
 */

import '../../../test/setup-database'; // 导入全局数据库清理钩子
import { describe, it, expect, beforeEach } from 'vitest';
import { WeightSnapshotApplicationService } from '../application/services/WeightSnapshotApplicationService';
import { GoalApplicationService } from '../application/services/GoalApplicationService';
import { GoalContainer } from '../infrastructure/di/GoalContainer';
import { PrismaWeightSnapshotRepository } from '../infrastructure/repositories/PrismaWeightSnapshotRepository';
import { PrismaGoalRepository } from '../infrastructure/repositories/PrismaGoalRepository';
import { getTestPrisma } from '../../../test/helpers/database-helpers';
import { GoalContracts, ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

describe('Weight Snapshot Integration Tests', () => {
  let snapshotService: WeightSnapshotApplicationService;
  let goalService: GoalApplicationService;
  let testAccountUuid: string;
  let testGoalUuid: string;
  let testKR1Uuid: string;
  let testKR2Uuid: string;
  let testKR3Uuid: string;

  beforeEach(async () => {
    // 确保环境变量设置正确
    process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';

    // 数据库清理由setup-database.ts自动处理

    // 预创建测试账户
    const { createTestAccount } = await import('../../../test/helpers/database-helpers');
    testAccountUuid = 'test-account-snapshot-1';
    await createTestAccount({
      uuid: testAccountUuid,
      email: `${testAccountUuid}@test.com`,
      username: testAccountUuid,
    });

    // 获取真实 Prisma 客户端
    const prisma = getTestPrisma();

    // Initialize DI container with real database repositories
    const container = GoalContainer.getInstance();
    container.setGoalRepository(new PrismaGoalRepository(prisma));

    const snapshotRepo = new PrismaWeightSnapshotRepository(prisma);
    const goalRepo = new PrismaGoalRepository(prisma);

    // Get service instances
    goalService = await GoalApplicationService.getInstance();
    snapshotService = WeightSnapshotApplicationService.getInstance(goalRepo, snapshotRepo);

    // Create a goal
    const goal = await goalService.createGoal({
      accountUuid: testAccountUuid,
      title: 'Q4 Growth Target',
      description: 'Quarterly growth objectives',
      importance: ImportanceLevel.Important,
      urgency: UrgencyLevel.High,
    });
    testGoalUuid = goal.uuid;

    // Add 3 key results with weights
    let goalAfterKR1 = await goalService.addKeyResult(testGoalUuid, {
      title: 'User Growth',
      valueType: GoalContracts.KeyResultValueType.INCREMENTAL,
      targetValue: 1000,
      currentValue: 0,
      weight: 40, // 40%
    });
    testKR1Uuid = goalAfterKR1.keyResults![0].uuid; // 从返回的Goal DTO中获取KeyResult UUID

    let goalAfterKR2 = await goalService.addKeyResult(testGoalUuid, {
      title: 'Revenue Growth',
      valueType: GoalContracts.KeyResultValueType.INCREMENTAL,
      targetValue: 100,
      currentValue: 0,
      weight: 30, // 30%
    });
    testKR2Uuid = goalAfterKR2.keyResults![1].uuid; // 第二个KeyResult

    let goalAfterKR3 = await goalService.addKeyResult(testGoalUuid, {
      title: 'Retention Rate',
      valueType: GoalContracts.KeyResultValueType.PERCENTAGE,
      targetValue: 100,
      currentValue: 0,
      weight: 30, // 30%
    });
    testKR3Uuid = goalAfterKR3.keyResults![2].uuid; // 第三个KeyResult
  });

  describe('创建权重快照', () => {
    it('应该成功创建手动调整快照', async () => {
      // Act: Create snapshot when weight changes from 40% to 50%
      const snapshot = await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR1Uuid,
        oldWeight: 40,
        newWeight: 50,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
        reason: 'Adjusted based on Q1 feedback',
      });

      // Assert: Verify snapshot properties
      expect(snapshot).toBeDefined();
      expect(snapshot.uuid).toBeDefined();
      expect(snapshot.goalUuid).toBe(testGoalUuid);
      expect(snapshot.keyResultUuid).toBe(testKR1Uuid);
      expect(snapshot.oldWeight).toBe(40);
      expect(snapshot.newWeight).toBe(50);
      expect(snapshot.weightDelta).toBe(10);
      expect(snapshot.trigger).toBe('manual');
      expect(snapshot.operatorUuid).toBe(testAccountUuid);
      expect(snapshot.reason).toBe('Adjusted based on Q1 feedback');
      expect(snapshot.snapshotTime).toBeDefined();
      expect(snapshot.createdAt).toBeDefined();
    });

    it('应该在没有原因的情况下创建快照', async () => {
      const snapshot = await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR2Uuid,
        oldWeight: 30,
        newWeight: 25,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
      });

      expect(snapshot.reason).toBeUndefined(); // ✅ reason 是 optional,未提供时为 undefined
      expect(snapshot.weightDelta).toBe(-5);
    });

    it('应该在 Goal 不存在时抛出错误', async () => {
      await expect(
        snapshotService.createSnapshot({
          goalUuid: 'non-existent-goal',
          krUuid: testKR1Uuid,
          oldWeight: 40,
          newWeight: 50,
          trigger: 'manual',
          operatorUuid: testAccountUuid,
        }),
      ).rejects.toThrow('Goal not found');
    });

    it('应该在 KR 不属于该 Goal 时抛出错误', async () => {
      await expect(
        snapshotService.createSnapshot({
          goalUuid: testGoalUuid,
          krUuid: 'non-existent-kr',
          oldWeight: 40,
          newWeight: 50,
          trigger: 'manual',
          operatorUuid: testAccountUuid,
        }),
      ).rejects.toThrow('KeyResult not found in Goal');
    });
  });

  describe('查询快照历史', () => {
    beforeEach(async () => {
      // Create some test snapshots
      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR1Uuid,
        oldWeight: 40,
        newWeight: 50,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
        reason: 'First adjustment',
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR1Uuid,
        oldWeight: 50,
        newWeight: 45,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
        reason: 'Second adjustment',
      });

      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR2Uuid,
        oldWeight: 30,
        newWeight: 35,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
      });
    });

    it('应该按 Goal UUID 查询所有快照', async () => {
      const result = await snapshotService.getSnapshotsByGoal(testGoalUuid, {
        page: 1,
        pageSize: 20,
      });

      expect(result.snapshots).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
    });

    it('应该按 KeyResult UUID 查询快照', async () => {
      const result = await snapshotService.getSnapshotsByKeyResult(testKR1Uuid, {
        page: 1,
        pageSize: 20,
      });

      expect(result.snapshots).toHaveLength(2);
      expect(result.snapshots[0].keyResultUuid).toBe(testKR1Uuid);
      expect(result.snapshots[1].keyResultUuid).toBe(testKR1Uuid);
    });

    it('应该按时间倒序返回快照', async () => {
      const result = await snapshotService.getSnapshotsByGoal(testGoalUuid);

      // Verify descending order by snapshotTime
      expect(result.snapshots[0].snapshotTime).toBeGreaterThanOrEqual(
        result.snapshots[1].snapshotTime,
      );
      expect(result.snapshots[1].snapshotTime).toBeGreaterThanOrEqual(
        result.snapshots[2].snapshotTime,
      );
    });

    it('应该支持分页查询', async () => {
      const page1 = await snapshotService.getSnapshotsByGoal(testGoalUuid, {
        page: 1,
        pageSize: 2,
      });

      expect(page1.snapshots).toHaveLength(2);
      expect(page1.pagination.totalPages).toBe(2);

      const page2 = await snapshotService.getSnapshotsByGoal(testGoalUuid, {
        page: 2,
        pageSize: 2,
      });

      expect(page2.snapshots).toHaveLength(1);
    });

    it('应该在没有快照时返回空列表', async () => {
      const newGoal = await goalService.createGoal({
        accountUuid: testAccountUuid,
        title: 'New Goal Without Snapshots',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      const result = await snapshotService.getSnapshotsByGoal(newGoal.uuid);

      expect(result.snapshots).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('权重总和验证', () => {
    it('应该验证权重总和为 100%', async () => {
      const result = await snapshotService.validateWeightSum(testGoalUuid);

      expect(result.isValid).toBe(true);
      expect(result.sum).toBe(100); // 40% + 30% + 30% = 100%
      expect(result.keyResults).toHaveLength(3);
    });

    it('应该在权重总和不为 100% 时返回无效', async () => {
      // Update KR1 weight to 50%, making sum = 110%
      await goalService.updateKeyResult(testGoalUuid, testKR1Uuid, {
        weight: 50,
      });

      const result = await snapshotService.validateWeightSum(testGoalUuid);

      expect(result.isValid).toBe(false);
      expect(result.sum).toBe(110);
    });
  });

  describe('获取权重分布', () => {
    it('应该返回当前权重分布', async () => {
      const distribution = await snapshotService.getWeightDistribution(testGoalUuid);

      expect(distribution).toHaveLength(3);
      expect(distribution[0]).toMatchObject({
        keyResultUuid: testKR1Uuid,
        keyResultName: 'User Growth',
        weight: 40,
      });
      expect(distribution[1]).toMatchObject({
        keyResultUuid: testKR2Uuid,
        keyResultName: 'Revenue Growth',
        weight: 30,
      });
      expect(distribution[2]).toMatchObject({
        keyResultUuid: testKR3Uuid,
        keyResultName: 'Retention Rate',
        weight: 30,
      });
    });
  });

  describe('获取权重趋势数据', () => {
    beforeEach(async () => {
      // Create snapshots at different times for trend analysis
      const baseTime = Date.now();

      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR1Uuid,
        oldWeight: 40,
        newWeight: 45,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR1Uuid,
        oldWeight: 45,
        newWeight: 50,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
      });
    });

    it('应该返回 ECharts 格式的趋势数据', async () => {
      const trend = await snapshotService.getWeightTrend(testGoalUuid, '7d');

      expect(trend).toBeDefined();
      expect(trend.xAxis).toBeDefined(); // Time axis
      expect(trend.series).toBeDefined(); // Weight series per KR
      expect(Array.isArray(trend.series)).toBe(true);
    });
  });

  describe('多时间点权重对比', () => {
    beforeEach(async () => {
      // Create snapshots at multiple time points
      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR1Uuid,
        oldWeight: 40,
        newWeight: 45,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await snapshotService.createSnapshot({
        goalUuid: testGoalUuid,
        krUuid: testKR2Uuid,
        oldWeight: 30,
        newWeight: 25,
        trigger: 'manual',
        operatorUuid: testAccountUuid,
      });
    });

    it('应该返回多时间点的权重对比数据', async () => {
      const snapshots = await snapshotService.getSnapshotsByGoal(testGoalUuid);
      const timePoints = snapshots.snapshots.slice(0, 2).map((s) => s.snapshotTime);

      const comparison = await snapshotService.getWeightComparison(testGoalUuid, timePoints);

      expect(comparison).toBeDefined();
      expect(Array.isArray(comparison.timePoints)).toBe(true);
      expect(comparison.timePoints.length).toBe(2);
      expect(Array.isArray(comparison.keyResults)).toBe(true);
    });

    it('应该限制最多 5 个时间点对比', async () => {
      const tooManyTimePoints = [1, 2, 3, 4, 5, 6].map((n) => Date.now() - n * 86400000);

      await expect(
        snapshotService.getWeightComparison(testGoalUuid, tooManyTimePoints),
      ).rejects.toThrow('Maximum 5 time points allowed');
    });
  });
});
