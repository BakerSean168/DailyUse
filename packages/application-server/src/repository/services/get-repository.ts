/**
 * Get Repository
 *
 * 获取仓储详情
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Get Repository Input
 */
export interface GetRepositoryInput {
  uuid: string;
}

/**
 * Get Repository Output
 */
export interface GetRepositoryOutput {
  repository: RepositoryClientDTO | null;
}

/**
 * Get Repository
 */
export class GetRepository {
  private static instance: GetRepository;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): GetRepository {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    GetRepository.instance = new GetRepository(repo);
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

  async execute(input: GetRepositoryInput): Promise<GetRepositoryOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    return { repository: repository ? repository.toClientDTO() : null };
  }
}

export const getRepository = (input: GetRepositoryInput): Promise<GetRepositoryOutput> =>
  GetRepository.getInstance().execute(input);
