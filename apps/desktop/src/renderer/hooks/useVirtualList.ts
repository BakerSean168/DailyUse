/**
 * useVirtualList Hook
 *
 * 基于 @tanstack/react-virtual 的虚拟滚动 Hook
 * 用于优化长列表渲染性能
 */

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';

export interface VirtualListOptions<T> {
  /** 列表数据 */
  items: T[];
  /** 估算的每项高度 */
  estimateSize?: number;
  /** 容器过扫描数量（预渲染项数） */
  overscan?: number;
  /** 获取每项的唯一 key */
  getItemKey?: (index: number, item: T) => string | number;
  /** 是否启用虚拟滚动（数据少时可禁用） */
  enabled?: boolean;
  /** 启用虚拟滚动的阈值 */
  threshold?: number;
}

export interface VirtualListResult<T> {
  /** 容器 ref */
  parentRef: React.RefObject<HTMLDivElement>;
  /** 虚拟化后的项目 */
  virtualItems: VirtualItem[];
  /** 总高度（用于占位） */
  totalSize: number;
  /** 是否启用虚拟滚动 */
  isVirtualized: boolean;
  /** 获取项目样式 */
  getItemStyle: (virtualItem: VirtualItem) => React.CSSProperties;
  /** 获取容器样式 */
  getContainerStyle: () => React.CSSProperties;
  /** 获取列表内容样式 */
  getListStyle: () => React.CSSProperties;
  /** 滚动到指定索引 */
  scrollToIndex: (index: number) => void;
  /** 滚动到开始 */
  scrollToStart: () => void;
  /** 滚动到结束 */
  scrollToEnd: () => void;
  /** 测量某一项（高度变化后调用） */
  measureItem: (index: number) => void;
}

/**
 * 虚拟滚动 Hook
 *
 * @example
 * ```tsx
 * const { parentRef, virtualItems, getContainerStyle, getListStyle, getItemStyle } = useVirtualList({
 *   items: goals,
 *   estimateSize: 80,
 *   threshold: 50,
 * });
 *
 * return (
 *   <div ref={parentRef} style={getContainerStyle()}>
 *     <div style={getListStyle()}>
 *       {virtualItems.map((virtualItem) => (
 *         <div key={virtualItem.key} style={getItemStyle(virtualItem)}>
 *           <GoalCard goal={items[virtualItem.index]} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualList<T>(
  options: VirtualListOptions<T>
): VirtualListResult<T> {
  const {
    items,
    estimateSize = 80,
    overscan = 5,
    getItemKey,
    enabled = true,
    threshold = 50,
  } = options;

  const parentRef = useRef<HTMLDivElement>(null);

  // 决定是否启用虚拟滚动
  const isVirtualized = enabled && items.length > threshold;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(index, items[index])
      : undefined,
    enabled: isVirtualized,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // 样式生成器
  const getContainerStyle = useMemo(
    () => (): React.CSSProperties => ({
      height: '100%',
      overflow: 'auto',
    }),
    []
  );

  const getListStyle = useMemo(
    () => (): React.CSSProperties =>
      isVirtualized
        ? {
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }
        : {},
    [isVirtualized, totalSize]
  );

  const getItemStyle = useMemo(
    () =>
      (virtualItem: VirtualItem): React.CSSProperties =>
        isVirtualized
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }
          : {},
    [isVirtualized]
  );

  // 滚动方法
  const scrollToIndex = (index: number) => {
    virtualizer.scrollToIndex(index, { align: 'center' });
  };

  const scrollToStart = () => {
    virtualizer.scrollToOffset(0);
  };

  const scrollToEnd = () => {
    virtualizer.scrollToOffset(totalSize);
  };

  const measureItem = (index: number) => {
    virtualizer.measureElement(
      parentRef.current?.children[0]?.children[index] as HTMLElement | null
    );
  };

  return {
    parentRef,
    virtualItems: isVirtualized ? virtualItems : [],
    totalSize,
    isVirtualized,
    getItemStyle,
    getContainerStyle,
    getListStyle,
    scrollToIndex,
    scrollToStart,
    scrollToEnd,
    measureItem,
  };
}

export type { VirtualItem };
