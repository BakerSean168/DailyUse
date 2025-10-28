/**
 * GoalFolder Aggregate Root - Client Implementation
 * 目标文件夹聚合根 - 客户端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import { GoalContracts } from '@dailyuse/contracts';

type FolderType = GoalContracts.FolderType;
const FolderType = GoalContracts.FolderType;

/**
 * 目标文件夹聚合根客户端实现
 */
export class GoalFolderClient extends AggregateRoot implements GoalContracts.GoalFolderClient {
  private _accountUuid: string;
  private _name: string;
  private _description?: string | null;
  private _icon?: string | null;
  private _color?: string | null;
  private _parentFolderUuid?: string | null;
  private _sortOrder: number;
  private _isSystemFolder: boolean;
  private _folderType?: FolderType | null;
  private _goalCount: number;
  private _completedGoalCount: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  private constructor(
    uuid: string,
    accountUuid: string,
    name: string,
    description: string | null | undefined,
    icon: string | null | undefined,
    color: string | null | undefined,
    parentFolderUuid: string | null | undefined,
    sortOrder: number,
    isSystemFolder: boolean,
    folderType: FolderType | null | undefined,
    goalCount: number,
    completedGoalCount: number,
    createdAt: number,
    updatedAt: number,
    deletedAt: number | null | undefined,
  ) {
    super(uuid);
    this._accountUuid = accountUuid;
    this._name = name;
    this._description = description;
    this._icon = icon;
    this._color = color;
    this._parentFolderUuid = parentFolderUuid;
    this._sortOrder = sortOrder;
    this._isSystemFolder = isSystemFolder;
    this._folderType = folderType;
    this._goalCount = goalCount;
    this._completedGoalCount = completedGoalCount;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._deletedAt = deletedAt;
  }

  // ========== Getters ==========

  get accountUuid(): string {
    return this._accountUuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null | undefined {
    return this._description;
  }

  get icon(): string | null | undefined {
    return this._icon;
  }

  get color(): string | null | undefined {
    return this._color;
  }

  get parentFolderUuid(): string | null | undefined {
    return this._parentFolderUuid;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get isSystemFolder(): boolean {
    return this._isSystemFolder;
  }

  get folderType(): FolderType | null | undefined {
    return this._folderType;
  }

  get goalCount(): number {
    return this._goalCount;
  }

  get completedGoalCount(): number {
    return this._completedGoalCount;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }

  // ========== UI 计算属性 ==========

  get displayName(): string {
    return this.getDisplayName();
  }

  get displayIcon(): string {
    return this.getIcon();
  }

  get completionRate(): number {
    if (this._goalCount === 0) return 0;
    return Math.round((this._completedGoalCount / this._goalCount) * 100);
  }

  get isDeleted(): boolean {
    return this._deletedAt !== null && this._deletedAt !== undefined;
  }

  get activeGoalCount(): number {
    return this._goalCount - this._completedGoalCount;
  }

  // ========== UI 业务方法 ==========

  getDisplayName(): string {
    if (this._folderType) {
      const typeNames: Record<FolderType, string> = {
        [FolderType.ALL]: '所有目标',
        [FolderType.ACTIVE]: '进行中',
        [FolderType.COMPLETED]: '已完成',
        [FolderType.ARCHIVED]: '已归档',
        [FolderType.CUSTOM]: this._name,
      };
      return typeNames[this._folderType] || this._name;
    }
    return this._name;
  }

  getIcon(): string {
    if (this._icon) return this._icon;

    // 根据文件夹类型返回默认图标
    if (this._folderType) {
      const typeIcons: Record<FolderType, string> = {
        [FolderType.ALL]: '📋',
        [FolderType.ACTIVE]: '🎯',
        [FolderType.COMPLETED]: '✅',
        [FolderType.ARCHIVED]: '📦',
        [FolderType.CUSTOM]: '📁',
      };
      return typeIcons[this._folderType] || '📁';
    }

    return '📁';
  }

  getCompletionText(): string {
    const completed = this._completedGoalCount;
    const total = this._goalCount;
    const rate = this.completionRate;
    return `${completed}/${total} (${rate}%)`;
  }

  getBadge(): { text: string; color: string } | null {
    if (this._isSystemFolder) {
      return { text: '系统', color: '#94A3B8' };
    }
    if (this.activeGoalCount > 0) {
      return { text: `${this.activeGoalCount}`, color: '#3B82F6' };
    }
    return null;
  }

  // ========== 操作判断方法 ==========

  canRename(): boolean {
    return !this._isSystemFolder && !this.isDeleted;
  }

  canDelete(): boolean {
    return !this._isSystemFolder && !this.isDeleted;
  }

  canMove(): boolean {
    return !this._isSystemFolder && !this.isDeleted;
  }

  // ========== DTO 转换 ==========

  toServerDTO(): GoalContracts.GoalFolderServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parentFolderUuid: this._parentFolderUuid,
      sortOrder: this._sortOrder,
      isSystemFolder: this._isSystemFolder,
      folderType: this._folderType,
      goalCount: this._goalCount,
      completedGoalCount: this._completedGoalCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }

  toClientDTO(): GoalContracts.GoalFolderClientDTO {
    return {
      uuid: this.uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parentFolderUuid: this._parentFolderUuid,
      sortOrder: this._sortOrder,
      isSystemFolder: this._isSystemFolder,
      folderType: this._folderType,
      goalCount: this._goalCount,
      completedGoalCount: this._completedGoalCount,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      displayName: this.displayName,
      displayIcon: this.displayIcon,
      completionRate: this.completionRate,
      isDeleted: this.isDeleted,
      activeGoalCount: this.activeGoalCount,
    };
  }

  // ========== 其他实例方法 ==========

  clone(): GoalFolderClient {
    return new GoalFolderClient(
      this.uuid,
      this._accountUuid,
      this._name,
      this._description,
      this._icon,
      this._color,
      this._parentFolderUuid,
      this._sortOrder,
      this._isSystemFolder,
      this._folderType,
      this._goalCount,
      this._completedGoalCount,
      this._createdAt,
      this._updatedAt,
      this._deletedAt,
    );
  }

  // ========== 静态工厂方法 ==========

  static create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentFolderUuid?: string;
  }): GoalFolderClient {
    const now = Date.now();

    return new GoalFolderClient(
      AggregateRoot.generateUUID(),
      params.accountUuid,
      params.name,
      params.description || null,
      params.icon || null,
      params.color || null,
      params.parentFolderUuid || null,
      0,
      false,
      FolderType.CUSTOM,
      0,
      0,
      now,
      now,
      null,
    );
  }

  static forCreate(accountUuid: string): GoalFolderClient {
    const now = Date.now();

    return new GoalFolderClient(
      AggregateRoot.generateUUID(),
      accountUuid,
      '',
      null,
      null,
      null,
      null,
      0,
      false,
      FolderType.CUSTOM,
      0,
      0,
      now,
      now,
      null,
    );
  }

  static fromServerDTO(dto: GoalContracts.GoalFolderServerDTO): GoalFolderClient {
    return new GoalFolderClient(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.description,
      dto.icon,
      dto.color,
      dto.parentFolderUuid,
      dto.sortOrder,
      dto.isSystemFolder,
      dto.folderType as FolderType | null | undefined,
      dto.goalCount,
      dto.completedGoalCount,
      dto.createdAt,
      dto.updatedAt,
      dto.deletedAt,
    );
  }

  static fromClientDTO(dto: GoalContracts.GoalFolderClientDTO): GoalFolderClient {
    return new GoalFolderClient(
      dto.uuid,
      dto.accountUuid,
      dto.name,
      dto.description,
      dto.icon,
      dto.color,
      dto.parentFolderUuid,
      dto.sortOrder,
      dto.isSystemFolder,
      dto.folderType as FolderType | null | undefined,
      dto.goalCount,
      dto.completedGoalCount,
      dto.createdAt,
      dto.updatedAt,
      dto.deletedAt,
    );
  }

  // ===== 修改方法 (Modification Methods) =====
  // 遵循 DDD 最佳实践：聚合根应该提供修改属性的方法

  /**
   * 更新名称
   */
  public updateName(name: string): void {
    this._name = name;
    this._updatedAt = Date.now();
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  /**
   * 更新图标
   */
  public updateIcon(icon: string | null): void {
    this._icon = icon;
    this._updatedAt = Date.now();
  }

  /**
   * 更新颜色
   */
  public updateColor(color: string | null): void {
    this._color = color;
    this._updatedAt = Date.now();
  }

  /**
   * 更新父文件夹
   */
  public updateParentFolder(parentFolderUuid: string | null): void {
    this._parentFolderUuid = parentFolderUuid;
    this._updatedAt = Date.now();
  }

  /**
   * 更新排序
   */
  public updateSortOrder(sortOrder: number): void {
    this._sortOrder = sortOrder;
    this._updatedAt = Date.now();
  }

  /**
   * 批量更新基本信息
   */
  public updateBasicInfo(params: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    parentFolderUuid?: string | null;
    sortOrder?: number;
  }): void {
    if (params.name !== undefined) {
      this._name = params.name;
    }
    if (params.description !== undefined) {
      this._description = params.description;
    }
    if (params.icon !== undefined) {
      this._icon = params.icon;
    }
    if (params.color !== undefined) {
      this._color = params.color;
    }
    if (params.parentFolderUuid !== undefined) {
      this._parentFolderUuid = params.parentFolderUuid;
    }
    if (params.sortOrder !== undefined) {
      this._sortOrder = params.sortOrder;
    }
    this._updatedAt = Date.now();
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    this._deletedAt = Date.now();
    this._updatedAt = Date.now();
  }

  /**
   * 恢复软删除
   */
  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = Date.now();
  }
}
