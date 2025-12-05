/**
 * Repository Container (Server)
 *
 * 依赖注入容器，管理 Repository 模块的 repository 实例
 */

import type {
  IRepositoryRepository,
  IResourceRepository,
  IFolderRepository,
  IRepositoryStatisticsRepository,
} from '@dailyuse/domain-server/repository';

/**
 * Repository 模块依赖注入容器
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositoryRepository: IRepositoryRepository | null = null;
  private resourceRepository: IResourceRepository | null = null;
  private folderRepository: IFolderRepository | null = null;
  private repositoryStatisticsRepository: IRepositoryStatisticsRepository | null = null;

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
    RepositoryContainer.instance = new RepositoryContainer();
  }

  // ===== Repository 仓储 =====

  registerRepositoryRepository(repository: IRepositoryRepository): this {
    this.repositoryRepository = repository;
    return this;
  }

  getRepositoryRepository(): IRepositoryRepository {
    if (!this.repositoryRepository) {
      throw new Error('RepositoryRepository not registered.');
    }
    return this.repositoryRepository;
  }

  // ===== Resource 仓储 =====

  registerResourceRepository(repository: IResourceRepository): this {
    this.resourceRepository = repository;
    return this;
  }

  getResourceRepository(): IResourceRepository {
    if (!this.resourceRepository) {
      throw new Error('ResourceRepository not registered.');
    }
    return this.resourceRepository;
  }

  // ===== Folder 仓储 =====

  registerFolderRepository(repository: IFolderRepository): this {
    this.folderRepository = repository;
    return this;
  }

  getFolderRepository(): IFolderRepository {
    if (!this.folderRepository) {
      throw new Error('FolderRepository not registered.');
    }
    return this.folderRepository;
  }

  // ===== Statistics 仓储 =====

  registerRepositoryStatisticsRepository(repository: IRepositoryStatisticsRepository): this {
    this.repositoryStatisticsRepository = repository;
    return this;
  }

  getRepositoryStatisticsRepository(): IRepositoryStatisticsRepository {
    if (!this.repositoryStatisticsRepository) {
      throw new Error('RepositoryStatisticsRepository not registered.');
    }
    return this.repositoryStatisticsRepository;
  }

  // ===== 别名方法（兼容性） =====

  getRepositoryAggregateRepository(): IRepositoryRepository {
    return this.getRepositoryRepository();
  }

  // ===== Utilities =====

  isConfigured(): boolean {
    return (
      this.repositoryRepository !== null &&
      this.resourceRepository !== null &&
      this.folderRepository !== null
    );
  }

  clear(): void {
    this.repositoryRepository = null;
    this.resourceRepository = null;
    this.folderRepository = null;
    this.repositoryStatisticsRepository = null;
  }
}
