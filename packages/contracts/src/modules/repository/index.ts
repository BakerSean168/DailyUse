/**
 * Repository Module - Explicit Exports
 * 仓库模块 - 显式导出
 */

// ============ Enums ============
export { RepositoryType, RepositoryStatus, ResourceType, ResourceStatus } from './enums';

// ============ Value Objects - Server ============
export type {
  RepositoryConfigServerDTO,
  RepositoryConfigServer,
  RepositoryConfigServerStatic,
} from './value-objects/RepositoryConfigServer';

export type {
  RepositoryStatsServerDTO,
  RepositoryStatsServer,
  RepositoryStatsServerStatic,
} from './value-objects/RepositoryStatsServer';

export type {
  FolderMetadataServerDTO,
  FolderMetadataServer,
  FolderMetadataServerStatic,
} from './value-objects/FolderMetadataServer';

export type {
  ResourceMetadataServerDTO,
  ResourceMetadataServer,
  ResourceMetadataServerStatic,
} from './value-objects/ResourceMetadataServer';

export type {
  ResourceStatsServerDTO,
  ResourceStatsServer,
  ResourceStatsServerStatic,
} from './value-objects/ResourceStatsServer';

// ============ Value Objects - Client ============
export type {
  RepositoryConfigClientDTO,
  RepositoryConfigClient,
  RepositoryConfigClientStatic,
} from './value-objects/RepositoryConfigClient';

export type {
  RepositoryStatsClientDTO,
  RepositoryStatsClient,
  RepositoryStatsClientStatic,
} from './value-objects/RepositoryStatsClient';

export type {
  FolderMetadataClientDTO,
  FolderMetadataClient,
  FolderMetadataClientStatic,
} from './value-objects/FolderMetadataClient';

export type {
  ResourceMetadataClientDTO,
  ResourceMetadataClient,
  ResourceMetadataClientStatic,
} from './value-objects/ResourceMetadataClient';

export type {
  ResourceStatsClientDTO,
  ResourceStatsClient,
  ResourceStatsClientStatic,
} from './value-objects/ResourceStatsClient';

// ============ Aggregates ============
export type {
  RepositoryServerDTO,
  RepositoryPersistenceDTO,
  RepositoryServer,
  RepositoryServerStatic,
} from './aggregates/RepositoryServer';

export type {
  RepositoryClientDTO,
  RepositoryClient,
  RepositoryClientStatic,
} from './aggregates/RepositoryClient';

// ============ Entities ============
export type {
  FolderServerDTO,
  FolderPersistenceDTO,
  FolderServer,
  FolderServerStatic,
} from './entities/FolderServer';

export type { FolderClientDTO, FolderClient, FolderClientStatic } from './entities/FolderClient';

export type {
  ResourceServerDTO,
  ResourcePersistenceDTO,
  ResourceServer,
  ResourceServerStatic,
} from './entities/ResourceServer';

export type {
  ResourceClientDTO,
  ResourceClient,
  ResourceClientStatic,
} from './entities/ResourceClient';

// ============ DTOs (File Tree - Story 11.1) ============
export type { TreeNodeType, TreeNode, FileTreeResponse } from '../../repository/TreeNode';

// ============ DTOs (Search - Story 11.2) ============
export type {
  SearchMode,
  SearchRequest,
  SearchMatch,
  MatchType,
  SearchResultItem,
  SearchResponse,
} from '../../repository/SearchContracts';

// ============ DTOs (Bookmark - Story 11.4) ============
export type {
  BookmarkTargetType,
  Bookmark,
  CreateBookmarkRequest,
  UpdateBookmarkRequest,
  BookmarkListResponse,
} from '../../repository/BookmarkContracts';

// ============ DTOs (Tags - Story 11.5) ============
export type { TagStatisticsDto, TagResourceReferenceDto } from '../../repository/TagsContracts';
