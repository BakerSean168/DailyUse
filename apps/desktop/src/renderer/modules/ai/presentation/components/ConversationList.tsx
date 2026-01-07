/**
 * ConversationList Component
 *
 * AI 对话历史列表
 * Story-009: AI Module UI
 */

import { memo } from 'react';
import type { AIConversation } from '@dailyuse/domain-client/ai';

interface ConversationListProps {
  conversations: AIConversation[];
  currentId?: string;
  onSelect: (uuid: string) => void;
  onDelete: (uuid: string) => void;
  onNewConversation: () => void;
}

export const ConversationList = memo(function ConversationList({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onNewConversation,
}: ConversationListProps) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <button
          onClick={onNewConversation}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <span>➕</span>
          新对话
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            暂无对话记录
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.uuid}
                className={`group flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors ${
                  currentId === conversation.uuid
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => onSelect(conversation.uuid)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>💬</span>
                    <span>{conversation.messageCount} 条消息</span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {conversation.isClosed && (
                    <span
                      className="text-xs text-muted-foreground"
                      title="已关闭"
                    >
                      🔒
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定删除此对话？')) {
                        onDelete(conversation.uuid);
                      }
                    }}
                    className="p-1 hover:bg-red-100 rounded text-red-500"
                    title="删除对话"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-center text-muted-foreground">
        共 {conversations.length} 个对话
      </div>
    </div>
  );
});

export default ConversationList;
