// @ts-nocheck
import { apiClient } from '@/shared/api/instances';
import { type RepositoryContracts } from '@dailyuse/contracts';

/**
 * Repository API 客户端
 */
export class RepositoryApiClient {
  private readonly baseUrl = '/repositories';

  // ===== Repository CRUD =====

  /**
   * 创建仓库
   */
  async createRepository(
    request: RepositoryContracts.CreateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(this.baseUrl, request);
    return data;
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
    search?: string;
  }): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    const data = await apiClient.get(this.baseUrl, { params });
    return data;
  }

  /**
   * 获取仓库详情
   */
  async getRepositoryById(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${uuid}`);
    return data;
  }

  /**
   * 更新仓库
   */
  async updateRepository(
    uuid: string,
    request: RepositoryContracts.UpdateRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.put(`${this.baseUrl}/${uuid}`, request);
    return data;
  }

  /**
   * 删除仓库
   */
  async deleteRepository(uuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Repository Status Management =====

  /**
   * 激活仓库
   */
  async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/activate`);
    return data;
  }

  /**
   * 归档仓库
   */
  async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/archive`);
    return data;
  }

  /**
   * 暂停仓库
   */
  async pauseRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/pause`);
    return data;
  }

  /**
   * 恢复仓库
   */
  async resumeRepository(uuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${uuid}/resume`);
    return data;
  }

  // ===== Repository Association Management =====

  /**
   * 关联目标到仓库
   */
  async linkGoalToRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/goals/${goalUuid}`);
    return data;
  }

  /**
   * 取消目标与仓库的关联
   */
  async unlinkGoalFromRepository(
    repositoryUuid: string,
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.delete(`${this.baseUrl}/${repositoryUuid}/goals/${goalUuid}`);
    return data;
  }

  /**
   * 批量关联目标到仓库
   */
  async batchLinkGoalsToRepository(
    repositoryUuid: string,
    goalUuids: string[],
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/goals/batch`, {
      goalUuids,
    });
    return data;
  }

  /**
   * 获取仓库关联的目标列表
   */
  async getRepositoryGoals(repositoryUuid: string): Promise<{ goalUuids: string[] }> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryUuid}/goals`);
    return data;
  }

  // ===== Repository Resource Management =====

  /**
   * 获取所有资源列表
   */
  async getResources(
    params?: RepositoryContracts.ResourceQueryParamsDTO,
  ): Promise<RepositoryContracts.ResourceListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources`, { params });
    return data;
  }

  /**
   * 获取仓库资源列表
   */
  async getRepositoryResources(
    repositoryUuid: string,
    params?: RepositoryContracts.ResourceQueryParamsDTO,
  ): Promise<RepositoryContracts.ResourceListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryUuid}/resources`, { params });
    return data;
  }

  /**
   * 获取资源详情
   */
  async getResourceById(resourceUuid: string): Promise<RepositoryContracts.ResourceDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources/${resourceUuid}`);
    return data;
  }

  /**
   * 创建资源
   */
  async createResource(
    request: RepositoryContracts.CreateResourceRequestDTO,
  ): Promise<RepositoryContracts.ResourceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/resources`, request);
    return data;
  }

  /**
   * 更新资源
   */
  async updateResource(
    resourceUuid: string,
    request: RepositoryContracts.UpdateResourceRequestDTO,
  ): Promise<RepositoryContracts.ResourceDTO> {
    const data = await apiClient.put(`${this.baseUrl}/resources/${resourceUuid}`, request);
    return data;
  }

  /**
   * 删除资源
   */
  async deleteResource(resourceUuid: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/resources/${resourceUuid}`);
  }

  /**
   * 批量操作资源
   */
  async batchOperateResources(
    request: RepositoryContracts.BatchOperationRequestDTO,
  ): Promise<RepositoryContracts.BatchOperationResponseDTO> {
    const data = await apiClient.post(`${this.baseUrl}/resources/batch`, request);
    return data;
  }

  // ===== Repository Git Management =====

  /**
   * 获取Git状态
   */
  async getGitStatus(repositoryUuid: string): Promise<RepositoryContracts.GitStatusResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryUuid}/git/status`);
    return data;
  }

  /**
   * 获取Git日志
   */
  async getGitLog(
    repositoryUuid: string,
    params?: {
      limit?: number;
      offset?: number;
      branch?: string;
    },
  ): Promise<RepositoryContracts.GitLogResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryUuid}/git/log`, { params });
    return data;
  }

  /**
   * Git提交
   */
  async gitCommit(
    repositoryUuid: string,
    request: { message: string; addAll?: boolean },
  ): Promise<RepositoryContracts.GitCommitDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/git/commit`, request);
    return data;
  }

  /**
   * 创建Git分支
   */
  async createGitBranch(
    repositoryUuid: string,
    request: { branchName: string; checkout?: boolean },
  ): Promise<{ branchName: string; current: boolean }> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/git/branch`, request);
    return data;
  }

  /**
   * 切换Git分支
   */
  async switchGitBranch(
    repositoryUuid: string,
    branchName: string,
  ): Promise<{ branchName: string; current: boolean }> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/git/checkout`, {
      branchName,
    });
    return data;
  }

  // ===== Repository Sync Management =====

  /**
   * 同步仓库
   */
  async syncRepository(
    repositoryUuid: string,
    request?: RepositoryContracts.SyncRepositoryRequestDTO,
  ): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/sync`, request || {});
    return data;
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(repositoryUuid: string): Promise<{ syncStatus: any }> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryUuid}/sync-status`);
    return data;
  }

  /**
   * 强制同步
   */
  async forceSyncRepository(repositoryUuid: string): Promise<RepositoryContracts.RepositoryDTO> {
    const data = await apiClient.post(`${this.baseUrl}/${repositoryUuid}/force-sync`);
    return data;
  }

  // ===== Search and Query =====

  /**
   * 搜索仓库
   */
  async searchRepositories(params: {
    query: string;
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    tags?: string[];
  }): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/search`, { params });
    return data;
  }

  /**
   * 搜索内容
   */
  async searchContent(params: {
    query: string;
    repositoryUuid?: string;
    page?: number;
    limit?: number;
  }): Promise<RepositoryContracts.SearchResultResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/search/content`, { params });
    return data;
  }

  /**
   * 获取与指定目标关联的仓库
   */
  async getRepositoriesByGoal(
    goalUuid: string,
  ): Promise<RepositoryContracts.RepositoryListResponseDTO> {
    const data = await apiClient.get(this.baseUrl, {
      params: { goalUuid, limit: 1000 },
    });
    return data;
  }

  /**
   * 获取仓库统计信息
   */
  async getRepositoryStatistics(repositoryUuid: string): Promise<{ stats: any }> {
    const data = await apiClient.get(`${this.baseUrl}/${repositoryUuid}/statistics`);
    return data;
  }

  /**
   * 获取标签云
   */
  async getTagCloud(repositoryUuid?: string): Promise<RepositoryContracts.TagCloudResponseDTO> {
    const params = repositoryUuid ? { repositoryUuid } : {};
    const data = await apiClient.get(`${this.baseUrl}/tags/cloud`, { params });
    return data;
  }

  /**
   * 添加关联内容
   */
  async addLinkedContent(
    request: RepositoryContracts.AddLinkedContentRequestDTO,
  ): Promise<RepositoryContracts.LinkedContentDTO> {
    const data = await apiClient.post(`${this.baseUrl}/linked-content`, request);
    return data;
  }

  /**
   * 获取资源的关联内容
   */
  async getLinkedContents(
    resourceUuid: string,
  ): Promise<RepositoryContracts.LinkedContentListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources/${resourceUuid}/linked-content`);
    return data;
  }

  /**
   * 创建资源引用
   */
  async createResourceReference(
    request: RepositoryContracts.CreateResourceReferenceRequestDTO,
  ): Promise<RepositoryContracts.ResourceReferenceDTO> {
    const data = await apiClient.post(`${this.baseUrl}/resource-references`, request);
    return data;
  }

  /**
   * 获取资源引用
   */
  async getResourceReferences(
    resourceUuid: string,
  ): Promise<RepositoryContracts.ResourceReferenceListResponseDTO> {
    const data = await apiClient.get(`${this.baseUrl}/resources/${resourceUuid}/references`);
    return data;
  }
}

// 导出单例实例
export const repositoryApiClient = new RepositoryApiClient();
