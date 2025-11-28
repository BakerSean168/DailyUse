/**
 * TabViewState 值对象
 * 标签视图状态 - 不可变值对象
 */

import type {
  ITabViewStateServer,
  TabViewStateClientDTO,
  TabViewStatePersistenceDTO,
  TabViewStateServerDTO,
} from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * TabViewState 值对象
 */
export class TabViewState extends ValueObject implements TabViewState {
  public readonly scrollTop: number;
  public readonly scrollLeft: number;
  public readonly cursorPosition: { line: number; column: number };
  public readonly selections: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;

  constructor(params: {
    scrollTop: number;
    scrollLeft: number;
    cursorPosition: { line: number; column: number };
    selections?: Array<{
      start: { line: number; column: number };
      end: { line: number; column: number };
    }> | null;
  }) {
    super();

    this.scrollTop = params.scrollTop;
    this.scrollLeft = params.scrollLeft;
    this.cursorPosition = { ...params.cursorPosition };
    this.selections = params.selections
      ? params.selections.map((s) => ({
          start: { ...s.start },
          end: { ...s.end },
        }))
      : null;

    // 确保不可变
    Object.freeze(this);
    Object.freeze(this.cursorPosition);
    if (this.selections) {
      Object.freeze(this.selections);
      this.selections.forEach((s) => {
        Object.freeze(s);
        Object.freeze(s.start);
        Object.freeze(s.end);
      });
    }
  }

  /**
   * 创建修改后的新实例
   */
  public with(
    changes: Partial<{
      scrollTop: number;
      scrollLeft: number;
      cursorPosition: { line: number; column: number };
      selections: Array<{
        start: { line: number; column: number };
        end: { line: number; column: number };
      }> | null;
    }>,
  ): TabViewState {
    return new TabViewState({
      scrollTop: changes.scrollTop ?? this.scrollTop,
      scrollLeft: changes.scrollLeft ?? this.scrollLeft,
      cursorPosition: changes.cursorPosition ?? this.cursorPosition,
      selections: changes.selections !== undefined ? changes.selections : this.selections,
    });
  }

  /**
   * 值相等性比较
   */
  public equals(other: ITabViewState): boolean {
    if (!(other instanceof TabViewState)) {
      return false;
    }

    return (
      this.scrollTop === other.scrollTop &&
      this.scrollLeft === other.scrollLeft &&
      JSON.stringify(this.cursorPosition) === JSON.stringify(other.cursorPosition) &&
      JSON.stringify(this.selections) === JSON.stringify(other.selections)
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): TabViewStateServerDTO {
    return {
      scrollTop: this.scrollTop,
      scrollLeft: this.scrollLeft,
      cursorPosition: { ...this.cursorPosition },
      selections: this.selections?.map((s) => ({ ...s })) ?? null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): TabViewStateClientDTO {
    return this.toServerDTO();
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): TabViewStatePersistenceDTO {
    return {
      scroll_top: this.scrollTop,
      scroll_left: this.scrollLeft,
      cursor_position: JSON.stringify(this.cursorPosition),
      selections: this.selections ? JSON.stringify(this.selections) : null,
    };
  }

  /**
   * 从 Server DTO 创建实例
   */
  public static fromServerDTO(dto: TabViewStateServerDTO): TabViewState {
    return new TabViewState({
      scrollTop: dto.scrollTop,
      scrollLeft: dto.scrollLeft,
      cursorPosition: dto.cursorPosition,
      selections: dto.selections,
    });
  }

  /**
   * 从 Persistence DTO 创建实例
   */
  public static fromPersistenceDTO(dto: TabViewStatePersistenceDTO): TabViewState {
    return new TabViewState({
      scrollTop: dto.scroll_top,
      scrollLeft: dto.scroll_left,
      cursorPosition: JSON.parse(dto.cursor_position),
      selections: dto.selections ? JSON.parse(dto.selections) : null,
    });
  }

  /**
   * 创建默认实例
   */
  public static createDefault(): TabViewState {
    return new TabViewState({
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 0, column: 0 },
      selections: null,
    });
  }
}
