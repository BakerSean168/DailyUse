---
tags:
  - module
  - ai
  - chat
  - generation
description: AI 智能助手模块 - 对话和内容生成系统
created: 2025-12-16T10:00:00
updated: 2025-12-16T10:00:00
---

# 🤖 AI Module - 智能助手模块

> AI 驱动的对话和内容生成系统，支持多种 AI Provider

## 📋 目录

- [模块概述](#模块概述)
- [核心功能](#核心功能)
- [架构设计](#架构设计)
- [API 参考](#api-参考)
- [Provider 配置](#provider-配置)
- [使用示例](#使用示例)

---

## 🎯 模块概述

### 功能简介

AI 模块为 DailyUse 提供智能辅助功能：

- 💬 **AI 对话**: 流式聊天，上下文记忆
- 🎯 **目标生成**: 根据描述生成 OKR 目标和关键结果
- 📝 **知识生成**: 生成系列文档和学习资料
- ✅ **任务建议**: 智能任务分解和建议
- 🔧 **多 Provider**: 支持 OpenAI、Anthropic、七牛云等

### 技术特性

- **流式响应**: SSE 实时输出
- **Provider 切换**: 支持多个 AI 服务商
- **配额管理**: 用户级别使用限制
- **对话历史**: 持久化对话记录
- **加密存储**: API Key AES-256-GCM 加密

---

## 💡 核心功能

### 1. AI 对话 (Chat)

支持流式对话，保持上下文：

```typescript
// 创建对话
POST /api/v1/ai/conversations
{
  "title": "目标规划讨论"
}

// 发送消息 (SSE 流式)
POST /api/v1/ai/chat
{
  "conversationUuid": "xxx",
  "message": "帮我规划一个学习计划"
}
```

### 2. 目标生成 (Goal Generation)

根据描述生成 OKR：

```typescript
POST /api/v1/ai/generate/goal
{
  "description": "提高英语水平",
  "targetDate": "2025-06-01",
  "keyResultCount": 3
}

// 返回
{
  "goal": {
    "title": "提高英语水平至流利程度",
    "description": "通过系统学习和实践...",
    "keyResults": [
      { "title": "完成 100 小时听力训练", "targetValue": 100 },
      { "title": "每周写 3 篇英文日记", "targetValue": 156 },
      { "title": "通过 IELTS 7.0 考试", "targetValue": 7 }
    ]
  }
}
```

### 3. 知识文档生成 (Knowledge Generation)

生成系列学习文档：

```typescript
POST /api/v1/ai/generate/knowledge
{
  "topic": "TypeScript 高级特性",
  "documentCount": 5,
  "targetAudience": "中级开发者",
  "folderPath": "/learning/typescript"
}

// 返回生成任务 ID，异步生成
{
  "taskUuid": "xxx",
  "status": "PENDING"
}
```

---

## 🏗 架构设计

### 分层结构

```
apps/api/src/modules/ai/
├── application/              # 应用服务层
│   └── services/
│       ├── AIConversationService.ts      # 对话服务
│       ├── AIGenerationApplicationService.ts  # 生成服务
│       ├── AIProviderConfigService.ts    # Provider 配置
│       ├── AIProviderSwitchingService.ts # Provider 切换
│       └── GoalGenerationApplicationService.ts
├── infrastructure/           # 基础设施层
│   ├── providers/           # AI Provider 实现
│   │   ├── OpenAIProvider.ts
│   │   ├── QiniuProvider.ts
│   │   └── ProviderFactory.ts
│   └── repositories/
└── interface/               # 接口层
    └── http/
        ├── aiRoutes.ts
        └── controllers/
```

### 数据模型

```prisma
model aiConversation {
  uuid          String      @id
  accountUuid   String
  title         String
  status        String      // ACTIVE, CLOSED, ARCHIVED
  messageCount  Int         @default(0)
  lastMessageAt DateTime?
  messages      aiMessage[]
}

model aiMessage {
  uuid             String
  conversationUuid String
  role             String  // USER, ASSISTANT, SYSTEM
  content          String  @db.Text
  tokenUsage       String? // JSON
}

model aiGenerationTask {
  uuid         String
  accountUuid  String
  taskType     String  // GOAL_KEY_RESULTS, KNOWLEDGE_DOC
  status       String  // PENDING, PROCESSING, COMPLETED, FAILED
  input        String  @db.Text
  result       String? @db.Text
  error        String?
}

model aiProviderConfig {
  uuid            String
  accountUuid     String
  name            String
  providerType    String  // OPENAI, QINIU, ANTHROPIC
  baseUrl         String
  apiKeyEncrypted String  // AES-256-GCM 加密
  defaultModel    String?
  isDefault       Boolean @default(false)
  priority        Int     @default(100)
}
```

---

## 🔧 Provider 配置

### 支持的 Provider

| Provider | 类型 | 特点 |
|----------|------|------|
| **OpenAI** | 官方 | GPT-4, GPT-3.5-turbo |
| **Qiniu** | 国内 | 七牛云 AI |
| **Anthropic** | 官方 | Claude 系列 |
| **Custom** | 兼容 | OpenAI 兼容接口 |

### 配置 Provider

```typescript
// 添加 Provider 配置
POST /api/v1/ai/providers
{
  "name": "我的 OpenAI",
  "providerType": "OPENAI",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "defaultModel": "gpt-4"
}

// 切换默认 Provider
PUT /api/v1/ai/providers/:uuid/default
```

### 故障转移

配置多个 Provider 时，按 `priority` 顺序自动故障转移：

```typescript
// Provider 1 失败时自动切换到 Provider 2
providers: [
  { name: "Primary", priority: 1 },
  { name: "Backup", priority: 2 }
]
```

---

## 📚 API 参考

### 对话接口

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/ai/conversations` | 创建对话 |
| `GET` | `/ai/conversations` | 获取对话列表 |
| `GET` | `/ai/conversations/:uuid` | 获取对话详情 |
| `DELETE` | `/ai/conversations/:uuid` | 删除对话 |
| `POST` | `/ai/chat` | 发送消息 (SSE) |

### 生成接口

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/ai/generate/goal` | 生成目标 |
| `POST` | `/ai/generate/tasks` | 生成任务建议 |
| `POST` | `/ai/generate/knowledge` | 生成知识文档 |
| `GET` | `/ai/generate/tasks/:uuid` | 获取生成任务状态 |

### Provider 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/ai/providers` | 获取 Provider 列表 |
| `POST` | `/ai/providers` | 添加 Provider |
| `PUT` | `/ai/providers/:uuid` | 更新 Provider |
| `DELETE` | `/ai/providers/:uuid` | 删除 Provider |
| `PUT` | `/ai/providers/:uuid/default` | 设为默认 |

---

## 💻 使用示例

### Web 端使用

```vue
<template>
  <AIChatWindow :conversationUuid="currentConversation" />
</template>

<script setup>
import { useAIChat } from '@/modules/ai/presentation/composables/useAIChat';

const { messages, isStreaming, sendMessage, abort } = useAIChat();

// 发送消息
await sendMessage('帮我分析这个目标的可行性');
</script>
```

### Desktop 端使用

```typescript
// IPC 调用
const result = await window.electronAPI.ai.chat({
  conversationUuid: 'xxx',
  message: '帮我规划任务'
});
```

---

## 📊 配额管理

```typescript
model aiUsageQuota {
  accountUuid   String   @unique
  quotaLimit    Int      @default(50)   // 每日限制
  currentUsage  Int      @default(0)
  resetPeriod   String   @default("DAILY")
  lastResetAt   DateTime
  nextResetAt   DateTime
}
```

### 检查配额

```typescript
GET /api/v1/ai/quota

{
  "quotaLimit": 50,
  "currentUsage": 12,
  "remaining": 38,
  "resetAt": "2025-12-17T00:00:00Z"
}
```

---

## 🔗 相关文档

- [系统架构概览](../../architecture/system-overview.md)
- [API 架构文档](../../architecture/api-architecture.md)
- [数据模型文档](../../data-models.md)

---

*文档由 BMAD Analyst Agent 生成*
