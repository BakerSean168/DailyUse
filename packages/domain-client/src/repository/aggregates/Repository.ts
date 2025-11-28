/**
 * Repository 聚合根实现 (Client)
 * 
 * DDD 聚合根职责：
 * - 管理仓储的元数据和配置
 * - 管理文件夹树结构（子实体）
 * - 执行仓储业务逻辑
 * - 是事务边界
 */
import {
  FolderClient,
  RepositoryClient,
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
  RepositoryServerDTO,
  RepositoryStatsServerDTO,
  RepositoryStatus,
  RepositoryType,
} from '@dailyuse/contracts/repository';
import { AggregateRoot } from '@dailyuse/utils';
import { RepositoryConfig, RepositoryStats } from '../value-objects';
import { Folder } from '../entities/Folder';

// 类型别名

// 枚举值

export class Repository extends AggregateRoot implements RepositoryClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _type: RepositoryType;
  private _path: string;
  private _description: string | null;
  private _config: RepositoryConfig;
  private _stats: RepositoryStats;
  private _status: RepositoryStatus;
  private _createdAt: number;
  private _updatedAt: number;
  private _folders: FolderClient[] | null;

  // ===== 私有构造函数 =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string | null;
    config: RepositoryConfig;
    stats: RepositoryStats;
    status: RepositoryStatus;
    createdAt: number;
    updatedAt: number;
    folders?: FolderClient[] | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description ?? null;
    this._config = params.config;
    this._stats = params.stats;
    this._status = params.status;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._folders = params.folders ?? null;
  }

  // ===== Getters =====
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

  public get config(): RepositoryConfig {
    return this._config;
  }

  public get stats(): RepositoryStats {
    return this._stats;
  }

  public get status(): RepositoryStatus {
    return this._status;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get folders(): FolderClient[] | null {
    return this._folders;
  }

  // ===== UI 计算属性 =====
  public get isDeleted(): boolean {
    return this._status === RepositoryStatus.DELETED;
  }

  public get isArchived(): boolean {
    return this._status === RepositoryStatus.ARCHIVED;
  }

  public get isActive(): boolean {
    return this._status === RepositoryStatus.ACTIVE;
  }

  public get statusText(): string {
    const map = {
      [RepositoryStatus.ACTIVE]: 'Active',
      [RepositoryStatus.ARCHIVED]: 'Archived',
      [RepositoryStatus.DELETED]: 'Deleted',
    };
    return map[this._status];
  }

  public get typeText(): string {
    const map = {
      [RepositoryType.MARKDOWN]: 'Markdown',
      [RepositoryType.CODE]: 'Code',
      [RepositoryType.MIXED]: 'Mixed',
    };
    return map[this._type];
  }

  public get folderCount(): number {
    return this._stats.folderCount;
  }

  public get resourceCount(): number {
    return this._stats.resourceCount;
  }

  public get totalSize(): number {
    return this._stats.totalSize;
  }

  public get formattedSize(): string {
    return this._stats.formattedSize;
  }

  get createdAtText(): string {
    return new Date(this._createdAt).toLocaleString();
  }

  get updatedAtText(): string {
    return new Date(this._updatedAt).toLocaleString();
  }

  // ===== 业务方法 =====
  updateConfig(config: Partial<RepositoryConfigServerDTO>): void {
    const currentDTO = this._config.toServerDTO();
    const merged = { ...currentDTO, ...config };
    this._config = RepositoryConfig.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  updateStats(stats: Partial<RepositoryStatsServerDTO>): void {
    const currentDTO = this._stats.toServerDTO();
    const merged = { ...currentDTO, ...stats };
    this._stats = RepositoryStats.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  archive(): void {
    if (this._status === RepositoryStatus.ARCHIVED) {
      throw new Error('Repository is already archived');
    }
    if (this._status === RepositoryStatus.DELETED) {
      throw new Error('Cannot archive a deleted repository');
    }
    this._status = RepositoryStatus.ARCHIVED;
    this._updatedAt = Date.now();
  }

  activate(): void {
    if (this._status === RepositoryStatus.ACTIVE) {
      throw new Error('Repository is already active');
    }
    if (this._status === RepositoryStatus.DELETED) {
      throw new Error('Cannot activate a deleted repository');
    }
    this._status = RepositoryStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  // ===== DTO 转换 =====
  toClientDTO(): RepositoryClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toClientDTO(),
      stats: this._stats.toClientDTO(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      folders: this._folders?.map(f => (f as any).toClientDTO()) || null,
      isDeleted: this.isDeleted,
      isArchived: this.isArchived,
      isActive: this.isActive,
      statusText: this.statusText,
      typeText: this.typeText,
      folderCount: this.folderCount,
      resourceCount: this.resourceCount,
      totalSize: this.totalSize,
      formattedSize: this.formattedSize,
      createdAtText: this.createdAtText,
      updatedAtText: this.updatedAtText,
    };
  }

  toServerDTO(): RepositoryServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toServerDTO(),
      stats: this._stats.toServerDTO(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      folders: this._folders?.map(f => (f as any).toServerDTO()) || null,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromServerDTO(dto: RepositoryServerDTO): Repository {
    return new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: RepositoryConfig.fromServerDTO(dto.config),
      stats: RepositoryStats.fromServerDTO(dto.stats),
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      folders: dto.folders?.map((f: any) => Folder.fromServerDTO(f)) || null,
    });
  }

  public static fromClientDTO(dto: RepositoryClientDTO): Repository {
    return new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: RepositoryConfig.fromClientDTO(dto.config),
      stats: RepositoryStats.fromClientDTO(dto.stats),
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      folders: dto.folders?.map((f: any) => Folder.fromClientDTO(f)) || null,
    });
  }
}
