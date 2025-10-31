/**
 * RepositoryConfig 值对象
 * 仓库配置 - 不可变值对象
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRepositoryConfig = RepositoryContracts.RepositoryConfigServerDTO;
type RepositoryConfigPersistenceDTO = RepositoryContracts.RepositoryConfigPersistenceDTO;
type RepositoryConfigClientDTO = RepositoryContracts.RepositoryConfigClientDTO;
type ResourceType = RepositoryContracts.ResourceType;

/**
 * RepositoryConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class RepositoryConfig extends ValueObject implements IRepositoryConfig {
  public readonly enableGit: boolean;
  public readonly autoSync: boolean;
  public readonly syncInterval: number | null;
  public readonly defaultLinkedDocName: string;
  public readonly supportedFileTypes: ResourceType[];
  public readonly maxFileSize: number;
  public readonly enableVersionControl: boolean;

  constructor(params: {
    enableGit: boolean;
    autoSync: boolean;
    syncInterval?: number | null;
    defaultLinkedDocName: string;
    supportedFileTypes: ResourceType[];
    maxFileSize: number;
    enableVersionControl: boolean;
  }) {
    super(); // 调用基类构造函数

    this.enableGit = params.enableGit;
    this.autoSync = params.autoSync;
    this.syncInterval = params.syncInterval ?? null;
    this.defaultLinkedDocName = params.defaultLinkedDocName;
    this.supportedFileTypes = [...params.supportedFileTypes]; // 复制数组
    this.maxFileSize = params.maxFileSize;
    this.enableVersionControl = params.enableVersionControl;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.supportedFileTypes);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      enableGit: boolean;
      autoSync: boolean;
      syncInterval: number | null;
      defaultLinkedDocName: string;
      supportedFileTypes: ResourceType[];
      maxFileSize: number;
      enableVersionControl: boolean;
    }>,
  ): RepositoryConfig {
    return new RepositoryConfig({
      enableGit: changes.enableGit ?? this.enableGit,
      autoSync: changes.autoSync ?? this.autoSync,
      syncInterval: changes.syncInterval ?? this.syncInterval,
      defaultLinkedDocName: changes.defaultLinkedDocName ?? this.defaultLinkedDocName,
      supportedFileTypes: changes.supportedFileTypes ?? this.supportedFileTypes,
      maxFileSize: changes.maxFileSize ?? this.maxFileSize,
      enableVersionControl: changes.enableVersionControl ?? this.enableVersionControl,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof RepositoryConfig)) {
      return false;
    }

    return (
      this.enableGit === other.enableGit &&
      this.autoSync === other.autoSync &&
      this.syncInterval === other.syncInterval &&
      this.defaultLinkedDocName === other.defaultLinkedDocName &&
      this.maxFileSize === other.maxFileSize &&
      this.enableVersionControl === other.enableVersionControl &&
      this.supportedFileTypes.length === other.supportedFileTypes.length &&
      this.supportedFileTypes.every((type, index) => type === other.supportedFileTypes[index])
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): IRepositoryConfig {
    return {
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      syncInterval: this.syncInterval,
      defaultLinkedDocName: this.defaultLinkedDocName,
      supportedFileTypes: [...this.supportedFileTypes],
      maxFileSize: this.maxFileSize,
      enableVersionControl: this.enableVersionControl,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): RepositoryConfigClientDTO {
    return {
      enableGit: this.enableGit,
      autoSync: this.autoSync,
      supportedFileTypes: [...this.supportedFileTypes],
      syncIntervalFormatted: this.syncInterval ? `${this.syncInterval}分钟` : null,
      maxFileSizeFormatted: `${Math.round(this.maxFileSize / 1024 / 1024)}MB`,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): RepositoryConfigPersistenceDTO {
    return {
      enable_git: this.enableGit,
      auto_sync: this.autoSync,
      sync_interval: this.syncInterval,
      default_linked_doc_name: this.defaultLinkedDocName,
      supported_file_types: JSON.stringify(this.supportedFileTypes),
      max_file_size: this.maxFileSize,
      enable_version_control: this.enableVersionControl,
    };
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): IRepositoryConfig {
    return this.toServerDTO();
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: IRepositoryConfig): RepositoryConfig {
    return new RepositoryConfig(dto);
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(config: IRepositoryConfig): RepositoryConfig {
    return RepositoryConfig.fromServerDTO(config);
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): RepositoryConfig {
    return new RepositoryConfig({
      enableGit: false,
      autoSync: false,
      syncInterval: null,
      defaultLinkedDocName: 'index.md',
      supportedFileTypes: [],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      enableVersionControl: true,
    });
  }
}
