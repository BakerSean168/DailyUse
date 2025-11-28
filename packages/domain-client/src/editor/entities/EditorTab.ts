/**
 * EditorTab Entity - Client Implementation
 * 编辑器标签实体 - 客户端实现
 */

import type { EditorTabClient, EditorTabClientDTO, EditorTabServerDTO, TabViewStateClientDTO } from '@dailyuse/contracts/editor';
import { TabType } from '@dailyuse/contracts/editor';
import { TabType } from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { TabViewStateClient } from '../value-objects';

/**
 * EditorTab Entity (Client)
 *
 * DDD 实体职责：
 * - 有唯一标识符（uuid）
 * - 封装业务逻辑
 * - 管理自身状态
 */
export class EditorTab extends Entity implements EditorTabClient {
  // ===== 私有字段 =====
  private _groupUuid: string;
  private _sessionUuid: string;
  private _workspaceUuid: string;
  private _accountUuid: string;
  private _documentUuid: string | null;
  private _tabIndex: number;
  private _tabType: TabType;
  private _title: string;
  private _viewState: TabViewStateClient;
  private _isPinned: boolean;
  private _isDirty: boolean;
  private _lastAccessedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    groupUuid: string;
    sessionUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    documentUuid?: string | null;
    tabIndex: number;
    tabType: TabType;
    title: string;
    viewState: TabViewStateClient;
    isPinned: boolean;
    isDirty: boolean;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._groupUuid = params.groupUuid;
    this._sessionUuid = params.sessionUuid;
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._documentUuid = params.documentUuid ?? null;
    this._tabIndex = params.tabIndex;
    this._tabType = params.tabType;
    this._title = params.title;
    this._viewState = params.viewState;
    this._isPinned = params.isPinned;
    this._isDirty = params.isDirty;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get groupUuid(): string {
    return this._groupUuid;
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
  public get documentUuid(): string | null {
    return this._documentUuid;
  }
  public get tabIndex(): number {
    return this._tabIndex;
  }
  public get tabType(): TabType {
    return this._tabType;
  }
  public get title(): string {
    return this._title;
  }
  public get viewState(): TabViewStateClientDTO {
    return this._viewState.toClientDTO();
  }
  public get isPinned(): boolean {
    return this._isPinned;
  }
  public get isDirty(): boolean {
    return this._isDirty;
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

  // ===== UI 辅助方法 =====

  /**
   * 获取显示标题（包含脏标记）
   */
  public getDisplayTitle(): string {
    return this._isDirty ? `${this._title} •` : this._title;
  }

  /**
   * 获取标签类型标签
   */
  public getTabTypeLabel(): string {
    const labels: Record<TabType, string> = {
      [TabType.DOCUMENT]: '文档',
      [TabType.PREVIEW]: '预览',
      [TabType.DIFF]: '对比',
      [TabType.SETTINGS]: '设置',
      [TabType.SEARCH]: '搜索',
      [TabType.WELCOME]: '欢迎',
    };
    return labels[this._tabType] || this._tabType;
  }

  /**
   * 获取标签图标名称
   */
  public getIconName(): string {
    const icons: Record<TabType, string> = {
      [TabType.DOCUMENT]: 'document',
      [TabType.PREVIEW]: 'eye',
      [TabType.DIFF]: 'git-compare',
      [TabType.SETTINGS]: 'settings',
      [TabType.SEARCH]: 'search',
      [TabType.WELCOME]: 'home',
    };
    return icons[this._tabType] || 'file';
  }

  /**
   * 是否为文档标签
   */
  public isDocumentTab(): boolean {
    return this._tabType === TabType.DOCUMENT;
  }

  /**
   * 是否可以关闭（某些特殊标签可能不允许关闭）
   */
  public canClose(): boolean {
    // Welcome 标签通常不允许关闭
    return this._tabType !== TabType.WELCOME;
  }

  /**
   * 是否需要确认关闭（有未保存更改时）
   */
  public needsCloseConfirmation(): boolean {
    return this._isDirty && this.isDocumentTab();
  }

  /**
   * 获取格式化的最后访问时间
   */
  public getFormattedLastAccessed(): string | null {
    return this.formattedLastAccessed;
  }

  /**
   * 获取标签状态颜色（用于 UI 徽章）
   */
  public getStatusColor(): string {
    if (this._isDirty) return 'warning'; // 未保存
    if (this._isPinned) return 'info'; // 已固定
    return 'default';
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 EditorTab
   */
  public static create(params: {
    groupUuid: string;
    sessionUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    documentUuid?: string;
    tabIndex: number;
    tabType: TabType;
    title: string;
    viewState?: TabViewStateClient;
  }): EditorTab {
    const now = Date.now();
    return new EditorTab({
      groupUuid: params.groupUuid,
      sessionUuid: params.sessionUuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      documentUuid: params.documentUuid,
      tabIndex: params.tabIndex,
      tabType: params.tabType,
      title: params.title,
      viewState: params.viewState ?? TabViewStateClient.createDefault(),
      isPinned: false,
      isDirty: false,
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): EditorTabServerDTO {
    return {
      uuid: this._uuid,
      groupUuid: this._groupUuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      documentUuid: this._documentUuid,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      title: this._title,
      viewState: this._viewState.toServerDTO(),
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): EditorTabClientDTO {
    return {
      uuid: this._uuid,
      groupUuid: this._groupUuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      documentUuid: this._documentUuid,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      title: this._title,
      viewState: this._viewState.toClientDTO(),
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      formattedLastAccessed: this.formattedLastAccessed,
      formattedCreatedAt: this.formattedCreatedAt,
      formattedUpdatedAt: this.formattedUpdatedAt,
    };
  }

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: EditorTabServerDTO): EditorTab {
    return new EditorTab({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      documentUuid: dto.documentUuid,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      title: dto.title,
      viewState: TabViewStateClient.fromServerDTO(dto.viewState),
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 Client DTO 创建实体
   */
  public static fromClientDTO(dto: EditorTabClientDTO): EditorTab {
    return new EditorTab({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      documentUuid: dto.documentUuid,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      title: dto.title,
      viewState: TabViewStateClient.fromClientDTO(dto.viewState),
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
