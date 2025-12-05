/**
 * Archive Repository
 *
 * 归档仓储
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Archive Repository Input
 */
export interface ArchiveRepositoryInput {
  uuid: string;
}

/**
 * Archive Repository Output
 */
export interface ArchiveRepositoryOutput {
  repository: RepositoryClientDTO;
}

/**
 * Archive Repository
 */
export class ArchiveRepository {
  private static instance: ArchiveRepository;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): ArchiveRepository {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    ArchiveRepository.instance = new ArchiveRepository(repo);
    return ArchiveRepository.instance;
  }

  static getInstance(): ArchiveRepository {
    if (!ArchiveRepository.instance) {
      ArchiveRepository.instance = ArchiveRepository.createInstance();
    }
    return ArchiveRepository.instance;
  }

  static resetInstance(): void {
    ArchiveRepository.instance = undefined as unknown as ArchiveRepository;
  }

  async execute(input: ArchiveRepositoryInput): Promise<ArchiveRepositoryOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.archive();
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

export const archiveRepository = (
  input: ArchiveRepositoryInput,
): Promise<ArchiveRepositoryOutput> => ArchiveRepository.getInstance().execute(input);
