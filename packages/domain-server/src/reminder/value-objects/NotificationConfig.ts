/**
 * NotificationConfig 值对象
 * 通知配置 - 不可变值对象
 */

import type { NotificationConfigServerDTO, NotificationConfigClientDTO, NotificationConfigPersistenceDTO, SoundConfig, VibrationConfig, NotificationActionConfig } from '@dailyuse/contracts/reminder';
import { NotificationChannel } from '@dailyuse/contracts/reminder';
import { ValueObject } from '@dailyuse/utils';

/**
 * NotificationConfig 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 */
export class NotificationConfig extends ValueObject implements NotificationConfigServerDTO {
  public readonly channels: NotificationChannel[];
  public readonly title: string | null;
  public readonly body: string | null;
  public readonly sound: SoundConfig | null;
  public readonly vibration: VibrationConfig | null;
  public readonly actions: NotificationActionConfig[] | null;

  constructor(params: {
    channels: NotificationChannel[];
    title?: string | null;
    body?: string | null;
    sound?: SoundConfig | null;
    vibration?: VibrationConfig | null;
    actions?: NotificationActionConfig[] | null;
  }) {
    super();

    this.channels = [...params.channels];
    this.title = params.title ?? null;
    this.body = params.body ?? null;
    this.sound = params.sound ? { ...params.sound } : null;
    this.vibration = params.vibration
      ? {
          ...params.vibration,
          pattern: params.vibration.pattern ? [...params.vibration.pattern] : null,
        }
      : null;
    this.actions = params.actions ? params.actions.map((a) => ({ ...a })) : null;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.channels);
    if (this.sound) Object.freeze(this.sound);
    if (this.vibration) {
      Object.freeze(this.vibration);
      if (this.vibration.pattern) Object.freeze(this.vibration.pattern);
    }
    if (this.actions) {
      this.actions.forEach((a) => Object.freeze(a));
      Object.freeze(this.actions);
    }
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      channels: NotificationChannel[];
      title: string | null;
      body: string | null;
      sound: SoundConfig | null;
      vibration: VibrationConfig | null;
      actions: NotificationActionConfig[] | null;
    }>,
  ): NotificationConfig {
    return new NotificationConfig({
      channels: changes.channels ?? this.channels,
      title: changes.title !== undefined ? changes.title : this.title,
      body: changes.body !== undefined ? changes.body : this.body,
      sound: changes.sound !== undefined ? changes.sound : this.sound,
      vibration: changes.vibration !== undefined ? changes.vibration : this.vibration,
      actions: changes.actions !== undefined ? changes.actions : this.actions,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof NotificationConfig)) {
      return false;
    }

    return (
      this.channels.length === other.channels.length &&
      this.channels.every((c: NotificationChannel, i: number) => c === other.channels[i]) &&
      this.title === other.title &&
      this.body === other.body &&
      JSON.stringify(this.sound) === JSON.stringify(other.sound) &&
      JSON.stringify(this.vibration) === JSON.stringify(other.vibration) &&
      JSON.stringify(this.actions) === JSON.stringify(other.actions)
    );
  }

  /**
   * 转换为 DTO
   */
  public toServerDTO(): NotificationConfigServerDTO {
    return {
      channels: this.channels,
      title: this.title,
      body: this.body,
      sound: this.sound,
      vibration: this.vibration,
      actions: this.actions,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): NotificationConfigClientDTO {
    const channelMap: Record<NotificationChannel, string> = {
      IN_APP: '应用内',
      PUSH: '推送',
      EMAIL: '邮件',
      SMS: '短信',
    };
    const channelsText = this.channels.map((c) => channelMap[c]).join(' + ');

    return {
      channels: this.channels,
      title: this.title,
      body: this.body,
      sound: this.sound,
      vibration: this.vibration,
      actions: this.actions,
      channelsText,
      hasSoundEnabled: this.sound?.enabled ?? false,
      hasVibrationEnabled: this.vibration?.enabled ?? false,
    };
  }

  /**
   * 转换为 Persistence DTO（数据库存储格式）
   */
  public toPersistenceDTO(): NotificationConfigPersistenceDTO {
    return {
      channels: JSON.stringify(this.channels),
      title: this.title,
      body: this.body,
      sound: this.sound ? JSON.stringify(this.sound) : null,
      vibration: this.vibration ? JSON.stringify(this.vibration) : null,
      actions: this.actions ? JSON.stringify(this.actions) : null,
    };
  }

  /**
   * 从 DTO 创建值对象
   */
  public static fromServerDTO(dto: NotificationConfigServerDTO): NotificationConfig {
    return new NotificationConfig(dto);
  }
}
