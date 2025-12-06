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
