import type { IRepositoryRepository } from '@dailyuse/domain-server';
import { Repository } from '@dailyuse/domain-server';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { PrismaClient } from '@prisma/client';
import { PrismaRepositoryRepository } from '../../infrastructure/repositories';

/**
 * Repository 应用服务
 * 负责仓储（Repository）的 CRUD 操作
 *
 * 职责：
 * - 创建仓储
 * - 获取仓储详情
 * - 更新仓储配置
 * - 归档/激活/删除仓储
 * - 查询用户的仓储列表
 */
export class RepositoryApplicationService {
  private repositoryRepository: IRepositoryRepository;

  constructor(repositoryRepository?: IRepositoryRepository) {
    if (repositoryRepository) {
      this.repositoryRepository = repositoryRepository;
    } else {
      const prisma = new PrismaClient();
      this.repositoryRepository = new PrismaRepositoryRepository(prisma);
    }
  }

  /**
   * 创建仓储
   */
  async createRepository(params: {
    accountUuid: string;
    name: string;
    type: RepositoryContracts.RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfigServerDTO>;
  }): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 1. 创建领域实体
    const repository = Repository.create(params);

    // 2. 持久化
    await this.repositoryRepository.save(repository);

    // 3. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 获取仓储详情
   */
  async getRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO | null> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    return repository ? repository.toClientDTO() : null;
  }

  /**
   * 获取用户的所有仓储
   */
  async listRepositories(
    accountUuid: string,
    status?: RepositoryContracts.RepositoryStatus,
  ): Promise<RepositoryContracts.RepositoryClientDTO[]> {
    let repositories: Repository[];
    
    if (status) {
      repositories = await this.repositoryRepository.findByAccountUuidAndStatus(accountUuid, status);
    } else {
      repositories = await this.repositoryRepository.findByAccountUuid(accountUuid);
    }

    return repositories.map((r) => r.toClientDTO());
  }

  /**
   * 更新仓储配置
   */
  async updateRepositoryConfig(
    uuid: string,
    config: Partial<RepositoryContracts.RepositoryConfigServerDTO>,
  ): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 更新配置（领域方法）
    repository.updateConfig(config);

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 更新仓储统计
   */
  async updateRepositoryStats(
    uuid: string,
    stats: Partial<RepositoryContracts.RepositoryStatsServerDTO>,
  ): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 更新统计（领域方法）
    repository.updateStats(stats);

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 归档仓储
   */
  async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 归档（领域方法）
    repository.archive();

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 激活仓储
   */
  async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 激活（领域方法）
    repository.activate();

    // 3. 持久化
    await this.repositoryRepository.save(repository);

    // 4. 返回 ClientDTO
    return repository.toClientDTO();
  }

  /**
   * 删除仓储
   */
  async deleteRepository(uuid: string): Promise<void> {
    // 1. 查询仓储
    const repository = await this.repositoryRepository.findByUuid(uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${uuid}`);
    }

    // 2. 软删除（领域方法）
    repository.delete();

    // 3. 持久化
    await this.repositoryRepository.save(repository);
  }
}
