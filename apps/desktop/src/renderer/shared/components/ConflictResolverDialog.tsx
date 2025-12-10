/**
 * Conflict Resolver Dialog Component
 * 
 * Provides a UI for resolving data conflicts during synchronization.
 * Users can choose to keep the local version, the server version, or manually select
 * values for individual conflicting fields.
 * 
 * Part of EPIC-004: Offline Sync - STORY-022 UI Integration.
 *
 * @module renderer/shared/components/ConflictResolverDialog
 */

import { useState, useCallback } from 'react';
import type { ConflictRecord, FieldDiff, MergeResult } from '../hooks/useConflicts';

/**
 * Props for the ConflictResolverDialog.
 */
interface ConflictResolverDialogProps {
  /** The conflict record to display and resolve. */
  conflict: ConflictRecord;
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Callback to close the dialog without resolving (postpone). */
  onClose: () => void;
  /** Callback invoked when a resolution is successfully applied locally (client-side update). */
  onResolve: (result: MergeResult) => void;
  /** Async callback to resolve using the local version entirely. */
  onResolveWithLocal: (conflictId: string) => Promise<MergeResult | null>;
  /** Async callback to resolve using the server version entirely. */
  onResolveWithServer: (conflictId: string) => Promise<MergeResult | null>;
  /** Async callback to resolve using a manual field-by-field selection. */
  onResolveManually: (conflictId: string, selections: Record<string, 'local' | 'server'>) => Promise<MergeResult | null>;
}

/** Strategy for resolution. */
type ResolutionMode = 'local' | 'server' | 'manual';

/**
 * Component for conflict resolution dialog.
 */
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

  /**
   * Initializes the field selection state for manual mode (defaulting to server).
   */
  const initFieldSelections = useCallback(() => {
    const selections: Record<string, 'local' | 'server'> = {};
    for (const diff of conflict.conflictingFields) {
      selections[diff.field] = 'server';
    }
    setFieldSelections(selections);
  }, [conflict.conflictingFields]);

  /**
   * Handles the resolution action based on the selected mode.
   */
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

  /**
   * Updates the selection for a specific field in manual mode.
   */
  const updateFieldSelection = (field: string, value: 'local' | 'server') => {
    setFieldSelections(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Formats a value for display. Handles null/undefined and objects.
   */
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '(Empty)';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  /**
   * Gets a user-friendly name for entity types.
   */
  const getEntityTypeName = (type: string): string => {
    const names: Record<string, string> = {
      goal: 'Goal',
      task: 'Task',
      keyResult: 'Key Result',
      setting: 'Setting',
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
            <h2 className="text-lg font-semibold">Conflict Detected</h2>
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
          {/* Conflict Description */}
          <p className="text-muted-foreground">
            The "{getEntityTypeName(conflict.entityType)}" has been modified on multiple devices. Please choose which version to keep.
          </p>

          {/* Version Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <span>💻</span>
                <span className="font-medium">Local Version</span>
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

            {/* Server Version */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <span>☁️</span>
                <span className="font-medium">Cloud Version</span>
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

          {/* Resolution Mode Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                checked={mode === 'server'}
                onChange={() => setMode('server')}
                className="w-4 h-4"
              />
              <span>Use Cloud Version</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="resolution"
                checked={mode === 'local'}
                onChange={() => setMode('local')}
                className="w-4 h-4"
              />
              <span>Use Local Version</span>
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
              <span>Manual Merge</span>
            </label>
          </div>

          {/* Manual Merge Options */}
          {mode === 'manual' && (
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm text-muted-foreground">Select which version to keep for each field:</p>
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
                      Local
                    </button>
                    <button
                      onClick={() => updateFieldSelection(diff.field, 'server')}
                      className={`px-3 py-1 rounded text-sm ${
                        fieldSelections[diff.field] === 'server'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      Cloud
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
            Resolve Later
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isResolving ? 'Resolving...' : 'Apply Resolution'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolverDialog;
