/**
 * Task Store - Zustand 状态管理
 * 
 * 管理 Task 模块的所有状态
 * 
 * 注意：任务系统使用 Template/Instance 模型：
 * - TaskTemplate: 任务定义/模板（可重复）
 * - TaskInstance: 具体的任务实例（单次执行）
 * 
 * @module task/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// 使用 IPC Client 的类型，而不是 contracts 的完整 ClientDTO
import type { TaskInstanceDTO } from '../../infrastructure/ipc/task-instance.ipc-client';
import type { TaskTemplateDTO } from '../../infrastructure/ipc/task-template.ipc-client';
import { taskContainer } from '../../infrastructure/di';

// 本地类型别名 - 兼容原有命名
type TaskInstanceClientDTO = TaskInstanceDTO;
type TaskTemplateClientDTO = TaskTemplateDTO;
type TaskInstanceStatus = 'pending' | 'completed' | 'skipped';

// ============ State Interface ============
export interface TaskState {
  // 数据缓存 - 任务实例（今日/近期的具体任务）
  instances: TaskInstanceClientDTO[];
  instancesById: Record<string, TaskInstanceClientDTO>;
  
  // 数据缓存 - 任务模板（任务定义）
  templates: TaskTemplateClientDTO[];
  templatesById: Record<string, TaskTemplateClientDTO>;
  
  // 加载状态
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // UI 状态
  selectedInstanceId: string | null;
  selectedTemplateId: string | null;
  filters: TaskFilters;
  sortBy: TaskSortOption;
  viewMode: 'list' | 'kanban' | 'calendar';
  dateRange: { start: Date; end: Date };
}

export interface TaskFilters {
  status?: TaskInstanceStatus[];
  templateId?: string | null;
  dateRange?: { start: Date | null; end: Date | null };
  searchQuery?: string;
  showCompleted?: boolean;
}

export type TaskSortOption = 
  | 'instanceDate_asc' 
  | 'instanceDate_desc' 
  | 'createdAt_desc' 
  | 'createdAt_asc';

// ============ Actions Interface ============
export interface TaskActions {
  // Instances CRUD
  setInstances: (instances: TaskInstanceClientDTO[]) => void;
  addInstance: (instance: TaskInstanceClientDTO) => void;
  updateInstance: (id: string, updates: Partial<TaskInstanceClientDTO>) => void;
  removeInstance: (id: string) => void;
  
  // Templates CRUD
  setTemplates: (templates: TaskTemplateClientDTO[]) => void;
  addTemplate: (template: TaskTemplateClientDTO) => void;
  updateTemplate: (id: string, updates: Partial<TaskTemplateClientDTO>) => void;
  removeTemplate: (id: string) => void;
  
  // Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // UI
  setSelectedInstanceId: (id: string | null) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setSortBy: (sort: TaskSortOption) => void;
  setViewMode: (mode: 'list' | 'kanban' | 'calendar') => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
  
  // Lifecycle
  initialize: () => Promise<void>;
  reset: () => void;
  
  // IPC Operations - 将在实际集成时实现
  fetchInstances: (dateRange?: { start: Date; end: Date }) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  completeInstance: (id: string) => Promise<void>;
  skipInstance: (id: string, reason?: string) => Promise<void>;
}

// ============ Selectors Interface ============
export interface TaskSelectors {
  getInstanceById: (id: string) => TaskInstanceClientDTO | undefined;
  getTemplateById: (id: string) => TaskTemplateClientDTO | undefined;
  getInstancesByTemplate: (templateId: string) => TaskInstanceClientDTO[];
  getTodayInstances: () => TaskInstanceClientDTO[];
  getPendingInstances: () => TaskInstanceClientDTO[];
  getCompletedInstances: () => TaskInstanceClientDTO[];
  getFilteredInstances: () => TaskInstanceClientDTO[];
  getInstanceCount: () => number;
  getTemplateCount: () => number;
}

// ============ Initial State ============
const today = new Date();
today.setHours(0, 0, 0, 0);
const weekLater = new Date(today);
weekLater.setDate(weekLater.getDate() + 7);

const defaultFilters: TaskFilters = {
  status: undefined,
  templateId: undefined,
  dateRange: undefined,
  searchQuery: '',
  showCompleted: false,
};

const initialState: TaskState = {
  instances: [],
  instancesById: {},
  templates: [],
  templatesById: {},
  isLoading: false,
  isInitialized: false,
  error: null,
  selectedInstanceId: null,
  selectedTemplateId: null,
  filters: defaultFilters,
  sortBy: 'instanceDate_asc',
  viewMode: 'list',
  dateRange: { start: today, end: weekLater },
};

// ============ Store ============
export const useTaskStore = create<TaskState & TaskActions & TaskSelectors>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // ========== Instances CRUD ==========
      setInstances: (instances) => set({
        instances,
        instancesById: Object.fromEntries(instances.map(i => [i.uuid, i])),
      }),
      
      addInstance: (instance) => set((state) => ({
        instances: [...state.instances, instance],
        instancesById: { ...state.instancesById, [instance.uuid]: instance },
      })),
      
      updateInstance: (id, updates) => set((state) => {
        const index = state.instances.findIndex(i => i.uuid === id);
        if (index === -1) return state;
        
        const updated = { ...state.instances[index], ...updates };
        const newInstances = [...state.instances];
        newInstances[index] = updated;
        
        return {
          instances: newInstances,
          instancesById: { ...state.instancesById, [id]: updated },
        };
      }),
      
      removeInstance: (id) => set((state) => {
        const newById = { ...state.instancesById };
        delete newById[id];
        return {
          instances: state.instances.filter(i => i.uuid !== id),
          instancesById: newById,
          selectedInstanceId: state.selectedInstanceId === id ? null : state.selectedInstanceId,
        };
      }),
      
      // ========== Templates CRUD ==========
      setTemplates: (templates) => set({
        templates,
        templatesById: Object.fromEntries(templates.map(t => [t.uuid, t])),
      }),
      
      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template],
        templatesById: { ...state.templatesById, [template.uuid]: template },
      })),
      
      updateTemplate: (id, updates) => set((state) => {
        const index = state.templates.findIndex(t => t.uuid === id);
        if (index === -1) return state;
        
        const updated = { ...state.templates[index], ...updates };
        const newTemplates = [...state.templates];
        newTemplates[index] = updated;
        
        return {
          templates: newTemplates,
          templatesById: { ...state.templatesById, [id]: updated },
        };
      }),
      
      removeTemplate: (id) => set((state) => {
        const newById = { ...state.templatesById };
        delete newById[id];
        return {
          templates: state.templates.filter(t => t.uuid !== id),
          templatesById: newById,
          selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId,
        };
      }),
      
      // ========== Status ==========
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      
      // ========== UI ==========
      setSelectedInstanceId: (selectedInstanceId) => set({ selectedInstanceId }),
      setSelectedTemplateId: (selectedTemplateId) => set({ selectedTemplateId }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),
      resetFilters: () => set({ filters: defaultFilters }),
      setSortBy: (sortBy) => set({ sortBy }),
      setViewMode: (viewMode) => set({ viewMode }),
      setDateRange: (dateRange) => set({ dateRange }),
      
      // ========== Lifecycle ==========
      initialize: async () => {
        const { isInitialized, fetchInstances, fetchTemplates, setInitialized, setError } = get();
        if (isInitialized) return;
        
        try {
          await Promise.all([
            fetchInstances(),
            fetchTemplates(),
          ]);
          setInitialized(true);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to initialize tasks');
        }
      },
      
      reset: () => set(initialState),
      
      // ========== IPC Operations ==========
      fetchInstances: async (dateRange) => {
        const { setLoading, setInstances, setError, dateRange: stateRange } = get();
        const range = dateRange ?? stateRange;
        
        try {
          setLoading(true);
          setError(null);
          
          // 使用 IPC Client 获取任务实例
          const instanceClient = taskContainer.instanceClient;
          const instances = await instanceClient.list({
            accountUuid: '', // TODO: 从 AuthStore 获取当前账户
            startDate: range.start.getTime(),
            endDate: range.end.getTime(),
          });
          
          // 直接使用 IPC Client 返回的类型
          setInstances(instances);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch task instances';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      fetchTemplates: async () => {
        const { setLoading, setTemplates, setError } = get();
        
        try {
          setLoading(true);
          
          // 使用 IPC Client 获取任务模板
          const templateClient = taskContainer.templateClient;
          const templates = await templateClient.list({
            accountUuid: '', // TODO: 从 AuthStore 获取当前账户
          });
          
          // 直接使用 IPC Client 返回的类型
          setTemplates(templates);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch task templates';
          setError(message);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      completeInstance: async (id) => {
        const { setLoading, setError, updateInstance } = get();
        
        try {
          setLoading(true);
          
          // 使用 IPC Client 完成任务
          const instanceClient = taskContainer.instanceClient;
          const result = await instanceClient.complete(id);
          
          // 使用 IPC Client 返回的实例数据更新本地状态
          updateInstance(id, result.instance);
          
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to complete task');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      skipInstance: async (id, reason) => {
        const { setLoading, setError, updateInstance } = get();
        
        try {
          setLoading(true);
          
          // 使用 IPC Client 跳过任务
          const instanceClient = taskContainer.instanceClient;
          const result = await instanceClient.skip(id, reason);
          
          // 使用 IPC Client 返回的实例数据更新本地状态
          updateInstance(id, result);
          
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to skip task');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      // ========== Selectors ==========
      getInstanceById: (id) => get().instancesById[id],
      getTemplateById: (id) => get().templatesById[id],
      
      getInstancesByTemplate: (templateId) => {
        const { instances } = get();
        return instances.filter(i => i.templateUuid === templateId);
      },
      
      getTodayInstances: () => {
        const { instances } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const tomorrowTime = todayTime + 24 * 60 * 60 * 1000;
        
        return instances.filter(i => {
          const instanceDate = i.instanceDate;
          return instanceDate >= todayTime && instanceDate < tomorrowTime;
        });
      },
      
      getPendingInstances: () => {
        const { instances } = get();
        return instances.filter(i => !i.isCompleted && !i.isSkipped);
      },
      
      getCompletedInstances: () => {
        const { instances } = get();
        return instances.filter(i => i.isCompleted);
      },
      
      getFilteredInstances: () => {
        const { instances, filters, sortBy } = get();
        
        let filtered = [...instances];
        
        // 按状态过滤 - TaskInstanceClientDTO 使用 isCompleted/isSkipped 布尔值
        if (filters.status?.length) {
          filtered = filtered.filter(i => {
            const status = i.isCompleted ? 'completed' : (i.isSkipped ? 'skipped' : 'pending');
            return filters.status!.includes(status);
          });
        }
        
        // 按模板过滤
        if (filters.templateId) {
          filtered = filtered.filter(i => i.templateUuid === filters.templateId);
        }
        
        // 隐藏已完成
        if (!filters.showCompleted) {
          filtered = filtered.filter(i => !i.isCompleted);
        }
        
        // 排序 - 使用 instanceDate
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'instanceDate_asc':
              return a.instanceDate - b.instanceDate;
            case 'instanceDate_desc':
              return b.instanceDate - a.instanceDate;
            case 'createdAt_desc':
              return b.createdAt - a.createdAt;
            case 'createdAt_asc':
              return a.createdAt - b.createdAt;
            default:
              return 0;
          }
        });
        
        return filtered;
      },
      
      getInstanceCount: () => get().instances.length,
      getTemplateCount: () => get().templates.length,
    }),
    {
      name: 'task-store',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 UI 状态
      partialize: (state) => ({
        selectedInstanceId: state.selectedInstanceId,
        selectedTemplateId: state.selectedTemplateId,
        filters: state.filters,
        sortBy: state.sortBy,
        viewMode: state.viewMode,
      }),
    }
  )
);

// ============ Convenience Hooks ============
export const useTaskInstances = () => useTaskStore((state) => state.instances);
export const useTaskTemplates = () => useTaskStore((state) => state.templates);
export const useTaskLoading = () => useTaskStore((state) => state.isLoading);
export const useSelectedInstanceId = () => useTaskStore((state) => state.selectedInstanceId);
export const useSelectedTemplateId = () => useTaskStore((state) => state.selectedTemplateId);
