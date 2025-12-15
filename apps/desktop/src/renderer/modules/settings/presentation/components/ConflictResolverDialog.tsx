/**
 * ConflictResolverDialog Component
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 冲突解决对话框
 * 
 * TODO: 实现实际的冲突解决 UI
 */

import type { ConflictRecord, MergeResult } from '../hooks/useConflicts';

interface ConflictResolverDialogProps {
  conflict: ConflictRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (result: MergeResult) => void;
  onResolveWithLocal: (conflictId: string) => Promise<void>;
  onResolveWithServer: (conflictId: string) => Promise<void>;
  onResolveManually: (conflictId: string, mergedData: unknown) => Promise<void>;
}

/**
 * 冲突解决对话框组件
 */
export function ConflictResolverDialog({
  conflict,
  isOpen,
  onClose,
  onResolve,
  onResolveWithLocal,
  onResolveWithServer,
}: ConflictResolverDialogProps) {
  if (!conflict || !isOpen) return null;

  const handleResolveWithLocal = async () => {
    await onResolveWithLocal(conflict.id);
    onResolve({ conflictId: conflict.id, resolution: 'local' });
    onClose();
  };

  const handleResolveWithServer = async () => {
    await onResolveWithServer(conflict.id);
    onResolve({ conflictId: conflict.id, resolution: 'server' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">解决冲突</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            实体类型: {conflict.entityType}
          </div>
          <div className="text-sm text-muted-foreground">
            实体ID: {conflict.entityId}
          </div>
          <div className="text-sm text-muted-foreground">
            冲突字段: {conflict.conflictingFields.join(', ')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">本地数据</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(conflict.localData, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">服务器数据</h3>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(conflict.serverData, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleResolveWithLocal}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              使用本地
            </button>
            <button
              onClick={handleResolveWithServer}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              使用服务器
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-muted"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolverDialog;
