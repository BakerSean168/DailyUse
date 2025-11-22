<template>
	<div class="chat-window">
		<header class="chat-header" aria-label="Chat header">
			<h3 class="visually-hidden">AI Chat Conversation</h3>
			<div class="status" v-if="isStreaming" aria-live="polite">Streaming...</div>
		</header>
		<div ref="scrollRef" class="chat-messages" @scroll="onUserScroll" role="log" aria-live="polite" aria-relevant="additions">
			<AIChatMessage v-for="m in messages" :key="m.id" :message="m" />
		</div>
		<AIChatInput :disabled="isStreaming" :isStreaming="isStreaming" @send="handleSend" @stop="abort" />
		<div v-if="error" class="error-banner" role="alert">{{ error }}</div>
	</div>
</template>
<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useAIChat } from '../../composables/useAIChat';
import AIChatMessage from './AIChatMessage.vue';
import AIChatInput from './AIChatInput.vue';
import { api } from '@/shared/api/instances';

interface Props { conversationUuid?: string | null }
const props = defineProps<Props>();

const { messages, isStreaming, error, sendMessage, abort } = useAIChat();
const scrollRef = ref<HTMLDivElement | null>(null);
const autoScrollEnabled = ref(true);
const isLoadingHistory = ref(false);

watch(() => props.conversationUuid, async (newUuid) => {
	if (newUuid) {
		isLoadingHistory.value = true;
		try {
			const data = await api.get<{ conversationUuid: string; title: string; messages: Array<{ messageUuid: string; role: 'user' | 'assistant' | 'system'; content: string; createdAt: number; }> }>(`/ai/conversations/${newUuid}`);
			messages.value = data.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ id: m.messageUuid, role: m.role as 'user' | 'assistant', content: m.content, createdAt: m.createdAt }));
			await nextTick();
			scrollToBottom();
		} catch (e: any) {
			error.value = e.message || 'Failed to load conversation history';
		} finally {
			isLoadingHistory.value = false;
		}
	} else {
		messages.value = [];
	}
});

function onUserScroll() {
	const el = scrollRef.value; if (!el) return;
	const threshold = 80;
	const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
	autoScrollEnabled.value = distance < threshold;
}

function scrollToBottom() {
	if (!autoScrollEnabled.value) return;
	const el = scrollRef.value; if (!el) return;
	el.scrollTop = el.scrollHeight;
}

async function handleSend(content: string) {
	await sendMessage(content, { conversationUuid: props.conversationUuid || undefined });
	await nextTick();
	scrollToBottom();
}

function handleInject(e: CustomEvent) {
	const content = e.detail?.content;
	if (typeof content === 'string' && content.trim()) {
		handleSend(content.trim());
	}
}

onMounted(() => {
	scrollToBottom();
	window.addEventListener('ai-chat:inject', handleInject as EventListener);
});
onUnmounted(() => {
	window.removeEventListener('ai-chat:inject', handleInject as EventListener);
});
</script>
<style scoped>
.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
.chat-window { display:flex; flex-direction:column; height:100%; }
.chat-header { display:flex; align-items:center; justify-content:space-between; padding:.5rem 1rem; border-bottom:1px solid #ddd; }
.chat-messages { flex:1; overflow-y:auto; padding:1rem; }
.chat-messages::-webkit-scrollbar { width:6px; }
.chat-messages::-webkit-scrollbar-track { background:rgba(0,0,0,0.02); }
.chat-messages::-webkit-scrollbar-thumb { background:rgba(74,108,247,0.3); border-radius:3px; }
.chat-messages::-webkit-scrollbar-thumb:hover { background:rgba(74,108,247,0.5); }
.error-banner { background:#ffebee; color:#c62828; padding:.5rem 1rem; font-size:.875rem; }
.status { font-size:11px; color:#555; }
</style>