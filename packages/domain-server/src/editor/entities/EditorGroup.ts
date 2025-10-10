/**
 * EditorGroup 实体实现
 * 实现 EditorGroupServer 接口
 * 作为 EditorSession 实体的子实体
 */

import { EditorContracts } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';
import { EditorTab } from './EditorTab';

type IEditorGroupServer = EditorContracts.EditorGroupServer;
type EditorGroupServerDTO = EditorContracts.EditorGroupServerDTO;
type EditorGroupClientDTO = EditorContracts.EditorGroupClientDTO;
type EditorGroupPersistenceDTO = EditorContracts.EditorGroupPersistenceDTO;

/**
 * EditorGroup 实体
 * 作为 EditorSession 实体的子实体
 */
export class EditorGroup extends Entity implements IEditorGroupServer {
  // ===== 私有字段 =====
  private _sessionUuid: string; // 父实体外键
  private _workspaceUuid: string; // 聚合根外键
  private _accountUuid: string;
  private _groupIndex: number;
  private _activeTabIndex: number;
  private _name: string | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体 =====
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
    tabs?: EditorTab[];
  }) {
    super(params.uuid || Entity.generateUUID());
    this._sessionUuid = params.sessionUuid;
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._groupIndex = params.groupIndex;
    this._activeTabIndex = params.activeTabIndex;
    this._name = params.name ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._tabs = params.tabs ?? [];
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
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
    return [...this._tabs]; // 返回副本，防止外部修改
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
    const uuid = crypto.randomUUID();
    const now = Date.now();

    return new EditorGroup({
      uuid,
      sessionUuid: params.sessionUuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      groupIndex: params.groupIndex,
      activeTabIndex: 0,
      name: params.name,
      createdAt: now,
      updatedAt: now,
      tabs: [],
    });
  }

  /**
   * 从 DTO 重建
   */
  public static fromDTO(dto: EditorGroupServerDTO): EditorGroup {
    const tabs = dto.tabs.map((tabDto) => EditorTab.fromServerDTO(tabDto));

    return new EditorGroup({
      uuid: dto.uuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      groupIndex: dto.groupIndex,
      activeTabIndex: dto.activeTabIndex,
      name: dto.name,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      tabs,
    });
  }

  // ===== 业务方法 =====

  /**
   * 设置活动标签
   */
  public setActiveTab(tabIndex: number): void {
    if (this.isValidTabIndex(tabIndex)) {
      this._activeTabIndex = tabIndex;
      this._updatedAt = Date.now();
    }
  }

  /**
   * 重命名分组
   */
  public rename(name: string | null): void {
    this._name = name;
    this._updatedAt = Date.now();
  }

  /**
   * 更新分组索引
   */
  public updateGroupIndex(newIndex: number): void {
    this._groupIndex = newIndex;
    this._updatedAt = Date.now();
  }

  /**
   * 验证标签索引
   */
  public isValidTabIndex(tabIndex: number): boolean {
    return tabIndex >= 0 && tabIndex < this._tabs.length;
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加标签（工厂方法）
   * 创建新的 EditorTab 并添加到组中
   */
  public addTab(params: {
    documentUuid?: string | null;
    tabIndex: number;
    tabType: EditorContracts.TabType;
    title: string;
    viewState?: Partial<EditorContracts.TabViewStateServerDTO>;
    isPinned?: boolean;
  }): EditorTab {
    const tab = EditorTab.create({
      groupUuid: this._uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      ...params,
    });
    this._tabs.push(tab);
    this._updatedAt = Date.now();
    return tab;
  }

  /**
   * 添加已存在的标签（用于从持久化恢复）
   * 注意：这个方法不应该在业务逻辑中使用，只用于重建聚合
   */
  public addExistingTab(tab: EditorTab): void {
    this._tabs.push(tab);
  }

  /**
   * 移除标签
   */
  public removeTab(tabUuid: string): boolean {
    const index = this._tabs.findIndex((t) => t.uuid === tabUuid);
    if (index !== -1) {
      this._tabs.splice(index, 1);
      this._updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 获取标签
   */
  public getTab(tabUuid: string): EditorTab | undefined {
    return this._tabs.find((t) => t.uuid === tabUuid);
  }

  /**
   * 获取所有标签
   */
  public getAllTabs(): EditorTab[] {
    return [...this._tabs];
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): EditorGroupServerDTO {
    return {
      uuid: this._uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((tab) => tab.toServerDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): EditorGroupClientDTO {
    return {
      uuid: this._uuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((tab) => tab.toClientDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString(),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString(),
    };
  }

  public toPersistenceDTO(): EditorGroupPersistenceDTO {
    return {
      uuid: this._uuid,
      session_uuid: this._sessionUuid,
      workspace_uuid: this._workspaceUuid,
      account_uuid: this._accountUuid,
      group_index: this._groupIndex,
      active_tab_index: this._activeTabIndex,
      name: this._name,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
    };
  }

  // ===== From DTO 方法 =====

  /**
   * 从 Server DTO 创建实体 (递归重建子实体)
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

    // ✅ 递归重建子实体
    group._tabs = dto.tabs.map((tabDto) => EditorTab.fromServerDTO(tabDto));

    return group;
  }

  /**
   * 从 Client DTO 创建实体 (递归重建子实体)
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

    // ✅ 递归重建子实体
    group._tabs = dto.tabs.map((tabDto) => EditorTab.fromClientDTO(tabDto));

    return group;
  }

  /**
   * 从 Persistence DTO 创建实体 (递归重建子实体)
   */
  public static fromPersistenceDTO(dto: EditorGroupPersistenceDTO): EditorGroup {
    const group = new EditorGroup({
      uuid: dto.uuid,
      sessionUuid: dto.session_uuid,
      workspaceUuid: dto.workspace_uuid,
      accountUuid: dto.account_uuid,
      groupIndex: dto.group_index,
      activeTabIndex: dto.active_tab_index,
      name: dto.name,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    });

    // ✅ 递归重建子实体 (如果 DTO 包含tabs数据)
    if (dto.tabs) {
      group._tabs = dto.tabs.map((tabDto) => EditorTab.fromPersistenceDTO(tabDto));
    }

    return group;
  }
}
