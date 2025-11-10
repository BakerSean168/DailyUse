/**
 * RepositoryExplorerClient 实体实现
 * 兼容 RepositoryExplorerClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type IRepositoryExplorerClient = RepositoryContracts.RepositoryExplorerClient;
type RepositoryExplorerClientDTO = RepositoryContracts.RepositoryExplorerClientDTO;
type RepositoryExplorerServerDTO = RepositoryContracts.RepositoryExplorerServerDTO;
type ResourceFilters = RepositoryContracts.ResourceFilters;
type ExplorerViewConfig = RepositoryContracts.ExplorerViewConfig;

/**
 * RepositoryExplorerClient 实体
 */
export class RepositoryExplorer extends Entity implements IRepositoryExplorerClient {
  // ===== 私有字段 =====
  private _repositoryUuid: string;
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _currentPath: string;
  private _filters: ResourceFilters;
  private _viewConfig: ExplorerViewConfig;
  private _pinnedPaths: string[];
  private _recentPaths: string[];
  private _lastScanAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    repositoryUuid: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    currentPath: string;
    filters: ResourceFilters;
    viewConfig: ExplorerViewConfig;
    pinnedPaths: string[];
    recentPaths: string[];
    lastScanAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._repositoryUuid = params.repositoryUuid;
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._currentPath = params.currentPath;
    this._filters = params.filters;
    this._viewConfig = params.viewConfig;
    this._pinnedPaths = params.pinnedPaths;
    this._recentPaths = params.recentPaths;
    this._lastScanAt = params.lastScanAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get repositoryUuid(): string {
    return this._repositoryUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get currentPath(): string {
    return this._currentPath;
  }
  public get filters(): ResourceFilters {
    return { ...this._filters };
  }
  public get viewConfig(): ExplorerViewConfig {
    return { ...this._viewConfig };
  }
  public get pinnedPaths(): string[] {
    return [...this._pinnedPaths];
  }
  public get recentPaths(): string[] {
    return [...this._recentPaths];
  }
  public get lastScanAt(): number | null {
    return this._lastScanAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== UI 辅助属性 =====

  /**
   * 显示路径（截断过长路径）
   */
  public get displayPath(): string {
    const maxLength = 50;
    if (this._currentPath.length <= maxLength) {
      return this._currentPath;
    }
    return '...' + this._currentPath.slice(-maxLength);
  }

  /**
   * 路径面包屑导航
   */
  public get pathBreadcrumbs(): string[] {
    return this._currentPath.split('/').filter((segment) => segment.length > 0);
  }

  /**
   * 格式化的最后扫描时间
   */
  public get formattedLastScan(): string {
    if (!this._lastScanAt) {
      return '从未扫描';
    }
    return this.formatRelativeTime(this._lastScanAt);
  }

  /**
   * 激活的过滤器数量
   */
  public get activeFiltersCount(): number {
    return Object.keys(this._filters).length;
  }

  /**
   * 是否可以返回上一级
   */
  public get canNavigateBack(): boolean {
    return this._currentPath !== '/' && this._currentPath.length > 0;
  }

  /**
   * 是否可以前进（基于导航历史）
   */
  public get canNavigateForward(): boolean {
    // 简化实现：由于没有导航历史，始终返回 false
    return false;
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  }

  // ===== 工厂方法 =====

  /**
   * 创建用于创建表单的空 RepositoryExplorer 实例
   */
  public static forCreate(params: {
    repositoryUuid: string;
    accountUuid: string;
  }): RepositoryExplorer {
    const uuid = Entity.generateUUID();
    const now = Date.now();
    return new RepositoryExplorer({
      uuid,
      repositoryUuid: params.repositoryUuid,
      accountUuid: params.accountUuid,
      name: '',
      description: null,
      currentPath: '/',
      filters: {},
      viewConfig: {
        sortBy: 'name',
        sortOrder: 'asc',
        viewMode: 'grid',
        showHidden: false,
      },
      pinnedPaths: [],
      recentPaths: [],
      lastScanAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前实体（用于编辑表单）
   */
  public clone(): RepositoryExplorer {
    return RepositoryExplorer.fromClientDTO(this.toClientDTO());
  }

  /**
   * 创建新的 RepositoryExplorer 实体
   */
  public static create(params: {
    repositoryUuid: string;
    accountUuid: string;
    name: string;
    description?: string;
    currentPath?: string;
  }): RepositoryExplorer {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new RepositoryExplorer({
      uuid,
      repositoryUuid: params.repositoryUuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      currentPath: params.currentPath || '/',
      filters: {},
      viewConfig: {
        sortBy: 'name',
        sortOrder: 'asc',
        viewMode: 'grid',
        showHidden: false,
      },
      pinnedPaths: [],
      recentPaths: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 转换方法 =====

  public toServerDTO(): RepositoryExplorerServerDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      currentPath: this._currentPath,
      filters: { ...this._filters },
      viewConfig: { ...this._viewConfig },
      pinnedPaths: [...this._pinnedPaths],
      recentPaths: [...this._recentPaths],
      lastScanAt: this._lastScanAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): RepositoryExplorerClientDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      currentPath: this._currentPath,
      filters: { ...this._filters },
      viewConfig: { ...this._viewConfig },
      pinnedPaths: [...this._pinnedPaths],
      recentPaths: [...this._recentPaths],
      lastScanAt: this._lastScanAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      displayPath: this.displayPath,
      pathBreadcrumbs: this.pathBreadcrumbs,
      formattedLastScan: this.formattedLastScan,
      activeFiltersCount: this.activeFiltersCount,
      canNavigateBack: this.canNavigateBack,
      canNavigateForward: this.canNavigateForward,
    };
  }

  public static fromServerDTO(dto: RepositoryExplorerServerDTO): RepositoryExplorer {
    return new RepositoryExplorer({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      currentPath: dto.currentPath,
      filters: dto.filters,
      viewConfig: dto.viewConfig,
      pinnedPaths: dto.pinnedPaths,
      recentPaths: dto.recentPaths,
      lastScanAt: dto.lastScanAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromClientDTO(dto: RepositoryExplorerClientDTO): RepositoryExplorer {
    return new RepositoryExplorer({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      currentPath: dto.currentPath,
      filters: dto.filters,
      viewConfig: dto.viewConfig,
      pinnedPaths: dto.pinnedPaths,
      recentPaths: dto.recentPaths,
      lastScanAt: dto.lastScanAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
