/**
 * Repository 领域服务
 *
 * DDD 领域服务职责：
 * - 跨聚合根的业务逻辑
 * - 协调多个聚合根
 * - 使用仓储接口进行持久化
 * - 触发领域事件
 */

import type { IRepositoryRepository } from '../repositories/IRepositoryRepository';
import { Repository } from '../aggregates/Repository';
import type { RepositoryContracts } from '@dailyuse/contracts';

type RepositoryType = RepositoryContracts.RepositoryType;
type ResourceType = RepositoryContracts.ResourceType;
type GitInfoServerDTO = RepositoryContracts.GitInfoServerDTO;

/**
 * RepositoryDomainService
 *
 * 注意：
 * - 通过构造函数注入仓储接口
 * - 不直接操作数据库
 * - 业务逻辑在聚合根/实体中，服务只是协调
 */
export class RepositoryDomainService {
  constructor(
    private readonly repositoryRepo: IRepositoryRepository,
    // 可以注入其他仓储或服务
    // private readonly eventBus: IEventBus,
  ) {}

  /**
   * 创建新的仓库
   */
  public async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfig>;
    initializeGit?: boolean;
  }): Promise<Repository> {
    // 1. 验证：检查路径是否已被使用
    const isPathUsed = await this.repositoryRepo.isPathUsed(params.path);
    if (isPathUsed) {
      throw new Error(`Repository path is already in use: ${params.path}`);
    }

    // 2. 创建聚合根（业务逻辑在聚合根中）
    const repository = Repository.create(params);

    // 3. 可选：初始化 Git
    if (params.initializeGit) {
      // Git 信息将在后台任务中初始化
      // await repository.enableGit(gitInfo);
    }

    // 4. 持久化
    await this.repositoryRepo.save(repository);

    // 5. 触发领域事件
    // await this.eventBus.publish({
    //   type: 'repository.created',
    //   aggregateId: repository.uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     repository: repository.toServerDTO(),
    //     initializeGit: params.initializeGit ?? false,
    //     createDefaultLinkedDoc: true,
    //   },
    // });

    return repository;
  }

  /**
   * 获取仓库（支持懒加载和急加载）
   */
  public async getRepository(
    uuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository | null> {
    const repository = await this.repositoryRepo.findById(uuid, options);

    if (repository) {
      // 更新访问时间
      repository.markAsAccessed();
      await this.repositoryRepo.save(repository);
    }

    return repository;
  }

  /**
   * 更新仓库配置
   */
  public async updateRepositoryConfig(
    uuid: string,
    config: Partial<RepositoryContracts.RepositoryConfig>,
  ): Promise<Repository> {
    const repository = await this.repositoryRepo.findById(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 业务逻辑在聚合根中
    repository.updateConfig(config);

    await this.repositoryRepo.save(repository);

    return repository;
  }

  /**
   * 归档仓库
   */
  public async archiveRepository(uuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    repository.archive();
    await this.repositoryRepo.save(repository);
  }

  /**
   * 激活仓库
   */
  public async activateRepository(uuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    repository.activate();
    await this.repositoryRepo.save(repository);
  }

  /**
   * 删除仓库
   */
  public async deleteRepository(uuid: string, options?: { deleteFiles?: boolean }): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid, {
      includeChildren: true, // 需要加载子实体才能计算数量
    });

    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 删除前触发事件
    // await this.eventBus.publish({
    //   type: 'repository.deleted',
    //   aggregateId: uuid,
    //   timestamp: Date.now(),
    //   payload: {
    //     repositoryUuid: uuid,
    //     repositoryName: repository.name,
    //     deleteFiles: options?.deleteFiles ?? false,
    //     resourceCount: repository.getAllResources().length,
    //   },
    // });

    // 删除聚合根（级联删除子实体）
    await this.repositoryRepo.delete(uuid);

    // TODO: 如果 deleteFiles === true，删除文件系统中的文件
  }

  /**
   * 启用 Git
   */
  public async enableGit(uuid: string, remoteUrl?: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 创建 Git 信息对象
    const gitInfo: GitInfoServerDTO = {
      isGitRepo: true,
      currentBranch: 'main',
      hasChanges: false,
      remoteUrl: remoteUrl || null,
    };

    repository.enableGit(gitInfo);
    await this.repositoryRepo.save(repository);
  }

  /**
   * 禁用 Git
   */
  public async disableGit(uuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    repository.disableGit();
    await this.repositoryRepo.save(repository);
  }

  /**
   * 同步仓库
   */
  public async syncRepository(
    uuid: string,
    type: 'pull' | 'push' | 'both',
    force = false,
  ): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 触发同步开始事件
    // await this.eventBus.publish({
    //   type: 'repository.sync.started',
    //   aggregateId: uuid,
    //   timestamp: Date.now(),
    //   payload: { syncType: type, force },
    // });

    // 执行同步（业务逻辑在聚合根中）
    await repository.startSync(type, force);
    await this.repositoryRepo.save(repository);

    // TODO: 实际的同步操作由基础设施层处理
    // 同步完成后触发事件
  }

  /**
   * 更新统计信息
   */
  public async updateRepositoryStats(uuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(uuid, {
      includeChildren: true, // 需要子实体才能计算统计
    });

    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // TODO: 实现统计更新逻辑（由 RepositoryStatisticsDomainService 处理）
    // await repository.updateStats();
    await this.repositoryRepo.save(repository);
  }

  /**
   * 添加关联目标
   */
  public async addRelatedGoal(repositoryUuid: string, goalUuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(repositoryUuid);
    if (!repository) {
      throw new Error(`Repository not found: ${repositoryUuid}`);
    }

    repository.addRelatedGoal(goalUuid);
    await this.repositoryRepo.save(repository);
  }

  /**
   * 移除关联目标
   */
  public async removeRelatedGoal(repositoryUuid: string, goalUuid: string): Promise<void> {
    const repository = await this.repositoryRepo.findById(repositoryUuid);
    if (!repository) {
      throw new Error(`Repository not found: ${repositoryUuid}`);
    }

    repository.removeRelatedGoal(goalUuid);
    await this.repositoryRepo.save(repository);
  }

  /**
   * 获取账户的所有仓库
   */
  public async getRepositoriesByAccount(
    accountUuid: string,
    options?: { includeChildren?: boolean },
  ): Promise<Repository[]> {
    return await this.repositoryRepo.findByAccountUuid(accountUuid, options);
  }

  /**
   * 通过路径查找仓库
   */
  public async getRepositoryByPath(path: string): Promise<Repository | null> {
    return await this.repositoryRepo.findByPath(path);
  }
}
