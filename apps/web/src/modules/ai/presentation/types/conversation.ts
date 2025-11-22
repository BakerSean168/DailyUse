export interface Conversation {
  conversationUuid: string;
  accountUuid: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
  lastMessagePreview?: string;
}
export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}
export type DateGroup = 'today' | 'yesterday' | 'week' | 'month' | 'older';
