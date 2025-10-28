import { defineStore } from 'pinia';
import { Goal } from '../../domain/aggregates/goal';
import { GoalFolder } from '../../domain/aggregates/GoalFolder';
import { GoalRecord } from '../../domain/entities/record';
import { SYSTEM_GOAL_DIRS } from '@common/modules/goal/types/goal';

/**
 * 精简的目标 Pinia Store - 纯状态管理版本
 */
export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as Goal[],
    GoalFolders: [] as GoalFolder[],
  }),

  getters: {
    // ========== 目标查询 ==========

    getAllGoals(): Goal[] {
      const goalsInState = this.goals;
      const goals: Goal[] = [];
      for (const goal of goalsInState) {
        const ensuredGoal = Goal.ensureGoal(goal);
        if (ensuredGoal) {
          goals.push(ensuredGoal);
        }
      }
      return goals.length > 0 ? goals : [];
    },

    getGoalByUuid:
      (state) =>
      (uuid: string): Goal | null => {
        const goal = state.goals.find((g) => g.uuid === uuid);
        return goal ? Goal.ensureGoal(goal) : null;
      },

    /**
     * 根据目录ID获取目标
     */
    getGoalsByDirUuid: (state) => (dirUuid: string) => {
      if (dirUuid === SYSTEM_GOAL_DIRS.ALL.uuid || dirUuid === 'all') {
        // "全部" 文件夹显示所有活跃和完成的目标，排除已归档的
        return state.goals.filter(
          (g) =>
            g.lifecycle.status === 'active' ||
            g.lifecycle.status === 'completed' ||
            g.lifecycle.status === 'paused',
        );
      }

      if (dirUuid === SYSTEM_GOAL_DIRS.ARCHIVED.uuid) {
        // "已归档" 文件夹只显示已归档的目标
        return state.goals.filter((g) => g.lifecycle.status === 'archived');
      }

      if (dirUuid === SYSTEM_GOAL_DIRS.DELETED.uuid) {
        // "已删除" 文件夹 - 预留功能，当前返回空数组
        // 当类型支持 'deleted' 状态时，可以返回已删除的目标
        return [];
      }

      // 用户自定义文件夹，显示该文件夹下的非归档目标
      return state.goals.filter((g) => g.dirUuid === dirUuid && g.lifecycle.status !== 'archived');
    },

    getActiveGoals: (state) => {
      return state.goals.filter((g) => g.lifecycle.status === 'active');
    },

    getInProgressGoals: (state) => {
      return state.goals.filter(
        (g) => g.lifecycle.status === 'active' || g.lifecycle.status === 'paused',
      );
    },

    getTodayGoalRecordCount: (state) => {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

      let todayGoalRecordCount = 0;
      for (const goal of state.goals) {
        for (const record of goal.records) {
          if (
            record.lifecycle.createdAt.getTime() >= todayStart &&
            record.lifecycle.createdAt.getTime() <= todayEnd
          ) {
            todayGoalRecordCount++;
          }
        }
      }
      return todayGoalRecordCount;
    },

    // ========== 记录查询（通过目标获取）==========

    getAllGoalRecords(): GoalRecord[] | null {
      const records = this.goals.flatMap((g) => g.records);
      const ensuredGoalRecords = records.map((record) =>
        GoalRecord.ensureGoalRecordNeverNull(record),
      );
      return ensuredGoalRecords.length > 0 ? ensuredGoalRecords : null;
    },

    getGoalRecordsBygoalUuid: (state) => (goalUuid: string) => {
      const goal = state.goals.find((g) => g.uuid === goalUuid);
      return goal?.records || [];
    },

    getGoalRecordsByKeyResultUuid: (state) => (keyResultUuid: string) => {
      return state.goals.flatMap((g) => g.records).filter((r) => r.keyResultUuid === keyResultUuid);
    },

    // ========== 目标目录查询 ==========

    /**
     * 获取所有目标目录（按显示规则排序）
     * - "全部" 文件夹始终显示在最上方
     * - 用户自定义文件夹显示在中间
     * - "已删除" 和 "已归档" 文件夹在有数据时显示在最下方
     */
    getAllGoalFolders(): GoalFolder[] {
      const systemDirs = this.GoalFolders.filter(
        (dir) =>
          dir.uuid === SYSTEM_GOAL_DIRS.ALL.uuid ||
          dir.uuid === SYSTEM_GOAL_DIRS.DELETED.uuid ||
          dir.uuid === SYSTEM_GOAL_DIRS.ARCHIVED.uuid,
      );

      const userDirs = this.GoalFolders.filter((dir) => !systemDirs.includes(dir));

      const hasArchivedGoals = this.goals.some((goal) => goal.lifecycle.status === 'archived');

      const result: GoalFolder[] = [];

      // 1. 添加 "全部" 文件夹（始终显示在最上方）
      const allDir = systemDirs.find((dir) => dir.uuid === SYSTEM_GOAL_DIRS.ALL.uuid);
      if (allDir) {
        result.push(GoalFolder.ensureGoalFolderNeverNull(allDir));
      }

      // 2. 添加用户自定义文件夹（按名称排序）
      result.push(
        ...userDirs
          .sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
          })
          .map((dir) => GoalFolder.ensureGoalFolderNeverNull(dir)),
      );

      // 3. 添加系统文件夹（仅在有数据时显示，显示在最下方）
      if (hasArchivedGoals) {
        const archivedDir = systemDirs.find((dir) => dir.uuid === SYSTEM_GOAL_DIRS.ARCHIVED.uuid);
        if (archivedDir) {
          result.push(GoalFolder.ensureGoalFolderNeverNull(archivedDir));
        }
      }

      // 预留：当支持删除状态时启用
      // if (hasDeletedGoals) {
      //   const deletedDir = systemDirs.find(dir => dir.uuid === SYSTEM_GOAL_DIRS.DELETED.uuid);
      //   if (deletedDir) {
      //     result.push(deletedDir);
      //   }
      // }

      return result;
    },

    getGoalFolderById: (state) => (uuid: string) => {
      return state.GoalFolders.find((d) => d.uuid === uuid);
    },

    // ========== 系统文件夹相关 ==========

    isSystemGoalFolder: () => (dirUuid: string) => {
      return (
        dirUuid === SYSTEM_GOAL_DIRS.ALL.uuid ||
        dirUuid === SYSTEM_GOAL_DIRS.DELETED.uuid ||
        dirUuid === SYSTEM_GOAL_DIRS.ARCHIVED.uuid
      );
    },
  },

  actions: {
    async syncGoalState(goal: Goal): Promise<void> {
      try {
        console.log('[目标 Store] 同步目标状态:', goal);
        await this.$patch((state) => {
          const index = state.goals.findIndex((g) => g.uuid === goal.uuid);
          if (index !== -1) {
            state.goals[index] = goal;
          } else {
            state.goals.push(goal);
          }
        });
      } catch (error) {
        console.warn('⚠️ 同步目标状态失败:', error);
      }
    },
    async syncGoalsState(goals: Goal[]): Promise<void> {
      try {
        console.log('[目标 Store] 同步目标状态:', goals);
        await this.$patch((state) => {
          state.goals = goals;
        });
      } catch (error) {
        console.warn('⚠️ 同步目标状态失败:', error);
      }
    },

    async syncGoalFolderState(GoalFolder: GoalFolder): Promise<void> {
      try {
        console.log('[目标 Store] 同步目标目录状态:', GoalFolder);
        await this.$patch((state) => {
          const index = state.GoalFolders.findIndex((d) => d.uuid === GoalFolder.uuid);
          if (index !== -1) {
            state.GoalFolders[index] = GoalFolder;
          } else {
            state.GoalFolders.push(GoalFolder);
          }
        });
      } catch (error) {
        console.warn('⚠️ 同步目标目录状态失败:', error);
      }
    },
    async syncGoalFoldersState(GoalFolders: GoalFolder[]): Promise<void> {
      try {
        console.log('[目标 Store] 同步目标目录状态:', GoalFolders);
        await this.$patch((state) => {
          state.GoalFolders = GoalFolders;
        });
      } catch (error) {
        console.warn('⚠️ 同步目标目录状态失败:', error);
      }
    },

    removeGoal(goalUuid: string): void {
      this.goals = this.goals.filter((goal) => goal.uuid !== goalUuid);
    },
    removeGoalFolder(dirUuid: string): void {
      this.GoalFolders = this.GoalFolders.filter((dir) => dir.uuid !== dirUuid);
    },

    getGoalsCountByDirUuid(dirUuid: string): number {
      if (dirUuid === SYSTEM_GOAL_DIRS.ALL.uuid) {
        return this.goals.length;
      }
      return this.goals.filter((goal) => goal.dirUuid === dirUuid).length;
    },
  },
});
