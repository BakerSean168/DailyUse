/**
 * VirtualList Component
 *
 * 虚拟滚动列表组件
 * 封装 useVirtualList hook，提供开箱即用的虚拟列表
 */

import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import { useVirtualList, type VirtualItem } from '../hooks/useVirtualList';

export interface VirtualListProps<T> {
  /** 列表数据 */
  items: T[];
  /** 渲染每一项的函数 */
  renderItem: (item: T, index: number, virtualItem?: VirtualItem) => ReactNode;
  /** 获取每项的唯一 key */
  getItemKey: (item: T, index: number) => string | number;
  /** 估算的每项高度 */
  estimateSize?: number;
  /** 容器过扫描数量 */
  overscan?: number;
  /** 启用虚拟滚动的阈值（默认 50） */
  threshold?: number;
  /** 容器类名 */
  className?: string;
  /** 列表类名 */
  listClassName?: string;
  /** 项目容器类名 */
  itemClassName?: string;
  /** 空状态渲染 */
  renderEmpty?: () => ReactNode;
  /** 是否显示索引 */
  showIndex?: boolean;
  /** 容器高度 */
  height?: string | number;
}

/**
 * 虚拟滚动列表组件
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={goals}
 *   renderItem={(goal) => <GoalCard goal={goal} />}
 *   getItemKey={(goal) => goal.uuid}
 *   estimateSize={100}
 *   threshold={30}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  renderItem,
  getItemKey,
  estimateSize = 80,
  overscan = 5,
  threshold = 50,
  className,
  listClassName,
  itemClassName,
  renderEmpty,
  height = '100%',
}: VirtualListProps<T>) {
  const getKey = useCallback(
    (index: number, item: T) => getItemKey(item, index),
    [getItemKey]
  );

  const {
    parentRef,
    virtualItems,
    isVirtualized,
    getContainerStyle,
    getListStyle,
    getItemStyle,
  } = useVirtualList({
    items,
    estimateSize,
    overscan,
    threshold,
    getItemKey: getKey,
  });

  // 合并容器样式
  const containerStyle = useMemo(
    () => ({
      ...getContainerStyle(),
      height: typeof height === 'number' ? `${height}px` : height,
    }),
    [getContainerStyle, height]
  );

  // 空状态
  if (items.length === 0) {
    return renderEmpty ? (
      <>{renderEmpty()}</>
    ) : (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  // 虚拟滚动模式
  if (isVirtualized) {
    return (
      <div
        ref={parentRef}
        className={`overflow-auto ${className || ''}`}
        style={containerStyle}
      >
        <div className={`relative ${listClassName || ''}`} style={getListStyle()}>
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                className={`absolute w-full ${itemClassName || ''}`}
                style={getItemStyle(virtualItem)}
                data-index={virtualItem.index}
              >
                {renderItem(item, virtualItem.index, virtualItem)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 普通列表模式（数据量少时）
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {items.map((item, index) => (
        <div key={getItemKey(item, index)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

/**
 * 带分组的虚拟列表
 */
export interface VirtualGroupedListProps<T, G> {
  /** 分组数据 */
  groups: Array<{
    key: string | number;
    label: string;
    items: T[];
  }>;
  /** 渲染每一项 */
  renderItem: (item: T, index: number) => ReactNode;
  /** 渲染分组头 */
  renderGroupHeader: (group: { key: string | number; label: string; items: T[] }) => ReactNode;
  /** 获取项目 key */
  getItemKey: (item: T) => string | number;
  /** 估算项目高度 */
  estimateItemSize?: number;
  /** 估算分组头高度 */
  estimateHeaderSize?: number;
  /** 虚拟滚动阈值 */
  threshold?: number;
  /** 容器类名 */
  className?: string;
  /** 容器高度 */
  height?: string | number;
}

type GroupedItem<T> =
  | { type: 'header'; key: string | number; label: string; itemCount: number }
  | { type: 'item'; data: T; groupKey: string | number };

/**
 * 分组虚拟列表
 */
export function VirtualGroupedList<T, G>({
  groups,
  renderItem,
  renderGroupHeader,
  getItemKey,
  estimateItemSize = 80,
  estimateHeaderSize = 40,
  threshold = 50,
  className,
  height = '100%',
}: VirtualGroupedListProps<T, G>) {
  // 扁平化分组数据
  const flatItems = useMemo(() => {
    const result: GroupedItem<T>[] = [];
    for (const group of groups) {
      result.push({
        type: 'header',
        key: group.key,
        label: group.label,
        itemCount: group.items.length,
      });
      for (const item of group.items) {
        result.push({
          type: 'item',
          data: item,
          groupKey: group.key,
        });
      }
    }
    return result;
  }, [groups]);

  // 动态估算尺寸
  const getEstimateSize = useCallback(
    (index: number) => {
      const item = flatItems[index];
      return item.type === 'header' ? estimateHeaderSize : estimateItemSize;
    },
    [flatItems, estimateHeaderSize, estimateItemSize]
  );

  const renderGroupedItem = useCallback(
    (item: GroupedItem<T>, index: number) => {
      if (item.type === 'header') {
        return renderGroupHeader({
          key: item.key,
          label: item.label,
          items: groups.find((g) => g.key === item.key)?.items || [],
        });
      }
      return renderItem(item.data, index);
    },
    [renderGroupHeader, renderItem, groups]
  );

  const getKey = useCallback(
    (item: GroupedItem<T>, index: number) => {
      if (item.type === 'header') {
        return `header-${item.key}`;
      }
      return `item-${getItemKey(item.data)}`;
    },
    [getItemKey]
  );

  return (
    <VirtualList
      items={flatItems}
      renderItem={renderGroupedItem}
      getItemKey={getKey}
      estimateSize={estimateItemSize}
      threshold={threshold}
      className={className}
      height={height}
    />
  );
}
