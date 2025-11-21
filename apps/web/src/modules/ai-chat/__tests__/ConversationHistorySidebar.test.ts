/**
 * Unit tests for ConversationHistorySidebar component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ConversationHistorySidebar from '../components/ConversationHistorySidebar.vue';
import ConversationItem from '../components/ConversationItem.vue';
import { useConversationHistory } from '../composables/useConversationHistory';

// Mock the composable
vi.mock('../composables/useConversationHistory', () => ({
  useConversationHistory: vi.fn(),
}));

describe('ConversationHistorySidebar', () => {
  const mockFetchConversations = vi.fn();
  const mockSelectConversation = vi.fn();
  const mockCreateNewConversation = vi.fn();
  const mockDeleteConversation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: true },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    expect(wrapper.find('.loading-state').exists()).toBe(true);
    expect(wrapper.find('.loading-state').text()).toContain('加载中...');
  });

  it('should render error state with retry button', async () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: 'Failed to load conversations' },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    expect(wrapper.find('.error-state').exists()).toBe(true);
    expect(wrapper.find('.error-state').text()).toContain('Failed to load conversations');

    const retryButton = wrapper.find('.error-state button');
    expect(retryButton.exists()).toBe(true);

    await retryButton.trigger('click');
    expect(mockFetchConversations).toHaveBeenCalledOnce();
  });

  it('should render empty state when no conversations', () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toContain('暂无对话历史');
  });

  it('should render conversation groups', () => {
    const mockGroups = [
      {
        label: '今天',
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Test 1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 3,
            lastMessagePreview: '3 messages',
          },
          {
            conversationUuid: 'conv-2',
            accountUuid: 'acc-1',
            title: 'Test 2',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 5,
            lastMessagePreview: '5 messages',
          },
        ],
      },
      {
        label: '昨天',
        conversations: [
          {
            conversationUuid: 'conv-3',
            accountUuid: 'acc-1',
            title: 'Test 3',
            createdAt: Date.now() - 1000 * 60 * 60 * 24,
            updatedAt: Date.now() - 1000 * 60 * 60 * 24,
            messageCount: 2,
            lastMessagePreview: '2 messages',
          },
        ],
      },
    ];

    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: mockGroups },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
      global: {
        components: { ConversationItem },
      },
    });

    const groups = wrapper.findAll('.group');
    expect(groups).toHaveLength(2);

    expect(groups[0].find('.group-label').text()).toBe('今天');
    expect(groups[1].find('.group-label').text()).toBe('昨天');

    const items = wrapper.findAllComponents(ConversationItem);
    expect(items).toHaveLength(3);
  });

  it('should pass active state to conversation items', () => {
    const mockGroups = [
      {
        label: '今天',
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Test 1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 3,
            lastMessagePreview: '3 messages',
          },
          {
            conversationUuid: 'conv-2',
            accountUuid: 'acc-1',
            title: 'Test 2',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 5,
            lastMessagePreview: '5 messages',
          },
        ],
      },
    ];

    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: mockGroups },
      activeConversationUuid: { value: 'conv-1' },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
      global: {
        components: { ConversationItem },
      },
    });

    const items = wrapper.findAllComponents(ConversationItem);
    expect(items[0].props('isActive')).toBe(true);
    expect(items[1].props('isActive')).toBe(false);
  });

  it('should emit close when close button clicked', async () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    await wrapper.find('.close-btn').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('should handle new chat button click', async () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    await wrapper.find('.new-chat-btn').trigger('click');

    expect(mockCreateNewConversation).toHaveBeenCalledOnce();
    expect(wrapper.emitted('conversation-selected')).toBeTruthy();
    expect(wrapper.emitted('conversation-selected')?.[0]).toEqual([null]);
  });

  it('should handle conversation selection', async () => {
    const mockGroups = [
      {
        label: '今天',
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Test 1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 3,
            lastMessagePreview: '3 messages',
          },
        ],
      },
    ];

    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: mockGroups },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
      global: {
        components: { ConversationItem },
      },
    });

    const item = wrapper.findComponent(ConversationItem);
    await item.vm.$emit('select', 'conv-1');

    expect(mockSelectConversation).toHaveBeenCalledWith('conv-1');
    expect(wrapper.emitted('conversation-selected')).toBeTruthy();
    expect(wrapper.emitted('conversation-selected')?.[0]).toEqual(['conv-1']);
  });

  it('should handle conversation deletion', async () => {
    const mockGroups = [
      {
        label: '今天',
        conversations: [
          {
            conversationUuid: 'conv-1',
            accountUuid: 'acc-1',
            title: 'Test 1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 3,
            lastMessagePreview: '3 messages',
          },
        ],
      },
    ];

    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: mockGroups },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
      global: {
        components: { ConversationItem },
      },
    });

    const item = wrapper.findComponent(ConversationItem);
    await item.vm.$emit('delete', 'conv-1');

    expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1');
  });

  it('should fetch conversations on mount', async () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    await flushPromises();

    expect(mockFetchConversations).toHaveBeenCalledOnce();
  });

  it('should apply slide-in animation when visible', () => {
    vi.mocked(useConversationHistory).mockReturnValue({
      conversations: { value: [] },
      groupedConversations: { value: [] },
      activeConversationUuid: { value: null },
      isLoading: { value: false },
      error: { value: null },
      fetchConversations: mockFetchConversations,
      selectConversation: mockSelectConversation,
      createNewConversation: mockCreateNewConversation,
      deleteConversation: mockDeleteConversation,
    });

    const wrapper = mount(ConversationHistorySidebar, {
      props: { visible: true },
    });

    expect(wrapper.find('.conversation-history-sidebar').exists()).toBe(true);
  });
});
