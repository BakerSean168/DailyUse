// @ts-nocheck
import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { Repository, Resource } from '@dailyuse/domain-client';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO } from '@dailyuse/contracts/repository';

/**
 * Repository Web 应用服务 - 新架构
 * 负责协调数据同步和 Store 之间的数据流
 * 实现缓存优先的数据同步策略
 */
export class RepositoryWebApplicationService {
  /**
   * 懒加载获取 Repository Store
   * 避免在 Pinia 初始化之前调用
   */
  private get repositoryStore() {
    return useRepositoryStore();
  }

  // ===== 仓库 CRUD 操作 =====

  /**
   * 创建仓库
   */
  async createRepository(
    request: CreateRepositoryRequestDTO,
  ): Promise<RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.createRepository(request);

      // 将DTO转换为Domain实体并添加到缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取仓库列表
   */
  async getRepositories(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    goalUuid?: string;
  }): Promise<RepositoryListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getRepositories(params);

      // 将DTO转换为Domain实体并批量同步到 store
      const repositoryEntities = response.repositories.map((dto) => Repository.fromServerDTO(dto));
      this.repositoryStore.setRepositories(repositoryEntities);

      // 更新分页信息
      this.repositoryStore.setPagination({
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库列表失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryById(uuid: string): Promise<RepositoryDTO | null> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.getRepositoryById(uuid);

      // 将DTO转换为Domain实体并添加到缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取仓库详情失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    uuid: string,
    request: UpdateRepositoryRequestDTO,
  ): Promise<RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.updateRepository(uuid, request);

      // 将DTO转换为Domain实体并更新缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.updateRepository(uuid, repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      await repositoryApiClient.deleteRepository(uuid);

      // 从缓存中移除
      this.repositoryStore.removeRepository(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 仓库状态管理 =====

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.activateRepository(uuid);

      // 将DTO转换为Domain实体并更新缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.updateRepository(uuid, repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '激活仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.archiveRepository(uuid);

      // 将DTO转换为Domain实体并更新缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.updateRepository(uuid, repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 仓库关联管理 =====

  /**
   * 关联目标到仓库
   */
  async linkGoalToRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.linkGoalToRepository(
        repositoryUuid,
        goalUuid,
      );

      // 将DTO转换为Domain实体并更新缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.updateRepository(repositoryUuid, repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '关联目标失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 取消目标与仓库的关联
   */
  async unlinkGoalFromRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.unlinkGoalFromRepository(
        repositoryUuid,
        goalUuid,
      );

      // 将DTO转换为Domain实体并更新缓存
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.updateRepository(repositoryUuid, repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取消关联失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 搜索和查询 =====

  /**
   * 搜索仓库
   */
  async searchRepositories(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<RepositoryListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.searchRepositories(params);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取与指定目标关联的仓库
   */
  async getRepositoriesByGoal(
    goalUuid: string,
  ): Promise<RepositoryServerDTO[]> {
    // 优先从缓存获取
    const cachedRepositories = this.repositoryStore.getRepositoriesByGoalUuid(goalUuid);

    if (cachedRepositories.length > 0) {
      return cachedRepositories.map((repo) => repo.toServerDTO());
    }

    // 如果缓存为空，从API获取
    const response = await this.getRepositories({
      goalUuid,
      limit: 1000,
    });

    return response.repositories || [];
  }

  // ===== 资源管理 =====

  /**
   * 获取所有资源列表
   */
  async getResources(
    params?: ResourceQueryParamsDTO,
  ): Promise<ResourceListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getResources(params);

      // 将DTO转换为Domain实体并添加到缓存
      const resourceEntities = response.resources.map((dto) => Resource.fromServerDTO(dto));
      this.repositoryStore.addResources(resourceEntities);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取资源列表失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取仓库资源列表
   */
  async getRepositoryResources(
    repositoryUuid: string,
    params?: ResourceQueryParamsDTO,
  ): Promise<ResourceListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getRepositoryResources(repositoryUuid, params);

      // 将DTO转换为Domain实体并添加到缓存
      const resourceEntities = response.resources.map((dto) => Resource.fromServerDTO(dto));
      this.repositoryStore.addResources(resourceEntities);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 创建资源
   */
  async createResource(
    request: CreateResourceRequestDTO,
  ): Promise<ResourceDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const resourceDTO = await repositoryApiClient.createResource(request);

      // 将DTO转换为Domain实体并添加到缓存
      const resourceEntity = Resource.fromServerDTO(resourceDTO);
      this.repositoryStore.addResource(resourceEntity);

      return resourceDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 获取资源详情
   */
  async getResourceById(uuid: string): Promise<ResourceDTO | null> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // 先从缓存获取
      const cachedResource = this.repositoryStore.getResourceByUuid(uuid);
      if (cachedResource) {
        return cachedResource.toServerDTO();
      }

      // 如果缓存中没有，从API获取
      const resourceDTO = await repositoryApiClient.getResourceById(uuid);

      // 将DTO转换为Domain实体并添加到缓存
      const resourceEntity = Resource.fromServerDTO(resourceDTO);
      this.repositoryStore.addResource(resourceEntity);

      return resourceDTO;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : '获取资源详情失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 更新资源
   */
  async updateResource(
    uuid: string,
    request: UpdateResourceRequestDTO,
  ): Promise<ResourceDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const resourceDTO = await repositoryApiClient.updateResource(uuid, request);

      // 将DTO转换为Domain实体并更新缓存
      const resourceEntity = Resource.fromServerDTO(resourceDTO);
      this.repositoryStore.updateResource(uuid, resourceEntity);

      return resourceDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 删除资源
   */
  async deleteResource(uuid: string): Promise<void> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      await repositoryApiClient.deleteResource(uuid);

      // 从缓存中移除
      this.repositoryStore.removeResource(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 搜索资源
   */
  async searchResources(params: {
    query: string;
    repositoryUuid?: string;
    pagination?: { page: number; limit: number };
  }): Promise<ResourceListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await this.getResources({
        keyword: params.query,
        repositoryUuid: params.repositoryUuid,
        pagination: params.pagination || { page: 1, limit: 20 },
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索资源失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== Git管理 =====

  /**
   * 获取Git状态
   */
  async getGitStatus(repositoryUuid: string): Promise<GitStatusResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const status = await repositoryApiClient.getGitStatus(repositoryUuid);
      return status;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取Git状态失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * Git提交
   */
  async gitCommit(
    repositoryUuid: string,
    message: string,
    addAll = true,
  ): Promise<GitCommitDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const commit = await repositoryApiClient.gitCommit(repositoryUuid, { message, addAll });
      return commit;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Git提交失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  // ===== 数据同步方法 =====

  /**
   * 同步所有仓库数据到 store
   * 用于应用初始化时加载所有数据
   */
  async syncAllRepositories(): Promise<{
    repositoriesCount: number;
    resourcesCount: number;
  }> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const [repositoryDTOs, resourceDTOs] = await Promise.all([
        this.getRepositories({ limit: 1000 }),
        this.getResources({ pagination: { page: 1, limit: 1000 } }),
      ]);

      const repositories = repositoryDTOs.repositories || [];
      const resources = resourceDTOs.resources || [];

      // 将 DTO 转换为 Domain 实体
      const repositoryEntities = repositories.map((dto) => Repository.fromServerDTO(dto));
      const resourceEntities = resources.map((dto) => Resource.fromServerDTO(dto));

      // 批量同步到 store
      this.repositoryStore.syncAllData(repositoryEntities, resourceEntities);

      console.log(`成功同步数据: ${repositories.length} 个仓库, ${resources.length} 个资源`);

      return {
        repositoriesCount: repositories.length,
        resourcesCount: resources.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步所有仓库数据失败';
      this.repositoryStore.setError(errorMessage);
      console.error('同步所有仓库数据失败:', error);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 检查是否需要同步数据
   */
  shouldSyncData(): boolean {
    return (
      !this.repositoryStore.isInitialized ||
      this.repositoryStore.getAllRepositories.length === 0 ||
      this.repositoryStore.shouldRefreshCache
    );
  }

  // ===== 工具方法 =====

  /**
   * 获取 Repository Store 实例
   */
  getStore() {
    return this.repositoryStore;
  }

  /**
   * 初始化服务
   * 会自动同步所有仓库数据到 store
   */
  async initialize(): Promise<void> {
    try {
      // 先初始化 store（加载本地缓存）
      this.repositoryStore.initialize();

      // 检查是否需要从服务器同步数据
      if (this.shouldSyncData()) {
        console.log('开始同步所有仓库数据...');
        await this.syncAllRepositories();
      } else {
        console.log('使用本地缓存数据，跳过服务器同步');
      }
    } catch (error) {
      console.error('Repository 服务初始化失败:', error);
      // 即使同步失败，也要完成 store 的初始化
      if (!this.repositoryStore.isInitialized) {
        this.repositoryStore.initialize();
      }
      throw error;
    }
  }

  /**
   * 强制重新同步所有数据
   */
  async forceSync(): Promise<void> {
    console.log('强制重新同步所有数据...');
    await this.syncAllRepositories();
  }
}

