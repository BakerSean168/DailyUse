/**
 * Resource Entity
 * 资源实体 - DDD 核心领域模型
 * 
 * 职责：
 * 1. 表示仓库中的单个资源（Markdown, Image, Video, etc.）
 * 2. 维护资源业务规则
 * 3. 提供类型专用方法（如 Markdown 内容更新）
 * 4. 管理资源元数据
 */

import { v4 as uuidv4 } from 'uuid';
import { Entity } from '@dailyuse/utils';
import {
  ResourceType,
  ResourceStatus,
  type RepositoryContracts,
} from '@dailyuse/contracts';
import type { RepositoryContracts as RC } from '@dailyuse/contracts';

type IResourceServer = RC.ResourceServer;
type ResourceServerDTO = RC.ResourceServerDTO;
type ResourcePersistenceDTO = RC.ResourcePersistenceDTO;
type ResourceClientDTO = RC.ResourceClientDTO;
type IResourceMetadata = RC.ResourceMetadata;
type ResourceReferenceServer = RC.ResourceReferenceServer;
type LinkedContentServer = RC.LinkedContentServer;
import { ResourceReference } from './ResourceReference';
import { LinkedContent } from './LinkedContent';
import { ResourceMetadata } from '../value-objects/ResourceMetadata';

// ==================== 创建 DTO ====================

export interface CreateResourceDTO {
  repositoryUuid: string;
  name: string;
  type: ResourceType;
  path: string;
  size: number;
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  category?: string;
  metadata?: Partial<ResourceMetadata>;
}

// ==================== Resource 实体 ====================

/**
 * Resource 实体
 * 继承 Entity 并实现 IResourceServer 接口
 * 
 * 注意：Resource 是实体，不是聚合根
 * Repository 才是聚合根，Resource 作为子实体由 Repository 管理
 */
export class Resource extends Entity implements IResourceServer {
  // ===== 子实体集合 =====
  private _references: ResourceReference[] = [];
  private _linkedContents: LinkedContent[] = [];

  private constructor(
    uuid: string,
    public readonly repositoryUuid: string,
    private _name: string,
    public readonly type: ResourceType,
    private _path: string,
    private _size: number,
    private _description: string | null,
    private _author: string | null,
    private _version: string | null,
    private _tags: string[],
    private _category: string | null,
    private _status: ResourceStatus,
    private _metadata: ResourceMetadata,
    public readonly createdAt: number,
    private _updatedAt: number,
    private _modifiedAt: number | null,
  ) {
    super(uuid);
  }

  // ==================== Getters ====================

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get size(): number {
    return this._size;
  }

  get description(): string | null {
    return this._description;
  }

  get author(): string | null {
    return this._author;
  }

  get version(): string | null {
    return this._version;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get category(): string | null {
    return this._category;
  }

  get status(): ResourceStatus {
    return this._status;
  }

  get metadata(): IResourceMetadata {
    return this._metadata.toPlainObject();
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  get modifiedAt(): number | null {
    return this._modifiedAt;
  }

  // ==================== 工厂方法 ====================

  /**
   * 创建新的 Resource
   */
  static create(dto: CreateResourceDTO): Resource {
    const now = Date.now();
    const uuid = uuidv4();

    // 创建 Value Object - 默认元数据
    const defaultMetadata = new ResourceMetadata({
      mimeType: Resource.getMimeTypeForResourceType(dto.type),
      encoding: 'utf-8',
      thumbnailPath: null,
      isFavorite: false,
      accessCount: 0,
      lastAccessedAt: null,
      ...dto.metadata,
    });

    return new Resource(
      uuid,
      dto.repositoryUuid,
      dto.name,
      dto.type,
      dto.path,
      dto.size,
      dto.description || null,
      dto.author || null,
      dto.version || null,
      dto.tags || [],
      dto.category || null,
      ResourceStatus.DRAFT,
      defaultMetadata,
      now,
      now,
      now,
    );
  }

  /**
   * 从持久化数据重建 Resource
   */
  static fromPersistence(data: ResourcePersistenceDTO): Resource {
    const metadataDTO = JSON.parse(data.metadata) as IResourceMetadata;
    const metadata = ResourceMetadata.fromPlainObject(metadataDTO);

    return new Resource(
      data.uuid,
      data.repositoryUuid,
      data.name,
      data.type,
      data.path,
      data.size,
      data.description || null,
      data.author || null,
      data.version || null,
      JSON.parse(data.tags),
      data.category || null,
      data.status,
      metadata,
      data.createdAt,
      data.updatedAt,
      data.modifiedAt || null,
    );
  }

  // ==================== 通用业务方法 ====================

  /**
   * 更新资源名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Resource name cannot be empty');
    }
    this._name = name.trim();
    this._updatedAt = Date.now();
    this._modifiedAt = Date.now();
  }

  /**
   * 移动资源到新路径（async版本，符合接口）
   */
  async move(newPath: string): Promise<void> {
    if (!newPath || newPath.trim().length === 0) {
      throw new Error('Resource path cannot be empty');
    }
    this._path = newPath.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 移动资源到新路径（同步版本）
   */
  moveTo(newPath: string): void {
    if (!newPath || newPath.trim().length === 0) {
      throw new Error('Resource path cannot be empty');
    }
    this._path = newPath.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 重命名资源
   */
  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Resource name cannot be empty');
    }
    this._name = newName.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 更新描述
   */
  updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
    this._modifiedAt = Date.now();
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!this._tags.includes(normalizedTag)) {
      this._tags.push(normalizedTag);
      this._updatedAt = Date.now();
    }
  }

  /**
   * 移除标签
   */
  removeTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this._tags.indexOf(normalizedTag);
    if (index !== -1) {
      this._tags.splice(index, 1);
      this._updatedAt = Date.now();
    }
  }

  /**
   * 设置分类
   */
  setCategory(category: string | null): void {
    this._category = category;
    this._updatedAt = Date.now();
  }

  /**
   * 更新元数据
   */
  updateMetadata(metadata: Partial<IResourceMetadata>): void {
    this._metadata = this._metadata.with(metadata);
    this._updatedAt = Date.now();
  }

  /**
   * 发布资源
   */
  publish(): void {
    if (this._status === ResourceStatus.ACTIVE) {
      throw new Error('Resource is already published');
    }
    this._status = ResourceStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 归档资源
   */
  archive(): void {
    if (this._status === ResourceStatus.ARCHIVED) {
      throw new Error('Resource is already archived');
    }
    this._status = ResourceStatus.ARCHIVED;
    this._updatedAt = Date.now();
  }

  /**
   * 软删除资源
   */
  softDelete(): void {
    if (this._status === ResourceStatus.DELETED) {
      throw new Error('Resource is already deleted');
    }
    this._status = ResourceStatus.DELETED;
    this._updatedAt = Date.now();
  }

  /**
   * 标记为已删除（符合接口命名）
   */
  markAsDeleted(): void {
    this._status = ResourceStatus.DELETED;
    this._updatedAt = Date.now();
  }

  /**
   * 激活资源
   */
  activate(): void {
    this._status = ResourceStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  /**
   * 恢复为草稿
   */
  revertToDraft(): void {
    this._status = ResourceStatus.DRAFT;
    this._updatedAt = Date.now();
  }

  /**
   * 更新资源内容（async版本）
   */
  async updateContent(content: string | Uint8Array): Promise<void> {
    if (!this._metadata.content) {
      this._metadata.content = {};
    }
    if (typeof content === 'string') {
      this._metadata.content.text = content;
    } else {
      this._metadata.content.binary = content;
    }
    this._size = typeof content === 'string' ? content.length : content.byteLength;
    this._updatedAt = Date.now();
    this._modifiedAt = Date.now();
  }

  /**
   * 增加访问计数
   */
  incrementAccessCount(): void {
    this._metadata = this._metadata.incrementAccessCount();
    this._updatedAt = Date.now();
  }

  /**
   * 更新版本号
   */
  updateVersion(version: string): void {
    this._version = version;
    this._updatedAt = Date.now();
  }

  /**
   * 收藏/取消收藏
   */
  toggleFavorite(): void {
    if (this._metadata.isFavorite) {
      this._metadata = this._metadata.unmarkAsFavorite();
    } else {
      this._metadata = this._metadata.markAsFavorite();
    }
    this._updatedAt = Date.now();
  }

  /**
   * 记录访问
   */
  recordAccess(): void {
    this._metadata = this._metadata.incrementAccessCount();
    this._updatedAt = Date.now();
  }

  /**
   * 更新文件大小
   */
  updateSize(size: number): void {
    if (size < 0) {
      throw new Error('Size cannot be negative');
    }
    this._size = size;
    this._updatedAt = Date.now();
    this._modifiedAt = Date.now();
  }

  // ==================== Markdown 专用方法 ====================

  /**
   * 更新 Markdown 内容
   */
  updateMarkdownContent(content: string): void {
    if (this.type !== 'markdown') {
      throw new Error('updateMarkdownContent() is only for MARKDOWN resources');
    }

    this._metadata = this._metadata.with({ content });

    const summary = content
      .replace(/[#*`\[\]]/g, '')
      .trim()
      .slice(0, 200);

    this._description = summary;
    this._size = new Blob([content]).size;
    this._updatedAt = Date.now();
    this._modifiedAt = Date.now();
  }

  /**
   * 获取 Markdown 内容
   */
  getMarkdownContent(): string {
    if (this.type !== 'markdown') {
      throw new Error('getMarkdownContent() is only for MARKDOWN resources');
    }
    return (this._metadata.content as string) || '';
  }

  // ==================== Image 专用方法 ====================

  /**
   * 设置缩略图路径
   */
  setThumbnailPath(thumbnailPath: string): void {
    if (this.type !== 'image' && this.type !== 'video') {
      throw new Error('setThumbnailPath() is only for IMAGE or VIDEO resources');
    }
    this._metadata = this._metadata.with({ thumbnailPath });
    this._updatedAt = Date.now();
  }

  // ==================== 子实体管理 ====================

  /**
   * 创建资源引用
   */
  createReference(params: {
    targetResourceUuid: string;
    referenceType: string;
    description?: string;
  }): ResourceReferenceServer {
    const reference = ResourceReference.create({
      sourceResourceUuid: this.uuid,
      targetResourceUuid: params.targetResourceUuid,
      referenceType: params.referenceType as any,
      description: params.description,
    });

    this._references.push(reference);
    return reference;
  }

  /**
   * 创建关联内容
   */
  createLinkedContent(params: {
    title: string;
    url: string;
    contentType: string;
    description?: string;
  }): LinkedContentServer {
    const linkedContent = LinkedContent.create({
      resourceUuid: this.uuid,
      title: params.title,
      url: params.url,
      contentType: params.contentType as any,
      description: params.description,
    });

    this._linkedContents.push(linkedContent);
    return linkedContent;
  }

  /**
   * 添加引用
   */
  addReference(reference: ResourceReferenceServer): void {
    const ref = reference as ResourceReference;
    if (this._references.find(r => r.uuid === reference.uuid)) {
      throw new Error(`Reference ${reference.uuid} already exists`);
    }
    this._references.push(ref);
  }

  /**
   * 移除引用
   */
  removeReference(referenceUuid: string): ResourceReferenceServer | null {
    const index = this._references.findIndex(r => r.uuid === referenceUuid);
    if (index === -1) {
      return null;
    }
    const [removed] = this._references.splice(index, 1);
    return removed;
  }

  /**
   * 获取所有引用
   */
  getAllReferences(): ResourceReferenceServer[] {
    return [...this._references];
  }

  /**
   * 添加关联内容
   */
  addLinkedContent(content: LinkedContentServer): void {
    const linkedContent = content as LinkedContent;
    if (this._linkedContents.find(c => c.uuid === content.uuid)) {
      throw new Error(`Linked content ${content.uuid} already exists`);
    }
    this._linkedContents.push(linkedContent);
  }

  /**
   * 移除关联内容
   */
  removeLinkedContent(contentUuid: string): LinkedContentServer | null {
    const index = this._linkedContents.findIndex(c => c.uuid === contentUuid);
    if (index === -1) {
      return null;
    }
    const [removed] = this._linkedContents.splice(index, 1);
    return removed;
  }

  /**
   * 获取所有关联内容
   */
  getAllLinkedContents(): LinkedContentServer[] {
    return [...this._linkedContents];
  }

  // ==================== DTO 转换 ====================

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ResourceServerDTO {
    return {
      uuid: this.uuid,
      repositoryUuid: this.repositoryUuid,
      name: this._name,
      type: this.type,
      path: this._path,
      size: this._size,
      description: this._description,
      author: this._author,
      version: this._version,
      tags: [...this._tags],
      category: this._category,
      status: this._status,
      metadata: { ...this._metadata },
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      modifiedAt: this._modifiedAt,
      references: null,
      linkedContents: null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): any {
    return {
      uuid: this.uuid,
      repositoryUuid: this.repositoryUuid,
      name: this._name,
      type: this.type,
      path: this._path,
      size: this._size,
      sizeFormatted: Resource.formatFileSize(this._size),
      description: this._description,
      author: this._author,
      version: this._version,
      tags: [...this._tags],
      category: this._category,
      status: this._status,
      metadata: {
        ...this._metadata,
        content: undefined,
      },
      isFavorite: this._metadata.isFavorite || false,
      accessCount: this._metadata.accessCount || 0,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      modifiedAt: this._modifiedAt,
      references: null,
      linkedContents: null,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  toPersistenceDTO(): ResourcePersistenceDTO {
    return {
      uuid: this.uuid,
      repositoryUuid: this.repositoryUuid,
      name: this._name,
      type: this.type,
      path: this._path,
      size: this._size,
      description: this._description,
      author: this._author,
      version: this._version,
      tags: JSON.stringify(this._tags),
      category: this._category,
      status: this._status,
      metadata: JSON.stringify(this._metadata),
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      modifiedAt: this._modifiedAt,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证资源是否可以编辑
   */
  canEdit(): boolean {
    return this._status !== ResourceStatus.DELETED && this._status !== ResourceStatus.ARCHIVED;
  }

  /**
   * 验证是否是 Markdown 资源
   */
  isMarkdown(): boolean {
    return this.type === 'markdown';
  }

  /**
   * 验证是否是图片资源
   */
  isImage(): boolean {
    return this.type === 'image';
  }

  /**
   * 验证是否是视频资源
   */
  isVideo(): boolean {
    return this.type === 'video';
  }

  /**
   * 根据资源类型获取 MIME 类型
   */
  private static getMimeTypeForResourceType(type: ResourceType): string {
    const mimeTypeMap: Record<ResourceType, string> = {
      markdown: 'text/markdown',
      image: 'image/*',
      video: 'video/*',
      audio: 'audio/*',
      pdf: 'application/pdf',
      link: 'text/uri-list',
      code: 'text/plain',
      other: 'application/octet-stream',
    };
    return mimeTypeMap[type];
  }

  /**
   * 格式化文件大小
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
