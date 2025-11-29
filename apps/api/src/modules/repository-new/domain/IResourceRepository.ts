/**
 * Resource Repository Interface
 * 资源仓储接口 - DDD Repository Pattern
 */

import type { Resource } from '@dailyuse/domain-server/repository';
import { ResourceType, ResourceStatus } from '@dailyuse/contracts/repository';

export interface FindResourceOptions {
  type?: ResourceType;
  tags?: string[];
  category?: string;
  status?: ResourceStatus;
  page: number;
  pageSize: number;
  sortBy: 'createdAt' | 'updatedAt' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
}

export interface IResourceRepository {
  /**
   * 保存资源（创建或更新）
   */
  save(resource: Resource): Promise<void>;

  /**
   * 根据 UUID 查找资源
   */
  findByUuid(uuid: string): Promise<Resource | null>;

  /**
   * 根据仓库查找资源（分页 + 筛选）
   */
  findByRepository(
    repositoryUuid: string,
    options: FindResourceOptions,
  ): Promise<{ resources: Resource[]; total: number }>;

  /**
   * 删除资源（物理删除）
   */
  delete(uuid: string): Promise<void>;

  /**
   * 根据标签查找资源
   */
  findByTags(tags: string[]): Promise<Resource[]>;

  /**
   * 根据类型查找资源
   */
  findByType(repositoryUuid: string, type: ResourceType): Promise<Resource[]>;
}




