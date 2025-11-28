/**
 * Resource Entity - Client Implementation
 * 资源实体 - 客户端实现
 */
import {
  ResourceClient,
  ResourceClientDTO,
  ResourceServerDTO,
  ResourceStatus,
  ResourceType,
} from '@dailyuse/contracts/repository';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ResourceMetadata } from '../value-objects/ResourceMetadata';
import { ResourceStats } from '../value-objects/ResourceStats';


export class Resource implements ResourceClient {
  private readonly _uuid: string;
  private readonly _repositoryUuid: string;
  private readonly _folderUuid?: string | null;
  private readonly _name: string;
  private readonly _type: ResourceType;
  private readonly _path: string;
  private readonly _size: number;
  private readonly _content?: string | null;
  private readonly _metadata: ResourceMetadata;
  private readonly _stats: ResourceStats;
  private readonly _status: ResourceStatus;
  private readonly _createdAt: number;
  private readonly _updatedAt: number;

  private constructor(params: {
    uuid: string;
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    size: number;
    folderUuid?: string | null;
    content?: string | null;
    metadata: ResourceMetadata;
    stats: ResourceStats;
    status: ResourceStatus;
    createdAt: number;
    updatedAt: number;
  }) {
    this._uuid = params.uuid;
    this._repositoryUuid = params.repositoryUuid;
    this._folderUuid = params.folderUuid ?? null;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._size = params.size;
    this._content = params.content ?? null;
    this._metadata = params.metadata;
    this._stats = params.stats;
    this._status = params.status;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters =====
  get uuid(): string {
    return this._uuid;
  }

  get repositoryUuid(): string {
    return this._repositoryUuid;
  }

  get folderUuid(): string | null | undefined {
    return this._folderUuid;
  }

  get name(): string {
    return this._name;
  }

  get type(): ResourceType {
    return this._type;
  }

  get path(): string {
    return this._path;
  }

  get size(): number {
    return this._size;
  }

  get content(): string | null | undefined {
    return this._content;
  }

  get metadata(): ResourceMetadata {
    return this._metadata;
  }

  get stats(): ResourceStats {
    return this._stats;
  }

  get status(): ResourceStatus {
    return this._status;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== UI 计算属性 =====
  get isDeleted(): boolean {
    return this._status === ResourceStatus.DELETED;
  }

  get isArchived(): boolean {
    return this._status === ResourceStatus.ARCHIVED;
  }

  get isActive(): boolean {
    return this._status === ResourceStatus.ACTIVE;
  }

  get isDraft(): boolean {
    return this._status === ResourceStatus.DRAFT;
  }

  get statusText(): string {
    const statusMap: Record<ResourceStatus, string> = {
      [ResourceStatus.ACTIVE]: '活跃',
      [ResourceStatus.ARCHIVED]: '已归档',
      [ResourceStatus.DELETED]: '已删除',
      [ResourceStatus.DRAFT]: '草稿',
    };
    return statusMap[this._status] || '未知';
  }

  get typeText(): string {
    const typeMap: Record<ResourceType, string> = {
      [ResourceType.MARKDOWN]: 'Markdown 文档',
      [ResourceType.IMAGE]: '图片',
      [ResourceType.VIDEO]: '视频',
      [ResourceType.AUDIO]: '音频',
      [ResourceType.PDF]: 'PDF 文档',
      [ResourceType.LINK]: '外部链接',
      [ResourceType.CODE]: '代码文件',
      [ResourceType.OTHER]: '其他文件',
    };
    return typeMap[this._type] || '未知类型';
  }

  get displayName(): string {
    return this._name;
  }

  get formattedSize(): string {
    const bytes = this._size;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  get createdAtText(): string {
    try {
      return formatDistanceToNow(this._createdAt, {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return new Date(this._createdAt).toLocaleDateString('zh-CN');
    }
  }

  get updatedAtText(): string {
    try {
      return formatDistanceToNow(this._updatedAt, {
        addSuffix: true,
        locale: zhCN,
      });
    } catch {
      return new Date(this._updatedAt).toLocaleDateString('zh-CN');
    }
  }

  get extension(): string {
    const ext = this._name.split('.').pop();
    return ext ? `.${ext}` : '';
  }

  get icon(): string {
    const iconMap: Record<ResourceType, string> = {
      [ResourceType.MARKDOWN]: 'mdi-language-markdown',
      [ResourceType.IMAGE]: 'mdi-image',
      [ResourceType.VIDEO]: 'mdi-video',
      [ResourceType.AUDIO]: 'mdi-music',
      [ResourceType.PDF]: 'mdi-file-pdf-box',
      [ResourceType.LINK]: 'mdi-link-variant',
      [ResourceType.CODE]: 'mdi-code-braces',
      [ResourceType.OTHER]: 'mdi-file',
    };
    return iconMap[this._type] || 'mdi-file';
  }

  // ===== DTO 转换方法 =====
  toClientDTO(): ResourceClientDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      folderUuid: this._folderUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      content: this._content,
      metadata: this._metadata.toClientDTO(),
      stats: this._stats.toClientDTO(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      isDeleted: this.isDeleted,
      isArchived: this.isArchived,
      isActive: this.isActive,
      isDraft: this.isDraft,
      statusText: this.statusText,
      typeText: this.typeText,
      displayName: this.displayName,
      formattedSize: this.formattedSize,
      createdAtText: this.createdAtText,
      updatedAtText: this.updatedAtText,
      extension: this.extension,
      icon: this.icon,
    };
  }

  toServerDTO(): ResourceServerDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      folderUuid: this._folderUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      content: this._content,
      metadata: this._metadata.toServerDTO(),
      stats: this._stats.toServerDTO(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: ResourceServerDTO): Resource {
    return new Resource({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      folderUuid: dto.folderUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: dto.size,
      content: dto.content,
      metadata: ResourceMetadata.fromServerDTO(dto.metadata),
      stats: ResourceStats.fromServerDTO(dto.stats),
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static fromClientDTO(dto: ResourceClientDTO): Resource {
    return new Resource({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      folderUuid: dto.folderUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: dto.size,
      content: dto.content,
      metadata: ResourceMetadata.fromClientDTO(dto.metadata),
      stats: ResourceStats.fromClientDTO(dto.stats),
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
