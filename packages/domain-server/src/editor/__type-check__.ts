/**
 * Editor 模块类型检查测试文件
 * 用于验证所有 DTO 定义和实体实现
 */

import { EditorWorkspace } from './aggregates/EditorWorkspace';
import { EditorSession } from './entities/EditorSession';
import { EditorGroup } from './entities/EditorGroup';
import { EditorTab } from './entities/EditorTab';
import type { EditorGroupClientDTO, EditorGroupPersistenceDTO, EditorGroupServerDTO, EditorSessionClientDTO, EditorSessionPersistenceDTO, EditorSessionServerDTO, EditorTabClientDTO, EditorTabPersistenceDTO, EditorTabServerDTO, EditorWorkspaceClientDTO, EditorWorkspacePersistenceDTO, EditorWorkspaceServerDTO } from '@dailyuse/contracts/editor';
import { ProjectType, TabType } from '@dailyuse/contracts/editor';

// ===== 测试聚合根 =====
function testEditorWorkspace() {
  const workspace = EditorWorkspace.create({
    accountUuid: 'account-123',
    name: 'Test Workspace',
    projectPath: '/path/to/project',
    projectType: 'typescript' as ProjectType,
  });

  // 测试 DTO 转换
  const serverDTO: EditorWorkspaceServerDTO = workspace.toServerDTO();
  const clientDTO: EditorWorkspaceClientDTO = workspace.toClientDTO();
  const persistenceDTO: EditorWorkspacePersistenceDTO =
    workspace.toPersistenceDTO();

  // 测试 From DTO
  const fromServer = EditorWorkspace.fromServerDTO(serverDTO);
  const fromPersistence = EditorWorkspace.fromPersistenceDTO(persistenceDTO);
}

// ===== 测试实体 =====
function testEditorSession() {
  const session = EditorSession.create({
    workspaceUuid: 'workspace-123',
    accountUuid: 'account-123',
    name: 'Test Session',
  });

  // 测试 DTO 转换
  const serverDTO: EditorSessionServerDTO = session.toServerDTO();
  const clientDTO: EditorSessionClientDTO = session.toClientDTO();
  const persistenceDTO: EditorSessionPersistenceDTO = session.toPersistenceDTO();

  // 测试 From DTO
  const fromServer = EditorSession.fromServerDTO(serverDTO);
  const fromClient = EditorSession.fromClientDTO(clientDTO);
  const fromPersistence = EditorSession.fromPersistenceDTO(persistenceDTO);
}

function testEditorGroup() {
  const group = EditorGroup.create({
    sessionUuid: 'session-123',
    workspaceUuid: 'workspace-123',
    accountUuid: 'account-123',
    groupIndex: 0,
    name: 'Test Group',
  });

  // 测试 DTO 转换
  const serverDTO: EditorGroupServerDTO = group.toServerDTO();
  const clientDTO: EditorGroupClientDTO = group.toClientDTO();
  const persistenceDTO: EditorGroupPersistenceDTO = group.toPersistenceDTO();

  // 测试 From DTO
  const fromDTO = EditorGroup.fromDTO(serverDTO);
  const fromServer = EditorGroup.fromServerDTO(serverDTO);
  const fromClient = EditorGroup.fromClientDTO(clientDTO);
  const fromPersistence = EditorGroup.fromPersistenceDTO(persistenceDTO);
}

function testEditorTab() {
  const tab = EditorTab.create({
    groupUuid: 'group-123',
    sessionUuid: 'session-123',
    workspaceUuid: 'workspace-123',
    accountUuid: 'account-123',
    tabIndex: 0,
    title: 'Test Tab',
    tabType: 'document' as TabType,
  });

  // 测试 DTO 转换
  const serverDTO: EditorTabServerDTO = tab.toServerDTO();
  const clientDTO: EditorTabClientDTO = tab.toClientDTO();
  const persistenceDTO: EditorTabPersistenceDTO = tab.toPersistenceDTO();

  // 测试 From DTO
  const fromServer = EditorTab.fromServerDTO(serverDTO);
  const fromClient = EditorTab.fromClientDTO(clientDTO);
  const fromPersistence = EditorTab.fromPersistenceDTO(persistenceDTO);
}

// ===== 测试递归转换 =====
function testRecursiveConversion() {
  // 创建完整的聚合根结构
  const workspace = EditorWorkspace.create({
    accountUuid: 'account-123',
    name: 'Test Workspace',
    projectPath: '/path/to/project',
    projectType: 'typescript' as ProjectType,
  });

  // 添加会话
  const session = workspace.addSession({
    name: 'Session 1',
  });

  // 添加分组
  const group = session.addGroup({
    groupIndex: 0,
    name: 'Group 1',
  });

  // 添加标签页
  const tab = group.addTab({
    tabIndex: 0,
    title: 'Tab 1',
    tabType: 'document' as TabType,
  });

  // 测试递归转换
  const workspaceDTO = workspace.toServerDTO();

  // 验证结构完整性
  const hasSession = workspaceDTO.sessions.length > 0;
  const hasGroup = workspaceDTO.sessions[0].groups.length > 0;
  const hasTab = workspaceDTO.sessions[0].groups[0].tabs.length > 0;

  // 测试递归重建
  const rebuilt = EditorWorkspace.fromServerDTO(workspaceDTO);
  const rebuiltSession = rebuilt.getAllSessions()[0];
  const rebuiltGroup = rebuiltSession.getAllGroups()[0];
  const rebuiltTab = rebuiltGroup.getAllTabs()[0];
}

// ===== 导出测试函数（避免未使用警告） =====
export {
  testEditorWorkspace,
  testEditorSession,
  testEditorGroup,
  testEditorTab,
  testRecursiveConversion,
};
