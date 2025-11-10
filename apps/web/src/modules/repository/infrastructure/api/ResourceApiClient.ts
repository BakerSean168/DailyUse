/**
 * Resource API Client
 * Epic 10 Story 10-2: Resource CRUD + Markdown 编辑器
 */
import type { AxiosInstance } from 'axios';
import type { ResourceClientDTO } from '@dailyuse/contracts';

export interface CreateResourceDTO {
  repositoryUuid: string;
  name: string;
  type: string;
  path: string;
  folderUuid?: string;
  content?: string;
}

export interface UpdateMarkdownContentDTO {
  content: string;
}

export class ResourceApiClient {
  constructor(private readonly api: AxiosInstance) {}

  /**
   * 创建资源
   */
  async createResource(dto: CreateResourceDTO): Promise<ResourceClientDTO> {
    const response = await this.api.post<ResourceClientDTO>('/resources', dto);
    return response.data;
  }

  /**
   * 获取资源详情
   */
  async getResourceById(uuid: string): Promise<ResourceClientDTO> {
    const response = await this.api.get<ResourceClientDTO>(`/resources/${uuid}`);
    return response.data;
  }

  /**
   * 获取仓库下的所有资源
   */
  async getResourcesByRepository(repositoryUuid: string): Promise<ResourceClientDTO[]> {
    const response = await this.api.get<ResourceClientDTO[]>(
      `/repositories/${repositoryUuid}/resources`
    );
    return response.data;
  }

  /**
   * 更新 Markdown 内容 (Story 10-2 核心功能)
   */
  async updateMarkdownContent(
    uuid: string,
    content: string
  ): Promise<void> {
    await this.api.put(`/resources/${uuid}/content`, { content });
  }

  /**
   * 删除资源 (软删除)
   */
  async deleteResource(uuid: string): Promise<void> {
    await this.api.delete(`/resources/${uuid}`);
  }
}
