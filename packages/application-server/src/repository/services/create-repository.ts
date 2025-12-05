/**
 * Create Repository
 *
 * 创建仓储
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';
import type {
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
} from '@dailyuse/contracts/repository';
import { RepositoryType } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Create Repository Input
 */
export interface CreateRepositoryInput {
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: Partial<RepositoryConfigServerDTO>;
}

/**
 * Create Repository Output
 */
export interface CreateRepositoryOutput {
  repository: RepositoryClientDTO;
}

/**
 * Create Repository
 */
export class CreateRepository {
  private static instance: CreateRepository;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): CreateRepository {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    CreateRepository.instance = new CreateRepository(repo);
    return CreateRepository.instance;
  }

  static getInstance(): CreateRepository {
    if (!CreateRepository.instance) {
      CreateRepository.instance = CreateRepository.createInstance();
    }
    return CreateRepository.instance;
  }

  static resetInstance(): void {
    CreateRepository.instance = undefined as unknown as CreateRepository;
  }

  async execute(input: CreateRepositoryInput): Promise<CreateRepositoryOutput> {
    const repository = Repository.create(input);
    await this.repositoryRepository.save(repository);
    return { repository: repository.toClientDTO() };
  }
}

export const createRepository = (input: CreateRepositoryInput): Promise<CreateRepositoryOutput> =>
  CreateRepository.getInstance().execute(input);
