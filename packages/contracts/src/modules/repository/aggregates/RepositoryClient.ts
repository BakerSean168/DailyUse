/**
 * Repository Aggregate Root - Client Interface
 * 仓储聚合根 - 客户端接口
 */

import type { RepositoryType, RepositoryStatus, ResourceType } from '../enums';
import type { RepositoryServerDTO } from './RepositoryServer';
import type { ResourceClient, ResourceClientDTO } from '../entities/ResourceClient';
import type {
  RepositoryExplorerClient,
  RepositoryExplorerClientDTO,
} from '../entities/RepositoryExplorerClient';

// 从值对象导入类型
import type {
  RepositoryConfigClient,
  RepositoryConfigServerDTO,
  RepositoryConfigClientDTO,
  RepositoryStatsClient,
  RepositoryStatsServerDTO,
  RepositoryStatsClientDTO,
  SyncStatusClient,
  SyncStatusServerDTO,
  SyncStatusClientDTO,
  GitInfoClient,
  GitInfoServerDTO,
  GitInfoClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * Repository Client DTO
 */
export interface RepositoryClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;
  config: RepositoryConfigClientDTO;
  relatedGoals?: string[] | null;
  status: RepositoryStatus;
  git?: GitInfoClientDTO | null;
  syncStatus?: SyncStatusClientDTO | null;
  stats: RepositoryStatsClientDTO;
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化属性
  formattedLastAccessed?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displayPath: string;
  statusLabel: string;
  typeLabel: string;

  // ===== 子实体 DTO (聚合根包含子实体) =====
  resources?: ResourceClientDTO[] | null; // 资源列表（可选加载）
  explorer?: RepositoryExplorerClientDTO | null; // 浏览器配置（可选加载）
}

// ============ 实体接口 ============

/**
 * Repository 聚合根 - Client 接口（实例方法）
 */
export interface RepositoryClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string | null;

  // 配置
  config: RepositoryConfigClient;
  relatedGoals?: string[] | null;

  // 状态
  status: RepositoryStatus;
  git?: GitInfoClient | null;
  syncStatus?: SyncStatusClient | null;
  stats: RepositoryStatsClient;

  // 时间戳
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 属性
  formattedLastAccessed?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  displayPath: string;
  statusLabel: string;
  typeLabel: string;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 资源列表（懒加载，可选）
   * 通过聚合根统一访问和管理子实体
   */
  resources?: ResourceClient[] | null;

  /**
   * 浏览器配置（单例，可选）
   */
  explorer?: RepositoryExplorerClient | null;

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
  }): ResourceClient;

  /**
   * 创建子实体：RepositoryExplorer（通过聚合根创建）
   * @param params 浏览器创建参数
   * @returns 新的 RepositoryExplorer 实例
   */
  createExplorer(params: {
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerClient;

  // ===== 子实体管理方法 =====

  /**
   * 添加资源到聚合根
   */
  addResource(resource: ResourceClient): void;

  /**
   * 从聚合根移除资源
   */
  removeResource(resourceUuid: string): ResourceClient | null;

  /**
   * 通过 UUID 获取资源
   */
  getResource(uuid: string): ResourceClient | null;

  /**
   * 获取所有资源
   */
  getAllResources(): ResourceClient[];

  /**
   * 获取指定类型的资源
   */
  getResourcesByType(type: ResourceType): ResourceClient[];

  /**
   * 设置浏览器配置
   */
  setExplorer(explorer: RepositoryExplorerClient): void;

  /**
   * 获取浏览器配置
   */
  getExplorer(): RepositoryExplorerClient | null;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): RepositoryServerDTO;

  /**
   * 转换为 Client DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): RepositoryClientDTO;
}

/**
 * Repository 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface RepositoryClientStatic {
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
    config?: Partial<RepositoryConfigClientDTO>;
    initializeGit?: boolean;
  }): RepositoryClient;

  /**
   * 创建用于创建表单的空 Repository 实例
   */
  forCreate(accountUuid: string): RepositoryClient;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: RepositoryServerDTO): RepositoryClient;

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  fromClientDTO(dto: RepositoryClientDTO): RepositoryClient;
}

/**
 * Repository 实例方法接口（扩展，包含 clone）
 */
export interface RepositoryClientInstance extends RepositoryClient {
  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): RepositoryClient;
}
