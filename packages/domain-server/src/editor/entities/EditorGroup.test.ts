/**
 * EditorGroup 实体测试
 * 测试 EditorGroup 的业务逻辑和行为
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorGroup } from './EditorGroup';
import { EditorTab } from './EditorTab';
import { TabType } from '@dailyuse/contracts/editor';

describe('EditorGroup 实体', () => {
  let group: EditorGroup;
  const sessionUuid = 'test-session-uuid';
  const workspaceUuid = 'test-workspace-uuid';
  const accountUuid = 'test-account-uuid';

  beforeEach(() => {
    group = EditorGroup.create({
      sessionUuid,
      workspaceUuid,
      accountUuid,
      groupIndex: 0,
      name: 'Test Group',
    });
  });

  describe('工厂方法', () => {
    it('应该通过 create 方法创建新分组', () => {
      expect(group).toBeDefined();
      expect(group.uuid).toBeDefined();
      expect(group.name).toBe('Test Group');
      expect(group.groupIndex).toBe(0);
      expect(group.sessionUuid).toBe(sessionUuid);
      expect(group.workspaceUuid).toBe(workspaceUuid);
      expect(group.accountUuid).toBe(accountUuid);
      expect(group.tabs).toHaveLength(0);
      expect(group.activeTabIndex).toBe(0);
    });

    it('应该创建时间戳', () => {
      expect(group.createdAt).toBeGreaterThan(0);
      expect(group.updatedAt).toBeGreaterThan(0);
      expect(group.createdAt).toBe(group.updatedAt);
    });
  });

  describe('重命名分组', () => {
    it('应该能够重命名分组', () => {
      const beforeUpdated = group.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      group.rename('Renamed Group');

      expect(group.name).toBe('Renamed Group');
      expect(group.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('应该能够清空分组名称', () => {
      group.rename(null);

      expect(group.name).toBeNull();
    });
  });

  describe('分组索引管理', () => {
    it('应该能够更新分组索引', () => {
      const beforeUpdated = group.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      group.updateGroupIndex(5);

      expect(group.groupIndex).toBe(5);
      expect(group.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });
  });

  describe('标签管理', () => {
    it('应该能够添加标签', () => {
      const tab = group.addTab({
        tabIndex: 0,
        tabType: TabType.DOCUMENT,
        title: 'Test Tab',
        documentUuid: 'doc-123',
      });

      expect(tab).toBeDefined();
      expect(tab.title).toBe('Test Tab');
      expect(tab.tabIndex).toBe(0);
      expect(tab.groupUuid).toBe(group.uuid);
      expect(group.tabs).toHaveLength(1);
    });

    it('应该能够添加多个标签', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });
      group.addTab({ tabIndex: 1, tabType: TabType.DOCUMENT, title: 'Tab 2' });
      group.addTab({ tabIndex: 2, tabType: TabType.PREVIEW, title: 'Tab 3' });

      expect(group.tabs).toHaveLength(3);
    });

    it('应该能够获取指定标签', () => {
      const tab = group.addTab({
        tabIndex: 0,
        tabType: TabType.DOCUMENT,
        title: 'Test Tab',
      });

      const retrieved = group.getTab(tab.uuid);

      expect(retrieved).toBeDefined();
      expect(retrieved?.uuid).toBe(tab.uuid);
    });

    it('获取不存在的标签应返回 undefined', () => {
      const retrieved = group.getTab('non-existent-uuid');

      expect(retrieved).toBeUndefined();
    });

    it('应该能够移除标签', () => {
      const tab = group.addTab({
        tabIndex: 0,
        tabType: TabType.DOCUMENT,
        title: 'Tab to Remove',
      });

      expect(group.tabs).toHaveLength(1);

      const removed = group.removeTab(tab.uuid);

      expect(removed).toBe(true);
      expect(group.tabs).toHaveLength(0);
    });

    it('移除不存在的标签应返回 false', () => {
      const removed = group.removeTab('non-existent-uuid');

      expect(removed).toBe(false);
    });

    it('应该能够获取所有标签', () => {
      group.addTab({ tabIndex: 0, tabType: 'document', title: 'Tab 1' });
      group.addTab({ tabIndex: 1, tabType: 'document', title: 'Tab 2' });

      const allTabs = group.getAllTabs();

      expect(allTabs).toHaveLength(2);
    });
  });

  describe('活动标签管理', () => {
    it('应该能够设置活动标签', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });
      group.addTab({ tabIndex: 1, tabType: TabType.DOCUMENT, title: 'Tab 2' });
      group.addTab({ tabIndex: 2, tabType: TabType.DOCUMENT, title: 'Tab 3' });

      const beforeUpdated = group.updatedAt;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);

      group.setActiveTab(1);

      expect(group.activeTabIndex).toBe(1);
      expect(group.updatedAt).toBeGreaterThan(beforeUpdated);

      vi.useRealTimers();
    });

    it('设置无效的活动标签索引应被忽略', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });

      const beforeIndex = group.activeTabIndex;
      const beforeUpdated = group.updatedAt;

      group.setActiveTab(10); // 超出范围

      expect(group.activeTabIndex).toBe(beforeIndex);
      expect(group.updatedAt).toBe(beforeUpdated); // 时间戳不应改变
    });

    it('应该能够验证标签索引是否有效', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });
      group.addTab({ tabIndex: 1, tabType: TabType.DOCUMENT, title: 'Tab 2' });

      expect(group.isValidTabIndex(0)).toBe(true);
      expect(group.isValidTabIndex(1)).toBe(true);
      expect(group.isValidTabIndex(2)).toBe(false);
      expect(group.isValidTabIndex(-1)).toBe(false);
    });
  });

  describe('DTO 转换', () => {
    it('应该能够转换为 Server DTO', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });

      const dto = group.toServerDTO();

      expect(dto.uuid).toBe(group.uuid);
      expect(dto.name).toBe(group.name);
      expect(dto.sessionUuid).toBe(sessionUuid);
      expect(dto.tabs).toHaveLength(1);
      expect(dto.tabs[0].title).toBe('Tab 1');
    });

    it('应该能够转换为 Client DTO', () => {
      const dto = group.toClientDTO();

      expect(dto.uuid).toBe(group.uuid);
      expect(dto.name).toBe(group.name);
      expect(dto.formattedCreatedAt).toBeDefined();
      expect(dto.formattedUpdatedAt).toBeDefined();
    });

    it('应该能够转换为 Persistence DTO', () => {
      const dto = group.toPersistenceDTO();

      expect(dto.uuid).toBe(group.uuid);
      expect(dto.session_uuid).toBe(sessionUuid);
      expect(dto.workspace_uuid).toBe(workspaceUuid);
      expect(dto.account_uuid).toBe(accountUuid);
      expect(dto.group_index).toBe(0);
    });

    it('应该能够从 Server DTO 重建（递归重建子实体）', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });
      group.addTab({ tabIndex: 1, tabType: TabType.PREVIEW, title: 'Tab 2' });

      const dto = group.toServerDTO();
      const rebuilt = EditorGroup.fromServerDTO(dto);

      expect(rebuilt.uuid).toBe(group.uuid);
      expect(rebuilt.name).toBe(group.name);
      expect(rebuilt.tabs).toHaveLength(2);
      expect(rebuilt.tabs[0].title).toBe('Tab 1');
      expect(rebuilt.tabs[1].title).toBe('Tab 2');
    });

    it('应该能够从 Persistence DTO 重建', () => {
      const persistenceDto = group.toPersistenceDTO();
      const rebuilt = EditorGroup.fromPersistenceDTO(persistenceDto);

      expect(rebuilt.uuid).toBe(group.uuid);
      expect(rebuilt.name).toBe(group.name);
      expect(rebuilt.groupIndex).toBe(0);
    });
  });

  describe('业务规则验证', () => {
    it('tabs 属性应返回副本以防止外部修改', () => {
      group.addTab({ tabIndex: 0, tabType: TabType.DOCUMENT, title: 'Tab 1' });
      const tabs = group.tabs;

      tabs.push(null as any); // 尝试修改副本

      // 原始 tabs 不应被修改
      expect(group.tabs).toHaveLength(1);
    });
  });
});
