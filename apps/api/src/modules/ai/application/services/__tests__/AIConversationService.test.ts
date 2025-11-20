/**
 * AIConversationService Unit Tests
 * 
 * 测试范围（AC-12）：
 * - createConversation() - 创建对话
 * - getConversation() - 获取对话详情
 * - listConversations() - 分页列表
 * - deleteConversation() - 软删除
 * - addMessage() - 添加消息
 * - getConversationsByStatus() - 按状态过滤
 * - updateConversationStatus() - 更新状态
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIConversationService } from '../AIConversationService';
import type { IAIConversationRepository } from '@dailyuse/domain-server';
import { AIConversationServer, MessageServer } from '@dailyuse/domain-server';
import { MessageRole, ConversationStatus } from '@dailyuse/contracts';

describe('AIConversationService', () => {
  let service: AIConversationService;
  let mockRepository: IAIConversationRepository;

  beforeEach(() => {
    // 创建 mock repository
    mockRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByAccountUuid: vi.fn(),
      delete: vi.fn(),
    } as any;

    service = new AIConversationService(mockRepository);
  });

  describe('createConversation', () => {
    it('should create conversation with provided title', async () => {
      const accountUuid = 'test-account-123';
      const title = 'My Custom Chat';

      const result = await service.createConversation(accountUuid, title);

      expect(result.title).toBe(title);
      expect(result.accountUuid).toBe(accountUuid);
      expect(result.status).toBe(ConversationStatus.ACTIVE);
      expect(result.messageCount).toBe(0);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create conversation with default title when title is not provided', async () => {
      const accountUuid = 'test-account-456';

      const result = await service.createConversation(accountUuid);

      expect(result.title).toBe('New Chat');
      expect(result.accountUuid).toBe(accountUuid);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create conversation with default title when title is undefined', async () => {
      const accountUuid = 'test-account-789';

      const result = await service.createConversation(accountUuid, undefined);

      expect(result.title).toBe('New Chat');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when save fails', async () => {
      const accountUuid = 'test-account-error';
      vi.mocked(mockRepository.save).mockRejectedValue(new Error('Database error'));

      await expect(service.createConversation(accountUuid)).rejects.toThrow('Database error');
    });
  });

  describe('getConversation', () => {
    it('should return conversation when it exists', async () => {
      const conversationUuid = 'conv-123';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      const result = await service.getConversation(conversationUuid, true);

      expect(result).not.toBeNull();
      expect(result?.uuid).toBe(mockConversation.uuid);
      expect(mockRepository.findById).toHaveBeenCalledWith(conversationUuid, {
        includeChildren: true,
      });
    });

    it('should return null when conversation does not exist', async () => {
      const conversationUuid = 'non-existent-conv';
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await service.getConversation(conversationUuid);

      expect(result).toBeNull();
      expect(mockRepository.findById).toHaveBeenCalledWith(conversationUuid, {
        includeChildren: true,
      });
    });

    it('should fetch conversation without messages when includeMessages is false', async () => {
      const conversationUuid = 'conv-456';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      await service.getConversation(conversationUuid, false);

      expect(mockRepository.findById).toHaveBeenCalledWith(conversationUuid, {
        includeChildren: false,
      });
    });

    it('should throw error when findById fails', async () => {
      const conversationUuid = 'conv-error';
      vi.mocked(mockRepository.findById).mockRejectedValue(new Error('Database error'));

      await expect(service.getConversation(conversationUuid)).rejects.toThrow('Database error');
    });
  });

  describe('listConversations', () => {
    it('should return paginated conversations', async () => {
      const accountUuid = 'test-account';
      
      // 创建 10 个 mock conversations
      const mockConversations = Array.from({ length: 10 }, (_, i) =>
        AIConversationServer.create({
          accountUuid,
          title: `Chat ${i + 1}`,
        }),
      );

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(mockConversations);

      const result = await service.listConversations(accountUuid, 1, 5);

      expect(result.conversations).toHaveLength(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(10);
    });

    it('should return second page correctly', async () => {
      const accountUuid = 'test-account';
      
      const mockConversations = Array.from({ length: 25 }, (_, i) =>
        AIConversationServer.create({
          accountUuid,
          title: `Chat ${i + 1}`,
        }),
      );

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(mockConversations);

      const result = await service.listConversations(accountUuid, 2, 10);

      expect(result.conversations).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
    });

    it('should handle empty conversation list', async () => {
      const accountUuid = 'test-account-empty';
      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue([]);

      const result = await service.listConversations(accountUuid, 1, 20);

      expect(result.conversations).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      const accountUuid = 'test-account';
      const mockConversations = Array.from({ length: 5 }, (_, i) =>
        AIConversationServer.create({
          accountUuid,
          title: `Chat ${i + 1}`,
        }),
      );

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue(mockConversations);

      const result = await service.listConversations(accountUuid);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should throw error when findByAccountUuid fails', async () => {
      const accountUuid = 'test-account-error';
      vi.mocked(mockRepository.findByAccountUuid).mockRejectedValue(new Error('Database error'));

      await expect(service.listConversations(accountUuid)).rejects.toThrow('Database error');
    });
  });

  describe('deleteConversation', () => {
    it('should soft delete conversation when it exists', async () => {
      const conversationUuid = 'conv-to-delete';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Chat to Delete',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      await service.deleteConversation(conversationUuid);

      expect(mockRepository.delete).toHaveBeenCalledWith(conversationUuid);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should throw error when conversation does not exist', async () => {
      const conversationUuid = 'non-existent-conv';
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.deleteConversation(conversationUuid)).rejects.toThrow(
        'Conversation not found',
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when delete fails', async () => {
      const conversationUuid = 'conv-error';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);
      vi.mocked(mockRepository.delete).mockRejectedValue(new Error('Database error'));

      await expect(service.deleteConversation(conversationUuid)).rejects.toThrow('Database error');
    });
  });

  describe('addMessage', () => {
    it('should add message to conversation', async () => {
      const conversationUuid = 'conv-123';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      const result = await service.addMessage(
        conversationUuid,
        MessageRole.USER,
        'Hello, AI!',
        50,
      );

      expect(result.content).toBe('Hello, AI!');
      expect(result.role).toBe(MessageRole.USER);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should add message without tokenCount', async () => {
      const conversationUuid = 'conv-456';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      const result = await service.addMessage(
        conversationUuid,
        MessageRole.ASSISTANT,
        'I am here to help!',
      );

      expect(result.content).toBe('I am here to help!');
      expect(result.role).toBe(MessageRole.ASSISTANT);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should increment message count', async () => {
      const conversationUuid = 'conv-789';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      // 初始 messageCount 应该是 0
      expect(mockConversation.messageCount).toBe(0);

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      await service.addMessage(conversationUuid, MessageRole.USER, 'First message');

      // 验证 addMessage 被调用后聚合根的 messageCount 被更新
      expect(mockConversation.messageCount).toBe(1);
    });

    it('should throw error when conversation does not exist', async () => {
      const conversationUuid = 'non-existent-conv';
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        service.addMessage(conversationUuid, MessageRole.USER, 'Hello'),
      ).rejects.toThrow('Conversation not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when save fails', async () => {
      const conversationUuid = 'conv-error';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);
      vi.mocked(mockRepository.save).mockRejectedValue(new Error('Database error'));

      await expect(
        service.addMessage(conversationUuid, MessageRole.USER, 'Hello'),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getConversationsByStatus', () => {
    it('should filter conversations by ACTIVE status', async () => {
      const accountUuid = 'test-account';
      
      const activeConv1 = AIConversationServer.create({
        accountUuid,
        title: 'Active Chat 1',
      });
      const activeConv2 = AIConversationServer.create({
        accountUuid,
        title: 'Active Chat 2',
      });
      const closedConv = AIConversationServer.create({
        accountUuid,
        title: 'Closed Chat',
      });
      closedConv.updateStatus(ConversationStatus.CLOSED);

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue([
        activeConv1,
        activeConv2,
        closedConv,
      ]);

      const result = await service.getConversationsByStatus(accountUuid, ConversationStatus.ACTIVE);

      expect(result).toHaveLength(2);
      expect(result.every((conv) => conv.status === ConversationStatus.ACTIVE)).toBe(true);
    });

    it('should filter conversations by CLOSED status', async () => {
      const accountUuid = 'test-account';
      
      const activeConv = AIConversationServer.create({
        accountUuid,
        title: 'Active Chat',
      });
      const closedConv1 = AIConversationServer.create({
        accountUuid,
        title: 'Closed Chat 1',
      });
      closedConv1.updateStatus(ConversationStatus.CLOSED);
      const closedConv2 = AIConversationServer.create({
        accountUuid,
        title: 'Closed Chat 2',
      });
      closedConv2.updateStatus(ConversationStatus.CLOSED);

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue([
        activeConv,
        closedConv1,
        closedConv2,
      ]);

      const result = await service.getConversationsByStatus(accountUuid, ConversationStatus.CLOSED);

      expect(result).toHaveLength(2);
      expect(result.every((conv) => conv.status === ConversationStatus.CLOSED)).toBe(true);
    });

    it('should return empty array when no conversations match status', async () => {
      const accountUuid = 'test-account';
      
      const activeConv = AIConversationServer.create({
        accountUuid,
        title: 'Active Chat',
      });

      vi.mocked(mockRepository.findByAccountUuid).mockResolvedValue([activeConv]);

      const result = await service.getConversationsByStatus(
        accountUuid,
        ConversationStatus.ARCHIVED,
      );

      expect(result).toHaveLength(0);
    });

    it('should throw error when findByAccountUuid fails', async () => {
      const accountUuid = 'test-account-error';
      vi.mocked(mockRepository.findByAccountUuid).mockRejectedValue(new Error('Database error'));

      await expect(
        service.getConversationsByStatus(accountUuid, ConversationStatus.ACTIVE),
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateConversationStatus', () => {
    it('should update conversation status to CLOSED', async () => {
      const conversationUuid = 'conv-123';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      expect(mockConversation.status).toBe(ConversationStatus.ACTIVE);

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      await service.updateConversationStatus(conversationUuid, ConversationStatus.CLOSED);

      expect(mockConversation.status).toBe(ConversationStatus.CLOSED);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should update conversation status to ARCHIVED', async () => {
      const conversationUuid = 'conv-456';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);

      await service.updateConversationStatus(conversationUuid, ConversationStatus.ARCHIVED);

      expect(mockConversation.status).toBe(ConversationStatus.ARCHIVED);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw error when conversation does not exist', async () => {
      const conversationUuid = 'non-existent-conv';
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(
        service.updateConversationStatus(conversationUuid, ConversationStatus.CLOSED),
      ).rejects.toThrow('Conversation not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when save fails', async () => {
      const conversationUuid = 'conv-error';
      const mockConversation = AIConversationServer.create({
        accountUuid: 'test-account',
        title: 'Test Chat',
      });

      vi.mocked(mockRepository.findById).mockResolvedValue(mockConversation);
      vi.mocked(mockRepository.save).mockRejectedValue(new Error('Database error'));

      await expect(
        service.updateConversationStatus(conversationUuid, ConversationStatus.CLOSED),
      ).rejects.toThrow('Database error');
    });
  });
});
