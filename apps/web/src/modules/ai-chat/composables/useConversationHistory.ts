import { ref, computed } from 'vue';
import type { Conversation, ConversationGroup, DateGroup } from '../types/conversation';
import { api } from '@/shared/api/instances';

const conversations = ref<Conversation[]>([]);
const activeConversationUuid = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

/**
 * Group conversations by date
 */
function groupByDate(convs: Conversation[]): ConversationGroup[] {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const groups: Record<DateGroup, Conversation[]> = {
    today: [],
    yesterday: [],
    week: [],
    month: [],
    older: [],
  };

  convs.forEach((conv) => {
    const age = now - conv.updatedAt;
    if (age < oneDayMs) {
      groups.today.push(conv);
    } else if (age < 2 * oneDayMs) {
      groups.yesterday.push(conv);
    } else if (age < 7 * oneDayMs) {
      groups.week.push(conv);
    } else if (age < 30 * oneDayMs) {
      groups.month.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  const result: ConversationGroup[] = [];
  const labels: Record<DateGroup, string> = {
    today: '今天',
    yesterday: '昨天',
    week: '过去 7 天',
    month: '过去 30 天',
    older: '更早',
  };

  (Object.keys(groups) as DateGroup[]).forEach((key) => {
    if (groups[key].length > 0) {
      result.push({ label: labels[key], conversations: groups[key] });
    }
  });

  return result;
}

export function useConversationHistory() {
  const groupedConversations = computed(() => groupByDate(conversations.value));

  async function fetchConversations(page = 1, limit = 50) {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await api.get<{
        conversations: Array<{
          conversationUuid: string;
          accountUuid: string;
          title: string | null;
          status: string;
          messageCount: number;
          lastMessageAt?: number;
          createdAt: number;
          updatedAt: number;
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>('/ai/conversations', { params: { page, limit } });

      // Transform backend DTO to frontend Conversation type
      conversations.value = data.conversations.map((conv) => ({
        conversationUuid: conv.conversationUuid,
        accountUuid: conv.accountUuid,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.lastMessageAt || conv.updatedAt,
        messageCount: conv.messageCount,
        lastMessagePreview: `${conv.messageCount} messages`,
      }));
    } catch (e: any) {
      error.value = e.message || 'Failed to load conversations';
      console.error('fetchConversations error:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function selectConversation(uuid: string) {
    activeConversationUuid.value = uuid;
  }

  function createNewConversation() {
    activeConversationUuid.value = null;
  }

  function reset() {
    conversations.value = [];
    activeConversationUuid.value = null;
    isLoading.value = false;
    error.value = null;
  }

  async function deleteConversation(uuid: string) {
    try {
      await api.delete<{ deleted: boolean; conversationUuid: string }>(`/ai/conversations/${uuid}`);
      // Optimistic update
      conversations.value = conversations.value.filter((c) => c.conversationUuid !== uuid);
      if (activeConversationUuid.value === uuid) {
        activeConversationUuid.value = null;
      }
    } catch (e: any) {
      error.value = e.message || 'Delete failed';
      throw e;
    }
  }

  return {
    conversations: computed(() => conversations.value),
    groupedConversations,
    activeConversationUuid: computed(() => activeConversationUuid.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    reset,
  };
}
