/**
 * WorkspaceLayout 值对象
 * 工作区布局配置 - 不可变值对象
 */

import type {
  IWorkspaceLayoutServer,
  WorkspaceLayoutClientDTO,
  WorkspaceLayoutPersistenceDTO,
  WorkspaceLayoutServerDTO,
} from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * WorkspaceLayout 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class WorkspaceLayout extends ValueObject implements WorkspaceLayout {
  public readonly sidebarPosition: 'left' | 'right';
  public readonly sidebarWidth: number;
  public readonly panelPosition: 'bottom' | 'right';
  public readonly panelHeight: number;
  public readonly isSidebarVisible: boolean;
  public readonly isPanelVisible: boolean;

  constructor(params: {
    sidebarPosition: 'left' | 'right';
    sidebarWidth: number;
    panelPosition: 'bottom' | 'right';
    panelHeight: number;
    isSidebarVisible: boolean;
    isPanelVisible: boolean;
  }) {
    super();

    this.sidebarPosition = params.sidebarPosition;
    this.sidebarWidth = params.sidebarWidth;
    this.panelPosition = params.panelPosition;
    this.panelHeight = params.panelHeight;
    this.isSidebarVisible = params.isSidebarVisible;
    this.isPanelVisible = params.isPanelVisible;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      sidebarPosition: 'left' | 'right';
      sidebarWidth: number;
      panelPosition: 'bottom' | 'right';
      panelHeight: number;
      isSidebarVisible: boolean;
      isPanelVisible: boolean;
    }>,
  ): WorkspaceLayout {
    return new WorkspaceLayout({
      sidebarPosition: changes.sidebarPosition ?? this.sidebarPosition,
      sidebarWidth: changes.sidebarWidth ?? this.sidebarWidth,
      panelPosition: changes.panelPosition ?? this.panelPosition,
      panelHeight: changes.panelHeight ?? this.panelHeight,
      isSidebarVisible: changes.isSidebarVisible ?? this.isSidebarVisible,
      isPanelVisible: changes.isPanelVisible ?? this.isPanelVisible,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: IWorkspaceLayoutServer): boolean {
    if (!(other instanceof WorkspaceLayout)) {
      return false;
    }

    return (
      this.sidebarPosition === other.sidebarPosition &&
      this.sidebarWidth === other.sidebarWidth &&
      this.panelPosition === other.panelPosition &&
      this.panelHeight === other.panelHeight &&
      this.isSidebarVisible === other.isSidebarVisible &&
      this.isPanelVisible === other.isPanelVisible
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): WorkspaceLayoutServerDTO {
    return {
      sidebarPosition: this.sidebarPosition,
      sidebarWidth: this.sidebarWidth,
      panelPosition: this.panelPosition,
      panelHeight: this.panelHeight,
      isSidebarVisible: this.isSidebarVisible,
      isPanelVisible: this.isPanelVisible,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): WorkspaceLayoutClientDTO {
    return this.toServerDTO();
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): WorkspaceLayoutPersistenceDTO {
    return {
      sidebar_position: this.sidebarPosition,
      sidebar_width: this.sidebarWidth,
      panel_position: this.panelPosition,
      panel_height: this.panelHeight,
      is_sidebar_visible: this.isSidebarVisible,
      is_panel_visible: this.isPanelVisible,
    };
  }

  /**
   * 从 Server DTO 创建实例
   */
  public static fromServerDTO(dto: WorkspaceLayoutServerDTO): WorkspaceLayout {
    return new WorkspaceLayout({
      sidebarPosition: dto.sidebarPosition,
      sidebarWidth: dto.sidebarWidth,
      panelPosition: dto.panelPosition,
      panelHeight: dto.panelHeight,
      isSidebarVisible: dto.isSidebarVisible,
      isPanelVisible: dto.isPanelVisible,
    });
  }

  /**
   * 从 Persistence DTO 创建实例
   */
  public static fromPersistenceDTO(dto: WorkspaceLayoutPersistenceDTO): WorkspaceLayout {
    return new WorkspaceLayout({
      sidebarPosition: dto.sidebar_position,
      sidebarWidth: dto.sidebar_width,
      panelPosition: dto.panel_position,
      panelHeight: dto.panel_height,
      isSidebarVisible: dto.is_sidebar_visible,
      isPanelVisible: dto.is_panel_visible,
    });
  }

  /**
   * 创建默认实例
   */
  public static createDefault(): WorkspaceLayout {
    return new WorkspaceLayout({
      sidebarPosition: 'left',
      sidebarWidth: 300,
      panelPosition: 'bottom',
      panelHeight: 200,
      isSidebarVisible: true,
      isPanelVisible: false,
    });
  }
}
