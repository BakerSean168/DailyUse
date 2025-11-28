// @ts-nocheck
import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import { useResourceStore } from '../../presentation/stores/resourceStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { Repository, Resource } from '@dailyuse/domain-client/repository';

/**
 * 仓库数据同步应用服务
 * 用例：初始化模块、全量同步数据
 */
export class RepositorySyncApplicationService {
  /**
   * 懒加载获取 Store
   */
  private get repositoryStore() {
    return useRepositoryStore();
  }

  private get resourceStore() {
    return useResourceStore();
  }

  /**
   * 用例：初始化仓库模块
   * 首次加载时同步数据到 Store
   */
  async initialize(): Promise<void> {
    try {
      if (this.repositoryStore.isInitialized) {
        console.log('[RepositorySyncService] 模块已初始化，跳过');
        return;
      }

      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // 并行加载仓库和资源
      const [repoResponse, resourceResponse] = await Promise.all([
        repositoryApiClient.getRepositories({ limit: 100 }),
        repositoryApiClient.getResources({}),
      ]);

      // 将 DTO 转换为领域实体并同步到 Store
      const repositoryEntities = repoResponse.repositories.map((dto) =>
        Repository.fromServerDTO(dto),
      );
      const resourceEntities = resourceResponse.resources.map((dto) => Resource.fromServerDTO(dto));

      this.repositoryStore.setRepositories(repositoryEntities);
      this.resourceStore.setResources(resourceEntities);

      this.repositoryStore.setInitialized(true);
      console.log('[RepositorySyncService] 模块初始化完成', {
        repositories: repositoryEntities.length,
        resources: resourceEntities.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '初始化仓库模块失败';
      this.repositoryStore.setError(errorMessage);
      console.error('[RepositorySyncService] 初始化失败:', error);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 用例：强制全量同步
   * 用于刷新缓存或手动同步
   */
  async forceSync(): Promise<void> {
    try {
      console.log('[RepositorySyncService] 开始强制同步');
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      // 并行加载仓库和资源
      const [repoResponse, resourceResponse] = await Promise.all([
        repositoryApiClient.getRepositories({ limit: 100 }),
        repositoryApiClient.getResources({}),
      ]);

      // 将 DTO 转换为领域实体并同步到 Store
      const repositoryEntities = repoResponse.repositories.map((dto) =>
        Repository.fromServerDTO(dto),
      );
      const resourceEntities = resourceResponse.resources.map((dto) => Resource.fromServerDTO(dto));

      this.repositoryStore.setRepositories(repositoryEntities);
      this.resourceStore.setResources(resourceEntities);

      console.log('[RepositorySyncService] 强制同步完成', {
        repositories: repositoryEntities.length,
        resources: resourceEntities.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '强制同步失败';
      this.repositoryStore.setError(errorMessage);
      console.error('[RepositorySyncService] 强制同步失败:', error);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 用例：同步所有仓库数据
   * 返回同步结果统计
   */
  async syncAllRepositories(): Promise<{
    synced: number;
    failed: number;
    errors: Array<{ repositoryUuid: string; error: string }>;
  }> {
    const result = {
      synced: 0,
      failed: 0,
      errors: [] as Array<{ repositoryUuid: string; error: string }>,
    };

    try {
      const response = await repositoryApiClient.getRepositories({ limit: 100 });
      const repositories = response.repositories;

      for (const repoDTO of repositories) {
        try {
          const repositoryEntity = Repository.fromServerDTO(repoDTO);
          this.repositoryStore.addRepository(repositoryEntity);

          // 同步仓库下的资源
          const resources = await repositoryApiClient.getRepositoryResources(repoDTO.uuid);
          const resourceEntities = resources.map((dto) => Resource.fromServerDTO(dto));
          this.resourceStore.setResources(resourceEntities);

          result.synced++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            repositoryUuid: repoDTO.uuid,
            error: error instanceof Error ? error.message : '未知错误',
          });
          console.error(`[RepositorySyncService] 同步仓库失败: ${repoDTO.uuid}`, error);
        }
      }

      console.log('[RepositorySyncService] 同步完成', result);
      return result;
    } catch (error) {
      console.error('[RepositorySyncService] 全量同步失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const repositorySyncService = new RepositorySyncApplicationService();
