/**
 * Repository 聚合根实现 (Server)
 */
import { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryConfig, RepositoryStats } from '../value-objects';

// 类型别名
type RepositoryType = RepositoryContracts.RepositoryType;
type RepositoryStatus = RepositoryContracts.RepositoryStatus;
type RepositoryServer = RepositoryContracts.RepositoryServer;
type RepositoryServerDTO = RepositoryContracts.RepositoryServerDTO;
type RepositoryPersistenceDTO = RepositoryContracts.RepositoryPersistenceDTO;
type FolderServer = RepositoryContracts.FolderServer;

// 枚举值
const RepositoryStatusEnum = RepositoryContracts.RepositoryStatus;

export class Repository implements RepositoryServer {
  // ===== 私有字段 =====
  private _uuid: string;
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
  private _folders: FolderServer[] | null;

  // ===== 私有构造函数 =====
  private constructor(
    uuid: string,
    accountUuid: string,
    name: string,
    type: RepositoryType,
    path: string,
    description: string | null,
    config: RepositoryConfig,
    stats: RepositoryStats,
    status: RepositoryStatus,
    createdAt: number,
    updatedAt: number,
    folders: FolderServer[] | null = null,
  ) {
    this._uuid = uuid;
    this._accountUuid = accountUuid;
    this._name = name;
    this._type = type;
    this._path = path;
    this._description = description;
    this._config = config;
    this._stats = stats;
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._folders = folders;
  }

  // ===== Getters =====
  get uuid(): string { return this._uuid; }
  get accountUuid(): string { return this._accountUuid; }
  get name(): string { return this._name; }
  get type(): RepositoryType { return this._type; }
  get path(): string { return this._path; }
  get description(): string | null { return this._description; }
  get config(): RepositoryConfig { return this._config; }
  get stats(): RepositoryStats { return this._stats; }
  get status(): RepositoryStatus { return this._status; }
  get createdAt(): number { return this._createdAt; }
  get updatedAt(): number { return this._updatedAt; }
  get folders(): FolderServer[] | null { return this._folders; }

  // ===== 业务方法 =====
  updateConfig(newConfig: Partial<RepositoryContracts.RepositoryConfigServerDTO>): void {
    const currentDTO = this._config.toServerDTO();
    const merged = { ...currentDTO, ...newConfig };
    this._config = RepositoryConfig.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  updateStats(newStats: Partial<RepositoryContracts.RepositoryStatsServerDTO>): void {
    const currentDTO = this._stats.toServerDTO();
    const merged = { ...currentDTO, ...newStats };
    this._stats = RepositoryStats.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  archive(): void {
    if (this._status === RepositoryStatusEnum.ARCHIVED) {
      throw new Error('Repository is already archived');
    }
    this._status = RepositoryStatusEnum.ARCHIVED;
    this._updatedAt = Date.now();
  }

  activate(): void {
    if (this._status === RepositoryStatusEnum.ACTIVE) {
      throw new Error('Repository is already active');
    }
    this._status = RepositoryStatusEnum.ACTIVE;
    this._updatedAt = Date.now();
  }

  delete(): void {
    this._status = RepositoryStatusEnum.DELETED;
    this._updatedAt = Date.now();
  }

  // ===== DTO 转换方法 =====
  toServerDTO(includeFolders = false): RepositoryServerDTO {
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
      folders: includeFolders
        ? this._folders?.map(f => (f as any).toServerDTO()) || null
        : null,
    };
  }

  toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: JSON.stringify(this._config.toServerDTO()),
      stats: JSON.stringify(this._stats.toServerDTO()),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态工厂方法 =====
  static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryContracts.RepositoryConfigServerDTO>;
  }): Repository {
    const config = RepositoryConfig.create(params.config);
    const stats = RepositoryStats.create();
    const now = Date.now();

    return new Repository(
      crypto.randomUUID(),
      params.accountUuid,
      params.name,
      params.type,
      params.path,
      params.description ?? null,
      config,
      stats,
      RepositoryStatusEnum.ACTIVE,
      now,
      now,
      null,
    );
  }

  static fromServerDTO(dto: RepositoryServerDTO): Repository {
    const folders = dto.folders
      ? dto.folders.map(f => {
          // TODO: Import Folder class when available
          return null as any;
        })
      : null;

    return new Repository(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.type,
      dto.path,
      dto.description ?? null,
      RepositoryConfig.fromServerDTO(dto.config),
      RepositoryStats.fromServerDTO(dto.stats),
      dto.status,
      dto.createdAt,
      dto.updatedAt,
      folders,
    );
  }

  static fromPersistenceDTO(dto: RepositoryPersistenceDTO): Repository {
    return new Repository(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.type,
      dto.path,
      dto.description ?? null,
      RepositoryConfig.fromServerDTO(JSON.parse(dto.config)),
      RepositoryStats.fromServerDTO(JSON.parse(dto.stats)),
      dto.status,
      dto.createdAt,
      dto.updatedAt,
      null,
    );
  }
}
