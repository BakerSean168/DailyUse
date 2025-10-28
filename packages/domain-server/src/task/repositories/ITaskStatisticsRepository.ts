/**
 * TaskStatistics 仓储接口 (Server)
 * 任务统计仓储
 */

import { TaskStatistics } from '../aggregates';

/**
 * TaskStatistics 仓储接口
 *
 * DDD 仓储职责：
 * - 聚合根的持久化
 * - 聚合根的查询
 * - 是基础设施层的抽象
 */
export interface ITaskStatisticsRepository {
  /**
   * 保存任务统计数据
   */
  save(statistics: TaskStatistics): Promise<void>;

  /**
   * 根据 UUID 查找任务统计
   */
  findByUuid(uuid: string): Promise<TaskStatistics | null>;

  /**
   * 根据账户 UUID 查找任务统计
   */
  findByAccountUuid(accountUuid: string): Promise<TaskStatistics | null>;

  /**
   * 删除任务统计
   */
  delete(uuid: string): Promise<void>;

  /**
   * 批量保存统计数据
   */
  saveBatch(statisticsList: TaskStatistics[]): Promise<void>;
}
