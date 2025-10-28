import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGoalStore } from './goalStore';
import { Goal } from '../../domain/aggregates/goal';
import { GoalFolder } from '../../domain/aggregates/GoalFolder';
import { KeyResult } from '../../domain/entities/keyResult';
import { GoalRecord } from '../../domain/entities/record';
import { SYSTEM_GOAL_DIRS } from '@common/modules/goal/types/goal';

// Mock the common module
vi.mock('@common/modules/goal/types/goal', () => ({
  SYSTEM_GOAL_DIRS: {
    ALL: { uuid: 'system_all' },
    ARCHIVED: { uuid: 'system_archived' },
    DELETED: { uuid: 'system_deleted' },
  },
}));

describe('useGoalStore 测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      const store = useGoalStore();

      expect(store.goals).toEqual([]);
      expect(store.GoalFolders).toEqual([]);
    });
  });

  describe('目标管理', () => {
    let store: ReturnType<typeof useGoalStore>;
    let goal1: Goal;
    let goal2: Goal;
    let keyResult: KeyResult;

    beforeEach(() => {
      store = useGoalStore();

      // 创建测试数据
      goal1 = new Goal({
        uuid: 'goal-1',
        name: '减肥目标',
        color: '#FF5733',
        analysis: { motive: '健康', feasibility: '高' },
        dirUuid: 'dir-1',
      });

      goal2 = new Goal({
        uuid: 'goal-2',
        name: '学习目标',
        color: '#33FF57',
        analysis: { motive: '提升', feasibility: '中' },
        dirUuid: 'dir-2',
      });

      keyResult = new KeyResult({
        name: '减重10斤',
        startValue: 70,
        targetValue: 60,
        currentValue: 65,
        calculationMethod: 'sum',
        weight: 5,
      });

      goal1.addKeyResult(keyResult);

      // 添加记录
      const record = new GoalRecord({
        goalUuid: goal1.uuid,
        keyResultUuid: keyResult.uuid,
        value: 2,
      });
      goal1.addGoalRecord(record);
    });

    describe('目标同步', () => {
      it('应该能够同步单个目标状态', async () => {
        await store.syncGoalState(goal1);

        expect(store.goals).toHaveLength(1);
        expect(store.goals[0].uuid).toBe(goal1.uuid);
        expect(store.goals[0].name).toBe(goal1.name);
      });

      it('应该能够更新已存在的目标', async () => {
        await store.syncGoalState(goal1);

        // 修改目标并重新同步
        goal1.name = '修改后的目标名称';
        await store.syncGoalState(goal1);

        expect(store.goals).toHaveLength(1);
        expect(store.goals[0].name).toBe('修改后的目标名称');
      });

      it('应该能够同步多个目标状态', async () => {
        const goals = [goal1, goal2];
        await store.syncGoalsState(goals);

        expect(store.goals).toHaveLength(2);
        expect(store.goals.map((g) => g.uuid)).toContain(goal1.uuid);
        expect(store.goals.map((g) => g.uuid)).toContain(goal2.uuid);
      });

      it('应该能够移除目标', () => {
        store.goals.push(goal1, goal2);

        store.removeGoal(goal1.uuid);

        expect(store.goals).toHaveLength(1);
        expect(store.goals[0].uuid).toBe(goal2.uuid);
      });
    });

    describe('目标查询 - Getters', () => {
      beforeEach(async () => {
        await store.syncGoalsState([goal1, goal2]);
      });

      it('getAllGoals 应该返回所有目标', () => {
        const allGoals = store.getAllGoals;

        expect(allGoals).toHaveLength(2);
        expect(allGoals.every((g) => g instanceof Goal || Goal.isGoal(g))).toBe(true);
      });

      it('getGoalByUuid 应该根据UUID查找目标', () => {
        const foundGoal = store.getGoalByUuid(goal1.uuid);

        expect(foundGoal).toBeTruthy();
        expect(foundGoal?.uuid).toBe(goal1.uuid);
        expect(foundGoal?.name).toBe(goal1.name);
      });

      it('getGoalByUuid 对不存在的UUID应该返回null', () => {
        const foundGoal = store.getGoalByUuid('non-existent-uuid');

        expect(foundGoal).toBeNull();
      });

      it('getGoalsByDirUuid 应该根据目录UUID过滤目标', () => {
        const goalsInDir1 = store.getGoalsByDirUuid('dir-1');

        expect(goalsInDir1).toHaveLength(1);
        expect(goalsInDir1[0].uuid).toBe(goal1.uuid);
      });

      it('getGoalsByDirUuid 对于"全部"目录应该返回非归档目标', () => {
        // 归档一个目标
        goal2.archive();
        store.syncGoalState(goal2);

        const allGoals = store.getGoalsByDirUuid(SYSTEM_GOAL_DIRS.ALL.uuid);

        expect(allGoals).toHaveLength(1);
        expect(allGoals[0].uuid).toBe(goal1.uuid);
      });

      it('getGoalsByDirUuid 对于"已归档"目录应该只返回已归档目标', () => {
        goal2.archive();
        store.syncGoalState(goal2);

        const archivedGoals = store.getGoalsByDirUuid(SYSTEM_GOAL_DIRS.ARCHIVED.uuid);

        expect(archivedGoals).toHaveLength(1);
        expect(archivedGoals[0].uuid).toBe(goal2.uuid);
      });

      it('getActiveGoals 应该只返回活跃目标', () => {
        goal2.complete();
        store.syncGoalState(goal2);

        const activeGoals = store.getActiveGoals;

        expect(activeGoals).toHaveLength(1);
        expect(activeGoals[0].uuid).toBe(goal1.uuid);
        expect(activeGoals[0].lifecycle.status).toBe('active');
      });

      it('getInProgressGoals 应该返回活跃和暂停的目标', () => {
        goal2.pause();
        store.syncGoalState(goal2);

        const inProgressGoals = store.getInProgressGoals;

        expect(inProgressGoals).toHaveLength(2);
        expect(inProgressGoals.map((g) => g.lifecycle.status)).toEqual(
          expect.arrayContaining(['active', 'paused']),
        );
      });
    });

    describe('记录查询 - Getters', () => {
      beforeEach(async () => {
        await store.syncGoalState(goal1);
      });

      it('getAllGoalRecords 应该返回所有记录', () => {
        const allRecords = store.getAllGoalRecords;

        expect(allRecords).toHaveLength(1);
        expect(allRecords?.[0]).toHaveProperty('goalUuid');
        expect(allRecords?.[0]).toHaveProperty('keyResultUuid');
      });

      it('getGoalRecordsBygoalUuid 应该根据目标UUID返回记录', () => {
        const records = store.getGoalRecordsBygoalUuid(goal1.uuid);

        expect(records).toHaveLength(1);
        expect(records[0].goalUuid).toBe(goal1.uuid);
      });

      it('getGoalRecordsByKeyResultUuid 应该根据关键结果UUID返回记录', () => {
        const records = store.getGoalRecordsByKeyResultUuid(keyResult.uuid);

        expect(records).toHaveLength(1);
        expect(records[0].keyResultUuid).toBe(keyResult.uuid);
      });

      it('getTodayGoalRecordCount 应该正确计算今日记录数', () => {
        const todayCount = store.getTodayGoalRecordCount;

        expect(todayCount).toBe(1); // 我们添加了一个记录
      });
    });
  });

  describe('目标目录管理', () => {
    let store: ReturnType<typeof useGoalStore>;
    let dir1: GoalFolder;
    let dir2: GoalFolder;
    let systemAllDir: GoalFolder;
    let systemArchivedDir: GoalFolder;

    beforeEach(() => {
      store = useGoalStore();

      dir1 = new GoalFolder({
        uuid: 'dir-1',
        name: '工作目标',
        icon: 'mdi-briefcase',
        color: '#2196F3',
      });

      dir2 = new GoalFolder({
        uuid: 'dir-2',
        name: '学习目标',
        icon: 'mdi-school',
        color: '#4CAF50',
      });

      systemAllDir = new GoalFolder({
        uuid: SYSTEM_GOAL_DIRS.ALL.uuid,
        name: '全部',
        icon: 'mdi-folder-multiple',
        color: '#9E9E9E',
      });

      systemArchivedDir = new GoalFolder({
        uuid: SYSTEM_GOAL_DIRS.ARCHIVED.uuid,
        name: '已归档',
        icon: 'mdi-archive',
        color: '#607D8B',
      });
    });

    describe('目录同步', () => {
      it('应该能够同步单个目录状态', async () => {
        await store.syncGoalFolderState(dir1);

        expect(store.GoalFolders).toHaveLength(1);
        expect(store.GoalFolders[0].uuid).toBe(dir1.uuid);
        expect(store.GoalFolders[0].name).toBe(dir1.name);
      });

      it('应该能够更新已存在的目录', async () => {
        await store.syncGoalFolderState(dir1);

        dir1.name = '修改后的目录名称';
        await store.syncGoalFolderState(dir1);

        expect(store.GoalFolders).toHaveLength(1);
        expect(store.GoalFolders[0].name).toBe('修改后的目录名称');
      });

      it('应该能够同步多个目录状态', async () => {
        const dirs = [dir1, dir2, systemAllDir];
        await store.syncGoalFoldersState(dirs);

        expect(store.GoalFolders).toHaveLength(3);
        expect(store.GoalFolders.map((d) => d.uuid)).toContain(dir1.uuid);
        expect(store.GoalFolders.map((d) => d.uuid)).toContain(dir2.uuid);
        expect(store.GoalFolders.map((d) => d.uuid)).toContain(systemAllDir.uuid);
      });

      it('应该能够移除目录', () => {
        store.GoalFolders.push(dir1, dir2);

        store.removeGoalFolder(dir1.uuid);

        expect(store.GoalFolders).toHaveLength(1);
        expect(store.GoalFolders[0].uuid).toBe(dir2.uuid);
      });
    });

    describe('目录查询 - Getters', () => {
      beforeEach(async () => {
        await store.syncGoalFoldersState([systemAllDir, dir1, dir2]);
      });

      it('getAllGoalFolders 应该正确排序目录', () => {
        const allDirs = store.getAllGoalFolders;

        expect(allDirs).toHaveLength(3);
        // "全部" 目录应该在最前面
        expect(allDirs[0].uuid).toBe(SYSTEM_GOAL_DIRS.ALL.uuid);
        // 用户目录按名称排序
        expect(allDirs[1].name).toBe('工作目标');
        expect(allDirs[2].name).toBe('学习目标');
      });

      it('getAllGoalFolders 在有归档目标时应该显示已归档目录', async () => {
        // 添加归档目标
        const archivedGoal = new Goal({
          name: '归档目标',
          color: '#FF5733',
          analysis: {},
        });
        archivedGoal.archive();
        await store.syncGoalState(archivedGoal);

        // 添加已归档目录
        await store.syncGoalFolderState(systemArchivedDir);

        const allDirs = store.getAllGoalFolders;

        expect(allDirs.map((d) => d.uuid)).toContain(SYSTEM_GOAL_DIRS.ARCHIVED.uuid);
        // 已归档目录应该在最后
        expect(allDirs[allDirs.length - 1].uuid).toBe(SYSTEM_GOAL_DIRS.ARCHIVED.uuid);
      });

      it('getGoalFolderById 应该根据UUID查找目录', () => {
        const foundDir = store.getGoalFolderById(dir1.uuid);

        expect(foundDir).toBeTruthy();
        expect(foundDir?.uuid).toBe(dir1.uuid);
        expect(foundDir?.name).toBe(dir1.name);
      });

      it('getGoalFolderById 对不存在的UUID应该返回undefined', () => {
        const foundDir = store.getGoalFolderById('non-existent-uuid');

        expect(foundDir).toBeUndefined();
      });

      it('isSystemGoalFolder 应该正确识别系统目录', () => {
        expect(store.isSystemGoalFolder(SYSTEM_GOAL_DIRS.ALL.uuid)).toBe(true);
        expect(store.isSystemGoalFolder(SYSTEM_GOAL_DIRS.ARCHIVED.uuid)).toBe(true);
        expect(store.isSystemGoalFolder(SYSTEM_GOAL_DIRS.DELETED.uuid)).toBe(true);
        expect(store.isSystemGoalFolder('user-dir-uuid')).toBe(false);
      });
    });
  });

  describe('统计功能', () => {
    let store: ReturnType<typeof useGoalStore>;

    beforeEach(() => {
      store = useGoalStore();
    });

    it('getGoalsCountByDirUuid 应该正确计算目录下的目标数量', () => {
      const goal1 = new Goal({
        uuid: 'goal-1',
        name: '目标1',
        color: '#FF5733',
        analysis: {},
        dirUuid: 'dir-1',
      });

      const goal2 = new Goal({
        uuid: 'goal-2',
        name: '目标2',
        color: '#FF5733',
        analysis: {},
        dirUuid: 'dir-1',
      });

      const goal3 = new Goal({
        uuid: 'goal-3',
        name: '目标3',
        color: '#FF5733',
        analysis: {},
        dirUuid: 'dir-2',
      });

      store.goals = [goal1, goal2, goal3];

      expect(store.getGoalsCountByDirUuid('dir-1')).toBe(2);
      expect(store.getGoalsCountByDirUuid('dir-2')).toBe(1);
      expect(store.getGoalsCountByDirUuid('non-existent-dir')).toBe(0);
    });

    it('getGoalsCountByDirUuid 对于"全部"目录应该返回所有目标数量', () => {
      const goal1 = new Goal({
        name: '目标1',
        color: '#FF5733',
        analysis: {},
      });

      const goal2 = new Goal({
        name: '目标2',
        color: '#FF5733',
        analysis: {},
      });

      store.goals = [goal1, goal2];

      expect(store.getGoalsCountByDirUuid(SYSTEM_GOAL_DIRS.ALL.uuid)).toBe(2);
    });
  });

  describe('错误处理', () => {
    let store: ReturnType<typeof useGoalStore>;

    beforeEach(() => {
      store = useGoalStore();
    });

    it('syncGoalState 应该处理错误并继续执行', async () => {
      const goal = new Goal({
        name: '测试目标',
        color: '#FF5733',
        analysis: {},
      });

      // 模拟控制台警告
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await store.syncGoalState(goal);
        expect(store.goals).toHaveLength(1);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('syncGoalFolderState 应该处理错误并继续执行', async () => {
      const dir = new GoalFolder({
        name: '测试目录',
        icon: 'mdi-test',
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await store.syncGoalFolderState(dir);
        expect(store.GoalFolders).toHaveLength(1);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('数据一致性', () => {
    let store: ReturnType<typeof useGoalStore>;

    beforeEach(() => {
      store = useGoalStore();
    });

    it('getAllGoals 应该确保返回的都是 Goal 实例', () => {
      const goal = new Goal({
        name: '测试目标',
        color: '#FF5733',
        analysis: {},
      });

      store.goals = [goal];

      const allGoals = store.getAllGoals;
      expect(allGoals).toHaveLength(1);
      expect(Goal.isGoal(allGoals[0])).toBe(true);
    });

    it('应该处理损坏的目标数据', () => {
      // 模拟损坏的数据
      const corruptedGoal = {
        uuid: 'corrupted',
        name: null, // 无效数据
        color: '#FF5733',
      } as any;

      store.goals = [corruptedGoal];

      const allGoals = store.getAllGoals;
      expect(allGoals).toHaveLength(0); // 损坏的数据应该被过滤掉
    });
  });
});
