/**
 * Repository Aggregate Root - Server Interface
 * 仓储聚合根 - 服务端接口
 */

import type { RepositoryType, RepositoryStatus, ResourceType } from '../enums';
import type { ResourceServer, ResourceServerDTO } from '../entities/ResourceServer';
import type {
  RepositoryExplorerServer,
  RepositoryExplorerServerDTO,
} from '../entities/RepositoryExplorerServer';

// 从值对象导入类型
import type { RepositoryClientDTO } from './RepositoryClient';
import type {
  RepositoryConfigServer,
  RepositoryConfigServerDTO,
  RepositoryStatsServer,
  RepositoryStatsServerDTO,
  SyncStatusServer,
  SyncStatusServerDTO,
  GitInfoServer,
  GitInfoServerDTO,
} from '../value-objects';

// ============ 类型别名（向后兼容，简化使用） ============

/**
 * 仓库配置类型别名
 * @deprecated 使用 RepositoryConfigServerDTO 代替
 */
export type RepositoryConfig = RepositoryConfigServerDTO;

/**
 * 仓库统计类型别名
 * @deprecated 使用 RepositoryStatsServerDTO 代替
 */
export type RepositoryStats = RepositoryStatsServerDTO;

/**
 * 同步状态类型别名
 * @deprecated 使用 SyncStatusServerDTO 代替
 */
export type SyncStatus = SyncStatusServerDTO;

/**
 * Git 信息类型别名
 * @deprecated 使用 GitInfoServerDTO 代替
 */
export type GitInfo = GitInfoServerDTO;

// ============ Git 状态信息（工具类型） ============

/**
 * Git状态信息（用于 Git 操作返回）
 */
export interface GitStatusInfo {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  conflicted: string[];
  isClean: boolean;
}

// ============ DTO 定义 ============

/**
 * Repository Server DTO
 */
export interface RepositoryServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfigServerDTO;
  relatedGoals?: string[] | null;
  status: RepositoryStatus;
  git?: GitInfoServerDTO | null;
  syncStatus?: SyncStatusServerDTO | null;
  stats: RepositoryStatsServerDTO;
  lastAccessedAt?: number | null; // epoch ms
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms

  // ===== 子实体 DTO (聚合根包含子实体) =====
  resources?: ResourceServerDTO[] | null; // 资源列表（可选加载）
  explorer?: RepositoryExplorerServerDTO | null; // 浏览器配置（可选加载）
}

/**
 * Repository Persistence DTO (数据库映射)
 */
/**
 * Repository Persistence DTO
 * 注意：使用 camelCase 命名
 */
export interface RepositoryPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: string; // JSON string
  relatedGoals?: string | null; // JSON string
  status: RepositoryStatus;
  git?: string | null; // JSON string
  syncStatus?: string | null; // JSON string
  stats: string; // JSON string
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // 注意：子实体在数据库中是独立表，通过外键关联
  // Persistence 层不包含子实体数据
}

// ============ 领域事件 ============

/**
 * 仓库创建事件
 */
export interface RepositoryCreatedEvent {
  type: 'repository.created';
  aggregateId: string; // repositoryUuid
  timestamp: number; // epoch ms
  payload: {
    repository: RepositoryServerDTO;
    initializeGit: boolean;
    createDefaultLinkedDoc: boolean;
  };
}

/**
 * 仓库更新事件
 */
export interface RepositoryUpdatedEvent {
  type: 'repository.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    repository: RepositoryServerDTO;
    previousData: Partial<RepositoryServerDTO>;
    changes: string[];
  };
}

/**
 * 仓库删除事件
 */
export interface RepositoryDeletedEvent {
  type: 'repository.deleted';
  aggregateId: string;
  timestamp: number;
  payload: {
    repositoryUuid: string;
    repositoryName: string;
    deleteFiles: boolean;
    resourceCount: number;
  };
}

/**
 * 仓库状态变更事件
 */
export interface RepositoryStatusChangedEvent {
  type: 'repository.status.changed';
  aggregateId: string;
  timestamp: number;
  payload: {
    previousStatus: RepositoryStatus;
    newStatus: RepositoryStatus;
    reason?: string;
  };
}

/**
 * 仓库同步开始事件
 */
export interface RepositorySyncStartedEvent {
  type: 'repository.sync.started';
  aggregateId: string;
  timestamp: number;
  payload: {
    syncType: 'pull' | 'push' | 'both';
    force: boolean;
  };
}

/**
 * 仓库同步完成事件
 */
export interface RepositorySyncCompletedEvent {
  type: 'repository.sync.completed';
  aggregateId: string;
  timestamp: number;
  payload: {
    syncType: 'pull' | 'push' | 'both';
    duration: number;
    filesChanged: number;
    conflicts: string[];
  };
}

/**
 * 仓库统计更新事件
 */
export interface RepositoryStatsUpdatedEvent {
  type: 'repository.stats.updated';
  aggregateId: string;
  timestamp: number;
  payload: {
    stats: RepositoryStatsServerDTO;
    previousStats: RepositoryStatsServerDTO;
  };
}

/**
 * Repository 领域事件联合类型
 */
export type RepositoryDomainEvent =
  | RepositoryCreatedEvent
  | RepositoryUpdatedEvent
  | RepositoryDeletedEvent
  | RepositoryStatusChangedEvent
  | RepositorySyncStartedEvent
  | RepositorySyncCompletedEvent
  | RepositoryStatsUpdatedEvent;

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Server 接口（实例方法）
 */
export interface RepositoryServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;

  // 配置
  config: RepositoryConfigServer;
  relatedGoals?: string[] | null;

  // 状态
  status: RepositoryStatus;
  git?: GitInfoServer | null;
  syncStatus?: SyncStatusServer | null;
  stats: RepositoryStatsServer;

  // 时间戳 (统一使用 number epoch ms)
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 资源列表（懒加载，可选）
   * 通过聚合根统一访问和管理子实体
   */
  resources?: ResourceServer[] | null;

  /**
   * 浏览器配置（单例，可选）
   */
  explorer?: RepositoryExplorerServer | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：Resource（通过聚合根创建）
   * @param params 资源创建参数
   * @returns 新的 Resource 实例
   */
  createResource(params: {
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): ResourceServer;

  /**
   * 创建子实体：RepositoryExplorer（通过聚合根创建）
   * @param params 浏览器创建参数
   * @returns 新的 RepositoryExplorer 实例
   */
  createExplorer(params: {
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加资源到聚合根
   */
  addResource(resource: ResourceServer): void;

  /**
   * 从聚合根移除资源
   */
  removeResource(resourceUuid: string): ResourceServer | null;

  /**
   * 通过 UUID 获取资源
   */
  getResource(uuid: string): ResourceServer | null;

  /**
   * 获取所有资源
   */
  getAllResources(): ResourceServer[];

  /**
   * 获取指定类型的资源
   */
  getResourcesByType(type: ResourceType): ResourceServer[];

  /**
   * 设置浏览器配置
   */
  setExplorer(explorer: RepositoryExplorerServer): void;

  /**
   * 获取浏览器配置
   */
  getExplorer(): RepositoryExplorerServer | null;

  // ===== 业务方法 =====

  // 配置管理
  updateConfig(config: Partial<RepositoryConfigServerDTO>): void;
  enableGit(remoteUrl?: string): Promise<void>;
  disableGit(): void;

  // 同步管理
  startSync(type: 'pull' | 'push' | 'both', force?: boolean): Promise<void>;
  stopSync(): void;
  resolveSyncConflict(conflictPath: string, resolution: 'local' | 'remote'): Promise<void>;

  // 统计更新
  updateStats(): Promise<void>;
  incrementResourceCount(type: ResourceType): void;
  decrementResourceCount(type: ResourceType): void;

  // 状态管理
  archive(): void;
  activate(): void;
  markAsAccessed(): void;

  // 关联管理
  addRelatedGoal(goalUuid: string): void;
  removeRelatedGoal(goalUuid: string): void;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): RepositoryServerDTO;

  /**
   * 转换为 Client DTO
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): RepositoryClientDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   * 注意：子实体在数据库中是独立表，不包含在 Persistence DTO 中
   */
  toPersistenceDTO(): RepositoryPersistenceDTO;
}

/**
 * Repository 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface RepositoryServerStatic {
  /**
   * 创建新的 Repository 聚合根（静态工厂方法）
   * @param params 创建参数
   * @returns 新的 Repository 实例
   */
  create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigServerDTO>;
    initializeGit?: boolean;
  }): RepositoryServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: RepositoryServerDTO): RepositoryServer;

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
  fromPersistenceDTO(dto: RepositoryPersistenceDTO): RepositoryServer;
}
