/**
 * Task Synchronization Application Service
 * 任务数据同步应用服务 - 负责任务数据的同步与缓存管理
 */

import { TaskDomain } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import { taskTemplateApiClient } from '../../infrastructure/api/taskApiClient';

// 导入类实现
const TaskTemplateClient = TaskDomain.TaskTemplateClient;
const TaskInstanceClient = TaskDomain.TaskInstanceClient;

// 类型别名
type TaskTemplate = TaskDomain.TaskTemplate;
type TaskInstance = TaskDomain.TaskInstance;

export class TaskSyncApplicationService {
  private static instance: TaskSyncApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): TaskSyncApplicationService {
    TaskSyncApplicationService.instance = new TaskSyncApplicationService();
    return TaskSyncApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): TaskSyncApplicationService {
    if (!TaskSyncApplicationService.instance) {
      TaskSyncApplicationService.instance = TaskSyncApplicationService.createInstance();
    }
    return TaskSyncApplicationService.instance;
  }

  /**
   * 懒加载获取 Task Store
   */
  private get taskStore(): ReturnType<typeof useTaskStore> {
    return useTaskStore();
  }

  /**
   * 同步所有任务数据到 store
   * 用于应用初始化时加载所有数据
   * 使用聚合根模式：从 TaskTemplate 中提取 TaskInstance，避免额外的 API 调用
   */
  async syncAllTaskData(): Promise<{
    templatesCount: number;
    instancesCount: number;
  }> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      // 获取任务模板（包含实例数据）
      const response = await taskTemplateApiClient.getTaskTemplates({ limit: 1000 });
      const templates = response.data || response;

      // 转换模板为领域实体对象
      console.log('[TaskSync] Converting templates to entities:', templates.length);
      const entityTemplates = templates.map((templateDTO: TaskContracts.TaskTemplateClientDTO) =>
        TaskTemplateClient.fromClientDTO(templateDTO),
      );

      // 从模板的实例数组中提取所有实例
      const instances: TaskInstance[] = [];
      entityTemplates.forEach((template: TaskTemplate) => {
        if (template.instances && template.instances.length > 0) {
          console.log(
            '[TaskSync] Extracted instances from template:',
            template.uuid,
            template.instances.length,
          );
          instances.push(...template.instances);
        }
      });

      // 批量设置到 store
      this.taskStore.setTaskTemplates(entityTemplates);
      this.taskStore.setTaskInstances(instances);

      console.log(
        `✅ [TaskSync] 成功同步数据: ${entityTemplates.length} 个模板, ${instances.length} 个实例`,
      );

      return {
        templatesCount: entityTemplates.length,
        instancesCount: instances.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有任务数据失败';
      this.taskStore.setError(errorMessage);
      console.error('❌ [TaskSync] 同步所有任务数据失败:', error);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    try {
      const store = this.taskStore;

      // 1. 如果store没有初始化，肯定需要同步
      if (!store.isInitialized) {
        console.log('🔄 [缓存检查] Store未初始化，需要同步');
        return true;
      }

      // 2. 如果没有任何数据，需要同步
      if (store.getAllTaskTemplates.length === 0 && store.getAllTaskInstances.length === 0) {
        console.log('🔄 [缓存检查] 本地无数据，需要同步');
        return true;
      }

      // 3. 检查缓存是否过期
      if (store.shouldRefreshCache()) {
        console.log('🔄 [缓存检查] 缓存已过期，需要同步');
        return true;
      }

      // 4. 如果有数据且缓存未过期，使用本地数据
      console.log('✅ [缓存检查] 使用本地缓存数据，跳过同步');
      return false;
    } catch (error) {
      console.warn('[TaskSync] 检查同步状态时出错，默认需要同步:', error);
      return true; // 默认需要同步
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('🔄 [强制同步] 开始重新同步所有数据...');
    try {
      const result = await this.syncAllTaskData();
      console.log(
        `✅ [强制同步] 完成: ${result.templatesCount} 个模板，${result.instancesCount} 个实例`,
      );
    } catch (error) {
      console.error('❌ [强制同步] 失败:', error);
      throw error;
    }
  }

  /**
   * 智能同步数据 - 只在需要时同步
   */
  async smartSync(): Promise<{ synced: boolean; reason?: string }> {
    if (!this.shouldSyncData()) {
      return { synced: false, reason: '缓存有效，无需同步' };
    }

    try {
      const result = await this.syncAllTaskData();
      console.log(
        `✅ [智能同步] 完成: ${result.templatesCount} 个模板，${result.instancesCount} 个实例`,
      );
      return { synced: true, reason: '同步完成' };
    } catch (error) {
      console.error('❌ [智能同步] 失败:', error);
      throw error;
    }
  }

  /**
   * 检查并刷新过期数据
   */
  async refreshIfNeeded(): Promise<boolean> {
    try {
      const store = this.taskStore;

      // 检查是否需要刷新
      if (store.shouldRefreshCache()) {
        console.log('🔄 [刷新检查] 缓存已过期，开始刷新...');
        await this.forceSync();
        return true;
      } else {
        console.log('✅ [刷新检查] 缓存仍然有效');
        return false;
      }
    } catch (error) {
      console.error('❌ [刷新检查] 失败:', error);
      return false;
    }
  }

  /**
   * 初始化模块
   * 只初始化 store（加载本地缓存），不进行网络同步
   */
  async initializeModule(): Promise<void> {
    try {
      // 确保在 nextTick 后访问 store，避免 Pinia 初始化时机问题
      await new Promise((resolve) => setTimeout(resolve, 0));

      // 获取 store 实例并检查是否可用
      let store;
      try {
        store = this.taskStore;
      } catch (error) {
        console.warn('[TaskSync] Store 暂时不可用，跳过初始化:', error);
        return;
      }

      // 只初始化 store（加载本地缓存），不进行网络同步
      if (store && store.initialize && typeof store.initialize === 'function') {
        store.initialize();
      }
      console.log('[TaskSync] Task 模块基础初始化完成（仅本地缓存）');
    } catch (error) {
      console.error('[TaskSync] Task 模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 完整初始化（包含数据同步）
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      try {
        const store = this.taskStore;
        if (store && store.initialize && typeof store.initialize === 'function') {
          store.initialize();
        }
      } catch (storeError) {
        console.warn('[TaskSync] Store 初始化出错:', storeError);
      }

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('[TaskSync] 开始同步所有任务数据...');
        await this.syncAllTaskData();
      } else {
        console.log('[TaskSync] 使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('[TaskSync] Task 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      try {
        const store = this.taskStore;
        if (
          store &&
          store.initialize &&
          typeof store.initialize === 'function' &&
          !store.isInitialized
        ) {
          store.initialize();
        }
      } catch (fallbackError) {
        console.warn('[TaskSync] Store 回退初始化也失败:', fallbackError);
      }
      throw error;
    }
  }
}

/**
 * 导出单例实例
 */
export const taskSyncApplicationService = TaskSyncApplicationService.getInstance();
