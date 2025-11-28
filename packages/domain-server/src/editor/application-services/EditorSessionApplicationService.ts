/**
 * EditorSessionApplicationService
 * 编辑器会话应用服务
 */

import type { IEditorSessionRepository } from '../repositories/IEditorSessionRepository';
import type { IEditorWorkspaceRepository } from '../repositories/IEditorWorkspaceRepository';
import type { IEditorGroupRepository } from '../repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../repositories/IEditorTabRepository';
import type { CreateEditorSessionRequest, EditorSessionClientDTO, UpdateEditorSessionRequest } from '@dailyuse/contracts/editor';
import { EditorSession } from '../entities/EditorSession';
import { SessionLayout } from '../value-objects/SessionLayout';

/**
 * EditorSession 应用服务
 */
export class EditorSessionApplicationService {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly workspaceRepository: IEditorWorkspaceRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  /**
   * 创建新会话
   */
  async createSession(
    accountUuid: string,
    request: CreateSessionRequest,
  ): Promise<SessionClientDTO> {
    // 检查工作区是否存在
    const workspace = await this.workspaceRepository.findByUuid(request.workspaceUuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${request.workspaceUuid}`);
    }

    // 创建会话
    const session = EditorSession.create({
      workspaceUuid: request.workspaceUuid,
      accountUuid,
      name: request.name,
      description: request.description ?? undefined,
      layout: request.layout ?? undefined,
    });

    // 保存
    await this.sessionRepository.save(session);

    return session.toClientDTO();
  }

  /**
   * 更新会话
   */
  async updateSession(uuid: string, request: UpdateSessionRequest): Promise<SessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(uuid);
    if (!session) {
      throw new Error(`会话不存在: ${uuid}`);
    }

    // 更新基本信息
    if (request.name) {
      session.rename(request.name);
    }

    if (request.description !== undefined) {
      session.updateDescription(request.description);
    }

    // 更新活动分组
    if (request.activeGroupIndex !== undefined) {
      session.setActiveGroup(request.activeGroupIndex);
    }

    // 更新布局
    if (request.layout) {
      const currentLayout = session.layout;
      const layout = SessionLayout.fromServerDTO({
        ...currentLayout,
        ...request.layout,
      });
      session.updateLayout(layout);
    }

    await this.sessionRepository.save(session);

    return session.toClientDTO();
  }

  /**
   * 激活会话
   */
  async activateSession(uuid: string, workspaceUuid: string): Promise<SessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(uuid);
    if (!session) {
      throw new Error(`会话不存在: ${uuid}`);
    }

    // 取消其他会话的激活状态
    const activeSession = await this.sessionRepository.findActiveByWorkspaceUuid(workspaceUuid);
    if (activeSession && activeSession.uuid !== uuid) {
      activeSession.deactivate();
      await this.sessionRepository.save(activeSession);
    }

    // 激活当前会话
    session.activate();
    await this.sessionRepository.save(session);

    return session.toClientDTO();
  }

  /**
   * 删除会话
   */
  async deleteSession(uuid: string): Promise<void> {
    const session = await this.sessionRepository.findByUuid(uuid);
    if (!session) {
      throw new Error(`会话不存在: ${uuid}`);
    }

    // 删除所有分组和标签
    const groups = await this.groupRepository.findBySessionUuid(uuid);
    for (const group of groups) {
      await this.tabRepository.deleteByGroupUuid(group.uuid);
    }
    await this.groupRepository.deleteBySessionUuid(uuid);

    // 删除会话
    await this.sessionRepository.delete(uuid);
  }

  /**
   * 获取会话详情
   */
  async getSession(uuid: string): Promise<SessionClientDTO | null> {
    const session = await this.sessionRepository.findByUuid(uuid);
    return session ? session.toClientDTO() : null;
  }

  /**
   * 获取工作区的所有会话
   */
  async listSessions(workspaceUuid: string): Promise<SessionClientDTO[]> {
    const sessions = await this.sessionRepository.findByWorkspaceUuid(workspaceUuid);
    return sessions.map((s) => s.toClientDTO());
  }

  /**
   * 获取活动会话
   */
  async getActiveSession(workspaceUuid: string): Promise<SessionClientDTO | null> {
    const session = await this.sessionRepository.findActiveByWorkspaceUuid(workspaceUuid);
    return session ? session.toClientDTO() : null;
  }

  /**
   * 添加分组
   */
  async addGroup(sessionUuid: string, name?: string): Promise<SessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error(`会话不存在: ${sessionUuid}`);
    }

    const groupCount = await this.groupRepository.countBySessionUuid(sessionUuid);
    session.addGroup({ groupIndex: groupCount, name: name ?? undefined });

    await this.sessionRepository.save(session);

    return session.toClientDTO();
  }

  /**
   * 移除分组
   */
  async removeGroup(sessionUuid: string, groupUuid: string): Promise<SessionClientDTO> {
    const session = await this.sessionRepository.findByUuid(sessionUuid);
    if (!session) {
      throw new Error(`会话不存在: ${sessionUuid}`);
    }

    session.removeGroup(groupUuid);

    await this.sessionRepository.save(session);

    return session.toClientDTO();
  }
}
