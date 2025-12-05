/**
 * List Repositories
 *
 * 获取仓库列表用例
 */

import type { IRepositoryApiClient } from '@dailyuse/infrastructure-client';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-client';

/**
 * List Repositories
 */
export class ListRepositories {
  private static instance: ListRepositories;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): ListRepositories {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    ListRepositories.instance = new ListRepositories(client);
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

  async execute(): Promise<RepositoryClientDTO[]> {
    return this.apiClient.getRepositories();
  }
}

export const listRepositories = (): Promise<RepositoryClientDTO[]> =>
  ListRepositories.getInstance().execute();
