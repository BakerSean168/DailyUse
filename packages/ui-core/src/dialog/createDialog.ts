/**
 * @dailyuse/ui-core - Dialog State Machine
 *
 * Framework-agnostic dialog/modal state management.
 */

// ============================================================================
// Types
// ============================================================================

export type DialogType = 'confirm' | 'alert' | 'prompt' | 'custom';

export interface DialogButton {
  /** Button text */
  text: string;
  /** Button variant/type */
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  /** Whether this button is disabled */
  disabled?: boolean;
}

export interface DialogOptions {
  /** Dialog title */
  title?: string;
  /** Dialog message/content */
  message: string;
  /** Dialog type */
  type?: DialogType;
  /** Confirm button configuration */
  confirmButton?: DialogButton;
  /** Cancel button configuration */
  cancelButton?: DialogButton;
  /** Whether the dialog can be closed by clicking outside */
  closeOnClickOutside?: boolean;
  /** Whether the dialog can be closed by pressing Escape */
  closeOnEscape?: boolean;
  /** Optional input placeholder (for prompt type) */
  inputPlaceholder?: string;
  /** Optional input default value (for prompt type) */
  inputDefaultValue?: string;
}

export interface DialogState {
  /** Whether the dialog is visible */
  isVisible: boolean;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Dialog type */
  type: DialogType;
  /** Confirm button */
  confirmButton: DialogButton;
  /** Cancel button (null for alert type) */
  cancelButton: DialogButton | null;
  /** Whether clicking outside closes the dialog */
  closeOnClickOutside: boolean;
  /** Whether pressing Escape closes the dialog */
  closeOnEscape: boolean;
  /** Input placeholder (for prompt type) */
  inputPlaceholder: string;
  /** Input value (for prompt type) */
  inputValue: string;
}

export type DialogResult<T = boolean> =
  | { confirmed: true; value: T }
  | { confirmed: false };

export interface DialogController {
  /** Get current state */
  getState(): DialogState;
  /** Show a confirmation dialog */
  confirm(options: DialogOptions): Promise<boolean>;
  /** Show an alert dialog */
  alert(options: Omit<DialogOptions, 'cancelButton'>): Promise<void>;
  /** Show a prompt dialog */
  prompt(options: DialogOptions): Promise<string | null>;
  /** Update input value (for prompt type) */
  setInputValue(value: string): void;
  /** Handle confirm action */
  handleConfirm(): void;
  /** Handle cancel action */
  handleCancel(): void;
  /** Close the dialog */
  close(): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: DialogState) => void): () => void;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_CONFIRM_BUTTON: DialogButton = {
  text: '确定',
  variant: 'primary',
};

const DEFAULT_CANCEL_BUTTON: DialogButton = {
  text: '取消',
  variant: 'text',
};

const DEFAULT_STATE: DialogState = {
  isVisible: false,
  title: '',
  message: '',
  type: 'confirm',
  confirmButton: DEFAULT_CONFIRM_BUTTON,
  cancelButton: DEFAULT_CANCEL_BUTTON,
  closeOnClickOutside: true,
  closeOnEscape: true,
  inputPlaceholder: '',
  inputValue: '',
};

// ============================================================================
// Core Implementation
// ============================================================================

/**
 * Create a dialog controller
 */
export function createDialogController(): DialogController {
  let state: DialogState = { ...DEFAULT_STATE };
  const listeners = new Set<(state: DialogState) => void>();

  let currentResolve: ((value: unknown) => void) | null = null;

  function notify() {
    for (const listener of listeners) {
      listener({ ...state });
    }
  }

  function reset() {
    state = { ...DEFAULT_STATE };
    currentResolve = null;
    notify();
  }

  function showDialog(options: DialogOptions): void {
    state = {
      isVisible: true,
      title: options.title ?? '',
      message: options.message,
      type: options.type ?? 'confirm',
      confirmButton: options.confirmButton ?? DEFAULT_CONFIRM_BUTTON,
      cancelButton:
        options.type === 'alert' ? null : (options.cancelButton ?? DEFAULT_CANCEL_BUTTON),
      closeOnClickOutside: options.closeOnClickOutside ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
      inputPlaceholder: options.inputPlaceholder ?? '',
      inputValue: options.inputDefaultValue ?? '',
    };
    notify();
  }

  return {
    getState() {
      return { ...state };
    },

    confirm(options: DialogOptions): Promise<boolean> {
      return new Promise((resolve) => {
        currentResolve = resolve as (value: unknown) => void;
        showDialog({ ...options, type: 'confirm' });
      });
    },

    alert(options: Omit<DialogOptions, 'cancelButton'>): Promise<void> {
      return new Promise((resolve) => {
        currentResolve = resolve as (value: unknown) => void;
        showDialog({ ...options, type: 'alert' });
      });
    },

    prompt(options: DialogOptions): Promise<string | null> {
      return new Promise((resolve) => {
        currentResolve = resolve as (value: unknown) => void;
        showDialog({ ...options, type: 'prompt' });
      });
    },

    setInputValue(value: string) {
      state = { ...state, inputValue: value };
      notify();
    },

    handleConfirm() {
      const resolve = currentResolve;
      const inputValue = state.inputValue;
      const type = state.type;

      reset();

      if (resolve) {
        if (type === 'prompt') {
          resolve(inputValue);
        } else if (type === 'alert') {
          resolve(undefined);
        } else {
          resolve(true);
        }
      }
    },

    handleCancel() {
      const resolve = currentResolve;
      const type = state.type;

      reset();

      if (resolve) {
        if (type === 'prompt') {
          resolve(null);
        } else {
          resolve(false);
        }
      }
    },

    close() {
      this.handleCancel();
    },

    subscribe(listener: (state: DialogState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a simple confirm dialog function
 */
export function createConfirmDialog(controller: DialogController) {
  return (message: string, title = '确认'): Promise<boolean> => {
    return controller.confirm({ message, title });
  };
}

/**
 * Create a simple alert dialog function
 */
export function createAlertDialog(controller: DialogController) {
  return (message: string, title = '提示'): Promise<void> => {
    return controller.alert({ message, title });
  };
}

/**
 * Create a simple prompt dialog function
 */
export function createPromptDialog(controller: DialogController) {
  return (
    message: string,
    defaultValue = '',
    title = '输入'
  ): Promise<string | null> => {
    return controller.prompt({
      message,
      title,
      inputDefaultValue: defaultValue,
    });
  };
}

// ============================================================================
// Delete Confirmation Preset
// ============================================================================

export interface DeleteConfirmOptions {
  /** Item name to delete */
  itemName?: string;
  /** Custom message */
  message?: string;
  /** Custom title */
  title?: string;
}

/**
 * Create a delete confirmation dialog function
 */
export function createDeleteConfirmDialog(controller: DialogController) {
  return (options: DeleteConfirmOptions = {}): Promise<boolean> => {
    const title = options.title ?? '确认删除';
    const message =
      options.message ??
      (options.itemName
        ? `确定要删除 "${options.itemName}" 吗？此操作不可撤销。`
        : '确定要删除吗？此操作不可撤销。');

    return controller.confirm({
      title,
      message,
      confirmButton: {
        text: '删除',
        variant: 'danger',
      },
      cancelButton: {
        text: '取消',
        variant: 'text',
      },
    });
  };
}
