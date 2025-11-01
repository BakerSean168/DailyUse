/**
 * ResourceMetadata 值对象
 * 资源元数据 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';
import type { RepositoryContracts } from '@dailyuse/contracts';

type IResourceMetadata = RepositoryContracts.ResourceMetadata;

/**
 * ResourceMetadata 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class ResourceMetadata extends ValueObject implements IResourceMetadata {
  public readonly mimeType: string | null;
  public readonly encoding: string | null;
  public readonly thumbnailPath: string | null;
  public readonly isFavorite: boolean;
  public readonly accessCount: number;
  public readonly lastAccessedAt: number | null;
  
  // 允许额外的自定义字段
  [key: string]: any;

  constructor(params: {
    mimeType?: string | null;
    encoding?: string | null;
    thumbnailPath?: string | null;
    isFavorite?: boolean;
    accessCount?: number;
    lastAccessedAt?: number | null;
    [key: string]: any;
  }) {
    super();

    this.mimeType = params.mimeType ?? null;
    this.encoding = params.encoding ?? null;
    this.thumbnailPath = params.thumbnailPath ?? null;
    this.isFavorite = params.isFavorite ?? false;
    this.accessCount = params.accessCount ?? 0;
    this.lastAccessedAt = params.lastAccessedAt ?? null;

    // 复制其他自定义字段
    Object.keys(params).forEach((key) => {
      if (!['mimeType', 'encoding', 'thumbnailPath', 'isFavorite', 'accessCount', 'lastAccessedAt'].includes(key)) {
        this[key] = params[key];
      }
    });

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(changes: Partial<IResourceMetadata>): ResourceMetadata {
    return new ResourceMetadata({
      mimeType: changes.mimeType ?? this.mimeType,
      encoding: changes.encoding ?? this.encoding,
      thumbnailPath: changes.thumbnailPath ?? this.thumbnailPath,
      isFavorite: changes.isFavorite ?? this.isFavorite,
      accessCount: changes.accessCount ?? this.accessCount,
      lastAccessedAt: changes.lastAccessedAt ?? this.lastAccessedAt,
      // 保留其他自定义字段
      ...Object.keys(this)
        .filter(key => !['mimeType', 'encoding', 'thumbnailPath', 'isFavorite', 'accessCount', 'lastAccessedAt'].includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: this[key] }), {}),
      // 应用 changes 中的自定义字段
      ...Object.keys(changes)
        .filter(key => !['mimeType', 'encoding', 'thumbnailPath', 'isFavorite', 'accessCount', 'lastAccessedAt'].includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: (changes as any)[key] }), {}),
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ResourceMetadata)) {
      return false;
    }

    return (
      this.mimeType === other.mimeType &&
      this.encoding === other.encoding &&
      this.thumbnailPath === other.thumbnailPath &&
      this.isFavorite === other.isFavorite &&
      this.accessCount === other.accessCount &&
      this.lastAccessedAt === other.lastAccessedAt
    );
  }

  /**
   * 增加访问次数
   */
  public incrementAccessCount(): ResourceMetadata {
    return this.with({
      accessCount: this.accessCount + 1,
      lastAccessedAt: Date.now(),
    });
  }

  /**
   * 标记为收藏
   */
  public markAsFavorite(): ResourceMetadata {
    return this.with({ isFavorite: true });
  }

  /**
   * 取消收藏
   */
  public unmarkAsFavorite(): ResourceMetadata {
    return this.with({ isFavorite: false });
  }

  /**
   * 转换为普通对象
   */
  public toPlainObject(): IResourceMetadata {
    const result: IResourceMetadata = {
      mimeType: this.mimeType,
      encoding: this.encoding,
      thumbnailPath: this.thumbnailPath,
      isFavorite: this.isFavorite,
      accessCount: this.accessCount,
      lastAccessedAt: this.lastAccessedAt,
    };

    // 包含自定义字段
    Object.keys(this).forEach((key) => {
      if (!['mimeType', 'encoding', 'thumbnailPath', 'isFavorite', 'accessCount', 'lastAccessedAt'].includes(key)) {
        result[key] = this[key];
      }
    });

    return result;
  }

  /**
   * 从普通对象创建值对象
   */
  public static fromPlainObject(obj: IResourceMetadata): ResourceMetadata {
    return new ResourceMetadata(obj);
  }

  /**
   * 创建默认元数据
   */
  public static createDefault(mimeType?: string | null): ResourceMetadata {
    return new ResourceMetadata({
      mimeType: mimeType ?? null,
      encoding: 'utf-8',
      thumbnailPath: null,
      isFavorite: false,
      accessCount: 0,
      lastAccessedAt: null,
    });
  }
}
