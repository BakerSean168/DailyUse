import type { IEditorWorkspaceRepository } from '@dailyuse/domain-server';
import { EditorContainer } from '../../infrastructure/di/EditorContainer';
import { EditorWorkspaceDomainService } from '@dailyuse/domain-server';
import type { EditorContracts } from '@dailyuse/contracts';

/**
 * EditorWorkspace 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class EditorWorkspaceApplicationService {
  private static instance: EditorWorkspaceApplicationService;
  private domainService: EditorWorkspaceDomainService;
  private repository: IEditorWorkspaceRepository;

  private constructor(repository: IEditorWorkspaceRepository) {
    this.domainService = new EditorWorkspaceDomainService(repository);
    this.repository = repository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    repository?: IEditorWorkspaceRepository,
  ): Promise<EditorWorkspaceApplicationService> {
    const container = EditorContainer.getInstance();
    const repo = repository || container.getEditorWorkspaceRepository();

    EditorWorkspaceApplicationService.instance = new EditorWorkspaceApplicationService(repo);
    return EditorWorkspaceApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<EditorWorkspaceApplicationService> {
    if (!EditorWorkspaceApplicationService.instance) {
      EditorWorkspaceApplicationService.instance =
        await EditorWorkspaceApplicationService.createInstance();
    }
    return EditorWorkspaceApplicationService.instance;
  }

  // ===== Workspace 管理 =====

  /**
   * 创建工作区
   */
  async createWorkspace(params: {
    accountUuid: string;
    name: string;
    description?: string;
    projectPath: string;
    projectType: EditorContracts.ProjectType;
    layout?: Partial<EditorContracts.WorkspaceLayoutServerDTO>;
    settings?: Partial<EditorContracts.WorkspaceSettingsServerDTO>;
  }): Promise<EditorContracts.EditorWorkspaceServerDTO> {
    // 委托给领域服务处理业务逻辑
    const workspace = await this.domainService.createWorkspace(params);

    // 转换为 DTO
    return workspace.toClientDTO();
  }

  /**
   * 获取工作区详情
   */
  async getWorkspace(
    uuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorContracts.EditorWorkspaceServerDTO | null> {
    // 委托给领域服务处理
    const workspace = await this.domainService.getWorkspace(uuid, options);

    return workspace ? workspace.toClientDTO() : null;
  }

  /**
   * 获取账户的所有工作区
   */
  async getWorkspacesByAccount(
    accountUuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorContracts.EditorWorkspaceServerDTO[]> {
    // 委托给领域服务处理
    const workspaces = await this.domainService.getWorkspacesByAccount(accountUuid, options);

    // 转换为 DTO 数组
    return workspaces.map((workspace) => workspace.toClientDTO());
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(params: {
    uuid: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<EditorContracts.EditorWorkspaceServerDTO> {
    // 委托给领域服务处理
    const workspace = await this.domainService.updateWorkspace(params);

    return workspace.toClientDTO();
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(uuid: string): Promise<boolean> {
    // 委托给领域服务处理
    return await this.domainService.deleteWorkspace(uuid);
  }

  // ===== Session 管理 =====

  /**
   * 添加会话到工作区
   */
  async addSession(params: {
    workspaceUuid: string;
    name: string;
    layout?: Partial<EditorContracts.SessionLayoutServerDTO>;
  }): Promise<EditorContracts.EditorSessionServerDTO> {
    // 委托给领域服务处理
    const session = await this.domainService.addSession(params);

    return session.toClientDTO();
  }

  /**
   * 获取工作区的所有会话
   */
  async getSessions(workspaceUuid: string): Promise<EditorContracts.EditorSessionServerDTO[]> {
    // 委托给领域服务处理
    const sessions = await this.domainService.getSessions(workspaceUuid);

    return sessions.map((session) => session.toClientDTO());
  }

  /**
   * 更新会话
   */
  async updateSession(params: {
    workspaceUuid: string;
    sessionUuid: string;
    name?: string;
    layout?: Partial<EditorContracts.SessionLayoutServerDTO>;
    isActive?: boolean;
  }): Promise<EditorContracts.EditorSessionServerDTO> {
    // 委托给领域服务处理
    const session = await this.domainService.updateSession(params);

    return session.toClientDTO();
  }

  /**
   * 删除会话
   */
  async removeSession(workspaceUuid: string, sessionUuid: string): Promise<boolean> {
    // 委托给领域服务处理
    return await this.domainService.removeSession(workspaceUuid, sessionUuid);
  }

  // ===== Group 管理 =====

  /**
   * 添加组到会话
   */
  async addGroup(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupIndex: number;
    name?: string;
  }): Promise<EditorContracts.EditorGroupServerDTO> {
    // 委托给领域服务处理
    const group = await this.domainService.addGroup(params);

    return group.toClientDTO();
  }

  /**
   * 更新组
   */
  async updateGroup(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    groupIndex?: number;
    name?: string;
    splitDirection?: EditorContracts.SplitDirection;
  }): Promise<EditorContracts.EditorGroupServerDTO> {
    // 委托给领域服务处理
    const group = await this.domainService.updateGroup(params);

    return group.toClientDTO();
  }

  /**
   * 删除组
   */
  async removeGroup(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
  ): Promise<boolean> {
    // 委托给领域服务处理
    return await this.domainService.removeGroup(workspaceUuid, sessionUuid, groupUuid);
  }

  // ===== Tab 管理 =====

  /**
   * 添加标签到组
   */
  async addTab(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    documentUuid?: string;
    tabIndex: number;
    tabType: EditorContracts.TabType;
    title: string;
    viewState?: Partial<EditorContracts.TabViewStateServerDTO>;
    isPinned?: boolean;
  }): Promise<EditorContracts.EditorTabServerDTO> {
    // 委托给领域服务处理
    const tab = await this.domainService.addTab(params);

    return tab.toClientDTO();
  }

  /**
   * 更新标签
   */
  async updateTab(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    tabUuid: string;
    tabIndex?: number;
    title?: string;
    viewState?: Partial<EditorContracts.TabViewStateServerDTO>;
    isPinned?: boolean;
  }): Promise<EditorContracts.EditorTabServerDTO> {
    // 委托给领域服务处理
    const tab = await this.domainService.updateTab(params);

    return tab.toClientDTO();
  }

  /**
   * 删除标签
   */
  async removeTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<boolean> {
    // 委托给领域服务处理
    return await this.domainService.removeTab(workspaceUuid, sessionUuid, groupUuid, tabUuid);
  }

  // ===== 激活状态管理 =====

  /**
   * 激活会话
   */
  async activateSession(workspaceUuid: string, sessionUuid: string): Promise<void> {
    await this.domainService.activateSession(workspaceUuid, sessionUuid);
  }

  /**
   * 停用会话
   */
  async deactivateSession(workspaceUuid: string, sessionUuid: string): Promise<void> {
    await this.domainService.deactivateSession(workspaceUuid, sessionUuid);
  }

  /**
   * 激活标签
   */
  async activateTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<void> {
    await this.domainService.activateTab(workspaceUuid, sessionUuid, groupUuid, tabUuid);
  }

  /**
   * 停用标签
   */
  async deactivateTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<void> {
    await this.domainService.deactivateTab(workspaceUuid, sessionUuid, groupUuid, tabUuid);
  }
}
