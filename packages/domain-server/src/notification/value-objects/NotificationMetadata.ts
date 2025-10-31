/**
 * NotificationMetadata 值对象
 * 通知元数据 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type INotificationMetadata = NotificationContracts.NotificationMetadataServerDTO;
type NotificationMetadataPersistenceDTO = NotificationContracts.NotificationMetadataPersistenceDTO;
type NotificationMetadataClientDTO = NotificationContracts.NotificationMetadataClientDTO;

/**
 * NotificationMetadata 值对象
 */
export class NotificationMetadata extends ValueObject implements INotificationMetadata {
  public readonly icon?: string | null;
  public readonly image?: string | null;
  public readonly color?: string | null;
  public readonly sound?: string | null;
  public readonly badge?: number | null;
  public readonly data?: any;

  constructor(params: {
    icon?: string | null;
    image?: string | null;
    color?: string | null;
    sound?: string | null;
    badge?: number | null;
    data?: any;
  }) {
    super();

    this.icon = params.icon ?? null;
    this.image = params.image ?? null;
    this.color = params.color ?? null;
    this.sound = params.sound ?? null;
    this.badge = params.badge ?? null;
    this.data = params.data;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      icon: string | null;
      image: string | null;
      color: string | null;
      sound: string | null;
      badge: number | null;
      data: any;
    }>,
  ): NotificationMetadata {
    return new NotificationMetadata({
      icon: changes.icon !== undefined ? changes.icon : this.icon,
      image: changes.image !== undefined ? changes.image : this.image,
      color: changes.color !== undefined ? changes.color : this.color,
      sound: changes.sound !== undefined ? changes.sound : this.sound,
      badge: changes.badge !== undefined ? changes.badge : this.badge,
      data: changes.data !== undefined ? changes.data : this.data,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof NotificationMetadata)) {
      return false;
    }

    return (
      this.icon === other.icon &&
      this.image === other.image &&
      this.color === other.color &&
      this.sound === other.sound &&
      this.badge === other.badge &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): INotificationMetadata {
    return {
      icon: this.icon,
      image: this.image,
      color: this.color,
      sound: this.sound,
      badge: this.badge,
      data: this.data,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): NotificationMetadataClientDTO {
    return {
      icon: this.icon,
      image: this.image,
      color: this.color,
      sound: this.sound,
      badge: this.badge,
      data: this.data,
      hasIcon: !!this.icon,
      hasImage: !!this.image,
      hasBadge: this.badge !== null && this.badge !== undefined,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): NotificationMetadataPersistenceDTO {
    return {
      icon: this.icon,
      image: this.image,
      color: this.color,
      sound: this.sound,
      badge: this.badge,
      data: this.data ? JSON.stringify(this.data) : null,
    };
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): INotificationMetadata {
    return this.toServerDTO();
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: INotificationMetadata): NotificationMetadata {
    return new NotificationMetadata(dto);
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(metadata: INotificationMetadata): NotificationMetadata {
    return NotificationMetadata.fromServerDTO(metadata);
  }

  /**
   * 创建空元数据
   */
  public static createEmpty(): NotificationMetadata {
    return new NotificationMetadata({});
  }
}
