/**
 * Schedule IPC Client - Schedule 模块 IPC 客户端
 * 
 * @module renderer/modules/schedule/infrastructure/ipc
 */

import { BaseIPCClient, ipcClient } from '@/renderer/shared/infrastructure/ipc';
import { ScheduleChannels } from '@/shared/types/ipc-channels';
import type { SchedulePayloads } from '@/shared/types/ipc-payloads';

// ============ Types from contracts ============
// Re-export from contracts for convenience
export type {
  ScheduleClientDTO,
  ScheduleServerDTO,
  ScheduleStatisticsClientDTO,
} from '@dailyuse/contracts/schedule';

// Import types for internal use
import type {
  ScheduleClientDTO,
  ScheduleStatisticsClientDTO,
} from '@dailyuse/contracts/schedule';

// ============ Local Type Aliases (backward compatibility) ============

/**
 * ScheduleDTO 别名 - 用于 IPC 传输
 */
export type ScheduleDTO = ScheduleClientDTO;

/**
 * ScheduleStatisticsDTO 别名
 */
export type ScheduleStatisticsDTO = ScheduleStatisticsClientDTO;

/**
 * ScheduleStatus 类型
 */
export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';

/**
 * RecurrenceConfigDTO - 循环配置
 */
export interface RecurrenceConfigDTO {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: number;
  occurrences?: number;
}

/**
 * RecurringScheduleDTO - 循环日程
 */
export interface RecurringScheduleDTO {
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  location?: string;
  color?: string;
  recurrence: RecurrenceConfigDTO;
  createdAt: number;
  updatedAt: number;
}

/**
 * ScheduleConflictDTO - 日程冲突
 */
export interface ScheduleConflictDTO {
  schedule: ScheduleDTO;
  conflictingSchedules: ScheduleDTO[];
}

// ============ Schedule IPC Client ============

/**
 * Schedule IPC Client
 */
export class ScheduleIPCClient {
  private client: BaseIPCClient;

  constructor(client: BaseIPCClient = ipcClient) {
    this.client = client;
  }

  // ============ CRUD ============

  /**
   * 获取日程列表
   */
  async list(params: SchedulePayloads.ListRequest): Promise<ScheduleDTO[]> {
    return this.client.invoke<ScheduleDTO[]>(
      ScheduleChannels.LIST,
      params
    );
  }

  /**
   * 按日期范围获取日程
   */
  async listByDateRange(
    accountUuid: string,
    startDate: number,
    endDate: number
  ): Promise<ScheduleDTO[]> {
    return this.client.invoke<ScheduleDTO[]>(
      ScheduleChannels.LIST_BY_DATE_RANGE,
      { accountUuid, startDate, endDate }
    );
  }

  /**
   * 获取单个日程
   */
  async get(uuid: string): Promise<ScheduleDTO> {
    return this.client.invoke<ScheduleDTO>(
      ScheduleChannels.GET,
      { uuid }
    );
  }

  /**
   * 创建日程
   */
  async create(params: SchedulePayloads.CreateRequest): Promise<ScheduleDTO> {
    return this.client.invoke<ScheduleDTO>(
      ScheduleChannels.CREATE,
      params
    );
  }

  /**
   * 更新日程
   */
  async update(params: SchedulePayloads.UpdateRequest): Promise<ScheduleDTO> {
    return this.client.invoke<ScheduleDTO>(
      ScheduleChannels.UPDATE,
      params
    );
  }

  /**
   * 删除日程
   */
  async delete(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      ScheduleChannels.DELETE,
      { uuid }
    );
  }

  // ============ Operations ============

  /**
   * 完成日程
   */
  async complete(uuid: string): Promise<ScheduleDTO> {
    return this.client.invoke<ScheduleDTO>(
      ScheduleChannels.COMPLETE,
      { uuid }
    );
  }

  /**
   * 取消日程
   */
  async cancel(uuid: string): Promise<ScheduleDTO> {
    return this.client.invoke<ScheduleDTO>(
      ScheduleChannels.CANCEL,
      { uuid }
    );
  }

  /**
   * 重新安排日程
   */
  async reschedule(params: SchedulePayloads.RescheduleRequest): Promise<ScheduleDTO> {
    return this.client.invoke<ScheduleDTO>(
      ScheduleChannels.RESCHEDULE,
      params
    );
  }

  // ============ Recurring ============

  /**
   * 获取循环日程列表
   */
  async listRecurring(accountUuid: string): Promise<RecurringScheduleDTO[]> {
    return this.client.invoke<RecurringScheduleDTO[]>(
      ScheduleChannels.RECURRING_LIST,
      { accountUuid }
    );
  }

  /**
   * 创建循环日程
   */
  async createRecurring(params: SchedulePayloads.CreateRequest): Promise<RecurringScheduleDTO> {
    return this.client.invoke<RecurringScheduleDTO>(
      ScheduleChannels.RECURRING_CREATE,
      params
    );
  }

  /**
   * 更新循环日程
   */
  async updateRecurring(params: {
    uuid: string;
    title?: string;
    description?: string;
    startTime?: number;
    endTime?: number;
    recurrence?: SchedulePayloads.RecurrenceConfig;
  }): Promise<RecurringScheduleDTO> {
    return this.client.invoke<RecurringScheduleDTO>(
      ScheduleChannels.RECURRING_UPDATE,
      params
    );
  }

  /**
   * 删除循环日程
   */
  async deleteRecurring(uuid: string): Promise<void> {
    return this.client.invoke<void>(
      ScheduleChannels.RECURRING_DELETE,
      { uuid }
    );
  }

  // ============ Statistics ============

  /**
   * 获取统计数据
   */
  async getStatistics(
    accountUuid: string,
    startDate?: number,
    endDate?: number
  ): Promise<ScheduleStatisticsDTO> {
    return this.client.invoke<ScheduleStatisticsDTO>(
      ScheduleChannels.STATISTICS_GET,
      { accountUuid, startDate, endDate }
    );
  }

  // ============ Convenience Methods ============

  /**
   * 获取今日日程
   */
  async getToday(accountUuid: string): Promise<ScheduleDTO[]> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

    return this.listByDateRange(accountUuid, startOfDay, endOfDay);
  }

  /**
   * 获取本周日程
   */
  async getThisWeek(accountUuid: string): Promise<ScheduleDTO[]> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
    const endOfWeek = startOfWeek + 7 * 24 * 60 * 60 * 1000 - 1;

    return this.listByDateRange(accountUuid, startOfWeek, endOfWeek);
  }

  /**
   * 获取本月日程
   */
  async getThisMonth(accountUuid: string): Promise<ScheduleDTO[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

    return this.listByDateRange(accountUuid, startOfMonth, endOfMonth);
  }

  /**
   * 获取即将开始的日程
   */
  async getUpcoming(accountUuid: string, hours = 24): Promise<ScheduleDTO[]> {
    const now = Date.now();
    const futureTime = now + hours * 60 * 60 * 1000;

    const schedules = await this.listByDateRange(accountUuid, now, futureTime);
    // 返回所有在时间范围内的日程（ScheduleClientDTO 没有 status 字段）
    return schedules;
  }
}

// ============ Singleton Export ============

export const scheduleIPCClient = new ScheduleIPCClient();
