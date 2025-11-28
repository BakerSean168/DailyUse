/**
 * NotificationAction 值对象实现 (Client)
 */

import type {
  INotificationActionClient,
  NotificationActionClientDTO,
  NotificationActionServerDTO,
  NotificationActionType,
} from '@dailyuse/contracts/notification';
import { NotificationActionType } from '@dailyuse/contracts/notification';
import { ValueObject } from '@dailyuse/utils';

const NotificationActionType = NotificationActionType;

/**
 * NotificationAction 值对象 (Client)
 */
export class NotificationActionClient extends ValueObject implements NotificationActionClient {
  public readonly id: string;
  public readonly label: string;
  public readonly type: NotificationActionType;
  public readonly payload?: any;

  private constructor(params: {
    id: string;
    label: string;
    type: NotificationActionType;
    payload?: any;
  }) {
    super();
    this.id = params.id;
    this.label = params.label;
    this.type = params.type;
    this.payload = params.payload;

    Object.freeze(this);
  }

  // ===== UI 辅助属性 =====

  public get typeText(): string {
    const typeMap: Record<NotificationActionType, string> = {
      [NotificationActionType.NAVIGATE]: '导航',
      [NotificationActionType.API_CALL]: 'API调用',
      [NotificationActionType.DISMISS]: '关闭',
      [NotificationActionType.CUSTOM]: '自定义',
    };
    return typeMap[this.type] || '未知';
  }

  public get icon(): string {
    const iconMap: Record<NotificationActionType, string> = {
      [NotificationActionType.NAVIGATE]: 'i-carbon-arrow-right',
      [NotificationActionType.API_CALL]: 'i-carbon-api',
      [NotificationActionType.DISMISS]: 'i-carbon-close',
      [NotificationActionType.CUSTOM]: 'i-carbon-settings',
    };
    return iconMap[this.type] || 'i-carbon-unknown';
  }

  // ===== 值对象方法 =====

  public equals(other: INotificationActionClient): boolean {
    if (!(other instanceof NotificationActionClient)) return false;
    return (
      this.id === other.id &&
      this.label === other.label &&
      this.type === other.type &&
      JSON.stringify(this.payload) === JSON.stringify(other.payload)
    );
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): NotificationActionServerDTO {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      payload: this.payload,
    };
  }

  // ===== 静态工厂方法 =====

  public static fromClientDTO(dto: NotificationActionClientDTO): NotificationActionClient {
    return new NotificationActionClient({
      id: dto.id,
      label: dto.label,
      type: dto.type,
      payload: dto.payload,
    });
  }

  public static fromServerDTO(dto: NotificationActionServerDTO): NotificationActionClient {
    return new NotificationActionClient({
      id: dto.id,
      label: dto.label,
      type: dto.type,
      payload: dto.payload,
    });
  }
}
