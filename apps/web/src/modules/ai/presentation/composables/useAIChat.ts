/**
 * Full streaming chat composable migrated from legacy ai-chat module.
 */
import { ref, computed } from 'vue';
import type { ChatMessage, SendOptions } from '../types/chat';
import { AuthManager } from '@/shared/api/core/interceptors';

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
      // Use AuthManager for consistent authentication (same as other modules)
      const authHeader = AuthManager.getAuthorizationHeader();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for refresh token
        body: JSON.stringify({ 
          message: content, 
          conversationUuid: opts.conversationUuid 
        }),
        signal: abortController.value.signal,
      });

      // Handle 401 - token expired, trigger refresh
      if (response.status === 401) {
        // Dispatch event to trigger token refresh
        window.dispatchEvent(new CustomEvent('auth:session-expired', {
          detail: { message: '会话已过期，请重新登录', reason: 'token-expired' }
        }));
        throw new Error('认证已过期，请重新登录后重试');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Readable stream not available');

      let buffered = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffered += new TextDecoder().decode(value);
        const lastBreak = buffered.lastIndexOf('\n\n');
        
        if (lastBreak !== -1) {
          const processPart = buffered.slice(0, lastBreak + 2);
          buffered = buffered.slice(lastBreak + 2);
          
          for (const pkt of parseSSEChunk(processPart)) {
            switch (pkt.event) {
              case 'chunk':
                if (pkt.data.content) {
                  updateAssistantContent(assistantId, pkt.data.content);
                }
                break;
              case 'error':
                markAssistantError(assistantId, pkt.data.error || 'Stream error');
                break;
              case 'complete':
                markAssistantDone(assistantId);
                break;
            }
          }
        }
      }
      
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
