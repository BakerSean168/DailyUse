/**
 * TaskReminderConfig 值对象实现 (Client)
 */

import type { TaskContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type ITaskReminderConfigClient = TaskContracts.TaskReminderConfigClient;
type TaskReminderConfigClientDTO = TaskContracts.TaskReminderConfigClientDTO;
type TaskReminderConfigServerDTO = TaskContracts.TaskReminderConfigServerDTO;
type ReminderType = TaskContracts.ReminderType;
type ReminderTimeUnit = TaskContracts.ReminderTimeUnit;

interface ReminderTrigger {
  type: ReminderType;
  absoluteTime?: number | null;
  relativeValue?: number | null;
  relativeUnit?: ReminderTimeUnit | null;
}

export class TaskReminderConfigClient extends ValueObject implements ITaskReminderConfigClient {
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
  public get hasTriggers(): boolean {
    return this._triggers.length > 0;
  }

  public get triggerCount(): number {
    return this._triggers.length;
  }

  public get reminderSummary(): string {
    if (!this._enabled || this._triggers.length === 0) {
      return '未设置提醒';
    }

    return `已设置${this._triggers.length}个提醒`;
  }

  public get triggerDescriptions(): string[] {
    return this._triggers.map((trigger) => {
      if (trigger.type === 'ABSOLUTE') {
        const time = new Date(trigger.absoluteTime!);
        return `在 ${time.toLocaleString()} 提醒`;
      } else {
        const unitMap: Record<ReminderTimeUnit, string> = {
          MINUTES: '分钟',
          HOURS: '小时',
          DAYS: '天',
        };
        const unit = unitMap[trigger.relativeUnit!];
        return `提前 ${trigger.relativeValue} ${unit}`;
      }
    });
  }

  // 值对象方法
  public equals(other: ITaskReminderConfigClient): boolean {
    return (
      this._enabled === other.enabled &&
      JSON.stringify(this._triggers) === JSON.stringify(other.triggers)
    );
  }

  // UI 辅助方法
  public hasAbsoluteTrigger(): boolean {
    return this._triggers.some((t) => t.type === 'ABSOLUTE');
  }

  public hasRelativeTrigger(): boolean {
    return this._triggers.some((t) => t.type === 'RELATIVE');
  }

  // DTO 转换
  public toServerDTO(): TaskReminderConfigServerDTO {
    return {
      enabled: this._enabled,
      triggers: [...this._triggers],
    };
  }

  public toClientDTO(): TaskReminderConfigClientDTO {
    return {
      enabled: this._enabled,
      triggers: [...this._triggers],
      hasTriggers: this.hasTriggers,
      triggerCount: this.triggerCount,
      reminderSummary: this.reminderSummary,
      triggerDescriptions: this.triggerDescriptions,
    };
  }

  // 静态工厂方法
  public static fromClientDTO(dto: TaskReminderConfigClientDTO): TaskReminderConfigClient {
    return new TaskReminderConfigClient({
      enabled: dto.enabled,
      triggers: dto.triggers,
    });
  }

  public static fromServerDTO(dto: TaskReminderConfigServerDTO): TaskReminderConfigClient {
    return new TaskReminderConfigClient({
      enabled: dto.enabled,
      triggers: dto.triggers,
    });
  }

  public static createDisabled(): TaskReminderConfigClient {
    return new TaskReminderConfigClient({
      enabled: false,
      triggers: [],
    });
  }
}
