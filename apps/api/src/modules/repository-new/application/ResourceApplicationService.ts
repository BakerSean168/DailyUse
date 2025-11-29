/**
 * Resource Application Service
 * 资源应用服务 - DDD Application Layer
 * 
 * 职责：
 * 1. 协调 Resource 实体
 * 2. 处理资源业务用例（CRUD + Markdown 专用功能）
 * 3. 权限验证
 * 4. 事务管理
 * 
 * 注意：此服务重构自 DocumentApplicationService
 */

import { Resource, CreateResourceDTO } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { ResourceType } from '@dailyuse/contracts/repository';
import type { IResourceRepository } from '../domain/IResourceRepository';
import type { IRepositoryRepository } from '../domain/IRepositoryRepository';

// ==================== Query DTO ====================

export interface ListResourcesQuery {
  repositoryUuid: string;
  accountUuid: string;
  type?: ResourceType; // 按类型筛选
  tags?: string[]; // 按标签筛选
  category?: string; // 按分类筛选
  status?: string; // 按状态筛选
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

// ==================== Application Service ====================

export class ResourceApplicationService {
  constructor(
    private readonly resourceRepo: IResourceRepository,
    private readonly repositoryRepo: IRepositoryRepository,
  ) {}

  // ==================== 通用 CRUD ====================

  /**
   * 创建资源
   */
  async createResource(dto: CreateResourceDTO, accountUuid: string): Promise<ResourceClientDTO> {
    // 1. 验证仓库存在且用户有权限
    const repository = await this.repositoryRepo.findByUuid(dto.repositoryUuid);
    if (!repository) {
      throw new Error('Repository not found');
    }
    if (!repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied: You do not own this repository');
    }

    // 2. 验证仓库是否激活
    if (!repository.canPerformOperation()) {
      throw new Error('Repository is not active');
    }

    // 3. 创建 Resource 实体
    const resource = Resource.create(dto);

    // 4. 持久化
    await this.resourceRepo.save(resource);

    // 5. 更新仓库统计
    const stats = repository.stats;
    repository.updateStats({
      resourceCount: stats.resourceCount + 1,
      totalSize: stats.totalSize + resource.size,
      [`${dto.type}Count`]: (stats[`${dto.type}Count`] || 0) + 1,
    });
    await this.repositoryRepo.save(repository);

    return resource.toClientDTO();
  }

  /**
   * 查询资源列表（分页 + 筛选）
   */
  async listResources(query: ListResourcesQuery): Promise<{
    resources: ResourceClientDTO[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    // 1. 验证仓库权限
    const repository = await this.repositoryRepo.findByUuid(query.repositoryUuid);
    if (!repository) {
      throw new Error('Repository not found');
    }
    if (!repository.isOwnedBy(query.accountUuid)) {
      throw new Error('Access denied');
    }

    // 2. 查询资源
    const { resources, total } = await this.resourceRepo.findByRepository(
      query.repositoryUuid,
      {
        type: query.type,
        tags: query.tags,
        category: query.category,
        status: query.status as any,
        page: query.page || 1,
        pageSize: query.pageSize || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      },
    );

    return {
      resources: resources.map((r) => r.toClientDTO()),
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    };
  }

  /**
   * 查询单个资源
   */
  async getResource(uuid: string, accountUuid: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证仓库权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 记录访问
    resource.recordAccess();
    await this.resourceRepo.save(resource);

    return resource.toClientDTO();
  }

  /**
   * 更新资源（通用字段）
   */
  async updateResource(
    uuid: string,
    accountUuid: string,
    updates: {
      name?: string;
      description?: string | null;
      category?: string | null;
      tags?: string[];
    },
  ): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 验证可编辑
    if (!resource.canEdit()) {
      throw new Error('Resource cannot be edited (archived or deleted)');
    }

    // 应用更新
    if (updates.name) {
      resource.updateName(updates.name);
    }
    if (updates.description !== undefined) {
      resource.updateDescription(updates.description);
    }
    if (updates.category !== undefined) {
      resource.setCategory(updates.category);
    }
    if (updates.tags) {
      // 简化实现：替换所有标签
      updates.tags.forEach((tag) => resource.addTag(tag));
    }

    // 持久化
    await this.resourceRepo.save(resource);

    return resource.toClientDTO();
  }

  /**
   * 删除资源（软删除）
   */
  async deleteResource(uuid: string, accountUuid: string): Promise<void> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 软删除
    resource.softDelete();

    // 持久化
    await this.resourceRepo.save(resource);

    // 更新仓库统计
    const stats = repository.stats;
    repository.updateStats({
      resourceCount: Math.max(0, stats.resourceCount - 1),
      totalSize: Math.max(0, stats.totalSize - resource.size),
      [`${resource.type}Count`]: Math.max(0, (stats[`${resource.type}Count`] || 0) - 1),
    });
    await this.repositoryRepo.save(repository);
  }

  // ==================== Markdown 专用功能 ====================

  /**
   * 更新 Markdown 内容
   * 重构自 DocumentApplicationService
   */
  async updateMarkdownContent(
    uuid: string,
    accountUuid: string,
    content: string,
  ): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 验证资源类型
    if (!resource.isMarkdown()) {
      throw new Error('Resource is not a Markdown document');
    }

    // 验证可编辑
    if (!resource.canEdit()) {
      throw new Error('Resource cannot be edited');
    }

    // 更新内容
    const oldSize = resource.size;
    resource.updateMarkdownContent(content);
    const newSize = resource.size;

    // 持久化
    await this.resourceRepo.save(resource);

    // 更新仓库统计（大小变化）
    if (oldSize !== newSize) {
      const stats = repository.stats;
      repository.updateStats({
        totalSize: stats.totalSize - oldSize + newSize,
      });
      await this.repositoryRepo.save(repository);
    }

    return resource.toClientDTO();
  }

  /**
   * 获取 Markdown 内容
   */
  async getMarkdownContent(uuid: string, accountUuid: string): Promise<string> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 验证资源类型
    if (!resource.isMarkdown()) {
      throw new Error('Resource is not a Markdown document');
    }

    return resource.getMarkdownContent();
  }

  // ==================== 其他功能 ====================

  /**
   * 移动资源到新路径
   */
  async moveResource(
    uuid: string,
    accountUuid: string,
    newPath: string,
  ): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 移动资源
    resource.moveTo(newPath);

    // 持久化
    await this.resourceRepo.save(resource);

    return resource.toClientDTO();
  }

  /**
   * 收藏/取消收藏
   */
  async toggleFavorite(uuid: string, accountUuid: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 切换收藏状态
    resource.toggleFavorite();

    // 持久化
    await this.resourceRepo.save(resource);

    return resource.toClientDTO();
  }

  /**
   * 发布资源
   */
  async publishResource(uuid: string, accountUuid: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 发布
    resource.publish();

    // 持久化
    await this.resourceRepo.save(resource);

    return resource.toClientDTO();
  }

  /**
   * 归档资源
   */
  async archiveResource(uuid: string, accountUuid: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepo.findByUuid(uuid);

    if (!resource) {
      throw new Error('Resource not found');
    }

    // 验证权限
    const repository = await this.repositoryRepo.findByUuid(resource.repositoryUuid);
    if (!repository || !repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied');
    }

    // 归档
    resource.archive();

    // 持久化
    await this.resourceRepo.save(resource);

    return resource.toClientDTO();
  }
}




