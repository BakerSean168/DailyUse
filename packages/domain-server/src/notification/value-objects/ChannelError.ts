/**
 * ChannelError 值对象
 * 渠道错误 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IChannelError = NotificationContracts.ChannelErrorServerDTO;
type ChannelErrorPersistenceDTO = NotificationContracts.ChannelErrorPersistenceDTO;
type ChannelErrorClientDTO = NotificationContracts.ChannelErrorClientDTO;

/**
 * ChannelError 值对象
 */
export class ChannelError extends ValueObject implements IChannelError {
  public readonly code: string;
  public readonly message: string;
  public readonly details?: any;

  constructor(params: { code: string; message: string; details?: any }) {
    super();

    this.code = params.code;
    this.message = params.message;
    this.details = params.details;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      code: string;
      message: string;
      details: any;
    }>,
  ): ChannelError {
    return new ChannelError({
      code: changes.code ?? this.code,
      message: changes.message ?? this.message,
      details: changes.details ?? this.details,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ChannelError)) {
      return false;
    }

    return (
      this.code === other.code &&
      this.message === other.message &&
      JSON.stringify(this.details) === JSON.stringify(other.details)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): IChannelError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  public toClientDTO(): ChannelErrorClientDTO {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      displayMessage: `[${this.code}] ${this.message}`,
      isRetryable: !['AUTH_FAILED', 'INVALID_CONFIG'].includes(this.code),
    };
  }

  public toPersistenceDTO(): ChannelErrorPersistenceDTO {
    return {
      code: this.code,
      message: this.message,
      details: this.details ? JSON.stringify(this.details) : null,
    };
  }

  public toContract(): IChannelError {
    return this.toServerDTO();
  }

  public static fromServerDTO(dto: IChannelError): ChannelError {
    return new ChannelError(dto);
  }

  public static fromContract(error: IChannelError): ChannelError {
    return ChannelError.fromServerDTO(error);
  }
}
