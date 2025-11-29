/**
 * DocumentMetadata 值对象
 * 文档元数据 - 不可变值对象
 */

import type {
  DocumentMetadataClientDTO,
  DocumentMetadataPersistenceDTO,
  DocumentMetadataServerDTO,
  IDocumentMetadataServer,
} from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * DocumentMetadata 值对象
 */
export class DocumentMetadata extends ValueObject implements DocumentMetadata {
  public readonly tags: string[];
  public readonly category: string | null;
  public readonly wordCount: number | null;
  public readonly characterCount: number | null;
  public readonly readingTime: number | null;
  public readonly encoding: string | null;
  public readonly language: string | null;
  public readonly customFields: Record<string, any> | null;

  constructor(params: {
    tags: string[];
    category?: string | null;
    wordCount?: number | null;
    characterCount?: number | null;
    readingTime?: number | null;
    encoding?: string | null;
    language?: string | null;
    customFields?: Record<string, any> | null;
  }) {
    super();

    this.tags = [...params.tags];
    this.category = params.category ?? null;
    this.wordCount = params.wordCount ?? null;
    this.characterCount = params.characterCount ?? null;
    this.readingTime = params.readingTime ?? null;
    this.encoding = params.encoding ?? null;
    this.language = params.language ?? null;
    this.customFields = params.customFields ? { ...params.customFields } : null;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.tags);
    if (this.customFields) {
      Object.freeze(this.customFields);
    }
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      tags: string[];
      category: string | null;
      wordCount: number | null;
      characterCount: number | null;
      readingTime: number | null;
      encoding: string | null;
      language: string | null;
      customFields: Record<string, any> | null;
    }>,
  ): DocumentMetadata {
    return new DocumentMetadata({
      tags: changes.tags ?? this.tags,
      category: changes.category !== undefined ? changes.category : this.category,
      wordCount: changes.wordCount !== undefined ? changes.wordCount : this.wordCount,
      characterCount:
        changes.characterCount !== undefined ? changes.characterCount : this.characterCount,
      readingTime: changes.readingTime !== undefined ? changes.readingTime : this.readingTime,
      encoding: changes.encoding !== undefined ? changes.encoding : this.encoding,
      language: changes.language !== undefined ? changes.language : this.language,
      customFields: changes.customFields !== undefined ? changes.customFields : this.customFields,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: IDocumentMetadataServer): boolean {
    if (!(other instanceof DocumentMetadata)) {
      return false;
    }

    return (
      JSON.stringify(this.tags) === JSON.stringify(other.tags) &&
      this.category === other.category &&
      this.wordCount === other.wordCount &&
      this.characterCount === other.characterCount &&
      this.readingTime === other.readingTime &&
      this.encoding === other.encoding &&
      this.language === other.language &&
      JSON.stringify(this.customFields) === JSON.stringify(other.customFields)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): DocumentMetadataServerDTO {
    return {
      tags: [...this.tags],
      category: this.category,
      wordCount: this.wordCount,
      characterCount: this.characterCount,
      readingTime: this.readingTime,
      encoding: this.encoding,
      language: this.language,
      customFields: this.customFields ? { ...this.customFields } : null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): DocumentMetadataClientDTO {
    return this.toServerDTO();
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): DocumentMetadataPersistenceDTO {
    return {
      tags: JSON.stringify(this.tags),
      category: this.category,
      word_count: this.wordCount,
      character_count: this.characterCount,
      reading_time: this.readingTime,
      encoding: this.encoding,
      language: this.language,
      custom_fields: this.customFields ? JSON.stringify(this.customFields) : null,
    };
  }

  /**
   * 从 Server DTO 创建实例
   */
  public static fromServerDTO(dto: DocumentMetadataServerDTO): DocumentMetadata {
    return new DocumentMetadata({
      tags: dto.tags,
      category: dto.category,
      wordCount: dto.wordCount,
      characterCount: dto.characterCount,
      readingTime: dto.readingTime,
      encoding: dto.encoding,
      language: dto.language,
      customFields: dto.customFields,
    });
  }

  /**
   * 从 Persistence DTO 创建实例
   */
  public static fromPersistenceDTO(dto: DocumentMetadataPersistenceDTO): DocumentMetadata {
    return new DocumentMetadata({
      tags: JSON.parse(dto.tags),
      category: dto.category,
      wordCount: dto.word_count,
      characterCount: dto.character_count,
      readingTime: dto.reading_time,
      encoding: dto.encoding,
      language: dto.language,
      customFields: dto.custom_fields ? JSON.parse(dto.custom_fields) : null,
    });
  }

  /**
   * 创建默认实例
   */
  public static createDefault(): DocumentMetadata {
    return new DocumentMetadata({
      tags: [],
      category: null,
      wordCount: null,
      characterCount: null,
      readingTime: null,
      encoding: 'utf-8',
      language: null,
      customFields: null,
    });
  }
}
