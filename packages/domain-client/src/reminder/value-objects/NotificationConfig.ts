/**
 * NotificationConfig 值对象实现 ()
 */

import { ReminderContracts } from '@dailyuse/contracts';

type NotificationConfigDTO = ReminderContracts.NotificationConfigDTO;
type NotificationConfigServerDTO = ReminderContracts.NotificationConfigServerDTO;
type NotificationChannel = ReminderContracts.NotificationChannel;
type SoundConfig = ReminderContracts.SoundConfig;
type VibrationConfig = ReminderContracts.VibrationConfig;
type NotificationActionConfig = ReminderContracts.NotificationActionConfig;

const NotificationChannel = ReminderContracts.NotificationChannel;

export class NotificationConfig implements ReminderContracts.NotificationConfig {
  private readonly dto: NotificationConfigDTO;

  private constructor(dto: NotificationConfigDTO) {
    this.dto = dto;
  }

  get channels(): NotificationChannel[] { return this.dto.channels; }
  get title(): string | null | undefined { return this.dto.title; }
  get body(): string | null | undefined { return this.dto.body; }
  get sound(): SoundConfig | null | undefined { return this.dto.sound; }
  get vibration(): VibrationConfig | null | undefined { return this.dto.vibration; }
  get actions(): NotificationActionConfig[] | null | undefined { return this.dto.actions; }
  get channelsText(): string { return this.dto.channelsText; }
  get hasSoundEnabled(): boolean { return this.dto.hasSoundEnabled; }
  get hasVibrationEnabled(): boolean { return this.dto.hasVibrationEnabled; }

  public equals(other: ReminderContracts.NotificationConfig): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as NotificationConfig).dto);
  }

  public toDTO(): NotificationConfigDTO {
    return this.dto;
  }

  public toServerDTO(): NotificationConfigServerDTO {
    return {
      channels: this.dto.channels,
      title: this.dto.title,
      body: this.dto.body,
      sound: this.dto.sound,
      vibration: this.dto.vibration,
      actions: this.dto.actions,
    };
  }

  public static fromDTO(dto: NotificationConfigDTO): NotificationConfig {
    return new NotificationConfig(dto);
  }

  public static fromServerDTO(dto: NotificationConfigServerDTO): NotificationConfig {
    const channelNames = dto.channels.map(c => {
      switch (c) {
        case NotificationChannel.IN_APP: return '应用内';
        case NotificationChannel.PUSH: return '推送';
        case NotificationChannel.EMAIL: return '邮件';
        case NotificationChannel.SMS: return '短信';
        default: return '未知';
      }
    });

    const clientDTO: NotificationConfigDTO = {
      ...dto,
      channelsText: channelNames.join(' + '),
      hasSoundEnabled: !!dto.sound,
      hasVibrationEnabled: !!dto.vibration,
    };
    return new NotificationConfig(clientDTO);
  }
}
