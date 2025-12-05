/**
 * Update Repository Stats
 *
 * 更新仓储统计
 */

import type { IRepositoryRepository } from '@dailyuse/domain-server/repository';
import type {
  RepositoryClientDTO,
  RepositoryStatsServerDTO,
} from '@dailyuse/contracts/repository';
import { RepositoryContainer } from '@dailyuse/infrastructure-server';

/**
 * Update Repository Stats Input
 */
export interface UpdateRepositoryStatsInput {
  uuid: string;
  stats: Partial<RepositoryStatsServerDTO>;
}

/**
 * Update Repository Stats Output
 */
export interface UpdateRepositoryStatsOutput {
  repository: RepositoryClientDTO;
}

/**
 * Update Repository Stats
 */
export class UpdateRepositoryStats {
  private static instance: UpdateRepositoryStats;

  private constructor(private readonly repositoryRepository: IRepositoryRepository) {}

  static createInstance(repositoryRepository?: IRepositoryRepository): UpdateRepositoryStats {
    const container = RepositoryContainer.getInstance();
    const repo = repositoryRepository || container.getRepositoryRepository();
    UpdateRepositoryStats.instance = new UpdateRepositoryStats(repo);
    return UpdateRepositoryStats.instance;
  }

  static getInstance(): UpdateRepositoryStats {
    if (!UpdateRepositoryStats.instance) {
      UpdateRepositoryStats.instance = UpdateRepositoryStats.createInstance();
    }
    return UpdateRepositoryStats.instance;
  }

  static resetInstance(): void {
    UpdateRepositoryStats.instance = undefined as unknown as UpdateRepositoryStats;
  }

  async execute(input: UpdateRepositoryStatsInput): Promise<UpdateRepositoryStatsOutput> {
    const repository = await this.repositoryRepository.findByUuid(input.uuid);
    if (!repository) {
      throw new Error(`Repository not found: ${input.uuid}`);
    }

    repository.updateStats(input.stats);
    await this.repositoryRepository.save(repository);

    return { repository: repository.toClientDTO() };
  }
}

export const updateRepositoryStats = (
  input: UpdateRepositoryStatsInput,
): Promise<UpdateRepositoryStatsOutput> => UpdateRepositoryStats.getInstance().execute(input);
