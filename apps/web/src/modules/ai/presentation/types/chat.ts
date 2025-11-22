export type ChatRole = 'user' | 'assistant';
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  error?: string;
  truncated?: boolean;
}
export interface SendOptions {
  conversationUuid?: string;
  systemPrompt?: string;
}
