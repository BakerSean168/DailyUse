/**
 * Task Instance Application Service
 * 任务实例应用服务 - 负责任务实例的 CRUD 操作和状态管理
 * 
 * 🔄 重构说明（方案 A）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 * 
 * 📝 错误处理说明：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Service 直接抛出错误，由 Composable 层统一处理
 * - 不需要包装成 ServiceResult，保持简洁
 */

import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client/task';
import type { TaskTemplateClientDTO, TaskInstanceClientDTO, TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import { taskInstanceApiClient } from '../../infrastructure/api/taskApiClient';

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
   * 创建任务实例
   * @deprecated 后端不支持直接创建实例，请使用 TaskTemplate 的 generateInstances 方法
   */
  async createTaskInstance(_request: any): Promise<never> {
    throw new Error('createTaskInstance is not supported - use TaskTemplate.generateInstances instead');
  }

  /**
   * 获取任务实例详情
   * @returns 返回实体对象，调用方负责存储
   */
  async getTaskInstanceById(uuid: string): Promise<TaskInstance> {
    const instanceDTO = await taskInstanceApiClient.getTaskInstanceById(uuid);
    return TaskInstance.fromClientDTO(instanceDTO);
  }

  /**
   * 更新任务实例
   * @deprecated 后端不支持更新实例，请使用特定的状态转换方法（start/complete/skip）
   */
  async updateTaskInstance(_uuid: string, _request: any): Promise<never> {
    throw new Error('updateTaskInstance is not supported - use start/complete/skip methods instead');
  }

  /**
   * 删除任务实例
   */
  async deleteTaskInstance(uuid: string): Promise<void> {
    await taskInstanceApiClient.deleteTaskInstance(uuid);
  }

  /**
   * 完成任务实例
   * @returns 返回更新后的实体对象，调用方负责存储
   */
  async completeTaskInstance(
    uuid: string,
    request?: {
      duration?: number;
      note?: string;
      rating?: number;
    },
  ): Promise<TaskInstance> {
    console.log('🔄 [TaskInstanceAppService] 开始完成任务实例:', uuid);

    const instanceDTO = await taskInstanceApiClient.completeTaskInstance(uuid, request);

    console.log('✅ [TaskInstanceAppService] API 返回成功:', {
      uuid: instanceDTO.uuid,
      status: instanceDTO.status,
    });

    // 转换为实体对象
    const entityInstance = TaskInstance.fromClientDTO(instanceDTO);
    console.log('🔄 [TaskInstanceAppService] 转换为实体对象:', {
      uuid: entityInstance.uuid,
      status: entityInstance.status,
      isCompleted: entityInstance.isCompleted,
    });

    return entityInstance;
  }

  /**
   * 撤销任务完成
   * @deprecated 后端不支持撤销完成功能
   */
  async undoCompleteTaskInstance(_uuid: string): Promise<never> {
    throw new Error('undoCompleteTaskInstance is not supported');
  }

  /**
   * 重新安排任务实例
   * @deprecated 后端不支持重新安排功能
   */
  async rescheduleTaskInstance(_uuid: string, _request: any): Promise<never> {
    throw new Error('rescheduleTaskInstance is not supported');
  }

  /**
   * 取消任务实例
   * @deprecated 后端不支持取消功能，请使用 skipTaskInstance
   */
  async cancelTaskInstance(_uuid: string, _reason?: string): Promise<never> {
    throw new Error('cancelTaskInstance is not supported - use skipTaskInstance instead');
  }

  /**
   * 搜索任务实例
   * @deprecated 后端不支持搜索功能，请使用 getTaskInstances 过滤
   */
  async searchTaskInstances(_params: {
    query: string;
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    importance?: string;
    urgency?: string;
    tags?: string[];
  }): Promise<never> {
    throw new Error('searchTaskInstances is not supported - use getTaskInstances with filters instead');
  }

  /**
   * 获取今日任务
   * @deprecated 后端不支持，请使用 getTaskInstances 并过滤日期
   */
  async getTodayInstances(): Promise<never> {
    throw new Error('getTodayInstances is not supported - use getTaskInstances with date filters instead');
  }

  /**
   * 获取即将到期的任务
   * @deprecated 后端不支持，请使用 getTaskInstances 并过滤日期
   */
  async getUpcomingInstances(_days?: number): Promise<never> {
    throw new Error('getUpcomingInstances is not supported - use getTaskInstances with date filters instead');
  }

  /**
   * 获取逾期任务
   * @deprecated 后端不支持，请使用 getTaskInstances 并过滤日期
   */
  async getOverdueInstances(): Promise<never> {
    throw new Error('getOverdueInstances is not supported - use getTaskInstances with date filters instead');
  }
}

/**
 * 导出单例实例
 */
export const taskInstanceApplicationService = TaskInstanceApplicationService.getInstance();

