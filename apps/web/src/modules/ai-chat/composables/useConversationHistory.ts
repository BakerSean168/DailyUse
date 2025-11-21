import { ref, computed } from 'vue';
import type { Conversation, ConversationGroup, DateGroup } from '../types/conversation';

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

  async function fetchConversations() {
    isLoading.value = true;
    error.value = null;
    try {
      // Mock data for now - replace with API call
      const response = await fetch('/api/ai/conversations?page=1&pageSize=50');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      conversations.value = data.conversations || [];
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

  async function deleteConversation(uuid: string) {
    try {
      const response = await fetch(`/api/ai/conversations/${uuid}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
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
  };
}
