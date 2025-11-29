/**
 * IRepositoryStatisticsRepository - 仓库统计仓储接口
 * 
 * 职责：
 * - 统计数据的 CRUD 操作
 * - 统计数据查询
 */

import type { RepositoryStatistics } from '../aggregates/RepositoryStatistics';

export interface IRepositoryStatisticsRepository {
  /**
   * 保存统计数据
   */
  save(statistics: RepositoryStatistics): Promise<void>;

  /**
   * 根据账户 UUID 查找统计数据
   */
  findByAccountUuid(accountUuid: string): Promise<RepositoryStatistics | null>;

  /**
   * 根据 UUID 查找统计数据
   */
  findByUuid(uuid: string): Promise<RepositoryStatistics | null>;

  /**
   * 批量根据账户 UUID 查找
   */
  findByAccountUuids(accountUuids: string[]): Promise<RepositoryStatistics[]>;

  /**
   * 查找所有统计数据（分页）
   */
  findAll(options?: { skip?: number; take?: number }): Promise<RepositoryStatistics[]>;

  /**
   * 统计总数
   */
  count(): Promise<number>;

  /**
   * 删除统计数据
   */
  delete(uuid: string): Promise<void>;
}
