# Story 13.41: AI 模块 Store 实现

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.41 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 5: AI 与通知模块 |
| 优先级 | P1 (High) |
| 预估工时 | 5h |
| 前置依赖 | Story 13.40 (AI IPC Client) |
| 关联模块 | AI |

## 目标

实现 AI 模块的 Zustand Store，管理 AI 状态、对话历史、Provider 配置和 Prompt 模板。

## 任务列表

### 1. 创建 AI Store (2h)
- [ ] 状态定义
- [ ] Provider 状态管理
- [ ] 对话历史管理
- [ ] 初始化逻辑

### 2. 实现对话管理 (1.5h)
- [ ] 对话会话管理
- [ ] 消息历史
- [ ] Token 统计

### 3. 实现 Prompt Store (1h)
- [ ] Prompt 列表管理
- [ ] Prompt 缓存
- [ ] 模板应用

### 4. 创建选择器和 Hooks (0.5h)
- [ ] 状态选择器
- [ ] 便捷 Hooks

## 技术规范

### AI Store
```typescript
// renderer/modules/ai/store/ai-store.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  aiIPCClient,
  type ChatMessage,
  type AIProviderConfig,
  type AICapabilities,
  type ModelInfo,
  type Prompt,
} from '../infrastructure/ipc';
import { nanoid } from 'nanoid';

// Conversation types
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  model?: string;
  createdAt: string;
  updatedAt: string;
  tokenCount?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AIState {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Provider state
  providers: AIProviderConfig[];
  activeProvider: AIProviderConfig | null;
  capabilities: AICapabilities | null;
  models: ModelInfo[];
  selectedModel: string | null;

  // Conversation state
  conversations: Conversation[];
  activeConversationId: string | null;

  // Chat state
  isChatting: boolean;
  isStreaming: boolean;
  streamingResponse: string;

  // Prompts
  prompts: Prompt[];
  systemPrompts: Prompt[];
}

export interface AIActions {
  // Initialization
  initialize: () => Promise<void>;
  reset: () => void;

  // Provider management
  loadProviders: () => Promise<void>;
  setActiveProvider: (providerId: string) => Promise<void>;
  setSelectedModel: (modelId: string) => void;
  addProvider: (config: Omit<AIProviderConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeProvider: (providerId: string) => Promise<void>;

  // Conversation management
  createConversation: (title?: string) => Conversation;
  setActiveConversation: (conversationId: string | null) => void;
  deleteConversation: (conversationId: string) => void;
  clearConversations: () => void;
  updateConversationTitle: (conversationId: string, title: string) => void;

  // Chat
  sendMessage: (content: string, options?: { systemPrompt?: string; model?: string }) => Promise<void>;
  sendMessageStream: (content: string, options?: { systemPrompt?: string; model?: string }) => Promise<void>;
  abortStream: () => void;
  addMessage: (message: ChatMessage) => void;

  // Prompts
  loadPrompts: () => Promise<void>;
  savePrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) => Promise<void>;
  deletePrompt: (promptId: string) => Promise<void>;
  applyPrompt: (promptId: string, variables: Record<string, string>) => Promise<string>;
}

const initialState: AIState = {
  isInitialized: false,
  isLoading: false,
  error: null,
  providers: [],
  activeProvider: null,
  capabilities: null,
  models: [],
  selectedModel: null,
  conversations: [],
  activeConversationId: null,
  isChatting: false,
  isStreaming: false,
  streamingResponse: '',
  prompts: [],
  systemPrompts: [],
};

export const useAIStore = create<AIState & AIActions>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Initialization
        initialize: async () => {
          if (get().isInitialized) return;

          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            await Promise.all([
              get().loadProviders(),
              get().loadPrompts(),
            ]);

            set((state) => {
              state.isInitialized = true;
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Initialization failed';
              state.isLoading = false;
            });
          }
        },

        reset: () => {
          set(initialState);
        },

        // Provider management
        loadProviders: async () => {
          try {
            const [providers, activeProvider, capabilities, models] = await Promise.all([
              aiIPCClient.listProviders(),
              aiIPCClient.getActiveProvider(),
              aiIPCClient.getCapabilities(),
              aiIPCClient.listModels(),
            ]);

            set((state) => {
              state.providers = providers;
              state.activeProvider = activeProvider;
              state.capabilities = capabilities;
              state.models = models;

              if (activeProvider && !state.selectedModel) {
                state.selectedModel = activeProvider.defaultModel || models[0]?.id || null;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to load providers';
            });
          }
        },

        setActiveProvider: async (providerId: string) => {
          await aiIPCClient.setActiveProvider(providerId);
          await get().loadProviders();
        },

        setSelectedModel: (modelId: string) => {
          set((state) => {
            state.selectedModel = modelId;
          });
        },

        addProvider: async (config) => {
          const provider = await aiIPCClient.addProvider(config);
          set((state) => {
            state.providers.push(provider);
            if (provider.isDefault) {
              state.activeProvider = provider;
            }
          });
        },

        removeProvider: async (providerId: string) => {
          await aiIPCClient.removeProvider(providerId);
          set((state) => {
            state.providers = state.providers.filter((p) => p.id !== providerId);
            if (state.activeProvider?.id === providerId) {
              state.activeProvider = state.providers[0] || null;
            }
          });
        },

        // Conversation management
        createConversation: (title?: string) => {
          const conversation: Conversation = {
            id: nanoid(),
            title: title || `对话 ${get().conversations.length + 1}`,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => {
            state.conversations.unshift(conversation);
            state.activeConversationId = conversation.id;
          });

          return conversation;
        },

        setActiveConversation: (conversationId: string | null) => {
          set((state) => {
            state.activeConversationId = conversationId;
            state.streamingResponse = '';
          });
        },

        deleteConversation: (conversationId: string) => {
          set((state) => {
            state.conversations = state.conversations.filter((c) => c.id !== conversationId);
            if (state.activeConversationId === conversationId) {
              state.activeConversationId = state.conversations[0]?.id || null;
            }
          });
        },

        clearConversations: () => {
          set((state) => {
            state.conversations = [];
            state.activeConversationId = null;
          });
        },

        updateConversationTitle: (conversationId: string, title: string) => {
          set((state) => {
            const conv = state.conversations.find((c) => c.id === conversationId);
            if (conv) {
              conv.title = title;
              conv.updatedAt = new Date().toISOString();
            }
          });
        },

        // Chat
        sendMessage: async (content: string, options) => {
          const state = get();
          let conversationId = state.activeConversationId;

          // Create conversation if none active
          if (!conversationId) {
            const conv = state.createConversation();
            conversationId = conv.id;
          }

          // Add user message
          const userMessage: ChatMessage = { role: 'user', content };
          get().addMessage(userMessage);

          set((s) => {
            s.isChatting = true;
            s.error = null;
          });

          try {
            const conversation = get().conversations.find((c) => c.id === conversationId);
            const messages: ChatMessage[] = [];

            // Add system prompt if provided
            if (options?.systemPrompt) {
              messages.push({ role: 'system', content: options.systemPrompt });
            }

            // Add conversation history
            if (conversation) {
              messages.push(...conversation.messages);
            }

            const response = await aiIPCClient.chat(messages, {
              model: options?.model || state.selectedModel || undefined,
            });

            // Add assistant response
            const assistantMessage: ChatMessage = { role: 'assistant', content: response };
            get().addMessage(assistantMessage);

            // Auto-generate title for new conversations
            if (conversation && conversation.messages.length === 2 && conversation.title.startsWith('对话 ')) {
              const title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
              get().updateConversationTitle(conversationId!, title);
            }
          } catch (error) {
            set((s) => {
              s.error = error instanceof Error ? error.message : 'Chat failed';
            });
          } finally {
            set((s) => {
              s.isChatting = false;
            });
          }
        },

        sendMessageStream: async (content: string, options) => {
          const state = get();
          let conversationId = state.activeConversationId;

          if (!conversationId) {
            const conv = state.createConversation();
            conversationId = conv.id;
          }

          const userMessage: ChatMessage = { role: 'user', content };
          get().addMessage(userMessage);

          set((s) => {
            s.isChatting = true;
            s.isStreaming = true;
            s.streamingResponse = '';
            s.error = null;
          });

          try {
            const conversation = get().conversations.find((c) => c.id === conversationId);
            const messages: ChatMessage[] = [];

            if (options?.systemPrompt) {
              messages.push({ role: 'system', content: options.systemPrompt });
            }

            if (conversation) {
              messages.push(...conversation.messages);
            }

            await aiIPCClient.chatStream(
              messages,
              {
                onChunk: (chunk) => {
                  set((s) => {
                    s.streamingResponse += chunk;
                  });
                },
                onEnd: () => {
                  const response = get().streamingResponse;
                  const assistantMessage: ChatMessage = { role: 'assistant', content: response };
                  get().addMessage(assistantMessage);

                  set((s) => {
                    s.isStreaming = false;
                    s.isChatting = false;
                    s.streamingResponse = '';
                  });
                },
                onError: (error) => {
                  set((s) => {
                    s.error = error;
                    s.isStreaming = false;
                    s.isChatting = false;
                  });
                },
              },
              { model: options?.model || state.selectedModel || undefined }
            );
          } catch (error) {
            set((s) => {
              s.error = error instanceof Error ? error.message : 'Stream failed';
              s.isStreaming = false;
              s.isChatting = false;
            });
          }
        },

        abortStream: () => {
          const state = get();
          if (state.isStreaming) {
            // The actual abort is handled in IPC client
            set((s) => {
              s.isStreaming = false;
              s.isChatting = false;

              // Save partial response if any
              if (s.streamingResponse) {
                const assistantMessage: ChatMessage = {
                  role: 'assistant',
                  content: s.streamingResponse + ' [已中断]',
                };
                const conv = s.conversations.find((c) => c.id === s.activeConversationId);
                if (conv) {
                  conv.messages.push(assistantMessage);
                  conv.updatedAt = new Date().toISOString();
                }
              }

              s.streamingResponse = '';
            });
          }
        },

        addMessage: (message: ChatMessage) => {
          set((state) => {
            const conv = state.conversations.find((c) => c.id === state.activeConversationId);
            if (conv) {
              conv.messages.push(message);
              conv.updatedAt = new Date().toISOString();
            }
          });
        },

        // Prompts
        loadPrompts: async () => {
          try {
            const [prompts, systemPrompts] = await Promise.all([
              aiIPCClient.listPrompts(),
              aiIPCClient.getSystemPrompts(),
            ]);

            set((state) => {
              state.prompts = prompts;
              state.systemPrompts = systemPrompts;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to load prompts';
            });
          }
        },

        savePrompt: async (prompt) => {
          const saved = await aiIPCClient.savePrompt(prompt);
          set((state) => {
            state.prompts.push(saved);
          });
        },

        deletePrompt: async (promptId: string) => {
          await aiIPCClient.deletePrompt(promptId);
          set((state) => {
            state.prompts = state.prompts.filter((p) => p.id !== promptId);
          });
        },

        applyPrompt: async (promptId: string, variables: Record<string, string>) => {
          return aiIPCClient.applyPromptTemplate(promptId, variables);
        },
      })),
      {
        name: 'ai-store',
        partialize: (state) => ({
          conversations: state.conversations,
          activeConversationId: state.activeConversationId,
          selectedModel: state.selectedModel,
        }),
      }
    )
  )
);
```

### Selectors
```typescript
// renderer/modules/ai/store/selectors.ts
import { useAIStore, type AIState } from './ai-store';

export const aiSelectors = {
  // Provider selectors
  isAIAvailable: (state: AIState) =>
    state.isInitialized && state.activeProvider !== null,

  canChat: (state: AIState) =>
    state.capabilities?.chat ?? false,

  canEmbed: (state: AIState) =>
    state.capabilities?.embedding ?? false,

  // Conversation selectors
  activeConversation: (state: AIState) =>
    state.conversations.find((c) => c.id === state.activeConversationId) ?? null,

  conversationCount: (state: AIState) =>
    state.conversations.length,

  hasActiveConversation: (state: AIState) =>
    state.activeConversationId !== null,

  // Message selectors
  activeMessages: (state: AIState) =>
    aiSelectors.activeConversation(state)?.messages ?? [],

  messageCount: (state: AIState) =>
    aiSelectors.activeMessages(state).length,

  // Status selectors
  isBusy: (state: AIState) =>
    state.isChatting || state.isStreaming,

  currentResponse: (state: AIState) =>
    state.isStreaming ? state.streamingResponse : null,

  // Prompt selectors
  customPrompts: (state: AIState) =>
    state.prompts.filter((p) => !p.isSystem),

  promptsByCategory: (state: AIState) => (category: string) =>
    state.prompts.filter((p) => p.category === category),
};
```

### Hooks
```typescript
// renderer/modules/ai/store/hooks.ts
import { useCallback, useMemo } from 'react';
import { useAIStore, aiSelectors } from './index';
import type { ChatMessage } from '../infrastructure/ipc';

export function useAI() {
  const store = useAIStore();
  
  return {
    isInitialized: store.isInitialized,
    isLoading: store.isLoading,
    error: store.error,
    isAvailable: aiSelectors.isAIAvailable(store),
    capabilities: store.capabilities,
    initialize: store.initialize,
  };
}

export function useAIChat() {
  const store = useAIStore();
  const activeConversation = aiSelectors.activeConversation(store);

  const send = useCallback(
    async (content: string, stream = true) => {
      if (stream) {
        await store.sendMessageStream(content);
      } else {
        await store.sendMessage(content);
      }
    },
    [store]
  );

  return {
    messages: activeConversation?.messages ?? [],
    isChatting: store.isChatting,
    isStreaming: store.isStreaming,
    streamingResponse: store.streamingResponse,
    error: store.error,
    send,
    abort: store.abortStream,
    createConversation: store.createConversation,
  };
}

export function useConversations() {
  const store = useAIStore();

  return {
    conversations: store.conversations,
    activeConversationId: store.activeConversationId,
    setActiveConversation: store.setActiveConversation,
    createConversation: store.createConversation,
    deleteConversation: store.deleteConversation,
    clearConversations: store.clearConversations,
    updateTitle: store.updateConversationTitle,
  };
}

export function useAIProviders() {
  const store = useAIStore();

  return {
    providers: store.providers,
    activeProvider: store.activeProvider,
    models: store.models,
    selectedModel: store.selectedModel,
    setActiveProvider: store.setActiveProvider,
    setSelectedModel: store.setSelectedModel,
    addProvider: store.addProvider,
    removeProvider: store.removeProvider,
  };
}

export function usePrompts() {
  const store = useAIStore();

  const customPrompts = useMemo(
    () => store.prompts.filter((p) => !p.isSystem),
    [store.prompts]
  );

  return {
    prompts: store.prompts,
    systemPrompts: store.systemPrompts,
    customPrompts,
    savePrompt: store.savePrompt,
    deletePrompt: store.deletePrompt,
    applyPrompt: store.applyPrompt,
  };
}
```

### Index Export
```typescript
// renderer/modules/ai/store/index.ts
export { useAIStore, type AIState, type AIActions, type Conversation } from './ai-store';
export { aiSelectors } from './selectors';
export { useAI, useAIChat, useConversations, useAIProviders, usePrompts } from './hooks';
```

## 验收标准

- [ ] AI Store 状态管理正确
- [ ] Provider 状态同步正常
- [ ] 对话历史正确管理
- [ ] 流式响应状态正确更新
- [ ] Prompt 管理功能正常
- [ ] 对话持久化正常
- [ ] Hooks 正常工作
- [ ] TypeScript 类型检查通过

## 相关文件

- `renderer/modules/ai/store/ai-store.ts`
- `renderer/modules/ai/store/selectors.ts`
- `renderer/modules/ai/store/hooks.ts`
- `renderer/modules/ai/store/index.ts`
