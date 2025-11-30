/**
 * TaskMetadata 值对象
 * 任务元数据 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  TaskMetadataClientDTO,
  TaskMetadataPersistenceDTO,
  TaskMetadataServer,
  TaskMetadataServerDTO,
} from '@dailyuse/contracts/schedule';
import { TaskPriority } from '@dailyuse/contracts/schedule';

/**
 * TaskMetadata 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TaskMetadata extends ValueObject implements TaskMetadataServer {
  public readonly payload: Record<string, any>;
  public readonly tags: string[];
  public readonly priority: TaskPriority;
  public readonly timeout: number | null;

  constructor(params: {
    payload?: Record<string, any>;
    tags?: string[];
    priority?: TaskPriority;
    timeout?: number | null;
  }) {
    super();

    // 安全地复制 payload，避免枚举过多属性
    const safePayload: Record<string, any> = {};
    if (params.payload) {
      try {
        // 只复制可枚举的自有属性，限制数量
        const keys = Object.keys(params.payload).slice(0, 100); // 限制最多100个属性
        for (const key of keys) {
          safePayload[key] = params.payload[key];
        }
      } catch (error) {
        console.warn('Failed to copy payload, using empty object:', error);
      }
    }

    this.payload = safePayload;
    this.tags = params.tags ? [...params.tags] : [];
    this.priority = params.priority || TaskPriority.NORMAL;
    this.timeout = params.timeout ?? null;

    // 验证配置
    this.validateAndThrow();

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.payload);
    Object.freeze(this.tags);
  }

  /**
   * 验证元数据有效性
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (this.timeout !== null && this.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    // 验证标签
    for (const tag of this.tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        errors.push('Tags must be non-empty strings');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * 验证并抛出异常（兼容旧代码）
   */
  private validateAndThrow(): void {
    const result = this.validate();
    if (!result.isValid) {
      throw new Error(result.errors[0]);
    }
  }

  /**
   * 更新 payload
   */
  public updatePayload(payload: Record<string, any>): TaskMetadata {
    return new TaskMetadata({
      payload,
      tags: Array.from(this.tags),
      priority: this.priority,
      timeout: this.timeout,
    });
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): TaskMetadata {
    if (this.tags.includes(tag)) {
      return this;
    }
    return new TaskMetadata({
      payload: this.payload,
      tags: [...this.tags, tag],
      priority: this.priority,
      timeout: this.timeout,
    });
  }

  /**
   * 移除标签
   */
  public removeTag(tag: string): TaskMetadata {
    const newTags = this.tags.filter((t) => t !== tag);
    if (newTags.length === this.tags.length) {
      return this;
    }
    return new TaskMetadata({
      payload: this.payload,
      tags: newTags,
      priority: this.priority,
      timeout: this.timeout,
    });
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      payload: Record<string, any>;
      tags: string[];
      priority: TaskPriority;
      timeout: number | null;
    }>,
  ): TaskMetadata {
    return new TaskMetadata({
      payload: changes.payload ?? this.payload,
      tags: changes.tags ?? Array.from(this.tags),
      priority: changes.priority ?? this.priority,
      timeout: changes.timeout !== undefined ? changes.timeout : this.timeout,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof TaskMetadata)) {
      return false;
    }

    return (
      JSON.stringify(this.payload) === JSON.stringify(other.payload) &&
      this.tags.length === other.tags.length &&
      this.tags.every((tag, index) => tag === other.tags[index]) &&
      this.priority === other.priority &&
      this.timeout === other.timeout
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): TaskMetadataServerDTO {
    return {
      payload: { ...this.payload },
      tags: Array.from(this.tags),
      priority: this.priority,
      timeout: this.timeout,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): TaskMetadataClientDTO {
    return {
      payload: { ...this.payload },
      tags: Array.from(this.tags),
      priority: this.priority,
      timeout: this.timeout,

      // UI 辅助属性
      priorityDisplay: this.priority, // 暂时直接使用枚举值
      priorityColor: this.getPriorityColor(),
      tagsDisplay: this.tags.join(', '),
      timeoutFormatted: this.timeout ? `${this.timeout}ms` : '无超时',
      payloadSummary:
        Object.keys(this.payload).length > 0
          ? `${Object.keys(this.payload).length} items`
          : 'Empty',
    };
  }

  private getPriorityColor(): string {
    switch (this.priority) {
      case TaskPriority.URGENT:
        return 'red';
      case TaskPriority.HIGH:
        return 'orange';
      case TaskPriority.NORMAL:
        return 'blue';
      case TaskPriority.LOW:
        return 'gray';
      default:
        return 'default';
    }
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): TaskMetadataPersistenceDTO {
    return {
      payload: JSON.stringify(this.payload),
      tags: JSON.stringify(this.tags),
      priority: this.priority,
      timeout: this.timeout,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: TaskMetadataServerDTO): TaskMetadata {
    return new TaskMetadata({
      payload: dto.payload,
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
    });
  }

  /**
   * 从 DTO 创建值对象 (兼容旧代码)
   */
  public static fromDTO(dto: any): TaskMetadata {
    return new TaskMetadata(dto);
  }

  /**
   * 创建默认元数据
   */
  public static createDefault(): TaskMetadata {
    return new TaskMetadata({
      payload: {},
      tags: [],
      priority: TaskPriority.NORMAL,
      timeout: null,
    });
  }
}
