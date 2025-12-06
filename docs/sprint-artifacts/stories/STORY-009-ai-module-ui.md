# STORY-009: AI 模块界面

## 📋 Story 概述

**Story ID**: STORY-009  
**Epic**: EPIC-002 (Desktop Application Development)  
**优先级**: P2 (增强体验)  
**预估工时**: 4-5 天  
**状态**: 🔵 Ready for Dev  
**前置依赖**: STORY-002, STORY-003, STORY-004

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 通过 AI 助手获得智能建议和规划帮助  
**以便于** 更高效地管理我的目标和日程  

---

## 📋 验收标准

### 功能验收 - AI 对话

- [ ] AI 对话界面（聊天模式）
- [ ] 流式响应显示
- [ ] 对话历史记录
- [ ] 上下文保持
- [ ] 清除对话功能

### 功能验收 - AI 辅助

- [ ] 智能目标建议
- [ ] 日程规划建议
- [ ] 任务分解建议
- [ ] 时间预估建议

### 功能验收 - 模型配置

- [ ] API Key 配置界面
- [ ] 模型选择
- [ ] 参数调整（温度、上下文长度）
- [ ] 模型测试功能

### 技术验收

- [ ] 流式 IPC 通信
- [ ] API Key 安全存储
- [ ] 离线降级处理

---

## 📐 技术设计

### 文件结构

```
apps/desktop/src/
├── renderer/
│   └── views/
│       └── ai/
│           ├── AiChatView.vue          # AI 对话页
│           ├── AiSettingsView.vue      # AI 设置页
│           └── components/
│               ├── ChatMessage.vue     # 消息组件
│               ├── ChatInput.vue       # 输入组件
│               ├── SuggestionCard.vue  # 建议卡片
│               ├── StreamingText.vue   # 流式文本
│               └── ModelSelector.vue   # 模型选择
│
├── shared/
│   └── composables/
│       ├── useAiChat.ts                # AI 对话逻辑
│       ├── useAiSuggestions.ts         # AI 建议逻辑
│       └── useAiSettings.ts            # AI 设置逻辑
│
└── main/
    └── modules/
        └── ai/
            └── aiIpcHandlers.ts        # AI IPC 处理器
```

### 流式响应处理

```typescript
// apps/desktop/src/main/modules/ai/aiIpcHandlers.ts
import { ipcMain, BrowserWindow } from 'electron';
import { AIService } from '@dailyuse/infrastructure-server';

export function registerAiIpcHandlers(mainWindow: BrowserWindow) {
  // 流式聊天
  ipcMain.handle('ai:chat:stream', async (event, request) => {
    const service = container.resolve<AIService>('aiService');
    
    try {
      const stream = await service.chatStream(request);
      
      for await (const chunk of stream) {
        // 发送流式数据到渲染进程
        mainWindow.webContents.send('ai:chat:chunk', {
          id: request.conversationId,
          chunk: chunk.content,
          done: false,
        });
      }
      
      // 发送完成信号
      mainWindow.webContents.send('ai:chat:chunk', {
        id: request.conversationId,
        chunk: '',
        done: true,
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
  
  // 获取建议
  ipcMain.handle('ai:suggestions', async (_, context) => {
    const service = container.resolve<AIService>('aiService');
    return await service.getSuggestions(context);
  });
  
  // 保存 API Key
  ipcMain.handle('ai:saveApiKey', async (_, { provider, apiKey }) => {
    // 使用 safeStorage 安全存储
    const encrypted = safeStorage.encryptString(apiKey);
    store.set(`apiKeys.${provider}`, encrypted.toString('base64'));
    return { success: true };
  });
}
```

### AI Chat Composable

```typescript
// useAiChat.ts
import { ref, computed, onUnmounted } from 'vue';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function useAiChat() {
  // State
  const messages = ref<ChatMessage[]>([]);
  const isStreaming = ref(false);
  const conversationId = ref(crypto.randomUUID());
  
  // 监听流式响应
  const handleChunk = (data: { id: string; chunk: string; done: boolean }) => {
    if (data.id !== conversationId.value) return;
    
    const lastMessage = messages.value[messages.value.length - 1];
    
    if (data.done) {
      isStreaming.value = false;
      if (lastMessage) {
        lastMessage.isStreaming = false;
      }
    } else {
      if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
        lastMessage.content += data.chunk;
      } else {
        messages.value.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.chunk,
          timestamp: new Date(),
          isStreaming: true,
        });
      }
    }
  };
  
  window.electronAPI.on('ai:chat:chunk', handleChunk);
  
  onUnmounted(() => {
    window.electronAPI.off('ai:chat:chunk', handleChunk);
  });
  
  // Actions
  async function sendMessage(content: string) {
    // 添加用户消息
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    });
    
    isStreaming.value = true;
    
    // 开始流式对话
    await window.electronAPI.invoke('ai:chat:stream', {
      conversationId: conversationId.value,
      messages: messages.value.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });
  }
  
  function clearChat() {
    messages.value = [];
    conversationId.value = crypto.randomUUID();
  }
  
  return {
    messages: computed(() => messages.value),
    isStreaming: computed(() => isStreaming.value),
    
    sendMessage,
    clearChat,
  };
}
```

### ChatMessage 组件

```vue
<!-- components/ChatMessage.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { StreamingText } from './StreamingText.vue';

interface Props {
  message: {
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
  };
}

const props = defineProps<Props>();

const isAssistant = computed(() => props.message.role === 'assistant');
</script>

<template>
  <div 
    class="chat-message" 
    :class="{ 'is-assistant': isAssistant }"
  >
    <div class="avatar">
      <span v-if="isAssistant">🤖</span>
      <span v-else>👤</span>
    </div>
    
    <div class="content">
      <StreamingText 
        v-if="message.isStreaming"
        :text="message.content"
      />
      <div v-else v-html="renderMarkdown(message.content)" />
    </div>
  </div>
</template>
```

---

## 🏗️ 技术实现方案 (架构师补充)

> 本节由架构师 Agent 补充，提供详细技术实现指导

### 1. IPC 通道与服务映射 (24 通道)

#### AI Conversation (7 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `ai:conversation:create` | AiConversationService.create() | 创建对话 |
| `ai:conversation:list` | AiConversationService.list() | 列出对话 |
| `ai:conversation:get` | AiConversationService.get() | 获取对话详情 |
| `ai:conversation:update` | AiConversationService.update() | 更新对话 |
| `ai:conversation:delete` | AiConversationService.delete() | 删除对话 |
| `ai:conversation:archive` | AiConversationService.archive() | 归档对话 |
| `ai:conversation:search` | AiConversationService.search() | 搜索对话 |

#### AI Message (3 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `ai:message:send` | AiMessageService.send() | 发送消息 |
| `ai:message:list` | AiMessageService.list() | 列出消息 |
| `ai:message:delete` | AiMessageService.delete() | 删除消息 |

#### AI Generation Task (8 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `ai:generation:start` | AiGenerationService.start() | 开始生成任务 |
| `ai:generation:cancel` | AiGenerationService.cancel() | 取消生成 |
| `ai:generation:status` | AiGenerationService.getStatus() | 获取状态 |
| `ai:generation:result` | AiGenerationService.getResult() | 获取结果 |
| `ai:generation:list` | AiGenerationService.list() | 列出任务 |
| `ai:generation:retry` | AiGenerationService.retry() | 重试任务 |
| `ai:generation:history` | AiGenerationService.getHistory() | 历史记录 |
| `ai:generation:templates` | AiGenerationService.getTemplates() | 获取模板 |

#### AI Provider Config (8 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `ai:provider:list` | AiProviderService.list() | 列出提供商 |
| `ai:provider:get` | AiProviderService.get() | 获取配置 |
| `ai:provider:add` | AiProviderService.add() | 添加提供商 |
| `ai:provider:update` | AiProviderService.update() | 更新配置 |
| `ai:provider:delete` | AiProviderService.delete() | 删除提供商 |
| `ai:provider:test` | AiProviderService.test() | 测试连接 |
| `ai:provider:models` | AiProviderService.getModels() | 获取模型列表 |
| `ai:provider:setDefault` | AiProviderService.setDefault() | 设置默认 |

#### AI Usage Quota (3 通道)

| IPC Channel | Main Process Handler | 说明 |
|-------------|---------------------|------|
| `ai:quota:get` | AiQuotaService.get() | 获取配额 |
| `ai:quota:history` | AiQuotaService.getHistory() | 使用历史 |
| `ai:quota:reset` | AiQuotaService.reset() | 重置周期 |

### 2. 流式响应架构

```
┌────────────────────────────────────────────────────────────────┐
│                    Renderer Process                             │
├────────────────────────────────────────────────────────────────┤
│  useAiChat.ts                                                   │
│  ├── sendMessage() → invoke('ai:message:send', msg)            │
│  └── on('ai:stream:chunk', (chunk) => updateMessage(chunk))    │
│                                                                  │
│  StreamingText.vue                                               │
│  └── 逐字显示 + 打字机效果                                        │
└────────────────────────┬───────────────────────────────────────┘
                         │ IPC Events
┌────────────────────────▼───────────────────────────────────────┐
│                    Main Process                                 │
├────────────────────────────────────────────────────────────────┤
│  ai-ipc.handler.ts                                              │
│  ├── on('ai:message:send') → start streaming                   │
│  ├── AI SDK 回调 → mainWindow.webContents.send('ai:stream:*')  │
│  └── 事件: ai:stream:chunk, ai:stream:done, ai:stream:error    │
└────────────────────────────────────────────────────────────────┘
```

#### 流式事件协议

```typescript
// 流式事件类型
type StreamEventType = 
  | 'ai:stream:start'    // 开始流式响应
  | 'ai:stream:chunk'    // 内容片段
  | 'ai:stream:done'     // 完成
  | 'ai:stream:error';   // 错误

// 事件 payload
interface StreamStartEvent {
  taskId: string;
  conversationId: string;
  messageId: string;
}

interface StreamChunkEvent {
  taskId: string;
  content: string;       // 增量内容
  fullContent: string;   // 累积内容 (可选, 防丢失)
}

interface StreamDoneEvent {
  taskId: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface StreamErrorEvent {
  taskId: string;
  error: string;
  code: string;
}
```

### 3. Renderer 侧实现

#### useAiChat.ts

```typescript
// apps/desktop/src/renderer/composables/useAiChat.ts
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  createdAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
}

export function useAiChat(conversationId?: string) {
  const conversation = ref<Conversation | null>(null);
  const messages = computed(() => conversation.value?.messages || []);
  const isStreaming = ref(false);
  const currentTaskId = ref<string | null>(null);
  const error = ref<string | null>(null);
  
  // 流式监听器
  let offChunk: (() => void) | null = null;
  let offDone: (() => void) | null = null;
  let offError: (() => void) | null = null;
  
  async function loadConversation(id: string) {
    conversation.value = await window.electronAPI.invoke<Conversation>(
      'ai:conversation:get', 
      { id }
    );
  }
  
  async function createConversation(title?: string) {
    conversation.value = await window.electronAPI.invoke<Conversation>(
      'ai:conversation:create',
      { title: title || '新对话' }
    );
    return conversation.value;
  }
  
  async function sendMessage(content: string) {
    if (!conversation.value) {
      await createConversation();
    }
    
    // 添加用户消息
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
    conversation.value!.messages.push(userMessage);
    
    // 创建占位的 AI 消息
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date(),
    };
    conversation.value!.messages.push(assistantMessage);
    
    isStreaming.value = true;
    error.value = null;
    
    try {
      // 设置流式监听器
      setupStreamListeners(assistantMessage.id);
      
      // 发送消息 (返回 taskId)
      const { taskId } = await window.electronAPI.invoke<{ taskId: string }>(
        'ai:message:send',
        {
          conversationId: conversation.value!.id,
          content,
        }
      );
      currentTaskId.value = taskId;
      
    } catch (e) {
      error.value = (e as Error).message;
      // 移除占位消息
      const idx = conversation.value!.messages.findIndex(m => m.id === assistantMessage.id);
      if (idx > -1) {
        conversation.value!.messages.splice(idx, 1);
      }
      isStreaming.value = false;
    }
  }
  
  function setupStreamListeners(messageId: string) {
    // 清理旧监听器
    cleanupListeners();
    
    const updateMessage = (content: string) => {
      if (!conversation.value) return;
      const msg = conversation.value.messages.find(m => m.id === messageId);
      if (msg) {
        msg.content = content;
      }
    };
    
    offChunk = window.electronAPI.on('ai:stream:chunk', (_, event: StreamChunkEvent) => {
      if (event.taskId === currentTaskId.value) {
        updateMessage(event.fullContent || event.content);
      }
    });
    
    offDone = window.electronAPI.on('ai:stream:done', (_, event: StreamDoneEvent) => {
      if (event.taskId === currentTaskId.value) {
        isStreaming.value = false;
        const msg = conversation.value?.messages.find(m => m.id === messageId);
        if (msg) {
          msg.isStreaming = false;
        }
        cleanupListeners();
      }
    });
    
    offError = window.electronAPI.on('ai:stream:error', (_, event: StreamErrorEvent) => {
      if (event.taskId === currentTaskId.value) {
        error.value = event.error;
        isStreaming.value = false;
        cleanupListeners();
      }
    });
  }
  
  function cleanupListeners() {
    offChunk?.();
    offDone?.();
    offError?.();
    offChunk = offDone = offError = null;
  }
  
  async function cancelGeneration() {
    if (currentTaskId.value) {
      await window.electronAPI.invoke('ai:generation:cancel', { taskId: currentTaskId.value });
      isStreaming.value = false;
      cleanupListeners();
    }
  }
  
  async function regenerateLastMessage() {
    if (!conversation.value || conversation.value.messages.length < 2) return;
    
    // 移除最后的 AI 消息
    const messages = conversation.value.messages;
    if (messages[messages.length - 1].role === 'assistant') {
      messages.pop();
    }
    
    // 重新发送最后的用户消息
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content);
    }
  }
  
  onMounted(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  });
  
  onUnmounted(() => {
    cleanupListeners();
  });
  
  return {
    conversation,
    messages,
    isStreaming,
    error,
    sendMessage,
    cancelGeneration,
    regenerateLastMessage,
    createConversation,
    loadConversation,
  };
}
```

#### useAiSuggestions.ts

```typescript
// apps/desktop/src/renderer/composables/useAiSuggestions.ts
import { ref } from 'vue';

interface Suggestion {
  id: string;
  type: 'goal' | 'task' | 'schedule' | 'general';
  title: string;
  description: string;
  confidence: number;
  action?: {
    type: 'create' | 'update' | 'navigate';
    payload: unknown;
  };
}

export function useAiSuggestions() {
  const suggestions = ref<Suggestion[]>([]);
  const isLoading = ref(false);
  
  async function generateSuggestions(context: {
    currentView: string;
    selectedGoal?: string;
    recentTasks?: string[];
  }) {
    isLoading.value = true;
    try {
      const result = await window.electronAPI.invoke<{ suggestions: Suggestion[] }>(
        'ai:generation:start',
        {
          type: 'suggestions',
          context,
        }
      );
      suggestions.value = result.suggestions;
    } finally {
      isLoading.value = false;
    }
  }
  
  async function applySuggestion(suggestion: Suggestion) {
    if (!suggestion.action) return;
    
    switch (suggestion.action.type) {
      case 'create':
        // 调用对应的创建 API
        break;
      case 'update':
        // 调用对应的更新 API
        break;
      case 'navigate':
        // 使用 router 导航
        break;
    }
  }
  
  function dismissSuggestion(id: string) {
    suggestions.value = suggestions.value.filter(s => s.id !== id);
  }
  
  return {
    suggestions,
    isLoading,
    generateSuggestions,
    applySuggestion,
    dismissSuggestion,
  };
}
```

### 4. API Key 安全存储

```typescript
// apps/desktop/src/main/services/ai-config-storage.ts
import { safeStorage } from 'electron';

interface AiProviderConfig {
  id: string;
  provider: 'openai' | 'anthropic' | 'azure' | 'custom';
  name: string;
  baseUrl?: string;
  model: string;
  isDefault: boolean;
  // apiKey 不在这里存储
}

export class AiConfigStorage {
  private configPath: string;
  private keyPath: string;

  async saveApiKey(providerId: string, apiKey: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure storage not available');
    }
    
    const encrypted = safeStorage.encryptString(apiKey);
    // 存储到 userData/ai-keys/${providerId}.enc
    await fs.promises.writeFile(
      path.join(this.keyPath, `${providerId}.enc`),
      encrypted
    );
  }

  async getApiKey(providerId: string): Promise<string | null> {
    const keyFile = path.join(this.keyPath, `${providerId}.enc`);
    if (!fs.existsSync(keyFile)) return null;
    
    const encrypted = await fs.promises.readFile(keyFile);
    return safeStorage.decryptString(encrypted);
  }

  async testConnection(config: AiProviderConfig): Promise<{ success: boolean; error?: string }> {
    const apiKey = await this.getApiKey(config.id);
    if (!apiKey) {
      return { success: false, error: 'API Key not configured' };
    }
    
    // 调用 AI SDK 测试
    try {
      await testAiProvider({
        provider: config.provider,
        apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }
}
```

### 5. 支持的 AI 提供商

| 提供商 | SDK | 特点 |
|-------|-----|------|
| OpenAI | `@ai-sdk/openai` | GPT-4, GPT-3.5 |
| Anthropic | `@ai-sdk/anthropic` | Claude 3 |
| Azure OpenAI | `@ai-sdk/azure` | 企业级 |
| Ollama | 自定义 | 本地模型 |
| Custom | OpenAI 兼容 | 自定义端点 |

### 6. 错误处理

```typescript
export const AI_ERROR_CODES = {
  RATE_LIMIT: 'AI_001',
  INVALID_API_KEY: 'AI_002',
  MODEL_NOT_FOUND: 'AI_003',
  CONTEXT_TOO_LONG: 'AI_004',
  NETWORK_ERROR: 'AI_005',
  QUOTA_EXCEEDED: 'AI_006',
  STREAM_INTERRUPTED: 'AI_007',
  CONTENT_FILTERED: 'AI_008',
} as const;

const AI_ERROR_MESSAGES: Record<string, string> = {
  AI_001: '请求过于频繁，请稍后再试',
  AI_002: 'API Key 无效，请检查配置',
  AI_003: '所选模型不可用',
  AI_004: '对话内容过长，请开始新对话',
  AI_005: '网络连接失败',
  AI_006: '配额已用完',
  AI_007: '响应中断，请重试',
  AI_008: '内容被过滤',
};
```

---

## 📝 Task 分解

### Task 9.1: AI 对话界面 (2 天)

**子任务**:
- [ ] 创建 AiChatView.vue
- [ ] 创建 ChatMessage.vue
- [ ] 创建 ChatInput.vue
- [ ] 创建 StreamingText.vue
- [ ] 实现 useAiChat.ts composable

### Task 9.2: 流式 IPC 通信 (1 天)

**子任务**:
- [ ] 注册 ai IPC handlers
- [ ] 实现流式响应转发
- [ ] 处理取消和错误

### Task 9.3: AI 建议功能 (1 天)

**子任务**:
- [ ] 创建 SuggestionCard.vue
- [ ] 实现 useAiSuggestions.ts
- [ ] 集成到目标/日程页面

### Task 9.4: 模型配置 (1 天)

**子任务**:
- [ ] 创建 AiSettingsView.vue
- [ ] 创建 ModelSelector.vue
- [ ] 实现 API Key 安全存储
- [ ] 实现模型测试功能

---

## 🔗 依赖关系

### 前置依赖

- ⏳ STORY-002/003/004 (基础架构)
- ⏳ AI 服务 API (infrastructure-server)

### 后续影响

- 🔜 智能规划功能

---

## ⚠️ 风险 & 缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| AI 服务不可用 | 中 | 中 | 离线降级提示 |
| API Key 泄露 | 低 | 高 | safeStorage 加密 |
| 流式响应中断 | 中 | 低 | 重试机制 |

---

## ✅ 完成定义 (DoD)

- [ ] AI 对话正常工作
- [ ] 流式响应显示流畅
- [ ] API Key 安全存储
- [ ] 代码已提交并通过 Review

---

**创建日期**: 2025-12-06  
**负责人**: Dev Agent  
**预计开始**: Phase 3 (Week 6-7)
