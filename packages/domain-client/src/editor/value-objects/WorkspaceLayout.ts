/**
 * WorkspaceLayout 值对象
 * 工作区布局 - 客户端值对象
 */

import type { IWorkspaceLayoutClient, WorkspaceLayoutClientDTO, WorkspaceLayoutServerDTO } from '@dailyuse/contracts/editor';
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
export class WorkspaceLayout extends ValueObject implements WorkspaceLayoutClient {
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
   * 值相等性比较
   */
  public override equals(other: ValueObject): boolean {
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
   * 从 Server DTO 创建
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
   * 从 Client DTO 创建
   */
  public static fromClientDTO(dto: WorkspaceLayoutClientDTO): WorkspaceLayout {
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
   * 创建默认布局
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
