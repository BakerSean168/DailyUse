/**
 * Schedule Event Application Service
 * 日程事件应用服务 - 负责 ScheduleEvent 的 CRUD 操作
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 *
 * 📝 错误处理说明：
 * - axios 拦截器已处理 API 错误，success: false 会抛出 Error
 * - Service 直接抛出错误，由 Composable 层统一处理
 */

import type {
  ScheduleClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
} from '@dailyuse/contracts/schedule';
import { scheduleEventApiClient } from '../../infrastructure/api/scheduleEventApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleEventApplicationService');

export class ScheduleEventApplicationService {
  private static instance: ScheduleEventApplicationService;

  private constructor() {}

  static getInstance(): ScheduleEventApplicationService {
    if (!ScheduleEventApplicationService.instance) {
      ScheduleEventApplicationService.instance = new ScheduleEventApplicationService();
    }
    return ScheduleEventApplicationService.instance;
  }

  /**
   * 创建日程事件
   */
  async createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO> {
    logger.info('Creating schedule', { title: data.title });
    const schedule = await scheduleEventApiClient.createSchedule(data);
    logger.info('Schedule created', { uuid: schedule.uuid });
    return schedule;
  }

  /**
   * 获取日程事件详情
   */
  async getSchedule(uuid: string): Promise<ScheduleClientDTO> {
    logger.info('Fetching schedule', { uuid });
    const schedule = await scheduleEventApiClient.getSchedule(uuid);
    logger.info('Schedule fetched', { uuid });
    return schedule;
  }

  /**
   * 获取账户的所有日程事件
   */
  async getSchedulesByAccount(): Promise<ScheduleClientDTO[]> {
    logger.info('Fetching all schedules for account');
    const schedules = await scheduleEventApiClient.getSchedulesByAccount();
    logger.info('Schedules fetched', { count: schedules.length });
    return schedules;
  }

  /**
   * 获取指定时间范围内的日程事件
   */
  async getSchedulesByTimeRange(
    params: GetSchedulesByTimeRangeRequest,
  ): Promise<ScheduleClientDTO[]> {
    logger.info('Fetching schedules by time range', {
      startTime: params.startTime,
      endTime: params.endTime,
    });
    const schedules = await scheduleEventApiClient.getSchedulesByTimeRange(params);
    logger.info('Schedules fetched by time range', { count: schedules.length });
    return schedules;
  }

  /**
   * 更新日程事件
   */
  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<ScheduleClientDTO> {
    logger.info('Updating schedule', { uuid });
    const schedule = await scheduleEventApiClient.updateSchedule(uuid, data);
    logger.info('Schedule updated', { uuid });
    return schedule;
  }

  /**
   * 删除日程事件
   */
  async deleteSchedule(uuid: string): Promise<void> {
    logger.info('Deleting schedule', { uuid });
    await scheduleEventApiClient.deleteSchedule(uuid);
    logger.info('Schedule deleted', { uuid });
  }

  /**
   * 获取日程冲突详情
   */
  async getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult> {
    logger.info('Fetching schedule conflicts', { uuid });
    const result = await scheduleEventApiClient.getScheduleConflicts(uuid);
    logger.info('Schedule conflicts fetched', { uuid, hasConflicts: result.hasConflict });
    return result;
  }
}

export const scheduleEventApplicationService = ScheduleEventApplicationService.getInstance();
