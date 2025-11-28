import { ImportanceLevel } from '@dailyuse/contracts/shared';

export interface NotificationWindow {
  uuid: string;
  title: string;
  body: string;
  importance: ImportanceLevel;
  actions?: Array<{ text: string; type: 'confirm' | 'cancel' | 'action' }>;
}
