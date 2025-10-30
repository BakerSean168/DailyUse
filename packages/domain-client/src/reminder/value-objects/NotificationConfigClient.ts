/**
 * NotificationConfig 值对象实现 (Client)
 */

import { ReminderContracts } from '@dailyuse/contracts';

type NotificationConfigClientDTO = ReminderContracts.NotificationConfigClientDTO;
type NotificationConfigServerDTO = ReminderContracts.NotificationConfigServerDTO;
type NotificationChannel = ReminderContracts.NotificationChannel;
type SoundConfig = ReminderContracts.SoundConfig;
type VibrationConfig = ReminderContracts.VibrationConfig;
type NotificationActionConfig = ReminderContracts.NotificationActionConfig;

const NotificationChannel = ReminderContracts.NotificationChannel;

export class NotificationConfigClient implements ReminderContracts.NotificationConfigClient {
  private readonly dto: NotificationConfigClientDTO;

  private constructor(dto: NotificationConfigClientDTO) {
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

  public equals(other: ReminderContracts.NotificationConfigClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as NotificationConfigClient).dto);
  }

  public toClientDTO(): NotificationConfigClientDTO {
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

  public static fromClientDTO(dto: NotificationConfigClientDTO): NotificationConfigClient {
    return new NotificationConfigClient(dto);
  }

  public static fromServerDTO(dto: NotificationConfigServerDTO): NotificationConfigClient {
    const channelNames = dto.channels.map(c => {
      switch (c) {
        case NotificationChannel.IN_APP: return '应用内';
        case NotificationChannel.PUSH: return '推送';
        case NotificationChannel.EMAIL: return '邮件';
        case NotificationChannel.SMS: return '短信';
        default: return '未知';
      }
    });

    const clientDTO: NotificationConfigClientDTO = {
      ...dto,
      channelsText: channelNames.join(' + '),
      hasSoundEnabled: !!dto.sound,
      hasVibrationEnabled: !!dto.vibration,
    };
    return new NotificationConfigClient(clientDTO);
  }
}
