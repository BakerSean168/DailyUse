/**
 * TaskInstance Aggregate Root - Server Interface
 * 任务实例聚合根
 */

import type { TaskInstanceStatus } from '../enums';
import type {
  TaskTimeConfigServerDTO,
  TaskTimeConfigClientDTO,
  CompletionRecordServerDTO,
  CompletionRecordClientDTO,
  SkipRecordServerDTO,
  SkipRecordClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * TaskInstance Client DTO (声明，实际定义在 Client 文件)
 */
export interface TaskInstanceClientDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: TaskTimeConfigClientDTO;
  status: TaskInstanceStatus;
  completionRecord?: CompletionRecordClientDTO | null;
  skipRecord?: SkipRecordClientDTO | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
  instanceDateFormatted: string;
  statusText: string;
  statusColor: string;
  isCompleted: boolean;
  isSkipped: boolean;
  isPending: boolean;
  isExpired: boolean;
  hasNote: boolean;
  actualDuration?: number | null;
  durationText?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * TaskInstance Server DTO
 */
export interface TaskInstanceServerDTO {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number; // epoch ms
  timeConfig: TaskTimeConfigServerDTO;
  status: TaskInstanceStatus;
  completionRecord?: CompletionRecordServerDTO | null;
  skipRecord?: SkipRecordServerDTO | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * TaskInstance Persistence DTO
 */
export interface TaskInstancePersistenceDTO {
  uuid: string;
  template_uuid: string;
  account_uuid: string;
  instance_date: number;
  time_config: string; // JSON
  status: string;
  completion_record?: string | null; // JSON
  skip_record?: string | null; // JSON
  actual_start_time?: number | null;
  actual_end_time?: number | null;
  note?: string | null;
  created_at: number;
  updated_at: number;
}

// ============ 聚合根接口 ============

export interface TaskInstanceServer {
  uuid: string;
  templateUuid: string;
  accountUuid: string;
  instanceDate: number;
  timeConfig: any;
  status: TaskInstanceStatus;
  completionRecord?: any | null;
  skipRecord?: any | null;
  actualStartTime?: number | null;
  actualEndTime?: number | null;
  note?: string | null;
  createdAt: number;
  updatedAt: number;

  // 状态转换
  start(): void;
  complete(actualDuration?: number, note?: string, rating?: number): void;
  skip(reason?: string): void;
  markExpired(): void;

  // 业务判断
  canStart(): boolean;
  canComplete(): boolean;
  canSkip(): boolean;
  isOverdue(): boolean;

  // DTO 转换
  toServerDTO(): TaskInstanceServerDTO;
  toClientDTO(): TaskInstanceClientDTO;
  toPersistenceDTO(): TaskInstancePersistenceDTO;
}
