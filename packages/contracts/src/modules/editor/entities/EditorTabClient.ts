/**
 * EditorTab Entity - Client Interface
 * 编辑器标签实体 - 客户端接口
 */

import type { TabType } from '../enums';
import type { EditorTabServerDTO } from './EditorTabServer';

// 从值对象导入类型
import type { TabViewStateClientDTO } from '../value-objects';

/**
 * Editor Tab Client DTO
 * 编辑器标签客户端 DTO（包含 UI 格式化字段）
 */
export interface EditorTabClientDTO {
  uuid: string;
  groupUuid: string;
  sessionUuid: string;
  workspaceUuid: string;
  accountUuid: string;
  documentUuid?: string | null;
  tabIndex: number;
  tabType: TabType;
  title: string;
  viewState: TabViewStateClientDTO;
  isPinned: boolean;
  isDirty: boolean;
  lastAccessedAt?: number | null;
  createdAt: number;
  updatedAt: number;

  // UI 格式化字段
  formattedLastAccessed?: string | null;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

/**
 * Editor Tab Entity - Client Interface
 * 编辑器标签实体 - 客户端接口
 */
export interface EditorTabClient {
  // ===== 基础属性 =====
  readonly uuid: string;
  readonly groupUuid: string;
  readonly sessionUuid: string;
  readonly workspaceUuid: string;
  readonly accountUuid: string;
  readonly documentUuid?: string | null;
  readonly tabIndex: number;
  readonly tabType: TabType;
  readonly title: string;
  readonly viewState: TabViewStateClientDTO;
  readonly isPinned: boolean;
  readonly isDirty: boolean;
  readonly lastAccessedAt?: number | null;
  readonly createdAt: number;
  readonly updatedAt: number;

  // ===== UI 辅助方法 =====

  /**
   * 获取显示标题（包含脏标记）
   */
  getDisplayTitle(): string;

  /**
   * 获取标签类型标签
   */
  getTabTypeLabel(): string;

  /**
   * 获取标签图标名称
   */
  getIconName(): string;

  /**
   * 是否为文档标签
   */
  isDocumentTab(): boolean;

  /**
   * 是否可以关闭（某些特殊标签可能不允许关闭）
   */
  canClose(): boolean;

  /**
   * 是否需要确认关闭（有未保存更改时）
   */
  needsCloseConfirmation(): boolean;

  /**
   * 获取格式化的最后访问时间
   */
  getFormattedLastAccessed(): string | null;

  /**
   * 获取标签状态颜色（用于 UI 徽章）
   */
  getStatusColor(): string;

  // ===== DTO 转换方法 =====

  toClientDTO(): EditorTabClientDTO;
  toServerDTO(): EditorTabServerDTO;
}
