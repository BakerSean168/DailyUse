/**
 * NotificationFilter Component
 *
 * 通知过滤器
 * Story-010: Notification Module
 */

import { memo } from 'react';

interface NotificationFilterProps {
  currentType?: string;
  currentReadStatus?: boolean;
  onTypeChange: (type: string | undefined) => void;
  onReadStatusChange: (isRead: boolean | undefined) => void;
  onClearFilters: () => void;
}

// 通知类型选项
const notificationTypes = [
  { value: '', label: '全部类型' },
  { value: 'SYSTEM', label: '系统通知' },
  { value: 'REMINDER', label: '提醒' },
  { value: 'GOAL', label: '目标' },
  { value: 'HABIT', label: '习惯' },
  { value: 'ACHIEVEMENT', label: '成就' },
  { value: 'SOCIAL', label: '社交' },
];

// 已读状态选项
const readStatusOptions = [
  { value: '', label: '全部状态' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
];

export const NotificationFilter = memo(function NotificationFilter({
  currentType,
  currentReadStatus,
  onTypeChange,
  onReadStatusChange,
  onClearFilters,
}: NotificationFilterProps) {
  const hasFilters = currentType !== undefined || currentReadStatus !== undefined;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onTypeChange(value || undefined);
  };

  const handleReadStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onReadStatusChange(undefined);
    } else if (value === 'read') {
      onReadStatusChange(true);
    } else {
      onReadStatusChange(false);
    }
  };

  const getReadStatusValue = () => {
    if (currentReadStatus === undefined) return '';
    return currentReadStatus ? 'read' : 'unread';
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
      {/* 类型过滤 */}
      <div className="flex items-center gap-2">
        <label htmlFor="type-filter" className="text-sm text-gray-600">
          类型:
        </label>
        <select
          id="type-filter"
          value={currentType || ''}
          onChange={handleTypeChange}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {notificationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* 已读状态过滤 */}
      <div className="flex items-center gap-2">
        <label htmlFor="read-status-filter" className="text-sm text-gray-600">
          状态:
        </label>
        <select
          id="read-status-filter"
          value={getReadStatusValue()}
          onChange={handleReadStatusChange}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {readStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 清除过滤按钮 */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
        >
          清除过滤
        </button>
      )}
    </div>
  );
});

export default NotificationFilter;
