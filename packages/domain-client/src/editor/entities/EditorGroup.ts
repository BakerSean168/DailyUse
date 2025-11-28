/**
 * EditorGroup Entity - Client Implementation
 * 编辑器分组实体 - 客户端实现
 */

import type { EditorGroupClient, EditorGroupClientDTO, EditorGroupServerDTO } from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { EditorTab } from './EditorTab';

/**
 * EditorGroup Entity (Client)
 *
 * DDD 实体职责：
 * - 有唯一标识符（uuid）
 * - 管理 EditorTab 子实体集合
 * - 封装业务逻辑
 */
export class EditorGroup extends Entity implements EditorGroupClient {
  // ===== 私有字段 =====
  private _sessionUuid: string;
  private _workspaceUuid: string;
  private _accountUuid: string;
  private _groupIndex: number;
  private _activeTabIndex: number;
  private _name: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _tabs: EditorTab[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    sessionUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    groupIndex: number;
    activeTabIndex: number;
    name?: string | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._sessionUuid = params.sessionUuid;
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._groupIndex = params.groupIndex;
    this._activeTabIndex = params.activeTabIndex;
    this._name = params.name ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._tabs = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get sessionUuid(): string {
    return this._sessionUuid;
  }
  public get workspaceUuid(): string {
    return this._workspaceUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get groupIndex(): number {
    return this._groupIndex;
  }
  public get activeTabIndex(): number {
    return this._activeTabIndex;
  }
  public get name(): string | null {
    return this._name;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get tabs(): EditorTab[] {
    return [...this._tabs];
  }

  // ===== UI 辅助属性 =====
  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDate(this._updatedAt);
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  // ===== UI 辅助方法 =====

  /**
   * 获取显示名称（如果没有名称，返回 "Group 1" 格式）
   */
  public getDisplayName(): string {
    return this._name || `Group ${this._groupIndex + 1}`;
  }

  /**
   * 判断指定标签是否为活动标签
   */
  public isActiveTab(tabIndex: number): boolean {
    return this._activeTabIndex === tabIndex;
  }

  /**
   * 是否有自定义名称
   */
  public hasCustomName(): boolean {
    return this._name !== null;
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加标签
   */
  public addTab(tab: EditorTab): void {
    if (!(tab instanceof EditorTab)) {
      throw new Error('Tab must be an instance of EditorTab');
    }
    this._tabs.push(tab);
    this._updatedAt = Date.now();
  }

  /**
   * 移除标签
   */
  public removeTab(tabUuid: string): EditorTab | null {
    const index = this._tabs.findIndex((t) => t.uuid === tabUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._tabs.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  /**
   * 获取标签
   */
  public getTab(uuid: string): EditorTab | null {
    return this._tabs.find((t) => t.uuid === uuid) ?? null;
  }

  /**
   * 获取所有标签
   */
  public getAllTabs(): EditorTab[] {
    return [...this._tabs];
  }

  /**
   * 获取活动标签
   */
  public getActiveTab(): EditorTab | null {
    return this._tabs[this._activeTabIndex] ?? null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 EditorGroup
   */
  public static create(params: {
    sessionUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    groupIndex: number;
    name?: string;
  }): EditorGroup {
    const now = Date.now();
    return new EditorGroup({
      sessionUuid: params.sessionUuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      groupIndex: params.groupIndex,
      activeTabIndex: 0,
      name: params.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   */
  public toServerDTO(): EditorGroupServerDTO {
    return {
      uuid: this._uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((t) => t.toServerDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO（递归转换子实体）
   */
  public toClientDTO(): EditorGroupClientDTO {
    return {
      uuid: this._uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((t) => t.toClientDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  public static fromServerDTO(dto: EditorGroupServerDTO): EditorGroup {
    const group = new EditorGroup({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      groupIndex: dto.groupIndex,
      activeTabIndex: dto.activeTabIndex,
      name: dto.name,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    group._tabs = dto.tabs.map((t) => EditorTab.fromServerDTO(t));

    return group;
  }

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  public static fromClientDTO(dto: EditorGroupClientDTO): EditorGroup {
    const group = new EditorGroup({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      groupIndex: dto.groupIndex,
      activeTabIndex: dto.activeTabIndex,
      name: dto.name,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    group._tabs = dto.tabs.map((t) => EditorTab.fromClientDTO(t));

    return group;
  }
}
