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

import { v4 as uuidv4 } from 'uuid';
import {
  RepositoryType,
  RepositoryStatus,
  ResourceType,
  ResourceStatus,
} from '@dailyuse/contracts';
import type {
  RepositoryServerDTO,
  RepositoryPersistenceDTO,
  RepositoryConfigServerDTO,
  RepositoryStatsServerDTO,
  SyncStatusServerDTO,
  GitInfoServerDTO,
  RepositoryClientDTO,
  ResourceServer,
  RepositoryExplorerServer,
} from '@dailyuse/contracts';
import { Resource } from '../entities/Resource';
import { RepositoryExplorerEntity } from '../entities/RepositoryExplorer';

// ==================== 创建 DTO ====================

export interface CreateRepositoryDTO {
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: Partial<RepositoryConfigServerDTO>;
  relatedGoals?: string[];
}

// ==================== Repository 聚合根 ====================

export class Repository {
  // ===== 子实体集合 =====
  private _resources: Resource[] = [];
  private _explorer: RepositoryExplorerEntity | null = null;

  private constructor(
    public readonly uuid: string,
    public readonly accountUuid: string,
    private _name: string,
    public readonly type: RepositoryType,
    private _path: string,
    private _description: string | null,
    private _config: RepositoryConfigServerDTO,
    private _relatedGoals: string[],
    private _status: RepositoryStatus,
    private _git: GitInfoServerDTO | null,
    private _syncStatus: SyncStatusServerDTO | null,
    private _stats: RepositoryStatsServerDTO,
    private _lastAccessedAt: number | null,
    public readonly createdAt: number,
    private _updatedAt: number,
  ) {}

  // ==================== Getters ====================

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get description(): string | null {
    return this._description;
  }

  get config(): RepositoryConfigServerDTO {
    return this._config;
  }

  get relatedGoals(): string[] {
    return [...this._relatedGoals];
  }

  get status(): RepositoryStatus {
    return this._status;
  }

  get git(): GitInfoServerDTO | null {
    return this._git;
  }

  get syncStatus(): SyncStatusServerDTO | null {
    return this._syncStatus;
  }

  get stats(): RepositoryStatsServerDTO {
    return this._stats;
  }

  get lastAccessedAt(): number | null {
    return this._lastAccessedAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ==================== 工厂方法 ====================

  /**
   * 创建新的 Repository
   */
  static create(dto: CreateRepositoryDTO): Repository {
    const now = Date.now();
    const uuid = uuidv4();

    // 默认配置
    const defaultConfig: RepositoryConfigServerDTO = {
      enableGit: false,
      autoSync: false,
      syncInterval: null,
      defaultLinkedDocName: 'README',
      supportedFileTypes: [
        ResourceType.MARKDOWN,
        ResourceType.IMAGE,
        ResourceType.VIDEO,
        ResourceType.AUDIO,
        ResourceType.PDF,
        ResourceType.LINK,
        ResourceType.CODE,
        ResourceType.OTHER,
      ],
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      enableVersionControl: true,
    };

    // 默认统计
    const defaultStats: RepositoryStatsServerDTO = {
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
    };

    return new Repository(
      uuid,
      dto.accountUuid,
      dto.name,
      dto.type,
      dto.path,
      dto.description || null,
      { ...defaultConfig, ...dto.config },
      dto.relatedGoals || [],
      RepositoryStatus.ACTIVE,
      null, // git
      null, // syncStatus
      defaultStats,
      null, // lastAccessedAt
      now, // createdAt
      now, // updatedAt
    );
  }

  /**
   * 从持久化数据创建仓库实例
   */
  static fromPersistenceDTO(data: RepositoryPersistenceDTO): Repository {
    return new Repository(
      data.uuid,
      data.accountUuid,
      data.name,
      data.type,
      data.path,
      data.description || null,
      JSON.parse(data.config) as RepositoryConfigServerDTO,
      data.relatedGoals ? JSON.parse(data.relatedGoals) : [],
      data.status,
      data.git ? (JSON.parse(data.git) as GitInfoServerDTO) : null,
      data.syncStatus ? (JSON.parse(data.syncStatus) as SyncStatusServerDTO) : null,
      JSON.parse(data.stats) as RepositoryStatsServerDTO,
      data.lastAccessedAt || null,
      data.createdAt,
      data.updatedAt,
    );
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
    this._config = { ...this._config, ...config };
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
   * 更新统计信息（同步版本 - 直接更新）
   */
  updateStats(stats: Partial<RepositoryStatsServerDTO>): void {
    this._stats = { ...this._stats, ...stats };
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
   * 启用 Git
   */
  enableGit(gitInfo: GitInfoServerDTO): void {
    this._git = gitInfo;
    this._config.enableGit = true;
    this._updatedAt = Date.now();
  }

  /**
   * 禁用 Git
   */
  disableGit(): void {
    this._git = null;
    this._config.enableGit = false;
    this._updatedAt = Date.now();
  }

  /**
   * 更新 Git 状态
   */
  updateGitStatus(gitInfo: GitInfoServerDTO): void {
    this._git = gitInfo;
    this._updatedAt = Date.now();
  }

  /**
   * 更新同步状态
   */
  updateSyncStatus(syncStatus: SyncStatusServerDTO): void {
    this._syncStatus = syncStatus;
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
    this._syncStatus = {
      isSyncing: true,
      lastSyncAt: this._syncStatus?.lastSyncAt ?? null,
      syncError: null,
      pendingSyncCount: this._syncStatus?.pendingSyncCount ?? 0,
      conflictCount: this._syncStatus?.conflictCount ?? 0,
    };
    this._updatedAt = now;
  }

  /**
   * 停止同步
   */
  stopSync(): void {
    if (!this._syncStatus?.isSyncing) {
      throw new Error('No sync in progress');
    }

    this._syncStatus = {
      ...this._syncStatus,
      isSyncing: false,
      lastSyncAt: Date.now(),
    };
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
    // 减少冲突计数
    if (this._syncStatus.conflictCount > 0) {
      this._syncStatus = {
        ...this._syncStatus,
        conflictCount: this._syncStatus.conflictCount - 1,
      };
    }
    this._updatedAt = Date.now();
  }

  /**
   * 增加资源计数
   */
  incrementResourceCount(type: ResourceType): void {
    if (!this._stats.resourcesByType[type]) {
      this._stats.resourcesByType[type] = 0;
    }
    this._stats.resourcesByType[type]++;
    this._stats.totalResources++;
    this._updatedAt = Date.now();
  }

  /**
   * 减少资源计数
   */
  decrementResourceCount(type: ResourceType): void {
    if (this._stats.resourcesByType[type] && this._stats.resourcesByType[type] > 0) {
      this._stats.resourcesByType[type]--;
      this._stats.totalResources = Math.max(0, this._stats.totalResources - 1);
      this._updatedAt = Date.now();
    }
  }

  // ==================== 子实体管理（聚合根统一管理） ====================

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
