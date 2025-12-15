/**
 * useVirtualList Hook
 *
 * A custom hook wrapping `@tanstack/react-virtual` to simplify virtual scrolling integration.
 * Optimized for rendering large lists by only rendering items currently in the viewport.
 * Automatically enables/disables based on item count threshold.
 *
 * @module renderer/shared/hooks/useVirtualList
 */

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';

/**
 * Configuration options for useVirtualList.
 *
 * @template T Type of items in the list.
 */
export interface VirtualListOptions<T> {
  /** Array of data items. */
  items: T[];
  /** Estimated height of a single item in pixels. Defaults to 80. */
  estimateSize?: number;
  /** Number of items to render outside the viewport. Defaults to 5. */
  overscan?: number;
  /** Function to get a stable key for an item. Essential for correct state management. */
  getItemKey?: (index: number, item: T) => string | number;
  /** Manually enable or disable virtualization. Defaults to true. */
  enabled?: boolean;
  /** Minimum item count required to activate virtual scrolling. Defaults to 50. */
  threshold?: number;
}

/**
 * Result returned by useVirtualList.
 *
 * @template T Type of items in the list.
 */
export interface VirtualListResult<T> {
  /** Ref to attach to the scroll container element. */
  parentRef: React.RefObject<HTMLDivElement | null>;
  /** Array of items currently to be rendered. */
  virtualItems: VirtualItem[];
  /** Total calculated height of the list (for the spacer). */
  totalSize: number;
  /** Whether virtual scrolling is currently active. */
  isVirtualized: boolean;
  /** Function to get styles for an individual item wrapper. */
  getItemStyle: (virtualItem: VirtualItem) => React.CSSProperties;
  /** Function to get styles for the scroll container. */
  getContainerStyle: () => React.CSSProperties;
  /** Function to get styles for the inner list wrapper. */
  getListStyle: () => React.CSSProperties;
  /** Scroll the container to a specific item index. */
  scrollToIndex: (index: number) => void;
  /** Scroll to the top of the list. */
  scrollToStart: () => void;
  /** Scroll to the bottom of the list. */
  scrollToEnd: () => void;
  /** Trigger a re-measurement of a specific item's size. */
  measureItem: (index: number) => void;
}

/**
 * Hook to manage virtual scrolling state and logic.
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
 *
 * @template T Type of items.
 * @param {VirtualListOptions<T>} options - Configuration options.
 * @returns {VirtualListResult<T>} Virtualizer state and helpers.
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

  // Enable virtualization only if enabled AND item count exceeds threshold
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

  // Style generators
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

  // Scroll helpers
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
