<template>
    <div :class="wrapperClass">
        <div class="ai-chat-message" v-html="displayContent"></div>
        <div v-if="message.isStreaming" class="streaming-indicator">▌</div>
        <div v-if="message.error" class="error">{{ message.error }}</div>
        <div v-if="message.truncated" class="truncated">(stopped)</div>
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
const displayContent = computed(() => {
    if (props.message.isStreaming && !props.message.content) {
        return '<em class="thinking">AI is thinking...</em>';
    }
    return rendered.value;
});

const wrapperClass = computed(() => [
    'chat-bubble',
    props.message.role === 'user' ? 'user' : 'assistant',
]);
</script>

<style scoped>
.chat-bubble {
    max-width: 75%;
    padding: 12px 16px;
    margin: 0;
    border-radius: 16px;
    line-height: 1.6;
    position: relative;
    font-size: 14px;
    word-wrap: break-word;
    animation: slideIn 0.2s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.chat-bubble.user {
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    color: #fff;
    align-self: flex-end;
    border-radius: 16px 16px 4px 16px;
    box-shadow:
        0 2px 8px rgba(74, 108, 247, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.chat-bubble.assistant {
    background: linear-gradient(135deg, #f8f9ff 0%, #f0f2fa 100%);
    color: #1a1d2e;
    align-self: flex-start;
    border: 1px solid rgba(74, 108, 247, 0.1);
    border-radius: 16px 16px 16px 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Markdown styling inside bubbles */
.chat-bubble :deep(p) {
    margin: 0.5em 0;
}

.chat-bubble :deep(p:first-child) {
    margin-top: 0;
}

.chat-bubble :deep(p:last-child) {
    margin-bottom: 0;
}

.chat-bubble :deep(code) {
    background: rgba(0, 0, 0, 0.08);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.chat-bubble.user :deep(code) {
    background: rgba(255, 255, 255, 0.2);
}

.chat-bubble :deep(pre) {
    background: rgba(0, 0, 0, 0.05);
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
}

.chat-bubble :deep(pre code) {
    background: none;
    padding: 0;
}

.chat-bubble :deep(ul),
.chat-bubble :deep(ol) {
    margin: 8px 0;
    padding-left: 20px;
}

.chat-bubble :deep(li) {
    margin: 4px 0;
}

.streaming-indicator {
    display: inline-block;
    margin-left: 4px;
    font-size: 14px;
    opacity: 0.7;
    animation: blink 1.2s infinite;
}

@keyframes blink {

    0%,
    100% {
        opacity: 0.7;
    }

    50% {
        opacity: 0.2;
    }
}

.error {
    color: #d93025;
    font-size: 12px;
    margin-top: 6px;
    padding: 4px 8px;
    background: rgba(217, 48, 37, 0.1);
    border-radius: 6px;
    display: inline-block;
}

.truncated {
    color: #666;
    font-size: 11px;
    margin-top: 6px;
    font-style: italic;
    opacity: 0.7;
}

.thinking {
    color: #666;
    font-style: italic;
    opacity: 0.8;
}
</style>
