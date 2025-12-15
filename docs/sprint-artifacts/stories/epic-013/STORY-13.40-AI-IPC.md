# Story 13.40: AI 模块 IPC Client 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.40 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 4h |
| 前置依赖 | Story 13.39 (AI Main Handler) |
| 关联模块 | AI |

## 目标

实现 AI 模块的渲染进程 IPC Client，提供类型安全的 AI 能力调用接口。

## 任务列表

### 1. 创建 AIIPCClient 类 (2h)
- [ ] Provider 管理方法
- [ ] Chat 方法 (普通和流式)
- [ ] Embedding 方法
- [ ] Prompt 管理方法

### 2. 实现流式响应处理 (1.5h)
- [ ] Stream 监听
- [ ] 事件回调
- [ ] 中止控制

### 3. 类型定义与导出 (0.5h)
- [ ] 完整类型定义
- [ ] 模块导出

## 技术规范

### AI IPC Client
```typescript
// renderer/modules/ai/infrastructure/ipc/ai-ipc-client.ts
import { BaseIPCClient } from '@/infrastructure/ipc';
import { nanoid } from 'nanoid';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface EmbeddingOptions {
  model?: string;
}

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
  createdAt: string;
  updatedAt: string;
}

export interface AICapabilities {
  chat: boolean;
  embedding: boolean;
  imageGeneration: boolean;
  audioTranscription: boolean;
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

export interface Prompt {
  id: string;
  name: string;
  description?: string;
  template: string;
  category: 'system' | 'task' | 'writing' | 'analysis' | 'custom';
  variables: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onEnd: () => void;
  onError: (error: string) => void;
}

class AIIPCClient extends BaseIPCClient {
  private activeStreams: Map<string, StreamCallbacks> = new Map();

  constructor() {
    super('ai');
    this.setupStreamListeners();
  }

  private setupStreamListeners(): void {
    // Listen for stream chunks
    this.on('stream-chunk', ({ streamId, chunk }: { streamId: string; chunk: string }) => {
      const callbacks = this.activeStreams.get(streamId);
      if (callbacks) {
        callbacks.onChunk(chunk);
      }
    });

    // Listen for stream end
    this.on('stream-end', ({ streamId }: { streamId: string }) => {
      const callbacks = this.activeStreams.get(streamId);
      if (callbacks) {
        callbacks.onEnd();
        this.activeStreams.delete(streamId);
      }
    });

    // Listen for stream errors
    this.on('stream-error', ({ streamId, error }: { streamId: string; error: string }) => {
      const callbacks = this.activeStreams.get(streamId);
      if (callbacks) {
        callbacks.onError(error);
        this.activeStreams.delete(streamId);
      }
    });
  }

  // Provider Management
  async listProviders(): Promise<AIProviderConfig[]> {
    return this.invoke<AIProviderConfig[]>('list-providers');
  }

  async getActiveProvider(): Promise<AIProviderConfig | null> {
    return this.invoke<AIProviderConfig | null>('get-active-provider');
  }

  async setActiveProvider(providerId: string): Promise<void> {
    return this.invoke<void>('set-active-provider', providerId);
  }

  async addProvider(
    config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AIProviderConfig> {
    return this.invoke<AIProviderConfig>('add-provider', config);
  }

  async removeProvider(providerId: string): Promise<void> {
    return this.invoke<void>('remove-provider', providerId);
  }

  async testProvider(providerId: string): Promise<{ success: boolean; message: string }> {
    return this.invoke<{ success: boolean; message: string }>('test-provider', providerId);
  }

  async getCapabilities(providerId?: string): Promise<AICapabilities> {
    return this.invoke<AICapabilities>('get-capabilities', providerId);
  }

  // Chat
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    return this.invoke<string>('chat', messages, options);
  }

  async chatStream(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    options?: ChatOptions
  ): Promise<{ streamId: string; abort: () => void }> {
    const streamId = nanoid();
    
    // Register callbacks
    this.activeStreams.set(streamId, callbacks);

    // Start stream
    await this.invoke<void>('chat-stream', streamId, messages, options);

    return {
      streamId,
      abort: () => {
        this.abortStream(streamId);
      },
    };
  }

  async abortStream(streamId: string): Promise<void> {
    this.activeStreams.delete(streamId);
    return this.invoke<void>('abort-stream', streamId);
  }

  // Embedding
  async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
    return this.invoke<number[]>('embed', text, options);
  }

  async embedBatch(texts: string[], options?: EmbeddingOptions): Promise<number[][]> {
    return this.invoke<number[][]>('embed-batch', texts, options);
  }

  // Prompt Management
  async listPrompts(): Promise<Prompt[]> {
    return this.invoke<Prompt[]>('list-prompts');
  }

  async getPrompt(promptId: string): Promise<Prompt | null> {
    return this.invoke<Prompt | null>('get-prompt', promptId);
  }

  async savePrompt(
    prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>
  ): Promise<Prompt> {
    return this.invoke<Prompt>('save-prompt', prompt);
  }

  async deletePrompt(promptId: string): Promise<void> {
    return this.invoke<void>('delete-prompt', promptId);
  }

  async getSystemPrompts(): Promise<Prompt[]> {
    return this.invoke<Prompt[]>('get-system-prompts');
  }

  // Model Info
  async listModels(providerId?: string): Promise<ModelInfo[]> {
    return this.invoke<ModelInfo[]>('list-models', providerId);
  }

  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    return this.invoke<ModelInfo | null>('get-model-info', modelId);
  }

  // Utility Methods
  async applyPromptTemplate(promptId: string, variables: Record<string, string>): Promise<string> {
    const prompt = await this.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    let result = prompt.template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return result;
  }
}

export const aiIPCClient = new AIIPCClient();
```

### Chat Stream Hook
```typescript
// renderer/modules/ai/infrastructure/ipc/use-chat-stream.ts
import { useState, useCallback, useRef } from 'react';
import { aiIPCClient, type ChatMessage, type ChatOptions } from './ai-ipc-client';

export interface UseChatStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

export interface UseChatStreamReturn {
  isStreaming: boolean;
  response: string;
  error: string | null;
  startStream: (messages: ChatMessage[], options?: ChatOptions) => Promise<void>;
  abort: () => void;
}

export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const abortRef = useRef<(() => void) | null>(null);
  const responseRef = useRef('');

  const startStream = useCallback(
    async (messages: ChatMessage[], chatOptions?: ChatOptions) => {
      setIsStreaming(true);
      setResponse('');
      setError(null);
      responseRef.current = '';

      try {
        const { abort } = await aiIPCClient.chatStream(
          messages,
          {
            onChunk: (chunk) => {
              responseRef.current += chunk;
              setResponse(responseRef.current);
              options.onChunk?.(chunk);
            },
            onEnd: () => {
              setIsStreaming(false);
              options.onComplete?.(responseRef.current);
            },
            onError: (err) => {
              setIsStreaming(false);
              setError(err);
              options.onError?.(err);
            },
          },
          chatOptions
        );

        abortRef.current = abort;
      } catch (err) {
        setIsStreaming(false);
        const message = err instanceof Error ? err.message : 'Stream failed';
        setError(message);
        options.onError?.(message);
      }
    },
    [options]
  );

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  return {
    isStreaming,
    response,
    error,
    startStream,
    abort,
  };
}
```

### Chat Completion Hook
```typescript
// renderer/modules/ai/infrastructure/ipc/use-chat.ts
import { useState, useCallback } from 'react';
import { aiIPCClient, type ChatMessage, type ChatOptions } from './ai-ipc-client';

export interface UseChatReturn {
  isLoading: boolean;
  response: string | null;
  error: string | null;
  sendMessage: (messages: ChatMessage[], options?: ChatOptions) => Promise<string | null>;
  reset: () => void;
}

export function useChat(): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (messages: ChatMessage[], options?: ChatOptions): Promise<string | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await aiIPCClient.chat(messages, options);
        setResponse(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Chat failed';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    isLoading,
    response,
    error,
    sendMessage,
    reset,
  };
}
```

### Provider Management Hook
```typescript
// renderer/modules/ai/infrastructure/ipc/use-ai-provider.ts
import { useState, useEffect, useCallback } from 'react';
import {
  aiIPCClient,
  type AIProviderConfig,
  type AICapabilities,
  type ModelInfo,
} from './ai-ipc-client';

export interface UseAIProviderReturn {
  providers: AIProviderConfig[];
  activeProvider: AIProviderConfig | null;
  capabilities: AICapabilities | null;
  models: ModelInfo[];
  isLoading: boolean;
  error: string | null;
  setActiveProvider: (providerId: string) => Promise<void>;
  addProvider: (config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeProvider: (providerId: string) => Promise<void>;
  testProvider: (providerId: string) => Promise<{ success: boolean; message: string }>;
  refresh: () => Promise<void>;
}

export function useAIProvider(): UseAIProviderReturn {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [activeProvider, setActiveProviderState] = useState<AIProviderConfig | null>(null);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [providerList, active, caps, modelList] = await Promise.all([
        aiIPCClient.listProviders(),
        aiIPCClient.getActiveProvider(),
        aiIPCClient.getCapabilities(),
        aiIPCClient.listModels(),
      ]);

      setProviders(providerList);
      setActiveProviderState(active);
      setCapabilities(caps);
      setModels(modelList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const setActiveProvider = useCallback(async (providerId: string) => {
    await aiIPCClient.setActiveProvider(providerId);
    await loadProviders();
  }, [loadProviders]);

  const addProvider = useCallback(
    async (config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      await aiIPCClient.addProvider(config);
      await loadProviders();
    },
    [loadProviders]
  );

  const removeProvider = useCallback(
    async (providerId: string) => {
      await aiIPCClient.removeProvider(providerId);
      await loadProviders();
    },
    [loadProviders]
  );

  const testProvider = useCallback(
    async (providerId: string) => {
      return aiIPCClient.testProvider(providerId);
    },
    []
  );

  return {
    providers,
    activeProvider,
    capabilities,
    models,
    isLoading,
    error,
    setActiveProvider,
    addProvider,
    removeProvider,
    testProvider,
    refresh: loadProviders,
  };
}
```

### Index Export
```typescript
// renderer/modules/ai/infrastructure/ipc/index.ts
export { aiIPCClient } from './ai-ipc-client';
export type {
  ChatMessage,
  ChatOptions,
  EmbeddingOptions,
  AIProviderConfig,
  AICapabilities,
  ModelInfo,
  Prompt,
  StreamCallbacks,
} from './ai-ipc-client';

export { useChatStream, type UseChatStreamOptions, type UseChatStreamReturn } from './use-chat-stream';
export { useChat, type UseChatReturn } from './use-chat';
export { useAIProvider, type UseAIProviderReturn } from './use-ai-provider';
```

## 验收标准

- [ ] AI IPC Client 正确封装所有通道
- [ ] 流式响应回调正确触发
- [ ] 中止流式响应正常工作
- [ ] Provider 管理方法正常
- [ ] Chat 和 Embedding 方法正常
- [ ] Prompt 管理方法正常
- [ ] TypeScript 类型检查通过
- [ ] 所有 Hooks 正常工作

## 相关文件

- `renderer/modules/ai/infrastructure/ipc/ai-ipc-client.ts`
- `renderer/modules/ai/infrastructure/ipc/use-chat-stream.ts`
- `renderer/modules/ai/infrastructure/ipc/use-chat.ts`
- `renderer/modules/ai/infrastructure/ipc/use-ai-provider.ts`
- `renderer/modules/ai/infrastructure/ipc/index.ts`
