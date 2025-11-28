/**
 * NotificationConfig 值对象实现 (Client)
 */

import {
  NotificationActionConfig,
  NotificationChannel,
  NotificationConfigClient,
  NotificationConfigClientDTO,
  NotificationConfigServerDTO,
  SoundConfig,
  VibrationConfig,
} from '@dailyuse/contracts/reminder';

// 枚举常量使用 Enum 后缀，避免与类型名冲突

export class NotificationConfig implements NotificationConfigClient {
  private readonly _channels: NotificationChannel[];
  private readonly _title: string | null | undefined;
  private readonly _body: string | null | undefined;
  private readonly _sound: SoundConfig | null | undefined;
  private readonly _vibration: VibrationConfig | null | undefined;
  private readonly _actions: NotificationActionConfig[] | null | undefined;
  private readonly _channelsText: string;
  private readonly _hasSoundEnabled: boolean;
  private readonly _hasVibrationEnabled: boolean;

  private constructor(params: {
    channels: NotificationChannel[];
    title?: string | null;
    body?: string | null;
    sound?: SoundConfig | null;
    vibration?: VibrationConfig | null;
    actions?: NotificationActionConfig[] | null;
    channelsText: string;
    hasSoundEnabled: boolean;
    hasVibrationEnabled: boolean;
  }) {
    this._channels = params.channels;
    this._title = params.title;
    this._body = params.body;
    this._sound = params.sound;
    this._vibration = params.vibration;
    this._actions = params.actions;
    this._channelsText = params.channelsText;
    this._hasSoundEnabled = params.hasSoundEnabled;
    this._hasVibrationEnabled = params.hasVibrationEnabled;
  }

  // ===== Getters =====
  get channels(): NotificationChannel[] {
    return [...this._channels];
  }

  get title(): string | null | undefined {
    return this._title;
  }

  get body(): string | null | undefined {
    return this._body;
  }

  get sound(): SoundConfig | null | undefined {
    return this._sound;
  }

  get vibration(): VibrationConfig | null | undefined {
    return this._vibration;
  }

  get actions(): NotificationActionConfig[] | null | undefined {
    return this._actions;
  }

  get channelsText(): string {
    return this._channelsText;
  }

  get hasSoundEnabled(): boolean {
    return this._hasSoundEnabled;
  }

  get hasVibrationEnabled(): boolean {
    return this._hasVibrationEnabled;
  }

  // ===== 业务方法 =====
  public equals(other: NotificationConfigClient): boolean {
    return (
      JSON.stringify(this._channels) === JSON.stringify(other.channels) &&
      this._title === other.title &&
      this._body === other.body &&
      JSON.stringify(this._sound) === JSON.stringify(other.sound) &&
      JSON.stringify(this._vibration) === JSON.stringify(other.vibration)
    );
  }

  // ===== DTO 转换方法 =====
  public toClientDTO(): NotificationConfigClientDTO {
    return {
      channels: [...this._channels],
      title: this._title,
      body: this._body,
      sound: this._sound,
      vibration: this._vibration,
      actions: this._actions,
      channelsText: this._channelsText,
      hasSoundEnabled: this._hasSoundEnabled,
      hasVibrationEnabled: this._hasVibrationEnabled,
    };
  }

  public toServerDTO(): NotificationConfigServerDTO {
    return {
      channels: [...this._channels],
      title: this._title,
      body: this._body,
      sound: this._sound,
      vibration: this._vibration,
      actions: this._actions,
    };
  }

  // ===== 静态工厂方法 =====
  public static fromClientDTO(dto: NotificationConfigClientDTO): NotificationConfig {
    return new NotificationConfig({
      channels: dto.channels,
      title: dto.title,
      body: dto.body,
      sound: dto.sound,
      vibration: dto.vibration,
      actions: dto.actions,
      channelsText: dto.channelsText,
      hasSoundEnabled: dto.hasSoundEnabled,
      hasVibrationEnabled: dto.hasVibrationEnabled,
    });
  }

  public static fromServerDTO(dto: NotificationConfigServerDTO): NotificationConfig {
    // 生成 channelsText
    const channelNames = dto.channels.map((c) => {
      switch (c) {
        case NotificationChannel.IN_APP:
          return '应用内';
        case NotificationChannel.PUSH:
          return '推送';
        case NotificationChannel.EMAIL:
          return '邮件';
        case NotificationChannel.SMS:
          return '短信';
        default:
          return '未知';
      }
    });

    return new NotificationConfig({
      channels: dto.channels,
      title: dto.title,
      body: dto.body,
      sound: dto.sound,
      vibration: dto.vibration,
      actions: dto.actions,
      channelsText: channelNames.join(' + ') || '无',
      hasSoundEnabled: !!dto.sound?.enabled,
      hasVibrationEnabled: !!dto.vibration?.enabled,
    });
  }
}
