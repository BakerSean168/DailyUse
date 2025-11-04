/**
 * Repository Domain Module Exports
 * 仓储领域模块导出
 * Repository Domain Module Exports
 * 仓储领域模块导出
 */

// Aggregates
// Aggregates
export { Repository } from './aggregates/Repository';
export { RepositoryStatistics } from './aggregates/RepositoryStatistics';

// Entities
// Entities
export { Resource } from './entities/Resource';
export { LinkedContent } from './entities/LinkedContent';
export { ResourceReference } from './entities/ResourceReference';
export { LinkedContent } from './entities/LinkedContent';
export { ResourceReference } from './entities/ResourceReference';
export { RepositoryExplorerEntity } from './entities/RepositoryExplorer';

// Domain Services

// Domain Services
export { RepositoryDomainService } from './services/RepositoryDomainService';
export { RepositoryStatisticsDomainService } from './services/RepositoryStatisticsDomainService';

// Re-export contracts types for convenience
// Re-export contracts types for convenience
export type {
  RepositoryContracts,
} from '@dailyuse/contracts';

// Type aliases for convenience
import type { RepositoryContracts as RC } from '@dailyuse/contracts';
export type RepositoryServerDTO = RC.RepositoryServerDTO;
export type RepositoryPersistenceDTO = RC.RepositoryPersistenceDTO;
export type RepositoryClientDTO = RC.RepositoryClientDTO;
export type RepositoryType = RC.RepositoryType;
export type RepositoryStatus = RC.RepositoryStatus;
export type RepositoryConfigServerDTO = RC.RepositoryConfigServerDTO;
export type RepositoryStatsServerDTO = RC.RepositoryStatsServerDTO;
export type SyncStatusServerDTO = RC.SyncStatusServerDTO;
export type GitInfoServerDTO = RC.GitInfoServerDTO;
export type ResourceServerDTO = RC.ResourceServerDTO;
export type ResourcePersistenceDTO = RC.ResourcePersistenceDTO;
export type ResourceClientDTO = RC.ResourceClientDTO;
export type ResourceType = RC.ResourceType;
export type ResourceStatus = RC.ResourceStatus;
export type ResourceMetadata = RC.ResourceMetadata;

export { ResourceType as ResourceTypeEnum, ResourceStatus as ResourceStatusEnum } from '@dailyuse/contracts';
