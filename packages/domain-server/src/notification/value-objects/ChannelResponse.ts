/**
 * ChannelResponse 值对象
 * 渠道响应 - 不可变值对象
 */

import type { NotificationContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IChannelResponse = NotificationContracts.ChannelResponseServerDTO;
type ChannelResponsePersistenceDTO = NotificationContracts.ChannelResponsePersistenceDTO;
type ChannelResponseClientDTO = NotificationContracts.ChannelResponseClientDTO;

/**
 * ChannelResponse 值对象
 */
export class ChannelResponse extends ValueObject implements IChannelResponse {
  public readonly messageId?: string | null;
  public readonly statusCode?: number | null;
  public readonly data?: any;

  constructor(params: { messageId?: string | null; statusCode?: number | null; data?: any }) {
    super();

    this.messageId = params.messageId ?? null;
    this.statusCode = params.statusCode ?? null;
    this.data = params.data;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      messageId: string | null;
      statusCode: number | null;
      data: any;
    }>,
  ): ChannelResponse {
    return new ChannelResponse({
      messageId: changes.messageId !== undefined ? changes.messageId : this.messageId,
      statusCode: changes.statusCode !== undefined ? changes.statusCode : this.statusCode,
      data: changes.data !== undefined ? changes.data : this.data,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof ChannelResponse)) {
      return false;
    }

    return (
      this.messageId === other.messageId &&
      this.statusCode === other.statusCode &&
      JSON.stringify(this.data) === JSON.stringify(other.data)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): IChannelResponse {
    return {
      messageId: this.messageId,
      statusCode: this.statusCode,
      data: this.data,
    };
  }

  public toClientDTO(): ChannelResponseClientDTO {
    const isSuccess = (this.statusCode ?? 0) >= 200 && (this.statusCode ?? 0) < 300;
    return {
      messageId: this.messageId,
      statusCode: this.statusCode,
      data: this.data,
      isSuccess,
      statusText: isSuccess ? '发送成功' : '发送失败',
    };
  }

  public toPersistenceDTO(): ChannelResponsePersistenceDTO {
    return {
      messageId: this.messageId,
      statusCode: this.statusCode,
      data: this.data ? JSON.stringify(this.data) : null,
    };
  }

  public toContract(): IChannelResponse {
    return this.toServerDTO();
  }

  public static fromServerDTO(dto: IChannelResponse): ChannelResponse {
    return new ChannelResponse(dto);
  }

  public static fromContract(response: IChannelResponse): ChannelResponse {
    return ChannelResponse.fromServerDTO(response);
  }
}
