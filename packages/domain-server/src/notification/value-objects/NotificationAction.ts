/**
 * NotificationAction 值对象
 * 通知操作 - 不可变值对象
 */

import type {
  NotificationActionClientDTO,
  NotificationActionPersistenceDTO,
  NotificationActionServerDTO,
  NotificationActionType,
} from '@dailyuse/contracts/notification';
import { ValueObject } from '@dailyuse/utils';

/**
 * NotificationAction 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class NotificationAction extends ValueObject implements NotificationAction {
  public readonly id: string;
  public readonly label: string;
  public readonly type: NotificationActionType;
  public readonly payload?: any;

  constructor(params: { id: string; label: string; type: NotificationActionType; payload?: any }) {
    super();

    this.id = params.id;
    this.label = params.label;
    this.type = params.type;
    this.payload = params.payload;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      id: string;
      label: string;
      type: NotificationActionType;
      payload: any;
    }>,
  ): NotificationAction {
    return new NotificationAction({
      id: changes.id ?? this.id,
      label: changes.label ?? this.label,
      type: changes.type ?? this.type,
      payload: changes.payload ?? this.payload,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof NotificationAction)) {
      return false;
    }

    return (
      this.id === other.id &&
      this.label === other.label &&
      this.type === other.type &&
      JSON.stringify(this.payload) === JSON.stringify(other.payload)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): NotificationActionServerDTO {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      payload: this.payload,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): NotificationActionClientDTO {
    const typeTextMap = {
      BUTTON: '按钮',
      LINK: '链接',
      DISMISS: '关闭',
    };
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      payload: this.payload,
      typeText: typeTextMap[this.type as keyof typeof typeTextMap] || this.type,
      icon: String(this.type) === 'LINK' ? 'link' : 'button',
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): NotificationActionPersistenceDTO {
    return {
      id: this.id,
      label: this.label,
      type: this.type,
      payload: this.payload ? JSON.stringify(this.payload) : null,
    };
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): NotificationActionServerDTO {
    return this.toServerDTO();
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: NotificationActionServerDTO): NotificationAction {
    return new NotificationAction(dto);
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(action: NotificationActionServerDTO): NotificationAction {
    return NotificationAction.fromServerDTO(action);
  }
}
