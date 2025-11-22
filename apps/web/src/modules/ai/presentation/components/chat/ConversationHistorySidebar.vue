<template>
    <div class="conversation-history-sidebar" :class="{ open: isOpen }" aria-label="对话历史侧栏">
        <div class="sidebar-header">
            <h3>对话历史</h3>
            <button class="close-btn" @click="$emit('close')" aria-label="关闭">×</button>
        </div>
        <div class="sidebar-actions">
            <button class="new-chat-btn" @click="handleNewChat">
                <span class="icon">+</span><span>新建对话</span>
            </button>
        </div>
        <div class="sidebar-content" role="list">
            <div v-if="isLoading" class="loading-state"><span class="spinner">⏳</span>
                <p>加载中...</p>
            </div>
            <div v-else-if="error" class="error-state">
                <p>{{ error }}</p><button @click="() => fetchConversations()">重试</button>
            </div>
            <div v-else-if="groupedConversations.length === 0" class="empty-state">
                <p>暂无对话历史</p>
            </div>
            <div v-else class="conversation-groups">
                <div v-for="group in groupedConversations" :key="group.label" class="group">
                    <div class="group-label">{{ group.label }}</div>
                    <ConversationItem v-for="conv in group.conversations" :key="conv.conversationUuid"
                        :conversation="conv" :isActive="conv.conversationUuid === activeConversationUuid"
                        @select="handleSelect" @delete="handleDelete" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import { useConversationHistory } from '../../composables/useConversationHistory';
import ConversationItem from './ConversationItem.vue';
interface Props { isOpen: boolean }
defineProps<Props>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'conversation-selected', uuid: string | null): void }>();
const { groupedConversations, activeConversationUuid, isLoading, error, fetchConversations, selectConversation, createNewConversation, deleteConversation } = useConversationHistory();
onMounted(() => { fetchConversations(); });
function handleSelect(uuid: string) { selectConversation(uuid); emit('conversation-selected', uuid); }
function handleNewChat() { createNewConversation(); emit('conversation-selected', null); }
async function handleDelete(uuid: string) { if (!confirm('确定删除此对话？')) return; try { await deleteConversation(uuid); } catch (e) { console.error('Delete failed:', e); } }
</script>
<style scoped>
.conversation-history-sidebar {
    position: fixed;
    top: 0;
    left: -320px;
    width: 300px;
    height: 100vh;
    background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
    border-right: 1px solid rgba(208, 211, 217, .6);
    box-shadow: 4px 0 16px rgba(0, 0, 0, .08);
    display: flex;
    flex-direction: column;
    z-index: 1300;
    transition: left .3s cubic-bezier(.34, 1.56, .64, 1);
}

.conversation-history-sidebar.open {
    left: 0;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    color: #fff;
    box-shadow: 0 2px 8px rgba(74, 108, 247, .15);
}

.sidebar-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: .3px;
}

.close-btn {
    background: rgba(255, 255, 255, .15);
    border: none;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 6px;
    color: #fff;
    transition: all .2s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, .25);
    transform: scale(1.05);
}

.sidebar-actions {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(225, 226, 230, .5);
}

.new-chat-btn {
    width: 100%;
    background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
    color: #fff;
    border: none;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all .2s ease;
    box-shadow: 0 2px 8px rgba(74, 108, 247, .3), inset 0 1px 0 rgba(255, 255, 255, .2);
}

.new-chat-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 108, 247, .4), inset 0 1px 0 rgba(255, 255, 255, .3);
}

.new-chat-btn .icon {
    font-size: 20px;
    line-height: 1;
}

.sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
}

.sidebar-content::-webkit-scrollbar {
    width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, .02);
    border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb {
    background: rgba(74, 108, 247, .3);
    border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 108, 247, .5);
}

.loading-state,
.error-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: #666;
}

.spinner {
    font-size: 32px;
    margin-bottom: 12px;
    animation: spin 2s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.error-state button {
    margin-top: 12px;
    padding: 8px 16px;
    background: #4a6cf7;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
}

.conversation-groups {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.group {
    display: flex;
    flex-direction: column;
}

.group-label {
    font-size: 11px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: 8px;
    padding-left: 4px;
}

@media (prefers-color-scheme: dark) {
    .conversation-history-sidebar {
        background: linear-gradient(135deg, #1a1d2e 0%, #252936 100%);
        border-color: rgba(255, 255, 255, .08);
    }
}
</style>
