/**
 * EditorWorkspace Aggregate Root - Client Implementation
 * 编辑器工作区聚合根 - 客户端实现
 */

import type { EditorContracts } from '@dailyuse/contracts';
import { EditorContracts as EC } from '@dailyuse/contracts';
import { AggregateRoot } from '@dailyuse/utils';
import { WorkspaceLayoutClient, WorkspaceSettingsClient } from '../value-objects';
import { EditorSessionClient } from '../entities';

type IEditorWorkspaceClient = EditorContracts.EditorWorkspaceClient;
type EditorWorkspaceClientDTO = EditorContracts.EditorWorkspaceClientDTO;
type EditorWorkspaceServerDTO = EditorContracts.EditorWorkspaceServerDTO;
type ProjectType = EditorContracts.ProjectType;

/**
 * EditorWorkspace Aggregate Root (Client)
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体（EditorSession）
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class EditorWorkspace extends AggregateRoot implements IEditorWorkspaceClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _projectPath: string;
  private _projectType: ProjectType;
  private _layout: WorkspaceLayoutClient;
  private _settings: WorkspaceSettingsClient;
  private _isActive: boolean;
  private _lastActiveSessionUuid: string | null;
  private _lastAccessedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  private _sessions: EditorSessionClient[];

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    projectPath: string;
    projectType: ProjectType;
    layout: WorkspaceLayoutClient;
    settings: WorkspaceSettingsClient;
    isActive: boolean;
    lastActiveSessionUuid?: string | null;
    lastAccessedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._projectPath = params.projectPath;
    this._projectType = params.projectType;
    this._layout = params.layout;
    this._settings = params.settings;
    this._isActive = params.isActive;
    this._lastActiveSessionUuid = params.lastActiveSessionUuid ?? null;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._sessions = [];
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
  public get projectPath(): string {
    return this._projectPath;
  }
  public get projectType(): ProjectType {
    return this._projectType;
  }
  public get layout(): WorkspaceLayoutClient {
    return this._layout;
  }
  public get settings(): WorkspaceSettingsClient {
    return this._settings;
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get lastActiveSessionUuid(): string | null {
    return this._lastActiveSessionUuid;
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

  public get sessions(): EditorSessionClient[] {
    return [...this._sessions];
  }

  // UI 属性
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
   * 获取显示名称
   */
  public getDisplayName(): string {
    return this._name || this._projectPath.split(/[/\\]/).pop() || 'Unnamed Workspace';
  }

  /**
   * 获取项目类型标签
   */
  public getProjectTypeLabel(): string {
    const labels: Record<ProjectType, string> = {
      [EC.ProjectType.MARKDOWN]: 'Markdown',
      [EC.ProjectType.CODE]: '代码',
      [EC.ProjectType.MIXED]: '混合',
      [EC.ProjectType.OTHER]: '其他',
    };
    return labels[this._projectType] || this._projectType;
  }

  /**
   * 获取状态颜色
   */
  public getStatusColor(): string {
    return this._isActive ? 'success' : 'default';
  }

  /**
   * 是否可以激活
   */
  public canActivate(): boolean {
    return !this._isActive && this._sessions.length > 0;
  }

  /**
   * 格式化最后访问时间
   */
  public getFormattedLastAccessed(): string | null {
    return this.formattedLastAccessed;
  }

  // ===== 工厂方法 =====

  /**
   * 创建一个空的 EditorWorkspace 实例（用于新建表单）
   */
  public static forCreate(accountUuid: string): EditorWorkspace {
    const now = Date.now();
    return new EditorWorkspace({
      accountUuid,
      name: '',
      description: null,
      projectPath: '',
      projectType: EC.ProjectType.MARKDOWN,
      layout: WorkspaceLayoutClient.createDefault(),
      settings: WorkspaceSettingsClient.createDefault(),
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  public clone(): EditorWorkspace {
    return EditorWorkspace.fromClientDTO(this.toClientDTO());
  }

  /**
   * 创建新的 EditorWorkspace 聚合根
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    projectPath: string;
    projectType?: ProjectType;
    layout?: WorkspaceLayoutClient;
    settings?: WorkspaceSettingsClient;
  }): EditorWorkspace {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    return new EditorWorkspace({
      uuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      projectPath: params.projectPath,
      projectType: params.projectType ?? EC.ProjectType.MARKDOWN,
      layout: params.layout ?? WorkspaceLayoutClient.createDefault(),
      settings: params.settings ?? WorkspaceSettingsClient.createDefault(),
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建子实体：EditorSession
   */
  public createSession(params: { name: string; description?: string }): EditorSessionClient {
    return EditorSessionClient.create({
      workspaceUuid: this._uuid,
      accountUuid: this._accountUuid,
      name: params.name,
      description: params.description,
    });
  }

  // ===== 子实体管理方法 =====

  public addSession(session: EditorSessionClient): void {
    if (!(session instanceof EditorSessionClient)) {
      throw new Error('Session must be an instance of EditorSessionClient');
    }
    this._sessions.push(session);
    this._updatedAt = Date.now();
  }

  public removeSession(sessionUuid: string): EditorSessionClient | null {
    const index = this._sessions.findIndex((s) => s.uuid === sessionUuid);
    if (index === -1) {
      return null;
    }
    const removed = this._sessions.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getSession(uuid: string): EditorSessionClient | null {
    return this._sessions.find((s) => s.uuid === uuid) ?? null;
  }

  public getAllSessions(): EditorSessionClient[] {
    return [...this._sessions];
  }

  public getActiveSession(): EditorSessionClient | null {
    return this._sessions.find((s) => s.isActive) ?? null;
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   */
  public toServerDTO(): EditorWorkspaceServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      projectPath: this._projectPath,
      projectType: this._projectType,
      layout: this._layout.toServerDTO(),
      settings: this._settings.toServerDTO(),
      sessions: this._sessions.map((s) => s.toServerDTO()),
      isActive: this._isActive,
      lastActiveSessionUuid: this._lastActiveSessionUuid,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO（递归转换子实体）
   */
  public toClientDTO(): EditorWorkspaceClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      projectPath: this._projectPath,
      projectType: this._projectType,
      layout: this._layout.toClientDTO(),
      settings: this._settings.toClientDTO(),
      sessions: this._sessions.map((s) => s.toClientDTO()),
      isActive: this._isActive,
      lastActiveSessionUuid: this._lastActiveSessionUuid,
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
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  public static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspace {
    const workspace = new EditorWorkspace({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: WorkspaceLayoutClient.fromServerDTO(dto.layout),
      settings: WorkspaceSettingsClient.fromServerDTO(dto.settings),
      isActive: dto.isActive,
      lastActiveSessionUuid: dto.lastActiveSessionUuid,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    workspace._sessions = dto.sessions.map((s) => EditorSessionClient.fromServerDTO(s));

    return workspace;
  }

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  public static fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspace {
    const workspace = new EditorWorkspace({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: WorkspaceLayoutClient.fromClientDTO(dto.layout),
      settings: WorkspaceSettingsClient.fromClientDTO(dto.settings),
      isActive: dto.isActive,
      lastActiveSessionUuid: dto.lastActiveSessionUuid,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体
    workspace._sessions = dto.sessions.map((s) => EditorSessionClient.fromClientDTO(s));

    return workspace;
  }
}
