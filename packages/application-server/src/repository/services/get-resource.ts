/**
 * Get Resource
 *
 * 获取资源详情
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../RepositoryContainer';

/**
 * Get Resource Input
 */
export interface GetResourceInput {
  uuid: string;
}

/**
 * Get Resource Output
 */
export interface GetResourceOutput {
  resource: ResourceClientDTO | null;
}

/**
 * Get Resource
 */
export class GetResource {
  private static instance: GetResource;

  private constructor(private readonly resourceRepository: IResourceRepository) {}

  static createInstance(resourceRepository?: IResourceRepository): GetResource {
    const container = RepositoryContainer.getInstance();
    const repo = resourceRepository || container.getResourceRepository();
    GetResource.instance = new GetResource(repo);
    return GetResource.instance;
  }

  static getInstance(): GetResource {
    if (!GetResource.instance) {
      GetResource.instance = GetResource.createInstance();
    }
    return GetResource.instance;
  }

  static resetInstance(): void {
    GetResource.instance = undefined as unknown as GetResource;
  }

  async execute(input: GetResourceInput): Promise<GetResourceOutput> {
    const resource = await this.resourceRepository.findById(input.uuid);
    return { resource: resource ? resource.toClientDTO() : null };
  }
}

export const getResource = (input: GetResourceInput): Promise<GetResourceOutput> =>
  GetResource.getInstance().execute(input);
