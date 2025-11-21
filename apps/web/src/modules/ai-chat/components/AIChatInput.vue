<template>
  <div class="chat-input-wrapper">
    <textarea
      ref="textareaRef"
      v-model="draft"
      class="chat-input"
      :placeholder="placeholder"
      :disabled="disabled"
      @keydown.enter.prevent="handleEnter"
      @input="autoGrow"
    />
    <div class="actions">
      <button class="send-btn" :disabled="disabled || !draft.trim()" @click="emitSend">Send</button>
      <button v-if="isStreaming" class="stop-btn" @click="$emit('stop')">Stop</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

interface Props {
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isStreaming: false,
  placeholder: 'Ask me anything...',
  autoFocus: true,
});

const emit = defineEmits<{ (e: 'send', value: string): void; (e: 'stop'): void }>();
const draft = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function emitSend() {
  const value = draft.value.trim();
  if (!value) return;
  emit('send', value);
  draft.value = '';
  autoGrow();
}

function handleEnter(e: KeyboardEvent) {
  if (e.shiftKey) {
    // allow newline
    draft.value += '\n';
    autoGrow();
  } else {
    emitSend();
  }
}

function autoGrow() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 240) + 'px';
}

watch(() => draft.value, autoGrow);

onMounted(() => {
  if (props.autoFocus && textareaRef.value) {
    textareaRef.value.focus();
    autoGrow();
  }
});
</script>

<style scoped>
.chat-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chat-input {
  width: 100%;
  resize: none;
  padding: 10px 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #d0d3d9;
  background: #fff;
  line-height: 1.4;
}
.actions {
  display: flex;
  gap: 8px;
}
.send-btn, .stop-btn {
  cursor: pointer;
  border: none;
  padding: 8px 14px;
  font-size: 14px;
  border-radius: 6px;
}
.send-btn {
  background: #4a6cf7;
  color: #fff;
}
.send-btn:disabled { background: #9ba8d0; cursor: not-allowed; }
.stop-btn { background: #ffb347; color: #222; }
</style>
