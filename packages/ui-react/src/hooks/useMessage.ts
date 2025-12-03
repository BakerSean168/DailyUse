import { useState, useCallback, useMemo } from 'react';
import {
  createMessageStore,
  type MessageType,
  type MessageOptions,
  type MessageState,
} from '@dailyuse/ui-core';

export interface UseMessageReturn {
  /** Current messages */
  messages: MessageState[];
  /** Show a message */
  show: (options: MessageOptions) => string;
  /** Show success message */
  success: (text: string, duration?: number) => string;
  /** Show error message */
  error: (text: string, duration?: number) => string;
  /** Show warning message */
  warning: (text: string, duration?: number) => string;
  /** Show info message */
  info: (text: string, duration?: number) => string;
  /** Hide a message by ID */
  hide: (id: string) => void;
  /** Clear all messages */
  clear: () => void;
}

/**
 * React hook for message/toast management
 * Wraps @dailyuse/ui-core message logic
 */
export function useMessage(): UseMessageReturn {
  const [messages, setMessages] = useState<MessageState[]>([]);

  const store = useMemo(
    () =>
      createMessageStore({
        getMessages: () => messages,
        setMessages,
      }),
    [] // Store is created once, but uses current messages via closure
  );

  // Recreate store methods to use latest state
  const show = useCallback((options: MessageOptions) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message: MessageState = {
      id,
      text: options.text,
      type: options.type || 'info',
      duration: options.duration ?? 3000,
    };

    setMessages((prev) => [...prev, message]);

    if (message.duration > 0) {
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, message.duration);
    }

    return id;
  }, []);

  const success = useCallback(
    (text: string, duration?: number) => show({ text, type: 'success', duration }),
    [show]
  );

  const error = useCallback(
    (text: string, duration?: number) => show({ text, type: 'error', duration }),
    [show]
  );

  const warning = useCallback(
    (text: string, duration?: number) => show({ text, type: 'warning', duration }),
    [show]
  );

  const info = useCallback(
    (text: string, duration?: number) => show({ text, type: 'info', duration }),
    [show]
  );

  const hide = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    show,
    success,
    error,
    warning,
    info,
    hide,
    clear,
  };
}
