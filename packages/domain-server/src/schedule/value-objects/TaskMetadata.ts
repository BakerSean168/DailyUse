/**
 * TaskMetadata 值对象
 * 任务元数据 - 不可变值对象
 */

import { ValueObject } from '@dailyuse/utils';

type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface ITaskMetadataDTO {
  payload: Record<string, any>;
  tags: string[];
  priority: TaskPriority;
  timeout: number | null;
}

/**
 * TaskMetadata 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TaskMetadata extends ValueObject implements ITaskMetadataDTO {
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
    this.priority = params.priority || 'NORMAL';
    this.timeout = params.timeout ?? null;

    // 验证配置
    this.validate();

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.payload);
    Object.freeze(this.tags);
  }

  /**
   * 验证元数据有效性
   */
  private validate(): void {
    if (this.timeout !== null && this.timeout <= 0) {
      throw new Error('Timeout must be positive');
    }

    // 验证标签
    for (const tag of this.tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        throw new Error('Tags must be non-empty strings');
      }
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
   * 转换为 DTO
   */
  public toDTO(): ITaskMetadataDTO {
    return {
      payload: { ...this.payload },
      tags: Array.from(this.tags),
      priority: this.priority,
      timeout: this.timeout,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromDTO(dto: ITaskMetadataDTO): TaskMetadata {
    return new TaskMetadata(dto);
  }

  /**
   * 创建默认元数据
   */
  public static createDefault(): TaskMetadata {
    return new TaskMetadata({
      payload: {},
      tags: [],
      priority: 'NORMAL',
      timeout: null,
    });
  }
}
