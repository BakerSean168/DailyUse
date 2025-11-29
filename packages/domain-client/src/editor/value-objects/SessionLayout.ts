/**
 * SessionLayout 值对象
 * 会话布局 - 客户端值对象
 */

import type { ISessionLayoutClient, SessionLayoutClient, SessionLayoutClientDTO, SessionLayoutServerDTO } from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * SessionLayout 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class SessionLayout extends ValueObject implements ISessionLayoutClient {
  public readonly splitType: 'horizontal' | 'vertical' | 'grid';
  public readonly groupCount: number;
  public readonly activeGroupIndex: number;

  constructor(params: {
    splitType: 'horizontal' | 'vertical' | 'grid';
    groupCount: number;
    activeGroupIndex: number;
  }) {
    super();

    this.splitType = params.splitType;
    this.groupCount = params.groupCount;
    this.activeGroupIndex = params.activeGroupIndex;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 值相等性比较
   */
  public override equals(other: ValueObject): boolean {
    if (!(other instanceof SessionLayout)) {
      return false;
    }

    return (
      this.splitType === other.splitType &&
      this.groupCount === other.groupCount &&
      this.activeGroupIndex === other.activeGroupIndex
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): SessionLayoutServerDTO {
    return {
      splitType: this.splitType,
      groupCount: this.groupCount,
      activeGroupIndex: this.activeGroupIndex,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): SessionLayoutClientDTO {
    return {
      splitType: this.splitType,
      groupCount: this.groupCount,
      activeGroupIndex: this.activeGroupIndex,
    };
  }

  /**
   * 从 Server DTO 创建
   */
  public static fromServerDTO(dto: SessionLayoutServerDTO): SessionLayout {
    return new SessionLayout({
      splitType: dto.splitType,
      groupCount: dto.groupCount,
      activeGroupIndex: dto.activeGroupIndex,
    });
  }

  /**
   * 从 Client DTO 创建
   */
  public static fromClientDTO(dto: SessionLayoutClientDTO): SessionLayout {
    return new SessionLayout({
      splitType: dto.splitType,
      groupCount: dto.groupCount,
      activeGroupIndex: dto.activeGroupIndex,
    });
  }

  /**
   * 创建默认布局
   */
  public static createDefault(): SessionLayout {
    return new SessionLayout({
      splitType: 'horizontal',
      groupCount: 1,
      activeGroupIndex: 0,
    });
  }
}
