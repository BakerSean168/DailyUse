/**
 * Schedule Conflict Application Service
 * 日程冲突检测应用服务 - 负责日程冲突检测和解决
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 * - 这样确保无循环依赖，且 Service 可独立测试
 *
 * Story 9.5: Schedule Conflict Detection
 */

import type {
  ConflictDetectionResult,
  CreateScheduleRequest,
  ScheduleClientDTO,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';
import { scheduleApiClient } from '../../infrastructure/api/scheduleApiClient';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('ScheduleConflictApplicationService');

export interface DetectConflictsParams {
  userId: string;
  startTime: number;
  endTime: number;
  excludeUuid?: string;
}

export interface CreateScheduleResult {
  schedule: ScheduleClientDTO;
  conflicts?: ConflictDetectionResult;
}

export interface ResolveConflictResult {
  schedule: ScheduleClientDTO;
  conflicts: ConflictDetectionResult;
  applied: {
    strategy: string;
    previousStartTime?: number;
    previousEndTime?: number;
    changes: string[];
  };
}

export class ScheduleConflictApplicationService {
  private static instance: ScheduleConflictApplicationService;

  private constructor() {}

  static getInstance(): ScheduleConflictApplicationService {
    if (!ScheduleConflictApplicationService.instance) {
      ScheduleConflictApplicationService.instance =
        new ScheduleConflictApplicationService();
    }
    return ScheduleConflictApplicationService.instance;
  }

  /**
   * 检测日程冲突
   */
  async detectConflicts(params: DetectConflictsParams): Promise<ConflictDetectionResult> {
    logger.info('Detecting schedule conflicts', {
      userId: params.userId,
      startTime: params.startTime,
      endTime: params.endTime,
      excludeUuid: params.excludeUuid,
    });

    const result = await scheduleApiClient.detectConflicts(params);

    logger.info('Conflicts detected', {
      hasConflict: result.hasConflict,
      conflictCount: result.conflicts.length,
    });

    return result;
  }

  /**
   * 创建日程（带冲突检测）
   */
  async createSchedule(request: CreateScheduleRequest): Promise<CreateScheduleResult> {
    logger.info('Creating schedule with conflict detection', { title: request.title });

    const result = await scheduleApiClient.createSchedule(request);

    logger.info('Schedule created', {
      scheduleUuid: result.schedule.uuid,
      hasConflicts: result.conflicts?.hasConflict,
    });

    return result;
  }

  /**
   * 解决日程冲突
   */
  async resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<ResolveConflictResult> {
    logger.info('Resolving conflict', {
      scheduleUuid,
      strategy: request.resolution,
    });

    const result = await scheduleApiClient.resolveConflict(scheduleUuid, request);

    logger.info('Conflict resolved', {
      scheduleUuid,
      strategy: result.applied.strategy,
      hasConflicts: result.conflicts.hasConflict,
    });

    return result;
  }
}

export const scheduleConflictApplicationService =
  ScheduleConflictApplicationService.getInstance();
