/**
 * Repository Repository Interface
 * 仓储仓储接口 - DDD Repository Pattern
 */

import type { Repository } from '@dailyuse/domain-server/repository';

export interface IRepositoryRepository {
  /**
   * 保存仓库（创建或更新）
   */
  save(repository: Repository): Promise<void>;

  /**
   * 根据 UUID 查找仓库
   */
  findByUuid(uuid: string): Promise<Repository | null>;

  /**
   * 根据账户查找所有仓库
   */
  findByAccount(accountUuid: string): Promise<Repository[]>;

  /**
   * 根据名称和账户查找仓库（唯一性检查）
   */
  findByNameAndAccount(name: string, accountUuid: string): Promise<Repository | null>;

  /**
   * 删除仓库（物理删除）
   */
  delete(uuid: string): Promise<void>;
}
