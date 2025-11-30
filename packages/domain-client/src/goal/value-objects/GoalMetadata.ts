/**
 * GoalMetadata 值对象实现 (Client)
 */

import type {
  GoalMetadataClient,
  GoalMetadataClientDTO,
  GoalMetadataServerDTO,
} from '@dailyuse/contracts/goal';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';
import { ValueObject } from '@dailyuse/utils';

export class GoalMetadata extends ValueObject implements GoalMetadataClient {
  private _importance: ImportanceLevel;
  private _urgency: UrgencyLevel;
  private _category: string | null;
  private _tags: string[];

  private constructor(params: {
    importance: ImportanceLevel;
    urgency: UrgencyLevel;
    category?: string | null;
    tags: string[];
  }) {
    super();
    this._importance = params.importance;
    this._urgency = params.urgency;
    this._category = params.category ?? null;
    this._tags = params.tags;
  }

  // Getters
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get urgency(): UrgencyLevel {
    return this._urgency;
  }
  public get category(): string | null {
    return this._category;
  }
  public get tags(): string[] {
    return [...this._tags];
  }

  // UI 辅助属性
  public get importanceText(): string {
    return this._importance || '未知';
  }

  public get urgencyText(): string {
    return this._urgency || '未知';
  }

  public get priorityLevel(): 'HIGH' | 'MEDIUM' | 'LOW' {
    const ImportanceLevelMap = {
      [ImportanceLevel.Trivial]: 1,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Vital]: 5,
    };
    const UrgencyLevelMap = {
      [UrgencyLevel.None]: 1,
      [UrgencyLevel.Low]: 2,
      [UrgencyLevel.Medium]: 3,
      [UrgencyLevel.High]: 4,
      [UrgencyLevel.Critical]: 5,
    };
    const priority =
      ImportanceLevelMap[this._importance] || 0 + UrgencyLevelMap[this._urgency] || 0;
    if (priority >= 7) return 'HIGH';
    if (priority >= 5) return 'MEDIUM';
    return 'LOW';
  }

  public get priorityBadgeColor(): string {
    const colorMap = {
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };
    return colorMap[this.priorityLevel];
  }

  public get categoryDisplay(): string {
    return this._category || '未分类';
  }

  public get tagsDisplay(): string {
    return this._tags.length > 0 ? this._tags.join(', ') : '无标签';
  }

  // 值对象方法
  public equals(other: GoalMetadataClient): boolean {
    return (
      this._importance === other.importance &&
      this._urgency === other.urgency &&
      this._category === other.category &&
      JSON.stringify(this._tags.sort()) === JSON.stringify([...other.tags].sort())
    );
  }

  // UI 辅助方法
  public hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  // DTO 转换
  public toServerDTO(): GoalMetadataServerDTO {
    return {
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: [...this._tags],
    };
  }

  public toClientDTO(): GoalMetadataClientDTO {
    return {
      importance: this._importance,
      urgency: this._urgency,
      category: this._category,
      tags: [...this._tags],
      importanceText: this.importanceText,
      urgencyText: this.urgencyText,
      priorityLevel: this.priorityLevel,
      priorityBadgeColor: this.priorityBadgeColor,
      categoryDisplay: this.categoryDisplay,
      tagsDisplay: this.tagsDisplay,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalMetadataClientDTO): GoalMetadata {
    return new GoalMetadata({
      importance: dto.importance,
      urgency: dto.urgency,
      category: dto.category,
      tags: dto.tags,
    });
  }

  public static fromServerDTO(dto: GoalMetadataServerDTO): GoalMetadata {
    return new GoalMetadata({
      importance: dto.importance,
      urgency: dto.urgency,
      category: dto.category,
      tags: dto.tags,
    });
  }
}
