/**
 * NotificationTemplateConfig 值对象
 * 通知模板配置 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type INotificationTemplateConfig = NotificationContracts.NotificationTemplateConfigServerDTO;
type NotificationTemplateConfigPersistenceDTO = NotificationContracts.NotificationTemplateConfigPersistenceDTO;
type NotificationTemplateConfigClientDTO = NotificationContracts.NotificationTemplateConfigClientDTO;
type TemplateContent = NotificationContracts.TemplateContent;
type ChannelConfig = NotificationContracts.ChannelConfig;
type EmailTemplateContent = NotificationContracts.EmailTemplateContent;
type PushTemplateContent = NotificationContracts.PushTemplateContent;

/**
 * NotificationTemplateConfig 值对象
 */
export class NotificationTemplateConfig extends ValueObject implements INotificationTemplateConfig {
  public readonly template: TemplateContent;
  public readonly channels: ChannelConfig;
  public readonly emailTemplate?: EmailTemplateContent | null;
  public readonly pushTemplate?: PushTemplateContent | null;

  constructor(params: {
    template: TemplateContent;
    channels: ChannelConfig;
    emailTemplate?: EmailTemplateContent | null;
    pushTemplate?: PushTemplateContent | null;
  }) {
    super();

    this.template = { ...params.template, variables: [...params.template.variables] };
    this.channels = { ...params.channels };
    this.emailTemplate = params.emailTemplate ? { ...params.emailTemplate } : null;
    this.pushTemplate = params.pushTemplate ? { ...params.pushTemplate } : null;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.template);
    Object.freeze(this.template.variables);
    Object.freeze(this.channels);
    if (this.emailTemplate) Object.freeze(this.emailTemplate);
    if (this.pushTemplate) Object.freeze(this.pushTemplate);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      template: TemplateContent;
      channels: ChannelConfig;
      emailTemplate: EmailTemplateContent | null;
      pushTemplate: PushTemplateContent | null;
    }>,
  ): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      template: changes.template ?? this.template,
      channels: changes.channels ?? this.channels,
      emailTemplate:
        changes.emailTemplate !== undefined ? changes.emailTemplate : this.emailTemplate,
      pushTemplate: changes.pushTemplate !== undefined ? changes.pushTemplate : this.pushTemplate,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof NotificationTemplateConfig)) {
      return false;
    }

    return (
      this.template.title === other.template.title &&
      this.template.content === other.template.content &&
      JSON.stringify(this.template.variables) === JSON.stringify(other.template.variables) &&
      this.channels.inApp === other.channels.inApp &&
      this.channels.email === other.channels.email &&
      this.channels.push === other.channels.push &&
      this.channels.sms === other.channels.sms &&
      JSON.stringify(this.emailTemplate) === JSON.stringify(other.emailTemplate) &&
      JSON.stringify(this.pushTemplate) === JSON.stringify(other.pushTemplate)
    );
  }

  /**
   * 转换为 Contract 接口
   */
  public toServerDTO(): INotificationTemplateConfig {
    return {
      template: {
        ...this.template,
        variables: [...this.template.variables],
      },
      channels: { ...this.channels },
      emailTemplate: this.emailTemplate ? { ...this.emailTemplate } : null,
      pushTemplate: this.pushTemplate ? { ...this.pushTemplate } : null,
    };
  }

  public toClientDTO(): NotificationTemplateConfigClientDTO {
    const enabledChannels = Object.entries(this.channels).filter(([_, enabled]) => enabled);
    return {
      template: {
        ...this.template,
        variables: [...this.template.variables],
      },
      channels: { ...this.channels },
      emailTemplate: this.emailTemplate ? { ...this.emailTemplate } : null,
      pushTemplate: this.pushTemplate ? { ...this.pushTemplate } : null,
      enabledChannelsCount: enabledChannels.length,
      enabledChannelsList: enabledChannels.map(([name]) => name),
      hasEmailTemplate: !!this.emailTemplate,
      hasPushTemplate: !!this.pushTemplate,
    };
  }

  public toPersistenceDTO(): NotificationTemplateConfigPersistenceDTO {
    return {
      template: JSON.stringify(this.template),
      channels: JSON.stringify(this.channels),
      emailTemplate: this.emailTemplate ? JSON.stringify(this.emailTemplate) : null,
      pushTemplate: this.pushTemplate ? JSON.stringify(this.pushTemplate) : null,
    };
  }

  public toContract(): INotificationTemplateConfig {
    return this.toServerDTO();
  }

  public static fromServerDTO(dto: INotificationTemplateConfig): NotificationTemplateConfig {
    return new NotificationTemplateConfig(dto);
  }

  public static fromContract(config: INotificationTemplateConfig): NotificationTemplateConfig {
    return NotificationTemplateConfig.fromServerDTO(config);
  }

  /**
   * 渲染模板（替换变量）
   */
  public render(variables: Record<string, any>): { title: string; content: string } {
    let title = this.template.title;
    let content = this.template.content;

    // 替换变量 {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      title = title.replace(pattern, String(value ?? ''));
      content = content.replace(pattern, String(value ?? ''));
    }

    return { title, content };
  }

  /**
   * 验证变量是否齐全
   */
  public validateVariables(variables: Record<string, any>): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const missing: string[] = [];

    for (const varName of this.template.variables) {
      if (!(varName in variables) || variables[varName] === undefined) {
        missing.push(varName);
      }
    }

    return {
      isValid: missing.length === 0,
      missingVariables: missing,
    };
  }

  /**
   * 创建默认配置
   */
  public static createDefault(): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      template: {
        title: '',
        content: '',
        variables: [],
      },
      channels: {
        inApp: true,
        email: false,
        push: false,
        sms: false,
      },
    });
  }
}
