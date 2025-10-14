/**
 * GoalMetadata 值对象
 * 目标元数据 - 不可变值对象
 */

import type { GoalContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IGoalMetadataServerDTO = GoalContracts.GoalMetadataServerDTO;

/**
 * GoalMetadata 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class GoalMetadata extends ValueObject {
  public readonly importance: ImportanceLevel;
  public readonly urgency: UrgencyLevel;
  public readonly category: string | null;
  public readonly tags: string[];

  constructor(params: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    category?: string | null;
    tags?: string[];
  }) {
    super();

    this.importance = params.importance;
    this.urgency = params.urgency;
    this.category = params.category ?? null;
    this.tags = [...(params.tags ?? [])];

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.tags);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      importance: ImportanceLevel;
      urgency: UrgencyLevel;
      category: string | null;
      tags: string[];
    }>,
  ): GoalMetadata {
    return new GoalMetadata({
      importance: changes.importance ?? this.importance,
      urgency: changes.urgency ?? this.urgency,
      category: changes.category ?? this.category,
      tags: changes.tags ?? this.tags,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof GoalMetadata)) {
      return false;
    }

    return (
      this.importance === other.importance &&
      this.urgency === other.urgency &&
      this.category === other.category &&
      this.arraysEqual(this.tags, other.tags)
    );
  }

  private arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  /**
   * 计算优先级分数（importance + urgency）
   * 根据枚举值计算数字分数
   */
  public getPriority(): number {
    const importanceScore = this.getImportanceScore();
    const urgencyScore = this.getUrgencyScore();
    return importanceScore + urgencyScore;
  }

  /**
   * 获取重要性分数
   */
  private getImportanceScore(): number {
    const scores: Record<ImportanceLevel, number> = {
      [ImportanceLevel.Vital]: 5,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Trivial]: 1,
    };
    return scores[this.importance] || 0;
  }

  /**
   * 获取紧急性分数
   */
  private getUrgencyScore(): number {
    const scores: Record<UrgencyLevel, number> = {
      [UrgencyLevel.Critical]: 5,
      [UrgencyLevel.High]: 4,
      [UrgencyLevel.Medium]: 3,
      [UrgencyLevel.Low]: 2,
      [UrgencyLevel.None]: 1,
    };
    return scores[this.urgency] || 0;
  }

  /**
   * 检查是否有指定标签
   */
  public hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  /**
   * 添加标签（返回新实例）
   */
  public addTag(tag: string): GoalMetadata {
    if (this.hasTag(tag)) {
      return this;
    }
    return this.with({ tags: [...this.tags, tag] });
  }

  /**
   * 移除标签（返回新实例）
   */
  public removeTag(tag: string): GoalMetadata {
    if (!this.hasTag(tag)) {
      return this;
    }
    return this.with({ tags: this.tags.filter((t) => t !== tag) });
  }

  /**
   * 转换为 Contract 接口
   */
  public toContract(): IGoalMetadataServerDTO {
    return {
      importance: this.importance,
      urgency: this.urgency,
      tags: [...this.tags],
    };
  }

  /**
   * 从 Contract 接口创建值对象
   */
  public static fromContract(dto: IGoalMetadataServerDTO): GoalMetadata {
    return new GoalMetadata(dto);
  }

  /**
   * 创建默认元数据
   */
  public static createDefault(): GoalMetadata {
    return new GoalMetadata({
      importance: 2 as unknown as ImportanceLevel, // MEDIUM
      urgency: 2 as unknown as UrgencyLevel, // MEDIUM
      category: null,
      tags: [],
    });
  }
}
