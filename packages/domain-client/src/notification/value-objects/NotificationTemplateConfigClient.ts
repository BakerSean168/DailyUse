/**
 * NotificationTemplateConfig 值对象实现 (Client)
 */

import {
  ChannelConfig,
  EmailTemplateContent,
  NotificationTemplateConfigClient,
  NotificationTemplateConfigClientDTO,
  NotificationTemplateConfigServerDTO,
  PushTemplateContent,
  TemplateContent,
} from '@dailyuse/contracts/notification';

export class NotificationTemplateConfigClient implements NotificationTemplateConfigClient {
  private readonly dto: NotificationTemplateConfigClientDTO;

  private constructor(dto: NotificationTemplateConfigClientDTO) {
    this.dto = dto;
  }

  get template(): TemplateContent { return this.dto.template; }
  get channels(): ChannelConfig { return this.dto.channels; }
  get emailTemplate(): EmailTemplateContent | null | undefined { return this.dto.emailTemplate; }
  get pushTemplate(): PushTemplateContent | null | undefined { return this.dto.pushTemplate; }
  get enabledChannelsCount(): number { return this.dto.enabledChannelsCount; }
  get enabledChannelsList(): string[] { return this.dto.enabledChannelsList; }
  get hasEmailTemplate(): boolean { return this.dto.hasEmailTemplate; }
  get hasPushTemplate(): boolean { return this.dto.hasPushTemplate; }

  public equals(other: NotificationTemplateConfigClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as NotificationTemplateConfigClient).dto);
  }

  public toClientDTO(): NotificationTemplateConfigClientDTO {
    return this.dto;
  }

  public toServerDTO(): NotificationTemplateConfigServerDTO {
    return {
      template: this.dto.template,
      channels: this.dto.channels,
      emailTemplate: this.dto.emailTemplate,
      pushTemplate: this.dto.pushTemplate,
    };
  }

  public static fromClientDTO(dto: NotificationTemplateConfigClientDTO): NotificationTemplateConfigClient {
    return new NotificationTemplateConfigClient(dto);
  }

  public static fromServerDTO(dto: NotificationTemplateConfigServerDTO): NotificationTemplateConfigClient {
    const enabledChannels: string[] = [];
    if (dto.channels.inApp) enabledChannels.push('应用内');
    if (dto.channels.email) enabledChannels.push('邮件');
    if (dto.channels.push) enabledChannels.push('推送');
    if (dto.channels.sms) enabledChannels.push('短信');

    const clientDTO: NotificationTemplateConfigClientDTO = {
      ...dto,
      enabledChannelsCount: enabledChannels.length,
      enabledChannelsList: enabledChannels,
      hasEmailTemplate: !!dto.emailTemplate,
      hasPushTemplate: !!dto.pushTemplate,
    };
    return new NotificationTemplateConfigClient(clientDTO);
  }
}
