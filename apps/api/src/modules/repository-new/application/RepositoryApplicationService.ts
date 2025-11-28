/**
 * Repository Application Service
 * 仓储应用服务 - DDD Application Layer
 * 
 * 职责：
 * 1. 协调 Repository 聚合根
 * 2. 处理业务用例（CRUD）
 * 3. 权限验证
 * 4. 事务管理
 */

import { Repository, CreateRepositoryDTO } from '@dailyuse/domain-server';
import type { RepositoryClientDTO, RepositoryServerDTO } from '@dailyuse/contracts/repository';
import type { IRepositoryRepository } from '../domain/IRepositoryRepository';

// ==================== Application Service ====================

export class RepositoryApplicationService {
  constructor(private readonly repositoryRepo: IRepositoryRepository) {}

  /**
   * 创建仓库
   */
  async createRepository(dto: CreateRepositoryDTO): Promise<RepositoryClientDTO> {
    // 1. 验证用户权限（后续添加）
    // await this.authService.validateUser(dto.accountUuid);

    // 2. 验证仓库名称唯一性
    const existingRepo = await this.repositoryRepo.findByNameAndAccount(
      dto.name,
      dto.accountUuid,
    );
    if (existingRepo) {
      throw new Error(`Repository with name '${dto.name}' already exists`);
    }

    // 3. 创建 Repository 聚合根
    const repository = Repository.create(dto);

    // 4. 持久化
    await this.repositoryRepo.save(repository);

    // 5. 返回 Client DTO
    return repository.toClientDTO();
  }

  /**
   * 查询用户所有仓库
   */
  async listRepositories(accountUuid: string): Promise<RepositoryClientDTO[]> {
    const repositories = await this.repositoryRepo.findByAccount(accountUuid);
    return repositories.map((repo) => repo.toClientDTO());
  }

  /**
   * 查询单个仓库
   */
  async getRepository(uuid: string, accountUuid: string): Promise<RepositoryClientDTO> {
    const repository = await this.repositoryRepo.findByUuid(uuid);

    if (!repository) {
      throw new Error('Repository not found');
    }

    // 验证所有权
    if (!repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied: You do not own this repository');
    }

    // 记录访问时间
    repository.recordAccess();
    await this.repositoryRepo.save(repository);

    return repository.toClientDTO();
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    uuid: string,
    accountUuid: string,
    updates: {
      name?: string;
      path?: string;
      description?: string | null;
      config?: any;
      relatedGoals?: string[];
    },
  ): Promise<RepositoryClientDTO> {
    const repository = await this.repositoryRepo.findByUuid(uuid);

    if (!repository) {
      throw new Error('Repository not found');
    }

    // 验证所有权
    if (!repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied: You do not own this repository');
    }

    // 应用更新
    if (updates.name) {
      repository.updateName(updates.name);
    }
    if (updates.path) {
      repository.updatePath(updates.path);
    }
    if (updates.description !== undefined) {
      repository.updateDescription(updates.description);
    }
    if (updates.config) {
      repository.updateConfig(updates.config);
    }
    if (updates.relatedGoals) {
      // 处理关联目标的增删
      // 简化实现：清空后重新添加
      updates.relatedGoals.forEach((goalUuid) => {
        repository.addRelatedGoal(goalUuid);
      });
    }

    // 持久化
    await this.repositoryRepo.save(repository);

    return repository.toClientDTO();
  }

  /**
   * 删除仓库（软删除：归档）
   */
  async deleteRepository(uuid: string, accountUuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findByUuid(uuid);

    if (!repository) {
      throw new Error('Repository not found');
    }

    // 验证所有权
    if (!repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied: You do not own this repository');
    }

    // 归档仓库
    repository.archive();

    // 持久化
    await this.repositoryRepo.save(repository);
  }

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string, accountUuid: string): Promise<RepositoryClientDTO> {
    const repository = await this.repositoryRepo.findByUuid(uuid);

    if (!repository) {
      throw new Error('Repository not found');
    }

    // 验证所有权
    if (!repository.isOwnedBy(accountUuid)) {
      throw new Error('Access denied: You do not own this repository');
    }

    // 激活
    repository.activate();

    // 持久化
    await this.repositoryRepo.save(repository);

    return repository.toClientDTO();
  }
}


