/**
 * RecurrenceRule 值对象 (Server)
 * 重复规则 - 不可变值对象
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRecurrenceRule = TaskContracts.RecurrenceRuleServerDTO;
type RecurrenceFrequency = TaskContracts.RecurrenceFrequency;
type DayOfWeek = TaskContracts.DayOfWeek;

/**
 * RecurrenceRule 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class RecurrenceRule extends ValueObject implements IRecurrenceRule {
  public readonly frequency: RecurrenceFrequency;
  public readonly interval: number;
  public readonly daysOfWeek: DayOfWeek[];
  public readonly endDate: number | null;
  public readonly occurrences: number | null;

  constructor(params: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek: DayOfWeek[];
    endDate?: number | null;
    occurrences?: number | null;
  }) {
    super();

    // 验证
    if (params.interval < 1) {
      throw new Error('Interval must be at least 1');
    }

    if (params.endDate !== undefined && params.endDate !== null && params.endDate < Date.now()) {
      throw new Error('End date must be in the future');
    }

    if (params.occurrences !== undefined && params.occurrences !== null && params.occurrences < 1) {
      throw new Error('Occurrences must be at least 1');
    }

    this.frequency = params.frequency;
    this.interval = params.interval;
    this.daysOfWeek = [...params.daysOfWeek]; // 复制数组
    this.endDate = params.endDate ?? null;
    this.occurrences = params.occurrences ?? null;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.daysOfWeek);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      frequency: RecurrenceFrequency;
      interval: number;
      daysOfWeek: DayOfWeek[];
      endDate: number | null;
      occurrences: number | null;
    }>,
  ): RecurrenceRule {
    return new RecurrenceRule({
      frequency: changes.frequency ?? this.frequency,
      interval: changes.interval ?? this.interval,
      daysOfWeek: changes.daysOfWeek ?? this.daysOfWeek,
      endDate: changes.endDate ?? this.endDate,
      occurrences: changes.occurrences ?? this.occurrences,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: RecurrenceRule): boolean {
    if (!(other instanceof RecurrenceRule)) {
      return false;
    }

    return (
      this.frequency === other.frequency &&
      this.interval === other.interval &&
      this.endDate === other.endDate &&
      this.occurrences === other.occurrences &&
      this.daysOfWeek.length === other.daysOfWeek.length &&
      this.daysOfWeek.every((day, index) => day === other.daysOfWeek[index])
    );
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskContracts.RecurrenceRuleServerDTO {
    return {
      frequency: this.frequency,
      interval: this.interval,
      daysOfWeek: [...this.daysOfWeek],
      endDate: this.endDate,
      occurrences: this.occurrences,
    };
  }

  public toClientDTO(): TaskContracts.RecurrenceRuleClientDTO {
    return {
      frequency: this.frequency,
      interval: this.interval,
      daysOfWeek: [...this.daysOfWeek],
      endDate: this.endDate,
      occurrences: this.occurrences,
      frequencyText: this.getFrequencyText(),
      dayNames: this.getDayNames(),
      recurrenceDisplayText: this.getRecurrenceDisplayText(),
      hasEndCondition: this.endDate !== null || this.occurrences !== null,
    };
  }

  public toPersistenceDTO(): TaskContracts.RecurrenceRulePersistenceDTO {
    return {
      frequency: this.frequency,
      interval: this.interval,
      daysOfWeek: JSON.stringify(this.daysOfWeek),
      endDate: this.endDate,
      occurrences: this.occurrences,
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(dto: TaskContracts.RecurrenceRuleServerDTO): RecurrenceRule {
    // 防御性检查：确保 daysOfWeek 是数组
    let daysOfWeek: DayOfWeek[];
    if (Array.isArray(dto.daysOfWeek)) {
      daysOfWeek = dto.daysOfWeek;
    } else if (typeof dto.daysOfWeek === 'string') {
      // 如果是 JSON 字符串，尝试解析
      try {
        daysOfWeek = JSON.parse(dto.daysOfWeek);
      } catch {
        daysOfWeek = [];
      }
    } else {
      daysOfWeek = [];
    }

    return new RecurrenceRule({
      frequency: dto.frequency,
      interval: dto.interval,
      daysOfWeek,
      endDate: dto.endDate,
      occurrences: dto.occurrences,
    });
  }

  public static fromPersistenceDTO(
    dto: TaskContracts.RecurrenceRulePersistenceDTO,
  ): RecurrenceRule {
    return new RecurrenceRule({
      frequency: dto.frequency as RecurrenceFrequency,
      interval: dto.interval,
      daysOfWeek: JSON.parse(dto.daysOfWeek) as DayOfWeek[],
      endDate: dto.endDate,
      occurrences: dto.occurrences,
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getFrequencyText(): string {
    const map: Record<RecurrenceFrequency, string> = {
      DAILY: '每天',
      WEEKLY: '每周',
      MONTHLY: '每月',
      YEARLY: '每年',
    };
    return map[this.frequency];
  }

  private getDayNames(): string[] {
    const dayMap: Record<number, string> = {
      0: '周日',
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五',
      6: '周六',
    };
    return this.daysOfWeek.map((day) => dayMap[day]);
  }

  private getRecurrenceDisplayText(): string {
    let text = '';
    if (this.interval > 1) {
      text = `每${this.interval}${this.getFrequencyText().replace('每', '')}`;
    } else {
      text = this.getFrequencyText();
    }

    if (this.frequency === 'WEEKLY' && this.daysOfWeek.length > 0) {
      text += ` (${this.getDayNames().join('、')})`;
    }

    return text;
  }

  private getEndConditionText(): string | null {
    if (this.endDate) {
      return `截止 ${new Date(this.endDate).toLocaleDateString()}`;
    }
    if (this.occurrences) {
      return `重复 ${this.occurrences} 次`;
    }
    return null;
  }
}
