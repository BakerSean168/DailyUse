/**
 * Resource Metadata Value Object - Server Implementation
 * 资源元数据值对象 - 服务端实现
 */
import type { ResourceMetadataServer, ResourceMetadataServerDTO } from '@dailyuse/contracts/repository';

export class ResourceMetadata implements ResourceMetadataServer {
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

  // ===== DTO 转换 =====
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

  static create(params?: Partial<ResourceMetadataServerDTO>): ResourceMetadata {
    return new ResourceMetadata(
      params?.wordCount,
      params?.readingTime,
      params?.thumbnail,
      {},
    );
  }
}
