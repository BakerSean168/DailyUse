import { defineStore } from 'pinia';
import { Goal, GoalFolder } from '@dailyuse/domain-client';
import { type GoalContracts } from '@dailyuse/contracts';

// 类型定义
interface GoalStoreState {
  goals: any[];
  goalFolders: any[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status: 'all' | 'active' | 'completed' | 'paused' | 'archived';
    dirUuid: string | undefined;
    searchQuery: string;
  };
  selectedGoalUuid: string | null;
  selectedDirUuid: string | null;
}

/**
 * Goal 模块的 Pinia Store - 纯缓存存储
 * 职责：缓存目标和目录数据，提供响应式查询接口
 */
export const useGoalStore = defineStore('goal', {
  state: (): GoalStoreState => ({
    // ===== 缓存数据 =====
    goals: [],
    goalFolders: [],

    // ===== 状态管理 =====
    isLoading: false,
    isInitialized: false,
    error: null as string | null,
    lastSyncTime: null as Date | null,

    // ===== UI状态 =====
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },

    filters: {
      status: 'all' as 'all' | 'active' | 'completed' | 'paused' | 'archived',
      dirUuid: undefined as string | undefined,
      searchQuery: '',
    },

    // 选中状态
    selectedGoalUuid: null as string | null,
    selectedDirUuid: null as string | null,
  }),

  getters: {
    // ===== 目标查询 =====

    /**
     * 获取所有目标
     */
    getAllGoals(): any[] {
      return this.goals;
    },

    /**
     * 根据UUID获取目标
     */
    getGoalByUuid:
      (state) =>
      (uuid: string): any | undefined => {
        return state.goals.find((g) => g.uuid === uuid);
      },

    /**
     * 根据目录UUID获取目标
     */
    getGoalsByDir(): (dirUuid?: string) => any[] {
      return (dirUuid?: string) => {
        if (!dirUuid) {
          return this.goals.filter((g) => !g.folderUuid);
        }
        return this.goals.filter((g) => g.folderUuid === dirUuid);
      };
    },

    /**
     * 根据状态获取目标
     */
    getGoalsByStatus(): (status: 'ACTIVE' | 'COMPLETED' | 'DRAFT' | 'ARCHIVED') => any[] {
      return (status) => this.goals.filter((g) => g.status === status);
    },

    /**
     * 获取活跃目标
     */
    getActiveGoals(): any[] {
      return this.goals.filter((g) => g.status === 'ACTIVE');
    },

    /**
     * 获取需要关注的目标
     */
    getGoalsNeedingAttention(): any[] {
      const now = Date.now();
      return this.goals.filter((goal) => {
        // 逾期的目标
        if (goal.targetDate && goal.targetDate < now && goal.status === 'ACTIVE') {
          return true;
        }
        return false;
      });
    },

    /**
     * 获取即将截止的目标
     */
    getGoalsDueSoon(): any[] {
      const now = Date.now();
      const threeDaysLater = now + 3 * 24 * 60 * 60 * 1000;

      return this.goals.filter(
        (goal) =>
          goal.targetDate &&
          goal.targetDate >= now &&
          goal.targetDate <= threeDaysLater &&
          goal.status === 'ACTIVE',
      );
    },

    /**
     * 获取已逾期的目标
     */
    getOverdueGoals(): any[] {
      const now = Date.now();
      return this.goals.filter(
        (goal) => goal.targetDate && goal.targetDate < now && goal.status === 'ACTIVE',
      );
    },

    /**
     * 获取已暂停的目标
     */
    getPausedGoals(): any[] {
      return this.goals.filter((g) => g.status === 'DRAFT');
    },

    /**
     * 获取当前选中的目标
     */
    getSelectedGoal(state): any | undefined {
      return state.selectedGoalUuid
        ? state.goals.find((g) => g.uuid === state.selectedGoalUuid)
        : undefined;
    },

    // ===== 目录查询 =====

    /**
     * 获取所有目录
     */
    getAllGoalFolders(): any[] {
      return this.goalFolders;
    },

    /**
     * 根据UUID获取目录
     */
    getGoalFolderByUuid:
      (state) =>
      (uuid: string): any | undefined => {
        return state.goalFolders.find((d) => d.uuid === uuid);
      },

    /**
     * 根据父目录获取子目录
     */
    getGoalFoldersByParent(): (parentUuid?: string) => any[] {
      return (parentUuid?: string) => {
        if (!parentUuid) {
          return this.goalFolders.filter((d: GoalFolder) => !d.parentFolderUuid);
        }
        return this.goalFolders.filter((d: GoalFolder) => d.parentFolderUuid === parentUuid);
      };
    },

    /**
     * 获取根目录
     */
    getRootGoalFolders(): any[] {
      return this.goalFolders.filter((d: GoalFolder) => !d.parentFolderUuid);
    },

    /**
     * 获取当前选中的目录
     */
    getSelectedGoalFolder(state): any | undefined {
      return state.selectedDirUuid
        ? state.goalFolders.find((d) => d.uuid === state.selectedDirUuid)
        : undefined;
    },

    // ===== 统计信息 =====

    /**
     * 获取目标统计信息
     */
    getGoalStatistics(): {
      total: number;
      active: number;
      completed: number;
      paused: number;
      archived: number;
      overdue: number;
      dueSoon: number;
      needingAttention: number;
    } {
      return {
        total: this.goals.length,
        active: this.getActiveGoals.length,
        completed: this.getGoalsByStatus('COMPLETED').length,
        paused: this.getGoalsByStatus('DRAFT').length,
        archived: this.getGoalsByStatus('ARCHIVED').length,
        overdue: this.getOverdueGoals.length,
        dueSoon: this.getGoalsDueSoon.length,
        needingAttention: this.getGoalsNeedingAttention.length,
      };
    },

    /**
     * 获取目录统计信息
     */
    getGoalFolderStatistics(): {
      total: number;
      active: number;
      archived: number;
      system: number;
      user: number;
    } {
      const activeFolders = this.goalFolders.filter((d: any) => d.lifecycle?.status === 'active');
      const archivedFolders = this.goalFolders.filter((d: any) => d.lifecycle?.status === 'archived');
      const systemFolders = this.goalFolders.filter((d: any) => d.isSystemFolder);
      const userFolders = this.goalFolders.filter((d: any) => !d.isSystemFolder);

      return {
        total: this.goalFolders.length,
        active: activeFolders.length,
        archived: archivedFolders.length,
        system: systemFolders.length,
        user: userFolders.length,
      };
    },

    // ===== 过滤后的数据 =====

    /**
     * 获取过滤后的目标列表
     */
    getFilteredGoals(state): any[] {
      let goals = this.goals;

      // 按状态过滤
      if (state.filters.status !== 'all') {
        goals = goals.filter((goal) => goal.lifecycle?.status === state.filters.status);
      }

      // 按目录过滤
      if (state.filters.dirUuid) {
        goals = goals.filter((goal) => goal.folderUuid === state.filters.dirUuid);
      }

      // 按搜索关键词过滤
      if (state.filters.searchQuery) {
        const query = state.filters.searchQuery.toLowerCase();
        goals = goals.filter(
          (goal) =>
            goal.name.toLowerCase().includes(query) ||
            (goal.description && goal.description.toLowerCase().includes(query)),
        );
      }

      return goals;
    },

    // ===== 检查方法 =====

    /**
     * 获取目录树结构
     */
    getGoalFolderTree(): any[] {
      // 构建目录树
      const buildTree = (parentUuid?: string): any[] => {
        return this.goalFolders
          .filter((dir: GoalFolder) => dir.parentFolderUuid === parentUuid)
          .map((dir: any) => ({
            ...dir,
            children: buildTree(dir.uuid),
            goals: this.goals.filter((goal) => goal.folderUuid === dir.uuid),
          }));
      };

      return buildTree();
    },

    /**
     * 检查是否为系统目录
     */
    isSystemGoalFolder(): (folderUuid: string) => boolean {
      return (folderUuid: string) => {
        const folder = this.goalFolders.find((d: any) => d.uuid === folderUuid);
        return folder?.isSystemFolder || false;
      };
    },
  },

  actions: {
    // ===== 数据管理 - 纯缓存操作 =====

    /**
     * 设置所有目标
     */
    setGoals(goals: any[]): void {
      console.log('[GoalStore.setGoals] 📥 接收到的 goals:', {
        count: goals.length,
        firstGoal: goals[0],
        firstGoalKeyResults: goals[0]?.keyResults,
      });
      this.goals = goals;
      this.lastSyncTime = new Date();
      console.log('[GoalStore.setGoals] ✅ goals 已设置到 store:', {
        storeGoalsCount: this.goals.length,
        firstStoreGoalKeyResults: this.goals[0]?.keyResults,
      });
    },

    /**
     * 添加或更新单个目标
     */
    addOrUpdateGoal(goal: any): void {
      const index = this.goals.findIndex((g) => g.uuid === goal.uuid);
      if (index >= 0) {
        this.goals[index] = goal;
      } else {
        this.goals.push(goal);
      }
      this.lastSyncTime = new Date();
    },

    /**
     * 批量添加或更新目标
     */
    addOrUpdateGoals(goals: any[]): void {
      goals.forEach((goal) => (this as any).addOrUpdateGoal(goal));
    },

    /**
     * 移除目标
     */
    removeGoal(uuid: string): void {
      const index = this.goals.findIndex((g) => g.uuid === uuid);
      if (index >= 0) {
        this.goals.splice(index, 1);
      }

      // 清除选中状态
      if (this.selectedGoalUuid === uuid) {
        this.selectedGoalUuid = null;
      }
    },

    /**
     * 清空所有目标
     */
    clearGoals(): void {
      this.goals = [];
      this.selectedGoalUuid = null;
    },

    /**
     * 设置所有目录
     */
    setGoalFolders(goalFolders: any[]): void {
      this.goalFolders = goalFolders;
      this.lastSyncTime = new Date();
    },

    /**
     * 添加或更新单个目录
     */
    addOrUpdateGoalFolder(goalFolder: any): void {
      const index = this.goalFolders.findIndex((d) => d.uuid === goalFolder.uuid);
      if (index >= 0) {
        this.goalFolders[index] = goalFolder;
      } else {
        this.goalFolders.push(goalFolder);
      }
      this.lastSyncTime = new Date();
    },

    /**
     * 批量添加或更新目录
     */
    addOrUpdateGoalFolders(goalFolders: any[]): void {
      goalFolders.forEach((folder) => (this as any).addOrUpdateGoalFolder(folder));
    },

    /**
     * 移除目录
     */
    removeGoalFolder(uuid: string): void {
      const index = this.goalFolders.findIndex((d) => d.uuid === uuid);
      if (index >= 0) {
        this.goalFolders.splice(index, 1);
      }

      // 清除选中状态
      if (this.selectedDirUuid === uuid) {
        this.selectedDirUuid = null;
      }
    },

    /**
     * 清空所有目录
     */
    clearGoalFolders(): void {
      this.goalFolders = [];
      this.selectedDirUuid = null;
    },

    // ===== 状态管理 =====

    /**
     * 设置加载状态
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading;
    },

    /**
     * 设置错误信息
     */
    setError(error: string | null): void {
      this.error = error;
    },

    /**
     * 设置初始化状态
     */
    setInitialized(initialized: boolean): void {
      this.isInitialized = initialized;
    },

    /**
     * 设置分页信息
     */
    setPagination(pagination: Partial<typeof this.pagination>): void {
      this.pagination = { ...this.pagination, ...pagination };
    },

    /**
     * 设置过滤条件
     */
    setFilters(filters: Partial<typeof this.filters>): void {
      this.filters = { ...this.filters, ...filters };
    },

    /**
     * 设置选中的目标
     */
    setSelectedGoal(uuid: string | null): void {
      this.selectedGoalUuid = uuid;
    },

    /**
     * 设置选中的目录
     */
    setSelectedGoalFolder(uuid: string | null): void {
      this.selectedDirUuid = uuid;
    },

    /**
     * 重置过滤条件
     */
    resetFilters(): void {
      this.filters = {
        status: 'all',
        dirUuid: undefined,
        searchQuery: '',
      };
    },

    /**
     * 清空所有数据和状态
     */
    clearAll(): void {
      (this as any).clearGoals();
      (this as any).clearGoalFolders();
      this.selectedGoalUuid = null;
      this.selectedDirUuid = null;
      this.error = null;
      this.isInitialized = false;
      this.lastSyncTime = null;
      (this as any).resetFilters();
    },

    // ===== 初始化 =====

    /**
     * 初始化 Store（现在由 pinia-plugin-persistedstate 自动处理）
     */
    initialize(): void {
      this.isInitialized = true;
      console.log(
        `Goal Store 初始化完成：${this.goals.length} 个目标，${this.goalFolders.length} 个目录`,
      );
    },

    // ===== 缓存管理 =====
    // 注意：缓存管理现在由 pinia-plugin-persistedstate 自动处理

    /**
     * 检查是否需要刷新缓存
     */
    shouldRefreshCache(): boolean {
      if (!this.lastSyncTime) return true;

      // 如果超过30分钟未同步，则需要刷新
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      return this.lastSyncTime < thirtyMinutesAgo;
    },
  },

  persist: {
    key: 'goal-store',
    storage: localStorage,
    // 选择性持久化关键数据，避免持久化 loading 状态
    pick: [
      'goals',
      'goalFolders',
      'selectedGoalUuid',
      'selectedDirUuid',
      'lastSyncTime',
      'isInitialized',
    ],
    // 自定义序列化器，确保实体类的正确序列化
    serializer: {
      serialize: (state: any) => {
        console.log('📦 [GoalStore] 开始序列化 Store 数据', {
          goalsCount: state.goals?.length || 0,
          foldersCount: state.goalFolders?.length || 0,
          firstGoalKeyResults: state.goals?.[0]?.keyResults?.length || 0,
        });
        
        const serialized = {
          ...state,
          goals: state.goals.map((goal: any) => {
            // ✅ 关键修复：传入 includeChildren=true 确保序列化 KeyResults
            const dto = goal && typeof goal.toClientDTO === 'function' 
              ? goal.toClientDTO(true)  // 🔥 includeChildren=true
              : goal;
            
            console.log('📦 [GoalStore] 序列化 Goal:', {
              uuid: dto.uuid,
              title: dto.title,
              keyResultsCount: dto.keyResults?.length || 0,
            });
            
            return dto;
          }),
          goalFolders: state.goalFolders.map((folder: any) =>
            folder && typeof folder.toClientDTO === 'function' ? folder.toClientDTO() : folder,
          ),
          lastSyncTime: state.lastSyncTime?.getTime
            ? state.lastSyncTime.getTime()
            : state.lastSyncTime,
        };
        
        console.log('📦 [GoalStore] 序列化完成:', {
          goalsCount: serialized.goals.length,
          firstGoalKeyResultsCount: serialized.goals[0]?.keyResults?.length || 0,
        });
        
        return JSON.stringify(serialized);
      },
      deserialize: (serialized: string) => {
        const state = JSON.parse(serialized);
        console.log('📦 [GoalStore] 开始反序列化 Store 数据', {
          goalsCount: state.goals?.length || 0,
          foldersCount: state.goalFolders?.length || 0,
          isInitialized: state.isInitialized,
          firstGoalKeyResultsCount: state.goals?.[0]?.keyResults?.length || 0,
        });
        
        const deserialized = {
          ...state,
          goals: (state.goals || []).map((goalData: any) => {
            try {
              const goal = Goal.fromClientDTO(goalData);
              console.log('📦 [GoalStore] 反序列化 Goal:', {
                uuid: goal.uuid,
                title: goal.title,
                keyResultsCount: goal.keyResults?.length || 0,
              });
              return goal;
            } catch (e) {
              console.warn('Failed to deserialize goal:', goalData, e);
              return goalData; // 保持原始数据
            }
          }),
          goalFolders: (state.goalFolders || []).map((folderData: any) => {
            try {
              return GoalFolder.fromClientDTO(folderData);
            } catch (e) {
              console.warn('Failed to deserialize folder:', folderData, e);
              return folderData; // 保持原始数据
            }
          }),
          lastSyncTime: state.lastSyncTime ? new Date(state.lastSyncTime) : null,
        };
        
        console.log('📦 [GoalStore] 反序列化完成:', {
          goalsCount: deserialized.goals.length,
          firstGoalKeyResultsCount: deserialized.goals[0]?.keyResults?.length || 0,
        });
        
        return deserialized;
      },
    },
  },
});

// 导出 store 类型
export type GoalStore = ReturnType<typeof useGoalStore>;

// 明确的类型导出，确保 TypeScript 能正确推断 actions
export interface GoalStoreActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  setGoals: (goals: any[]) => void;
  addOrUpdateGoal: (goal: any) => void;
  addOrUpdateGoals: (goals: any[]) => void;
  removeGoal: (uuid: string) => void;
  clearGoals: () => void;
  setGoalFolders: (goalFolders: any[]) => void;
  addOrUpdateGoalFolder: (goalFolder: any) => void;
  addOrUpdateGoalFolders: (goalFolders: any[]) => void;
  removeGoalFolder: (uuid: string) => void;
  clearGoalFolders: () => void;
  setPagination: (
    pagination: Partial<{
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>,
  ) => void;
  setFilters: (
    filters: Partial<{
      status: 'all' | 'active' | 'completed' | 'paused' | 'archived';
      dirUuid: string | undefined;
      searchQuery: string;
    }>,
  ) => void;
  setSelectedGoal: (uuid: string | null) => void;
  setSelectedGoalFolder: (uuid: string | null) => void;
  resetFilters: () => void;
  clearAll: () => void;
  initialize: () => void;
  shouldRefreshCache: () => boolean;
  // Getters
  getGoalFolderTree: any[];
}

// 创建一个类型安全的 store 获取器
export function getGoalStore(): GoalStore & GoalStoreActions {
  return useGoalStore() as GoalStore & GoalStoreActions;
}
