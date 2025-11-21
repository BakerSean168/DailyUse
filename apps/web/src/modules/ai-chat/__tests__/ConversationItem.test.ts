/**
 * Unit tests for ConversationItem component
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ConversationItem from '../components/ConversationItem.vue';
import type { Conversation } from '../types/conversation';

describe('ConversationItem', () => {
  const mockConversation: Conversation = {
    conversationUuid: 'conv-123',
    accountUuid: 'acc-123',
    title: 'Test Conversation',
    createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    updatedAt: Date.now() - 1000 * 60 * 5,
    messageCount: 3,
    lastMessagePreview: '3 messages',
  };

  it('should render conversation title', () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    expect(wrapper.find('.conversation-title').text()).toBe('Test Conversation');
  });

  it('should render "New Chat" when title is null', () => {
    const conversationWithoutTitle: Conversation = {
      ...mockConversation,
      title: null,
    };

    const wrapper = mount(ConversationItem, {
      props: {
        conversation: conversationWithoutTitle,
        isActive: false,
      },
    });

    expect(wrapper.find('.conversation-title').text()).toBe('New Chat');
  });

  it('should render preview text', () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    expect(wrapper.find('.conversation-preview').text()).toBe('3 messages');
  });

  it('should render formatted time', () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    const timeText = wrapper.find('.conversation-time').text();
    expect(timeText).toMatch(/\d+分钟前/); // Should show "X分钟前"
  });

  it('should format time as "X天前" for days', () => {
    const conversationDaysAgo: Conversation = {
      ...mockConversation,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    };

    const wrapper = mount(ConversationItem, {
      props: {
        conversation: conversationDaysAgo,
        isActive: false,
      },
    });

    expect(wrapper.find('.conversation-time').text()).toBe('2天前');
  });

  it('should format time as "X月前" for months', () => {
    const conversationMonthsAgo: Conversation = {
      ...mockConversation,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 35, // ~1 month ago
    };

    const wrapper = mount(ConversationItem, {
      props: {
        conversation: conversationMonthsAgo,
        isActive: false,
      },
    });

    expect(wrapper.find('.conversation-time').text()).toMatch(/\d+月前/);
  });

  it('should apply active class when isActive is true', () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: true,
      },
    });

    expect(wrapper.find('.conversation-item').classes()).toContain('active');
  });

  it('should not apply active class when isActive is false', () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    expect(wrapper.find('.conversation-item').classes()).not.toContain('active');
  });

  it('should emit select event when clicked', async () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    await wrapper.find('.conversation-item').trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')?.[0]).toEqual(['conv-123']);
  });

  it('should emit delete event when delete button clicked', async () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    await wrapper.find('.delete-btn').trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['conv-123']);
  });

  it('should stop propagation when delete button clicked', async () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    const deleteBtn = wrapper.find('.delete-btn');
    await deleteBtn.trigger('click');

    // Should emit delete but not select
    expect(wrapper.emitted('delete')).toBeTruthy();
    expect(wrapper.emitted('select')).toBeFalsy();
  });

  it('should show delete button on hover (tested via class)', () => {
    const wrapper = mount(ConversationItem, {
      props: {
        conversation: mockConversation,
        isActive: false,
      },
    });

    // Delete button should exist in DOM (visibility controlled by CSS :hover)
    expect(wrapper.find('.delete-btn').exists()).toBe(true);
  });
});
