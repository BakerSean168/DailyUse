import { describe, it, expect, vi } from 'vitest';
import { useAIChat } from '../composables/useAIChat';

function createStream(chunks: string[], delay = 0) {
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(new TextEncoder().encode(chunks[index++]));
      } else {
        controller.close();
      }
    },
  });
}

describe('useAIChat streaming logic', () => {
  it('accumulates chunk events into assistant message', async () => {
    const { sendMessage, messages } = useAIChat();
    const sseChunks = [
      'event:chunk\ndata:{"content":"Hello"}\n\n',
      'event:chunk\ndata:{"content":" World"}\n\n',
      'event:complete\ndata:{"finishReason":"stop"}\n\n',
    ];

    // Mock fetch
    // @ts-expect-error override
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: createStream(sseChunks),
    });

    await sendMessage('Hello');

    // Wait microtasks
    await Promise.resolve();
    await Promise.resolve();

    const assistant = messages.value.find((m) => m.role === 'assistant');
    expect(assistant).toBeTruthy();
    expect(assistant!.content).toBe('Hello World');
    expect(assistant!.isStreaming).toBe(false);
    expect(assistant!.truncated).toBeFalsy();
  });

  it('abort marks message truncated', async () => {
    const { sendMessage, messages, abort } = useAIChat();
    const sseChunks = [
      'event:chunk\ndata:{"content":"Hello"}\n\n',
      'event:chunk\ndata:{"content":" World"}\n\n',
    ];

    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: createStream(sseChunks) });

    await sendMessage('Test');
    abort();

    const assistant = messages.value.find((m) => m.role === 'assistant');
    expect(assistant).toBeTruthy();
    expect(assistant!.truncated).toBe(true);
  });
});
