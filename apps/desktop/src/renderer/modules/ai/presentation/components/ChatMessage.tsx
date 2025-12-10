/**
 * ChatMessage Component
 *
 * AI 对话消息气泡
 * Story-009: AI Module UI
 */

import { memo } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : isSystem
              ? 'bg-muted text-muted-foreground italic'
              : 'bg-muted'
        }`}
      >
        {/* Role indicator for assistant */}
        {!isUser && !isSystem && (
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <span>🤖</span>
            <span>AI 助手</span>
          </div>
        )}

        {/* Message content */}
        <div className="whitespace-pre-wrap break-words">
          {content || (isStreaming ? '...' : '')}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {new Date(timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
