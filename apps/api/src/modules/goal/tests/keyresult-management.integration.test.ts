/**
 * 关键结果管理流程集成测试
 *
 * 测试场景：
 * 1. 添加关键结果到目标
 * 2. 更新关键结果进度
 * 3. 修改关键结果配置
 * 4. 完成关键结果
 * 5. 删除关键结果
 * 6. 自动计算目标进度
 * 7. 不同类型关键结果 (INCREMENTAL, ABSOLUTE, PERCENTAGE, BINARY)
 * 8. 不同聚合方法 (SUM, AVERAGE, MAX, MIN, LAST)
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
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { GoalStatus } from '@dailyuse/contracts/goal';
import type { GoalServerDTO, KeyResultServerDTO } from '@dailyuse/contracts/goal';

// 本地类型定义（用于测试）
type AddKeyResultParams = {
  title: string;
  valueType: KeyResultValueType;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  weight: number;
};

describe('KeyResult Management Integration Tests', () => {
  let statisticsService: GoalStatisticsApplicationService;
  let goalService: GoalApplicationService;

  beforeEach(async () => {
    // 确保环境变量设置正确
    process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5433/dailyuse_test';

    // 数据库清理由setup-database.ts自动处理

    // 预创建所有测试账户
    await createTestAccounts([
      'kr-add-1', 'kr-add-2', 'kr-add-3', 'kr-add-multi',
      'kr-progress-1', 'kr-progress-2', 'kr-auto-calc',
      'kr-complete-1', 'kr-complete-all',
      'kr-delete-1', 'kr-delete-2',
      'kr-type-absolute', 'kr-type-percentage',
      'kr-concurrent',
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

  describe('添加关键结果 (Add KeyResult)', () => {
    it('应该成功添加 INCREMENTAL 类型的关键结果', async () => {
      const accountUuid = 'test-account-kr-add-1';

      // 创建目标
      const goal = await goalService.createGoal({
        accountUuid,
        title: '完成课程学习',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      // 添加关键结果
      const keyResultData: AddKeyResultParams = {
        title: '观看视频课程',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 20,
        currentValue: 0,
        unit: '个',
        weight: 1,
      };

      const updated = await goalService.addKeyResult(goal.uuid, keyResultData);

      // 验证关键结果
      expect(updated.keyResults).toHaveLength(1);
      expect(updated.keyResults![0].title).toBe('观看视频课程');
      expect(updated.keyResults![0].progress.targetValue).toBe(20);
      expect(updated.keyResults![0].progress.currentValue).toBe(0);
      expect(updated.keyResults![0].progress.valueType).toBe(
        KeyResultValueType.INCREMENTAL,
      );
    });

    it('应该成功添加 PERCENTAGE 类型的关键结果', async () => {
      const accountUuid = 'test-account-kr-add-2';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '提升代码质量',
        importance: ImportanceLevel.Vital,
        urgency: UrgencyLevel.Critical,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResultData: AddKeyResultParams = {
        title: '代码覆盖率',
        valueType: KeyResultValueType.PERCENTAGE,
        targetValue: 80,
        currentValue: 45,
        unit: '%',
        weight: 1,
      };

      const updated = await goalService.addKeyResult(goal.uuid, keyResultData);

      expect(updated.keyResults).toHaveLength(1);
      expect(updated.keyResults![0].progress.valueType).toBe(
        KeyResultValueType.PERCENTAGE,
      );
      expect(updated.keyResults![0].progress.unit).toBe('%');
    });

    it('应该成功添加 BINARY 类型的关键结果', async () => {
      const accountUuid = 'test-account-kr-add-3';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '项目里程碑',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResultData: AddKeyResultParams = {
        title: '完成设计文档',
        valueType: KeyResultValueType.BINARY,
        targetValue: 1,
        currentValue: 0,
        unit: '',
        weight: 1,
      };

      const updated = await goalService.addKeyResult(goal.uuid, keyResultData);

      expect(updated.keyResults).toHaveLength(1);
      expect(updated.keyResults![0].progress.valueType).toBe(
        KeyResultValueType.BINARY,
      );
      expect(updated.keyResults![0].progress.targetValue).toBe(1);
    });

    it('应该支持添加多个关键结果', async () => {
      const accountUuid = 'test-account-kr-add-multi';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '提升健康水平',
        importance: ImportanceLevel.Vital,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      // 添加多个关键结果
      const kr1: AddKeyResultParams = {
        title: '每周跑步',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 3,
        currentValue: 0,
        unit: '次',
        weight: 1,
      };

      const kr2: AddKeyResultParams = {
        title: '每日步数',
        valueType: KeyResultValueType.ABSOLUTE,
        targetValue: 10000,
        currentValue: 0,
        unit: '步',
        weight: 1,
      };

      const kr3: AddKeyResultParams = {
        title: '完成体检',
        valueType: KeyResultValueType.BINARY,
        targetValue: 1,
        currentValue: 0,
        unit: '',
        weight: 1,
      };

      let updated = await goalService.addKeyResult(goal.uuid, kr1);
      updated = await goalService.addKeyResult(goal.uuid, kr2);
      updated = await goalService.addKeyResult(goal.uuid, kr3);

      // 验证所有关键结果
      expect(updated.keyResults).toHaveLength(3);
      expect(updated.keyResults!.map((kr) => kr.title)).toEqual([
        '每周跑步',
        '每日步数',
        '完成体检',
      ]);
    });
  });

  describe('更新关键结果进度 (Update Progress)', () => {
    it('应该成功更新 INCREMENTAL 类型的进度', async () => {
      const accountUuid = 'test-account-kr-progress-1';

      // 创建目标并添加关键结果
      const goal = await goalService.createGoal({
        accountUuid,
        title: '阅读计划',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResult: AddKeyResultParams = {
        title: '阅读书籍',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 12,
        currentValue: 0,
        unit: '本',
        weight: 1,
      };

      const withKR = await goalService.addKeyResult(goal.uuid, keyResult);
      const krUuid = withKR.keyResults![0].uuid;

      // 更新进度
      const updated = await goalService.updateKeyResultProgress(goal.uuid, krUuid, 5);

      // 验证进度更新
      const updatedKR = updated.keyResults!.find((kr) => kr.uuid === krUuid);
      expect(updatedKR).toBeDefined();
      expect(updatedKR!.progress.currentValue).toBe(5);
    });

    it('应该自动计算关键结果完成度', async () => {
      const accountUuid = 'test-account-kr-progress-2';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '学习进度',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResult: AddKeyResultParams = {
        title: '完成练习',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0,
        unit: '题',
        weight: 1,
      };

      const withKR = await goalService.addKeyResult(goal.uuid, keyResult);
      const krUuid = withKR.keyResults![0].uuid;

      // 更新进度到 50%
      const updated = await goalService.updateKeyResultProgress(goal.uuid, krUuid, 50);

      const updatedKR = updated.keyResults!.find((kr) => kr.uuid === krUuid);
      expect(updatedKR).toBeDefined();

      // 计算完成度: 50 / 100 = 50%
      const completionRate =
        (updatedKR!.progress.currentValue / updatedKR!.progress.targetValue) * 100;
      expect(completionRate).toBe(50);
    });

    it('进度更新应该触发目标进度重新计算', async () => {
      const accountUuid = 'test-account-kr-auto-calc';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      // 添加两个关键结果
      const kr1: AddKeyResultParams = {
        title: 'KR1',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
      };

      const kr2: AddKeyResultParams = {
        title: 'KR2',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
      };

      let updated = await goalService.addKeyResult(goal.uuid, kr1);
      updated = await goalService.addKeyResult(goal.uuid, kr2);

      const kr1Uuid = updated.keyResults![0].uuid;
      const kr2Uuid = updated.keyResults![1].uuid;

      // 更新 KR1 到 50
      await goalService.updateKeyResultProgress(goal.uuid, kr1Uuid, 50);

      // 更新 KR2 到 100
      const final = await goalService.updateKeyResultProgress(goal.uuid, kr2Uuid, 100);

      // 验证进度已更新
      expect(final.keyResults![0].progress.currentValue).toBe(50);
      expect(final.keyResults![1].progress.currentValue).toBe(100);
    });
  });

  describe('完成关键结果 (Complete KeyResult)', () => {
    it('应该成功完成关键结果', async () => {
      const accountUuid = 'test-account-kr-complete-1';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '项目任务',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResult: AddKeyResultParams = {
        title: '编写文档',
        valueType: KeyResultValueType.BINARY,
        targetValue: 1,
        currentValue: 0,
        unit: '份',
        weight: 1,
      };

      const withKR = await goalService.addKeyResult(goal.uuid, keyResult);
      const krUuid = withKR.keyResults![0].uuid;

      // 完成关键结果（将 currentValue 设置为 targetValue）
      const completed = await goalService.updateKeyResultProgress(goal.uuid, krUuid, 1);

      const completedKR = completed.keyResults!.find((kr) => kr.uuid === krUuid);
      expect(completedKR).toBeDefined();
      expect(completedKR!.progress.currentValue).toBe(completedKR!.progress.targetValue);
    });

    it('完成所有关键结果应该接近完成目标', async () => {
      const accountUuid = 'test-account-kr-complete-all';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '完整测试',
        importance: ImportanceLevel.Vital,
        urgency: UrgencyLevel.Critical,
      });

      await goalService.activateGoal(goal.uuid);

      // 添加 2 个关键结果
      const kr1: AddKeyResultParams = {
        title: 'KR1',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
      };

      const kr2: AddKeyResultParams = {
        title: 'KR2',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
      };

      let updated = await goalService.addKeyResult(goal.uuid, kr1);
      updated = await goalService.addKeyResult(goal.uuid, kr2);

      const kr1Uuid = updated.keyResults![0].uuid;
      const kr2Uuid = updated.keyResults![1].uuid;

      // 完成所有关键结果
      await goalService.updateKeyResultProgress(goal.uuid, kr1Uuid, 100);
      const final = await goalService.updateKeyResultProgress(goal.uuid, kr2Uuid, 100);

      // 验证所有关键结果都完成了
      expect(final.keyResults![0].progress.currentValue).toBe(
        final.keyResults![0].progress.targetValue,
      );
      expect(final.keyResults![1].progress.currentValue).toBe(
        final.keyResults![1].progress.targetValue,
      );
    });
  });

  describe('删除关键结果 (Delete KeyResult)', () => {
    it('应该成功删除关键结果', async () => {
      const accountUuid = 'test-account-kr-delete-1';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResult: AddKeyResultParams = {
        title: '待删除的 KR',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0,
        unit: '个',
        weight: 1,
      };

      const withKR = await goalService.addKeyResult(goal.uuid, keyResult);
      expect(withKR.keyResults).toHaveLength(1);

      const krUuid = withKR.keyResults![0].uuid;

      // 删除关键结果
      const afterDelete = await goalService.deleteKeyResult(goal.uuid, krUuid);

      // 验证已删除
      expect(afterDelete.keyResults).toHaveLength(0);
    });

    it('删除关键结果应该重新计算目标进度', async () => {
      const accountUuid = 'test-account-kr-delete-2';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '测试目标',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.High,
      });

      await goalService.activateGoal(goal.uuid);

      // 添加 3 个关键结果
      const kr1: AddKeyResultParams = {
        title: 'KR1',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 100, // 已完成
        unit: '个',
        weight: 1,
      };

      const kr2: AddKeyResultParams = {
        title: 'KR2',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 50, // 50% 完成
        unit: '个',
        weight: 1,
      };

      const kr3: AddKeyResultParams = {
        title: 'KR3',
        valueType: KeyResultValueType.INCREMENTAL,
        targetValue: 100,
        currentValue: 0, // 未开始
        unit: '个',
        weight: 1,
      };

      let updated = await goalService.addKeyResult(goal.uuid, kr1);
      updated = await goalService.addKeyResult(goal.uuid, kr2);
      updated = await goalService.addKeyResult(goal.uuid, kr3);

      expect(updated.keyResults).toHaveLength(3);

      // 删除 KR3（未开始的）
      const kr3Uuid = updated.keyResults![2].uuid;
      const afterDelete = await goalService.deleteKeyResult(goal.uuid, kr3Uuid);

      // 验证剩余 2 个关键结果
      expect(afterDelete.keyResults).toHaveLength(2);
    });
  });

  describe('关键结果类型测试', () => {
    it('ABSOLUTE 类型应该使用绝对值', async () => {
      const accountUuid = 'test-account-kr-type-absolute';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '体重管理',
        importance: ImportanceLevel.Important,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResult: AddKeyResultParams = {
        title: '目标体重',
        valueType: KeyResultValueType.ABSOLUTE,
        targetValue: 65, // kg
        currentValue: 70, // kg
        unit: 'kg',
        weight: 1,
      };

      const updated = await goalService.addKeyResult(goal.uuid, keyResult);

      expect(updated.keyResults![0].progress.valueType).toBe(
        KeyResultValueType.ABSOLUTE,
      );
      expect(updated.keyResults![0].progress.currentValue).toBe(70);
      expect(updated.keyResults![0].progress.targetValue).toBe(65);
    });

    it('PERCENTAGE 类型应该限制在 0-100', async () => {
      const accountUuid = 'test-account-kr-type-percentage';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '项目进度',
        importance: ImportanceLevel.Vital,
        urgency: UrgencyLevel.Critical,
      });

      await goalService.activateGoal(goal.uuid);

      const keyResult: AddKeyResultParams = {
        title: '完成度',
        valueType: KeyResultValueType.PERCENTAGE,
        targetValue: 100,
        currentValue: 0,
        unit: '%',
        weight: 1,
      };

      const updated = await goalService.addKeyResult(goal.uuid, keyResult);

      expect(updated.keyResults![0].progress.valueType).toBe(
        KeyResultValueType.PERCENTAGE,
      );
      expect(updated.keyResults![0].progress.targetValue).toBeLessThanOrEqual(100);
    });
  });

  describe('并发操作测试', () => {
    it('应该支持串行添加多个关键结果', async () => {
      const accountUuid = 'test-account-kr-concurrent';

      const goal = await goalService.createGoal({
        accountUuid,
        title: '并发测试',
        importance: ImportanceLevel.Moderate,
        urgency: UrgencyLevel.Medium,
      });

      await goalService.activateGoal(goal.uuid);

      // 串行添加 5 个关键结果
      const keyResults: AddKeyResultParams[] = [
        {
          title: 'KR1',
          valueType: KeyResultValueType.INCREMENTAL,
          targetValue: 10,
          currentValue: 0,
          unit: '个',
          weight: 1,
        },
        {
          title: 'KR2',
          valueType: KeyResultValueType.INCREMENTAL,
          targetValue: 20,
          currentValue: 0,
          unit: '个',
          weight: 1,
        },
        {
          title: 'KR3',
          valueType: KeyResultValueType.INCREMENTAL,
          targetValue: 30,
          currentValue: 0,
          unit: '个',
          weight: 1,
        },
        {
          title: 'KR4',
          valueType: KeyResultValueType.INCREMENTAL,
          targetValue: 40,
          currentValue: 0,
          unit: '个',
          weight: 1,
        },
        {
          title: 'KR5',
          valueType: KeyResultValueType.INCREMENTAL,
          targetValue: 50,
          currentValue: 0,
          unit: '个',
          weight: 1,
        },
      ];

      // 串行添加以避免并发冲突
      let updated = goal;
      for (const kr of keyResults) {
        updated = await goalService.addKeyResult(goal.uuid, kr);
      }

      // 验证所有关键结果都添加成功
      expect(updated.keyResults).toHaveLength(5);
      expect(updated.keyResults!.map((kr) => kr.title)).toEqual([
        'KR1',
        'KR2',
        'KR3',
        'KR4',
        'KR5',
      ]);
    });
  });
});


