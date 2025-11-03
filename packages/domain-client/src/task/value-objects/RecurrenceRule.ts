/**
 * RecurrenceRule 值对象实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IRecurrenceRuleClient = TaskContracts.RecurrenceRuleClient;
type RecurrenceRuleClientDTO = TaskContracts.RecurrenceRuleClientDTO;
type RecurrenceRuleServerDTO = TaskContracts.RecurrenceRuleServerDTO;
type RecurrenceFrequency = TaskContracts.RecurrenceFrequency;
type DayOfWeek = TaskContracts.DayOfWeek;

export class RecurrenceRuleClient extends ValueObject implements IRecurrenceRuleClient {
  private _frequency: RecurrenceFrequency;
  private _interval: number;
  private _daysOfWeek: DayOfWeek[];
  private _endDate: number | null;
  private _occurrences: number | null;

  private constructor(params: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek: DayOfWeek[];
    endDate?: number | null;
    occurrences?: number | null;
  }) {
    super();
    this._frequency = params.frequency;
    this._interval = params.interval;
    this._daysOfWeek = params.daysOfWeek;
    this._endDate = params.endDate ?? null;
    this._occurrences = params.occurrences ?? null;
  }

  // Getters
  public get frequency(): RecurrenceFrequency {
    return this._frequency;
  }
  public get interval(): number {
    return this._interval;
  }
  public get daysOfWeek(): DayOfWeek[] {
    return [...this._daysOfWeek];
  }
  public get endDate(): number | null {
    return this._endDate;
  }
  public get occurrences(): number | null {
    return this._occurrences;
  }

  // UI 辅助属性
  public get frequencyText(): string {
    const map: Record<RecurrenceFrequency, string> = {
      DAILY: '每天',
      WEEKLY: '每周',
      MONTHLY: '每月',
      YEARLY: '每年',
    };
    return map[this._frequency];
  }

  public get dayNames(): string[] {
    const dayMap: Record<number, string> = {
      0: '周日',
      1: '周一',
      2: '周二',
      3: '周三',
      4: '周四',
      5: '周五',
      6: '周六',
    };
    return this._daysOfWeek.map((day) => dayMap[day]);
  }

  public get recurrenceDisplayText(): string {
    let text = '';
    if (this._interval > 1) {
      text = `每${this._interval}${this.frequencyText.replace('每', '')}`;
    } else {
      text = this.frequencyText;
    }

    if (this._frequency === 'WEEKLY' && this._daysOfWeek.length > 0) {
      text += `(${this.dayNames.join('、')})`;
    }

    if (this._endDate) {
      const endDateStr = new Date(this._endDate).toLocaleDateString();
      text += ` 至 ${endDateStr}`;
    } else if (this._occurrences) {
      text += ` (共${this._occurrences}次)`;
    }

    return text;
  }

  public get hasEndCondition(): boolean {
    return this._endDate !== null || this._occurrences !== null;
  }

  // 值对象方法
  public equals(other: IRecurrenceRuleClient): boolean {
    return (
      this._frequency === other.frequency &&
      this._interval === other.interval &&
      JSON.stringify(this._daysOfWeek.sort()) === JSON.stringify([...other.daysOfWeek].sort()) &&
      this._endDate === other.endDate &&
      this._occurrences === other.occurrences
    );
  }

  // UI 辅助方法
  public hasDay(day: DayOfWeek): boolean {
    return this._daysOfWeek.includes(day);
  }

  // DTO 转换
  public toServerDTO(): RecurrenceRuleServerDTO {
    return {
      frequency: this._frequency,
      interval: this._interval,
      daysOfWeek: [...this._daysOfWeek],
      endDate: this._endDate,
      occurrences: this._occurrences,
    };
  }

  public toClientDTO(): RecurrenceRuleClientDTO {
    return {
      frequency: this._frequency,
      interval: this._interval,
      daysOfWeek: [...this._daysOfWeek],
      endDate: this._endDate,
      occurrences: this._occurrences,
      frequencyText: this.frequencyText,
      dayNames: this.dayNames,
      recurrenceDisplayText: this.recurrenceDisplayText,
      hasEndCondition: this.hasEndCondition,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: RecurrenceRuleClientDTO): RecurrenceRuleClient {
    return new RecurrenceRuleClient({
      frequency: dto.frequency,
      interval: dto.interval,
      daysOfWeek: dto.daysOfWeek,
      endDate: dto.endDate,
      occurrences: dto.occurrences,
    });
  }

  public static fromServerDTO(dto: RecurrenceRuleServerDTO): RecurrenceRuleClient {
    return new RecurrenceRuleClient({
      frequency: dto.frequency,
      interval: dto.interval,
      daysOfWeek: dto.daysOfWeek,
      endDate: dto.endDate,
      occurrences: dto.occurrences,
    });
  }
}
