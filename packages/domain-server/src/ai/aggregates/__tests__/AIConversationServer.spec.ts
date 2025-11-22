import { describe, it, expect } from 'vitest';
import { ConversationStatus, MessageRole } from '@dailyuse/contracts';
import { AIConversationServer } from '../AIConversationServer';
import { MessageServer } from '../../entities/MessageServer';

describe('AIConversationServer', () => {
  const accountUuid = 'test-account-uuid';
  const title = 'Test Conversation';

  it('should create a new conversation', () => {
    const conversation = AIConversationServer.create({ accountUuid, title });

    expect(conversation.uuid).toBeDefined();
    expect(conversation.accountUuid).toBe(accountUuid);
    expect(conversation.title).toBe(title);
    expect(conversation.status).toBe(ConversationStatus.ACTIVE);
    expect(conversation.messageCount).toBe(0);
    expect(conversation.messages).toHaveLength(0);
  });

  it('should add a message', () => {
    const conversation = AIConversationServer.create({ accountUuid, title });
    const message = MessageServer.create({
      conversationUuid: conversation.uuid,
      role: MessageRole.USER,
      content: 'Hello',
    });

    conversation.addMessage(message);

    expect(conversation.messageCount).toBe(1);
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0]).toBe(message);
    expect(conversation.lastMessageAt).toBe(message.createdAt);
  });

  it('should not add message if conversation is not active', () => {
    const conversation = AIConversationServer.create({ accountUuid, title });
    conversation.updateStatus(ConversationStatus.ARCHIVED);

    const message = MessageServer.create({
      conversationUuid: conversation.uuid,
      role: MessageRole.USER,
      content: 'Hello',
    });

    expect(() => conversation.addMessage(message)).toThrow();
  });

  it('should get latest message', async () => {
    const conversation = AIConversationServer.create({ accountUuid, title });
    const msg1 = MessageServer.create({
      conversationUuid: conversation.uuid,
      role: MessageRole.USER,
      content: 'Hello',
    });
    // Wait a bit to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));
    const msg2 = MessageServer.create({
      conversationUuid: conversation.uuid,
      role: MessageRole.ASSISTANT,
      content: 'Hi',
    });

    conversation.addMessage(msg1);
    conversation.addMessage(msg2);

    const latest = conversation.getLatestMessage();
    expect(latest).toBe(msg2);
  });
});
