import type { AIConversation } from '../aggregates/AIConversation';
import type { AIContracts } from '@dailyuse/contracts';

export interface StreamEventChunk {
  type: 'chunk';
  content: string;
}
export interface StreamEventError {
  type: 'error';
  error: string;
}
export interface StreamEventComplete {
  type: 'complete';
}
export type StreamEvent = StreamEventChunk | StreamEventError | StreamEventComplete;

export interface AiConversationRepository {
  listConversations(params?: { page?: number; limit?: number }): Promise<AIConversation[]>;
  getConversation(conversationUuid: string): Promise<AIConversation>;
  streamChat(
    params: { message: string; conversationUuid?: string },
    onEvent: (evt: StreamEvent) => void,
  ): Promise<{ conversationUuid?: string }>; // returns final metadata
  deleteConversation(conversationUuid: string): Promise<void>;
}
