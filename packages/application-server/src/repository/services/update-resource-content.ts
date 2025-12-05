/**
 * Update Resource Content
 *
 * 更新 Markdown 内容
 */

import type { IResourceRepository } from '@dailyuse/domain-server/repository';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Update Resource Content Input
 */
export interface UpdateResourceContentInput {
  uuid: string;
  content: string;
}

/**
 * Update Resource Content Output
 */
export interface UpdateResourceContentOutput {
  resource: ResourceClientDTO;
}

/**
 * Update Resource Content
 */
export class UpdateResourceContent {
  private static instance: UpdateResourceContent;

  private constructor(private readonly resourceRepository: IResourceRepository) {}

  static createInstance(resourceRepository?: IResourceRepository): UpdateResourceContent {
    const container = RepositoryContainer.getInstance();
    const repo = resourceRepository || container.getResourceRepository();
    UpdateResourceContent.instance = new UpdateResourceContent(repo);
    return UpdateResourceContent.instance;
  }

  static getInstance(): UpdateResourceContent {
    if (!UpdateResourceContent.instance) {
      UpdateResourceContent.instance = UpdateResourceContent.createInstance();
    }
    return UpdateResourceContent.instance;
  }

  static resetInstance(): void {
    UpdateResourceContent.instance = undefined as unknown as UpdateResourceContent;
  }

  async execute(input: UpdateResourceContentInput): Promise<UpdateResourceContentOutput> {
    const resource = await this.resourceRepository.findById(input.uuid);
    if (!resource) {
      throw new Error(`Resource not found: ${input.uuid}`);
    }

    resource.updateMarkdownContent(input.content);
    await this.resourceRepository.save(resource);
    return { resource: resource.toClientDTO() };
  }
}

export const updateResourceContent = (
  input: UpdateResourceContentInput,
): Promise<UpdateResourceContentOutput> => UpdateResourceContent.getInstance().execute(input);
