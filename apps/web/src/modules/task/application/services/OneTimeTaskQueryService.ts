/**
 * ONE_TIME Task Query Service
 * 一次性任务查询服务
 * 
 * 职责：
 * - 任务列表查询（带过滤条件）
 * - 特定场景查询（今日、逾期、即将到期、按优先级等）
 * - 任务仪表板数据
 * - 按标签、目标、关键结果查询
 * - 子任务查询
 */

import { TaskTemplate, TaskInstance } from '@dailyuse/domain-client';
import type { TaskContracts } from '@dailyuse/contracts';
import { oneTimeTaskApiClient } from '../../infrastructure/api/taskApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('OneTimeTaskQueryService');

export class OneTimeTaskQueryService {
  private static instance: OneTimeTaskQueryService;

  private constructor() {}

  static getInstance(): OneTimeTaskQueryService {
    if (!OneTimeTaskQueryService.instance) {
      OneTimeTaskQueryService.instance = new OneTimeTaskQueryService();
    }
    return OneTimeTaskQueryService.instance;
  }

  // ===== 基础查询 =====

  /**
   * 获取一次性任务列表（支持过滤）
   */
  async getOneTimeTasks(
    filters?: TaskContracts.TaskFiltersRequest,
  ): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching one-time tasks', { filters });
      const dtos = await oneTimeTaskApiClient.getOneTimeTasks(filters);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('One-time tasks fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch one-time tasks', { error, filters });
      throw error;
    }
  }

  // ===== 场景化查询 =====

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching today tasks');
      const dtos = await oneTimeTaskApiClient.getTodayTasks();
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Today tasks fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch today tasks', { error });
      throw error;
    }
  }

  /**
   * 获取逾期任务
   */
  async getOverdueTasks(): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching overdue tasks');
      const dtos = await oneTimeTaskApiClient.getOverdueTasks();
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Overdue tasks fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch overdue tasks', { error });
      throw error;
    }
  }

  /**
   * 获取即将到期的任务
   */
  async getUpcomingTasks(days: number = 7): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching upcoming tasks', { days });
      const dtos = await oneTimeTaskApiClient.getUpcomingTasks(days);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Upcoming tasks fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch upcoming tasks', { error, days });
      throw error;
    }
  }

  /**
   * 按优先级获取任务
   */
  async getTasksByPriority(limit?: number): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching tasks by priority', { limit });
      const dtos = await oneTimeTaskApiClient.getTasksByPriority(limit);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Tasks by priority fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch tasks by priority', { error, limit });
      throw error;
    }
  }

  /**
   * 获取被阻塞的任务
   */
  async getBlockedTasks(): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching blocked tasks');
      const dtos = await oneTimeTaskApiClient.getBlockedTasks();
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Blocked tasks fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch blocked tasks', { error });
      throw error;
    }
  }

  // ===== 仪表板 =====

  /**
   * 获取任务仪表板数据
   */
  async getTaskDashboard(): Promise<TaskContracts.TaskDashboardResponse> {
    try {
      logger.info('Fetching task dashboard');
      const dashboard = await oneTimeTaskApiClient.getTaskDashboard();
      logger.info('Task dashboard fetched successfully');
      return dashboard;
    } catch (error) {
      logger.error('Failed to fetch task dashboard', { error });
      throw error;
    }
  }

  // ===== 时间范围查询 =====

  /**
   * 按日期范围获取任务
   */
  async getTasksByDateRange(
    startDate: number,
    endDate: number,
  ): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching tasks by date range', { startDate, endDate });
      const dtos = await oneTimeTaskApiClient.getTasksByDateRange(String(startDate), String(endDate));
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Tasks by date range fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch tasks by date range', { error, startDate, endDate });
      throw error;
    }
  }

  // ===== 标签查询 =====

  /**
   * 按标签获取任务
   */
  async getTasksByTags(tags: string[]): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching tasks by tags', { tags });
      const dtos = await oneTimeTaskApiClient.getTasksByTags(tags);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Tasks by tags fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch tasks by tags', { error, tags });
      throw error;
    }
  }

  // ===== 目标关联查询 =====

  /**
   * 获取目标关联的任务
   */
  async getTasksByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching tasks by goal', { goalUuid });
      const dtos = await oneTimeTaskApiClient.getTasksByGoal(goalUuid);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Tasks by goal fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch tasks by goal', { error, goalUuid });
      throw error;
    }
  }

  /**
   * 获取关键结果关联的任务
   */
  async getTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching tasks by key result', { keyResultUuid });
      const dtos = await oneTimeTaskApiClient.getTasksByKeyResult(keyResultUuid);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Tasks by key result fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch tasks by key result', { error, keyResultUuid });
      throw error;
    }
  }

  // ===== 子任务查询 =====

  /**
   * 获取子任务列表
   */
  async getSubtasks(parentUuid: string): Promise<TaskTemplate[]> {
    try {
      logger.info('Fetching subtasks', { parentUuid });
      const dtos = await oneTimeTaskApiClient.getSubtasks(parentUuid);
      const tasks = dtos.map(dto => TaskTemplateClient.fromServerDTO(dto));
      logger.info('Subtasks fetched successfully', { count: tasks.length, parentUuid });
      return tasks;
    } catch (error) {
      logger.error('Failed to fetch subtasks', { error, parentUuid });
      throw error;
    }
  }
}

// 导出单例实例
export const oneTimeTaskQueryService = OneTimeTaskQueryService.getInstance();
