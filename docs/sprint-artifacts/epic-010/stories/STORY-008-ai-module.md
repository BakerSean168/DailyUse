# STORY-008: AI 模块完整实现

> **EPIC**: EPIC-010 Desktop 全面 DDD 模块化重构  
> **Sprint**: Sprint 3  
> **预估**: 10 小时  
> **优先级**: P1  
> **依赖**: STORY-001

---

## 📋 概述

AI 模块当前使用懒加载模式但所有 handler 返回占位数据。需要完整实现：
- Conversation CRUD (7 channels)
- Message 操作 (7 channels)
- GenerationTask (5 channels)
- Quota 管理 (4 channels)
- Provider 管理 (4 channels)

---

## 🎯 目标

1. 完整实现 AI 模块所有 IPC handlers
2. 复用 `@dailyuse/application-server/ai` 的 Use Cases
3. 保持懒加载模式以优化启动性能

---

## ✅ 验收标准 (AC)

### AC-1: Conversation CRUD
```gherkin
Given AI Conversation IPC channels
When 调用以下 channels:
  - ai:conversation:create
  - ai:conversation:list
  - ai:conversation:get
  - ai:conversation:update
  - ai:conversation:delete
  - ai:conversation:archive
  - ai:conversation:search
Then 每个 channel 应返回真实数据
```

### AC-2: Message 操作
```gherkin
Given AI Message IPC channels
When 调用以下 channels:
  - ai:message:send
  - ai:message:list
  - ai:message:get
  - ai:message:delete
  - ai:message:regenerate
  - ai:message:edit
  - ai:message:feedback
Then 应正确管理对话消息
```

### AC-3: GenerationTask
```gherkin
Given AI GenerationTask IPC channels
When 调用以下 channels:
  - ai:generation-task:create
  - ai:generation-task:list
  - ai:generation-task:get
  - ai:generation-task:cancel
  - ai:generation-task:retry
Then 应正确管理 AI 生成任务
```

### AC-4: Quota & Provider
```gherkin
Given AI Quota 和 Provider IPC channels
When 调用 quota 和 provider 相关 channels
Then 应返回正确的配额信息和可用 Provider 列表
```

---

## 📁 任务清单

### Task 8.1: 创建 AIDesktopApplicationService

**文件**: `apps/desktop/src/main/modules/ai/application/AIDesktopApplicationService.ts`

```typescript
/**
 * AI Desktop Application Service
 */

import {
  CreateConversation,
  createConversation,
  ListConversations,
  listConversations,
  GetConversation,
  getConversation,
  DeleteConversation,
  deleteConversation,
  SendMessage,
  sendMessage,
  GetQuota,
  getQuota,
  GenerateGoal,
  generateGoal,
  ListProviders,
  listProviders,
} from '@dailyuse/application-server';
import { AIContainer } from '@dailyuse/infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import type {
  AIConversationClientDTO,
  AIMessageClientDTO,
  AIGenerationTaskClientDTO,
  AIQuotaClientDTO,
  AIProviderClientDTO,
  CreateConversationRequest,
  SendMessageRequest,
} from '@dailyuse/contracts/ai';

const logger = createLogger('AIDesktopAppService');

export class AIDesktopApplicationService {
  private container: typeof AIContainer.prototype;

  constructor() {
    this.container = AIContainer.getInstance();
    logger.info('AI Application Service initialized');
  }

  // ===== Conversation =====

  async createConversation(request: CreateConversationRequest): Promise<AIConversationClientDTO> {
    logger.debug('Creating conversation', { title: request.title });
    const result = await createConversation(
      this.container.getConversationRepository(),
      {
        accountUuid: request.accountUuid || 'default',
        title: request.title,
        model: request.model,
        systemPrompt: request.systemPrompt,
      }
    );
    return result.conversation;
  }

  async listConversations(params?: {
    accountUuid?: string;
    archived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    conversations: AIConversationClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const result = await listConversations(
      this.container.getConversationRepository(),
      params || {}
    );
    return {
      conversations: result.conversations,
      total: result.total,
      page: params?.page || 1,
      pageSize: params?.limit || 20,
      hasMore: (params?.page || 1) * (params?.limit || 20) < result.total,
    };
  }

  async getConversation(uuid: string): Promise<AIConversationClientDTO | null> {
    const result = await getConversation(
      this.container.getConversationRepository(),
      { uuid }
    );
    return result.conversation;
  }

  async updateConversation(uuid: string, request: {
    title?: string;
    systemPrompt?: string;
  }): Promise<AIConversationClientDTO> {
    const repo = this.container.getConversationRepository();
    const conversation = await repo.findById(uuid);
    if (!conversation) {
      throw new Error(`Conversation not found: ${uuid}`);
    }
    if (request.title) conversation.updateTitle(request.title);
    if (request.systemPrompt) conversation.updateSystemPrompt(request.systemPrompt);
    await repo.save(conversation);
    return conversation.toClientDTO();
  }

  async deleteConversation(uuid: string): Promise<void> {
    await deleteConversation(
      this.container.getConversationRepository(),
      { uuid }
    );
  }

  async archiveConversation(uuid: string): Promise<AIConversationClientDTO> {
    const repo = this.container.getConversationRepository();
    const conversation = await repo.findById(uuid);
    if (!conversation) {
      throw new Error(`Conversation not found: ${uuid}`);
    }
    conversation.archive();
    await repo.save(conversation);
    return conversation.toClientDTO();
  }

  async searchConversations(query: string, params?: {
    accountUuid?: string;
    limit?: number;
  }): Promise<{
    conversations: AIConversationClientDTO[];
    total: number;
  }> {
    const repo = this.container.getConversationRepository();
    const conversations = await repo.search(query, params);
    return {
      conversations: conversations.map(c => c.toClientDTO()),
      total: conversations.length,
    };
  }

  // ===== Message =====

  async sendMessage(conversationUuid: string, content: string, role: 'user' | 'assistant' = 'user'): Promise<AIMessageClientDTO> {
    const result = await sendMessage(
      this.container.getMessageRepository(),
      this.container.getConversationRepository(),
      this.container.getAIProvider(),
      {
        conversationUuid,
        content,
        role,
      }
    );
    return result.message;
  }

  async listMessages(conversationUuid: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    messages: AIMessageClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const repo = this.container.getMessageRepository();
    const messages = await repo.findByConversationUuid(conversationUuid, params);
    const total = await repo.countByConversationUuid(conversationUuid);
    return {
      messages: messages.map(m => m.toClientDTO()),
      total,
      page: params?.page || 1,
      pageSize: params?.limit || 50,
      hasMore: (params?.page || 1) * (params?.limit || 50) < total,
    };
  }

  async getMessage(uuid: string): Promise<AIMessageClientDTO | null> {
    const repo = this.container.getMessageRepository();
    const message = await repo.findById(uuid);
    return message?.toClientDTO() ?? null;
  }

  async deleteMessage(uuid: string): Promise<void> {
    const repo = this.container.getMessageRepository();
    await repo.delete(uuid);
  }

  async regenerateMessage(uuid: string): Promise<AIMessageClientDTO> {
    // 获取原消息
    const repo = this.container.getMessageRepository();
    const originalMessage = await repo.findById(uuid);
    if (!originalMessage) {
      throw new Error(`Message not found: ${uuid}`);
    }

    // 重新生成 AI 回复
    const provider = this.container.getAIProvider();
    const newContent = await provider.regenerate(originalMessage.conversationUuid, uuid);

    // 创建新消息
    const { AIMessage } = await import('@dailyuse/domain-server/ai');
    const newMessage = AIMessage.create({
      conversationUuid: originalMessage.conversationUuid,
      content: newContent,
      role: 'assistant',
    });
    await repo.save(newMessage);

    return newMessage.toClientDTO();
  }

  async editMessage(uuid: string, content: string): Promise<AIMessageClientDTO> {
    const repo = this.container.getMessageRepository();
    const message = await repo.findById(uuid);
    if (!message) {
      throw new Error(`Message not found: ${uuid}`);
    }
    message.updateContent(content);
    await repo.save(message);
    return message.toClientDTO();
  }

  async addMessageFeedback(uuid: string, feedback: {
    rating?: number;
    comment?: string;
    isHelpful?: boolean;
  }): Promise<{ success: boolean }> {
    const repo = this.container.getMessageRepository();
    const message = await repo.findById(uuid);
    if (!message) {
      throw new Error(`Message not found: ${uuid}`);
    }
    message.addFeedback(feedback);
    await repo.save(message);
    return { success: true };
  }

  // ===== Generation Task =====

  async createGenerationTask(request: {
    type: string;
    input: Record<string, unknown>;
    conversationUuid?: string;
  }): Promise<AIGenerationTaskClientDTO> {
    const { AIGenerationTask } = await import('@dailyuse/domain-server/ai');
    const task = AIGenerationTask.create({
      type: request.type,
      input: request.input,
      conversationUuid: request.conversationUuid,
    });

    const repo = this.container.getGenerationTaskRepository();
    await repo.save(task);

    // 异步执行任务
    this.executeGenerationTask(task.uuid).catch(err => {
      logger.error('Generation task failed', { uuid: task.uuid, error: err });
    });

    return task.toClientDTO();
  }

  async listGenerationTasks(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    tasks: AIGenerationTaskClientDTO[];
    total: number;
  }> {
    const repo = this.container.getGenerationTaskRepository();
    const tasks = await repo.findAll(params);
    return {
      tasks: tasks.map(t => t.toClientDTO()),
      total: tasks.length,
    };
  }

  async getGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO | null> {
    const repo = this.container.getGenerationTaskRepository();
    const task = await repo.findById(uuid);
    return task?.toClientDTO() ?? null;
  }

  async cancelGenerationTask(uuid: string): Promise<{ success: boolean }> {
    const repo = this.container.getGenerationTaskRepository();
    const task = await repo.findById(uuid);
    if (!task) {
      throw new Error(`Generation task not found: ${uuid}`);
    }
    task.cancel();
    await repo.save(task);
    return { success: true };
  }

  async retryGenerationTask(uuid: string): Promise<AIGenerationTaskClientDTO> {
    const repo = this.container.getGenerationTaskRepository();
    const task = await repo.findById(uuid);
    if (!task) {
      throw new Error(`Generation task not found: ${uuid}`);
    }
    task.retry();
    await repo.save(task);

    // 重新执行
    this.executeGenerationTask(uuid).catch(err => {
      logger.error('Generation task retry failed', { uuid, error: err });
    });

    return task.toClientDTO();
  }

  private async executeGenerationTask(uuid: string): Promise<void> {
    const repo = this.container.getGenerationTaskRepository();
    const task = await repo.findById(uuid);
    if (!task) return;

    try {
      task.start();
      await repo.save(task);

      const provider = this.container.getAIProvider();
      const result = await provider.generate(task.type, task.input);

      task.complete(result);
      await repo.save(task);
    } catch (error) {
      task.fail(error instanceof Error ? error.message : 'Unknown error');
      await repo.save(task);
    }
  }

  // ===== Quota =====

  async getQuota(accountUuid?: string): Promise<AIQuotaClientDTO> {
    const result = await getQuota(
      this.container.getQuotaRepository(),
      { accountUuid: accountUuid || 'default' }
    );
    return result.quota;
  }

  async getQuotaUsage(accountUuid?: string, period?: string): Promise<{
    used: number;
    limit: number;
    resetAt: number;
    usageByDay: Array<{ date: string; count: number }>;
  }> {
    const repo = this.container.getQuotaRepository();
    return repo.getUsage(accountUuid || 'default', period || 'month');
  }

  async checkQuota(accountUuid?: string): Promise<{
    allowed: boolean;
    remaining: number;
  }> {
    const quota = await this.getQuota(accountUuid);
    return {
      allowed: quota.used < quota.limit,
      remaining: Math.max(0, quota.limit - quota.used),
    };
  }

  async consumeQuota(accountUuid?: string, amount: number = 1): Promise<AIQuotaClientDTO> {
    const repo = this.container.getQuotaRepository();
    return repo.consume(accountUuid || 'default', amount);
  }

  // ===== Provider =====

  async listProviders(): Promise<{
    providers: AIProviderClientDTO[];
    activeProvider: string;
  }> {
    const result = await listProviders(
      this.container.getProviderConfigRepository()
    );
    return {
      providers: result.providers,
      activeProvider: result.activeProvider || 'openai',
    };
  }

  async getProvider(id: string): Promise<AIProviderClientDTO | null> {
    const repo = this.container.getProviderConfigRepository();
    const provider = await repo.findById(id);
    return provider?.toClientDTO() ?? null;
  }

  async configureProvider(id: string, config: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
  }): Promise<AIProviderClientDTO> {
    const repo = this.container.getProviderConfigRepository();
    const provider = await repo.findById(id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }
    provider.updateConfig(config);
    await repo.save(provider);
    return provider.toClientDTO();
  }

  async setActiveProvider(id: string): Promise<{ success: boolean }> {
    const repo = this.container.getProviderConfigRepository();
    await repo.setActive(id);
    return { success: true };
  }
}
```

### Task 8.2: 重构 IPC Handlers

**文件**: `apps/desktop/src/main/modules/ai/ipc/ai-conversation.ipc-handlers.ts`

```typescript
/**
 * AI Conversation IPC Handlers
 */

import { ipcMain } from 'electron';
import { AIDesktopApplicationService } from '../application/AIDesktopApplicationService';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('AIConversationIPC');

let appService: AIDesktopApplicationService | null = null;

function getAppService(): AIDesktopApplicationService {
  if (!appService) {
    appService = new AIDesktopApplicationService();
  }
  return appService;
}

export function registerAIConversationIpcHandlers(): void {
  ipcMain.handle('ai:conversation:create', async (_, request) => {
    try {
      return await getAppService().createConversation(request);
    } catch (error) {
      logger.error('Failed to create conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:list', async (_, params) => {
    try {
      return await getAppService().listConversations(params);
    } catch (error) {
      logger.error('Failed to list conversations', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:get', async (_, uuid) => {
    try {
      return await getAppService().getConversation(uuid);
    } catch (error) {
      logger.error('Failed to get conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:update', async (_, uuid, request) => {
    try {
      return await getAppService().updateConversation(uuid, request);
    } catch (error) {
      logger.error('Failed to update conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:delete', async (_, uuid) => {
    try {
      await getAppService().deleteConversation(uuid);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:archive', async (_, uuid) => {
    try {
      return await getAppService().archiveConversation(uuid);
    } catch (error) {
      logger.error('Failed to archive conversation', error);
      throw error;
    }
  });

  ipcMain.handle('ai:conversation:search', async (_, query, params) => {
    try {
      return await getAppService().searchConversations(query, params);
    } catch (error) {
      logger.error('Failed to search conversations', error);
      throw error;
    }
  });

  logger.info('AI Conversation IPC handlers registered');
}
```

### Task 8.3: 创建其他 IPC Handler 文件

- `ai-message.ipc-handlers.ts`
- `ai-generation-task.ipc-handlers.ts`
- `ai-quota.ipc-handlers.ts`
- `ai-provider.ipc-handlers.ts`

### Task 8.4: 创建模块入口

**文件**: `apps/desktop/src/main/modules/ai/index.ts`

```typescript
/**
 * AI Module - Desktop Main Process
 * 
 * 保持懒加载特性，首次调用时才完全初始化
 */

import { registerAIConversationIpcHandlers } from './ipc/ai-conversation.ipc-handlers';
import { registerAIMessageIpcHandlers } from './ipc/ai-message.ipc-handlers';
import { registerAIGenerationTaskIpcHandlers } from './ipc/ai-generation-task.ipc-handlers';
import { registerAIQuotaIpcHandlers } from './ipc/ai-quota.ipc-handlers';
import { registerAIProviderIpcHandlers } from './ipc/ai-provider.ipc-handlers';
import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

const logger = createLogger('AIModule');

export function registerAIModule(): void {
  InitializationManager.getInstance().registerModule(
    'ai',
    InitializationPhase.FEATURE_MODULES,
    async () => {
      // 注册 IPC handlers（懒加载，此时不会加载 AI Provider）
      registerAIConversationIpcHandlers();
      registerAIMessageIpcHandlers();
      registerAIGenerationTaskIpcHandlers();
      registerAIQuotaIpcHandlers();
      registerAIProviderIpcHandlers();

      logger.info('AI module registered (lazy initialization)');
    }
  );
}

export { AIDesktopApplicationService } from './application/AIDesktopApplicationService';
```

### Task 8.5: 删除旧的 ai.ipc-handlers.ts

完成新模块后，删除旧文件并更新引用。

---

## 📚 技术上下文

### @dailyuse/application-server/ai 可用 Use Cases

```typescript
// Conversation
CreateConversation, createConversation
ListConversations, listConversations
GetConversation, getConversation
DeleteConversation, deleteConversation

// Message
SendMessage, sendMessage

// Quota
GetQuota, getQuota

// Generation
GenerateGoal, generateGoal

// Provider
ListProviders, listProviders
```

### 懒加载模式

AI 模块应保持懒加载，避免影响应用启动速度：
- IPC handlers 在启动时注册
- AIDesktopApplicationService 在首次调用时实例化
- AI Provider 在首次需要时才连接

---

## 🔗 依赖关系

- **依赖**: STORY-001 (基础设施)
- **被依赖**: 无直接依赖

---

## 📝 备注

- AI Provider 配置（API Key 等）应从 Setting 模块读取
- 考虑添加 streaming 支持（Server-Sent Events 或 WebSocket）
- 生成任务应支持进度回调
- 需要处理网络错误和 API 限流
