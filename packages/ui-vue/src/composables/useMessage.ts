/**
 * @dailyuse/ui-vue - Message Composables
 *
 * Vue 3 composables wrapping @dailyuse/ui-core message state.
 */

import {
  ref,
  readonly,
  onUnmounted,
  type Ref,
  type DeepReadonly,
} from 'vue';
import {
  createMessageController,
  createSnackbarController,
  type MessageState,
  type Message,
  type MessageOptions,
  type MessageType,
  type SnackbarState,
  type CreateMessageControllerOptions,
} from '@dailyuse/ui-core';

// Re-export types
export type { MessageState, Message, MessageOptions, MessageType, SnackbarState };

// ============================================================================
// Message Queue
// ============================================================================

/**
 * Message queue composable
 */
export function useMessage(options?: CreateMessageControllerOptions): {
  /** Reactive message state */
  state: DeepReadonly<Ref<MessageState>>;
  /** Active messages */
  messages: Ref<Message[]>;
  /** Show a message */
  show: (content: string, options?: MessageOptions) => string;
  /** Show success message */
  success: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Show error message */
  error: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Show warning message */
  warning: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Show info message */
  info: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Dismiss a specific message */
  dismiss: (id: string) => void;
  /** Dismiss all messages */
  dismissAll: () => void;
} {
  const controller = createMessageController(options);
  const state = ref<MessageState>(controller.getState());
  const messages = ref<Message[]>([]);

  const unsubscribe = controller.subscribe((newState: MessageState) => {
    state.value = newState;
    messages.value = newState.messages;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    state: readonly(state),
    messages,
    show: controller.show.bind(controller),
    success: controller.success.bind(controller),
    error: controller.error.bind(controller),
    warning: controller.warning.bind(controller),
    info: controller.info.bind(controller),
    dismiss: controller.dismiss.bind(controller),
    dismissAll: controller.dismissAll.bind(controller),
  };
}

// ============================================================================
// Global Message (Singleton)
// ============================================================================

let globalMessageController: ReturnType<typeof createMessageController> | null = null;

function getGlobalMessageController() {
  if (!globalMessageController) {
    globalMessageController = createMessageController({ maxVisible: 5 });
  }
  return globalMessageController;
}

/**
 * Get the global message controller (for use outside Vue components)
 */
export function getGlobalMessage() {
  return getGlobalMessageController();
}

/**
 * Global message composable (singleton)
 */
export function useGlobalMessage(): {
  /** Active messages */
  messages: Ref<Message[]>;
  /** Show a message */
  show: (content: string, options?: MessageOptions) => string;
  /** Show success message */
  success: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Show error message */
  error: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Show warning message */
  warning: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Show info message */
  info: (content: string, options?: Omit<MessageOptions, 'type'>) => string;
  /** Dismiss a specific message */
  dismiss: (id: string) => void;
  /** Dismiss all messages */
  dismissAll: () => void;
} {
  const controller = getGlobalMessageController();
  const messages = ref<Message[]>(controller.getState().messages);

  const unsubscribe = controller.subscribe((state: MessageState) => {
    messages.value = state.messages;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    messages,
    show: controller.show.bind(controller),
    success: controller.success.bind(controller),
    error: controller.error.bind(controller),
    warning: controller.warning.bind(controller),
    info: controller.info.bind(controller),
    dismiss: controller.dismiss.bind(controller),
    dismissAll: controller.dismissAll.bind(controller),
  };
}

// ============================================================================
// Snackbar
// ============================================================================

/**
 * Snackbar composable (single message at a time)
 */
export function useSnackbar(defaultTimeout = 3000): {
  /** Reactive snackbar state */
  state: DeepReadonly<Ref<SnackbarState>>;
  /** Whether snackbar is visible */
  isVisible: Ref<boolean>;
  /** Current message */
  message: Ref<string>;
  /** Message type */
  type: Ref<MessageType>;
  /** Show snackbar */
  show: (message: string, options?: MessageOptions) => void;
  /** Show success snackbar */
  success: (message: string, options?: Omit<MessageOptions, 'type'>) => void;
  /** Show error snackbar */
  error: (message: string, options?: Omit<MessageOptions, 'type'>) => void;
  /** Show warning snackbar */
  warning: (message: string, options?: Omit<MessageOptions, 'type'>) => void;
  /** Show info snackbar */
  info: (message: string, options?: Omit<MessageOptions, 'type'>) => void;
  /** Hide snackbar */
  hide: () => void;
  /** Snackbar color (for Vuetify) */
  color: Ref<string>;
} {
  const controller = createSnackbarController(defaultTimeout);
  const state = ref<SnackbarState>(controller.getState());
  const isVisible = ref(false);
  const message = ref('');
  const type = ref<MessageType>('info');
  const color = ref('info');

  const typeToColor: Record<MessageType, string> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };

  const unsubscribe = controller.subscribe((newState: SnackbarState) => {
    state.value = newState;
    isVisible.value = newState.isVisible;
    message.value = newState.message;
    type.value = newState.type;
    color.value = typeToColor[newState.type];
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    state: readonly(state),
    isVisible,
    message,
    type,
    color,
    show: controller.show.bind(controller),
    success: controller.success.bind(controller),
    error: controller.error.bind(controller),
    warning: controller.warning.bind(controller),
    info: controller.info.bind(controller),
    hide: controller.hide.bind(controller),
  };
}
