/**
 * RepositoryCard Component
 *
 * 仓库卡片
 * Story-011: Repository Module UI
 */

import { memo } from 'react';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

interface RepositoryCardProps {
  repository: RepositoryClientDTO;
  onSelect: (uuid: string) => void;
  onDelete: (uuid: string) => void;
}

export const RepositoryCard = memo(function RepositoryCard({
  repository,
  onSelect,
  onDelete,
}: RepositoryCardProps) {
  // 类型图标
  const typeIcons: Record<string, string> = {
    MARKDOWN: '📝',
    CODE: '💻',
    NOTE: '📒',
    DOCUMENT: '📄',
    GENERAL: '📁',
  };

  const icon = typeIcons[repository.type] || '📁';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除仓库 "${repository.name}" 吗？此操作不可恢复。`)) {
      onDelete(repository.uuid);
    }
  };

  return (
    <div
      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onSelect(repository.uuid)}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className="text-3xl">{icon}</div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{repository.name}</h3>
          {repository.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {repository.description}
            </p>
          )}

          {/* 统计信息 */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span>📁 {repository.folderCount} 文件夹</span>
            <span>📄 {repository.resourceCount} 资源</span>
            <span>💾 {repository.formattedSize}</span>
          </div>

          {/* 时间信息 */}
          <div className="text-xs text-gray-400 mt-2">
            更新于 {repository.updatedAtText}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="删除仓库"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 状态标签 */}
      {!repository.isActive && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded ${
              repository.isArchived
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {repository.statusText}
          </span>
        </div>
      )}
    </div>
  );
});

export default RepositoryCard;
