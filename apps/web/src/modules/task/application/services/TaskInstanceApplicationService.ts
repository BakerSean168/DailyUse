/**
 * Task Instance Application Service
 * 任务实例应用服务 - 负责任务实例的 CRUD 操作和状态管理
 */

import { TaskDomain } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { useTaskStore } from '../../presentation/stores/taskStore';
import { taskInstanceApiClient } from '../../infrastructure/api/taskApiClient';

// 导入类实现
const TaskInstanceClient = TaskDomain.TaskInstanceClient;

// 类型别名
type TaskInstance = TaskDomain.TaskInstance;

export class TaskInstanceApplicationService {
  private static instance: TaskInstanceApplicationService;

  private constructor() {}

  /**
   * 创建应用服务实例
   */
  static createInstance(): TaskInstanceApplicationService {
    TaskInstanceApplicationService.instance = new TaskInstanceApplicationService();
    return TaskInstanceApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): TaskInstanceApplicationService {
    if (!TaskInstanceApplicationService.instance) {
      TaskInstanceApplicationService.instance = TaskInstanceApplicationService.createInstance();
    }
    return TaskInstanceApplicationService.instance;
  }

  /**
   * 懒加载获取 Task Store
   */
  private get taskStore(): ReturnType<typeof useTaskStore> {
    return useTaskStore();
  }

  /**
   * 创建任务实例
   * @deprecated 后端不支持直接创建实例，请使用 TaskTemplate 的 generateInstances 方法
   */
  async createTaskInstance(request: any): Promise<TaskContracts.TaskInstanceClientDTO> {
    throw new Error('createTaskInstance is not supported - use TaskTemplate.generateInstances instead');
  }

  /**
   * 获取任务实例详情
   */
  async getTaskInstanceById(uuid: string): Promise<TaskContracts.TaskInstanceClientDTO | null> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instanceDTO = await taskInstanceApiClient.getTaskInstanceById(uuid);

      // 转换为实体对象并添加到缓存
      const entityInstance = TaskInstanceClient.fromClientDTO(instanceDTO);
      this.taskStore.addTaskInstance(entityInstance);

      return instanceDTO;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取任务实例详情失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 更新任务实例
   * @deprecated 后端不支持更新实例，请使用特定的状态转换方法（start/complete/skip）
   */
  async updateTaskInstance(
    uuid: string,
    request: any,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    throw new Error('updateTaskInstance is not supported - use start/complete/skip methods instead');
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      await taskInstanceApiClient.deleteTaskInstance(uuid);

      // 从缓存中移除
      this.taskStore.removeTaskInstance(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 完成任务实例
   */
  async completeTaskInstance(
    uuid: string,
    request?: {
      duration?: number;
      note?: string;
      rating?: number;
    },
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    try {
      this.taskStore.setLoading(true);
      this.taskStore.setError(null);

      const instanceDTO = await taskInstanceApiClient.completeTaskInstance(uuid, request);

      // 转换为实体对象并更新缓存
      const entityInstance = TaskInstanceClient.fromClientDTO(instanceDTO);
      this.taskStore.updateTaskInstance(uuid, entityInstance);

      return instanceDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '完成任务实例失败';
      this.taskStore.setError(errorMessage);
      throw error;
    } finally {
      this.taskStore.setLoading(false);
    }
  }

  /**
   * 撤销任务完成
   * @deprecated 后端不支持撤销完成功能
   */
  async undoCompleteTaskInstance(uuid: string): Promise<TaskContracts.TaskInstanceClientDTO> {
    throw new Error('undoCompleteTaskInstance is not supported');
  }

  /**
   * 重新安排任务实例
   * @deprecated 后端不支持重新安排功能
   */
  async rescheduleTaskInstance(
    uuid: string,
    request: any,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    throw new Error('rescheduleTaskInstance is not supported');
  }

  /**
   * 取消任务实例
   * @deprecated 后端不支持取消功能，请使用 skipTaskInstance
   */
  async cancelTaskInstance(
    uuid: string,
    reason?: string,
  ): Promise<TaskContracts.TaskInstanceClientDTO> {
    throw new Error('cancelTaskInstance is not supported - use skipTaskInstance instead');
  }

  /**
   * 搜索任务实例
   * @deprecated 后端不支持搜索功能，请使用 getTaskInstances 过滤
   */
  async searchTaskInstances(params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<{
    data: TaskContracts.TaskInstanceClientDTO[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    throw new Error('searchTaskInstances is not supported - use getTaskInstances with filters instead');
  }

  /**
   * 获取今日任务
   * @deprecated 后端不支持，请使用 getTaskInstances 并过滤日期
   */
  async getTodayInstances(): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    throw new Error('getTodayInstances is not supported - use getTaskInstances with date filters instead');
  }

  /**
   * 获取即将到期的任务
   * @deprecated 后端不支持，请使用 getTaskInstances 并过滤日期
   */
  async getUpcomingInstances(days?: number): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    throw new Error('getUpcomingInstances is not supported - use getTaskInstances with date filters instead');
  }

  /**
   * 获取逾期任务
   * @deprecated 后端不支持，请使用 getTaskInstances 并过滤日期
   */
  async getOverdueInstances(): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    throw new Error('getOverdueInstances is not supported - use getTaskInstances with date filters instead');
  }
}

/**
 * 导出单例实例
 */
export const taskInstanceApplicationService = TaskInstanceApplicationService.getInstance();
