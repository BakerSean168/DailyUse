/**
 * Full streaming chat composable migrated from legacy ai-chat module.
 */
import { ref, computed } from 'vue';
import type { ChatMessage, SendOptions } from '../types/chat';
import { httpAiConversationRepository } from '@dailyuse/domain-client';

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
        // swallow parse errors; continue stream
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
    if (isStreaming.value) return; // prevent overlapping streams
    error.value = null;

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
      await httpAiConversationRepository.streamChat(
        { message: content, conversationUuid: opts.conversationUuid },
        (evt) => {
          switch (evt.type) {
            case 'chunk':
              updateAssistantContent(assistantId, evt.content);
              break;
            case 'error':
              markAssistantError(assistantId, evt.error);
              break;
            case 'complete':
              markAssistantDone(assistantId);
              break;
          }
        },
      );
      markAssistantDone(assistantId);
      isStreaming.value = false;
      abortController.value = null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown streaming error';
      error.value = msg;
      markAssistantError(assistantId, msg);
      isStreaming.value = false;
      abortController.value = null;
    }
  }

  function abort() {
    if (!abortController.value || !isStreaming.value) return;
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

  return { messages, isStreaming, error, hasMessages, sendMessage, abort, reset };
}
