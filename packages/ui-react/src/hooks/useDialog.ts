import { useState, useCallback } from 'react';
import { type DialogState } from '@dailyuse/ui-core';

export interface UseDialogReturn {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Dialog title */
  title: string | undefined;
  /** Dialog message */
  message: string | undefined;
  /** Current state */
  state: DialogState;
  /** Open dialog */
  open: (options?: { title?: string; message?: string }) => void;
  /** Close dialog */
  close: () => void;
  /** Show confirm dialog and return promise */
  confirm: (options: { title?: string; message: string }) => Promise<boolean>;
  /** Resolve current confirm dialog */
  resolveConfirm: (value: boolean) => void;
}

/**
 * React hook for dialog state management
 * Wraps @dailyuse/ui-core dialog logic
 */
export function useDialog(): UseDialogReturn {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    title: undefined,
    message: undefined,
  });

  const [confirmResolver, setConfirmResolver] = useState<((value: boolean) => void) | null>(null);

  const open = useCallback((options?: { title?: string; message?: string }) => {
    setState({
      isOpen: true,
      title: options?.title,
      message: options?.message,
    });
  }, []);

  const close = useCallback(() => {
    if (confirmResolver) {
      confirmResolver(false);
      setConfirmResolver(null);
    }
    setState({
      isOpen: false,
      title: undefined,
      message: undefined,
    });
  }, [confirmResolver]);

  const confirm = useCallback((options: { title?: string; message: string }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmResolver(() => resolve);
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
      });
    });
  }, []);

  const resolveConfirm = useCallback(
    (value: boolean) => {
      if (confirmResolver) {
        confirmResolver(value);
        setConfirmResolver(null);
      }
      setState({
        isOpen: false,
        title: undefined,
        message: undefined,
      });
    },
    [confirmResolver]
  );

  return {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    state,
    open,
    close,
    confirm,
    resolveConfirm,
  };
}
