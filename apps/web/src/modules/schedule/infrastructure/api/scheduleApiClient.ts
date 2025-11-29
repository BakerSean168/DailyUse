import { apiClient } from '@/shared/api/instances';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
  ConflictDetectionResult,
  CreateScheduleRequest,
  ScheduleClientDTO,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';

/**
 * Schedule API 客户端
 * 严格参考 Repository 模块实现
 */
export class ScheduleApiClient {
  private readonly baseUrl = '/schedules';

  // ===== Schedule Task CRUD =====

  /**
   * 创建调度任务
   */
  async createTask(
    request: CreateScheduleTaskRequest,
  ): Promise<ScheduleTaskClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/tasks`, request);
    return data;
  }

  /**
   * 批量创建调度任务
   */
  async createTasksBatch(
    tasks: CreateScheduleTaskRequest[],
  ): Promise<ScheduleTaskClientDTO[]> {
    const data = await apiClient.post(`${this.baseUrl}/tasks/batch`, { tasks });
    return data;
  }

  /**
   * 获取调度任务列表
   */
  async getTasks(): Promise<ScheduleTaskClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/tasks`);
    return data;
  }

  /**
   * 获取调度任务详情
   */
  async getTaskById(taskUuid: string): Promise<ScheduleTaskClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/tasks/${taskUuid}`);
    return data;
  }

  /**
   * 查找待执行任务
   */
  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleTaskClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/tasks/due`, { params });
    return data;
  }

  /**
   * 根据来源模块和实体ID获取任务
   */
  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTaskClientDTO[]> {
    const data = await apiClient.get(`${this.baseUrl}/tasks`, {
      params: { sourceModule, sourceEntityId },
    });
    return data;
  }

  // ===== Schedule Task Status Management =====

  /**
   * 暂停任务
   */
  async pauseTask(taskUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/pause`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskUuid: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/resume`);
  }

  /**
   * 完成任务
   */
  async completeTask(taskUuid: string, reason?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/complete`, { reason });
  }

  /**
   * 取消任务
   */
  async cancelTask(taskUuid: string, reason?: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/${taskUuid}/cancel`, { reason });
  }

  /**
   * 删除任务
   */
  async deleteTask(taskUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/tasks/${taskUuid}`);
  }

  /**
   * 批量删除任务
   */
  async deleteTasksBatch(taskUuids: string[]): Promise<void> {
    await apiClient.post(`${this.baseUrl}/tasks/batch/delete`, { taskUuids });
  }

  /**
   * 更新任务元数据
   */
  async updateTaskMetadata(
    taskUuid: string,
    metadata: {
      payload?: any;
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    },
  ): Promise<void> {
    await apiClient.patch(`${this.baseUrl}/tasks/${taskUuid}/metadata`, metadata);
  }

  // ===== Schedule Statistics =====

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ScheduleStatisticsClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/statistics`);
    return data;
  }

  /**
   * 获取模块级别统计
   */
  async getModuleStatistics(
    module: SourceModule,
  ): Promise<ModuleStatisticsClientDTO> {
    const data = await apiClient.get(`${this.baseUrl}/statistics/module/${module}`);
    return data;
  }

  /**
   * 获取所有模块统计
   */
  async getAllModuleStatistics(): Promise<
    Record<SourceModule, ModuleStatisticsClientDTO>
  > {
    const data = await apiClient.get(`${this.baseUrl}/statistics/modules`);
    return data;
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(): Promise<ScheduleStatisticsClientDTO> {
    const data = await apiClient.post(`${this.baseUrl}/statistics/recalculate`);
    return data;
  }

  /**
   * 重置统计信息
   */
  async resetStatistics(): Promise<void> {
    await apiClient.post(`${this.baseUrl}/statistics/reset`);
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/statistics`);
  }

  // ===== Schedule Conflict Detection (Story 9.5) =====

  /**
   * 检测日程冲突
   * POST /api/v1/schedules/detect-conflicts
   * 
   * @param params 冲突检测参数
   * @returns 冲突检测结果
   */
  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<ConflictDetectionResult> {
    const data = await apiClient.post(`${this.baseUrl}/detect-conflicts`, params);
    return data;
  }

  /**
   * 创建日程（带冲突检测）
   * POST /api/v1/schedules
   * 
   * @param request 创建日程请求
   * @returns 创建的日程和冲突检测结果
   */
  async createSchedule(
    request: CreateScheduleRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
  }

  /**
   * 解决日程冲突
   * POST /api/v1/schedules/:id/resolve-conflict
   * 
   * @param scheduleUuid 日程UUID
   * @param request 解决冲突请求
   * @returns 解决结果（更新的日程、重新检测的冲突、应用的变更）
   */
  async resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts: ConflictDetectionResult;
    applied: {
      strategy: string;
      previousStartTime?: number;
      previousEndTime?: number;
      changes: string[];
    };
  }> {
    const data = await apiClient.post(
      `${this.baseUrl}/${scheduleUuid}/resolve-conflict`,
      request,
    );
    return data;
  }
}

// 导出单例实例
export const scheduleApiClient = new ScheduleApiClient();

