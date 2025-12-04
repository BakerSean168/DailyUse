/**
 * Repository Module DI Container
 *
 * 依赖注入容器，管理 Repository 模块的所有仓储实例
 *
 * 职责：
 * - 管理仓储实例的生命周期（单例）
 * - 支持测试时注入 Mock 仓储
 * - 懒加载创建仓储实例
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

export class RepositoryContainer {
  private static instance: RepositoryContainer;

  private repositoryRepository?: IRepositoryRepository;
  private resourceRepository?: IResourceRepository;
  private folderRepository?: IFolderRepository;
  private repositoryStatisticsRepository?: IRepositoryStatisticsRepository;

  private constructor() {}

  /**
   * 获取容器单例
   */
  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  /**
   * 重置容器（用于测试）
   */
  static resetInstance(): void {
    RepositoryContainer.instance = undefined as unknown as RepositoryContainer;
  }

  // ===== Repository 仓储 =====

  registerRepositoryRepository(repository: IRepositoryRepository): void {
    this.repositoryRepository = repository;
  }

  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      throw new Error(
        'RepositoryRepository not registered. Call registerRepositoryRepository() first.',
      );
    }
    return this.repositoryRepository;
  }

  // ===== Resource 仓储 =====

  registerResourceRepository(repository: IResourceRepository): void {
    this.resourceRepository = repository;
  }

  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      throw new Error(
        'ResourceRepository not registered. Call registerResourceRepository() first.',
      );
    }
    return this.resourceRepository;
  }

  // ===== Folder 仓储 =====

  registerFolderRepository(repository: IFolderRepository): void {
    this.folderRepository = repository;
  }

  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      throw new Error(
        'FolderRepository not registered. Call registerFolderRepository() first.',
      );
    }
    return this.folderRepository;
  }

  // ===== Statistics 仓储 =====

  registerRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): void {
    this.repositoryStatisticsRepository = repository;
  }

  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      throw new Error(
        'RepositoryStatisticsRepository not registered. Call registerRepositoryStatisticsRepository() first.',
      );
    }
    return this.repositoryStatisticsRepository;
  }

  // ===== 别名方法（兼容性） =====

  getRepositoryAggregateRepository(): IRepositoryRepository {
    return this.getRepositoryRepository();
  }

  /**
   * 重置所有仓储（用于测试）
   */
  reset(): void {
    this.repositoryRepository = undefined;
    this.resourceRepository = undefined;
    this.folderRepository = undefined;
    this.repositoryStatisticsRepository = undefined;
  }
}
