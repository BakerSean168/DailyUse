import { describe, it, expect } from 'vitest';
import { useAIChat } from '../composables/useAIChat';

// Basic test to ensure composable initializes correctly

describe('useAIChat', () => {
  it('initial state', () => {
    const { messages, isStreaming, error } = useAIChat();
    expect(messages.value.length).toBe(0);
    expect(isStreaming.value).toBe(false);
    expect(error.value).toBeNull();
  });
});
