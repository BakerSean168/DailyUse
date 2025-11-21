<template>
  <div class="chat-window">
    <header class="chat-header">
      <h3>AI Chat</h3>
      <div class="status" v-if="isStreaming">Streaming...</div>
    </header>
    <div ref="scrollRef" class="chat-messages" @scroll="onUserScroll">
      <AIChatMessage
        v-for="m in messages"
        :key="m.id"
        :message="m"
      />
    </div>
    <AIChatInput
      :disabled="isStreaming"
      :isStreaming="isStreaming"
      @send="handleSend"
      @stop="abort"
    />
    <div v-if="error" class="error-banner">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useAIChat } from '../composables/useAIChat';
import AIChatMessage from './AIChatMessage.vue';
import AIChatInput from './AIChatInput.vue';

const { messages, isStreaming, error, sendMessage, abort } = useAIChat();

const scrollRef = ref<HTMLDivElement | null>(null);
const autoScrollEnabled = ref(true);

function onUserScroll() {
  const el = scrollRef.value;
  if (!el) return;
  const threshold = 80; // px from bottom to keep auto-scroll
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
  autoScrollEnabled.value = distanceFromBottom < threshold;
}

function scrollToBottom() {
  if (!autoScrollEnabled.value) return;
  const el = scrollRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

watch(messages, async () => {
  await nextTick();
  scrollToBottom();
}, { deep: true });

function handleSend(content: string) {
  sendMessage(content);
}
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: 560px;
  border: 1px solid #d8d9dd;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 8px;
  border-bottom: 1px solid #eceef2;
  margin-bottom: 8px;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-right: 4px;
}
.error-banner {
  margin-top: 8px;
  background: #ffe5e1;
  color: #b3261e;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
}
.status { font-size: 12px; color: #666; }
</style>
