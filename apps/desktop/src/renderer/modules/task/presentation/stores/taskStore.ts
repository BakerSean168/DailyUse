/**
 * Task Store - Zustand 状态管理
 * 
 * 管理 Task 模块的所有状态
 * 
 * 注意：任务系统使用 Template/Instance 模型：
 * - TaskTemplate: 任务定义/模板（可重复）
 * - TaskInstance: 具体的任务实例（单次执行）
 * 
 * 🔄 重构说明 (EPIC-015):
 * - 存储 Entity 对象而非 DTO
 * - 通过 ApplicationService 获取数据
 * - 与 Web 应用 Store 模式保持一致
 * 
 * @module task/presentation/stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';
import { taskApplicationService } from '../../application/services';

// ============ State Interface ============
export interface TaskState {
  // 数据缓存 - 任务实例（今日/近期的具体任务）
  instances: TaskInstance[];
  instancesById: Record<string, TaskInstance>;
  
  // 数据缓存 - 任务模板（任务定义）
  templates: TaskTemplate[];
  templatesById: Record<string, TaskTemplate>;
  
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

type TaskInstanceStatus = 'pending' | 'completed' | 'skipped';

export type TaskSortOption = 
  | 'instanceDate_asc' 
  | 'instanceDate_desc' 
  | 'createdAt_desc' 
  | 'createdAt_asc';

// ============ Actions Interface ============
export interface TaskActions {
  // Instances CRUD
  setInstances: (instances: TaskInstance[]) => void;
  addInstance: (instance: TaskInstance) => void;
  updateInstance: (id: string, instance: TaskInstance) => void;
  removeInstance: (id: string) => void;
  
  // Templates CRUD
  setTemplates: (templates: TaskTemplate[]) => void;
  addTemplate: (template: TaskTemplate) => void;
  updateTemplate: (id: string, template: TaskTemplate) => void;
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
  
  // Data Operations - 通过 ApplicationService
  fetchInstances: (dateRange?: { start: Date; end: Date }) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  completeInstance: (id: string) => Promise<void>;
  skipInstance: (id: string) => Promise<void>;
}

// ============ Selectors Interface ============
export interface TaskSelectors {
  getInstanceById: (id: string) => TaskInstance | undefined;
  getTemplateById: (id: string) => TaskTemplate | undefined;
  getInstancesByTemplate: (templateId: string) => TaskInstance[];
  getTodayInstances: () => TaskInstance[];
  getPendingInstances: () => TaskInstance[];
  getCompletedInstances: () => TaskInstance[];
  getFilteredInstances: () => TaskInstance[];
  getInstanceCount: () => number;
  getTemplateCount: () => number;
  
  // 新增：基于 Entity 方法的便捷选择器
  getActiveTemplates: () => TaskTemplate[];
  getPausedTemplates: () => TaskTemplate[];
  getArchivedTemplates: () => TaskTemplate[];
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
      
      updateInstance: (id, instance) => set((state) => {
        const index = state.instances.findIndex(i => i.uuid === id);
        if (index === -1) return state;
        
        const newInstances = [...state.instances];
        newInstances[index] = instance;
        
        return {
          instances: newInstances,
          instancesById: { ...state.instancesById, [id]: instance },
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
      
      updateTemplate: (id, template) => set((state) => {
        const index = state.templates.findIndex(t => t.uuid === id);
        if (index === -1) return state;
        
        const newTemplates = [...state.templates];
        newTemplates[index] = template;
        
        return {
          templates: newTemplates,
          templatesById: { ...state.templatesById, [id]: template },
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
      
      // ========== Data Operations - 通过 ApplicationService ==========
      fetchInstances: async (dateRange) => {
        const { setLoading, setInstances, setError, dateRange: stateRange } = get();
        const range = dateRange ?? stateRange;
        
        try {
          setLoading(true);
          setError(null);
          
          // 获取所有模板然后逐个获取其实例
          const templates = await taskApplicationService.listTemplates();
          const allInstances: TaskInstance[] = [];
          
          for (const template of templates) {
            const instances = await taskApplicationService.getInstancesByDateRange({
              templateUuid: template.uuid,
              from: range.start.getTime(),
              to: range.end.getTime(),
            });
            allInstances.push(...instances);
          }
          
          setInstances(allInstances);
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
          setError(null);
          
          // 通过 ApplicationService 获取数据（返回 Entity）
          const templates = await taskApplicationService.listTemplates();
          
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
          setError(null);
          
          // 通过 ApplicationService 完成任务（返回 Entity）
          const instance = await taskApplicationService.completeInstance(id);
          
          updateInstance(id, instance);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to complete task');
          throw error;
        } finally {
          setLoading(false);
        }
      },
      
      skipInstance: async (id) => {
        const { setLoading, setError, updateInstance } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          // 通过 ApplicationService 跳过任务（返回 Entity）
          const instance = await taskApplicationService.skipInstance(id);
          
          updateInstance(id, instance);
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
        // 使用 Entity 的属性
        return instances.filter(i => i.isPending);
      },
      
      getCompletedInstances: () => {
        const { instances } = get();
        // 使用 Entity 的属性
        return instances.filter(i => i.isCompleted);
      },
      
      getFilteredInstances: () => {
        const { instances, filters, sortBy } = get();
        
        let filtered = [...instances];
        
        // 按状态过滤 - 使用 Entity 属性
        if (filters.status?.length) {
          filtered = filtered.filter(i => {
            if (filters.status!.includes('completed') && i.isCompleted) return true;
            if (filters.status!.includes('skipped') && i.isSkipped) return true;
            if (filters.status!.includes('pending') && i.isPending) return true;
            return false;
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
        
        // 排序
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
      
      // ========== 新增：基于 Entity 方法的便捷选择器 ==========
      getActiveTemplates: () => {
        const { templates } = get();
        return templates.filter(t => t.isActive);
      },
      
      getPausedTemplates: () => {
        const { templates } = get();
        return templates.filter(t => t.isPaused);
      },
      
      getArchivedTemplates: () => {
        const { templates } = get();
        return templates.filter(t => t.isArchived);
      },
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
