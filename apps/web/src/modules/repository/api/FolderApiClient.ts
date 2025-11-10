import type { RepositoryContracts } from '@dailyuse/contracts';
import { apiClient } from '@/shared/api/instances';

export class FolderApiClient {
  /**
   * 创建文件夹
   */
  static async createFolder(
    repositoryUuid: string,
    data: {
      name: string;
      parentUuid?: string | null;
      order?: number;
      metadata?: Partial<RepositoryContracts.FolderMetadataServerDTO>;
    }
  ): Promise<RepositoryContracts.FolderClientDTO> {
    return await apiClient.post(`/repositories/${repositoryUuid}/folders`, data);
  }

  /**
   * 获取文件夹树
   */
  static async getFolderTree(repositoryUuid: string): Promise<RepositoryContracts.FolderClientDTO[]> {
    return await apiClient.get(`/repositories/${repositoryUuid}/folders/tree`);
  }

  /**
   * 获取文件夹详情
   */
  static async getFolder(uuid: string): Promise<RepositoryContracts.FolderClientDTO> {
    return await apiClient.get(`/folders/${uuid}`);
  }

  /**
   * 重命名文件夹
   */
  static async renameFolder(uuid: string, name: string): Promise<RepositoryContracts.FolderClientDTO> {
    return await apiClient.patch(`/folders/${uuid}/rename`, { name });
  }

  /**
   * 移动文件夹
   */
  static async moveFolder(uuid: string, newParentUuid: string | null): Promise<RepositoryContracts.FolderClientDTO> {
    return await apiClient.patch(`/folders/${uuid}/move`, { newParentUuid });
  }

  /**
   * 删除文件夹
   */
  static async deleteFolder(uuid: string): Promise<void> {
    await apiClient.delete(`/folders/${uuid}`);
  }
}
