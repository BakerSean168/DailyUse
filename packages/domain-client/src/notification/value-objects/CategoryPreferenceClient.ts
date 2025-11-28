/**
 * CategoryPreference 值对象实现 (Client)
 */

import {
  CategoryPreferenceClient,
  CategoryPreferenceClientDTO,
  CategoryPreferenceServerDTO,
  ChannelPreference,
  ImportanceLevel,
} from '@dailyuse/contracts/notification';

const ImportanceLevel = ImportanceLevel;

export class CategoryPreferenceClient implements CategoryPreferenceClient {
  private readonly dto: CategoryPreferenceClientDTO;

  private constructor(dto: CategoryPreferenceClientDTO) {
    this.dto = dto;
  }

  get enabled(): boolean { return this.dto.enabled; }
  get channels(): ChannelPreference { return this.dto.channels; }
  get importance(): ImportanceLevel[] { return this.dto.importance; }
  get enabledChannelsCount(): number { return this.dto.enabledChannelsCount; }
  get enabledChannelsList(): string[] { return this.dto.enabledChannelsList; }
  get importanceText(): string { return this.dto.importanceText; }

  public equals(other: CategoryPreferenceClient): boolean {
    return JSON.stringify(this.dto) === JSON.stringify((other as CategoryPreferenceClient).dto);
  }

  public toClientDTO(): CategoryPreferenceClientDTO {
    return this.dto;
  }

  public toServerDTO(): CategoryPreferenceServerDTO {
    return {
      enabled: this.dto.enabled,
      channels: this.dto.channels,
      importance: this.dto.importance,
    };
  }

  public static fromClientDTO(dto: CategoryPreferenceClientDTO): CategoryPreferenceClient {
    return new CategoryPreferenceClient(dto);
  }

  public static fromServerDTO(dto: CategoryPreferenceServerDTO): CategoryPreferenceClient {
    const enabledChannels: string[] = [];
    if (dto.channels.inApp) enabledChannels.push('应用内');
    if (dto.channels.push) enabledChannels.push('推送');
    if (dto.channels.email) enabledChannels.push('邮件');
    if (dto.channels.sms) enabledChannels.push('短信');

    const importanceMap: Record<ImportanceLevel, string> = {
      [ImportanceLevel.Vital]: '关键',
      [ImportanceLevel.Important]: '重要',
      [ImportanceLevel.Moderate]: '中等',
      [ImportanceLevel.Minor]: '次要',
      [ImportanceLevel.Trivial]: '琐碎',
    };

    const clientDTO: CategoryPreferenceClientDTO = {
      ...dto,
      enabledChannelsCount: enabledChannels.length,
      enabledChannelsList: enabledChannels,
      importanceText: dto.importance.map(i => importanceMap[i]).join(', '),
    };
    return new CategoryPreferenceClient(clientDTO);
  }
}
