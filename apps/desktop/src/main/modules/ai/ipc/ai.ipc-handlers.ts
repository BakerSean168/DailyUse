/**
 * AI Module IPC Handlers
 *
 * AI 模块 IPC 处理器
 * 复用 AIDesktopApplicationService 中的逻辑
 */

import { ipcMain } from 'electron';
import { createLogger } from '@dailyuse/utils';

import { AIDesktopApplicationService } from '../application/AIDesktopApplicationService';

const logger = createLogger('AIIpcHandlers');

// 惰性初始化的服务实例
let appService: AIDesktopApplicationService | null = null;

function getAppService(): AIDesktopApplicationService {
  if (!appService) {
    appService = new AIDesktopApplicationService();
  }
  return appService;
}

// 所有 IPC channel 名称
const IPC_CHANNELS = [
  // Conversation
  'ai:conversation:create',
  'ai:conversation:list',
  'ai:conversation:get',
  'ai:conversation:update',
  'ai:conversation:delete',
  'ai:conversation:archive',
  'ai:conversation:search',
  // Message
  'ai:message:send',
  'ai:message:list',
  'ai:message:get',
  'ai:message:delete',
  'ai:message:regenerate',
  'ai:message:edit',
  'ai:message:feedback',
  // Generation Task
  'ai:generation-task:create',
  'ai:generation-task:list',
  'ai:generation-task:get',
  'ai:generation-task:cancel',
  'ai:generation-task:retry',
  'ai:generation-task:get-status',
  'ai:generation-task:stream',
  // Goal Generation
  'ai:goal:generate',
  // Quota
  'ai:quota:get',
  'ai:quota:get-usage-history',
  'ai:quota:get-by-model',
  // Provider
  'ai:provider:list',
  'ai:provider:get',
  'ai:provider:get-models',
  'ai:provider:set-default',
  'ai:provider:configure',
  'ai:provider:test-connection',
] as const;

/**
 * 注册 AI 模块的 IPC 处理器
 */
export function registerAIIpcHandlers(): void {
  logger.info('Registering AI IPC handlers...');

  // ============================================
  // Conversation Handlers
  // ============================================

  ipcMain.handle('ai:conversation:create', async (_, request: { title?: string; accountUuid?: string }) => {
    try {
      return await getAppService().createConversation(
        request.accountUuid || 'default',
        request.title,
      );
    } catch (error) {
      logger.error('Failed to create conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:list', async (_, params?: { accountUuid?: string; limit?: number; offset?: number; archived?: boolean }) => {
    try {
      return await getAppService().listConversations(
        params?.accountUuid || 'default',
        { limit: params?.limit, offset: params?.offset, archived: params?.archived },
      );
    } catch (error) {
      logger.error('Failed to list conversations', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:get', async (_, uuid: string, accountUuid?: string) => {
    try {
      const result = await getAppService().getConversation(
        accountUuid || 'default',
        uuid,
      );
      return result.conversation;
    } catch (error) {
      logger.error('Failed to get conversation', error);
      return null;
    }
  });

  ipcMain.handle('ai:conversation:update', async (_, uuid: string, request: { title?: string; archived?: boolean; accountUuid?: string }) => {
    try {
      return await getAppService().updateConversation(
        request.accountUuid || 'default',
        uuid,
        { title: request.title, archived: request.archived },
      );
    } catch (error) {
      logger.error('Failed to update conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:delete', async (_, uuid: string, accountUuid?: string) => {
    try {
      await getAppService().deleteConversation(
        accountUuid || 'default',
        uuid,
      );
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:archive', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().archiveConversation(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to archive conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:search', async (_, query: string, params?: { accountUuid?: string; limit?: number; offset?: number }) => {
    try {
      return await getAppService().searchConversations(
        params?.accountUuid || 'default',
        query,
        { limit: params?.limit, offset: params?.offset },
      );
    } catch (error) {
      logger.error('Failed to search conversations', error);
      throw error;
    }
  });

  // ============================================
  // Message Handlers
  // ============================================

  ipcMain.handle('ai:message:send', async (_, conversationUuid: string, content: string, accountUuid?: string) => {
    try {
      return await getAppService().sendMessage(
        accountUuid || 'default',
        conversationUuid,
        content,
      );
    } catch (error) {
      logger.error('Failed to send message', error);
      throw error;
    }
  });

  ipcMain.handle('ai:message:list', async (_, conversationUuid: string, params?: { accountUuid?: string; limit?: number; offset?: number }) => {
    try {
      return await getAppService().listMessages(
        params?.accountUuid || 'default',
        conversationUuid,
        { limit: params?.limit, offset: params?.offset },
      );
    } catch (error) {
      logger.error('Failed to list messages', error);
      throw error;
    }
  });

  ipcMain.handle('ai:message:get', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().getMessage(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to get message', error);
      return null;
    }
  });

  ipcMain.handle('ai:message:delete', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().deleteMessage(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to delete message', error);
      throw error;
    }
  });

  ipcMain.handle('ai:message:regenerate', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().regenerateMessage(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to regenerate message', error);
      throw error;
    }
  });

  ipcMain.handle('ai:message:edit', async (_, uuid: string, content: string, accountUuid?: string) => {
    try {
      return await getAppService().editMessage(
        accountUuid || 'default',
        uuid,
        content,
      );
    } catch (error) {
      logger.error('Failed to edit message', error);
      throw error;
    }
  });

  ipcMain.handle('ai:message:feedback', async (_, uuid: string, feedback: 'positive' | 'negative', accountUuid?: string) => {
    try {
      return await getAppService().messageFeedback(
        accountUuid || 'default',
        uuid,
        feedback,
      );
    } catch (error) {
      logger.error('Failed to submit message feedback', error);
      throw error;
    }
  });

  // ============================================
  // Generation Task Handlers
  // ============================================

  ipcMain.handle('ai:generation-task:create', async (_, request: { type: string; input: any; accountUuid?: string }) => {
    try {
      return await getAppService().createGenerationTask(
        request.accountUuid || 'default',
        { type: request.type, input: request.input },
      );
    } catch (error) {
      logger.error('Failed to create generation task', error);
      throw error;
    }
  });

  ipcMain.handle('ai:generation-task:list', async (_, params?: { accountUuid?: string; limit?: number; offset?: number }) => {
    try {
      return await getAppService().listGenerationTasks(
        params?.accountUuid || 'default',
        { limit: params?.limit, offset: params?.offset },
      );
    } catch (error) {
      logger.error('Failed to list generation tasks', error);
      throw error;
    }
  });

  ipcMain.handle('ai:generation-task:get', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().getGenerationTask(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to get generation task', error);
      return null;
    }
  });

  ipcMain.handle('ai:generation-task:cancel', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().cancelGenerationTask(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to cancel generation task', error);
      throw error;
    }
  });

  ipcMain.handle('ai:generation-task:retry', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().retryGenerationTask(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to retry generation task', error);
      throw error;
    }
  });

  ipcMain.handle('ai:generation-task:get-status', async (_, uuid: string, accountUuid?: string) => {
    try {
      return await getAppService().getGenerationTaskStatus(
        accountUuid || 'default',
        uuid,
      );
    } catch (error) {
      logger.error('Failed to get generation task status', error);
      throw error;
    }
  });

  ipcMain.handle('ai:generation-task:stream', async (_, uuid: string, accountUuid?: string) => {
    // Note: Streaming requires special handling, may need different approach
    return { error: 'Streaming not yet implemented' };
  });

  // ============================================
  // Goal Generation Handler
  // ============================================

  ipcMain.handle('ai:goal:generate', async (_, input: { idea: string; category?: string; context?: string; accountUuid?: string }) => {
    try {
      return await getAppService().generateGoal(
        input.accountUuid || 'default',
        { idea: input.idea, category: input.category as any, context: input.context },
      );
    } catch (error) {
      logger.error('Failed to generate goal', error);
      throw error;
    }
  });

  // ============================================
  // Quota Handlers
  // ============================================

  ipcMain.handle('ai:quota:get', async (_, accountUuid?: string) => {
    try {
      return await getAppService().getQuota(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to get quota', error);
      throw error;
    }
  });

  ipcMain.handle('ai:quota:get-usage-history', async (_, params?: { accountUuid?: string; startDate?: string; endDate?: string }) => {
    try {
      return await getAppService().getUsageHistory(
        params?.accountUuid || 'default',
        {
          startDate: params?.startDate ? new Date(params.startDate) : undefined,
          endDate: params?.endDate ? new Date(params.endDate) : undefined,
        },
      );
    } catch (error) {
      logger.error('Failed to get usage history', error);
      throw error;
    }
  });

  ipcMain.handle('ai:quota:get-by-model', async (_, modelId: string, accountUuid?: string) => {
    try {
      return await getAppService().getQuotaByModel(
        accountUuid || 'default',
        modelId,
      );
    } catch (error) {
      logger.error('Failed to get quota by model', error);
      throw error;
    }
  });

  // ============================================
  // Provider Handlers
  // ============================================

  ipcMain.handle('ai:provider:list', async (_, accountUuid?: string) => {
    try {
      return await getAppService().listProviders(accountUuid || 'default');
    } catch (error) {
      logger.error('Failed to list providers', error);
      throw error;
    }
  });

  ipcMain.handle('ai:provider:get', async (_, providerId: string, accountUuid?: string) => {
    try {
      return await getAppService().getProvider(
        accountUuid || 'default',
        providerId,
      );
    } catch (error) {
      logger.error('Failed to get provider', error);
      return null;
    }
  });

  ipcMain.handle('ai:provider:get-models', async (_, providerId: string, accountUuid?: string) => {
    try {
      return await getAppService().getProviderModels(
        accountUuid || 'default',
        providerId,
      );
    } catch (error) {
      logger.error('Failed to get provider models', error);
      throw error;
    }
  });

  ipcMain.handle('ai:provider:set-default', async (_, providerId: string, accountUuid?: string) => {
    try {
      return await getAppService().setDefaultProvider(
        accountUuid || 'default',
        providerId,
      );
    } catch (error) {
      logger.error('Failed to set default provider', error);
      throw error;
    }
  });

  ipcMain.handle('ai:provider:configure', async (_, providerId: string, config: any, accountUuid?: string) => {
    try {
      return await getAppService().configureProvider(
        accountUuid || 'default',
        providerId,
        config,
      );
    } catch (error) {
      logger.error('Failed to configure provider', error);
      throw error;
    }
  });

  ipcMain.handle('ai:provider:test-connection', async (_, providerId: string, accountUuid?: string) => {
    try {
      return await getAppService().testProviderConnection(
        accountUuid || 'default',
        providerId,
      );
    } catch (error) {
      logger.error('Failed to test provider connection', error);
      throw error;
    }
  });

  logger.info(`AI IPC handlers registered (${IPC_CHANNELS.length} channels)`);
}

/**
 * 注销 AI 模块的 IPC 处理器
 */
export function unregisterAIIpcHandlers(): void {
  logger.info('Unregistering AI IPC handlers...');

  for (const channel of IPC_CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  // Reset service instance
  appService = null;

  logger.info('AI IPC handlers unregistered');
}
