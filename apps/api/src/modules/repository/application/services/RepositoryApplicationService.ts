import type { IRepositoryRepository } from '@dailyuse/domain-server';
import { Repository } from '@dailyuse/domain-server';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryContainer } from '../../infrastructure/di/RepositoryContainer';

/**
 * Repository 应用服务
 * 负责仓储（Repository）的 CRUD 操作
 *
 * 架构职责：
 * - 调用 Repository 进行持久化
 * - DTO 转换（Domain → ClientDTO）
 * - 协调业务用例
 */
export class RepositoryApplicationService {
  private static instance: RepositoryApplicationService;
  private repositoryRepository: IRepositoryRepository;

  private constructor(repositoryRepository: IRepositoryRepository) {
    this.repositoryRepository = repositoryRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static createInstance(
    repositoryRepository?: IRepositoryRepository,
  ): RepositoryApplicationService {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();

    RepositoryApplicationService.instance = new RepositoryApplicationService(repo);
    return RepositoryApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static getInstance(): RepositoryApplicationService {
    if (!RepositoryApplicationService.instance) {
      RepositoryApplicationService.instance = RepositoryApplicationService.createInstance();
    }
    return RepositoryApplicationService.instance;
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
    return this.toClientDTO(repository.toServerDTO());
  }

  /**
   * 将 ServerDTO 转换为 ClientDTO
   */
  private toClientDTO(
    serverDTO: RepositoryContracts.RepositoryServerDTO,
  ): RepositoryContracts.RepositoryClientDTO {
    const { Repository: RepositoryClient } = require('@dailyuse/domain-client');
    const clientRepository = RepositoryClient.fromServerDTO(serverDTO);
    return clientRepository.toClientDTO();
  }

  /**
   * 获取仓储详情
   */
  async getRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO | null> {
    const repository = await this.repositoryRepository.findByUuid(uuid);
    return repository ? this.toClientDTO(repository.toServerDTO()) : null;
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

    return repositories.map((r) => this.toClientDTO(r.toServerDTO()));
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
    return this.toClientDTO(repository.toServerDTO());
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
    return this.toClientDTO(repository.toServerDTO());
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
    return this.toClientDTO(repository.toServerDTO());
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
    return this.toClientDTO(repository.toServerDTO());
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
