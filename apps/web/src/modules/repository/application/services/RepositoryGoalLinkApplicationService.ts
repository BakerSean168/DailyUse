// @ts-nocheck
import { useRepositoryStore } from '../../presentation/stores/repositoryStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { Repository } from '@dailyuse/domain-client';
import { type RepositoryContracts } from '@dailyuse/contracts';

/**
 * 仓库与目标关联应用服务
 * 用例：仓库与目标的关联/解除关联
 */
export class RepositoryGoalLinkApplicationService {
  /**
   * 懒加载获取 Repository Store
   */
  private get repositoryStore() {
    return useRepositoryStore();
  }

  /**
   * 用例：关联目标到仓库
   */
  async linkGoalToRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.linkGoalToRepository(
        repositoryUuid,
        goalUuid,
      );
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '关联目标到仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 用例：解除仓库与目标的关联
   */
  async unlinkGoalFromRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const repositoryDTO = await repositoryApiClient.unlinkGoalFromRepository(
        repositoryUuid,
        goalUuid,
      );
      const repositoryEntity = Repository.fromServerDTO(repositoryDTO);
      this.repositoryStore.addRepository(repositoryEntity);

      return repositoryDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '解除目标关联失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }

  /**
   * 用例：获取目标关联的仓库列表
   */
  async getRepositoriesByGoal(
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    try {
      this.repositoryStore.setLoading(true);
      this.repositoryStore.setError(null);

      const response = await repositoryApiClient.getRepositories({ goalUuid });
      const repositoryEntities = response.repositories.map((dto) => Repository.fromServerDTO(dto));
      this.repositoryStore.setRepositories(repositoryEntities);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取目标关联仓库失败';
      this.repositoryStore.setError(errorMessage);
      throw error;
    } finally {
      this.repositoryStore.setLoading(false);
    }
  }
}

// 导出单例
export const repositoryGoalLinkService = new RepositoryGoalLinkApplicationService();
