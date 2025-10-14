/**
 * TaskInstance 仓储接口 (Server)
 * 任务实例仓储
 */

import { TaskInstance } from '../aggregates';
import type { TaskContracts } from '@dailyuse/contracts';

type TaskInstanceStatus = TaskContracts.TaskInstanceStatus;

/**
 * TaskInstance 仓储接口
 *
 * DDD 仓储职责：
 * - 聚合根的持久化
 * - 聚合根的查询
 * - 是基础设施层的抽象
 */
export interface ITaskInstanceRepository {
  /**
   * 保存任务实例
   */
  save(instance: TaskInstance): Promise<void>;

  /**
   * 批量保存任务实例
   */
  saveMany(instances: TaskInstance[]): Promise<void>;

  /**
   * 根据 UUID 查找任务实例
   */
  findByUuid(uuid: string): Promise<TaskInstance | null>;

  /**
   * 根据模板 UUID 查找任务实例
   */
  findByTemplate(templateUuid: string): Promise<TaskInstance[]>;

  /**
   * 根据账户 UUID 查找任务实例
   */
  findByAccount(accountUuid: string): Promise<TaskInstance[]>;

  /**
   * 根据日期范围查找任务实例
   */
  findByDateRange(accountUuid: string, startDate: number, endDate: number): Promise<TaskInstance[]>;

  /**
   * 根据状态查找任务实例
   */
  findByStatus(accountUuid: string, status: TaskInstanceStatus): Promise<TaskInstance[]>;

  /**
   * 查找过期的任务实例
   */
  findOverdueInstances(accountUuid: string): Promise<TaskInstance[]>;

  /**
   * 删除任务实例
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量删除任务实例
   */
  deleteMany(uuids: string[]): Promise<void>;

  /**
   * 删除模板的所有任务实例
   */
  deleteByTemplate(templateUuid: string): Promise<void>;
}
