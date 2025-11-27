# Story AI-002: AI Goal 全流程创建 + 多平台 Provider 配置

## 📋 Story 概述

| 属性         | 值                                 |
| ------------ | ---------------------------------- |
| **Story ID** | AI-002                             |
| **优先级**   | P0 (核心功能)                      |
| **预估工时** | 16h                                |
| **依赖**     | Goal 模块、现有 AI 模块            |
| **影响范围** | contracts, domain-server, api, web |

### 用户故事

> 作为一个用户，我希望能够通过 AI 悬浮按钮快速输入我的想法，让 AI 帮我生成规范的 OKR 目标（包含关键结果），并在确认后保存到系统中。
>
> 作为一个用户，我希望能够配置自己的 AI 服务提供商（如七牛云、OpenAI），包括 API Key 和请求地址，系统能自动获取可用模型列表供我选择。

---

## 🎯 验收标准 (Acceptance Criteria)

### AC-1: AI Provider 配置功能

- [ ] 用户可以在设置页面添加 AI 服务提供商
- [ ] 支持输入：名称、服务类型、API 地址、API Key
- [ ] 点击"测试连接"后自动获取可用模型列表
- [ ] 用户可以选择默认模型
- [ ] 支持多个 Provider，可设置一个为默认
- [ ] API Key 加密存储，前端不返回明文

### AC-2: AI Goal 生成功能

- [ ] 点击 AI 悬浮按钮打开创建对话框
- [ ] 用户输入想法后，AI 生成结构化目标草稿
- [ ] 目标草稿包含：标题、描述、动机、类别、建议时间、重要性/紧急性、标签
- [ ] 用户可以编辑目标草稿
- [ ] 确认目标后，自动进入 KR 生成阶段

### AC-3: AI Key Results 生成功能

- [ ] 基于确认的目标自动生成 3-5 个关键结果
- [ ] 每个 KR 包含：标题、目标值、单位、权重、聚合方式
- [ ] 用户可以编辑、添加、删除 KR
- [ ] 确认后一键保存目标和所有 KR

### AC-4: 流程完整性

- [ ] 支持"重新生成"回到上一步
- [ ] 支持取消整个流程
- [ ] 生成过程显示 loading 状态
- [ ] 错误时显示友好提示

---

## 🏗️ 技术设计

### 架构遵循 DDD 分层

```
packages/contracts/          ← 1. 契约层（DTO、枚举、接口）
packages/domain-server/      ← 2. 领域层（实体、领域服务）
apps/api/                    ← 3. 应用层 + 基础设施层
apps/web/                    ← 4. 表现层（前端）
```

### 新增/修改文件清单

#### Phase 1: Contracts 层

```
packages/contracts/src/modules/ai/
├── enums.ts                              # 修改：添加 AIProviderType
├── aggregates/
│   └── AIProviderConfigClient.ts         # 新增：Provider 配置 DTO
├── api-requests/
│   ├── GenerateGoalRequest.ts            # 新增：生成目标请求
│   ├── AIProviderConfigRequest.ts        # 新增：Provider 配置请求
│   └── index.ts                          # 修改：导出新增类型
├── api-responses/
│   ├── GenerateGoalResponse.ts           # 新增：生成目标响应
│   └── index.ts                          # 修改：导出新增类型
└── index.ts                              # 修改：导出新增模块
```

#### Phase 2: Domain-Server 层

```
packages/domain-server/src/ai/
├── aggregates/
│   └── AIProviderConfig.ts               # 新增：Provider 配置聚合根
├── repositories/
│   └── IAIProviderConfigRepository.ts    # 新增：仓储接口
├── services/
│   └── AIGenerationValidationService.ts  # 修改：添加目标验证
└── index.ts                              # 修改：导出
```

#### Phase 3: API 层

```
apps/api/prisma/
└── schema.prisma                         # 修改：添加 aiProviderConfig 表

apps/api/src/modules/ai/
├── infrastructure/
│   ├── adapters/
│   │   ├── QiniuAdapter.ts               # 新增：七牛云适配器
│   │   ├── CustomOpenAIAdapter.ts        # 新增：自定义 OpenAI 兼容适配器
│   │   └── AIAdapterFactory.ts           # 新增：适配器工厂
│   ├── repositories/
│   │   └── PrismaAIProviderConfigRepository.ts  # 新增
│   └── prompts/
│       └── goalGenerationPrompt.ts       # 新增：目标生成提示词
├── application/services/
│   ├── AIGenerationApplicationService.ts # 修改：添加 generateGoal
│   └── AIProviderConfigService.ts        # 新增：Provider 配置服务
└── interface/http/
    ├── AIProviderController.ts           # 新增：Provider 控制器
    └── aiRoutes.ts                       # 修改：添加新路由
```

#### Phase 4: Web 前端层

```
apps/web/src/modules/ai/
├── api/
│   └── aiGenerationApiClient.ts          # 修改：添加新 API
├── presentation/
│   ├── components/
│   │   ├── AIGoalCreatorFab.vue          # 新增：AI 悬浮按钮
│   │   ├── AIGoalCreatorModal.vue        # 新增：创建对话框
│   │   ├── GoalDraftEditor.vue           # 新增：目标草稿编辑器
│   │   └── KRDraftEditor.vue             # 新增：KR 草稿编辑器
│   └── composables/
│       ├── useAIGoalCreation.ts          # 新增：Goal 创建逻辑
│       └── useAIProviders.ts             # 新增：Provider 管理逻辑
└── stores/
    └── aiProviderStore.ts                # 新增：Provider 状态

apps/web/src/modules/setting/
└── presentation/
    ├── components/
    │   └── AIProviderSettings.vue        # 新增：AI 设置组件
    └── views/
        └── UserSettingsView.vue          # 修改：添加 AI 设置区块
```

---

## 📝 详细设计

### 1. Contracts 层设计

#### 1.1 枚举扩展

```typescript
// packages/contracts/src/modules/ai/enums.ts

/** AI 服务提供商类型 */
export enum AIProviderType {
  OPENAI = 'OPENAI',
  QINIU = 'QINIU',
  ANTHROPIC = 'ANTHROPIC',
  CUSTOM = 'CUSTOM',
}

/** 生成任务类型 - 新增 */
export enum GenerationTaskType {
  // ... 现有
  GOAL_GENERATION = 'GOAL_GENERATION', // 新增
}
```

#### 1.2 AIProviderConfig DTO

```typescript
// packages/contracts/src/modules/ai/aggregates/AIProviderConfigClient.ts

export interface AIProviderConfigClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  providerType: AIProviderType;
  baseUrl: string;
  apiKeyMasked: string; // 前端只显示掩码 "sk-****xxxx"
  defaultModel: string | null;
  availableModels: string[]; // 缓存的可用模型列表
  isActive: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AIProviderConfigServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string; // 服务端保留完整 Key（加密存储）
  defaultModel: string | null;
  availableModels: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}
```

#### 1.3 GenerateGoal 请求/响应

```typescript
// packages/contracts/src/modules/ai/api-requests/GenerateGoalRequest.ts

export interface GenerateGoalRequest {
  /** 用户输入的原始想法 */
  idea: string;
  /** 可选：目标类别 */
  category?: string;
  /** 可选：时间范围建议 */
  timeframe?: {
    startDate?: number;
    endDate?: number;
  };
  /** 可选：额外上下文 */
  context?: string;
  /** 可选：指定使用的 Provider UUID */
  providerUuid?: string;
}

// packages/contracts/src/modules/ai/api-responses/GenerateGoalResponse.ts

export interface GeneratedGoalDraft {
  title: string;
  description: string;
  motivation?: string;
  category?: string;
  suggestedStartDate: number;
  suggestedEndDate: number;
  importance: number; // 1-4
  urgency: number; // 1-4
  tags: string[];
  feasibilityAnalysis?: string;
}

export interface GenerateGoalResponse {
  goal: GeneratedGoalDraft;
  tokenUsage: TokenUsageServerDTO;
  generatedAt: number;
  providerUsed: string; // 使用的 Provider 名称
  modelUsed: string; // 使用的模型
}
```

#### 1.4 AIProviderConfig 请求

```typescript
// packages/contracts/src/modules/ai/api-requests/AIProviderConfigRequest.ts

export interface CreateAIProviderRequest {
  name: string;
  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
}

export interface UpdateAIProviderRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  defaultModel?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface TestAIProviderRequest {
  providerType: AIProviderType;
  baseUrl: string;
  apiKey: string;
}

export interface TestAIProviderResponse {
  success: boolean;
  message?: string;
  models?: Array<{ id: string; name: string }>;
}
```

---

### 2. 数据库设计

```prisma
// apps/api/prisma/schema.prisma

model aiProviderConfig {
  uuid           String   @id @default(uuid())
  accountUuid    String   @map("account_uuid")
  name           String
  providerType   String   @map("provider_type")    // QINIU, OPENAI, ANTHROPIC, CUSTOM
  baseUrl        String   @map("base_url")
  apiKeyEncrypted String  @map("api_key_encrypted") // AES-256 加密
  defaultModel   String?  @map("default_model")
  availableModels String  @default("[]") @map("available_models") // JSON array
  isActive       Boolean  @default(true) @map("is_active")
  isDefault      Boolean  @default(false) @map("is_default")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  account        account  @relation(fields: [accountUuid], references: [uuid], onDelete: Cascade)

  @@unique([accountUuid, name])
  @@index([accountUuid])
  @@index([isDefault])
  @@map("ai_provider_configs")
}
```

---

### 3. API 设计

#### Provider 管理 API

| 方法     | 路径                                  | 描述                    |
| -------- | ------------------------------------- | ----------------------- |
| `POST`   | `/api/ai/providers`                   | 添加 Provider           |
| `GET`    | `/api/ai/providers`                   | 获取用户的所有 Provider |
| `GET`    | `/api/ai/providers/:uuid`             | 获取单个 Provider       |
| `PUT`    | `/api/ai/providers/:uuid`             | 更新 Provider           |
| `DELETE` | `/api/ai/providers/:uuid`             | 删除 Provider           |
| `POST`   | `/api/ai/providers/test`              | 测试连接（无需保存）    |
| `POST`   | `/api/ai/providers/:uuid/test`        | 测试已保存的 Provider   |
| `GET`    | `/api/ai/providers/:uuid/models`      | 获取模型列表            |
| `POST`   | `/api/ai/providers/:uuid/set-default` | 设为默认                |

#### Goal 生成 API

| 方法   | 路径                             | 描述                       |
| ------ | -------------------------------- | -------------------------- |
| `POST` | `/api/ai/generate/goal`          | 生成目标草稿               |
| `POST` | `/api/ai/generate/goal-with-krs` | 一次性生成目标+KRs（可选） |

---

### 4. Prompt 设计

```typescript
// apps/api/src/modules/ai/infrastructure/prompts/goalGenerationPrompt.ts

export const GOAL_GENERATION_PROMPT = {
  system: `你是一位专业的OKR教练和目标规划专家。根据用户的想法，生成一个规范、可执行的OKR目标。

## 输出要求

1. **目标标题**: 简洁有力，鼓舞人心，20字以内
2. **描述**: 详细说明目标的内涵，100-200字
3. **动机**: 为什么这个目标重要，对用户有什么价值
4. **类别**: work(工作)/health(健康)/learning(学习)/personal(个人)/finance(财务)/relationship(人际)
5. **时间建议**: 根据目标复杂度建议合理的起止日期
6. **重要性/紧急性**: 1-4级评估
7. **标签**: 3-5个相关标签
8. **可行性分析**: 简要分析实现的可能性和挑战

## 输出格式

严格返回 JSON 格式：
{
  "title": "目标标题",
  "description": "详细描述",
  "motivation": "目标动机",
  "category": "类别",
  "suggestedStartDate": "2025-01-01",
  "suggestedEndDate": "2025-03-31",
  "importance": 3,
  "urgency": 2,
  "tags": ["标签1", "标签2"],
  "feasibilityAnalysis": "可行性分析..."
}`,

  user: (context: {
    idea: string;
    category?: string;
    timeframe?: any;
    additionalContext?: string;
  }) => {
    let prompt = `## 用户想法\n${context.idea}\n`;

    if (context.category) {
      prompt += `\n## 期望类别\n${context.category}\n`;
    }

    if (context.timeframe) {
      prompt += `\n## 期望时间范围\n开始: ${context.timeframe.startDate || '不限'}\n结束: ${context.timeframe.endDate || '不限'}\n`;
    }

    if (context.additionalContext) {
      prompt += `\n## 补充信息\n${context.additionalContext}\n`;
    }

    prompt += `\n请根据以上信息生成规范的OKR目标。`;
    return prompt;
  },
};
```

---

### 5. 前端交互流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Goal 创建流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Step 1   │    │   Step 2     │    │   Step 3     │          │
│  │ 输入想法  │ → │ 审核/编辑目标 │ → │ 审核/编辑 KRs │ → 保存   │
│  └──────────┘    └──────────────┘    └──────────────┘          │
│       │                │                    │                   │
│       ▼                ▼                    ▼                   │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ 文本输入  │    │ 表单编辑器    │    │ KR 列表编辑器 │          │
│  │ 类别选择  │    │ - 标题        │    │ - 添加/删除   │          │
│  │ 时间建议  │    │ - 描述        │    │ - 编辑详情    │          │
│  │          │    │ - 时间        │    │ - 调整权重    │          │
│  │ [生成]   │    │ - 重要性/紧急 │    │              │          │
│  └──────────┘    │ [确认] [重生成]│    │ [保存] [重生成]│          │
│                  └──────────────┘    └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ 实施计划

### Sprint 1: 基础设施 (4h)

| 任务                             | 预估 | 产出       |
| -------------------------------- | ---- | ---------- |
| 1.1 Contracts 层 - 新增枚举、DTO | 1h   | 类型定义   |
| 1.2 Prisma Model + Migration     | 0.5h | 数据库表   |
| 1.3 Domain-Server 实体和仓储接口 | 1h   | 领域层     |
| 1.4 API 仓储实现                 | 1.5h | 基础设施层 |

### Sprint 2: Provider 管理 (4h)

| 任务                              | 预估 | 产出   |
| --------------------------------- | ---- | ------ |
| 2.1 QiniuAdapter 实现             | 1h   | 适配器 |
| 2.2 AIAdapterFactory              | 0.5h | 工厂   |
| 2.3 Provider Service + Controller | 1.5h | 应用层 |
| 2.4 前端 AI 设置组件              | 1h   | UI     |

### Sprint 3: Goal 生成 (5h)

| 任务                          | 预估 | 产出   |
| ----------------------------- | ---- | ------ |
| 3.1 Goal 生成 Prompt          | 0.5h | Prompt |
| 3.2 generateGoal Service 方法 | 1h   | 服务   |
| 3.3 API 路由 + Controller     | 0.5h | 接口   |
| 3.4 前端 FAB + Modal          | 2h   | UI     |
| 3.5 Goal/KR Editor 组件       | 1h   | UI     |

### Sprint 4: 集成测试 (3h)

| 任务         | 预估 | 产出 |
| ------------ | ---- | ---- |
| 4.1 单元测试 | 1h   | 测试 |
| 4.2 集成测试 | 1h   | 测试 |
| 4.3 文档更新 | 1h   | 文档 |

---

## 🔐 安全考虑

1. **API Key 加密**: 使用 AES-256-GCM 加密存储
2. **Key 不返回前端**: GET 接口返回 `apiKeyMasked: "sk-****xxxx"`
3. **权限验证**: 只能访问自己的 Provider 配置
4. **Rate Limiting**: Provider API 限制请求频率
5. **输入验证**: 验证 baseUrl 格式、apiKey 非空

---

## 📚 参考资料

- [七牛云 AI API 文档](https://developer.qiniu.com/aitokenapi)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [现有 AI 模块 README](/docs/modules/ai/README.md)

---

## 📝 变更日志

| 版本 | 日期       | 作者 | 变更内容 |
| ---- | ---------- | ---- | -------- |
| 1.0  | 2025-11-27 | AI   | 初始版本 |
