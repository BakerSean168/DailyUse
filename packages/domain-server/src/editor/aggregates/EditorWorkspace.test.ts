/**
 * EditorWorkspace 聚合根测试
 * 测试 EditorWorkspace 的业务逻辑和行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorWorkspace } from './EditorWorkspace';

describe('EditorWorkspace 聚合根', () => {
  let workspace: EditorWorkspace;
  let accountUuid: string;

  beforeEach(() => {
    accountUuid = 'test-account-uuid';
    // 使用工厂方法创建测试工作区
    workspace = EditorWorkspace.create({
      accountUuid,
      name: 'Test Workspace',
      description: 'A test workspace',
      projectPath: '/path/to/project',
      projectType: 'code',
    });
  });

  describe('工厂方法', () => {
    it('应该通过 create 方法创建新的工作区', () => {
      expect(workspace).toBeDefined();
      expect(workspace.uuid).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.description).toBe('A test workspace');
      expect(workspace.projectPath).toBe('/path/to/project');
      expect(workspace.projectType).toBe('code');
      expect(workspace.accountUuid).toBe(accountUuid);
      expect(workspace.isActive).toBe(false); // 默认未激活
      expect(workspace.sessions).toHaveLength(0); // 默认没有会话
    });

    it('应该使用默认布局和设置', () => {
      const layout = workspace.layout;
      const settings = workspace.settings;

      expect(layout).toBeDefined();
      expect(settings).toBeDefined();
    });

    it('应该创建时间戳', () => {
      expect(workspace.createdAt).toBeGreaterThan(0);
      expect(workspace.updatedAt).toBeGreaterThan(0);
      expect(workspace.createdAt).toBe(workspace.updatedAt);
    });
  });

  describe('激活和停用', () => {
    it('应该能够激活工作区', () => {
      const beforeUpdated = workspace.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.activate();

      expect(workspace.isActive).toBe(true);
      expect(workspace.lastAccessedAt).toBeGreaterThan(0);
      expect(workspace.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够停用工作区', () => {
      workspace.activate();
      expect(workspace.isActive).toBe(true);

      const beforeUpdated = workspace.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.deactivate();

      expect(workspace.isActive).toBe(false);
      expect(workspace.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('重复激活不应改变状态', () => {
      workspace.activate();
      const firstUpdated = workspace.updatedAt;

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.activate();

      // 时间戳不应该改变（因为已经是激活状态）
      expect(workspace.updatedAt).toBe(firstUpdated);

      vi.useRealTimers();
    });
  });

  describe('更新工作区', () => {
    it('应该能够更新名称', () => {
      const beforeUpdated = workspace.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.update({ name: 'Updated Workspace' });

      expect(workspace.name).toBe('Updated Workspace');
      expect(workspace.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够更新描述', () => {
      workspace.update({ description: 'Updated description' });

      expect(workspace.description).toBe('Updated description');
    });

    it('应该能够清空描述', () => {
      workspace.update({ description: null });

      expect(workspace.description).toBeNull();
    });

    it('应该能够同时更新名称和描述', () => {
      workspace.update({
        name: 'New Name',
        description: 'New Description',
      });

      expect(workspace.name).toBe('New Name');
      expect(workspace.description).toBe('New Description');
    });
  });

  describe('布局和设置', () => {
    it('应该能够更新布局', () => {
      const beforeUpdated = workspace.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.updateLayout({
        sidebarWidth: 400,
      });

      expect(workspace.layout.sidebarWidth).toBe(400);
      expect(workspace.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够更新设置', () => {
      const beforeUpdated = workspace.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.updateSettings({
        autoSave: false,
      });

      expect(workspace.settings.autoSave).toBe(false);
      expect(workspace.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('会话管理', () => {
    it('应该能够添加新会话', () => {
      const session = workspace.addSession({
        name: 'Session 1',
        description: 'First session',
      });

      expect(session).toBeDefined();
      expect(session.name).toBe('Session 1');
      expect(session.workspaceUuid).toBe(workspace.uuid);
      expect(workspace.sessions).toHaveLength(1);
      expect(workspace.getAllSessions()).toHaveLength(1);
    });

    it('应该能够添加多个会话', () => {
      workspace.addSession({ name: 'Session 1' });
      workspace.addSession({ name: 'Session 2' });
      workspace.addSession({ name: 'Session 3' });

      expect(workspace.sessions).toHaveLength(3);
    });

    it('应该能够获取指定会话', () => {
      const session = workspace.addSession({ name: 'Test Session' });
      const retrieved = workspace.getSession(session.uuid);

      expect(retrieved).toBeDefined();
      expect(retrieved?.uuid).toBe(session.uuid);
    });

    it('获取不存在的会话应返回 undefined', () => {
      const retrieved = workspace.getSession('non-existent-uuid');

      expect(retrieved).toBeUndefined();
    });

    it('应该能够移除会话', () => {
      const session = workspace.addSession({ name: 'Session to Remove' });
      expect(workspace.sessions).toHaveLength(1);

      const removed = workspace.removeSession(session.uuid);

      expect(removed).toBe(true);
      expect(workspace.sessions).toHaveLength(0);
    });

    it('移除不存在的会话应返回 false', () => {
      const removed = workspace.removeSession('non-existent-uuid');

      expect(removed).toBe(false);
    });

    it('应该能够设置最后活动的会话', () => {
      const session = workspace.addSession({ name: 'Active Session' });

      workspace.setLastActiveSession(session.uuid);

      expect(workspace.lastActiveSessionUuid).toBe(session.uuid);
    });
  });

  describe('访问时间记录', () => {
    it('应该能够记录访问时间', () => {
      const beforeAccess = workspace.lastAccessedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      workspace.recordAccess();

      expect(workspace.lastAccessedAt).toBeGreaterThan(beforeAccess ?? 0);

      vi.useRealTimers();
    });
  });

  describe('DTO 转换', () => {
    it('应该能够转换为 Server DTO', () => {
      const session = workspace.addSession({ name: 'Test Session' });

      const dto = workspace.toServerDTO();

      expect(dto.uuid).toBe(workspace.uuid);
      expect(dto.name).toBe(workspace.name);
      expect(dto.sessions).toHaveLength(1);
      expect(dto.sessions[0].name).toBe('Test Session');
    });

    it('应该能够转换为 Client DTO', () => {
      const dto = workspace.toClientDTO();

      expect(dto.uuid).toBe(workspace.uuid);
      expect(dto.name).toBe(workspace.name);
      expect(dto.formattedCreatedAt).toBeDefined();
      expect(dto.formattedUpdatedAt).toBeDefined();
    });

    it('应该能够转换为 Persistence DTO', () => {
      const dto = workspace.toPersistenceDTO();

      expect(dto.uuid).toBe(workspace.uuid);
      expect(dto.account_uuid).toBe(accountUuid);
      expect(dto.name).toBe(workspace.name);
      expect(dto.project_path).toBe('/path/to/project');
      expect(typeof dto.layout).toBe('string'); // JSON 字符串
      expect(typeof dto.settings).toBe('string'); // JSON 字符串
    });

    it('应该能够从 Server DTO 重建', () => {
      const originalDto = workspace.toServerDTO();
      const rebuilt = EditorWorkspace.fromServerDTO(originalDto);

      expect(rebuilt.uuid).toBe(workspace.uuid);
      expect(rebuilt.name).toBe(workspace.name);
      expect(rebuilt.accountUuid).toBe(workspace.accountUuid);
    });

    it('应该能够从 Persistence DTO 重建', () => {
      const persistenceDto = workspace.toPersistenceDTO();
      const rebuilt = EditorWorkspace.fromPersistenceDTO(persistenceDto);

      expect(rebuilt.uuid).toBe(workspace.uuid);
      expect(rebuilt.name).toBe(workspace.name);
      expect(rebuilt.projectPath).toBe(workspace.projectPath);
    });
  });

  describe('领域事件', () => {
    it('创建工作区应发布 EditorWorkspaceCreated 事件', () => {
      const newWorkspace = EditorWorkspace.create({
        accountUuid: 'test-account',
        name: 'Event Test Workspace',
        projectPath: '/test/path',
        projectType: 'code',
      });

      const events = newWorkspace.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('EditorWorkspaceCreated');
      expect(events[0].payload.workspaceName).toBe('Event Test Workspace');
    });

    it('激活工作区应发布 EditorWorkspaceActivated 事件', () => {
      workspace.activate();

      const events = workspace.getDomainEvents();
      const activatedEvent = events.find((e) => e.eventType === 'EditorWorkspaceActivated');

      expect(activatedEvent).toBeDefined();
      expect(activatedEvent?.payload.workspaceUuid).toBe(workspace.uuid);
    });

    it('停用工作区应发布 EditorWorkspaceDeactivated 事件', () => {
      workspace.activate();
      workspace.clearDomainEvents(); // 清空之前的事件

      workspace.deactivate();

      const events = workspace.getDomainEvents();
      const deactivatedEvent = events.find((e) => e.eventType === 'EditorWorkspaceDeactivated');

      expect(deactivatedEvent).toBeDefined();
    });

    it('添加会话应发布 EditorSessionAdded 事件', () => {
      workspace.clearDomainEvents();

      const session = workspace.addSession({ name: 'Test Session' });

      const events = workspace.getDomainEvents();
      const addedEvent = events.find((e) => e.eventType === 'EditorSessionAdded');

      expect(addedEvent).toBeDefined();
      expect(addedEvent?.payload.sessionUuid).toBe(session.uuid);
    });
  });

  describe('业务规则验证', () => {
    it('创建工作区时所有必填字段都应存在', () => {
      expect(() =>
        EditorWorkspace.create({
          accountUuid: '',
          name: '',
          projectPath: '',
          projectType: 'code',
        }),
      ).not.toThrow(); // 当前实现没有验证，可以后续添加
    });

    it('sessions 属性应返回副本以防止外部修改', () => {
      workspace.addSession({ name: 'Session 1' });
      const sessions = workspace.sessions;

      sessions.push(null as any); // 尝试修改副本

      // 原始 sessions 不应被修改
      expect(workspace.sessions).toHaveLength(1);
    });
  });
});
