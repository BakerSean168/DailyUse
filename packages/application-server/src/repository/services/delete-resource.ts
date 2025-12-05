/**
 * Delete Resource
 *
 * 删除资源
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Delete Resource Input
 */
export interface DeleteResourceInput {
  uuid: string;
}

/**
 * Delete Resource
 */
export class DeleteResource {
  private static instance: DeleteResource;

  private constructor(private readonly resourceRepository: IResourceRepository) {}

  static createInstance(resourceRepository?: IResourceRepository): DeleteResource {
    const container = RepositoryContainer.getInstance();
    const repo = resourceRepository || container.getResourceRepository();
    DeleteResource.instance = new DeleteResource(repo);
    return DeleteResource.instance;
  }

  static getInstance(): DeleteResource {
    if (!DeleteResource.instance) {
      DeleteResource.instance = DeleteResource.createInstance();
    }
    return DeleteResource.instance;
  }

  static resetInstance(): void {
    DeleteResource.instance = undefined as unknown as DeleteResource;
  }

  async execute(input: DeleteResourceInput): Promise<void> {
    const resource = await this.resourceRepository.findById(input.uuid);
    if (!resource) {
      throw new Error(`Resource not found: ${input.uuid}`);
    }

    resource.delete();
    await this.resourceRepository.save(resource);
  }
}

export const deleteResource = (input: DeleteResourceInput): Promise<void> =>
  DeleteResource.getInstance().execute(input);
