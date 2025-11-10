/**
 * Resource Application Service
 * Resource 应用服务 - Story 10-2
 */
import { v4 as uuidv4 } from 'uuid';
import { Resource } from '@dailyuse/domain-server';
import { ResourceType } from '@dailyuse/contracts';
import { IResourceRepository } from '../../domain/repositories/IResourceRepository';
import type { RepositoryContracts } from '@dailyuse/contracts';

type ResourceServerDTO = RepositoryContracts.ResourceServerDTO;
type ResourceClientDTO = RepositoryContracts.ResourceClientDTO;

export class ResourceApplicationService {
  constructor(private resourceRepository: IResourceRepository) {}

  async createResource(params: {
    repositoryUuid: string;
    folderUuid?: string;
    name: string;
    type: ResourceType;
    path: string;
    content?: string;
  }): Promise<ResourceClientDTO> {
    const exists = await this.resourceRepository.existsByPath(params.repositoryUuid, params.path);
    if (exists) {
      throw new Error(`Resource already exists at path: ${params.path}`);
    }

    const resource = Resource.create({
      uuid: uuidv4(),
      repositoryUuid: params.repositoryUuid,
      folderUuid: params.folderUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      content: params.content,
    });

    if (params.content) {
      resource.activate();
    }

    await this.resourceRepository.save(resource);
    return this.toClientDTO(resource.toServerDTO());
  }

  async updateMarkdownContent(uuid: string, content: string): Promise<ResourceClientDTO> {
    const resource = await this.resourceRepository.findById(uuid);
    if (!resource) throw new Error(`Resource not found: ${uuid}`);

    resource.updateMarkdownContent(content);
    await this.resourceRepository.save(resource);
    return this.toClientDTO(resource.toServerDTO());
  }

  async getResourceById(uuid: string): Promise<ResourceClientDTO | null> {
    const resource = await this.resourceRepository.findById(uuid);
    if (!resource) return null;
    return this.toClientDTO(resource.toServerDTO());
  }

  async getResourcesByRepository(repositoryUuid: string): Promise<ResourceClientDTO[]> {
    const resources = await this.resourceRepository.findByRepositoryUuid(repositoryUuid);
    return resources.map((r) => this.toClientDTO(r.toServerDTO()));
  }

  async deleteResource(uuid: string): Promise<void> {
    const resource = await this.resourceRepository.findById(uuid);
    if (!resource) throw new Error(`Resource not found: ${uuid}`);
    resource.delete();
    await this.resourceRepository.save(resource);
  }

  private toClientDTO(serverDTO: ResourceServerDTO): ResourceClientDTO {
    const { Resource: ResourceClient } = require('@dailyuse/domain-client');
    const clientResource = ResourceClient.fromServerDTO(serverDTO);
    return clientResource.toClientDTO();
  }
}
