/**
 * TaskReminderConfig 值对象 (Server)
 * 任务提醒配置 - 不可变值对象
 */

import type { ReminderTimeUnit, TaskReminderConfigClientDTO, TaskReminderConfigPersistenceDTO, TaskReminderConfigServer, TaskReminderConfigServerDTO } from '@dailyuse/contracts/task';
import { TaskReminderType } from '@dailyuse/contracts/task';
import { ValueObject } from '@dailyuse/utils';

interface ReminderTrigger {
  type: TaskReminderType;
  absoluteTime?: number | null;
  relativeValue?: number | null;
  relativeUnit?: ReminderTimeUnit | null;
}

/**
 * TaskReminderConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TaskReminderConfig extends ValueObject implements TaskReminderConfigServer {
  public readonly enabled: boolean;
  public readonly triggers: ReminderTrigger[];

  constructor(params: { enabled: boolean; triggers: ReminderTrigger[] }) {
    super();

    this.enabled = params.enabled;
    this.triggers = params.triggers.map((t) => ({ ...t })); // 深拷贝

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.triggers);
    this.triggers.forEach((t) => Object.freeze(t));
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      enabled: boolean;
      triggers: ReminderTrigger[];
    }>,
  ): TaskReminderConfig {
    return new TaskReminderConfig({
      enabled: changes.enabled ?? this.enabled,
      triggers: changes.triggers ?? this.triggers,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: TaskReminderConfig): boolean {
    if (!(other instanceof TaskReminderConfig)) {
      return false;
    }

    return (
      this.enabled === other.enabled &&
      JSON.stringify(this.triggers) === JSON.stringify(other.triggers)
    );
  }

  /**
   * DTO 转换
   */
  public toServerDTO(): TaskReminderConfigServerDTO {
    return {
      enabled: this.enabled,
      triggers: this.triggers.map((t) => ({ ...t })),
    };
  }

  public toClientDTO(): TaskReminderConfigClientDTO {
    return {
      enabled: this.enabled,
      triggers: this.triggers.map((t) => ({ ...t })),
      hasTriggers: this.triggers.length > 0,
      triggerCount: this.triggers.length,
      reminderSummary: this.getReminderSummary(),
      triggerDescriptions: this.getTriggerDescriptions(),
    };
  }

  public toPersistenceDTO(): TaskReminderConfigPersistenceDTO {
    return {
      enabled: this.enabled,
      triggers: JSON.stringify(this.triggers),
    };
  }

  /**
   * 静态工厂方法
   */
  public static fromServerDTO(dto: TaskReminderConfigServerDTO): TaskReminderConfig {
    return new TaskReminderConfig({
      enabled: dto.enabled,
      triggers: dto.triggers,
    });
  }

  public static fromPersistenceDTO(dto: TaskReminderConfigPersistenceDTO): TaskReminderConfig {
    return new TaskReminderConfig({
      enabled: dto.enabled,
      triggers: JSON.parse(dto.triggers),
    });
  }

  /**
   * 辅助方法（用于 ClientDTO）
   */
  private getTriggerDescriptions(): string[] {
    return this.triggers.map((trigger) => {
      if (trigger.type === 'ABSOLUTE' && trigger.absoluteTime) {
        const time = new Date(trigger.absoluteTime);
        return `在 ${time.toLocaleString()} 提醒`;
      } else if (trigger.type === 'RELATIVE' && trigger.relativeValue && trigger.relativeUnit) {
        const unitMap: Record<ReminderTimeUnit, string> = {
          MINUTES: '分钟',
          HOURS: '小时',
          DAYS: '天',
        };
        const unit = unitMap[trigger.relativeUnit];
        return `提前 ${trigger.relativeValue} ${unit}`;
      }
      return '';
    });
  }

  private getReminderSummary(): string {
    if (this.triggers.length === 0) return '无提醒';
    return this.getTriggerDescriptions().join('、');
  }
}
