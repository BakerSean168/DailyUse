/**
 * List Resources
 *
 * 获取仓储的所有资源
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../RepositoryContainer';

/**
 * List Resources Input
 */
export interface ListResourcesInput {
  repositoryUuid: string;
}

/**
 * List Resources Output
 */
export interface ListResourcesOutput {
  resources: ResourceClientDTO[];
}

/**
 * List Resources
 */
export class ListResources {
  private static instance: ListResources;

  private constructor(private readonly resourceRepository: IResourceRepository) {}

  static createInstance(resourceRepository?: IResourceRepository): ListResources {
    const container = RepositoryContainer.getInstance();
    const repo = resourceRepository || container.getResourceRepository();
    ListResources.instance = new ListResources(repo);
    return ListResources.instance;
  }

  static getInstance(): ListResources {
    if (!ListResources.instance) {
      ListResources.instance = ListResources.createInstance();
    }
    return ListResources.instance;
  }

  static resetInstance(): void {
    ListResources.instance = undefined as unknown as ListResources;
  }

  async execute(input: ListResourcesInput): Promise<ListResourcesOutput> {
    const resources = await this.resourceRepository.findByRepositoryUuid(input.repositoryUuid);
    return { resources: resources.map((r) => r.toClientDTO()) };
  }
}

export const listResources = (input: ListResourcesInput): Promise<ListResourcesOutput> =>
  ListResources.getInstance().execute(input);
