/**
 * AI IPC 处理器
 * 处理所有与 AI 相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { AIDesktopApplicationService } from '../application/AIDesktopApplicationService';

export class AIIPCHandler extends BaseIPCHandler {
  private aiService: AIDesktopApplicationService;

  constructor() {
    super('AIIPCHandler');
    this.aiService = new AIDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // 对话管理
    ipcMain.handle('ai:create-conversation', async (event, payload: { accountUuid: string; title?: string }) => {
      return this.handleRequest(
        'ai:create-conversation',
        () => this.aiService.createConversation(payload.accountUuid, payload.title),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:get-conversation', async (event, payload: { accountUuid: string; conversationUuid: string; includeMessages?: boolean }) => {
      return this.handleRequest(
        'ai:get-conversation',
        () => this.aiService.getConversation(payload.accountUuid, payload.conversationUuid, payload.includeMessages),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:list-conversations', async (event, payload: { accountUuid: string; options?: { limit?: number; offset?: number; archived?: boolean } }) => {
      return this.handleRequest(
        'ai:list-conversations',
        () => this.aiService.listConversations(payload.accountUuid, payload.options),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:delete-conversation', async (event, payload: { accountUuid: string; conversationUuid: string }) => {
      return this.handleRequest(
        'ai:delete-conversation',
        () => this.aiService.deleteConversation(payload.accountUuid, payload.conversationUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:archive-conversation', async (event, payload: { accountUuid: string; conversationUuid: string }) => {
      return this.handleRequest(
        'ai:archive-conversation',
        () => this.aiService.archiveConversation(payload.accountUuid, payload.conversationUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    // 消息处理
    ipcMain.handle('ai:send-message', async (event, payload: { accountUuid: string; conversationUuid: string; content: string }) => {
      return this.handleRequest(
        'ai:send-message',
        () => this.aiService.sendMessage(payload.accountUuid, payload.conversationUuid, payload.content),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:list-messages', async (event, payload: { accountUuid: string; conversationUuid: string; options?: { limit?: number; offset?: number } }) => {
      return this.handleRequest(
        'ai:list-messages',
        () => this.aiService.listMessages(payload.accountUuid, payload.conversationUuid, payload.options),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:get-message', async (event, payload: { accountUuid: string; messageUuid: string }) => {
      return this.handleRequest(
        'ai:get-message',
        () => this.aiService.getMessage(payload.accountUuid, payload.messageUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:regenerate-message', async (event, payload: { accountUuid: string; messageUuid: string }) => {
      return this.handleRequest(
        'ai:regenerate-message',
        () => this.aiService.regenerateMessage(payload.accountUuid, payload.messageUuid),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:edit-message', async (event, payload: { accountUuid: string; messageUuid: string; content: string }) => {
      return this.handleRequest(
        'ai:edit-message',
        () => this.aiService.editMessage(payload.accountUuid, payload.messageUuid, payload.content),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:message-feedback', async (event, payload: { accountUuid: string; messageUuid: string; feedback: 'positive' | 'negative' }) => {
      return this.handleRequest(
        'ai:message-feedback',
        () => this.aiService.messageFeedback(payload.accountUuid, payload.messageUuid, payload.feedback),
        { accountUuid: payload.accountUuid },
      );
    });

    // 配额管理
    ipcMain.handle('ai:get-quota', async (event, accountUuid: string) => {
      return this.handleRequest(
        'ai:get-quota',
        () => this.aiService.getQuota(accountUuid),
        { accountUuid },
      );
    });

    ipcMain.handle('ai:get-usage-history', async (event, payload: { accountUuid: string; options?: { startDate?: Date; endDate?: Date } }) => {
      return this.handleRequest(
        'ai:get-usage-history',
        () => this.aiService.getUsageHistory(payload.accountUuid, payload.options),
        { accountUuid: payload.accountUuid },
      );
    });

    // 提供商管理
    ipcMain.handle('ai:list-providers', async (event, accountUuid: string) => {
      return this.handleRequest(
        'ai:list-providers',
        () => this.aiService.listProviders(accountUuid),
        { accountUuid },
      );
    });

    ipcMain.handle('ai:get-provider', async (event, payload: { accountUuid: string; providerId: string }) => {
      return this.handleRequest(
        'ai:get-provider',
        () => this.aiService.getProvider(payload.accountUuid, payload.providerId),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:get-provider-models', async (event, payload: { accountUuid: string; providerId: string }) => {
      return this.handleRequest(
        'ai:get-provider-models',
        () => this.aiService.getProviderModels(payload.accountUuid, payload.providerId),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:set-default-provider', async (event, payload: { accountUuid: string; providerId: string }) => {
      return this.handleRequest(
        'ai:set-default-provider',
        () => this.aiService.setDefaultProvider(payload.accountUuid, payload.providerId),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:configure-provider', async (event, payload: { accountUuid: string; providerId: string; config: any }) => {
      return this.handleRequest(
        'ai:configure-provider',
        () => this.aiService.configureProvider(payload.accountUuid, payload.providerId, payload.config),
        { accountUuid: payload.accountUuid },
      );
    });

    ipcMain.handle('ai:test-provider-connection', async (event, payload: { accountUuid: string; providerId: string }) => {
      return this.handleRequest(
        'ai:test-provider-connection',
        () => this.aiService.testProviderConnection(payload.accountUuid, payload.providerId),
        { accountUuid: payload.accountUuid },
      );
    });

    this.logger.info('Registered AI IPC handlers');
  }
}

export const aiIPCHandler = new AIIPCHandler();
