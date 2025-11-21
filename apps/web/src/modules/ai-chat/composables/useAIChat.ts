/**
 * useAIChat composable
 * Streaming chat UI logic (Story 3.3)
 */
import { ref, computed } from 'vue';
import { ChatMessage, SendOptions } from '../types/chat';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('useAIChat');

interface SSEEventPayload {
  content?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  error?: string;
  finishReason?: string;
}

interface SSEParsedEvent {
  event: string;
  data: SSEEventPayload;
}

function parseSSEChunk(buffer: string): SSEParsedEvent[] {
  const events: SSEParsedEvent[] = [];
  const rawEvents = buffer.split('\n\n');
  for (const raw of rawEvents) {
    if (!raw.trim()) continue;
    const lines = raw.split('\n');
    let eventType = 'message';
    let dataLine = '';
    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.replace('event:', '').trim();
      } else if (line.startsWith('data:')) {
        dataLine = line.replace('data:', '').trim();
      }
    }
    if (dataLine) {
      try {
        const parsed: SSEEventPayload = JSON.parse(dataLine);
        events.push({ event: eventType, data: parsed });
      } catch (err) {
        logger.warn('Failed to parse SSE data line', { dataLine });
      }
    }
  }
  return events;
}

export function useAIChat() {
  const messages = ref<ChatMessage[]>([]);
  const isStreaming = ref(false);
  const error = ref<string | null>(null);
  const abortController = ref<AbortController | null>(null);
  const conversationUuid = ref<string | undefined>(undefined);

  const hasMessages = computed(() => messages.value.length > 0);

  function reset() {
    messages.value = [];
    error.value = null;
    isStreaming.value = false;
    abortController.value = null;
  }

  function appendMessage(msg: ChatMessage) {
    messages.value.push(msg);
  }

  function updateAssistantContent(id: string, chunk: string) {
    const target = messages.value.find((m) => m.id === id);
    if (target) target.content += chunk;
  }

  function markAssistantDone(id: string) {
    const target = messages.value.find((m) => m.id === id);
    if (target) target.isStreaming = false;
  }

  function classifyError(raw: string): string {
    if (/quota/i.test(raw)) return 'Quota exceeded. Please try later.';
    if (/abort/i.test(raw)) return 'Generation stopped.';
    if (/network|fetch|stream/i.test(raw)) return 'Network issue. Check connection.';
    return raw;
  }

  function markAssistantError(id: string, errMsg: string) {
    const target = messages.value.find((m) => m.id === id);
    if (target) {
      target.isStreaming = false;
      target.error = classifyError(errMsg);
    }
  }

  async function sendMessage(content: string, opts: SendOptions = {}) {
    if (!content.trim()) return;
    if (isStreaming.value) return; // block while streaming (initial approach)
    error.value = null;

    logger.info('Sending user message', { contentLength: content.length });

    const user: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    appendMessage(user);

    const assistantId = crypto.randomUUID();
    const assistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: Date.now(),
    };
    appendMessage(assistant);

    isStreaming.value = true;
    abortController.value = new AbortController();

    try {
      // POST SSE endpoint (cannot use EventSource for POST body) -> use fetch streaming.
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content, conversationUuid: opts.conversationUuid }),
        signal: abortController.value.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not available');
      }

      let buffered = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = new TextDecoder().decode(value);
        buffered += chunkText;

        // Process complete events in buffer while keeping incomplete tail
        const lastDoubleBreak = buffered.lastIndexOf('\n\n');
        if (lastDoubleBreak !== -1) {
          const processPart = buffered.slice(0, lastDoubleBreak + 2);
          const remaining = buffered.slice(lastDoubleBreak + 2);
          const events = parseSSEChunk(processPart);
          for (const evt of events) {
            switch (evt.event) {
              case 'chunk':
                if (evt.data.content) updateAssistantContent(assistantId, evt.data.content);
                break;
              case 'error':
                markAssistantError(assistantId, evt.data.error || 'Stream error');
                break;
              case 'complete':
                // Final payload may contain usage or final content fallback
                markAssistantDone(assistantId);
                break;
            }
          }
          buffered = remaining;
        }
      }

      // After stream end ensure final completion state
      markAssistantDone(assistantId);
      isStreaming.value = false;
      abortController.value = null;
      conversationUuid.value = opts.conversationUuid; // could be updated from server later
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown streaming error';
      error.value = msg;
      markAssistantError(assistantId, msg);
      isStreaming.value = false;
      abortController.value = null;
      logger.error('Streaming failed', { error: msg });
    }
  }

  function abort() {
    if (!abortController.value || !isStreaming.value) return;
    logger.info('Aborting stream');
    abortController.value.abort();
    isStreaming.value = false;
    const lastAssistant = [...messages.value]
      .reverse()
      .find((m) => m.role === 'assistant' && m.isStreaming);
    if (lastAssistant) {
      lastAssistant.isStreaming = false;
      lastAssistant.truncated = true;
    }
  }

  return {
    messages,
    isStreaming,
    error,
    hasMessages,
    sendMessage,
    abort,
    reset,
  };
}
