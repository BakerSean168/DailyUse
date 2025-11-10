import type { RepositoryContracts } from '@dailyuse/contracts';
import { apiClient } from '@/shared/utils/apiClient';

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
    const response = await apiClient.post('/repositories', data);
    return response.data;
  }

  /**
   * 获取仓储列表
   */
  static async listRepositories(
    status?: RepositoryContracts.RepositoryStatus
  ): Promise<RepositoryContracts.RepositoryClientDTO[]> {
    const params = status ? { status } : {};
    const response = await apiClient.get('/repositories', { params });
    return response.data;
  }

  /**
   * 获取仓储详情
   */
  static async getRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    const response = await apiClient.get(`/repositories/${uuid}`);
    return response.data;
  }

  /**
   * 更新仓储配置
   */
  static async updateConfig(
    uuid: string,
    config: Partial<RepositoryContracts.RepositoryConfigServerDTO>
  ): Promise<RepositoryContracts.RepositoryClientDTO> {
    const response = await apiClient.patch(`/repositories/${uuid}/config`, config);
    return response.data;
  }

  /**
   * 归档仓储
   */
  static async archiveRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    const response = await apiClient.post(`/repositories/${uuid}/archive`);
    return response.data;
  }

  /**
   * 激活仓储
   */
  static async activateRepository(uuid: string): Promise<RepositoryContracts.RepositoryClientDTO> {
    const response = await apiClient.post(`/repositories/${uuid}/activate`);
    return response.data;
  }

  /**
   * 删除仓储
   */
  static async deleteRepository(uuid: string): Promise<void> {
    await apiClient.delete(`/repositories/${uuid}`);
  }
}
