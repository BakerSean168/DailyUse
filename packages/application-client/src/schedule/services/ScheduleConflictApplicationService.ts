/**
 * Schedule Conflict Application Service
 *
 * 日程冲突检测应用服务 - 负责日程冲突检测和解决
 *
 * 设计说明：
 * - ApplicationService 只负责 API 调用 + DTO → Entity 转换
 * - 不再直接依赖 Store，返回数据给调用方
 * - Store 操作由 Composable 层负责
 */

import type {
  ConflictDetectionResult,
  CreateScheduleRequest,
  ScheduleClientDTO,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';
import type { IScheduleEventApiClient } from '@dailyuse/infrastructure-client';

/**
 * 检测冲突参数
 */
export interface DetectConflictsParams {
  userId: string;
  startTime: number;
  endTime: number;
  excludeUuid?: string;
}

/**
 * 创建日程结果
 */
export interface CreateScheduleResult {
  schedule: ScheduleClientDTO;
  conflicts?: ConflictDetectionResult;
}

/**
 * 解决冲突结果
 */
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

/**
 * Schedule Conflict Application Service
 */
export class ScheduleConflictApplicationService {
  constructor(private readonly apiClient: IScheduleEventApiClient) {}

  /**
   * 检测日程冲突
   */
  async detectConflicts(params: DetectConflictsParams): Promise<ConflictDetectionResult> {
    return this.apiClient.detectConflicts(params);
  }

  /**
   * 创建日程（带冲突检测）
   */
  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<CreateScheduleResult> {
    return this.apiClient.createScheduleWithConflictDetection(request);
  }

  /**
   * 解决日程冲突
   */
  async resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<ResolveConflictResult> {
    return this.apiClient.resolveConflict(scheduleUuid, request);
  }
}

/**
 * Factory function to create ScheduleConflictApplicationService
 */
export function createScheduleConflictApplicationService(
  apiClient: IScheduleEventApiClient,
): ScheduleConflictApplicationService {
  return new ScheduleConflictApplicationService(apiClient);
}
