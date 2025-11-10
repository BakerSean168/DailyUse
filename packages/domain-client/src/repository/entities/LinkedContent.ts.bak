/**
 * LinkedContentClient 实体实现
 * 兼容 LinkedContentClient 接口（但不直接实现，因为接口中包含静态方法）
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { RepositoryContracts as RC } from '@dailyuse/contracts';
import { Entity } from '@dailyuse/utils';

type ILinkedContentClient = RepositoryContracts.LinkedContentClient;
type LinkedContentClientDTO = RepositoryContracts.LinkedContentClientDTO;
type LinkedContentServerDTO = RepositoryContracts.LinkedContentServerDTO;
type ContentType = RepositoryContracts.ContentType;

/**
 * LinkedContentClient 实体
 */
export class LinkedContent extends Entity implements ILinkedContentClient {
  // ===== 私有字段 =====
  private _resourceUuid: string;
  private _title: string;
  private _url: string;
  private _contentType: ContentType;
  private _description: string | null;
  private _thumbnail: string | null;
  private _author: string | null;
  private _publishedAt: number | null;
  private _isAccessible: boolean;
  private _lastCheckedAt: number | null;
  private _cachedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number | null;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    resourceUuid: string;
    title: string;
    url: string;
    contentType: ContentType;
    description?: string | null;
    thumbnail?: string | null;
    author?: string | null;
    publishedAt?: number | null;
    isAccessible?: boolean;
    lastCheckedAt?: number | null;
    cachedAt?: number | null;
    createdAt: number;
    updatedAt?: number | null;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._resourceUuid = params.resourceUuid;
    this._title = params.title;
    this._url = params.url;
    this._contentType = params.contentType;
    this._description = params.description ?? null;
    this._thumbnail = params.thumbnail ?? null;
    this._author = params.author ?? null;
    this._publishedAt = params.publishedAt ?? null;
    this._isAccessible = params.isAccessible ?? true;
    this._lastCheckedAt = params.lastCheckedAt ?? null;
    this._cachedAt = params.cachedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt ?? null;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get resourceUuid(): string {
    return this._resourceUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get url(): string {
    return this._url;
  }
  public get contentType(): ContentType {
    return this._contentType;
  }
  public get description(): string | null {
    return this._description;
  }
  public get thumbnail(): string | null {
    return this._thumbnail;
  }
  public get author(): string | null {
    return this._author;
  }
  public get publishedAt(): number | null {
    return this._publishedAt;
  }
  public get isAccessible(): boolean {
    return this._isAccessible;
  }
  public get lastCheckedAt(): number | null {
    return this._lastCheckedAt;
  }
  public get cachedAt(): number | null {
    return this._cachedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number | null {
    return this._updatedAt;
  }

  // UI 属性
  public get contentTypeLabel(): string {
    const labels: Record<ContentType, string> = {
      [RC.ContentType.ARTICLE]: '文章',
      [RC.ContentType.VIDEO]: '视频',
      [RC.ContentType.IMAGE]: '图片',
      [RC.ContentType.DOCUMENT]: '文档',
      [RC.ContentType.OTHER]: '其他',
    };
    return labels[this._contentType] || '未知';
  }

  public get formattedPublishedAt(): string | undefined {
    return this._publishedAt ? this.formatDate(this._publishedAt) : undefined;
  }

  public get formattedLastChecked(): string | undefined {
    return this._lastCheckedAt ? this.formatDate(this._lastCheckedAt) : undefined;
  }

  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get accessibilityStatusIcon(): string {
    return this._isAccessible ? '✅' : '❌';
  }

  public get domain(): string {
    try {
      const urlObj = new URL(this._url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  // ===== 工厂方法 =====

  /**
   * 创建用于创建表单的空 LinkedContent 实例
   */
  public static forCreate(resourceUuid: string): LinkedContent {
    const uuid = Entity.generateUUID();
    return new LinkedContent({
      uuid,
      resourceUuid,
      title: '',
      url: '',
      contentType: RC.ContentType.ARTICLE,
      description: undefined,
      thumbnail: undefined,
      author: undefined,
      publishedAt: undefined,
      isAccessible: true,
      lastCheckedAt: undefined,
      cachedAt: undefined,
      createdAt: Date.now(),
    });
  }

  /**
   * 克隆当前实体（用于编辑表单）
   */
  public clone(): LinkedContent {
    return LinkedContent.fromClientDTO(this.toClientDTO());
  }

  /**
   * 创建新的 LinkedContentClient 实体
   */
  public static create(params: {
    resourceUuid: string;
    title: string;
    url: string;
    contentType: ContentType;
    description?: string;
    thumbnail?: string;
    author?: string;
    publishedAt?: number;
  }): LinkedContent {
    const uuid = Entity.generateUUID();
    const now = Date.now();

    return new LinkedContent({
      uuid,
      resourceUuid: params.resourceUuid,
      title: params.title,
      url: params.url,
      contentType: params.contentType,
      description: params.description,
      thumbnail: params.thumbnail,
      author: params.author,
      publishedAt: params.publishedAt,
      isAccessible: true,
      createdAt: now,
    });
  }

  // ===== 转换方法 =====

  public toServerDTO(): LinkedContentServerDTO {
    return {
      uuid: this._uuid,
      resourceUuid: this._resourceUuid,
      title: this._title,
      url: this._url,
      contentType: this._contentType,
      description: this._description,
      thumbnail: this._thumbnail,
      author: this._author,
      publishedAt: this._publishedAt,
      isAccessible: this._isAccessible,
      lastCheckedAt: this._lastCheckedAt,
      cachedAt: this._cachedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): LinkedContentClientDTO {
    return {
      uuid: this._uuid,
      resourceUuid: this._resourceUuid,
      title: this._title,
      url: this._url,
      contentType: this._contentType,
      description: this._description,
      thumbnail: this._thumbnail,
      author: this._author,
      publishedAt: this._publishedAt,
      isAccessible: this._isAccessible,
      lastCheckedAt: this._lastCheckedAt,
      cachedAt: this._cachedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      contentTypeLabel: this.contentTypeLabel,
      formattedPublishedAt: this.formattedPublishedAt,
      formattedLastChecked: this.formattedLastChecked,
      formattedCreatedAt: this.formattedCreatedAt,
      accessibilityStatusIcon: this.accessibilityStatusIcon,
      domain: this.domain,
    };
  }

  public static fromServerDTO(dto: LinkedContentServerDTO): LinkedContent {
    return new LinkedContent({
      uuid: dto.uuid,
      resourceUuid: dto.resourceUuid,
      title: dto.title,
      url: dto.url,
      contentType: dto.contentType,
      description: dto.description,
      thumbnail: dto.thumbnail,
      author: dto.author,
      publishedAt: dto.publishedAt,
      isAccessible: dto.isAccessible,
      lastCheckedAt: dto.lastCheckedAt,
      cachedAt: dto.cachedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public static fromClientDTO(dto: LinkedContentClientDTO): LinkedContent {
    return new LinkedContent({
      uuid: dto.uuid,
      resourceUuid: dto.resourceUuid,
      title: dto.title,
      url: dto.url,
      contentType: dto.contentType,
      description: dto.description,
      thumbnail: dto.thumbnail,
      author: dto.author,
      publishedAt: dto.publishedAt,
      isAccessible: dto.isAccessible,
      lastCheckedAt: dto.lastCheckedAt,
      cachedAt: dto.cachedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
