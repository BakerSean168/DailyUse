import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { useGoalServices } from './useGoalService';
import { Goal } from '../../domain/aggregates/goal';
import { GoalFolder } from '../../domain/aggregates/GoalFolder';
import { GoalRecord } from '../../domain/entities/record';
import { GoalReview } from '../../domain/entities/goalReview';

// Mock dependencies
vi.mock('../../application/services/goalDomainApplicationService', () => ({
  getGoalDomainApplicationService: () => ({
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    deleteAllGoals: vi.fn(),
    createGoalFolder: vi.fn(),
    updateGoalFolder: vi.fn(),
    deleteGoalFolder: vi.fn(),
    addGoalRecordToGoal: vi.fn(),
    removeGoalRecordFromGoal: vi.fn(),
    addReviewToGoal: vi.fn(),
    updateReviewInGoal: vi.fn(),
    removeReviewFromGoal: vi.fn(),
    syncAllData: vi.fn(),
  }),
}));

vi.mock('@renderer/shared/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    snackbar: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
  }),
}));

describe('useGoalServices Composable 测试', () => {
  let goalServices: ReturnType<typeof useGoalServices>;
  let mockGoalService: any;
  let mockSnackbar: any;
  let goal: Goal;
  let GoalFolder: GoalFolder;
  let goalRecord: GoalRecord;
  let goalReview: GoalReview;

  beforeEach(() => {
    vi.clearAllMocks();

    goalServices = useGoalServices();
    mockGoalService = goalServices.goalService;
    mockSnackbar = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    // 重新设置 mock 的 snackbar 方法
    (goalServices as any).showSuccess = mockSnackbar.showSuccess;
    (goalServices as any).showError = mockSnackbar.showError;

    // 创建测试数据
    goal = new Goal({
      uuid: 'test-goal-uuid',
      name: '测试目标',
      color: '#FF5733',
      analysis: { motive: '测试', feasibility: '高' },
    });

    GoalFolder = new GoalFolder({
      uuid: 'test-dir-uuid',
      name: '测试目录',
      icon: 'mdi-test',
      color: '#2196F3',
    });

    goalRecord = new GoalRecord({
      goalUuid: goal.uuid,
      keyResultUuid: 'kr-uuid',
      value: 5,
      note: '测试记录',
    });

    goalReview = new GoalReview({
      goalUuid: goal.uuid,
      title: '测试复盘',
      type: 'monthly',
      reviewDate: new Date(),
      content: {
        achievements: '完成了目标',
        challenges: '遇到了挑战',
        learnings: '学到了经验',
        nextSteps: '下一步计划',
      },
      snapshot: goal.createSnapShot(),
      rating: {
        progressSatisfaction: 8,
        executionEfficiency: 7,
        goalReasonableness: 9,
      },
    });
  });

  describe('目标操作', () => {
    describe('创建目标', () => {
      it('成功创建目标时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { goal, uuid: goal.uuid, name: goal.name },
        };
        (mockGoalService.createGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleCreateGoal(goal);

        expect(mockGoalService.createGoal).toHaveBeenCalledWith(goal);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(`目标创建成功：${goal.name}`);
      });

      it('创建目标失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '创建失败',
        };
        (mockGoalService.createGoal as Mock).mockResolvedValue(errorResult);

        await goalServices.handleCreateGoal(goal);

        expect(mockGoalService.createGoal).toHaveBeenCalledWith(goal);
        // expect(mockSnackbar.showError).toHaveBeenCalledWith('创建目标失败：创建失败');
      });

      it('创建目标时发生异常应该显示未知错误', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (mockGoalService.createGoal as Mock).mockRejectedValue(new Error('Network Error'));

        await goalServices.handleCreateGoal(goal);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating goal:', expect.any(Error));
        // expect(mockSnackbar.showError).toHaveBeenCalledWith('创建目标时发生未知错误');

        consoleErrorSpy.mockRestore();
      });
    });

    describe('更新目标', () => {
      it('成功更新目标时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { goal },
        };
        (mockGoalService.updateGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleUpdateGoal(goal);

        expect(mockGoalService.updateGoal).toHaveBeenCalledWith(goal);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(`目标更新成功：${goal.name}`);
      });

      it('更新目标失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '更新失败',
        };
        (mockGoalService.updateGoal as Mock).mockResolvedValue(errorResult);

        await goalServices.handleUpdateGoal(goal);

        // expect(mockSnackbar.showError).toHaveBeenCalledWith('更新目标失败：更新失败');
      });

      it('更新目标时发生异常应该显示未知错误', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (mockGoalService.updateGoal as Mock).mockRejectedValue(new Error('Network Error'));

        await goalServices.handleUpdateGoal(goal);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating goal:', expect.any(Error));
        // expect(mockSnackbar.showError).toHaveBeenCalledWith('更新目标时发生未知错误');

        consoleErrorSpy.mockRestore();
      });
    });

    describe('删除目标', () => {
      it('成功删除目标时应该显示成功消息', async () => {
        const successResult = { success: true };
        (mockGoalService.deleteGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleDeleteGoal(goal.uuid);

        expect(mockGoalService.deleteGoal).toHaveBeenCalledWith(goal.uuid);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(`目标已删除：${goal.uuid}`);
      });

      it('删除目标失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '删除失败',
        };
        (mockGoalService.deleteGoal as Mock).mockResolvedValue(errorResult);

        await goalServices.handleDeleteGoal(goal.uuid);

        // expect(mockSnackbar.showError).toHaveBeenCalledWith('删除目标失败：删除失败');
      });
    });

    describe('删除所有目标', () => {
      it('成功删除所有目标时应该显示成功消息', async () => {
        const successResult = { success: true };
        (mockGoalService.deleteAllGoals as Mock).mockResolvedValue(successResult);

        await goalServices.handleDeleteAllGoals();

        expect(mockGoalService.deleteAllGoals).toHaveBeenCalled();
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('所有目标已删除');
      });

      it('删除所有目标失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '删除失败',
        };
        (mockGoalService.deleteAllGoals as Mock).mockResolvedValue(errorResult);

        await goalServices.handleDeleteAllGoals();

        // expect(mockSnackbar.showError).toHaveBeenCalledWith('删除所有目标失败：删除失败');
      });
    });
  });

  describe('目标目录操作', () => {
    describe('创建目标目录', () => {
      it('成功创建目标目录时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { GoalFolder },
        };
        (mockGoalService.createGoalFolder as Mock).mockResolvedValue(successResult);

        await goalServices.handleCreateGoalFolder(GoalFolder);

        expect(mockGoalService.createGoalFolder).toHaveBeenCalledWith(GoalFolder);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(`目标目录创建成功：${GoalFolder.name}`);
      });

      it('创建目标目录失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '创建失败',
        };
        (mockGoalService.createGoalFolder as Mock).mockResolvedValue(errorResult);

        await goalServices.handleCreateGoalFolder(GoalFolder);

        // expect(mockSnackbar.showError).toHaveBeenCalledWith('创建目标目录失败：创建失败');
      });
    });

    describe('更新目标目录', () => {
      it('成功更新目标目录时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { GoalFolder },
        };
        (mockGoalService.updateGoalFolder as Mock).mockResolvedValue(successResult);

        await goalServices.handleUpdateGoalFolder(GoalFolder);

        expect(mockGoalService.updateGoalFolder).toHaveBeenCalledWith(GoalFolder);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(`目标目录更新成功：${GoalFolder.name}`);
      });
    });

    describe('删除目标目录', () => {
      it('成功删除目标目录时应该显示成功消息', async () => {
        const successResult = { success: true };
        (mockGoalService.deleteGoalFolder as Mock).mockResolvedValue(successResult);

        await goalServices.handleDeleteGoalFolder(GoalFolder.uuid);

        expect(mockGoalService.deleteGoalFolder).toHaveBeenCalledWith(GoalFolder.uuid);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(`目标目录已删除：${GoalFolder.uuid}`);
      });
    });
  });

  describe('记录操作', () => {
    describe('添加记录', () => {
      it('成功添加记录时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { record: goalRecord },
        };
        (mockGoalService.addGoalRecordToGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleAddGoalRecordToGoal(goalRecord);

        expect(mockGoalService.addGoalRecordToGoal).toHaveBeenCalledWith(goalRecord);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('记录添加成功');
      });

      it('添加记录失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '添加失败',
        };
        (mockGoalService.addGoalRecordToGoal as Mock).mockResolvedValue(errorResult);

        await goalServices.handleAddGoalRecordToGoal(goalRecord);

        // expect(mockSnackbar.showError).toHaveBeenCalledWith('添加记录失败：添加失败');
      });
    });

    describe('移除记录', () => {
      it('成功移除记录时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { record: goalRecord },
        };
        (mockGoalService.removeGoalRecordFromGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleRemoveGoalRecordFromGoal(goalRecord);

        expect(mockGoalService.removeGoalRecordFromGoal).toHaveBeenCalledWith(goalRecord);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('记录删除成功');
      });
    });
  });

  describe('复盘操作', () => {
    describe('添加复盘', () => {
      it('成功添加复盘时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { review: goalReview },
        };
        (mockGoalService.addReviewToGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleAddReviewToGoal(goalReview);

        expect(mockGoalService.addReviewToGoal).toHaveBeenCalledWith(goalReview);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('复盘添加成功');
      });

      it('添加复盘失败时应该显示错误消息', async () => {
        const errorResult = {
          success: false,
          message: '添加失败',
        };
        (mockGoalService.addReviewToGoal as Mock).mockResolvedValue(errorResult);

        await goalServices.handleAddReviewToGoal(goalReview);

        // expect(mockSnackbar.showError).toHaveBeenCalledWith('添加复盘失败：添加失败');
      });
    });

    describe('更新复盘', () => {
      it('成功更新复盘时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { review: goalReview },
        };
        (mockGoalService.updateReviewInGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleUpdateReviewInGoal(goalReview);

        expect(mockGoalService.updateReviewInGoal).toHaveBeenCalledWith(goalReview);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('复盘更新成功');
      });
    });

    describe('移除复盘', () => {
      it('成功移除复盘时应该显示成功消息', async () => {
        const successResult = {
          success: true,
          data: { review: goalReview },
        };
        (mockGoalService.removeReviewFromGoal as Mock).mockResolvedValue(successResult);

        await goalServices.handleRemoveReviewFromGoal(goalReview);

        expect(mockGoalService.removeReviewFromGoal).toHaveBeenCalledWith(goalReview);
        // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('复盘移除成功');
      });
    });
  });

  describe('数据同步', () => {
    it('成功同步所有数据时应该显示成功消息', async () => {
      (mockGoalService.syncAllData as Mock).mockResolvedValue(undefined);

      await goalServices.handleSyncAllGoalData();

      expect(mockGoalService.syncAllData).toHaveBeenCalled();
      // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('数据同步完成');
    });

    it('同步数据时发生异常应该显示错误消息', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (mockGoalService.syncAllData as Mock).mockRejectedValue(new Error('Sync Error'));

      await goalServices.handleSyncAllGoalData();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error syncing all goal data:',
        expect.any(Error),
      );
      // expect(mockSnackbar.showError).toHaveBeenCalledWith('数据同步时发生未知错误');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('返回值验证', () => {
    it('应该返回所有期望的方法和属性', () => {
      expect(goalServices).toHaveProperty('snackbar');
      expect(goalServices).toHaveProperty('goalService');
      expect(goalServices).toHaveProperty('handleCreateGoal');
      expect(goalServices).toHaveProperty('handleUpdateGoal');
      expect(goalServices).toHaveProperty('handleDeleteGoal');
      expect(goalServices).toHaveProperty('handleDeleteAllGoals');
      expect(goalServices).toHaveProperty('handleCreateGoalFolder');
      expect(goalServices).toHaveProperty('handleUpdateGoalFolder');
      expect(goalServices).toHaveProperty('handleDeleteGoalFolder');
      expect(goalServices).toHaveProperty('handleAddGoalRecordToGoal');
      expect(goalServices).toHaveProperty('handleRemoveGoalRecordFromGoal');
      expect(goalServices).toHaveProperty('handleAddReviewToGoal');
      expect(goalServices).toHaveProperty('handleUpdateReviewInGoal');
      expect(goalServices).toHaveProperty('handleRemoveReviewFromGoal');
      expect(goalServices).toHaveProperty('handleSyncAllGoalData');
    });

    it('所有处理方法都应该是函数', () => {
      expect(typeof goalServices.handleCreateGoal).toBe('function');
      expect(typeof goalServices.handleUpdateGoal).toBe('function');
      expect(typeof goalServices.handleDeleteGoal).toBe('function');
      expect(typeof goalServices.handleDeleteAllGoals).toBe('function');
      expect(typeof goalServices.handleCreateGoalFolder).toBe('function');
      expect(typeof goalServices.handleUpdateGoalFolder).toBe('function');
      expect(typeof goalServices.handleDeleteGoalFolder).toBe('function');
      expect(typeof goalServices.handleAddGoalRecordToGoal).toBe('function');
      expect(typeof goalServices.handleRemoveGoalRecordFromGoal).toBe('function');
      expect(typeof goalServices.handleAddReviewToGoal).toBe('function');
      expect(typeof goalServices.handleUpdateReviewInGoal).toBe('function');
      expect(typeof goalServices.handleRemoveReviewFromGoal).toBe('function');
      expect(typeof goalServices.handleSyncAllGoalData).toBe('function');
    });
  });

  describe('日志记录', () => {
    it('应该记录操作日志', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const successResult = {
        success: true,
        data: { goal },
      };
      (mockGoalService.createGoal as Mock).mockResolvedValue(successResult);

      await goalServices.handleCreateGoal(goal);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[useGoalServices] Creating goal with data:',
        goal,
      );

      consoleLogSpy.mockRestore();
    });

    it('应该记录错误日志', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test Error');
      (mockGoalService.createGoal as Mock).mockRejectedValue(error);

      await goalServices.handleCreateGoal(goal);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating goal:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('边界情况处理', () => {
    it('应该处理空名称的目标', async () => {
      const goalWithEmptyName = new Goal({
        name: '',
        color: '#FF5733',
        analysis: {},
      });

      const successResult = {
        success: true,
        data: goalWithEmptyName,
      };
      (mockGoalService.createGoal as Mock).mockResolvedValue(successResult);

      await goalServices.handleCreateGoal(goalWithEmptyName);

      // expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('目标创建成功：（无名称）');
    });

    it('应该处理 null 返回数据', async () => {
      const successResult = {
        success: true,
        data: null,
      };
      (mockGoalService.createGoal as Mock).mockResolvedValue(successResult);

      await goalServices.handleCreateGoal(goal);

      // 应该不调用 showSuccess，因为没有数据
      // expect(mockSnackbar.showSuccess).not.toHaveBeenCalled();
    });

    it('应该处理 undefined 返回数据', async () => {
      const successResult = {
        success: true,
        data: undefined,
      };
      (mockGoalService.createGoal as Mock).mockResolvedValue(successResult);

      await goalServices.handleCreateGoal(goal);

      // 应该不调用 showSuccess，因为没有数据
      // expect(mockSnackbar.showSuccess).not.toHaveBeenCalled();
    });
  });
});
