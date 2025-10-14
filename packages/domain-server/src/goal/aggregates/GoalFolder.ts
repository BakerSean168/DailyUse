/**
 * GoalFolder 聚合根实现
 * 实现 GoalFolderServer 接口
 *
 * DDD 聚合根职责：
 * - 管理文件夹属性和配置
 * - 维护文件夹统计信息
 * - 执行文件夹相关的业务逻辑
 * - 是事务边界
 */

import { AggregateRoot } from '@dailyuse/utils';
import type { GoalContracts } from '@dailyuse/contracts';

// 类型别名
type IGoalFolderServer = GoalContracts.GoalFolderServer;
type GoalFolderServerDTO = GoalContracts.GoalFolderServerDTO;
type GoalFolderPersistenceDTO = GoalContracts.GoalFolderPersistenceDTO;
type FolderType = GoalContracts.FolderType;
type GoalFolderCreatedEvent = GoalContracts.GoalFolderCreatedEvent;
type GoalFolderUpdatedEvent = GoalContracts.GoalFolderUpdatedEvent;
type GoalFolderDeletedEvent = GoalContracts.GoalFolderDeletedEvent;
type GoalFolderStatsUpdatedEvent = GoalContracts.GoalFolderStatsUpdatedEvent;

/**
 * GoalFolder 聚合根
 */
export class GoalFolder extends AggregateRoot implements IGoalFolderServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _icon: string | null;
  private _color: string | null;
  private _parentFolderUuid: string | null;
  private _sortOrder: number;
  private _isSystemFolder: boolean;
  private _folderType: FolderType | null;
  private _goalCount: number;
  private _completedGoalCount: number;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    parentFolderUuid?: string | null;
    sortOrder: number;
    isSystemFolder: boolean;
    folderType?: FolderType | null;
    goalCount: number;
    completedGoalCount: number;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
  }) {
    super(params.uuid ?? AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._icon = params.icon ?? null;
    this._color = params.color ?? null;
    this._parentFolderUuid = params.parentFolderUuid ?? null;
    this._sortOrder = params.sortOrder;
    this._isSystemFolder = params.isSystemFolder;
    this._folderType = params.folderType ?? null;
    this._goalCount = params.goalCount;
    this._completedGoalCount = params.completedGoalCount;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt ?? null;
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
  public get description(): string | null {
    return this._description;
  }
  public get icon(): string | null {
    return this._icon;
  }
  public get color(): string | null {
    return this._color;
  }
  public get parentFolderUuid(): string | null {
    return this._parentFolderUuid;
  }
  public get sortOrder(): number {
    return this._sortOrder;
  }
  public get isSystemFolder(): boolean {
    return this._isSystemFolder;
  }
  public get folderType(): FolderType | null {
    return this._folderType;
  }
  public get goalCount(): number {
    return this._goalCount;
  }
  public get completedGoalCount(): number {
    return this._completedGoalCount;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null {
    return this._deletedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 GoalFolder 聚合根
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentFolderUuid?: string;
    sortOrder?: number;
    isSystemFolder?: boolean;
    folderType?: FolderType;
  }): GoalFolder {
    // 验证
    if (!params.accountUuid) {
      throw new Error('Account UUID is required');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const now = Date.now();
    const folder = new GoalFolder({
      accountUuid: params.accountUuid,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      icon: params.icon || null,
      color: params.color || null,
      parentFolderUuid: params.parentFolderUuid || null,
      sortOrder: params.sortOrder ?? 0,
      isSystemFolder: params.isSystemFolder ?? false,
      folderType: params.folderType ?? null,
      goalCount: 0,
      completedGoalCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // 触发领域事件
    folder.addDomainEvent({
      eventType: 'GoalFolderCreated',
      aggregateId: folder.uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: {
        folder: folder.toServerDTO(),
        accountUuid: params.accountUuid,
      },
    });

    return folder;
  }

  /**
   * 从 Server DTO 重建聚合根
   */
  public static fromServerDTO(dto: GoalFolderServerDTO): GoalFolder {
    return new GoalFolder({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description ?? null,
      icon: dto.icon ?? null,
      color: dto.color ?? null,
      parentFolderUuid: dto.parentFolderUuid ?? null,
      sortOrder: dto.sortOrder,
      isSystemFolder: dto.isSystemFolder,
      folderType: dto.folderType ?? null,
      goalCount: dto.goalCount,
      completedGoalCount: dto.completedGoalCount,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
    });
  }

  /**
   * 从持久化 DTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: GoalFolderPersistenceDTO): GoalFolder {
    return new GoalFolder({
      uuid: dto.uuid,
      accountUuid: dto.account_uuid,
      name: dto.name,
      description: dto.description ?? null,
      icon: dto.icon ?? null,
      color: dto.color ?? null,
      parentFolderUuid: dto.parent_folder_uuid ?? null,
      sortOrder: dto.sort_order,
      isSystemFolder: dto.is_system_folder,
      folderType: dto.folder_type ?? null,
      goalCount: dto.goal_count,
      completedGoalCount: dto.completed_goal_count,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      deletedAt: dto.deleted_at ?? null,
    });
  }

  // ===== 业务方法 =====

  /**
   * 重命名文件夹
   */
  public rename(newName: string): void {
    const trimmed = newName.trim();
    if (trimmed.length === 0) {
      throw new Error('Name cannot be empty');
    }
    if (this._isSystemFolder) {
      throw new Error('Cannot rename system folder');
    }

    const previousData: Partial<GoalFolderServerDTO> = {
      name: this._name,
    };

    this._name = trimmed;
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'GoalFolderUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        folder: this.toServerDTO(),
        previousData,
        changes: ['name'],
      },
    });
  }

  /**
   * 更新描述
   */
  public updateDescription(description: string): void {
    this._description = description.trim() || null;
    this._updatedAt = Date.now();
  }

  /**
   * 更新图标
   */
  public updateIcon(icon: string): void {
    this._icon = icon.trim() || null;
    this._updatedAt = Date.now();
  }

  /**
   * 更新颜色
   */
  public updateColor(color: string): void {
    this._color = color.trim() || null;
    this._updatedAt = Date.now();
  }

  /**
   * 更新统计信息
   */
  public updateStatistics(goalCount: number, completedCount: number): void {
    if (goalCount < 0 || completedCount < 0) {
      throw new Error('Counts cannot be negative');
    }
    if (completedCount > goalCount) {
      throw new Error('Completed count cannot exceed total count');
    }

    this._goalCount = goalCount;
    this._completedGoalCount = completedCount;
    this._updatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'GoalFolderStatsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        folderUuid: this.uuid,
        goalCount: this._goalCount,
        completedGoalCount: this._completedGoalCount,
      },
    });
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) return;
    if (this._isSystemFolder) {
      throw new Error('Cannot delete system folder');
    }

    this._deletedAt = Date.now();
    this._updatedAt = this._deletedAt;

    this.addDomainEvent({
      eventType: 'GoalFolderDeleted',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        folderUuid: this.uuid,
        deletedAt: this._deletedAt,
        isSoftDelete: true,
      },
    });
  }

  /**
   * 恢复已删除的文件夹
   */
  public restore(): void {
    if (!this._deletedAt) return;

    this._deletedAt = null;
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
   * 移动到父文件夹
   */
  public moveToParent(parentFolderUuid: string | null): void {
    this._parentFolderUuid = parentFolderUuid;
    this._updatedAt = Date.now();
  }

  /**
   * 增加目标计数
   */
  public incrementGoalCount(): void {
    this._goalCount++;
    this._updatedAt = Date.now();
  }

  /**
   * 减少目标计数
   */
  public decrementGoalCount(): void {
    if (this._goalCount > 0) {
      this._goalCount--;
      this._updatedAt = Date.now();
    }
  }

  /**
   * 增加完成目标计数
   */
  public incrementCompletedCount(): void {
    this._completedGoalCount++;
    this._updatedAt = Date.now();
  }

  /**
   * 减少完成目标计数
   */
  public decrementCompletedCount(): void {
    if (this._completedGoalCount > 0) {
      this._completedGoalCount--;
      this._updatedAt = Date.now();
    }
  }

  /**
   * 获取完成率
   */
  public getCompletionRate(): number {
    if (this._goalCount === 0) return 0;
    return (this._completedGoalCount / this._goalCount) * 100;
  }

  /**
   * 是否为空文件夹
   */
  public isEmpty(): boolean {
    return this._goalCount === 0;
  }

  // ===== DTO 转换 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GoalFolderServerDTO {
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

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalFolderPersistenceDTO {
    return {
      uuid: this.uuid,
      account_uuid: this._accountUuid,
      name: this._name,
      description: this._description,
      icon: this._icon,
      color: this._color,
      parent_folder_uuid: this._parentFolderUuid,
      sort_order: this._sortOrder,
      is_system_folder: this._isSystemFolder,
      folder_type: this._folderType,
      goal_count: this._goalCount,
      completed_goal_count: this._completedGoalCount,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      deleted_at: this._deletedAt,
    };
  }
}
