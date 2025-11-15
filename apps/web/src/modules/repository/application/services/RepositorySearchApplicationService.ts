// @ts-nocheck
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { type RepositoryContracts } from '@dailyuse/contracts';

/**
 * 仓库搜索应用服务
 * 用例：搜索仓库和资源
 */
export class RepositorySearchApplicationService {
  /**
   * 用例：搜索仓库
   */
  async searchRepositories(params: {
    query?: string;
    type?: string;
    status?: string;
    goalUuid?: string;
  }): Promise<RepositoryContracts.RepositoryDTO[]> {
    try {
      const repositories = await repositoryApiClient.searchRepositories(params);
      return repositories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索仓库失败';
      console.error(errorMessage, error);
      throw error;
    }
  }

  /**
   * 用例：搜索资源
   */
  async searchResources(params: {
    query?: string;
    repositoryUuid?: string;
    type?: string;
    tags?: string[];
  }): Promise<RepositoryContracts.ResourceDTO[]> {
    try {
      const resources = await repositoryApiClient.searchResources(params);
      return resources;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索资源失败';
      console.error(errorMessage, error);
      throw error;
    }
  }
}

// 导出单例
export const repositorySearchService = new RepositorySearchApplicationService();
