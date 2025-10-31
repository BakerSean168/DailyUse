/**
 * Repository 聚合根实现
 * 实现 RepositoryServer 接口
 */

import { RepositoryContracts } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { RepositoryConfig } from '../value-objects/RepositoryConfig';
import { RepositoryStats } from '../value-objects/RepositoryStats';
import { SyncStatus } from '../value-objects/SyncStatus';
import { GitInfo } from '../value-objects/GitInfo';
import { Resource } from '../entities/Resource';
import { RepositoryExplorerEntity } from '../entities/RepositoryExplorer';

type IRepositoryServer = RepositoryContracts.RepositoryServer;
type RepositoryServerDTO = RepositoryContracts.RepositoryServerDTO;
type RepositoryPersistenceDTO = RepositoryContracts.RepositoryPersistenceDTO;
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type ResourceType = RepositoryContracts.ResourceType;

/**
 * Repository 聚合根
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class Repository extends AggregateRoot implements IRepositoryServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _type: RepositoryType;
  private _path: string;
  private _description: string | null;
  private _config: RepositoryConfig;
  private _relatedGoals: string[] | null;
  private _status: RepositoryStatus;
  private _git: GitInfo | null;
  private _syncStatus: SyncStatus | null;
  private _stats: RepositoryStats;
  private _lastAccessedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _resources: Resource[];
  private _explorer: RepositoryExplorerEntity | null;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string | null;
    config: RepositoryConfig;
    relatedGoals?: string[] | null;
    status: RepositoryStatus;
    git?: GitInfo | null;
    syncStatus?: SyncStatus | null;
    stats: RepositoryStats;
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
  public get config(): RepositoryContracts.RepositoryConfigServer {
    return this._config;
  }
  public get relatedGoals(): string[] | null {
    return this._relatedGoals ? [...this._relatedGoals] : null;
  }
  public get status(): RepositoryStatus {
    return this._status;
  }
  public get git(): RepositoryContracts.GitInfoServer | null {
    return this._git;
  }
  public get syncStatus(): RepositoryContracts.SyncStatusServer | null {
    return this._syncStatus;
  }
  public get stats(): RepositoryContracts.RepositoryStatsServer {
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

  public get resources(): Resource[] | null {
    return this._resources.length > 0 ? [...this._resources] : null;
  }

  public get explorer(): RepositoryExplorerEntity | null {
    return this._explorer;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 Repository 聚合根
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfig>;
    initializeGit?: boolean;
  }): Repository {
    const uuid = crypto.randomUUID();
    const now = Date.now();

    // 创建默认配置
    const config = params.config
      ? RepositoryConfig.fromContract({
          ...RepositoryConfig.createDefault().toContract(),
          ...params.config,
        })
      : RepositoryConfig.createDefault();

    // 创建空统计
    const stats = RepositoryStats.createEmpty();

    const repository = new Repository({
      uuid,
      accountUuid: params.accountUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      description: params.description,
      config,
      status: RepositoryContracts.RepositoryStatus.ACTIVE,
      git: params.initializeGit ? GitInfo.createInitializedGit({}) : null,
      stats,
      createdAt: now,
      updatedAt: now,
    });

    // 发布创建事件
    repository.addDomainEvent({
      eventType: 'RepositoryCreated',
      aggregateId: uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: {
        repositoryUuid: uuid,
        repositoryName: params.name,
        repositoryType: params.type,
        path: params.path,
        initializeGit: params.initializeGit ?? false,
      },
    });

    return repository;
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
  }): Resource {
    const resource = Resource.create({
      repositoryUuid: this._uuid,
      ...params,
    });
    return resource;
  }

  /**
   * 创建子实体：RepositoryExplorer
   */
  public createExplorer(params: {
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerEntity {
    const explorer = RepositoryExplorerEntity.create({
      repositoryUuid: this._uuid,
      accountUuid: this._accountUuid,
      ...params,
    });
    return explorer;
  }

  // ===== 子实体管理方法 =====

  public addResource(resource: Resource): void {
    if (!(resource instanceof Resource)) {
      throw new Error('Resource must be an instance of ResourceEntity');
    }
    this._resources.push(resource);
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ResourceAdded',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        resourceUuid: resource.uuid,
        resourceType: resource.type,
        resourceName: resource.name,
      },
    });
  }

  public removeResource(resourceUuid: string): Resource | null {
    const index = this._resources.findIndex((r) => r.uuid === resourceUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._resources.splice(index, 1)[0];
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'ResourceRemoved',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        resourceUuid: removed.uuid,
        resourceType: removed.type,
        resourceName: removed.name,
      },
    });

    return removed;
  }

  public getResource(uuid: string): Resource | null {
    return this._resources.find((r) => r.uuid === uuid) ?? null;
  }

  public getAllResources(): Resource[] {
    return [...this._resources];
  }

  public getResourcesByType(type: ResourceType): Resource[] {
    return this._resources.filter((r) => r.type === type);
  }

  public setExplorer(explorer: RepositoryExplorerEntity): void {
    if (!(explorer instanceof RepositoryExplorerEntity)) {
      throw new Error('Explorer must be an instance of RepositoryExplorerEntity');
    }
    this._explorer = explorer;
    this._updatedAt = Date.now();
  }

  public getExplorer(): RepositoryExplorerEntity | null {
    return this._explorer;
  }

  // ===== 业务方法 =====

  public updateConfig(config: Partial<RepositoryContracts.RepositoryConfig>): void {
    const oldConfig = this._config;
    this._config = this._config.with(config);
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryConfigUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        oldConfig: oldConfig.toContract(),
        newConfig: this._config.toContract(),
        changes: config,
      },
    });
  }

  public async enableGit(remoteUrl?: string): Promise<void> {
    this._git = GitInfo.createInitializedGit({
      currentBranch: 'main',
      remoteUrl: remoteUrl,
    });
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'GitEnabled',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        remoteUrl: remoteUrl ?? null,
        currentBranch: 'main',
      },
    });
  }

  public disableGit(): void {
    const wasEnabled = this._git?.isGitRepo ?? false;
    this._git = null;
    this._updatedAt = Date.now();

    // 发布领域事件
    if (wasEnabled) {
      this.addDomainEvent({
        eventType: 'GitDisabled',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        accountUuid: this._accountUuid,
        payload: {
          repositoryUuid: this._uuid,
        },
      });
    }
  }

  public async startSync(type: 'pull' | 'push' | 'both', force = false): Promise<void> {
    if (!this._git?.isGitRepo) {
      throw new Error('Git is not enabled for this repository');
    }

    this._syncStatus = SyncStatus.createSyncing();
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'SyncStarted',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        syncType: type,
        force,
      },
    });

    // TODO: 实际的同步逻辑由基础设施层处理
  }

  public stopSync(): void {
    if (this._syncStatus) {
      this._syncStatus = this._syncStatus.with({ isSyncing: false });
      this._updatedAt = Date.now();

      // 发布领域事件
      this.addDomainEvent({
        eventType: 'SyncStopped',
        aggregateId: this._uuid,
        occurredOn: new Date(),
        accountUuid: this._accountUuid,
        payload: {
          repositoryUuid: this._uuid,
        },
      });
    }
  }

  public async resolveSyncConflict(
    conflictPath: string,
    resolution: 'local' | 'remote',
  ): Promise<void> {
    // TODO: 实现冲突解决逻辑
    this._updatedAt = Date.now();
  }

  public async updateStats(): Promise<void> {
    // TODO: 重新计算统计信息
    this._stats = this._stats.with({
      totalResources: this._resources.length,
      lastUpdated: Date.now(),
    });
    this._updatedAt = Date.now();
  }

  public incrementResourceCount(type: ResourceType): void {
    const byType = { ...this._stats.resourcesByType };
    byType[type] = (byType[type] || 0) + 1;

    this._stats = this._stats.with({
      totalResources: this._stats.totalResources + 1,
      resourcesByType: byType,
      lastUpdated: Date.now(),
    });
    this._updatedAt = Date.now();
  }

  public decrementResourceCount(type: ResourceType): void {
    const byType = { ...this._stats.resourcesByType };
    byType[type] = Math.max((byType[type] || 0) - 1, 0);

    this._stats = this._stats.with({
      totalResources: Math.max(this._stats.totalResources - 1, 0),
      resourcesByType: byType,
      lastUpdated: Date.now(),
    });
    this._updatedAt = Date.now();
  }

  public archive(): void {
    this._status = RepositoryContracts.RepositoryStatus.ARCHIVED;
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryArchived',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        repositoryName: this._name,
      },
    });
  }

  public activate(): void {
    this._status = RepositoryContracts.RepositoryStatus.ACTIVE;
    this._updatedAt = Date.now();

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'RepositoryActivated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        repositoryUuid: this._uuid,
        repositoryName: this._name,
      },
    });
  }

  public markAsAccessed(): void {
    this._lastAccessedAt = Date.now();
  }

  public addRelatedGoal(goalUuid: string): void {
    if (!this._relatedGoals) {
      this._relatedGoals = [];
    }
    if (!this._relatedGoals.includes(goalUuid)) {
      this._relatedGoals.push(goalUuid);
      this._updatedAt = Date.now();
    }
  }

  public removeRelatedGoal(goalUuid: string): void {
    if (this._relatedGoals) {
      const index = this._relatedGoals.indexOf(goalUuid);
      if (index !== -1) {
        this._relatedGoals.splice(index, 1);
        this._updatedAt = Date.now();
      }
    }
  }

  // ===== 转换方法 =====

  public toServerDTO(includeChildren = false): RepositoryServerDTO {
    const dto: RepositoryServerDTO = {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toContract(),
      relatedGoals: this._relatedGoals,
      status: this._status,
      git: this._git?.toContract() ?? null,
      syncStatus: this._syncStatus?.toContract() ?? null,
      stats: this._stats.toContract(),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };

    if (includeChildren) {
      dto.resources =
        this._resources.length > 0 ? this._resources.map((r) => r.toServerDTO(true)) : null;
      dto.explorer = this._explorer?.toServerDTO() ?? null;
    }

    return dto;
  }

  public toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: JSON.stringify(this._config.toContract()),
      relatedGoals: this._relatedGoals ? JSON.stringify(this._relatedGoals) : null,
      status: this._status,
      git: this._git ? JSON.stringify(this._git.toContract()) : null,
      syncStatus: this._syncStatus ? JSON.stringify(this._syncStatus.toContract()) : null,
      stats: JSON.stringify(this._stats.toContract()),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public static fromServerDTO(dto: RepositoryServerDTO): Repository {
    const repository = new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: RepositoryConfig.fromContract(dto.config),
      relatedGoals: dto.relatedGoals,
      status: dto.status,
      git: dto.git ? GitInfo.fromContract(dto.git) : null,
      syncStatus: dto.syncStatus ? SyncStatus.fromContract(dto.syncStatus) : null,
      stats: RepositoryStats.fromContract(dto.stats),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    if (dto.resources) {
      repository._resources = dto.resources.map((resDto) => Resource.fromServerDTO(resDto));
    }

    if (dto.explorer) {
      repository._explorer = RepositoryExplorerEntity.fromServerDTO(dto.explorer);
    }

    return repository;
  }

  public static fromPersistenceDTO(dto: RepositoryPersistenceDTO): Repository {
    return new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: RepositoryConfig.fromContract(JSON.parse(dto.config)),
      relatedGoals: dto.relatedGoals ? JSON.parse(dto.relatedGoals) : null,
      status: dto.status,
      git: dto.git ? GitInfo.fromContract(JSON.parse(dto.git)) : null,
      syncStatus: dto.syncStatus ? SyncStatus.fromContract(JSON.parse(dto.syncStatus)) : null,
      stats: RepositoryStats.fromContract(JSON.parse(dto.stats)),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public toClientDTO(includeChildren = false): RepositoryContracts.RepositoryClientDTO {
    const formatDate = (ts: number | null | undefined) => {
      if (!ts) return '';
      return new Date(ts).toLocaleString();
    };

    const clientDTO: RepositoryContracts.RepositoryClientDTO = {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toClientDTO(),
      relatedGoals: this._relatedGoals,
      status: this._status,
      git: this._git?.toClientDTO() ?? null,
      syncStatus: this._syncStatus?.toClientDTO() ?? null,
      stats: this._stats.toClientDTO(),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,

      // UI 格式化属性
      formattedLastAccessed: formatDate(this._lastAccessedAt),
      formattedCreatedAt: formatDate(this._createdAt),
      formattedUpdatedAt: formatDate(this._updatedAt),
      displayPath: this._path, // 可根据需要简化
      statusLabel: this._status === RepositoryContracts.RepositoryStatus.ACTIVE ? '活跃' : '归档',
      typeLabel: this._type === RepositoryContracts.RepositoryType.LOCAL ? '本地' : '远程',
    };

    if (includeChildren) {
      clientDTO.resources =
        this._resources.length > 0 ? this._resources.map((r) => r.toClientDTO(true)) : null;
      clientDTO.explorer = this._explorer?.toClientDTO() ?? null;
    }

    return clientDTO;
  }
}
