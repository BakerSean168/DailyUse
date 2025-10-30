/**
 * Repository 聚合根实现 (Client)
 * 兼容 RepositoryClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryContracts as RC } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import {
  RepositoryConfigClient,
  GitInfoClient,
  SyncStatusClient,
  RepositoryStatsClient,
} from '../value-objects';
import { ResourceClient, RepositoryExplorerClient } from '../entities';

type IRepositoryClient = RepositoryContracts.RepositoryClient;
type RepositoryClientDTO = RepositoryContracts.RepositoryClientDTO;
type RepositoryServerDTO = RepositoryContracts.RepositoryServerDTO;
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type ResourceType = RepositoryContracts.ResourceType;

/**
 * Repository 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class Repository extends AggregateRoot implements IRepositoryClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _type: RepositoryType;
  private _path: string;
  private _description: string | null;
  private _config: RepositoryConfigClient;
  private _relatedGoals: string[] | null;
  private _status: RepositoryStatus;
  private _git: GitInfoClient | null;
  private _syncStatus: SyncStatusClient | null;
  private _stats: RepositoryStatsClient;
  private _lastAccessedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _resources: ResourceClient[];
  private _explorer: RepositoryExplorerClient | null;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string | null;
    config: RepositoryConfigClient;
    relatedGoals?: string[] | null;
    status: RepositoryStatus;
    git?: GitInfoClient | null;
    syncStatus?: SyncStatusClient | null;
    stats: RepositoryStatsClient;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description ?? null;
    this._config = params.config;
    this._relatedGoals = params.relatedGoals ?? null;
    this._status = params.status;
    this._git = params.git ?? null;
    this._syncStatus = params.syncStatus ?? null;
    this._stats = params.stats;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._resources = [];
    this._explorer = null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get type(): RepositoryType {
    return this._type;
  }
  public get path(): string {
    return this._path;
  }
  public get description(): string | null {
    return this._description;
  }
  public get config(): RepositoryConfigClient {
    return this._config;
  }
  public get relatedGoals(): string[] | null {
    return this._relatedGoals ? [...this._relatedGoals] : null;
  }
  public get status(): RepositoryStatus {
    return this._status;
  }
  public get git(): GitInfoClient | null {
    return this._git;
  }
  public get syncStatus(): SyncStatusClient | null {
    return this._syncStatus;
  }
  public get stats(): RepositoryStatsClient {
    return this._stats;
  }
  public get lastAccessedAt(): number | null {
    return this._lastAccessedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get resources(): ResourceClient[] | null {
    return this._resources.length > 0 ? [...this._resources] : null;
  }

  public get explorer(): RepositoryExplorerClient | null {
    return this._explorer;
  }

  // UI 属性
  public get formattedLastAccessed(): string | undefined {
    return this._lastAccessedAt ? this.formatRelativeTime(this._lastAccessedAt) : undefined;
  }

  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDate(this._updatedAt);
  }

  public get displayPath(): string {
    const parts = this._path.split(/[/\\]/);
    return parts.length > 2 ? `.../${parts.slice(-2).join('/')}` : this._path;
  }

  public get statusLabel(): string {
    const labels: Record<RepositoryStatus, string> = {
      [RC.RepositoryStatus.ACTIVE]: '活跃',
      [RC.RepositoryStatus.INACTIVE]: '未活跃',
      [RC.RepositoryStatus.ARCHIVED]: '归档',
      [RC.RepositoryStatus.SYNCING]: '同步中',
    };
    return labels[this._status] || this._status;
  }

  public get typeLabel(): string {
    const labels: Record<RepositoryType, string> = {
      [RC.RepositoryType.LOCAL]: '本地',
      [RC.RepositoryType.REMOTE]: '远程',
      [RC.RepositoryType.SYNCHRONIZED]: '同步',
    };
    return labels[this._type] || this._type;
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  }

  // ===== 工厂方法 =====

  /**
   * 创建一个空的 Repository 实例（用于新建表单）
   */
  public static forCreate(accountUuid: string): Repository {
    const now = Date.now();
    return new Repository({
      accountUuid,
      name: '',
      type: RC.RepositoryType.LOCAL,
      path: '',
      description: null,
      config: RepositoryConfigClient.createDefault(),
      status: RC.RepositoryStatus.ACTIVE,
      stats: RepositoryStatsClient.createDefault(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  public clone(): Repository {
    return Repository.fromClientDTO(this.toClientDTO(true));
  }

  /**
   * 创建新的 RepositoryClient 聚合根
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfigClientDTO>;
    initializeGit?: boolean;
  }): Repository {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    // 创建默认配置
    const config = RepositoryConfigClient.createDefault();

    // 创建空统计
    const stats = RepositoryStatsClient.createDefault();

    return new Repository({
      uuid,
      accountUuid: params.accountUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      description: params.description,
      config,
      status: RC.RepositoryStatus.ACTIVE,
      git: params.initializeGit
        ? new GitInfoClient({
            isGitRepo: true,
            currentBranch: 'main',
            hasChanges: false,
          })
        : null,
      stats,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建子实体：Resource
   */
  public createResource(params: {
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): ResourceClient {
    return ResourceClient.create({
      repositoryUuid: this._uuid,
      ...params,
    });
  }

  /**
   * 创建子实体：RepositoryExplorer
   */
  public createExplorer(params: {
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerClient {
    return RepositoryExplorerClient.create({
      repositoryUuid: this._uuid,
      accountUuid: this._accountUuid,
      ...params,
    });
  }

  // ===== 子实体管理方法 =====

  public addResource(resource: ResourceClient): void {
    if (!(resource instanceof ResourceClient)) {
      throw new Error('Resource must be an instance of ResourceClient');
    }
    this._resources.push(resource);
    this._updatedAt = Date.now();
  }

  public removeResource(resourceUuid: string): ResourceClient | null {
    const index = this._resources.findIndex((r) => r.uuid === resourceUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._resources.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getResource(uuid: string): ResourceClient | null {
    return this._resources.find((r) => r.uuid === uuid) ?? null;
  }

  public getAllResources(): ResourceClient[] {
    return [...this._resources];
  }

  public getResourcesByType(type: ResourceType): ResourceClient[] {
    return this._resources.filter((r) => r.type === type);
  }

  public setExplorer(explorer: RepositoryExplorerClient): void {
    if (!(explorer instanceof RepositoryExplorerClient)) {
      throw new Error('Explorer must be an instance of RepositoryExplorerClient');
    }
    this._explorer = explorer;
    this._updatedAt = Date.now();
  }

  public getExplorer(): RepositoryExplorerClient | null {
    return this._explorer;
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   */
  public toServerDTO(includeChildren: boolean = false): RepositoryServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toServerDTO(),
      relatedGoals: this._relatedGoals,
      status: this._status,
      git: this._git ? this._git.toServerDTO() : null,
      syncStatus: this._syncStatus ? this._syncStatus.toServerDTO() : null,
      stats: this._stats.toServerDTO(),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      resources: includeChildren ? this._resources.map((r) => r.toServerDTO(true)) : undefined,
      explorer: includeChildren && this._explorer ? this._explorer.toServerDTO() : undefined,
    };
  }

  /**
   * 转换为 Client DTO（递归转换子实体）
   */
  public toClientDTO(includeChildren: boolean = false): RepositoryClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toClientDTO(),
      relatedGoals: this._relatedGoals,
      status: this._status,
      git: this._git ? this._git.toClientDTO() : undefined,
      syncStatus: this._syncStatus ? this._syncStatus.toClientDTO() : undefined,
      stats: this._stats.toClientDTO(),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      formattedLastAccessed: this.formattedLastAccessed,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
      displayPath: this.displayPath,
      statusLabel: this.statusLabel,
      typeLabel: this.typeLabel,
      resources: includeChildren ? this._resources.map((r) => r.toClientDTO(true)) : undefined,
      explorer: includeChildren && this._explorer ? this._explorer.toClientDTO() : undefined,
    };
  }

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  public static fromServerDTO(dto: RepositoryServerDTO): Repository {
    const repository = new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: RepositoryConfigClient.fromServerDTO(dto.config),
      relatedGoals: dto.relatedGoals,
      status: dto.status,
      git: dto.git ? GitInfoClient.fromServerDTO(dto.git) : null,
      syncStatus: dto.syncStatus ? SyncStatusClient.fromServerDTO(dto.syncStatus) : null,
      stats: RepositoryStatsClient.fromServerDTO(dto.stats),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    if (dto.resources) {
      repository._resources = dto.resources.map((r) => ResourceClient.fromServerDTO(r));
    }
    if (dto.explorer) {
      repository._explorer = RepositoryExplorerClient.fromServerDTO(dto.explorer);
    }

    return repository;
  }

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  public static fromClientDTO(dto: RepositoryClientDTO): Repository {
    const repository = new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: RepositoryConfigClient.fromClientDTO(dto.config),
      relatedGoals: dto.relatedGoals,
      status: dto.status,
      git: dto.git ? GitInfoClient.fromClientDTO(dto.git) : null,
      syncStatus: dto.syncStatus ? SyncStatusClient.fromClientDTO(dto.syncStatus) : null,
      stats: RepositoryStatsClient.fromClientDTO(dto.stats),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    if (dto.resources) {
      repository._resources = dto.resources.map((r) => ResourceClient.fromClientDTO(r));
    }
    if (dto.explorer) {
      repository._explorer = RepositoryExplorerClient.fromClientDTO(dto.explorer);
    }

    return repository;
  }
}
