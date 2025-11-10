# DailyUse AI 功能设计文档

**版本**: 1.1 (架构修正版)  
**日期**: 2025-11-09  
**状态**: 设计阶段 - 已修正为实际架构  
**贡献者**: BMad 团队 17 位专家协作讨论

> **⚠️ 架构更新说明**: 本文档已根据项目实际架构更新：
> - ✅ 使用 Express.js (无依赖注入装饰器)
> - ✅ 使用 Prisma ORM (非 TypeORM)
> - ✅ DTOs 定义在 `packages/contracts` 包
> - ✅ 后端存储 API Key (`.env` 文件)
> - ✅ 前端通过 HTTP/SSE 调用后端 AI 服务
> - ✅ 包含完整代码示例（第 3 节）

---

## � 代码示例（基于实际架构）

### 后端代码示例

#### 1. AI Adapter 基类（无依赖注入）

```typescript
// apps/api/src/modules/ai/infrastructure/adapters/BaseAIAdapter.ts
import { AIProvider, AIResponseDTO } from '@dailyuse/contracts';

export interface StreamCallback {
  onChunk: (text: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export abstract class BaseAIAdapter {
  constructor(
    protected apiKey: string,
    protected model: string
  ) {}

  abstract generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponseDTO>;

  abstract generateStream(
    prompt: string,
    callback: StreamCallback,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<void>;

  abstract getProvider(): AIProvider;
}
```

#### 2. OpenAI Adapter 实现

```typescript
// apps/api/src/modules/ai/infrastructure/adapters/OpenAIAdapter.ts
import OpenAI from 'openai';
import { AIProvider, AIResponseDTO } from '@dailyuse/contracts';
import { BaseAIAdapter, StreamCallback } from './BaseAIAdapter';

export class OpenAIAdapter extends BaseAIAdapter {
  private client: OpenAI;

  constructor(apiKey: string, model: string = 'gpt-4') {
    super(apiKey, model);
    this.client = new OpenAI({ apiKey });
  }

  async generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponseDTO> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000
    });

    return {
      content: response.choices[0].message.content || '',
      provider: AIProvider.OPENAI,
      model: this.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      }
    };
  }

  async generateStream(
    prompt: string,
    callback: StreamCallback,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          callback.onChunk(content);
        }
      }

      callback.onComplete();
    } catch (error) {
      callback.onError(error as Error);
    }
  }

  getProvider(): AIProvider {
    return AIProvider.OPENAI;
  }
}
```

#### 3. Goal 生成服务

```typescript
// apps/api/src/modules/ai/application/services/GoalGenerationService.ts
import { PrismaClient } from '@prisma/client';
import { GenerateGoalRequestDTO, GoalPreviewDTO, KRPreviewDTO } from '@dailyuse/contracts';
import { BaseAIAdapter } from '../../infrastructure/adapters/BaseAIAdapter';
import { goalKRPrompt } from '../../infrastructure/prompts/goalPrompts';

export class GoalGenerationService {
  constructor(
    private aiAdapter: BaseAIAdapter,
    private prisma: PrismaClient
  ) {}

  async generateKRs(request: GenerateGoalRequestDTO): Promise<GoalPreviewDTO> {
    // 1. 构建 Prompt
    const prompt = goalKRPrompt({
      title: request.goalTitle,
      description: request.description,
      duration: request.duration,
      category: request.category
    });

    // 2. 调用 AI
    const response = await this.aiAdapter.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 1500
    });

    // 3. 解析响应
    const parsed = JSON.parse(response.content);

    // 4. 验证和转换
    const krs: KRPreviewDTO[] = parsed.krs.map((kr: any) => ({
      title: kr.title,
      metricType: kr.metric_type,
      currentValue: kr.current_value,
      targetValue: kr.target_value,
      deadline: new Date(kr.deadline),
      reasoning: kr.reasoning
    }));

    // 5. 返回预览
    return {
      goalTitle: request.goalTitle,
      suggestedKRs: krs,
      metadata: {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.usage.totalTokens
      }
    };
  }

  async saveGoalWithKRs(
    accountUuid: string,
    preview: GoalPreviewDTO
  ): Promise<string> {
    // 使用 Prisma 事务保存
    const goal = await this.prisma.goal.create({
      data: {
        account_uuid: accountUuid,
        title: preview.goalTitle,
        // ... 其他字段
        key_results: {
          create: preview.suggestedKRs.map(kr => ({
            title: kr.title,
            metric_type: kr.metricType,
            target_value: kr.targetValue,
            // ...
          }))
        }
      }
    });

    return goal.goal_uuid;
  }
}
```

#### 4. Express 控制器

```typescript
// apps/api/src/modules/ai/interface/http/AIController.ts
import { Request, Response } from 'express';
import { GoalGenerationService } from '../../application/services/GoalGenerationService';
import { OpenAIAdapter } from '../../infrastructure/adapters/OpenAIAdapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AIController {
  static async generateGoalKRs(req: Request, res: Response) {
    try {
      // 1. 获取用户 AI 配置（或使用系统默认）
      const apiKey = process.env.OPENAI_API_KEY!;
      const model = req.body.model || 'gpt-4';

      // 2. 创建 Adapter 和 Service
      const adapter = new OpenAIAdapter(apiKey, model);
      const service = new GoalGenerationService(adapter, prisma);

      // 3. 调用服务
      const preview = await service.generateKRs(req.body);

      // 4. 返回结果
      res.json({
        success: true,
        data: preview
      });
    } catch (error) {
      console.error('AI generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async generateGoalKRsStream(req: Request, res: Response) {
    // SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const apiKey = process.env.OPENAI_API_KEY!;
      const adapter = new OpenAIAdapter(apiKey, 'gpt-4');

      const prompt = `生成关键结果...`; // 构建 prompt

      await adapter.generateStream(prompt, {
        onChunk: (text) => {
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
        },
        onComplete: () => {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          res.end();
        },
        onError: (error) => {
          res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
          res.end();
        }
      });
    } catch (error) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`);
      res.end();
    }
  }
}
```

#### 5. Express 路由

```typescript
// apps/api/src/modules/ai/interface/http/aiRoutes.ts
import { Router } from 'express';
import { AIController } from './AIController';
import { authenticate } from '../../../../shared/middleware/auth';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// Goal KR 生成
router.post('/goal/generate-krs', AIController.generateGoalKRs);
router.post('/goal/generate-krs/stream', AIController.generateGoalKRsStream);

// 对话
router.post('/chat', AIController.chat);

export default router;
```

### 前端代码示例

#### 6. Contracts 定义

```typescript
// packages/contracts/src/modules/ai/ai.contracts.ts
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom'
}

export interface GenerateGoalRequestDTO {
  goalTitle: string;
  description?: string;
  duration?: number;
  category?: string;
  hints?: string[];
}

export interface KRPreviewDTO {
  title: string;
  metricType: string;
  currentValue?: string;
  targetValue: string;
  deadline: Date;
  reasoning: string;
}

export interface GoalPreviewDTO {
  goalTitle: string;
  suggestedKRs: KRPreviewDTO[];
  metadata: {
    provider: AIProvider;
    model: string;
    tokensUsed: number;
  };
}

export interface AIResponseDTO {
  content: string;
  provider: AIProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

#### 7. 前端 API 客户端

```typescript
// apps/web/src/modules/ai-assistant/api/aiAssistantApi.ts
import axios from 'axios';
import { GenerateGoalRequestDTO, GoalPreviewDTO } from '@dailyuse/contracts';

export class AIAssistantApi {
  private baseURL = '/api/v1/ai';

  async generateGoalKRs(request: GenerateGoalRequestDTO): Promise<GoalPreviewDTO> {
    const response = await axios.post(`${this.baseURL}/goal/generate-krs`, request);
    return response.data.data;
  }

  async generateGoalKRsStream(
    request: GenerateGoalRequestDTO,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const eventSource = new EventSource(
      `${this.baseURL}/goal/generate-krs/stream?` + new URLSearchParams(request as any)
    );

    eventSource.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chunk') {
        onChunk(data.content);
      } else if (data.type === 'done') {
        eventSource.close();
        onComplete();
      } else if (data.type === 'error') {
        eventSource.close();
        onError(new Error(data.message));
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      onError(new Error('Stream connection failed'));
    };
  }
}

export const aiAssistantApi = new AIAssistantApi();
```

#### 8. Pinia Store

```typescript
// apps/web/src/modules/ai-assistant/presentation/stores/aiAssistantStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { aiAssistantApi } from '../../api/aiAssistantApi';
import { GoalPreviewDTO } from '@dailyuse/contracts';

export const useAIAssistantStore = defineStore('aiAssistant', () => {
  const isGenerating = ref(false);
  const currentPreview = ref<GoalPreviewDTO | null>(null);
  const streamingText = ref('');

  async function generateGoalKRs(goalTitle: string, hints?: string[]) {
    isGenerating.value = true;
    streamingText.value = '';

    try {
      await aiAssistantApi.generateGoalKRsStream(
        { goalTitle, hints },
        (chunk) => {
          streamingText.value += chunk;
        },
        () => {
          // 解析完整文本为 GoalPreviewDTO
          currentPreview.value = JSON.parse(streamingText.value);
          isGenerating.value = false;
        },
        (error) => {
          console.error(error);
          isGenerating.value = false;
        }
      );
    } catch (error) {
      isGenerating.value = false;
      throw error;
    }
  }

  return {
    isGenerating,
    currentPreview,
    streamingText,
    generateGoalKRs
  };
});
```

---

## �📋 目录

1. [需求概述](#需求概述)
2. [技术架构](#技术架构)
3. [用户体验设计](#用户体验设计)
4. [实施计划](#实施计划)
5. [创新功能](#创新功能)
6. [风险与缓解](#风险与缓解)
7. [成功指标](#成功指标)

---

## 🎯 需求概述

### 核心需求

用户希望在 DailyUse 项目中集成 AI 功能，实现以下场景：

1. **Goal 模块增强**
   - AI 根据目标描述自动生成关键结果（KRs）
   - AI 根据目标和 KRs 快速生成关联的 TaskTemplate

2. **知识库智能化**
   - 通过 AI 快速理解文档内容
   - 自动生成文档摘要和关键要点

3. **通用 AI 助手**
   - 随时随地回答问题
   - 浮动图标形式，快捷键唤起

4. **用户自定义配置**
   - 支持用户配置自己的 AI API
   - 支持多种 AI 提供商（OpenAI、Anthropic、自定义）

### 设计原则

- ✨ **非侵入式**: 不干扰主要工作流程
- 🔌 **插件化**: 通过插件扩展具体业务功能
- 🎯 **上下文感知**: 理解用户当前所在页面/模块
- 📱 **跨平台**: 适配桌面端（Electron）和 Web 端

---

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vue 3)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AI Floating  │  │ AI Chat      │  │ Plugin UI    │  │
│  │ Button       │  │ Panel        │  │ Components   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │ AI Assistant    │                    │
│                  │ Store (Pinia)   │                    │
│                  └────────┬────────┘                    │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │ aiAssistantApi  │ (HTTP Client)      │
│                  │ (SSE Support)   │                    │
│                  └────────┬────────┘                    │
└───────────────────────────┼─────────────────────────────┘
                            │ HTTP/SSE
┌───────────────────────────▼─────────────────────────────┐
│              Backend API (Express.js)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │         /api/v1/ai/* Routes                     │   │
│  │  ┌──────────────────────────────────────────┐   │   │
│  │  │         AIController.ts                  │   │   │
│  │  │  (Express req/res handlers)              │   │   │
│  │  └──────────────────┬───────────────────────┘   │   │
│  └─────────────────────┼─────────────────────────────┘ │
│                        │                               │
│  ┌─────────────────────▼─────────────────────────┐     │
│  │      Application Services                     │     │
│  │  ┌────────────────────────────────────────┐   │     │
│  │  │   GoalGenerationService.ts             │   │     │
│  │  │   (Business Logic + Validation)        │   │     │
│  │  └────────────────┬───────────────────────┘   │     │
│  └───────────────────┼───────────────────────────┘     │
│                      │                                 │
│  ┌───────────────────▼───────────────────────────┐     │
│  │    Infrastructure - AI Adapters              │     │
│  │  ┌────────────┐  ┌──────────────┐  ┌───────┐ │     │
│  │  │  OpenAI    │  │  Anthropic   │  │Custom │ │     │
│  │  │  Adapter   │  │  Adapter     │  │Adapter│ │     │
│  │  └────────────┘  └──────────────┘  └───────┘ │     │
│  └──────────────────────────────────────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────┐     │
│  │         Prisma Client                        │     │
│  │  (user_settings, ai_conversations)           │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│               Shared Contracts Package                  │
│  packages/contracts/src/modules/ai/                     │
│  ┌──────────────────────────────────────────────┐      │
│  │         ai.contracts.ts                      │      │
│  │  - GenerateGoalRequestDTO                    │      │
│  │  - GoalPreviewDTO                            │      │
│  │  - KRPreviewDTO                              │      │
│  │  - AIResponseDTO                             │      │
│  │  - AIProvider enum                           │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 架构关键点

**🔄 数据流向**:
1. 前端组件 → Pinia Store → aiAssistantApi (HTTP Client)
2. HTTP Client → Backend `/api/v1/ai/*` 路由 (SSE 流式传输)
3. AIController → GoalGenerationService (业务逻辑)
4. Service → AI Adapter (调用 OpenAI/Anthropic API)
5. Service → Prisma Client (保存结果/对话历史)
6. 响应返回前端 → Store 更新 → 组件渲染

**🔒 安全策略**:
- API Key 存储在后端 `.env` 文件（**不在前端**）
- 前端只发送业务参数（goal 描述、提示词等）
- 后端验证用户权限后调用 AI API
- 响应经过后端验证和清理

**📦 包结构说明**:
- `packages/contracts`: DTOs 和接口定义（前后端共享）
- `packages/domain-server`: 后端领域逻辑（服务、仓储）
- `packages/domain-client`: 前端领域逻辑（Store、API 客户端）
- `apps/api`: Express.js 应用（控制器、路由、中间件）
- `apps/web`: Vue 3 应用（组件、页面、样式）

### 技术栈选型

| 层级 | 技术 | 理由 |
|------|------|------|
| **后端框架** | Express.js (标准 REST) | 现有架构，无依赖注入 |
| **ORM** | Prisma | Schema-first，类型安全 |
| **AI SDK** | Vercel AI SDK (后端 + 前端) | 统一接口、流式支持、多提供商 |
| **AI 提供商** | OpenAI / Anthropic | 官方 SDK 集成 |
| **状态管理** | Pinia Store (aiAssistantStore) | 复用现有架构 |
| **UI 组件** | Vuetify 3 + Vercel AI Vue 组件 | 保持一致性 |
| **数据持久化** | Prisma (user_settings, ai_conversations) | 复用现有基础设施 |
| **流式传输** | SSE (Server-Sent Events) | 实时 AI 响应流 |
| **加密** | 后端环境变量 (.env) | API Key 安全存储 |

### 包结构设计

```
packages/
  contracts/                        # 共享 DTOs 和接口
    src/
      modules/
        ai/
          ai.contracts.ts           # AI 相关 DTOs
            - GenerateGoalRequestDTO
            - GoalPreviewDTO
            - KRPreviewDTO
            - AIResponseDTO
            - AIProvider enum
            - AIModel enum
            - StreamChunkDTO

  domain-server/                    # 后端领域逻辑（可选）
    src/
      modules/
        ai/
          services/                 # 可复用的业务逻辑
          repositories/             # 数据访问层

apps/
  api/                              # Express.js 后端
    src/
      modules/
        ai/
          infrastructure/
            adapters/
              BaseAIAdapter.ts      # 抽象基类（无装饰器）
              OpenAIAdapter.ts      # OpenAI 实现
              AnthropicAdapter.ts   # Anthropic 实现
            prompts/
              goalPrompts.ts        # Goal 相关 Prompt 模板
              taskPrompts.ts        # Task 相关 Prompt 模板
          application/
            services/
              GoalGenerationService.ts    # Goal KR 生成服务
              TaskGenerationService.ts    # Task 生成服务
              ConversationService.ts      # 对话管理
          interface/
            http/
              AIController.ts       # Express 控制器
              aiRoutes.ts           # Express 路由定义
              middleware/
                rateLimiter.ts      # 限流中间件

  web/                              # Vue 3 前端
    src/
      modules/
        ai-assistant/               # AI 助手模块
          api/
            aiAssistantApi.ts       # HTTP 客户端 (SSE 支持)
          presentation/
            components/
              AIFloatingButton.vue  # 浮动按钮
              AIChatPanel.vue       # 聊天面板
              GoalPreviewCard.vue   # Goal 预览卡片
              MessageList.vue       # 消息列表
              StreamingText.vue     # 流式文本显示
            stores/
              aiAssistantStore.ts   # Pinia 状态管理
            composables/
              useGoalGeneration.ts  # Goal 生成逻辑
              useAIStream.ts        # SSE 流式处理
              useKeyboardShortcut.ts # 快捷键

  desktop/                          # Electron 应用
    src/
      ai/
        globalShortcut.ts           # 全局快捷键
        overlayWindow.ts            # 浮动窗口
```

### 数据库 Schema 扩展 (Prisma)

**修改 `apps/api/prisma/schema.prisma`**:

```prisma
// 扩展 user_settings 表
model user_settings {
  // ... 现有字段 ...
  
  // AI 配置字段
  ai_provider       String?   @db.VarChar(50)
  ai_model          String?   @db.VarChar(100)
  ai_enabled        Boolean   @default(false)
  ai_config         Json?     // 存储额外配置（如 temperature、max_tokens）
  
  // 注意：API Key 存储在后端 .env，不存数据库
}

// 新增 ai_conversations 表（可选：记录对话历史）
model ai_conversations {
  conversation_uuid String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  account_uuid      String   @db.Uuid
  plugin_id         String?  @db.VarChar(50)
  messages          Json     // [{role: 'user'|'assistant', content: '...'}]
  context           Json?    // 上下文信息（如当前 Goal ID）
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  account           account  @relation(fields: [account_uuid], references: [uuid], onDelete: Cascade)
  
  @@index([account_uuid])
  @@index([created_at])
  @@map("ai_conversations")
}
```

**迁移命令**:
```bash
# 开发环境
pnpm nx run api:prisma-push

# 生产环境
pnpm nx run api:prisma-migrate -- --name add_ai_features
```

**环境变量配置**:

```bash
# apps/api/.env
# AI Provider Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4  # 可选，默认 gpt-4
ANTHROPIC_API_KEY=sk-ant-...  # 可选

# AI Feature Flags
AI_ENABLED=true
AI_RATE_LIMIT_PER_MINUTE=10  # 每分钟请求限制
AI_MAX_TOKENS=2000

# 注意：API Key 只存储在后端，前端无法访问
```

**PersistenceDTO 映射示例**:

```typescript
// packages/contracts/src/modules/ai/ai.contracts.ts
export interface AIConversationClientDTO {
  conversationUuid: string;
  accountUuid: string;
  pluginId?: string;
  messages: AIMessage[];
  context?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// apps/api/src/modules/ai/infrastructure/mappers/AIConversationMapper.ts
export class AIConversationMapper {
  static toDomain(persistence: any): AIConversationClientDTO {
    return {
      conversationUuid: persistence.conversation_uuid,
      accountUuid: persistence.account_uuid,
      pluginId: persistence.plugin_id,
      messages: JSON.parse(persistence.messages),
      context: persistence.context,
      createdAt: new Date(persistence.created_at),
      updatedAt: new Date(persistence.updated_at)
    };
  }
  
  static toPersistence(domain: AIConversationClientDTO): any {
    return {
      conversation_uuid: domain.conversationUuid,
      account_uuid: domain.accountUuid,
      plugin_id: domain.pluginId,
      messages: JSON.stringify(domain.messages),
      context: domain.context
    };
  }
}
```

---

## 🎨 用户体验设计

### 浮动助手入口

**默认状态**:
```
位置: 右下角（距离底部 80px，右边 24px）
样式: 圆形图标，直径 56px
图标: ✨ AI（渐变色）
动画: 轻微呼吸效果
状态指示:
  - 🟢 绿色光环: 已配置，可用
  - 🟡 黄色光环: 未配置，需设置
  - 🔴 红色光环: API 错误
  - ⚪ 灰色旋转: 正在思考
```

**Hover 状态**:
```
显示提示: "AI 助手 (Ctrl+K)"
图标放大: 1.1 倍
阴影加深
```

### 唤起方式（多入口设计）

1. **全局快捷键**: `Ctrl+K` / `Cmd+K`（Mac）
2. **点击浮动图标**: 展开聊天面板
3. **上下文菜单**: 在 Goal/Task 表单中右键 → "AI 辅助"
4. **智能提示**: 检测到空白表单 3 秒后自动提示

### 聊天面板布局

```
┌────────────────────────────────────┐
│  AI 助手        [插件▼] [_][✕]    │ ← 标题栏 + 操作按钮
├────────────────────────────────────┤
│                                    │
│  [AI]: 你好！我可以帮你...        │
│  [你]: 生成一个健身目标            │ ← 对话区（滚动）
│  [AI]: 好的，建议如下...           │
│       ┌─────────────────────┐      │
│       │ [生成的内容卡片]   │      │
│       └─────────────────────┘      │
│                                    │
├────────────────────────────────────┤
│  [📎] [输入消息...]      [发送▲]  │ ← 输入栏
│  💡 试试: /goal 减肥10斤           │ ← 快捷指令提示
└────────────────────────────────────┘

尺寸: 宽度 420px，高度 600px
可拖拽、可调整大小、可最小化
```

### 插件上下文感知

**场景: 用户在 Goal 创建页面打开 AI**

```
[系统自动检测并注入上下文]

┌────────────────────────────────────┐
│  AI 助手 - Goal 创建  [✕]         │
├────────────────────────────────────┤
│  [AI]: 我看到你正在创建 Goal！    │
│        我可以帮你：                 │
│                                    │
│  🎯 /goal-kr  - 生成关键结果       │
│  📋 /goal-task - 生成任务模板      │
│  🔍 /analyze - 分析目标可行性       │
│  💡 /suggest - 推荐相似目标         │
│                                    │
│  直接输入你的目标，我来帮你！      │
└────────────────────────────────────┘
```

### 生成结果交互

**Goal KR 生成示例**:

```
用户输入: "3个月内减肥10斤"

AI 响应:
┌────────────────────────────────────┐
│  ✅ 已为你生成 3 个关键结果        │
│                                    │
│  🎯 KR1: 体重减少 10斤             │
│      └─ 指标: 重量                 │
│      └─ 当前: 70kg → 目标: 65kg    │
│      └─ 截止: 3个月后              │
│      [✏️ 编辑] [❌ 删除]           │
│                                    │
│  🎯 KR2: 每周运动 3 次             │
│      └─ 指标: 频率                 │
│      └─ 目标: 3次/周               │
│      └─ 截止: 持续3个月            │
│      [✏️ 编辑] [❌ 删除]           │
│                                    │
│  🎯 KR3: 体脂率降低 3%             │
│      └─ 指标: 百分比               │
│      └─ 当前: 25% → 目标: 22%      │
│      └─ 截止: 3个月后              │
│      [✏️ 编辑] [❌ 删除]           │
│                                    │
│  [🔄 重新生成] [💾 保存到 Goal]    │
└────────────────────────────────────┘
```

### 快捷指令系统

| 指令 | 功能 | 示例 |
|------|------|------|
| `/goal` | 快速创建目标 | `/goal 学会 Vue3` |
| `/goal-kr` | 生成关键结果 | `/goal-kr 提升编程能力` |
| `/task` | 生成任务 | `/task 完成项目文档` |
| `/kb-summary` | 知识库摘要 | `/kb-summary [文档ID]` |
| `/help` | 显示帮助 | `/help` |

---

## 📅 实施计划

### MVP 路线图（5-6 周）

#### **Sprint 1: 基础设施（2 周）**

**Week 1:**
- ✅ Story 1.1: 后端 AI 基础架构
  - 创建 `packages/contracts/src/modules/ai/ai.contracts.ts`
  - 实现 BaseAIAdapter 抽象类
  - 实现 OpenAIAdapter
  - 添加 OpenAI SDK: `pnpm add openai`
  - 配置环境变量 (.env): `OPENAI_API_KEY`
  
- ✅ Story 1.2: AI 路由和控制器
  - 实现 AIController.ts
  - 创建 aiRoutes.ts
  - 集成到 `apps/api/src/app.ts`
  - 测试基础 API 端点

**Week 2:**
- ✅ Story 1.3: Prisma Schema 扩展
  - 修改 `schema.prisma` 添加 AI 字段
  - 创建 `ai_conversations` 表
  - 运行迁移: `pnpm nx run api:prisma-push`
  - 实现 PersistenceDTO 映射器

- ✅ Story 1.4: 前端 AI 助手 UI
  - 创建 AIFloatingButton.vue
  - 创建 AIChatPanel.vue
  - 实现 aiAssistantApi.ts (HTTP 客户端)
  - 实现 aiAssistantStore.ts (Pinia)
  - 全局快捷键 (Ctrl+K)

**交付物**:
- 后端 AI API 可用 (`POST /api/v1/ai/chat`)
- 前端浮动按钮可展开聊天面板
- 基础对话功能可工作（echo 测试）
- 环境变量配置文档

---

#### **Sprint 2: Goal 插件（1.5 周）**

**Week 3:**
- ✅ Story 2.1: Goal KR 生成功能
  - 实现 GoalPlugin.ts
  - KR 生成 Prompt 设计
  - GoalKRGenerator.vue
  - 流式显示
  - 集成到 Goal 创建页

**Week 3-4:**
- ✅ Story 2.2: Goal → TaskTemplate 生成
  - 扩展 GoalPlugin
  - Task 生成 Prompt
  - TaskTemplateGenerator.vue
  - 集成到 Goal 详情页

**交付物**:
- 用户可用 AI 生成 Goal KRs
- 用户可从 Goal 生成 Tasks
- 响应时间 < 5 秒

---

#### **Sprint 3: 通用聊天 + 知识库（1.5 周）**

**Week 4-5:**
- ✅ Story 3.1: 通用 AI 问答
  - ConversationManager
  - ContextBuilder（上下文感知）
  - 多轮对话支持
  - Markdown 渲染

- ✅ Story 3.2: 知识库 AI 摘要
  - 实现 KnowledgePlugin.ts
  - 文档摘要 Prompt
  - DocumentSummary.vue
  - 集成到知识库页面

**交付物**:
- 通用 AI 聊天可用
- 知识库文档可生成摘要
- 支持上下文感知

---

#### **Sprint 4: 优化与测试（1 周）**

**Week 6:**
- ✅ Story 4.1: 性能优化
  - Web Worker 异步处理
  - 请求队列（限流）
  - 缓存层（常见查询）
  - 超时处理

- ✅ Story 4.2: 测试与监控
  - 单元测试（>80% 覆盖率）
  - 集成测试
  - E2E 测试（核心流程）
  - 埋点（使用分析）

**交付物**:
- 完整的测试覆盖
- 性能达标（< 5s）
- 监控数据收集就绪

---

### 开发资源估算

**单个全职开发者**: 6 周  
**或 2 个开发者协作**: 3-4 周

**技能要求**:
- Vue 3 + TypeScript
- Pinia 状态管理
- AI SDK 集成经验
- 测试编写能力

---

## 💡 创新功能（Phase 2）

### 1. AI 人格化

**概念**: 给 AI 不同的人格风格

```typescript
interface AIPersonality {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tone: 'professional' | 'friendly' | 'humorous';
}

const personalities: AIPersonality[] = [
  {
    id: 'pro',
    name: '专业模式',
    description: '严肃、精准、高效',
    systemPrompt: 'You are a professional productivity assistant...',
    tone: 'professional'
  },
  {
    id: 'friend',
    name: '友好模式',
    description: '轻松、鼓励、温暖',
    systemPrompt: 'You are a supportive friend helping with goals...',
    tone: 'friendly'
  },
  {
    id: 'coach',
    name: '教练模式',
    description: '严格、激励、挑战',
    systemPrompt: 'You are a tough but caring coach...',
    tone: 'humorous'
  }
];
```

**用户价值**: 增加情感连接，提升使用意愿

---

### 2. AI 学习用户习惯

**概念**: 基于历史数据个性化推荐

```typescript
class UserPatternAnalyzer {
  async analyzeGoalPatterns(userId: string) {
    const historicalGoals = await goalService.getHistory(userId);
    
    return {
      commonCategories: ['健身', '学习', '工作'],
      avgDuration: 90, // 天
      successRate: 0.68,
      preferredKRTypes: ['数量型', '时间型'],
      peakProductiveHours: [9, 14, 20]
    };
  }
  
  async generatePersonalizedSuggestion(goal: string, patterns: UserPattern) {
    const prompt = `
      用户历史成功率: ${patterns.successRate}
      偏好的 KR 类型: ${patterns.preferredKRTypes.join(', ')}
      
      基于这些数据，为目标 "${goal}" 生成最适合该用户的 KRs
    `;
    
    return aiService.generate(prompt);
  }
}
```

**用户价值**: 越用越懂你，建议越来越准

---

### 3. AI 驱动的目标教练

**概念**: 主动式进度跟踪和建议

```typescript
class AIGoalCoach {
  async weeklyCheckIn(userId: string) {
    const activeGoals = await goalService.getActive(userId);
    const progress = await this.analyzeProgress(activeGoals);
    
    if (progress.behindSchedule) {
      return {
        type: 'alert',
        message: `本周进度落后 ${progress.deficit}%，建议调整计划`,
        suggestions: [
          '优先完成关键任务 A',
          '将任务 B 推迟到下周',
          '寻求团队帮助'
        ],
        action: 'adjust_schedule'
      };
    }
    
    if (progress.aheadSchedule) {
      return {
        type: 'celebration',
        message: `太棒了！进度超前 ${progress.surplus}%！`,
        suggestions: [
          '考虑提前完成目标',
          '设置更具挑战性的 KR',
          '帮助团队成员'
        ]
      };
    }
  }
}
```

**触发方式**:
- 每周五自动发送
- 用户打开应用时弹窗
- 支持一键调整计划

**用户价值**: 像有个私人教练时刻关注你

---

### 4. 语音输入（移动端优先）

**技术栈**: Web Speech API + Whisper API

```typescript
class VoiceAIAssistant {
  async startVoiceInput() {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      await this.processVoiceCommand(transcript);
    };
    
    recognition.start();
  }
  
  async processVoiceCommand(text: string) {
    // 检测意图
    if (text.includes('创建目标') || text.includes('新目标')) {
      return this.createGoalFromVoice(text);
    }
    
    if (text.includes('今天的任务')) {
      return this.listTodayTasks();
    }
    
    // 默认：自由对话
    return aiService.chat(text);
  }
}
```

**场景**:
- 用户跑步时创建健身目标
- 开车时查询今日任务
- 做饭时记录灵感

---

### 5. AI 生成的动机图

**概念**: 可视化成功路径

```typescript
interface MotivationMap {
  goal: string;
  successProbability: number; // 基于相似用户数据
  encouragement: string;
  supportResources: Resource[];
  milestones: Milestone[];
}

async function generateMotivationMap(goal: Goal): Promise<MotivationMap> {
  const similarUsers = await findSimilarSuccessStories(goal);
  
  return {
    goal: goal.title,
    successProbability: calculateProbability(similarUsers),
    encouragement: `你上次学习 ${goal.relatedSkill} 只花了 ${goal.previousDuration}，
                    ${goal.currentSkill} 语法更简洁，你完全可以！`,
    supportResources: [
      { type: 'course', title: 'Vue3 官方教程', url: '...' },
      { type: 'community', title: 'Vue 中文社区', url: '...' }
    ],
    milestones: [
      { week: 1, achievement: '掌握基础语法' },
      { week: 2, achievement: '完成第一个组件' },
      { week: 4, achievement: '构建完整应用' }
    ]
  };
}
```

**展示形式**:
- 进度图表
- 成功率环形图
- 里程碑时间线

---

## ⚠️ 风险与缓解

### 风险矩阵（FMEA）

| 风险 | 严重性 | 发生率 | 检测度 | RPN | 缓解策略 |
|------|--------|--------|--------|-----|----------|
| **API 密钥泄露** | 高(9) | 低(2) | 低(3) | **54** | ✅ 后端 .env 存储 + .gitignore + 前端无访问权限 |
| **AI 生成质量差** | 中(6) | 高(7) | 高(8) | **336** | ⚠️ 多选项 + 用户编辑 + 反馈学习 |
| **成本失控** | 高(8) | 中(4) | 中(6) | **192** | 后端限流中间件 + 用量统计 + 缓存 |
| **响应慢** | 中(5) | 高(7) | 高(9) | **315** | SSE 流式响应 + loading 动画 + 超时处理 |
| **后端服务故障** | 高(7) | 中(4) | 高(8) | **224** | 熔断器 + 降级到模板 + 错误重试 |
| **隐私泄露** | 高(9) | 低(2) | 低(3) | **54** | 明确告知 + 可选退出 + 对话不默认保存 |

### 降级策略

**熔断器模式**:
```typescript
class CircuitBreaker {
  private failures = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onFailure() {
    this.failures++;
    if (this.failures >= 3) {
      this.state = 'OPEN';
      setTimeout(() => this.state = 'HALF_OPEN', 30000); // 30秒后尝试恢复
    }
  }
}
```

**模板降级**:
```typescript
async function generateGoalKRs(goal: string): Promise<KR[]> {
  try {
    return await aiService.generateKRs(goal);
  } catch (error) {
    // 降级到预设模板
    return templateService.getTemplateForGoal(goal);
  }
}
```

---

## 📊 成功指标

### 北极星指标

**Goal 创建完成率**
- 基线（无 AI）: 50%
- 目标（有 AI）: 80%+

### 次级指标

| 指标 | 基线 | 目标 | 测量方式 |
|------|------|------|----------|
| **AI 建议采纳率** | N/A | >60% | 点击"保存"次数 / 生成次数 |
| **使用 AI 的用户留存** | 70% | 88% | 30天后活跃率 |
| **平均 Goal 创建时间** | 5分钟 | <2分钟 | 时间追踪 |
| **NPS 提升** | 40 | 50+ | 季度调研 |
| **AI 功能使用频率** | N/A | 3次/周/用户 | 事件追踪 |

### 埋点计划

```typescript
// 追踪事件
enum AIEvent {
  AI_PANEL_OPENED = 'ai_panel_opened',
  AI_QUERY_SENT = 'ai_query_sent',
  AI_RESPONSE_RECEIVED = 'ai_response_received',
  AI_SUGGESTION_ACCEPTED = 'ai_suggestion_accepted',
  AI_SUGGESTION_EDITED = 'ai_suggestion_edited',
  AI_SUGGESTION_REJECTED = 'ai_suggestion_rejected',
  AI_FEEDBACK_POSITIVE = 'ai_feedback_positive',
  AI_FEEDBACK_NEGATIVE = 'ai_feedback_negative'
}

// 使用示例
analytics.track(AIEvent.AI_QUERY_SENT, {
  plugin: 'goal',
  prompt_length: 50,
  response_time_ms: 3200,
  user_id: currentUser.id
});
```

---

## 🚀 下一步行动

### 立即开始（本周）

1. **环境准备**
   - 获取 OpenAI API Key
   - 配置 `apps/api/.env` 文件
   - 安装依赖: `pnpm add openai`
   - 验证 API 连接

2. **创建基础结构**
   - 创建 `packages/contracts/src/modules/ai/` 目录
   - 创建 `apps/api/src/modules/ai/` 目录结构
   - 定义 DTOs (ai.contracts.ts)
   - 设置 TypeScript 路径映射

3. **实现第一个 Adapter**
   - 实现 BaseAIAdapter.ts
   - 实现 OpenAIAdapter.ts
   - 编写单元测试
   - 手动测试 API 调用

### Sprint 1 启动（下周）

1. **Day 1-2: 后端基础**
   - 实现 GoalGenerationService.ts
   - 设计 Prompt 模板 (goalPrompts.ts)
   - 实现 AIController.ts
   - 创建 aiRoutes.ts

2. **Day 3-4: Prisma 集成**
   - 修改 schema.prisma
   - 运行迁移
   - 实现 Mapper (snake_case ↔ camelCase)
   - 测试数据持久化

3. **Day 5-7: 前端集成**
   - 实现 aiAssistantApi.ts
   - 实现 aiAssistantStore.ts
   - 创建 AIFloatingButton.vue
   - 创建 AIChatPanel.vue

4. **Day 8-10: 联调和测试**
   - 前后端集成测试
   - 错误处理完善
   - 性能测试（响应时间）
   - 用户测试

### 快速验证（MVP）

**最小可验证产品**（2-3 天可完成）:

```typescript
// 1. 最简单的 contracts (5分钟)
export interface GenerateGoalRequestDTO {
  goalTitle: string;
}

export interface GoalPreviewDTO {
  goalTitle: string;
  suggestedKRs: string[];  // 简化版，先返回字符串数组
}

// 2. 最简单的 Adapter (30分钟)
export class OpenAIAdapter {
  async generate(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content || '';
  }
}

// 3. 最简单的 Controller (30分钟)
router.post('/test', async (req, res) => {
  const adapter = new OpenAIAdapter(process.env.OPENAI_API_KEY!);
  const result = await adapter.generate(`为目标"${req.body.goalTitle}"生成3个关键结果`);
  res.json({ result });
});

// 4. 最简单的前端调用 (30分钟)
async function testAI() {
  const response = await axios.post('/api/v1/ai/test', {
    goalTitle: '3个月学会 Vue3'
  });
  console.log(response.data.result);
}
```

**验证目标**:
- ✅ 后端能调用 OpenAI API
- ✅ 前端能发送请求并接收响应
- ✅ 数据流完整（前端 → 后端 → OpenAI → 后端 → 前端）
- ✅ 错误处理工作正常

---

## 📚 参考资源

### 技术文档
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [LangChain.js](https://js.langchain.com/docs/)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)

### 设计灵感
- Notion AI - 嵌入式助手
- Cursor - 侧边栏 + 快捷键
- GitHub Copilot - 上下文感知
- ChatGPT - 对话体验

### 竞品分析
- ClickUp AI
- Asana Intelligence
- Monday.com AI Assistant

---

## 📝 附录

### A. Prompt 模板示例

**Goal KR 生成 Prompt**:
```
你是一个目标管理专家。用户想创建以下目标：

目标: {goal_title}
时间范围: {duration}
类别: {category}

请生成 3 个符合 SMART 原则的关键结果（Key Results）：
1. 具体可衡量（Specific & Measurable）
2. 有明确的指标类型（数量、百分比、时间等）
3. 时间限定在目标时间范围内
4. 具有挑战性但可实现

输出格式（JSON）：
{
  "krs": [
    {
      "title": "关键结果标题",
      "metric_type": "数量|百分比|时间|是否",
      "current_value": "当前值（如适用）",
      "target_value": "目标值",
      "deadline": "截止日期",
      "reasoning": "为什么建议这个 KR"
    }
  ]
}
```

### B. 测试用例示例

```typescript
describe('GoalPlugin', () => {
  it('should generate valid KRs for fitness goal', async () => {
    const goal = {
      title: '3个月内减肥10斤',
      category: 'health',
      duration: 90
    };
    
    const result = await goalPlugin.generateKRs(goal);
    
    expect(result.krs).toHaveLength(3);
    expect(result.krs[0]).toMatchObject({
      title: expect.any(String),
      metric_type: expect.stringMatching(/数量|百分比|时间|是否/),
      target_value: expect.any(String),
      deadline: expect.any(String)
    });
  });
});
```

---

**文档版本历史**:
- v1.0 (2025-11-09): 初始版本，基于 BMad 团队讨论
- v1.1 (2025-11-09): 架构修正 - 更新为 Express + Prisma 架构，移除依赖注入，添加后端代码示例

**维护者**: BMad Master  
**审阅者**: 用户  
**批准者**: 待定
