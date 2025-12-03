/**
 * EditorSession Client DTO
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 */

import type { EditorGroupClientDTO } from './EditorGroupClient';
import type { SessionLayoutClientDTO } from '../value-objects/SessionLayout';

export interface EditorSessionClientDTO {
  // ===== 基础属性 =====
  uuid: string;
  workspaceUuid: string;
  accountUuid: string;
  name: string;
  description: string | null;

  // ===== 子实体集合 =====
  groups: EditorGroupClientDTO[]; // ✅ 直接包含子实体

  // ===== 状态 =====
  isActive: boolean;
  activeGroupIndex: number;

  // ===== 布局配置 =====
  layout: SessionLayoutClientDTO;

  // ===== UI 辅助字段 =====
  groupCount: number;

  // ===== 时间戳 =====
  lastAccessedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
