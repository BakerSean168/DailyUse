/**
 * Conflict Resolver Dialog Component
 * 
 * EPIC-004: Offline Sync - STORY-022 UI 集成
 * 
 * 显示冲突详情并允许用户选择解决方案
 */

import { useState, useCallback } from 'react';
import type { ConflictRecord, FieldDiff, MergeResult } from '../hooks/useConflicts';

interface ConflictResolverDialogProps {
  conflict: ConflictRecord;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (result: MergeResult) => void;
  onResolveWithLocal: (conflictId: string) => Promise<MergeResult | null>;
  onResolveWithServer: (conflictId: string) => Promise<MergeResult | null>;
  onResolveManually: (conflictId: string, selections: Record<string, 'local' | 'server'>) => Promise<MergeResult | null>;
}

type ResolutionMode = 'local' | 'server' | 'manual';

export function ConflictResolverDialog({
  conflict,
  isOpen,
  onClose,
  onResolve,
  onResolveWithLocal,
  onResolveWithServer,
  onResolveManually,
}: ConflictResolverDialogProps) {
  const [mode, setMode] = useState<ResolutionMode>('server');
  const [fieldSelections, setFieldSelections] = useState<Record<string, 'local' | 'server'>>({});
  const [isResolving, setIsResolving] = useState(false);

  // 初始化字段选择
  const initFieldSelections = useCallback(() => {
    const selections: Record<string, 'local' | 'server'> = {};
    for (const diff of conflict.conflictingFields) {
      selections[diff.field] = 'server';
    }
    setFieldSelections(selections);
  }, [conflict.conflictingFields]);

  // 处理解决
  const handleResolve = async () => {
    setIsResolving(true);
    try {
      let result: MergeResult | null = null;

      switch (mode) {
        case 'local':
          result = await onResolveWithLocal(conflict.id);
          break;
        case 'server':
          result = await onResolveWithServer(conflict.id);
          break;
        case 'manual':
          result = await onResolveManually(conflict.id, fieldSelections);
          break;
      }

      if (result) {
        onResolve(result);
        onClose();
      }
    } finally {
      setIsResolving(false);
    }
  };

  // 更新字段选择
  const updateFieldSelection = (field: string, value: 'local' | 'server') => {
    setFieldSelections(prev => ({ ...prev, [field]: value }));
  };

  // 格式化值显示
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(空)';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // 获取实体类型显示名称
  const getEntityTypeName = (type: string): string => {
    const names: Record<string, string> = {
      goal: '目标',
      task: '任务',
      keyResult: '关键结果',
      setting: '设置',
    };
    return names[type.toLowerCase()] ?? type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-lg font-semibold">检测到数据冲突</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* 冲突说明 */}
          <p className="text-muted-foreground">
            「{getEntityTypeName(conflict.entityType)}」在多个设备上被修改，请选择保留哪个版本。
          </p>

          {/* 版本对比 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 本地版本 */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <span>💻</span>
                <span className="font-medium">本地版本</span>
              </div>
              <div className="space-y-2 text-sm">
                {conflict.conflictingFields.map((diff) => (
                  <div key={diff.field} className="bg-muted/50 rounded p-2">
                    <div className="font-medium text-muted-foreground">{diff.field}</div>
                    <div className="mt-1 break-words">{formatValue(diff.localValue)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 服务器版本 */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <span>☁️</span>
                <span className="font-medium">云端版本</span>
              </div>
              <div className="space-y-2 text-sm">
                {conflict.conflictingFields.map((diff) => (
                  <div key={diff.field} className="bg-muted/50 rounded p-2">
                    <div className="font-medium text-muted-foreground">{diff.field}</div>
                    <div className="mt-1 break-words">{formatValue(diff.serverValue)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 解决方式选择 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                checked={mode === 'server'}
                onChange={() => setMode('server')}
                className="w-4 h-4"
              />
              <span>使用云端版本</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                checked={mode === 'local'}
                onChange={() => setMode('local')}
                className="w-4 h-4"
              />
              <span>使用本地版本</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                checked={mode === 'manual'}
                onChange={() => {
                  setMode('manual');
                  initFieldSelections();
                }}
                className="w-4 h-4"
              />
              <span>手动合并</span>
            </label>
          </div>

          {/* 手动合并选项 */}
          {mode === 'manual' && (
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm text-muted-foreground">为每个冲突字段选择要保留的版本：</p>
              {conflict.conflictingFields.map((diff) => (
                <div key={diff.field} className="flex items-center justify-between">
                  <span className="font-medium">{diff.field}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateFieldSelection(diff.field, 'local')}
                      className={`px-3 py-1 rounded text-sm ${
                        fieldSelections[diff.field] === 'local'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      本地
                    </button>
                    <button
                      onClick={() => updateFieldSelection(diff.field, 'server')}
                      className={`px-3 py-1 rounded text-sm ${
                        fieldSelections[diff.field] === 'server'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      云端
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md hover:bg-muted"
          >
            稍后解决
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isResolving ? '处理中...' : '应用选择'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolverDialog;
