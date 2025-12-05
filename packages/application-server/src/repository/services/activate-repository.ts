/**
 * Activate Repository
 *
 * 激活仓储
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Activate Repository Input
 */
export interface ActivateRepositoryInput {
  uuid: string;
}

/**
 * Activate Repository Output
 */
export interface ActivateRepositoryOutput {
  repository: RepositoryClientDTO;
}

/**
 * Activate Repository
 */
export class ActivateRepository {
  private static instance: ActivateRepository;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): ActivateRepository {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    ActivateRepository.instance = new ActivateRepository(repo);
    return ActivateRepository.instance;
  }

  static getInstance(): ActivateRepository {
    if (!ActivateRepository.instance) {
      ActivateRepository.instance = ActivateRepository.createInstance();
    }
    return ActivateRepository.instance;
  }

  static resetInstance(): void {
    ActivateRepository.instance = undefined as unknown as ActivateRepository;
  }

  async execute(input: ActivateRepositoryInput): Promise<ActivateRepositoryOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.activate();
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

export const activateRepository = (
  input: ActivateRepositoryInput,
): Promise<ActivateRepositoryOutput> => ActivateRepository.getInstance().execute(input);
