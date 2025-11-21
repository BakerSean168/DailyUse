<template>
    <div class="chat-window">
        <header class="chat-header">
            <h3>AI Chat</h3>
            <div class="status" v-if="isStreaming">Streaming...</div>
        </header>
        <div ref="scrollRef" class="chat-messages" @scroll="onUserScroll">
            <AIChatMessage v-for="m in messages" :key="m.id" :message="m" />
        </div>
        <AIChatInput :disabled="isStreaming" :isStreaming="isStreaming" @send="handleSend" @stop="abort" />
        <div v-if="error" class="error-banner">{{ error }}</div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useAIChat } from '../composables/useAIChat';
import AIChatMessage from './AIChatMessage.vue';
import AIChatInput from './AIChatInput.vue';
import { api } from '@/shared/api/instances';

interface Props {
    conversationUuid?: string | null;
}

const props = defineProps<Props>();

const { messages, isStreaming, error, sendMessage, abort } = useAIChat();

const scrollRef = ref<HTMLDivElement | null>(null);
const autoScrollEnabled = ref(true);
const isLoadingHistory = ref(false);

// Watch for conversation changes and load history
watch(() => props.conversationUuid, async (newUuid) => {
    if (newUuid) {
        // Load conversation messages from API
        isLoadingHistory.value = true;
        try {
            const data = await api.get<{
                conversationUuid: string;
                title: string;
                messages: Array<{
                    messageUuid: string;
                    role: 'user' | 'assistant' | 'system';
                    content: string;
                    createdAt: number;
                }>;
            }>(`/ai/conversations/${newUuid}`);

            // Transform backend messages to frontend format (filter out system messages)
            messages.value = data.messages
                .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
                .map((msg) => ({
                    id: msg.messageUuid,
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    createdAt: msg.createdAt,
                }));

            await nextTick();
            scrollToBottom();
        } catch (e: any) {
            console.error('Failed to load conversation history:', e);
            error.value = e.message || 'Failed to load conversation history';
        } finally {
            isLoadingHistory.value = false;
        }
    } else {
        // New conversation - clear messages
        messages.value = [];
    }
});

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

// Allow external injection of a prompt (e.g. from AI orb actions)
function handleInject(e: CustomEvent) {
    const content = e.detail?.content;
    if (typeof content === 'string' && content.trim()) {
        sendMessage(content.trim());
    }
}

onMounted(() => {
    window.addEventListener('ai-chat:inject', handleInject as EventListener);
});
onUnmounted(() => {
    window.removeEventListener('ai-chat:inject', handleInject as EventListener);
});
</script>

<style scoped>
.chat-window {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: transparent;
    padding: 0;
}

.chat-header {
    display: none;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 12px;
    scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.02);
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
    background: rgba(74, 108, 247, 0.3);
    border-radius: 3px;
    transition: background 0.2s;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 108, 247, 0.5);
}

.error-banner {
    margin: 0 20px 12px;
    background: linear-gradient(135deg, #ffe5e1 0%, #ffd7d2 100%);
    color: #b3261e;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    border: 1px solid rgba(179, 38, 30, 0.1);
    box-shadow: 0 2px 8px rgba(179, 38, 30, 0.08);
}

.status {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.15);
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 500;
    letter-spacing: 0.3px;
}
</style>
