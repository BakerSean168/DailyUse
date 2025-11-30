/**
 * NotificationMetadata 值对象实现 (Client)
 */

import type { INotificationMetadataClient, NotificationMetadataClientDTO, NotificationMetadataServerDTO } from '@dailyuse/contracts/notification';
import { ValueObject } from '@dailyuse/utils';

/**
 * NotificationMetadata 值对象 (Client)
 */
export class NotificationMetadataClient extends ValueObject implements NotificationMetadataClient {
  public readonly icon?: string | null;
  public readonly image?: string | null;
  public readonly color?: string | null;
  public readonly sound?: string | null;
  public readonly badge?: number | null;
  public readonly data?: any;

  private constructor(params: {
    icon?: string | null;
    image?: string | null;
    color?: string | null;
    sound?: string | null;
    badge?: number | null;
    data?: any;
  }) {
    super();
    this.icon = params.icon;
    this.image = params.image;
    this.color = params.color;
    this.sound = params.sound;
    this.badge = params.badge;
    this.data = params.data;

    Object.freeze(this);
  }

  // ===== UI 辅助属性 =====

  public get hasIcon(): boolean {
    return Boolean(this.icon);
  }

  public get hasImage(): boolean {
    return Boolean(this.image);
  }

  public get hasBadge(): boolean {
    return Boolean(this.badge !== null && this.badge !== undefined);
  }

  // ===== 值对象方法 =====

  public equals(other: INotificationMetadataClient): boolean {
    if (!(other instanceof NotificationMetadataClient)) return false;
    return (
      this.icon === other.icon &&
      this.image === other.image &&
      this.color === other.color &&
      this.sound === other.sound &&
      this.badge === other.badge &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): NotificationMetadataServerDTO {
    return {
      icon: this.icon,
      image: this.image,
      color: this.color,
      sound: this.sound,
      badge: this.badge,
      data: this.data,
    };
  }

  // ===== 静态工厂方法 =====

  public static fromClientDTO(dto: NotificationMetadataClientDTO): NotificationMetadataClient {
    return new NotificationMetadataClient({
      icon: dto.icon,
      image: dto.image,
      color: dto.color,
      sound: dto.sound,
      badge: dto.badge,
      data: dto.data,
    });
  }

  public static fromServerDTO(dto: NotificationMetadataServerDTO): NotificationMetadataClient {
    return new NotificationMetadataClient({
      icon: dto.icon,
      image: dto.image,
      color: dto.color,
      sound: dto.sound,
      badge: dto.badge,
      data: dto.data,
    });
  }
}
