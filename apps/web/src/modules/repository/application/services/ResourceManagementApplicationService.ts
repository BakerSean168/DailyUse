// @ts-nocheck
import { useResourceStore } from '../../presentation/stores/resourceStore';
import { repositoryApiClient } from '../../infrastructure/api/repositoryApiClient';
import { Resource } from '@dailyuse/domain-client/repository';
import type { RepositoryClientDTO, ResourceClientDTO, FolderClientDTO } from '@dailyuse/contracts/repository';

/**
 * 资源管理应用服务
 * 用例：资源的 CRUD 操作
 */
export class ResourceManagementApplicationService {
  /**
   * 懒加载获取 Resource Store
   */
  private get resourceStore() {
    return useResourceStore();
  }

  /**
   * 用例：创建资源
   */
  async createResource(
    request: CreateResourceRequestDTO,
  ): Promise<ResourceDTO> {
    try {
      this.resourceStore.setLoading(true);
      this.resourceStore.setError(null);

      const resourceDTO = await repositoryApiClient.createResource(request);
      const resourceEntity = Resource.fromServerDTO(resourceDTO);
      this.resourceStore.addResource(resourceEntity);

      return resourceDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建资源失败';
      this.resourceStore.setError(errorMessage);
      throw error;
    } finally {
      this.resourceStore.setLoading(false);
    }
  }

  /**
   * 用例：获取资源列表
   */
  async getResources(
    repositoryUuid?: string,
  ): Promise<ResourceListResponseDTO> {
    try {
      this.resourceStore.setLoading(true);
      this.resourceStore.setError(null);

      const response = await repositoryApiClient.getResources({ repositoryUuid });
      const resourceEntities = response.resources.map((dto) => Resource.fromServerDTO(dto));
      this.resourceStore.setResources(resourceEntities);

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取资源列表失败';
      this.resourceStore.setError(errorMessage);
      throw error;
    } finally {
      this.resourceStore.setLoading(false);
    }
  }

  /**
   * 用例：获取仓库下的资源
   */
  async getRepositoryResources(
    repositoryUuid: string,
  ): Promise<ResourceDTO[]> {
    try {
      this.resourceStore.setLoading(true);
      this.resourceStore.setError(null);

      const resources = await repositoryApiClient.getRepositoryResources(repositoryUuid);
      const resourceEntities = resources.map((dto) => Resource.fromServerDTO(dto));
      this.resourceStore.setResources(resourceEntities);

      return resources;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取仓库资源失败';
      this.resourceStore.setError(errorMessage);
      throw error;
    } finally {
      this.resourceStore.setLoading(false);
    }
  }

  /**
   * 用例：获取资源详情
   */
  async getResourceById(uuid: string): Promise<ResourceDTO | null> {
    try {
      this.resourceStore.setLoading(true);
      this.resourceStore.setError(null);

      const resourceDTO = await repositoryApiClient.getResourceById(uuid);
      const resourceEntity = Resource.fromServerDTO(resourceDTO);
      this.resourceStore.addResource(resourceEntity);

      return resourceDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取资源详情失败';
      this.resourceStore.setError(errorMessage);
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    } finally {
      this.resourceStore.setLoading(false);
    }
  }

  /**
   * 用例：更新资源
   */
  async updateResource(
    uuid: string,
    request: UpdateResourceRequestDTO,
  ): Promise<ResourceDTO> {
    try {
      this.resourceStore.setLoading(true);
      this.resourceStore.setError(null);

      const resourceDTO = await repositoryApiClient.updateResource(uuid, request);
      const resourceEntity = Resource.fromServerDTO(resourceDTO);
      this.resourceStore.addResource(resourceEntity);

      return resourceDTO;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新资源失败';
      this.resourceStore.setError(errorMessage);
      throw error;
    } finally {
      this.resourceStore.setLoading(false);
    }
  }

  /**
   * 用例：删除资源
   */
  async deleteResource(uuid: string): Promise<void> {
    try {
      this.resourceStore.setLoading(true);
      this.resourceStore.setError(null);

      await repositoryApiClient.deleteResource(uuid);
      this.resourceStore.removeResource(uuid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除资源失败';
      this.resourceStore.setError(errorMessage);
      throw error;
    } finally {
      this.resourceStore.setLoading(false);
    }
  }
}

// 导出单例
export const resourceManagementService = new ResourceManagementApplicationService();

