# Story 13.39: AI 模块主进程 Handler 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.39 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 8h |
| 前置依赖 | Story 13.03 (IPC Infrastructure) |
| 关联模块 | AI |

## 目标

实现 AI 模块的主进程 Handler，提供 AI 能力的接入、提示词管理和模型调用功能。

## 任务列表

### 1. 创建 AI Handler 基础结构 (1.5h)
- [ ] AIHandler 类设计
- [ ] IPC 注册机制
- [ ] Provider 管理

### 2. 实现 Provider 系统 (2.5h)
- [ ] BaseAIProvider 抽象类
- [ ] OpenAI Provider
- [ ] Claude Provider
- [ ] Local Model Provider (Ollama)

### 3. 实现核心功能 (2h)
- [ ] Chat completion
- [ ] Text embedding
- [ ] Stream response handling

### 4. 实现 Prompt 管理 (2h)
- [ ] Prompt 模板存储
- [ ] 预设 Prompt 加载
- [ ] 自定义 Prompt 管理

## 技术规范

### AI Handler
```typescript
// main/modules/ai/ai-handler.ts
import { ipcMain, BrowserWindow } from 'electron';
import { db } from '@/infrastructure/database';
import { AIProviderFactory, type AIProvider, type AIProviderConfig } from './providers';
import { PromptManager } from './prompt-manager';
import { logger } from '@/infrastructure/logger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface EmbeddingOptions {
  model?: string;
}

export interface AICapabilities {
  chat: boolean;
  embedding: boolean;
  imageGeneration: boolean;
  audioTranscription: boolean;
}

class AIHandler {
  private mainWindow: BrowserWindow | null = null;
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: AIProvider | null = null;
  private promptManager: PromptManager;
  private streamAbortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.promptManager = new PromptManager();
  }

  register(): void {
    // Provider management
    ipcMain.handle('ai:list-providers', this.listProviders.bind(this));
    ipcMain.handle('ai:get-active-provider', this.getActiveProvider.bind(this));
    ipcMain.handle('ai:set-active-provider', this.setActiveProvider.bind(this));
    ipcMain.handle('ai:add-provider', this.addProvider.bind(this));
    ipcMain.handle('ai:remove-provider', this.removeProvider.bind(this));
    ipcMain.handle('ai:test-provider', this.testProvider.bind(this));
    ipcMain.handle('ai:get-capabilities', this.getCapabilities.bind(this));

    // Chat
    ipcMain.handle('ai:chat', this.chat.bind(this));
    ipcMain.handle('ai:chat-stream', this.chatStream.bind(this));
    ipcMain.handle('ai:abort-stream', this.abortStream.bind(this));

    // Embedding
    ipcMain.handle('ai:embed', this.embed.bind(this));
    ipcMain.handle('ai:embed-batch', this.embedBatch.bind(this));

    // Prompt management
    ipcMain.handle('ai:list-prompts', this.listPrompts.bind(this));
    ipcMain.handle('ai:get-prompt', this.getPrompt.bind(this));
    ipcMain.handle('ai:save-prompt', this.savePrompt.bind(this));
    ipcMain.handle('ai:delete-prompt', this.deletePrompt.bind(this));
    ipcMain.handle('ai:get-system-prompts', this.getSystemPrompts.bind(this));

    // Model info
    ipcMain.handle('ai:list-models', this.listModels.bind(this));
    ipcMain.handle('ai:get-model-info', this.getModelInfo.bind(this));

    logger.info('[AIHandler] Registered');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async initialize(): Promise<void> {
    // Load saved provider configurations
    const configs = await db.aiProviderConfig.findMany({
      where: { enabled: true },
    });

    for (const config of configs) {
      try {
        const provider = AIProviderFactory.create(config.type, config);
        this.providers.set(config.id, provider);

        if (config.isDefault) {
          this.activeProvider = provider;
        }
      } catch (error) {
        logger.error(`[AIHandler] Failed to initialize provider ${config.id}:`, error);
      }
    }

    // Initialize prompt manager
    await this.promptManager.initialize();

    logger.info('[AIHandler] Initialized with', this.providers.size, 'providers');
  }

  // Provider Management
  private async listProviders(): Promise<AIProviderConfig[]> {
    const configs = await db.aiProviderConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return configs;
  }

  private async getActiveProvider(): Promise<AIProviderConfig | null> {
    if (!this.activeProvider) return null;

    const config = await db.aiProviderConfig.findFirst({
      where: { isDefault: true, enabled: true },
    });
    return config;
  }

  private async setActiveProvider(
    _: Electron.IpcMainInvokeEvent,
    providerId: string
  ): Promise<void> {
    // Update database
    await db.aiProviderConfig.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    await db.aiProviderConfig.update({
      where: { id: providerId },
      data: { isDefault: true },
    });

    // Update active provider
    this.activeProvider = this.providers.get(providerId) || null;
  }

  private async addProvider(
    _: Electron.IpcMainInvokeEvent,
    config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AIProviderConfig> {
    // Save to database
    const savedConfig = await db.aiProviderConfig.create({
      data: {
        ...config,
        isDefault: this.providers.size === 0, // First provider is default
      },
    });

    // Create and store provider
    const provider = AIProviderFactory.create(savedConfig.type, savedConfig);
    this.providers.set(savedConfig.id, provider);

    if (savedConfig.isDefault) {
      this.activeProvider = provider;
    }

    return savedConfig;
  }

  private async removeProvider(
    _: Electron.IpcMainInvokeEvent,
    providerId: string
  ): Promise<void> {
    await db.aiProviderConfig.delete({
      where: { id: providerId },
    });

    this.providers.delete(providerId);

    if (this.activeProvider && this.providers.size > 0) {
      // Set first remaining provider as active
      const firstProvider = Array.from(this.providers.values())[0];
      this.activeProvider = firstProvider;
    } else {
      this.activeProvider = null;
    }
  }

  private async testProvider(
    _: Electron.IpcMainInvokeEvent,
    providerId: string
  ): Promise<{ success: boolean; message: string }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { success: false, message: 'Provider not found' };
    }

    try {
      const result = await provider.test();
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getCapabilities(
    _: Electron.IpcMainInvokeEvent,
    providerId?: string
  ): Promise<AICapabilities> {
    const provider = providerId
      ? this.providers.get(providerId)
      : this.activeProvider;

    if (!provider) {
      return {
        chat: false,
        embedding: false,
        imageGeneration: false,
        audioTranscription: false,
      };
    }

    return provider.getCapabilities();
  }

  // Chat
  private async chat(
    _: Electron.IpcMainInvokeEvent,
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<string> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured');
    }

    const response = await this.activeProvider.chat(messages, {
      ...options,
      stream: false,
    });

    return response;
  }

  private async chatStream(
    _: Electron.IpcMainInvokeEvent,
    streamId: string,
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<void> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured');
    }

    const abortController = new AbortController();
    this.streamAbortControllers.set(streamId, abortController);

    try {
      const stream = await this.activeProvider.chatStream(messages, {
        ...options,
        signal: abortController.signal,
      });

      for await (const chunk of stream) {
        if (abortController.signal.aborted) break;

        this.mainWindow?.webContents.send('ai:stream-chunk', {
          streamId,
          chunk,
        });
      }

      this.mainWindow?.webContents.send('ai:stream-end', { streamId });
    } catch (error) {
      if (!abortController.signal.aborted) {
        this.mainWindow?.webContents.send('ai:stream-error', {
          streamId,
          error: error instanceof Error ? error.message : 'Stream error',
        });
      }
    } finally {
      this.streamAbortControllers.delete(streamId);
    }
  }

  private async abortStream(
    _: Electron.IpcMainInvokeEvent,
    streamId: string
  ): Promise<void> {
    const controller = this.streamAbortControllers.get(streamId);
    if (controller) {
      controller.abort();
      this.streamAbortControllers.delete(streamId);
    }
  }

  // Embedding
  private async embed(
    _: Electron.IpcMainInvokeEvent,
    text: string,
    options?: EmbeddingOptions
  ): Promise<number[]> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured');
    }

    return this.activeProvider.embed(text, options);
  }

  private async embedBatch(
    _: Electron.IpcMainInvokeEvent,
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<number[][]> {
    if (!this.activeProvider) {
      throw new Error('No AI provider configured');
    }

    return this.activeProvider.embedBatch(texts, options);
  }

  // Prompt Management
  private async listPrompts(): Promise<any[]> {
    return this.promptManager.listPrompts();
  }

  private async getPrompt(
    _: Electron.IpcMainInvokeEvent,
    promptId: string
  ): Promise<any> {
    return this.promptManager.getPrompt(promptId);
  }

  private async savePrompt(
    _: Electron.IpcMainInvokeEvent,
    prompt: any
  ): Promise<any> {
    return this.promptManager.savePrompt(prompt);
  }

  private async deletePrompt(
    _: Electron.IpcMainInvokeEvent,
    promptId: string
  ): Promise<void> {
    return this.promptManager.deletePrompt(promptId);
  }

  private async getSystemPrompts(): Promise<any[]> {
    return this.promptManager.getSystemPrompts();
  }

  // Model Info
  private async listModels(
    _: Electron.IpcMainInvokeEvent,
    providerId?: string
  ): Promise<any[]> {
    const provider = providerId
      ? this.providers.get(providerId)
      : this.activeProvider;

    if (!provider) {
      return [];
    }

    return provider.listModels();
  }

  private async getModelInfo(
    _: Electron.IpcMainInvokeEvent,
    modelId: string
  ): Promise<any> {
    if (!this.activeProvider) {
      return null;
    }

    return this.activeProvider.getModelInfo(modelId);
  }
}

export const aiHandler = new AIHandler();
```

### AI Provider Interface
```typescript
// main/modules/ai/providers/base.ts
import type {
  ChatMessage,
  ChatOptions,
  EmbeddingOptions,
  AICapabilities,
} from '../ai-handler';

export interface AIProviderConfig {
  id: string;
  type: 'openai' | 'claude' | 'ollama' | 'custom';
  name: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  enabled: boolean;
  isDefault: boolean;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing?: {
    input: number;
    output: number;
  };
  capabilities: string[];
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;

  abstract chatStream(
    messages: ChatMessage[],
    options?: ChatOptions & { signal?: AbortSignal }
  ): AsyncIterable<string>;

  abstract embed(text: string, options?: EmbeddingOptions): Promise<number[]>;

  abstract embedBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<number[][]>;

  abstract test(): Promise<{ success: boolean; message: string }>;

  abstract getCapabilities(): AICapabilities;

  abstract listModels(): Promise<ModelInfo[]>;

  abstract getModelInfo(modelId: string): Promise<ModelInfo | null>;
}

export interface AIProvider extends BaseAIProvider {}
```

### OpenAI Provider
```typescript
// main/modules/ai/providers/openai-provider.ts
import OpenAI from 'openai';
import { BaseAIProvider, type AIProviderConfig, type ModelInfo } from './base';
import type {
  ChatMessage,
  ChatOptions,
  EmbeddingOptions,
  AICapabilities,
} from '../ai-handler';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(config: AIProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.config.defaultModel || 'gpt-4o-mini',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions & { signal?: AbortSignal }
  ): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.config.defaultModel || 'gpt-4o-mini',
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      if (options?.signal?.aborted) break;
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: options?.model || 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  async embedBatch(
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: options?.model || 'text-embedding-3-small',
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }

  async test(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.models.list();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  getCapabilities(): AICapabilities {
    return {
      chat: true,
      embedding: true,
      imageGeneration: true,
      audioTranscription: true,
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await this.client.models.list();
    return response.data
      .filter((m) => m.id.includes('gpt') || m.id.includes('embedding'))
      .map((m) => ({
        id: m.id,
        name: m.id,
        provider: 'openai',
        contextWindow: this.getContextWindow(m.id),
        maxOutputTokens: this.getMaxOutput(m.id),
        capabilities: this.getModelCapabilities(m.id),
      }));
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    const models = await this.listModels();
    return models.find((m) => m.id === modelId) || null;
  }

  private getContextWindow(modelId: string): number {
    if (modelId.includes('gpt-4o')) return 128000;
    if (modelId.includes('gpt-4-turbo')) return 128000;
    if (modelId.includes('gpt-4')) return 8192;
    if (modelId.includes('gpt-3.5-turbo-16k')) return 16385;
    if (modelId.includes('gpt-3.5')) return 4096;
    return 4096;
  }

  private getMaxOutput(modelId: string): number {
    if (modelId.includes('gpt-4o')) return 16384;
    if (modelId.includes('gpt-4-turbo')) return 4096;
    if (modelId.includes('gpt-4')) return 8192;
    return 4096;
  }

  private getModelCapabilities(modelId: string): string[] {
    const caps = ['chat'];
    if (modelId.includes('gpt-4')) caps.push('function_calling', 'vision');
    if (modelId.includes('embedding')) caps.push('embedding');
    return caps;
  }
}
```

### Provider Factory
```typescript
// main/modules/ai/providers/factory.ts
import { BaseAIProvider, type AIProviderConfig } from './base';
import { OpenAIProvider } from './openai-provider';
import { ClaudeProvider } from './claude-provider';
import { OllamaProvider } from './ollama-provider';

export class AIProviderFactory {
  static create(
    type: AIProviderConfig['type'],
    config: AIProviderConfig
  ): BaseAIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'custom':
        // Custom provider uses OpenAI-compatible API
        return new OpenAIProvider(config);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}
```

### Prompt Manager
```typescript
// main/modules/ai/prompt-manager.ts
import { db } from '@/infrastructure/database';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { app } from 'electron';

export interface Prompt {
  id: string;
  name: string;
  description?: string;
  template: string;
  category: 'system' | 'task' | 'writing' | 'analysis' | 'custom';
  variables: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PromptManager {
  private systemPrompts: Map<string, Prompt> = new Map();

  async initialize(): Promise<void> {
    await this.loadSystemPrompts();
  }

  private async loadSystemPrompts(): Promise<void> {
    const promptsPath = join(app.getAppPath(), 'resources', 'prompts');

    const systemPromptDefinitions: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Task Analysis',
        description: '分析任务并提供建议',
        template: `分析以下任务并提供执行建议：

任务: {{task}}
截止日期: {{deadline}}
优先级: {{priority}}

请提供：
1. 任务分解建议
2. 时间估算
3. 潜在风险
4. 执行步骤`,
        category: 'task',
        variables: ['task', 'deadline', 'priority'],
        isSystem: true,
      },
      {
        name: 'Goal Planning',
        description: '目标规划助手',
        template: `帮我规划以下目标：

目标: {{goal}}
时间范围: {{timeframe}}
当前状态: {{currentStatus}}

请提供：
1. 里程碑分解
2. 关键结果设定
3. 风险评估
4. 行动计划`,
        category: 'task',
        variables: ['goal', 'timeframe', 'currentStatus'],
        isSystem: true,
      },
      {
        name: 'Writing Assistant',
        description: '写作辅助',
        template: `请帮我{{action}}以下内容：

{{content}}

要求：
- 风格: {{style}}
- 长度: {{length}}
- 语气: {{tone}}`,
        category: 'writing',
        variables: ['action', 'content', 'style', 'length', 'tone'],
        isSystem: true,
      },
      {
        name: 'Daily Summary',
        description: '每日总结生成',
        template: `基于以下数据生成今日总结：

完成任务: {{completedTasks}}
进行中任务: {{inProgressTasks}}
专注时间: {{focusTime}}
完成的目标进度: {{goalProgress}}

请生成一份简洁的日报，包含亮点和改进建议。`,
        category: 'analysis',
        variables: ['completedTasks', 'inProgressTasks', 'focusTime', 'goalProgress'],
        isSystem: true,
      },
    ];

    for (const def of systemPromptDefinitions) {
      const id = `system_${def.name.toLowerCase().replace(/\s+/g, '_')}`;
      this.systemPrompts.set(id, {
        ...def,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async listPrompts(): Promise<Prompt[]> {
    const customPrompts = await db.prompt.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return [
      ...Array.from(this.systemPrompts.values()),
      ...customPrompts,
    ];
  }

  async getPrompt(promptId: string): Promise<Prompt | null> {
    if (this.systemPrompts.has(promptId)) {
      return this.systemPrompts.get(promptId)!;
    }

    return db.prompt.findUnique({
      where: { id: promptId },
    });
  }

  async savePrompt(prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
    return db.prompt.create({
      data: {
        ...prompt,
        isSystem: false,
      },
    });
  }

  async deletePrompt(promptId: string): Promise<void> {
    if (this.systemPrompts.has(promptId)) {
      throw new Error('Cannot delete system prompt');
    }

    await db.prompt.delete({
      where: { id: promptId },
    });
  }

  getSystemPrompts(): Prompt[] {
    return Array.from(this.systemPrompts.values());
  }
}
```

## 验收标准

- [ ] AI Handler 正确注册所有 IPC 通道
- [ ] Provider 系统支持多个提供商
- [ ] OpenAI Provider 正常工作
- [ ] 流式响应正确传递到渲染进程
- [ ] Embedding 功能正常
- [ ] Prompt 管理功能完整
- [ ] 错误处理完善
- [ ] TypeScript 类型检查通过

## 相关文件

- `main/modules/ai/ai-handler.ts`
- `main/modules/ai/providers/base.ts`
- `main/modules/ai/providers/openai-provider.ts`
- `main/modules/ai/providers/claude-provider.ts`
- `main/modules/ai/providers/ollama-provider.ts`
- `main/modules/ai/providers/factory.ts`
- `main/modules/ai/prompt-manager.ts`
