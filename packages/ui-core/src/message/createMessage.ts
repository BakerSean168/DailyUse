/**
 * @dailyuse/ui-core - Message State Machine
 *
 * Framework-agnostic message/notification state management.
 */

// ============================================================================
// Types
// ============================================================================

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface Message {
  /** Unique identifier */
  id: string;
  /** Message content */
  content: string;
  /** Message type */
  type: MessageType;
  /** Auto-dismiss timeout in milliseconds (0 for no auto-dismiss) */
  timeout: number;
  /** Timestamp when message was created */
  createdAt: number;
  /** Optional action button */
  action?: {
    text: string;
    callback: () => void;
  };
}

export interface MessageOptions {
  /** Message type (default: 'info') */
  type?: MessageType;
  /** Auto-dismiss timeout in ms (default: 3000, 0 for no auto-dismiss) */
  timeout?: number;
  /** Optional action button */
  action?: {
    text: string;
    callback: () => void;
  };
}

export interface MessageState {
  /** List of active messages */
  messages: Message[];
  /** Maximum number of visible messages */
  maxVisible: number;
}

export interface MessageController {
  /** Get current state */
  getState(): MessageState;
  /** Show a message */
  show(content: string, options?: MessageOptions): string;
  /** Show a success message */
  success(content: string, options?: Omit<MessageOptions, 'type'>): string;
  /** Show an error message */
  error(content: string, options?: Omit<MessageOptions, 'type'>): string;
  /** Show a warning message */
  warning(content: string, options?: Omit<MessageOptions, 'type'>): string;
  /** Show an info message */
  info(content: string, options?: Omit<MessageOptions, 'type'>): string;
  /** Dismiss a specific message */
  dismiss(id: string): void;
  /** Dismiss all messages */
  dismissAll(): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: MessageState) => void): () => void;
}

// ============================================================================
// Default Options
// ============================================================================

const DEFAULT_TIMEOUTS: Record<MessageType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

// ============================================================================
// ID Generation
// ============================================================================

let messageIdCounter = 0;

function generateMessageId(): string {
  return `msg-${Date.now()}-${++messageIdCounter}`;
}

// ============================================================================
// Core Implementation
// ============================================================================

export interface CreateMessageControllerOptions {
  /** Maximum number of visible messages (default: 5) */
  maxVisible?: number;
  /** Default timeout for messages in ms (default: 3000) */
  defaultTimeout?: number;
}

/**
 * Create a message controller
 */
export function createMessageController(
  options: CreateMessageControllerOptions = {}
): MessageController {
  const { maxVisible = 5, defaultTimeout = 3000 } = options;

  let state: MessageState = {
    messages: [],
    maxVisible,
  };

  const listeners = new Set<(state: MessageState) => void>();
  const timeoutIds = new Map<string, ReturnType<typeof setTimeout>>();

  function notify() {
    for (const listener of listeners) {
      listener({ ...state, messages: [...state.messages] });
    }
  }

  function scheduleAutoDismiss(message: Message) {
    if (message.timeout > 0) {
      const timeoutId = setTimeout(() => {
        dismiss(message.id);
      }, message.timeout);
      timeoutIds.set(message.id, timeoutId);
    }
  }

  function dismiss(id: string) {
    // Clear the timeout if exists
    const timeoutId = timeoutIds.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutIds.delete(id);
    }

    // Remove from state
    state = {
      ...state,
      messages: state.messages.filter((m) => m.id !== id),
    };
    notify();
  }

  function show(content: string, options: MessageOptions = {}): string {
    const type = options.type ?? 'info';
    const timeout = options.timeout ?? DEFAULT_TIMEOUTS[type] ?? defaultTimeout;

    const message: Message = {
      id: generateMessageId(),
      content,
      type,
      timeout,
      createdAt: Date.now(),
      action: options.action,
    };

    // Add to state (respecting maxVisible)
    let messages = [...state.messages, message];
    if (messages.length > maxVisible) {
      // Remove oldest messages
      const toRemove = messages.slice(0, messages.length - maxVisible);
      for (const m of toRemove) {
        const tid = timeoutIds.get(m.id);
        if (tid) {
          clearTimeout(tid);
          timeoutIds.delete(m.id);
        }
      }
      messages = messages.slice(-maxVisible);
    }

    state = { ...state, messages };
    notify();

    // Schedule auto-dismiss
    scheduleAutoDismiss(message);

    return message.id;
  }

  return {
    getState() {
      return { ...state, messages: [...state.messages] };
    },

    show,

    success(content: string, options?: Omit<MessageOptions, 'type'>) {
      return show(content, { ...options, type: 'success' });
    },

    error(content: string, options?: Omit<MessageOptions, 'type'>) {
      return show(content, { ...options, type: 'error' });
    },

    warning(content: string, options?: Omit<MessageOptions, 'type'>) {
      return show(content, { ...options, type: 'warning' });
    },

    info(content: string, options?: Omit<MessageOptions, 'type'>) {
      return show(content, { ...options, type: 'info' });
    },

    dismiss,

    dismissAll() {
      // Clear all timeouts
      for (const timeoutId of timeoutIds.values()) {
        clearTimeout(timeoutId);
      }
      timeoutIds.clear();

      // Clear all messages
      state = { ...state, messages: [] };
      notify();
    },

    subscribe(listener: (state: MessageState) => void) {
      listeners.add(listener);
      listener({ ...state, messages: [...state.messages] });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ============================================================================
// Snackbar (Single Message)
// ============================================================================

export interface SnackbarState {
  /** Whether snackbar is visible */
  isVisible: boolean;
  /** Current message */
  message: string;
  /** Message type */
  type: MessageType;
  /** Action button */
  action?: {
    text: string;
    callback: () => void;
  };
}

export interface SnackbarController {
  /** Get current state */
  getState(): SnackbarState;
  /** Show the snackbar */
  show(message: string, options?: MessageOptions): void;
  /** Show success snackbar */
  success(message: string, options?: Omit<MessageOptions, 'type'>): void;
  /** Show error snackbar */
  error(message: string, options?: Omit<MessageOptions, 'type'>): void;
  /** Show warning snackbar */
  warning(message: string, options?: Omit<MessageOptions, 'type'>): void;
  /** Show info snackbar */
  info(message: string, options?: Omit<MessageOptions, 'type'>): void;
  /** Hide the snackbar */
  hide(): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: SnackbarState) => void): () => void;
}

/**
 * Create a snackbar controller (single message at a time)
 */
export function createSnackbarController(
  defaultTimeout = 3000
): SnackbarController {
  let state: SnackbarState = {
    isVisible: false,
    message: '',
    type: 'info',
  };

  let currentTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(state: SnackbarState) => void>();

  function notify() {
    for (const listener of listeners) {
      listener({ ...state });
    }
  }

  function clearCurrentTimeout() {
    if (currentTimeoutId) {
      clearTimeout(currentTimeoutId);
      currentTimeoutId = null;
    }
  }

  function show(message: string, options: MessageOptions = {}) {
    clearCurrentTimeout();

    const type = options.type ?? 'info';
    const timeout = options.timeout ?? DEFAULT_TIMEOUTS[type] ?? defaultTimeout;

    state = {
      isVisible: true,
      message,
      type,
      action: options.action,
    };
    notify();

    if (timeout > 0) {
      currentTimeoutId = setTimeout(() => {
        hide();
      }, timeout);
    }
  }

  function hide() {
    clearCurrentTimeout();
    state = { ...state, isVisible: false };
    notify();
  }

  return {
    getState() {
      return { ...state };
    },

    show,

    success(message: string, options?: Omit<MessageOptions, 'type'>) {
      show(message, { ...options, type: 'success' });
    },

    error(message: string, options?: Omit<MessageOptions, 'type'>) {
      show(message, { ...options, type: 'error' });
    },

    warning(message: string, options?: Omit<MessageOptions, 'type'>) {
      show(message, { ...options, type: 'warning' });
    },

    info(message: string, options?: Omit<MessageOptions, 'type'>) {
      show(message, { ...options, type: 'info' });
    },

    hide,

    subscribe(listener: (state: SnackbarState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
