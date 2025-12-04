/**
 * Update Repository Config
 *
 * 更新仓储配置
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type {
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
} from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../RepositoryContainer';

/**
 * Update Repository Config Input
 */
export interface UpdateRepositoryConfigInput {
  uuid: string;
  config: Partial<RepositoryConfigServerDTO>;
}

/**
 * Update Repository Config Output
 */
export interface UpdateRepositoryConfigOutput {
  repository: RepositoryClientDTO;
}

/**
 * Update Repository Config
 */
export class UpdateRepositoryConfig {
  private static instance: UpdateRepositoryConfig;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): UpdateRepositoryConfig {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    UpdateRepositoryConfig.instance = new UpdateRepositoryConfig(repo);
    return UpdateRepositoryConfig.instance;
  }

  static getInstance(): UpdateRepositoryConfig {
    if (!UpdateRepositoryConfig.instance) {
      UpdateRepositoryConfig.instance = UpdateRepositoryConfig.createInstance();
    }
    return UpdateRepositoryConfig.instance;
  }

  static resetInstance(): void {
    UpdateRepositoryConfig.instance = undefined as unknown as UpdateRepositoryConfig;
  }

  async execute(input: UpdateRepositoryConfigInput): Promise<UpdateRepositoryConfigOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.updateConfig(input.config);
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

export const updateRepositoryConfig = (
  input: UpdateRepositoryConfigInput,
): Promise<UpdateRepositoryConfigOutput> => UpdateRepositoryConfig.getInstance().execute(input);
