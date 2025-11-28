/**
 * Schedule Web Application Service
 * 调度Web应用服务 - 参考 Goal 模块实现
 */

import { scheduleApiClient } from '../infrastructure/api';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type {
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequestDTO,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
} from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '@dailyuse/domain-client/schedule';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleWebApplicationService');

/**
 * Schedule Web Application Service
 * 封装所有与 Schedule 相关的业务操作
 */
export class ScheduleWebApplicationService {
  /**
   * 将客户端 DTO 转换为领域聚合
   */
  private toScheduleTaskAggregate(
    task: ScheduleTaskClientDTO,
  ): ScheduleTask {
    return ScheduleTask.fromClientDTO(task);
  }

  /**
   * 将客户端 DTO 列表转换为领域聚合列表
   */
  private toScheduleTaskAggregateList(
    tasks: ScheduleTaskClientDTO[],
  ): ScheduleTask[] {
    return tasks.map((task) => this.toScheduleTaskAggregate(task));
  }

  // ============ 任务管理方法 ============

  /**
   * 创建调度任务
   */
  async createTask(
    request: CreateScheduleTaskRequestDTO,
  ): Promise<ScheduleTask> {
    try {
      logger.info('Creating schedule task', { name: request.name });
      const task = await scheduleApiClient.createTask(request);
      logger.info('Schedule task created successfully', { taskUuid: task.uuid });
      return this.toScheduleTaskAggregate(task);
    } catch (error) {
      logger.error('Failed to create schedule task', { error });
      throw error;
    }
  }

  /**
   * 批量创建调度任务
   */
  async createTasksBatch(
    tasks: CreateScheduleTaskRequestDTO[],
  ): Promise<ScheduleTask[]> {
    try {
      logger.info('Creating schedule tasks batch', { count: tasks.length });
      const createdTasks = await scheduleApiClient.createTasksBatch(tasks);
      logger.info('Schedule tasks batch created successfully', { count: createdTasks.length });
      return this.toScheduleTaskAggregateList(createdTasks);
    } catch (error) {
      logger.error('Failed to create schedule tasks batch', { error });
      throw error;
    }
  }

  /**
   * 获取所有调度任务
   */
  async getAllTasks(): Promise<ScheduleTask[]> {
    try {
      logger.info('Fetching all schedule tasks');
      const tasks = await scheduleApiClient.getTasks();
      logger.info('Schedule tasks fetched successfully', { count: tasks.length });
      return this.toScheduleTaskAggregateList(tasks);
    } catch (error) {
      logger.error('Failed to fetch schedule tasks', { error });
      throw error;
    }
  }

  /**
   * 根据模块获取任务
   */
  async getTasksByModule(
    module: SourceModule,
  ): Promise<ScheduleTask[]> {
    try {
      logger.info('Fetching tasks by module', { module });
      const allTasks = await scheduleApiClient.getTasks();
      const filteredTasks = allTasks.filter((task) => task.sourceModule === module);
      logger.info('Tasks filtered by module', { module, count: filteredTasks.length });
      return this.toScheduleTaskAggregateList(filteredTasks);
    } catch (error) {
      logger.error('Failed to fetch tasks by module', { error, module });
      throw error;
    }
  }

  /**
   * 获取任务详情
   */
  async getTaskById(taskUuid: string): Promise<ScheduleTask> {
    try {
      logger.info('Fetching task by ID', { taskUuid });
      const task = await scheduleApiClient.getTaskById(taskUuid);
      logger.info('Task fetched successfully', { taskUuid });
      return this.toScheduleTaskAggregate(task);
    } catch (error) {
      logger.error('Failed to fetch task', { error, taskUuid });
      throw error;
    }
  }

  /**
   * 查找待执行任务
   */
  async getDueTasks(params?: {
    beforeTime?: string;
    limit?: number;
  }): Promise<ScheduleTask[]> {
    try {
      logger.info('Fetching due tasks', { params });
      const tasks = await scheduleApiClient.getDueTasks(params);
      logger.info('Due tasks fetched successfully', { count: tasks.length });
      return this.toScheduleTaskAggregateList(tasks);
    } catch (error) {
      logger.error('Failed to fetch due tasks', { error });
      throw error;
    }
  }

  /**
   * 根据来源获取任务
   */
  async getTaskBySource(
    sourceModule: SourceModule,
    sourceEntityId: string,
  ): Promise<ScheduleTask[]> {
    try {
      logger.info('Fetching task by source', { sourceModule, sourceEntityId });
      const tasks = await scheduleApiClient.getTaskBySource(sourceModule, sourceEntityId);
      logger.info('Tasks fetched by source', { count: tasks.length });
      return this.toScheduleTaskAggregateList(tasks);
    } catch (error) {
      logger.error('Failed to fetch task by source', { error, sourceModule, sourceEntityId });
      throw error;
    }
  }

  // ============ 任务状态管理方法 ============

  /**
   * 暂停任务
   */
  async pauseTask(taskUuid: string): Promise<void> {
    try {
      logger.info('Pausing task', { taskUuid });
      await scheduleApiClient.pauseTask(taskUuid);
      logger.info('Task paused successfully', { taskUuid });
    } catch (error) {
      logger.error('Failed to pause task', { error, taskUuid });
      throw error;
    }
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskUuid: string): Promise<void> {
    try {
      logger.info('Resuming task', { taskUuid });
      await scheduleApiClient.resumeTask(taskUuid);
      logger.info('Task resumed successfully', { taskUuid });
    } catch (error) {
      logger.error('Failed to resume task', { error, taskUuid });
      throw error;
    }
  }

  /**
   * 完成任务
   */
  async completeTask(taskUuid: string, reason?: string): Promise<void> {
    try {
      logger.info('Completing task', { taskUuid, reason });
      await scheduleApiClient.completeTask(taskUuid, reason);
      logger.info('Task completed successfully', { taskUuid });
    } catch (error) {
      logger.error('Failed to complete task', { error, taskUuid });
      throw error;
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(taskUuid: string, reason?: string): Promise<void> {
    try {
      logger.info('Cancelling task', { taskUuid, reason });
      await scheduleApiClient.cancelTask(taskUuid, reason);
      logger.info('Task cancelled successfully', { taskUuid });
    } catch (error) {
      logger.error('Failed to cancel task', { error, taskUuid });
      throw error;
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(taskUuid: string): Promise<void> {
    try {
      logger.info('Deleting task', { taskUuid });
      await scheduleApiClient.deleteTask(taskUuid);
      logger.info('Task deleted successfully', { taskUuid });
    } catch (error) {
      logger.error('Failed to delete task', { error, taskUuid });
      throw error;
    }
  }

  /**
   * 批量删除任务
   */
  async deleteTasksBatch(taskUuids: string[]): Promise<void> {
    try {
      logger.info('Deleting tasks batch', { count: taskUuids.length });
      await scheduleApiClient.deleteTasksBatch(taskUuids);
      logger.info('Tasks batch deleted successfully', { count: taskUuids.length });
    } catch (error) {
      logger.error('Failed to delete tasks batch', { error });
      throw error;
    }
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
    try {
      logger.info('Updating task metadata', { taskUuid });
      await scheduleApiClient.updateTaskMetadata(taskUuid, metadata);
      logger.info('Task metadata updated successfully', { taskUuid });
    } catch (error) {
      logger.error('Failed to update task metadata', { error, taskUuid });
      throw error;
    }
  }

  // ============ 统计信息方法 ============

  /**
   * 获取统计信息
   */
  async getStatistics(): Promise<ScheduleStatisticsClientDTO> {
    try {
      logger.info('Fetching schedule statistics');
      const statistics = await scheduleApiClient.getStatistics();
      logger.info('Schedule statistics fetched successfully');
      return statistics;
    } catch (error) {
      logger.error('Failed to fetch schedule statistics', { error });
      throw error;
    }
  }

  /**
   * 获取模块级别统计
   */
  async getModuleStatistics(
    module: SourceModule,
  ): Promise<ModuleStatisticsClientDTO> {
    try {
      logger.info('Fetching module statistics', { module });
      const statistics = await scheduleApiClient.getModuleStatistics(module);
      logger.info('Module statistics fetched successfully', { module });
      return statistics;
    } catch (error) {
      logger.error('Failed to fetch module statistics', { error, module });
      throw error;
    }
  }

  /**
   * 获取所有模块统计
   */
  async getAllModuleStatistics(): Promise<
    Record<SourceModule, ModuleStatisticsClientDTO>
  > {
    try {
      logger.info('Fetching all module statistics');
      const statistics = await scheduleApiClient.getAllModuleStatistics();
      logger.info('All module statistics fetched successfully');
      return statistics;
    } catch (error) {
      logger.error('Failed to fetch all module statistics', { error });
      throw error;
    }
  }

  /**
   * 重新计算统计信息
   */
  async recalculateStatistics(): Promise<ScheduleStatisticsClientDTO> {
    try {
      logger.info('Recalculating statistics');
      const statistics = await scheduleApiClient.recalculateStatistics();
      logger.info('Statistics recalculated successfully');
      return statistics;
    } catch (error) {
      logger.error('Failed to recalculate statistics', { error });
      throw error;
    }
  }

  /**
   * 重置统计信息
   */
  async resetStatistics(): Promise<void> {
    try {
      logger.info('Resetting statistics');
      await scheduleApiClient.resetStatistics();
      logger.info('Statistics reset successfully');
    } catch (error) {
      logger.error('Failed to reset statistics', { error });
      throw error;
    }
  }

  /**
   * 删除统计信息
   */
  async deleteStatistics(): Promise<void> {
    try {
      logger.info('Deleting statistics');
      await scheduleApiClient.deleteStatistics();
      logger.info('Statistics deleted successfully');
    } catch (error) {
      logger.error('Failed to delete statistics', { error });
      throw error;
    }
  }
}

// 导出单例实例
export const scheduleWebApplicationService = new ScheduleWebApplicationService();

