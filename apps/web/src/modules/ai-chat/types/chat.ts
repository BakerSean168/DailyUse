export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  isStreaming?: boolean;
  error?: string;
  truncated?: boolean;
  createdAt: number;
}

export interface StreamState {
  isStreaming: boolean;
  abortController: AbortController | null;
  conversationUuid?: string;
}

export interface SendOptions {
  conversationUuid?: string;
  systemPrompt?: string;
}
