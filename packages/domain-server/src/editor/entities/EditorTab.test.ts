/**
 * EditorTab 实体测试
 * 测试 EditorTab 的业务逻辑和行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorTab } from './EditorTab';
import { TabType } from '@dailyuse/contracts/editor';

describe('EditorTab 实体', () => {
  let tab: EditorTab;
  const groupUuid = 'test-group-uuid';
  const sessionUuid = 'test-session-uuid';
  const workspaceUuid = 'test-workspace-uuid';
  const accountUuid = 'test-account-uuid';

  beforeEach(() => {
    tab = EditorTab.create({
      groupUuid,
      sessionUuid,
      workspaceUuid,
      accountUuid,
      documentUuid: 'doc-123',
      tabIndex: 0,
      tabType: TabType.DOCUMENT,
      title: 'Test Document',
    });
  });

  describe('工厂方法', () => {
    it('应该通过 create 方法创建新标签', () => {
      expect(tab).toBeDefined();
      expect(tab.uuid).toBeDefined();
      expect(tab.title).toBe('Test Document');
      expect(tab.tabIndex).toBe(0);
      expect(tab.tabType).toBe('document');
      expect(tab.documentUuid).toBe('doc-123');
      expect(tab.groupUuid).toBe(groupUuid);
      expect(tab.sessionUuid).toBe(sessionUuid);
      expect(tab.workspaceUuid).toBe(workspaceUuid);
      expect(tab.accountUuid).toBe(accountUuid);
      expect(tab.isPinned).toBe(false);
      expect(tab.isDirty).toBe(false);
    });

    it('应该使用默认视图状态', () => {
      const viewState = tab.viewState;
      expect(viewState).toBeDefined();
    });

    it('应该创建时间戳', () => {
      expect(tab.createdAt).toBeGreaterThan(0);
      expect(tab.updatedAt).toBeGreaterThan(0);
      expect(tab.createdAt).toBe(tab.updatedAt);
    });

    it('应该能够创建非文档标签', () => {
      const previewTab = EditorTab.create({
        groupUuid,
        sessionUuid,
        workspaceUuid,
        accountUuid,
        tabIndex: 1,
        tabType: TabType.PREVIEW,
        title: 'Preview Tab',
      });

      expect(previewTab.tabType).toBe('preview');
      expect(previewTab.documentUuid).toBeNull();
    });
  });

  describe('更新标题', () => {
    it('应该能够更新标题', () => {
      const beforeUpdated = tab.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.updateTitle('Updated Title');

      expect(tab.title).toBe('Updated Title');
      expect(tab.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('视图状态管理', () => {
    it('应该能够更新视图状态', () => {
      const beforeUpdated = tab.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.updateViewState({
        scrollTop: 100,
      });

      expect(tab.viewState.scrollTop).toBe(100);
      expect(tab.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('固定状态管理', () => {
    it('应该能够切换固定状态', () => {
      expect(tab.isPinned).toBe(false);

      const beforeUpdated = tab.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.togglePin();

      expect(tab.isPinned).toBe(true);
      expect(tab.updatedAt).toBeGreaterThan(beforeUpdated);

      tab.togglePin();

      expect(tab.isPinned).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('脏状态管理', () => {
    it('应该能够标记为脏', () => {
      expect(tab.isDirty).toBe(false);

      const beforeUpdated = tab.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.markDirty();

      expect(tab.isDirty).toBe(true);
      expect(tab.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够标记为干净', () => {
      tab.markDirty();
      expect(tab.isDirty).toBe(true);

      const beforeUpdated = tab.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.markClean();

      expect(tab.isDirty).toBe(false);
      expect(tab.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('访问时间记录', () => {
    it('应该能够记录访问时间', () => {
      expect(tab.lastAccessedAt).toBeNull();

      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.recordAccess();

      expect(tab.lastAccessedAt).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });

  describe('标签索引管理', () => {
    it('应该能够更新标签索引', () => {
      expect(tab.tabIndex).toBe(0);

      const beforeUpdated = tab.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      tab.updateTabIndex(3);

      expect(tab.tabIndex).toBe(3);
      expect(tab.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('标签类型判断', () => {
    it('应该能够判断是否为文档标签', () => {
      expect(tab.isDocumentTab()).toBe(true);
    });

    it('非文档标签应返回 false', () => {
      const previewTab = EditorTab.create({
        groupUuid,
        sessionUuid,
        workspaceUuid,
        accountUuid,
        tabIndex: 1,
        tabType: TabType.PREVIEW,
        title: 'Preview',
      });

      expect(previewTab.isDocumentTab()).toBe(false);
    });

    it('没有 documentUuid 的 document 类型标签应返回 false', () => {
      const emptyDocTab = EditorTab.create({
        groupUuid,
        sessionUuid,
        workspaceUuid,
        accountUuid,
        tabIndex: 1,
        tabType: TabType.DOCUMENT,
        title: 'Empty Doc',
        documentUuid: null,
      });

      expect(emptyDocTab.isDocumentTab()).toBe(false);
    });
  });

  describe('DTO 转换', () => {
    it('应该能够转换为 Server DTO', () => {
      const dto = tab.toServerDTO();

      expect(dto.uuid).toBe(tab.uuid);
      expect(dto.title).toBe(tab.title);
      expect(dto.tabType).toBe(tab.tabType);
      expect(dto.documentUuid).toBe(tab.documentUuid);
      expect(dto.groupUuid).toBe(groupUuid);
    });

    it('应该能够转换为 Client DTO', () => {
      tab.recordAccess(); // 记录访问时间

      const dto = tab.toClientDTO();

      expect(dto.uuid).toBe(tab.uuid);
      expect(dto.title).toBe(tab.title);
      expect(dto.formattedLastAccessed).toBeDefined();
      expect(dto.formattedCreatedAt).toBeDefined();
      expect(dto.formattedUpdatedAt).toBeDefined();
    });

    it('应该能够转换为 Persistence DTO', () => {
      const dto = tab.toPersistenceDTO();

      expect(dto.uuid).toBe(tab.uuid);
      expect(dto.group_uuid).toBe(groupUuid);
      expect(dto.session_uuid).toBe(sessionUuid);
      expect(dto.workspace_uuid).toBe(workspaceUuid);
      expect(dto.account_uuid).toBe(accountUuid);
      expect(dto.tab_type).toBe(tab.tabType);
      expect(typeof dto.view_state).toBe('string'); // JSON 字符串
    });

    it('应该能够从 Server DTO 重建', () => {
      tab.markDirty();
      tab.togglePin();
      tab.recordAccess();

      const dto = tab.toServerDTO();
      const rebuilt = EditorTab.fromServerDTO(dto);

      expect(rebuilt.uuid).toBe(tab.uuid);
      expect(rebuilt.title).toBe(tab.title);
      expect(rebuilt.isDirty).toBe(tab.isDirty);
      expect(rebuilt.isPinned).toBe(tab.isPinned);
      expect(rebuilt.lastAccessedAt).toBe(tab.lastAccessedAt);
    });

    it('应该能够从 Persistence DTO 重建', () => {
      tab.updateViewState({ scrollTop: 200 });

      const persistenceDto = tab.toPersistenceDTO();
      const rebuilt = EditorTab.fromPersistenceDTO(persistenceDto);

      expect(rebuilt.uuid).toBe(tab.uuid);
      expect(rebuilt.title).toBe(tab.title);
      expect(rebuilt.viewState.scrollTop).toBe(200);
    });
  });

  describe('业务场景测试', () => {
    it('应该能够模拟用户编辑文档的完整流程', () => {
      // 1. 创建标签
      const docTab = EditorTab.create({
        groupUuid,
        sessionUuid,
        workspaceUuid,
        accountUuid,
        documentUuid: 'doc-456',
        tabIndex: 0,
        tabType: TabType.DOCUMENT,
        title: 'My Document.md',
      });

      // 2. 用户开始编辑
      docTab.recordAccess();
      docTab.markDirty();

      expect(docTab.isDirty).toBe(true);
      expect(docTab.lastAccessedAt).toBeGreaterThan(0);

      // 3. 用户更新滚动位置
      docTab.updateViewState({
        scrollTop: 500,
        cursorPosition: { line: 25, column: 0 },
      });

      expect(docTab.viewState.scrollTop).toBe(500);
      expect(docTab.viewState.cursorPosition.line).toBe(25);

      // 4. 用户保存文档
      docTab.markClean();

      expect(docTab.isDirty).toBe(false);

      // 5. 用户固定标签
      docTab.togglePin();

      expect(docTab.isPinned).toBe(true);
    });

    it('应该能够处理标签重新排序', () => {
      const tab1 = EditorTab.create({
        groupUuid,
        sessionUuid,
        workspaceUuid,
        accountUuid,
        tabIndex: 0,
        tabType: TabType.DOCUMENT,
        title: 'Tab 1',
      });

      const tab2 = EditorTab.create({
        groupUuid,
        sessionUuid,
        workspaceUuid,
        accountUuid,
        tabIndex: 1,
        tabType: TabType.DOCUMENT,
        title: 'Tab 2',
      });

      // 交换位置
      tab1.updateTabIndex(1);
      tab2.updateTabIndex(0);

      expect(tab1.tabIndex).toBe(1);
      expect(tab2.tabIndex).toBe(0);
    });
  });
});
