/**
 * Task Template Application Service
 * 任务模板应用服务 - 负责任务模板的 CRUD 操作
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

export class TaskTemplateApplicationService {
  private static instance: TaskTemplateApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): TaskTemplateApplicationService {
    TaskTemplateApplicationService.instance = new TaskTemplateApplicationService();
    return TaskTemplateApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): TaskTemplateApplicationService {
    if (!TaskTemplateApplicationService.instance) {
      TaskTemplateApplicationService.instance = TaskTemplateApplicationService.createInstance();
    }
    return TaskTemplateApplicationService.instance;
  }

  /**
   * 懒加载获取 Task Store
   */
  private get taskStore(): ReturnType<typeof useTaskStore> {
    return useTaskStore();
  }

  /**
   * 创建任务模板
   */
  async createTaskTemplate(request: any): Promise<TaskContracts.TaskTemplateClientDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const templateDTO = await taskTemplateApiClient.createTaskTemplate(request);

      // 转换为实体对象并添加到缓存
      const entityTemplate = TaskTemplateClient.fromClientDTO(templateDTO);
      this.taskStore.addTaskTemplate(entityTemplate);

      // 更新同步时间
      this.taskStore.updateLastSyncTime();

      return templateDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 通过元模板创建任务模板
   * @deprecated API 中暂未实现 MetaTemplate 功能
   */
  async createTaskTemplateByMetaTemplate(metaTemplateUuid: string): Promise<TaskTemplate> {
    // TODO: 等待 API 实现 MetaTemplate 功能
    throw new Error('MetaTemplate API not implemented yet');
  }

  /**
   * 获取任务模板列表
   */
  async getTaskTemplates(params?: {
    page?: number;
    limit?: number;
    status?: string;
    goalUuid?: string;
  }): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const templates = await taskTemplateApiClient.getTaskTemplates(params);

      // 转换为实体对象并批量同步到 store
      const entityTemplates = templates.map((dto: TaskContracts.TaskTemplateClientDTO) =>
        TaskTemplateClient.fromClientDTO(dto),
      );
      this.taskStore.setTaskTemplates(entityTemplates);

      return templates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取任务模板列表失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplateById(
    uuid: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO | null> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const templateDTO = await taskTemplateApiClient.getTaskTemplateById(uuid);

      // 转换为实体对象并添加到缓存
      const entityTemplate = TaskTemplateClient.fromClientDTO(templateDTO);
      this.taskStore.addTaskTemplate(entityTemplate);

      return templateDTO;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取任务模板详情失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务模板
   * @deprecated 后端 API 不支持部分更新，请使用具体的更新方法
   */
  async updateTaskTemplate(uuid: string, request: any): Promise<TaskContracts.TaskTemplateClientDTO> {
    throw new Error('updateTaskTemplate is not supported - use specific update methods instead');
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      await taskTemplateApiClient.deleteTaskTemplate(uuid);

      // 从缓存中移除
      this.taskStore.removeTaskTemplate(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(
    uuid: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const templateDTO = await taskTemplateApiClient.activateTaskTemplate(uuid);

      // 转换为实体对象并更新缓存
      const entityTemplate = TaskTemplateClient.fromClientDTO(templateDTO);
      this.taskStore.updateTaskTemplate(uuid, entityTemplate);

      // ✅ 激活后重新获取完整的模板数据（包含 instances）
      try {
        const fullTemplateDTO = await taskTemplateApiClient.getTaskTemplateById(uuid);
        if (fullTemplateDTO) {
          const fullTemplate = TaskTemplateClient.fromClientDTO(fullTemplateDTO);
          this.taskStore.updateTaskTemplate(uuid, fullTemplate);

          // 同步 instances 到 store（从聚合根中提取）
          if (fullTemplate.instances && fullTemplate.instances.length > 0) {
            this.taskStore.setTaskInstances(fullTemplate.instances);
          }
        }
      } catch (instanceError) {
        console.warn('激活模板后刷新模板数据失败:', instanceError);
        // 不阻断主流程，只记录警告
      }

      // 更新同步时间
      this.taskStore.updateLastSyncTime();

      return templateDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const templateDTO = await taskTemplateApiClient.pauseTaskTemplate(uuid);

      // 转换为实体对象并更新缓存
      const entityTemplate = TaskTemplateClient.fromClientDTO(templateDTO);
      this.taskStore.updateTaskTemplate(uuid, entityTemplate);

      return templateDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '暂停任务模板失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 搜索任务模板
   * @deprecated 后端 API 不支持搜索功能，请使用 getTaskTemplates 过滤
   */
  async searchTaskTemplates(params: {
    query: string;
    page?: number;
    limit?: number;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<{
    data: TaskContracts.TaskTemplateClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    throw new Error('searchTaskTemplates is not supported - use getTaskTemplates with filters instead');
  }
}

/**
 * 导出单例实例
 */
export const taskTemplateApplicationService = TaskTemplateApplicationService.getInstance();
