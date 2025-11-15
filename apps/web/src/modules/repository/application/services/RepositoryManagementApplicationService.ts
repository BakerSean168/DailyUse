// @ts-nocheck
import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { Repository } from '@dailyuse/domain-client';
import { type RepositoryContracts } from '@dailyuse/contracts';

/**
 * 仓库管理应用服务
 * 用例：仓库的 CRUD 操作
 */
export class RepositoryManagementApplicationService {
  /**
   * 懒加载获取 Repository Store
   */
  private get repositoryStore() {
    return useRepositoryStore();
  }

  /**
   * 用例：创建仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.createRepository(request);
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
   * 用例：获取仓库列表
   */
  async getRepositories(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    goalUuid?: string;
  }): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getRepositories(params);
      const repositoryEntities = response.repositories.map((dto) => Repository.fromServerDTO(dto));
      this.repositoryStore.setRepositories(repositoryEntities);

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
   * 用例：获取仓库详情
   */
  async getRepositoryById(uuid: string): Promise<RepositoryContracts.RepositoryDTO | null> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.getRepositoryById(uuid);
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库详情失败';
      this.repositoryStore.setError(errorMessage);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 用例：更新仓库
   */
  async updateRepository(
    uuid: string,
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.updateRepository(uuid, request);
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

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
   * 用例：删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      await repositoryApiClient.deleteRepository(uuid);
      this.repositoryStore.removeRepository(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 用例：激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.activateRepository(uuid);
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

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
   * 用例：归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.archiveRepository(uuid);
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '归档仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }
}

// 导出单例
export const repositoryManagementService = new RepositoryManagementApplicationService();
