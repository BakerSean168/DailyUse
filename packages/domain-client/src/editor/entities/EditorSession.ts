/**
 * EditorSession Entity - Client Implementation
 * 编辑器会话实体 - 客户端实现
 */

import type { EditorSessionClientDTO, EditorSessionServerDTO, SessionLayoutClientDTO } from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { SessionLayoutClient } from '../value-objects';
import { EditorGroup } from './EditorGroup';

/**
 * EditorSession Entity (Client)
 *
 * DDD 实体职责：
 * - 有唯一标识符（uuid）
 * - 管理 EditorGroup 子实体集合
 * - 封装业务逻辑
 *
 * 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */
export class EditorSession extends Entity {
  // ===== 私有字段 =====
  private _workspaceUuid: string;
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _isActive: boolean;
  private _activeGroupIndex: number;
  private _layout: SessionLayoutClient;
  private _lastAccessedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _groups: EditorGroup[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    workspaceUuid: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    isActive: boolean;
    activeGroupIndex: number;
    layout: SessionLayoutClient;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._isActive = params.isActive;
    this._activeGroupIndex = params.activeGroupIndex;
    this._layout = params.layout;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._groups = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get workspaceUuid(): string {
    return this._workspaceUuid;
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
  public get isActive(): boolean {
    return this._isActive;
  }
  public get activeGroupIndex(): number {
    return this._activeGroupIndex;
  }
  public get layout(): SessionLayoutClientDTO {
    return this._layout.toClientDTO();
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

  public get groups(): EditorGroup[] {
    return [...this._groups];
  }

  public get groupCount(): number {
    return this._groups.length;
  }

  // ===== UI 辅助属性 =====
  public get formattedLastAccessed(): string | null {
    return this._lastAccessedAt ? this.formatRelativeTime(this._lastAccessedAt) : null;
  }

  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDate(this._updatedAt);
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

  // ===== 实例属性修改方法 =====
  /**
   * 重命名会话
   */
  public rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('会话名称不能为空');
    }
    this._name = newName.trim();
    this._updatedAt = Date.now();
  }
  /**
   * 更新描述
   * @param newDescription 新描述，可以为 null 清除描述
   */
  public updateDescription(newDescription: string | null): void {
    this._description = newDescription ? newDescription.trim() : null;
    this._updatedAt = Date.now();
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加分组
   */
  public addGroup(group: EditorGroup): void {
    if (!(group instanceof EditorGroup)) {
      throw new Error('Group must be an instance of EditorGroup');
    }
    this._groups.push(group);
    this._updatedAt = Date.now();
  }

  /**
   * 移除分组
   */
  public removeGroup(groupUuid: string): EditorGroup | null {
    const index = this._groups.findIndex((g) => g.uuid === groupUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._groups.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  /**
   * 获取分组
   */
  public getGroup(uuid: string): EditorGroup | null {
    return this._groups.find((g) => g.uuid === uuid) ?? null;
  }

  /**
   * 获取所有分组
   */
  public getAllGroups(): EditorGroup[] {
    return [...this._groups];
  }

  /**
   * 获取活动分组
   */
  public getActiveGroup(): EditorGroup | null {
    return this._groups[this._activeGroupIndex] ?? null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 EditorSession
   */
  public static create(params: {
    workspaceUuid: string;
    accountUuid: string;
    name: string;
    description?: string;
    layout?: SessionLayoutClient;
  }): EditorSession {
    const now = Date.now();
    return new EditorSession({
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      isActive: false,
      activeGroupIndex: 0,
      layout: params.layout ?? SessionLayoutClient.createDefault(),
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   */
  public toServerDTO(): EditorSessionServerDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      isActive: this._isActive,
      activeGroupIndex: this._activeGroupIndex,
      layout: this._layout.toServerDTO(),
      groups: this._groups.map((g) => g.toServerDTO()),
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO（递归转换子实体）
   */
  public toClientDTO(): EditorSessionClientDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      isActive: this._isActive,
      activeGroupIndex: this._activeGroupIndex,
      layout: this._layout.toClientDTO(),
      groups: this._groups.map((g) => g.toClientDTO()),
      groupCount: this.groupCount,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  public static fromServerDTO(dto: EditorSessionServerDTO): EditorSession {
    const session = new EditorSession({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      activeGroupIndex: dto.activeGroupIndex,
      layout: SessionLayoutClient.fromServerDTO(dto.layout),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    session._groups = dto.groups.map((g) => EditorGroup.fromServerDTO(g));

    return session;
  }

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  public static fromClientDTO(dto: EditorSessionClientDTO): EditorSession {
    const session = new EditorSession({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      isActive: dto.isActive,
      activeGroupIndex: dto.activeGroupIndex,
      layout: SessionLayoutClient.fromClientDTO(dto.layout),
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    session._groups = dto.groups.map((g) => EditorGroup.fromClientDTO(g));

    return session;
  }
}
