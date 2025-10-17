/**
 * NotificationTemplate Value Object (Server)
 * �!<�a - 
��
 */

import type { NotificationTemplateConfigClientDTO } from './NotificationTemplateClient';
// ============ q�{��I ============

/**
 * !��
 */
export interface TemplateContent {
  title: string; // /��: {{variable}}
  content: string; // /�ό Markdown
  variables: string[]; // ['taskName', 'dueDate', etc.]
}

/**
 * ��!��
 */
export interface EmailTemplateContent {
  subject: string;
  htmlBody: string;
  textBody?: string | null;
}

/**
 * �!��
 */
export interface PushTemplateContent {
  title: string;
  body: string;
  icon?: string | null;
  sound?: string | null;
}

/**
 *  SMn
 */
export interface ChannelConfig {
  inApp: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

// ============ ��I ============

/**
 * �!Mn - Server ��
 */
export interface INotificationTemplateConfigServer {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;

  // <�a��
  equals(other: INotificationTemplateConfigServer): boolean;
  with(
    updates: Partial<
      Omit<
        INotificationTemplateConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationTemplateConfigServer;

  // DTO lb��
  toServerDTO(): NotificationTemplateConfigServerDTO;
  toClientDTO(): NotificationTemplateConfigClientDTO;
  toPersistenceDTO(): NotificationTemplateConfigPersistenceDTO;
}

// ============ DTO �I ============

/**
 * NotificationTemplateConfig Server DTO
 */
export interface NotificationTemplateConfigServerDTO {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate?: EmailTemplateContent | null;
  pushTemplate?: PushTemplateContent | null;
}

/**
 * NotificationTemplateConfig Persistence DTO
 */
export interface NotificationTemplateConfigPersistenceDTO {
  template: string; // JSON.stringify(TemplateContent)
  channels: string; // JSON.stringify(ChannelConfig)
  emailTemplate?: string | null; // JSON.stringify(EmailTemplateContent)
  pushTemplate?: string | null; // JSON.stringify(PushTemplateContent)
}

// ============ {��� ============

export type NotificationTemplateConfigServer = INotificationTemplateConfigServer;
