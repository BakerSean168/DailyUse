/**
 * GoalReminderConfig 值对象实现 (Client)
 */

import type {
  GoalReminderConfigClientDTO,
  GoalReminderConfigServerDTO,
  IGoalReminderConfigClient,
  ReminderTrigger,
  ReminderTriggerType,
} from '@dailyuse/contracts/goal';
import { ValueObject } from '@dailyuse/utils';

export class GoalReminderConfig extends ValueObject implements GoalReminderConfig {
  private _enabled: boolean;
  private _triggers: ReminderTrigger[];

  private constructor(params: { enabled: boolean; triggers: ReminderTrigger[] }) {
    super();
    this._enabled = params.enabled;
    this._triggers = params.triggers;
  }

  // Getters
  public get enabled(): boolean {
    return this._enabled;
  }
  public get triggers(): ReminderTrigger[] {
    return [...this._triggers];
  }

  // UI 辅助属性
  public get statusText(): string {
    if (!this._enabled) return '未启用';
    const count = this.activeTriggerCount;
    return count > 0 ? `已启用 ${count} 个提醒` : '已启用（无触发器）';
  }

  public get progressTriggerCount(): number {
    return this._triggers.filter((t) => t.type === 'TIME_PROGRESS_PERCENTAGE').length;
  }

  public get remainingDaysTriggerCount(): number {
    return this._triggers.filter((t) => t.type === 'REMAINING_DAYS').length;
  }

  public get activeTriggerCount(): number {
    return this._triggers.filter((t) => t.enabled).length;
  }

  public get triggerSummary(): string {
    const progressTriggers = this.getProgressTriggers().filter((t) => t.enabled);
    const daysTriggers = this.getRemainingDaysTriggers().filter((t) => t.enabled);

    const parts: string[] = [];
    if (progressTriggers.length > 0) {
      const values = progressTriggers.map((t) => `${t.value}%`).join(', ');
      parts.push(`进度 ${values}`);
    }
    if (daysTriggers.length > 0) {
      const values = daysTriggers.map((t) => `${t.value}天`).join(', ');
      parts.push(`剩余 ${values}`);
    }
    return parts.length > 0 ? parts.join('; ') : '无启用的提醒';
  }

  // 值对象方法
  public equals(other: IGoalReminderConfig): boolean {
    return (
      this._enabled === other.enabled &&
      JSON.stringify(this._triggers) === JSON.stringify(other.triggers)
    );
  }

  // UI 辅助方法
  public hasActiveTriggers(): boolean {
    return this._enabled && this._triggers.some((t) => t.enabled);
  }

  public getProgressTriggers(): ReminderTrigger[] {
    return this._triggers.filter((t) => t.type === 'TIME_PROGRESS_PERCENTAGE');
  }

  public getRemainingDaysTriggers(): ReminderTrigger[] {
    return this._triggers.filter((t) => t.type === 'REMAINING_DAYS');
  }

  public getTriggerDisplayText(trigger: ReminderTrigger): string {
    if (trigger.type === 'TIME_PROGRESS_PERCENTAGE') {
      return `时间进度 ${trigger.value}%`;
    }
    return `剩余 ${trigger.value} 天`;
  }

  // DTO 转换
  public toServerDTO(): GoalReminderConfigServerDTO {
    return {
      enabled: this._enabled,
      triggers: [...this._triggers],
    };
  }

  public toClientDTO(): GoalReminderConfigDTO {
    return {
      enabled: this._enabled,
      triggers: [...this._triggers],
      statusText: this.statusText,
      progressTriggerCount: this.progressTriggerCount,
      remainingDaysTriggerCount: this.remainingDaysTriggerCount,
      activeTriggerCount: this.activeTriggerCount,
      triggerSummary: this.triggerSummary,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: GoalReminderConfigDTO): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: dto.enabled,
      triggers: dto.triggers,
    });
  }

  public static fromServerDTO(dto: GoalReminderConfigServerDTO): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: dto.enabled,
      triggers: dto.triggers,
    });
  }

  public static createDefault(): GoalReminderConfig {
    return new GoalReminderConfig({
      enabled: false,
      triggers: [],
    });
  }
}
