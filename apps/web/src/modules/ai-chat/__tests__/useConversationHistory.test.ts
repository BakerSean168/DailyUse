/**
 * Unit tests for useConversationHistory composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConversationHistory } from '../composables/useConversationHistory';
import { api } from '@/shared/api/instances';

// Mock the API client
vi.mock('@/shared/api/instances', () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useConversationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchConversations', () => {
    it('should fetch and transform conversations successfully', async () => {
      const mockApiResponse = {
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Test Conversation',
            status: 'active',
            messageCount: 5,
            lastMessageAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
            createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
            updatedAt: Date.now() - 1000 * 60 * 5,
          },
          {
            conversationUuid: 'conv-2',
            accountUuid: 'acc-1',
            title: null,
            status: 'active',
            messageCount: 2,
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
            updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1,
        },
      };

      vi.mocked(api.get).mockResolvedValue(mockApiResponse);

      const { fetchConversations, conversations, isLoading, error, reset } =
        useConversationHistory();

      // Clear any previous state
      reset();

      expect(isLoading.value).toBe(false);
      expect(conversations.value).toHaveLength(0);

      await fetchConversations();

      expect(api.get).toHaveBeenCalledWith('/ai/conversations', {
        params: { page: 1, limit: 50 },
      });
      expect(isLoading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(conversations.value).toHaveLength(2);
      expect(conversations.value[0]).toMatchObject({
        conversationUuid: 'conv-1',
        accountUuid: 'acc-1',
        title: 'Test Conversation',
        messageCount: 5,
      });
      expect(conversations.value[1].title).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(mockError);

      const { fetchConversations, conversations, isLoading, error, reset } =
        useConversationHistory();

      // Clear any previous state
      reset();

      await fetchConversations();

      expect(isLoading.value).toBe(false);
      expect(error.value).toBe('Network error');
      expect(conversations.value).toHaveLength(0);
    });

    it('should support custom page and limit parameters', async () => {
      vi.mocked(api.get).mockResolvedValue({
        conversations: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
      });

      const { fetchConversations } = useConversationHistory();

      await fetchConversations(2, 20);

      expect(api.get).toHaveBeenCalledWith('/ai/conversations', {
        params: { page: 2, limit: 20 },
      });
    });
  });

  describe('groupByDate', () => {
    it('should group conversations by date correctly', async () => {
      const now = Date.now();
      const mockApiResponse = {
        conversations: [
          // Today
          {
            conversationUuid: 'conv-today',
            accountUuid: 'acc-1',
            title: 'Today Conv',
            status: 'active',
            messageCount: 1,
            createdAt: now - 1000 * 60 * 30, // 30 minutes ago
            updatedAt: now - 1000 * 60 * 30,
          },
          // Yesterday
          {
            conversationUuid: 'conv-yesterday',
            accountUuid: 'acc-1',
            title: 'Yesterday Conv',
            status: 'active',
            messageCount: 2,
            createdAt: now - 1000 * 60 * 60 * 26, // 26 hours ago
            updatedAt: now - 1000 * 60 * 60 * 26,
          },
          // Last week
          {
            conversationUuid: 'conv-week',
            accountUuid: 'acc-1',
            title: 'Week Conv',
            status: 'active',
            messageCount: 3,
            createdAt: now - 1000 * 60 * 60 * 24 * 5, // 5 days ago
            updatedAt: now - 1000 * 60 * 60 * 24 * 5,
          },
          // Last month
          {
            conversationUuid: 'conv-month',
            accountUuid: 'acc-1',
            title: 'Month Conv',
            status: 'active',
            messageCount: 4,
            createdAt: now - 1000 * 60 * 60 * 24 * 15, // 15 days ago
            updatedAt: now - 1000 * 60 * 60 * 24 * 15,
          },
          // Older
          {
            conversationUuid: 'conv-older',
            accountUuid: 'acc-1',
            title: 'Old Conv',
            status: 'active',
            messageCount: 5,
            createdAt: now - 1000 * 60 * 60 * 24 * 40, // 40 days ago
            updatedAt: now - 1000 * 60 * 60 * 24 * 40,
          },
        ],
        pagination: { page: 1, limit: 50, total: 5, totalPages: 1 },
      };

      vi.mocked(api.get).mockResolvedValue(mockApiResponse);

      const { fetchConversations, groupedConversations } = useConversationHistory();

      await fetchConversations();

      expect(groupedConversations.value).toHaveLength(5);
      expect(groupedConversations.value[0].label).toBe('今天');
      expect(groupedConversations.value[0].conversations).toHaveLength(1);
      expect(groupedConversations.value[0].conversations[0].conversationUuid).toBe('conv-today');

      expect(groupedConversations.value[1].label).toBe('昨天');
      expect(groupedConversations.value[1].conversations).toHaveLength(1);

      expect(groupedConversations.value[2].label).toBe('过去 7 天');
      expect(groupedConversations.value[3].label).toBe('过去 30 天');
      expect(groupedConversations.value[4].label).toBe('更早');
    });

    it('should only show non-empty date groups', async () => {
      const now = Date.now();
      const mockApiResponse = {
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Today 1',
            status: 'active',
            messageCount: 1,
            createdAt: now - 1000 * 60 * 10,
            updatedAt: now - 1000 * 60 * 10,
          },
          {
            conversationUuid: 'conv-2',
            accountUuid: 'acc-1',
            title: 'Today 2',
            status: 'active',
            messageCount: 2,
            createdAt: now - 1000 * 60 * 5,
            updatedAt: now - 1000 * 60 * 5,
          },
        ],
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
      };

      vi.mocked(api.get).mockResolvedValue(mockApiResponse);

      const { fetchConversations, groupedConversations } = useConversationHistory();

      await fetchConversations();

      expect(groupedConversations.value).toHaveLength(1);
      expect(groupedConversations.value[0].label).toBe('今天');
      expect(groupedConversations.value[0].conversations).toHaveLength(2);
    });
  });

  describe('selectConversation', () => {
    it('should update active conversation UUID', () => {
      const { selectConversation, activeConversationUuid } = useConversationHistory();

      expect(activeConversationUuid.value).toBeNull();

      selectConversation('conv-123');

      expect(activeConversationUuid.value).toBe('conv-123');
    });
  });

  describe('createNewConversation', () => {
    it('should clear active conversation UUID', () => {
      const { selectConversation, createNewConversation, activeConversationUuid } =
        useConversationHistory();

      selectConversation('conv-123');
      expect(activeConversationUuid.value).toBe('conv-123');

      createNewConversation();

      expect(activeConversationUuid.value).toBeNull();
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation and update state optimistically', async () => {
      const mockApiResponse = {
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Conv 1',
            status: 'active',
            messageCount: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            conversationUuid: 'conv-2',
            accountUuid: 'acc-1',
            title: 'Conv 2',
            status: 'active',
            messageCount: 2,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
      };

      vi.mocked(api.get).mockResolvedValue(mockApiResponse);
      vi.mocked(api.delete).mockResolvedValue({ deleted: true, conversationUuid: 'conv-1' });

      const { fetchConversations, deleteConversation, conversations } = useConversationHistory();

      await fetchConversations();
      expect(conversations.value).toHaveLength(2);

      await deleteConversation('conv-1');

      expect(api.delete).toHaveBeenCalledWith('/ai/conversations/conv-1');
      expect(conversations.value).toHaveLength(1);
      expect(conversations.value[0].conversationUuid).toBe('conv-2');
    });

    it('should clear active conversation if deleting active one', async () => {
      vi.mocked(api.get).mockResolvedValue({
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Conv 1',
            status: 'active',
            messageCount: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });
      vi.mocked(api.delete).mockResolvedValue({ deleted: true, conversationUuid: 'conv-1' });

      const { fetchConversations, selectConversation, deleteConversation, activeConversationUuid } =
        useConversationHistory();

      await fetchConversations();
      selectConversation('conv-1');
      expect(activeConversationUuid.value).toBe('conv-1');

      await deleteConversation('conv-1');

      expect(activeConversationUuid.value).toBeNull();
    });

    it('should handle delete errors', async () => {
      const mockError = new Error('Delete failed');
      vi.mocked(api.delete).mockRejectedValue(mockError);

      const { deleteConversation, error } = useConversationHistory();

      await expect(deleteConversation('conv-123')).rejects.toThrow('Delete failed');
      expect(error.value).toBe('Delete failed');
    });
  });
});
