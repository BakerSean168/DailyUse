/**
 * ResourceItem Component
 *
 * 资源列表项
 * Story-011: Repository Module UI
 */

import { memo } from 'react';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

interface ResourceItemProps {
  resource: ResourceClientDTO;
  onClick: (uuid: string) => void;
  onRename: (uuid: string) => void;
  onDelete: (uuid: string) => void;
}

export const ResourceItem = memo(function ResourceItem({
  resource,
  onClick,
  onRename,
  onDelete,
}: ResourceItemProps) {
  // 类型图标
  const typeIcons: Record<string, string> = {
    MARKDOWN: '📝',
    CODE: '💻',
    IMAGE: '🖼️',
    PDF: '📕',
    DOCUMENT: '📄',
    VIDEO: '🎬',
    AUDIO: '🎵',
  };

  const icon = resource.icon || typeIcons[resource.type] || '📄';

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename(resource.uuid);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除 "${resource.name}" 吗？`)) {
      onDelete(resource.uuid);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors"
      onClick={() => onClick(resource.uuid)}
    >
      {/* 图标 */}
      <div className="text-xl flex-shrink-0">{icon}</div>

      {/* 名称和信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">
            {resource.displayName}
          </span>
          <span className="text-xs text-gray-400">{resource.extension}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span>{resource.formattedSize}</span>
          <span>{resource.updatedAtText}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleRename}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="重命名"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  );
});

export default ResourceItem;
