/**
 * Repository Domain Module Exports
 * 仓储领域模块导出
 */

// Aggregates
export { Repository, type CreateRepositoryDTO } from './aggregates/Repository';
export { RepositoryStatistics } from './aggregates/RepositoryStatistics';

// Entities
export { Resource, type CreateResourceDTO } from './entities/Resource';
export { LinkedContent } from './entities/LinkedContent';
export { ResourceReference } from './entities/ResourceReference';
export { RepositoryExplorerEntity } from './entities/RepositoryExplorer';

// Domain Services
export { RepositoryDomainService } from './services/RepositoryDomainService';
export { RepositoryStatisticsDomainService } from './services/RepositoryStatisticsDomainService';

// Re-export contracts types for convenience
export type {
  RepositoryServerDTO,
  RepositoryPersistenceDTO,
  RepositoryClientDTO,
  RepositoryType,
  RepositoryStatus,
  RepositoryConfigServerDTO,
  RepositoryStatsServerDTO,
  SyncStatusServerDTO,
  GitInfoServerDTO,
  ResourceServerDTO,
  ResourcePersistenceDTO,
  ResourceClientDTO,
  ResourceType,
  ResourceStatus,
  ResourceMetadata,
} from '@dailyuse/contracts';
