import type { RepositoryContracts } from '@dailyuse/contracts';
import { apiClient } from '@/shared/api/instances';

type TreeNode = RepositoryContracts.TreeNode;
type FileTreeResponse = RepositoryContracts.FileTreeResponse;

export class RepositoryApiClient {
  /**
   * 创建仓储
   */
  static async createRepository(data: {
    name: string;
    type: RepositoryContracts.RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfigServerDTO>;
  }): Promise<RepositoryContracts.RepositoryClientDTO> {
    return await apiClient.post('/repositories', data);
  }

  /**
   * 获取仓储列表
   */
  static async listRepositories(
    status?: RepositoryContracts.RepositoryStatus
  ): Promise<RepositoryContracts.RepositoryClientDTO[]> {
    const params = status ? { status } : {};
    return await apiClient.get('/repositories', { params });
  }

  /**
   * 获取仓储详情
   */
  static async getRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    return await apiClient.get(`/repositories/${uuid}`);
  }

  /**
   * 更新仓储配置
   */
  static async updateConfig(
    uuid: string,
    config: Partial<RepositoryContracts.RepositoryConfigServerDTO>
  ): Promise<RepositoryContracts.RepositoryClientDTO> {
    return await apiClient.patch(`/repositories/${uuid}/config`, config);
  }

  /**
   * 归档仓储
   */
  static async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    return await apiClient.post(`/repositories/${uuid}/archive`);
  }

  /**
   * 激活仓储
   */
  static async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    return await apiClient.post(`/repositories/${uuid}/activate`);
  }

  /**
   * 删除仓储
   */
  static async deleteRepository(uuid: string): Promise<void> {
    await apiClient.delete(`/repositories/${uuid}`);
  }

  /**
   * 获取文件树（文件夹 + 资源统一结构）
   * Story 11.1: File Tree Unified Rendering
   */
  static async getFileTree(repositoryUuid: string): Promise<FileTreeResponse> {
    return await apiClient.get(`/repositories/${repositoryUuid}/tree`);
  }
}
