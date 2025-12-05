/**
 * Get Repository
 *
 * 获取仓库详情用例
 */

import type { IRepositoryApiClient } from '@dailyuse/infrastructure-client';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-client';

/**
 * Get Repository
 */
export class GetRepository {
  private static instance: GetRepository;

  private constructor(private readonly apiClient: IRepositoryApiClient) {}

  static createInstance(apiClient?: IRepositoryApiClient): GetRepository {
    const container = RepositoryContainer.getInstance();
    const client = apiClient || container.getApiClient();
    GetRepository.instance = new GetRepository(client);
    return GetRepository.instance;
  }

  static getInstance(): GetRepository {
    if (!GetRepository.instance) {
      GetRepository.instance = GetRepository.createInstance();
    }
    return GetRepository.instance;
  }

  static resetInstance(): void {
    GetRepository.instance = undefined as unknown as GetRepository;
  }

  async execute(uuid: string): Promise<RepositoryClientDTO> {
    return this.apiClient.getRepositoryById(uuid);
  }
}

export const getRepository = (uuid: string): Promise<RepositoryClientDTO> =>
  GetRepository.getInstance().execute(uuid);
