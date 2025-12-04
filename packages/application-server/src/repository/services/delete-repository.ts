/**
 * Delete Repository
 *
 * 删除仓储
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { RepositoryContainer } from '../RepositoryContainer';

/**
 * Delete Repository Input
 */
export interface DeleteRepositoryInput {
  uuid: string;
}

/**
 * Delete Repository
 */
export class DeleteRepository {
  private static instance: DeleteRepository;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): DeleteRepository {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    DeleteRepository.instance = new DeleteRepository(repo);
    return DeleteRepository.instance;
  }

  static getInstance(): DeleteRepository {
    if (!DeleteRepository.instance) {
      DeleteRepository.instance = DeleteRepository.createInstance();
    }
    return DeleteRepository.instance;
  }

  static resetInstance(): void {
    DeleteRepository.instance = undefined as unknown as DeleteRepository;
  }

  async execute(input: DeleteRepositoryInput): Promise<void> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.delete();
    await this.repositoryRepository.save(repository);
  }
}

export const deleteRepository = (input: DeleteRepositoryInput): Promise<void> =>
  DeleteRepository.getInstance().execute(input);
