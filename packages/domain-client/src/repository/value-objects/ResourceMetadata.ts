/**
 * Resource Metadata Value Object - Client Implementation
 * 资源元数据值对象 - 客户端实现
 */
import { ResourceMetadataClient, ResourceMetadataClientDTO, ResourceMetadataServerDTO } from '@dailyuse/contracts/repository';

export class ResourceMetadata implements ResourceMetadataClient {
  private readonly _wordCount?: number | null;
  private readonly _readingTime?: number | null;
  private readonly _thumbnail?: string | null;
  private readonly _extensible: Record<string, unknown>;

  constructor(
    wordCount?: number | null,
    readingTime?: number | null,
    thumbnail?: string | null,
    extensible: Record<string, unknown> = {},
  ) {
    this._wordCount = wordCount ?? null;
    this._readingTime = readingTime ?? null;
    this._thumbnail = thumbnail ?? null;
    this._extensible = extensible;
  }

  // ===== Getters =====
  get wordCount(): number | null | undefined {
    return this._wordCount;
  }

  get readingTime(): number | null | undefined {
    return this._readingTime;
  }

  get thumbnail(): string | null | undefined {
    return this._thumbnail;
  }

  [key: string]: unknown;

  // ===== UI 计算属性 =====
  get wordCountText(): string {
    if (!this._wordCount) return '0 字';
    return `${this._wordCount.toLocaleString()} 字`;
  }

  get readingTimeText(): string {
    if (!this._readingTime) return '约 0 分钟';
    return `约 ${this._readingTime} 分钟`;
  }

  get hasThumbnail(): boolean {
    return !!this._thumbnail;
  }

  // ===== DTO 转换 =====
  toClientDTO(): ResourceMetadataClientDTO {
    return {
      wordCount: this._wordCount,
      readingTime: this._readingTime,
      thumbnail: this._thumbnail,
      ...this._extensible,
      wordCountText: this.wordCountText,
      readingTimeText: this.readingTimeText,
      hasThumbnail: this.hasThumbnail,
    };
  }

  toServerDTO(): ResourceMetadataServerDTO {
    return {
      wordCount: this._wordCount,
      readingTime: this._readingTime,
      thumbnail: this._thumbnail,
      ...this._extensible,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: ResourceMetadataServerDTO): ResourceMetadata {
    const { wordCount, readingTime, thumbnail, ...rest } = dto;
    return new ResourceMetadata(wordCount, readingTime, thumbnail, rest);
  }

  static fromClientDTO(dto: ResourceMetadataClientDTO): ResourceMetadata {
    const { wordCount, readingTime, thumbnail, wordCountText, readingTimeText, hasThumbnail, ...rest } = dto;
    return new ResourceMetadata(wordCount, readingTime, thumbnail, rest);
  }
}
