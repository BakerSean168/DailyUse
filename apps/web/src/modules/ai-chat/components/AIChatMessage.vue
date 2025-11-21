<template>
  <div :class="wrapperClass">
    <div class="ai-chat-message" v-html="rendered"></div>
    <div v-if="message.isStreaming" class="streaming-indicator">▌</div>
    <div v-if="message.error" class="error">{{ message.error }}</div>
    <div v-if="message.truncated" class="truncated">(stopped)</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '../markdown/renderMarkdown';
import type { ChatMessage } from '../types/chat';

interface Props { message: ChatMessage }
const props = defineProps<Props>();

const rendered = computed(() => renderMarkdown(props.message.content));

const wrapperClass = computed(() => [
  'chat-bubble',
  props.message.role === 'user' ? 'user' : 'assistant',
]);
</script>

<style scoped>
.chat-bubble {
  max-width: 680px;
  padding: 10px 14px;
  margin: 4px 0;
  border-radius: 12px;
  line-height: 1.5;
  position: relative;
  font-size: 14px;
}
.chat-bubble.user {
  background: var(--chat-user-bg, #4a6cf7);
  color: #fff;
  align-self: flex-end;
}
.chat-bubble.assistant {
  background: var(--chat-assistant-bg, #f5f6fa);
  color: #222;
  align-self: flex-start;
  border: 1px solid #e1e2e6;
}
.streaming-indicator {
  position: absolute;
  bottom: 6px;
  right: 10px;
  font-size: 12px;
  opacity: 0.6;
}
.error {
  color: #d93025;
  font-size: 12px;
  margin-top: 4px;
}
.truncated {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}
</style>
