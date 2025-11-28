/**
 * TabViewState 值对象
 * 标签页视图状态 - 客户端值对象
 */

import type { ITabViewStateClient, TabViewStateClientDTO, TabViewStateServerDTO } from '@dailyuse/contracts/editor';
import { ValueObject } from '@dailyuse/utils';

/**
 * TabViewState 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class TabViewState extends ValueObject implements TabViewStateClient {
  public readonly scrollTop: number;
  public readonly scrollLeft: number;
  public readonly cursorPosition: {
    line: number;
    column: number;
  };
  public readonly selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;

  constructor(params: {
    scrollTop: number;
    scrollLeft: number;
    cursorPosition: {
      line: number;
      column: number;
    };
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
   * 值相等性比较
   */
  public override equals(other: ValueObject): boolean {
    if (!(other instanceof TabViewState)) {
      return false;
    }

    let selectionsEqual = false;
    if (!this.selections && !other.selections) {
      selectionsEqual = true;
    } else if (this.selections && other.selections) {
      selectionsEqual =
        this.selections.length === other.selections.length &&
        this.selections.every(
          (s, i) =>
            s.start.line === other.selections![i].start.line &&
            s.start.column === other.selections![i].start.column &&
            s.end.line === other.selections![i].end.line &&
            s.end.column === other.selections![i].end.column,
        );
    }

    return (
      this.scrollTop === other.scrollTop &&
      this.scrollLeft === other.scrollLeft &&
      this.cursorPosition.line === other.cursorPosition.line &&
      this.cursorPosition.column === other.cursorPosition.column &&
      selectionsEqual
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
      selections: this.selections
        ? this.selections.map((s) => ({
            start: { ...s.start },
            end: { ...s.end },
          }))
        : null,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): TabViewStateClientDTO {
    return {
      scrollTop: this.scrollTop,
      scrollLeft: this.scrollLeft,
      cursorPosition: { ...this.cursorPosition },
      selections: this.selections
        ? this.selections.map((s) => ({
            start: { ...s.start },
            end: { ...s.end },
          }))
        : null,
    };
  }

  /**
   * 从 Server DTO 创建
   */
  public static fromServerDTO(dto: TabViewStateServerDTO): TabViewState {
    return new TabViewState({
      scrollTop: dto.scrollTop,
      scrollLeft: dto.scrollLeft,
      cursorPosition: { ...dto.cursorPosition },
      selections: dto.selections
        ? dto.selections.map((s) => ({
            start: { ...s.start },
            end: { ...s.end },
          }))
        : null,
    });
  }

  /**
   * 从 Client DTO 创建
   */
  public static fromClientDTO(dto: TabViewStateClientDTO): TabViewState {
    return new TabViewState({
      scrollTop: dto.scrollTop,
      scrollLeft: dto.scrollLeft,
      cursorPosition: { ...dto.cursorPosition },
      selections: dto.selections
        ? dto.selections.map((s) => ({
            start: { ...s.start },
            end: { ...s.end },
          }))
        : null,
    });
  }

  /**
   * 创建默认视图状态
   */
  public static createDefault(): TabViewState {
    return new TabViewState({
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 1, column: 1 },
      selections: null,
    });
  }
}
