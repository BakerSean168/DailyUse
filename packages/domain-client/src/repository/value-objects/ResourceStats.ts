/**
 * Resource Stats Value Object - Client Implementation
 * 资源统计值对象 - 客户端实现
 */
import type { ResourceStatsClient, ResourceStatsClientDTO, ResourceStatsServerDTO } from '@dailyuse/contracts/repository';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export class ResourceStats implements ResourceStatsClient {
  private readonly _viewCount: number;
  private readonly _editCount: number;
  private readonly _linkCount: number;
  private readonly _lastViewedAt?: number | null;
  private readonly _lastEditedAt?: number | null;

  constructor(
    viewCount: number = 0,
    editCount: number = 0,
    linkCount: number = 0,
    lastViewedAt?: number | null,
    lastEditedAt?: number | null,
  ) {
    this._viewCount = viewCount;
    this._editCount = editCount;
    this._linkCount = linkCount;
    this._lastViewedAt = lastViewedAt ?? null;
    this._lastEditedAt = lastEditedAt ?? null;
  }

  // ===== Getters =====
  get viewCount(): number {
    return this._viewCount;
  }

  get editCount(): number {
    return this._editCount;
  }

  get linkCount(): number {
    return this._linkCount;
  }

  get lastViewedAt(): number | null | undefined {
    return this._lastViewedAt;
  }

  get lastEditedAt(): number | null | undefined {
    return this._lastEditedAt;
  }

  // ===== UI 计算属性 =====
  get viewCountText(): string {
    return `浏览 ${this._viewCount} 次`;
  }

  get editCountText(): string {
    return `编辑 ${this._editCount} 次`;
  }

  get linkCountText(): string {
    if (this._linkCount === 0) return '无链接';
    return `${this._linkCount} 个链接`;
  }

  get lastViewedText(): string | null {
    if (!this._lastViewedAt) return null;
    try {
      return formatDistanceToNow(this._lastViewedAt, { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return null;
    }
  }

  get lastEditedText(): string | null {
    if (!this._lastEditedAt) return null;
    try {
      return formatDistanceToNow(this._lastEditedAt, { 
        addSuffix: true, 
        locale: zhCN 
      });
    } catch {
      return null;
    }
  }

  // ===== DTO 转换 =====
  toClientDTO(): ResourceStatsClientDTO {
    return {
      viewCount: this._viewCount,
      editCount: this._editCount,
      linkCount: this._linkCount,
      lastViewedAt: this._lastViewedAt,
      lastEditedAt: this._lastEditedAt,
      viewCountText: this.viewCountText,
      editCountText: this.editCountText,
      linkCountText: this.linkCountText,
      lastViewedText: this.lastViewedText,
      lastEditedText: this.lastEditedText,
    };
  }

  toServerDTO(): ResourceStatsServerDTO {
    return {
      viewCount: this._viewCount,
      editCount: this._editCount,
      linkCount: this._linkCount,
      lastViewedAt: this._lastViewedAt,
      lastEditedAt: this._lastEditedAt,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: ResourceStatsServerDTO): ResourceStats {
    return new ResourceStats(
      dto.viewCount,
      dto.editCount,
      dto.linkCount,
      dto.lastViewedAt,
      dto.lastEditedAt,
    );
  }

  static fromClientDTO(dto: ResourceStatsClientDTO): ResourceStats {
    return new ResourceStats(
      dto.viewCount,
      dto.editCount,
      dto.linkCount,
      dto.lastViewedAt,
      dto.lastEditedAt,
    );
  }
}
