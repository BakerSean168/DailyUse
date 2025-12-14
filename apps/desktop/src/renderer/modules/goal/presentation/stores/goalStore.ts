/**
 * Goal Store - Zustand 状态管理
 * 
 * 管理 Goal 模块的所有状态，包括：
 * - 目标列表缓存
 * - 加载/错误状态
 * - UI 状态（选中、过滤等）
 * 
 * @module goal/presentation/stores
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  GoalClientDTO, 
  GoalStatus,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalFolderClientDTO,
} from '@dailyuse/contracts/goal';
import type { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';

// ============ State Interface ============
export interface GoalState {
  // 数据缓存
  goals: GoalClientDTO[];
  goalsById: Record<string, GoalClientDTO>;
  folders: GoalFolderClientDTO[];
  foldersById: Record<string, GoalFolderClientDTO>;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedGoalId: string | null;
  expandedGoalIds: Set<string>;
  filters: GoalFilters;
  sortBy: GoalSortOption;
  viewMode: 'list' | 'tree' | 'kanban';
}

export interface GoalFilters {
  status?: GoalStatus[];
  folderId?: string | null;
  importance?: ImportanceLevel[];
  urgency?: UrgencyLevel[];
  searchQuery?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

export type GoalSortOption = 
  | 'createdAt_desc' 
  | 'createdAt_asc' 
  | 'updatedAt_desc' 
  | 'name_asc' 
  | 'name_desc'
  | 'priority_desc'
  | 'dueDate_asc';

// ============ Actions Interface ============
export interface GoalActions {
  // CRUD 操作
  setGoals: (goals: GoalClientDTO[]) => void;
  addGoal: (goal: GoalClientDTO) => void;
  updateGoal: (id: string, updates: Partial<GoalClientDTO>) => void;
  removeGoal: (id: string) => void;
  
  // Folder 操作
  setFolders: (folders: GoalFolderClientDTO[]) => void;
  addFolder: (folder: GoalFolderClientDTO) => void;
  updateFolder: (id: string, updates: Partial<GoalFolderClientDTO>) => void;
  removeFolder: (id: string) => void;
  
  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI 操作
  setSelectedGoalId: (id: string | null) => void;
  toggleGoalExpanded: (id: string) => void;
  setFilters: (filters: Partial<GoalFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: GoalSortOption) => void;
  setViewMode: (mode: 'list' | 'tree' | 'kanban') => void;
  
  // 生命周期
  initialize: () => Promise<void>;
  reset: () => void;
  
  // IPC 操作
  fetchGoals: () => Promise<void>;
  createGoal: (dto: CreateGoalRequest) => Promise<GoalClientDTO>;
  updateGoalById: (id: string, dto: UpdateGoalRequest) => Promise<GoalClientDTO>;
  deleteGoal: (id: string) => Promise<void>;
  moveGoalToFolder: (goalId: string, folderId: string | null) => Promise<void>;
}

// ============ Selectors Interface ============
export interface GoalSelectors {
  getGoalById: (id: string) => GoalClientDTO | undefined;
  getGoalsByFolder: (folderId: string | null) => GoalClientDTO[];
  getRootGoals: () => GoalClientDTO[];
  getChildGoals: (parentId: string) => GoalClientDTO[];
  getFilteredGoals: () => GoalClientDTO[];
  getGoalCount: () => number;
  getFolderById: (id: string) => GoalFolderClientDTO | undefined;
}

// ============ Initial State ============
const defaultFilters: GoalFilters = {
  status: undefined,
  folderId: undefined,
  importance: undefined,
  urgency: undefined,
  searchQuery: '',
  dateRange: undefined,
};

const initialState: GoalState = {
  goals: [],
  goalsById: {},
  folders: [],
  foldersById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedGoalId: null,
  expandedGoalIds: new Set<string>(),
  filters: defaultFilters,
  sortBy: 'createdAt_desc',
  viewMode: 'list',
};

// ============ Store ============
export const useGoalStore = create<GoalState & GoalActions & GoalSelectors>()(
  immer(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ========== CRUD Actions ==========
        setGoals: (goals) => set((state) => {
          state.goals = goals;
          state.goalsById = Object.fromEntries(goals.map(g => [g.uuid, g]));
        }),
        
        addGoal: (goal) => set((state) => {
          state.goals.push(goal);
          state.goalsById[goal.uuid] = goal;
        }),
        
        updateGoal: (id, updates) => set((state) => {
          const index = state.goals.findIndex(g => g.uuid === id);
          if (index !== -1) {
            state.goals[index] = { ...state.goals[index], ...updates };
            state.goalsById[id] = state.goals[index];
          }
        }),
        
        removeGoal: (id) => set((state) => {
          state.goals = state.goals.filter(g => g.uuid !== id);
          delete state.goalsById[id];
          if (state.selectedGoalId === id) {
            state.selectedGoalId = null;
          }
        }),
        
        // ========== Folder Actions ==========
        setFolders: (folders) => set((state) => {
          state.folders = folders;
          state.foldersById = Object.fromEntries(folders.map(f => [f.uuid, f]));
        }),
        
        addFolder: (folder) => set((state) => {
          state.folders.push(folder);
          state.foldersById[folder.uuid] = folder;
        }),
        
        updateFolder: (id, updates) => set((state) => {
          const index = state.folders.findIndex(f => f.uuid === id);
          if (index !== -1) {
            state.folders[index] = { ...state.folders[index], ...updates };
            state.foldersById[id] = state.folders[index];
          }
        }),
        
        removeFolder: (id) => set((state) => {
          state.folders = state.folders.filter(f => f.uuid !== id);
          delete state.foldersById[id];
        }),
        
        // ========== Status Actions ==========
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setInitialized: (initialized) => set({ isInitialized: initialized }),
        
        // ========== UI Actions ==========
        setSelectedGoalId: (id) => set({ selectedGoalId: id }),
        
        toggleGoalExpanded: (id) => set((state) => {
          if (state.expandedGoalIds.has(id)) {
            state.expandedGoalIds.delete(id);
          } else {
            state.expandedGoalIds.add(id);
          }
        }),
        
        setFilters: (filters) => set((state) => {
          state.filters = { ...state.filters, ...filters };
        }),
        
        resetFilters: () => set((state) => {
          state.filters = defaultFilters;
        }),
        
        setSortBy: (sort) => set({ sortBy: sort }),
        
        setViewMode: (mode) => set({ viewMode: mode }),
        
        // ========== Lifecycle ==========
        initialize: async () => {
          const { isInitialized, fetchGoals, setInitialized, setError } = get();
          if (isInitialized) return;
          
          try {
            await fetchGoals();
            setInitialized(true);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to initialize goals');
          }
        },
        
        reset: () => set(initialState),
        
        // ========== IPC Actions ==========
        fetchGoals: async () => {
          const { setLoading, setGoals, setFolders, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            // 通过 IPC 获取目标列表
            const goals = await window.electron.goal.getAll();
            setGoals(goals);
            
            // 获取文件夹列表
            const folders = await window.electron.goal.getFolders();
            setFolders(folders);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch goals';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        createGoal: async (dto) => {
          const { setLoading, addGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const newGoal = await window.electron.goal.create(dto);
            addGoal(newGoal);
            return newGoal;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        updateGoalById: async (id, dto) => {
          const { setLoading, updateGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const updatedGoal = await window.electron.goal.update(id, dto);
            updateGoal(id, updatedGoal);
            return updatedGoal;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        deleteGoal: async (id) => {
          const { setLoading, removeGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await window.electron.goal.delete(id);
            removeGoal(id);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        moveGoalToFolder: async (goalId, folderId) => {
          const { setLoading, updateGoal, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await window.electron.goal.moveToFolder(goalId, folderId);
            updateGoal(goalId, { folderUuid: folderId ?? undefined });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to move goal';
            setError(message);
            throw error;
          } finally {
            setLoading(false);
          }
        },
        
        // ========== Selectors ==========
        getGoalById: (id) => get().goalsById[id],
        
        getGoalsByFolder: (folderId) => {
          const { goals } = get();
          return goals.filter(g => g.folderUuid === folderId);
        },
        
        getRootGoals: () => {
          const { goals } = get();
          return goals.filter(g => !g.parentGoalUuid);
        },
        
        getChildGoals: (parentId) => {
          const { goals } = get();
          return goals.filter(g => g.parentGoalUuid === parentId);
        },
        
        getFilteredGoals: () => {
          const { goals, filters, sortBy } = get();
          
          let filtered = [...goals];
          
          // 应用过滤器
          if (filters.status?.length) {
            filtered = filtered.filter(g => filters.status!.includes(g.status));
          }
          
          if (filters.folderId !== undefined) {
            filtered = filtered.filter(g => g.folderUuid === filters.folderId);
          }
          
          if (filters.importance?.length) {
            filtered = filtered.filter(g => filters.importance!.includes(g.importance));
          }
          
          if (filters.urgency?.length) {
            filtered = filtered.filter(g => filters.urgency!.includes(g.urgency));
          }
          
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(g => 
              g.title.toLowerCase().includes(query) ||
              g.description?.toLowerCase().includes(query)
            );
          }
          
          // 应用排序
          filtered.sort((a, b) => {
            switch (sortBy) {
              case 'createdAt_desc':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              case 'createdAt_asc':
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              case 'updatedAt_desc':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
              case 'name_asc':
                return a.title.localeCompare(b.title);
              case 'name_desc':
                return b.title.localeCompare(a.title);
              default:
                return 0;
            }
          });
          
          return filtered;
        },
        
        getGoalCount: () => get().goals.length,
        
        getFolderById: (id) => get().foldersById[id],
      }),
      {
        name: 'goal-store',
        storage: createJSONStorage(() => localStorage),
        // 只持久化 UI 状态，不持久化数据缓存
        partialize: (state) => ({
          selectedGoalId: state.selectedGoalId,
          expandedGoalIds: Array.from(state.expandedGoalIds),
          filters: state.filters,
          sortBy: state.sortBy,
          viewMode: state.viewMode,
        }),
        // 恢复时转换 expandedGoalIds 回 Set
        merge: (persistedState: unknown, currentState) => {
          const persisted = persistedState as Partial<GoalState> & { expandedGoalIds?: string[] };
          return {
            ...currentState,
            ...persisted,
            expandedGoalIds: new Set(persisted.expandedGoalIds || []),
          };
        },
      }
    )
  )
);

// ============ Hooks for selective subscription ============
export const useGoals = () => useGoalStore((state) => state.goals);
export const useGoalLoading = () => useGoalStore((state) => state.isLoading);
export const useGoalError = () => useGoalStore((state) => state.error);
export const useSelectedGoalId = () => useGoalStore((state) => state.selectedGoalId);
export const useGoalFilters = () => useGoalStore((state) => state.filters);
