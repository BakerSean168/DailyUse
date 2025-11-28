/**
 * SessionLayout 值对象
 * 会话布局配置 - 不可变值对象
 */

import type {
  ISessionLayoutServer,
  SessionLayoutClientDTO,
  SessionLayoutPersistenceDTO,
  SessionLayoutServerDTO,
} from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * SessionLayout 值对象
 */
export class SessionLayout extends ValueObject implements SessionLayout {
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
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      splitType: 'horizontal' | 'vertical' | 'grid';
      groupCount: number;
      activeGroupIndex: number;
    }>,
  ): SessionLayout {
    return new SessionLayout({
      splitType: changes.splitType ?? this.splitType,
      groupCount: changes.groupCount ?? this.groupCount,
      activeGroupIndex: changes.activeGroupIndex ?? this.activeGroupIndex,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ISessionLayout): boolean {
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
    return this.toServerDTO();
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): SessionLayoutPersistenceDTO {
    return {
      split_type: this.splitType,
      group_count: this.groupCount,
      active_group_index: this.activeGroupIndex,
    };
  }

  /**
   * 从 Server DTO 创建实例
   */
  public static fromServerDTO(dto: SessionLayoutServerDTO): SessionLayout {
    return new SessionLayout({
      splitType: dto.splitType,
      groupCount: dto.groupCount,
      activeGroupIndex: dto.activeGroupIndex,
    });
  }

  /**
   * 从 Persistence DTO 创建实例
   */
  public static fromPersistenceDTO(dto: SessionLayoutPersistenceDTO): SessionLayout {
    return new SessionLayout({
      splitType: dto.split_type,
      groupCount: dto.group_count,
      activeGroupIndex: dto.active_group_index,
    });
  }

  /**
   * 创建默认实例
   */
  public static createDefault(): SessionLayout {
    return new SessionLayout({
      splitType: 'horizontal',
      groupCount: 1,
      activeGroupIndex: 0,
    });
  }
}
