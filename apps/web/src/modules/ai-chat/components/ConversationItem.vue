<template>
  <div class="conversation-item" :class="{ active: isActive }" @click="$emit('select', conversation.conversationUuid)">
    <div class="item-content">
      <div class="item-title">{{ displayTitle }}</div>
      <div class="item-preview">{{ conversation.lastMessagePreview || '...' }}</div>
      <div class="item-time">{{ formattedTime }}</div>
    </div>
    <button class="delete-btn" @click.stop="$emit('delete', conversation.conversationUuid)" title="删除">
      <span>×</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Conversation } from '../types/conversation';

interface Props {
  conversation: Conversation;
  isActive: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'select', uuid: string): void;
  (e: 'delete', uuid: string): void;
}>();

const displayTitle = computed(() => {
  return props.conversation.title || 'New Chat';
});

const formattedTime = computed(() => {
  const date = new Date(props.conversation.updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
});
</script>

<style scoped>
.conversation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  background: transparent;
  position: relative;
}

.conversation-item:hover {
  background: linear-gradient(90deg, rgba(74, 108, 247, 0.08) 0%, rgba(74, 108, 247, 0.04) 100%);
}

.conversation-item.active {
  background: linear-gradient(90deg, rgba(74, 108, 247, 0.15) 0%, rgba(74, 108, 247, 0.08) 100%);
  border-left: 3px solid #4a6cf7;
  padding-left: 13px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d2e;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-preview {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: 11px;
  color: #999;
}

.delete-btn {
  opacity: 0;
  background: rgba(217, 48, 37, 0.1);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(217, 48, 37, 0.2);
  transform: scale(1.1);
}

.delete-btn span {
  font-size: 18px;
  color: #d93025;
  line-height: 1;
}
</style>
