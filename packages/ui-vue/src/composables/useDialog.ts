/**
 * @dailyuse/ui-vue - Dialog Composables
 *
 * Vue 3 composables wrapping @dailyuse/ui-core dialog state.
 */

import {
  ref,
  readonly,
  onUnmounted,
  type Ref,
  type DeepReadonly,
} from 'vue';
import {
  createDialogController,
  createDeleteConfirmDialog,
  type DialogState,
  type DialogOptions,
  type DialogButton,
  type DialogType,
  type DeleteConfirmOptions,
} from '@dailyuse/ui-core';

// Re-export types
export type {
  DialogState,
  DialogOptions,
  DialogButton,
  DialogType,
  DeleteConfirmOptions,
};

// ============================================================================
// Dialog Composable
// ============================================================================

/**
 * Dialog composable
 */
export function useDialog(): {
  /** Reactive dialog state */
  state: DeepReadonly<Ref<DialogState>>;
  /** Whether dialog is visible */
  isVisible: Ref<boolean>;
  /** Dialog title */
  title: Ref<string>;
  /** Dialog message */
  message: Ref<string>;
  /** Dialog type */
  type: Ref<DialogType>;
  /** Confirm button */
  confirmButton: Ref<DialogButton>;
  /** Cancel button */
  cancelButton: Ref<DialogButton | null>;
  /** Input value (for prompt) */
  inputValue: Ref<string>;
  /** Show confirmation dialog */
  confirm: (options: DialogOptions) => Promise<boolean>;
  /** Show alert dialog */
  alert: (options: Omit<DialogOptions, 'cancelButton'>) => Promise<void>;
  /** Show prompt dialog */
  prompt: (options: DialogOptions) => Promise<string | null>;
  /** Set input value */
  setInputValue: (value: string) => void;
  /** Handle confirm action */
  handleConfirm: () => void;
  /** Handle cancel action */
  handleCancel: () => void;
  /** Close dialog */
  close: () => void;
  /** Delete confirmation helper */
  confirmDelete: (options?: DeleteConfirmOptions) => Promise<boolean>;
} {
  const controller = createDialogController();
  const state = ref<DialogState>(controller.getState());
  const isVisible = ref(false);
  const title = ref('');
  const message = ref('');
  const type = ref<DialogType>('confirm');
  const confirmButton = ref<DialogButton>({ text: '确定', variant: 'primary' });
  const cancelButton = ref<DialogButton | null>({ text: '取消', variant: 'text' });
  const inputValue = ref('');

  const unsubscribe = controller.subscribe((newState: DialogState) => {
    state.value = newState;
    isVisible.value = newState.isVisible;
    title.value = newState.title;
    message.value = newState.message;
    type.value = newState.type;
    confirmButton.value = newState.confirmButton;
    cancelButton.value = newState.cancelButton;
    inputValue.value = newState.inputValue;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  const confirmDelete = createDeleteConfirmDialog(controller);

  return {
    state: readonly(state),
    isVisible,
    title,
    message,
    type,
    confirmButton,
    cancelButton,
    inputValue,
    confirm: controller.confirm.bind(controller),
    alert: controller.alert.bind(controller),
    prompt: controller.prompt.bind(controller),
    setInputValue: controller.setInputValue.bind(controller),
    handleConfirm: controller.handleConfirm.bind(controller),
    handleCancel: controller.handleCancel.bind(controller),
    close: controller.close.bind(controller),
    confirmDelete,
  };
}

// ============================================================================
// Global Dialog (Singleton)
// ============================================================================

let globalDialogController: ReturnType<typeof createDialogController> | null = null;

function getGlobalDialogController() {
  if (!globalDialogController) {
    globalDialogController = createDialogController();
  }
  return globalDialogController;
}

/**
 * Get the global dialog controller (for use outside Vue components)
 */
export function getGlobalDialog() {
  return getGlobalDialogController();
}

/**
 * Global dialog composable (singleton)
 */
export function useGlobalDialog(): {
  /** Whether dialog is visible */
  isVisible: Ref<boolean>;
  /** Dialog state */
  state: DeepReadonly<Ref<DialogState>>;
  /** Show confirmation dialog */
  confirm: (options: DialogOptions) => Promise<boolean>;
  /** Show alert dialog */
  alert: (options: Omit<DialogOptions, 'cancelButton'>) => Promise<void>;
  /** Show prompt dialog */
  prompt: (options: DialogOptions) => Promise<string | null>;
  /** Set input value */
  setInputValue: (value: string) => void;
  /** Handle confirm action */
  handleConfirm: () => void;
  /** Handle cancel action */
  handleCancel: () => void;
  /** Close dialog */
  close: () => void;
  /** Delete confirmation helper */
  confirmDelete: (options?: DeleteConfirmOptions) => Promise<boolean>;
} {
  const controller = getGlobalDialogController();
  const state = ref<DialogState>(controller.getState());
  const isVisible = ref(false);

  const unsubscribe = controller.subscribe((newState: DialogState) => {
    state.value = newState;
    isVisible.value = newState.isVisible;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  const confirmDelete = createDeleteConfirmDialog(controller);

  return {
    isVisible,
    state: readonly(state),
    confirm: controller.confirm.bind(controller),
    alert: controller.alert.bind(controller),
    prompt: controller.prompt.bind(controller),
    setInputValue: controller.setInputValue.bind(controller),
    handleConfirm: controller.handleConfirm.bind(controller),
    handleCancel: controller.handleCancel.bind(controller),
    close: controller.close.bind(controller),
    confirmDelete,
  };
}
