/**
 * Repository Aggregate Root
 * 仓储聚合根 - DDD 核心领域模型
 * 
 * 职责：
 * 1. 管理 Repository 生命周期
 * 2. 维护 Repository 业务规则
 * 3. 协调 Resource 实体
 * 4. 发布领域事件
 */

import { AggregateRoot } from '@dailyuse/utils';
import { RepositoryContracts } from '@dailyuse/contracts';
import {
  RepositoryType,
  RepositoryStatus,
  ResourceType,
  ResourceStatus,
} from '@dailyuse/contracts';
import { Resource } from '../entities/Resource';
import { RepositoryExplorerEntity } from '../entities/RepositoryExplorer';
import { RepositoryConfig } from '../value-objects/RepositoryConfig';
import { RepositoryStats } from '../value-objects/RepositoryStats';
import { GitInfo } from '../value-objects/GitInfo';
import { SyncStatus } from '../value-objects/SyncStatus';

// 类型别名（从命名空间导入）
type IRepositoryServer = RepositoryContracts.RepositoryServer;
type RepositoryServerDTO = RepositoryContracts.RepositoryServerDTO;
type RepositoryPersistenceDTO = RepositoryContracts.RepositoryPersistenceDTO;
type RepositoryClientDTO = RepositoryContracts.RepositoryClientDTO;
type RepositoryConfigServerDTO = RepositoryContracts.RepositoryConfigServerDTO;
type RepositoryStatsServerDTO = RepositoryContracts.RepositoryStatsServerDTO;
type SyncStatusServerDTO = RepositoryContracts.SyncStatusServerDTO;
type GitInfoServerDTO = RepositoryContracts.GitInfoServerDTO;
type ResourceServer = RepositoryContracts.ResourceServer;
type RepositoryExplorerServer = RepositoryContracts.RepositoryExplorerServer;

// ==================== Repository 聚合根 ====================

/**
 * Repository 聚合根
 */
export class Repository extends AggregateRoot implements IRepositoryServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _type: RepositoryType;
  private _path: string;
  private _description: string | null;
  private _config: RepositoryConfig; // Value Object
  private _relatedGoals: string[];
  private _status: RepositoryStatus;
  private _git: GitInfo | null; // Value Object
  private _syncStatus: SyncStatus | null; // Value Object
  private _stats: RepositoryStats; // Value Object
  private _lastAccessedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _resources: Resource[] = [];
  private _explorer: RepositoryExplorerEntity | null = null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string | null;
    config: RepositoryConfig; // Value Object 实例
    relatedGoals: string[];
    status: RepositoryStatus;
    git?: GitInfo | null; // Value Object 实例
    syncStatus?: SyncStatus | null; // Value Object 实例
    stats: RepositoryStats; // Value Object 实例
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description ?? null;
    this._config = params.config;
    this._relatedGoals = params.relatedGoals;
    this._status = params.status;
    this._git = params.git ?? null;
    this._syncStatus = params.syncStatus ?? null;
    this._stats = params.stats;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ==================== Getters ====================

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
    return this._config as any; // TODO: 实现完整的 Value Object
  }

  public get relatedGoals(): string[] | null {
    return this._relatedGoals.length > 0 ? [...this._relatedGoals] : null;
  }

  public get status(): RepositoryStatus {
    return this._status;
  }

  public get git(): RepositoryContracts.GitInfoServer | null {
    return this._git as any; // TODO: 实现完整的 Value Object
  }

  public get syncStatus(): RepositoryContracts.SyncStatusServer | null {
    return this._syncStatus as any; // TODO: 实现完整的 Value Object
  }

  public get stats(): RepositoryContracts.RepositoryStatsServer {
    return this._stats as any; // TODO: 实现完整的 Value Object
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

  // ==================== 工厂方法 ====================

  /**
   * 创建新的 Repository
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigServerDTO>;
    relatedGoals?: string[];
  }): Repository {
    const now = Date.now();

    // 默认配置 - 创建 Value Object
    const defaultConfig = new RepositoryConfig({
      enableGit: params.config?.enableGit ?? false,
      autoSync: params.config?.autoSync ?? false,
      syncInterval: params.config?.syncInterval ?? null,
      defaultLinkedDocName: params.config?.defaultLinkedDocName ?? 'README',
      supportedFileTypes: params.config?.supportedFileTypes ?? [
        ResourceType.MARKDOWN,
        ResourceType.IMAGE,
        ResourceType.VIDEO,
        ResourceType.AUDIO,
        ResourceType.PDF,
        ResourceType.LINK,
        ResourceType.CODE,
        ResourceType.OTHER,
      ],
      maxFileSize: params.config?.maxFileSize ?? 100 * 1024 * 1024, // 100 MB
      enableVersionControl: params.config?.enableVersionControl ?? true,
    });

    // 默认统计 - 创建 Value Object
    const defaultStats = new RepositoryStats({
      totalResources: 0,
      resourcesByType: {
        [ResourceType.MARKDOWN]: 0,
        [ResourceType.IMAGE]: 0,
        [ResourceType.VIDEO]: 0,
        [ResourceType.AUDIO]: 0,
        [ResourceType.PDF]: 0,
        [ResourceType.LINK]: 0,
        [ResourceType.CODE]: 0,
        [ResourceType.OTHER]: 0,
      },
      resourcesByStatus: {
        [ResourceStatus.ACTIVE]: 0,
        [ResourceStatus.ARCHIVED]: 0,
        [ResourceStatus.DELETED]: 0,
        [ResourceStatus.DRAFT]: 0,
      },
      totalSize: 0,
      recentActiveResources: 0,
      favoriteResources: 0,
      lastUpdated: now,
    });

    const repository = new Repository({
      accountUuid: params.accountUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      description: params.description || null,
      config: defaultConfig,
      relatedGoals: params.relatedGoals || [],
      status: RepositoryStatus.ACTIVE,
      git: null,
      syncStatus: null,
      stats: defaultStats,
      lastAccessedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // 触发领域事件
    repository.addDomainEvent({
      eventType: 'repository.created',
      aggregateId: repository.uuid,
      occurredOn: new Date(now),
      accountUuid: params.accountUuid,
      payload: {
        repository: repository.toServerDTO(),
        accountUuid: params.accountUuid,
      },
    });

    return repository;
  }

  /**
   * 从持久化数据创建仓库实例
   */
  public static fromPersistenceDTO(data: RepositoryPersistenceDTO): Repository {
    // 从 JSON string 解析为 DTO，然后创建 Value Object 实例
    const configDTO = JSON.parse(data.config) as RepositoryConfigServerDTO;
    const config = new RepositoryConfig(configDTO);

    const gitDTO = data.git ? (JSON.parse(data.git) as GitInfoServerDTO) : null;
    const git = gitDTO ? new GitInfo(gitDTO) : null;

    const syncStatusDTO = data.syncStatus ? (JSON.parse(data.syncStatus) as SyncStatusServerDTO) : null;
    const syncStatus = syncStatusDTO ? new SyncStatus(syncStatusDTO) : null;

    const statsDTO = JSON.parse(data.stats) as RepositoryStatsServerDTO;
    const stats = new RepositoryStats(statsDTO);

    return new Repository({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      type: data.type,
      path: data.path,
      description: data.description || null,
      config,
      relatedGoals: data.relatedGoals ? JSON.parse(data.relatedGoals) : [],
      status: data.status,
      git,
      syncStatus,
      stats,
      lastAccessedAt: data.lastAccessedAt || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // ==================== 业务方法 ====================

  /**
   * 更新仓库名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Repository name cannot be empty');
    }
    if (name.length > 200) {
      throw new Error('Repository name too long (max 200 characters)');
    }
    this._name = name.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 更新仓库路径
   */
  updatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('Repository path cannot be empty');
    }
    if (!path.startsWith('/')) {
      throw new Error('Repository path must start with /');
    }
    this._path = path.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 更新描述
   */
  updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<RepositoryConfigServerDTO>): void {
    // 使用 Value Object 的 with() 方法创建新实例
    this._config = this._config.with(config);
    this._updatedAt = Date.now();
  }

  /**
   * 添加关联目标
   */
  addRelatedGoal(goalUuid: string): void {
    if (!this._relatedGoals.includes(goalUuid)) {
      this._relatedGoals.push(goalUuid);
      this._updatedAt = Date.now();
    }
  }

  /**
   * 移除关联目标
   */
  removeRelatedGoal(goalUuid: string): void {
    const index = this._relatedGoals.indexOf(goalUuid);
    if (index !== -1) {
      this._relatedGoals.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  /**
   * 归档仓库
   */
  archive(): void {
    if (this._status === RepositoryStatus.ARCHIVED) {
      throw new Error('Repository is already archived');
    }
    this._status = RepositoryStatus.ARCHIVED;
    this._updatedAt = Date.now();
  }

  /**
   * 激活仓库
   */
  activate(): void {
    if (this._status === RepositoryStatus.ACTIVE) {
      throw new Error('Repository is already active');
    }
    this._status = RepositoryStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 停用仓库
   */
  deactivate(): void {
    if (this._status === RepositoryStatus.INACTIVE) {
      throw new Error('Repository is already inactive');
    }
    this._status = RepositoryStatus.INACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 更新统计信息（async 版本，符合接口）
   */
  async updateStats(): Promise<void> {
    // 统计信息将由 RepositoryStatisticsDomainService 计算和更新
    this._updatedAt = Date.now();
  }

  /**
   * 更新统计信息（同步版本 - 直接更新）
   */
  updateStatsSync(stats: Partial<RepositoryStatsServerDTO>): void {
    // 使用 Value Object 的 with() 方法
    this._stats = this._stats.with(stats);
    this._updatedAt = Date.now();
  }

  /**
   * 记录访问时间
   */
  recordAccess(): void {
    this._lastAccessedAt = Date.now();
  }

  /**
   * 标记为已访问（符合接口命名）
   */
  markAsAccessed(): void {
    this._lastAccessedAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 启用 Git（符合接口：接受 remoteUrl）
   */
  async enableGit(remoteUrl?: string): Promise<void> {
    // 创建 Value Object
    this._git = new GitInfo({
      isGitRepo: true,
      currentBranch: 'main',
      hasChanges: false,
      remoteUrl: remoteUrl || null,
    });
    // Value Object 不可变，需要创建新实例
    this._config = this._config.with({ enableGit: true });
    this._updatedAt = Date.now();
  }

  /**
   * 启用 Git（内部方法：接受 GitInfo 对象）
   */
  enableGitWithInfo(gitInfo: GitInfoServerDTO): void {
    // 从 DTO 创建 Value Object
    this._git = new GitInfo(gitInfo);
    this._config = this._config.with({ enableGit: true });
    this._updatedAt = Date.now();
  }

  /**
   * 禁用 Git
   */
  disableGit(): void {
    this._git = null;
    this._config = this._config.with({ enableGit: false });
    this._updatedAt = Date.now();
  }

  /**
   * 更新 Git 状态
   */
  updateGitStatus(gitInfo: GitInfoServerDTO): void {
    // 从 DTO 创建 Value Object
    this._git = new GitInfo(gitInfo);
    this._updatedAt = Date.now();
  }

  /**
   * 更新同步状态
   */
  updateSyncStatus(syncStatus: SyncStatusServerDTO): void {
    // 从 DTO 创建 Value Object
    this._syncStatus = new SyncStatus(syncStatus);
    this._updatedAt = Date.now();
  }

  /**
   * 开始同步
   */
  async startSync(type: 'pull' | 'push' | 'both', force: boolean = false): Promise<void> {
    if (!this._config.enableGit) {
      throw new Error('Git is not enabled for this repository');
    }
    if (this._syncStatus?.isSyncing) {
      throw new Error('Sync is already in progress');
    }

    const now = Date.now();
    // 创建新的 Value Object
    this._syncStatus = new SyncStatus({
      isSyncing: true,
      lastSyncAt: this._syncStatus?.lastSyncAt ?? null,
      syncError: null,
      pendingSyncCount: this._syncStatus?.pendingSyncCount ?? 0,
      conflictCount: this._syncStatus?.conflictCount ?? 0,
    });
    this._updatedAt = now;
  }

  /**
   * 停止同步
   */
  stopSync(): void {
    if (!this._syncStatus?.isSyncing) {
      throw new Error('No sync in progress');
    }

    // 使用 Value Object 的 with() 方法
    this._syncStatus = this._syncStatus.with({
      isSyncing: false,
      lastSyncAt: Date.now(),
    });
    this._updatedAt = Date.now();
  }

  /**
   * 解决同步冲突
   */
  async resolveSyncConflict(
    conflictPath: string,
    resolution: 'local' | 'remote',
  ): Promise<void> {
    if (!this._syncStatus?.isSyncing) {
      throw new Error('No sync in progress');
    }
    // 减少冲突计数 - 使用 with() 方法
    if (this._syncStatus.conflictCount > 0) {
      this._syncStatus = this._syncStatus.with({
        conflictCount: this._syncStatus.conflictCount - 1,
      });
    }
    this._updatedAt = Date.now();
  }

  /**
   * 增加资源计数
   */
  incrementResourceCount(type: ResourceType): void {
    // 创建更新后的 resourcesByType map
    const updatedByType = {
      ...this._stats.resourcesByType,
      [type]: (this._stats.resourcesByType[type] ?? 0) + 1,
    };

    // 使用 with() 创建新的 Value Object
    this._stats = this._stats.with({
      resourcesByType: updatedByType,
      totalResources: this._stats.totalResources + 1,
    });
    this._updatedAt = Date.now();
  }

  /**
   * 减少资源计数
   */
  decrementResourceCount(type: ResourceType): void {
    if (this._stats.resourcesByType[type]) {
      // 创建更新后的 resourcesByType map
      const updatedByType = {
        ...this._stats.resourcesByType,
        [type]: this._stats.resourcesByType[type] - 1,
      };

      // 使用 with() 创建新的 Value Object
      this._stats = this._stats.with({
        resourcesByType: updatedByType,
        totalResources: Math.max(0, this._stats.totalResources - 1),
      });
      this._updatedAt = Date.now();
    }
  }  // ==================== 子实体管理（聚合根统一管理） ====================

  /**
   * 创建资源（工厂方法）
   */
  createResource(params: {
    name: string;
    type: ResourceType;
    path: string;
    content?: string | Uint8Array;
    description?: string;
    tags?: string[];
  }): ResourceServer {
    // 计算 size（暂时使用估算值，实际应从文件系统获取）
    const size = params.content 
      ? (typeof params.content === 'string' ? params.content.length : params.content.byteLength)
      : 0;

    const resource = Resource.create({
      repositoryUuid: this.uuid,
      name: params.name,
      type: params.type,
      path: params.path,
      size,
      description: params.description,
      tags: params.tags,
    });

    this._resources.push(resource);
    this.incrementResourceCount(params.type);

    return resource;
  }

  /**
   * 创建浏览器配置（工厂方法）
   */
  createExplorer(params: {
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorerServer {
    if (this._explorer) {
      throw new Error('Repository explorer already exists');
    }

    const explorer = RepositoryExplorerEntity.create({
      repositoryUuid: this.uuid,
      accountUuid: this.accountUuid,
      name: params.name,
      description: params.description,
      currentPath: params.currentPath ?? this._path,
    });

    this._explorer = explorer;
    return explorer;
  }

  /**
   * 添加资源到聚合根
   */
  addResource(resource: ResourceServer): void {
    // 类型断言：确保是 Resource 实例
    const resourceEntity = resource as Resource;
    
    if (this._resources.find(r => r.uuid === resource.uuid)) {
      throw new Error(`Resource ${resource.uuid} already exists in this repository`);
    }

    this._resources.push(resourceEntity);
    this.incrementResourceCount(resource.type);
  }

  /**
   * 从聚合根移除资源
   */
  removeResource(resourceUuid: string): ResourceServer | null {
    const index = this._resources.findIndex(r => r.uuid === resourceUuid);
    if (index === -1) {
      return null;
    }

    const [removed] = this._resources.splice(index, 1);
    this.decrementResourceCount(removed.type);
    return removed;
  }

  /**
   * 通过 UUID 获取资源
   */
  getResource(uuid: string): ResourceServer | null {
    return this._resources.find(r => r.uuid === uuid) ?? null;
  }

  /**
   * 获取所有资源
   */
  getAllResources(): ResourceServer[] {
    return [...this._resources];
  }

  /**
   * 获取指定类型的资源
   */
  getResourcesByType(type: ResourceType): ResourceServer[] {
    return this._resources.filter(r => r.type === type);
  }

  /**
   * 设置浏览器配置
   */
  setExplorer(explorer: RepositoryExplorerServer): void {
    // 类型断言：确保是 RepositoryExplorerEntity 实例
    this._explorer = explorer as RepositoryExplorerEntity;
  }

  /**
   * 获取浏览器配置
   */
  getExplorer(): RepositoryExplorerServer | null {
    return this._explorer;
  }

  // ==================== DTO 转换 ====================

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): RepositoryServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this._name,
      type: this.type,
      path: this._path,
      description: this._description,
      config: this._config,
      relatedGoals: this._relatedGoals.length > 0 ? this._relatedGoals : null,
      status: this._status,
      git: this._git,
      syncStatus: this._syncStatus,
      stats: this._stats,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      resources: null, // 由 Repository 加载
      explorer: null, // 由 Repository 加载
    };
  }

  /**
   * 转换为 Client DTO
   * TODO: 完善所有 Client DTO 字段（formattedCreatedAt 等）
   */
  toClientDTO(): any {
    return {
      uuid: this.uuid,
      name: this._name,
      type: this.type,
      path: this._path,
      description: this._description,
      config: {
        enableGit: this._config.enableGit,
        autoSync: this._config.autoSync,
        supportedFileTypes: this._config.supportedFileTypes,
        syncIntervalFormatted: this._config.syncInterval
          ? `每 ${this._config.syncInterval / 60000} 分钟`
          : null,
        maxFileSizeFormatted: `${Math.round(this._config.maxFileSize / (1024 * 1024))} MB`,
      },
      relatedGoals: this._relatedGoals.length > 0 ? this._relatedGoals : null,
      status: this._status,
      git: this._git ? {
        ...this._git,
        branchIcon: '🌿',
        statusText: this._git.hasChanges ? 'Modified' : 'Clean',
        statusColor: this._git.hasChanges ? 'yellow' : 'green',
      } : null,
      syncStatus: this._syncStatus ? {
        ...this._syncStatus,
        syncStatusText: this._syncStatus.isSyncing ? 'Syncing...' : 'Synced',
        syncStatusColor: this._syncStatus.isSyncing ? 'blue' : 'green',
        hasPendingChanges: false,
        hasConflicts: false,
      } : null,
      stats: {
        totalResources: this._stats.totalResources,
        totalSize: this._stats.totalSize,
        totalSizeFormatted: this.formatFileSize(this._stats.totalSize),
        favoriteCount: this._stats.favoriteResources,
        recentCount: this._stats.recentActiveResources,
        resourcesByType: this._stats.resourcesByType,
      },
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      resources: null,
      explorer: null,
    };
  }

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * 转换为 Persistence DTO
   */
  toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      name: this._name,
      type: this.type,
      path: this._path,
      description: this._description,
      config: JSON.stringify(this._config),
      relatedGoals: this._relatedGoals.length > 0 ? JSON.stringify(this._relatedGoals) : null,
      status: this._status,
      git: this._git ? JSON.stringify(this._git) : null,
      syncStatus: this._syncStatus ? JSON.stringify(this._syncStatus) : null,
      stats: JSON.stringify(this._stats),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证仓库是否可以执行操作
   */
  canPerformOperation(): boolean {
    return this._status === RepositoryStatus.ACTIVE;
  }

  /**
   * 验证是否是所有者
   */
  isOwnedBy(accountUuid: string): boolean {
    return this.accountUuid === accountUuid;
  }
}
