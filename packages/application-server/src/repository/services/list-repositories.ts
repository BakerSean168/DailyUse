/**
 * List Repositories
 *
 * 获取用户的所有仓储
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import { Repository } from '@dailyuse/domain-server/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryStatus } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '../RepositoryContainer';

/**
 * List Repositories Input
 */
export interface ListRepositoriesInput {
  accountUuid: string;
  status?: RepositoryStatus;
}

/**
 * List Repositories Output
 */
export interface ListRepositoriesOutput {
  repositories: RepositoryClientDTO[];
}

/**
 * List Repositories
 */
export class ListRepositories {
  private static instance: ListRepositories;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): ListRepositories {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    ListRepositories.instance = new ListRepositories(repo);
    return ListRepositories.instance;
  }

  static getInstance(): ListRepositories {
    if (!ListRepositories.instance) {
      ListRepositories.instance = ListRepositories.createInstance();
    }
    return ListRepositories.instance;
  }

  static resetInstance(): void {
    ListRepositories.instance = undefined as unknown as ListRepositories;
  }

  async execute(input: ListRepositoriesInput): Promise<ListRepositoriesOutput> {
    let repositories: Repository[];

    if (input.status) {
      repositories = await this.repositoryRepository.findByAccountUuidAndStatus(
        input.accountUuid,
        input.status,
      );
    } else {
      repositories = await this.repositoryRepository.findByAccountUuid(input.accountUuid);
    }

    return { repositories: repositories.map((r) => r.toClientDTO()) };
  }
}

export const listRepositories = (input: ListRepositoriesInput): Promise<ListRepositoriesOutput> =>
  ListRepositories.getInstance().execute(input);
