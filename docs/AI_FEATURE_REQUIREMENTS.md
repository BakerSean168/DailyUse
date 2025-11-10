# DailyUse AI 功能需求文档 (PRD)

**文档版本**: 1.0  
**创建日期**: 2025-11-09  
**状态**: 待评审  
**负责人**: 产品团队  
**基于**: DDD 领域模型分析

---

## 📋 文档概述

本文档定义 DailyUse 项目的 AI 辅助功能需求，基于领域驱动设计（DDD）方法论建模。

### 文档目的
- 明确 AI 功能的业务价值和用户需求
- 定义核心领域模型和业务规则
- 指导技术实现和验收测试

### 相关文档
- 技术设计: `docs/AI_FEATURE_DESIGN.md`
- 实施指南: `docs/AI_FEATURE_QUICK_START.md`
- DDD 领域模型: 见本文档第 3 节

---

## 1️⃣ 业务背景与目标

### 1.1 业务背景

DailyUse 是一个目标管理和任务追踪系统，用户需要：
- 将大目标拆解为可执行的关键结果（Key Results）
- 为关键结果创建详细的任务计划
- 整理和总结项目文档
- 获得目标管理相关的智能建议

当前痛点：
- ❌ 目标拆解需要大量人工思考，效率低
- ❌ 任务规划缺乏最佳实践参考
- ❌ 文档整理耗时且容易遗漏要点
- ❌ 缺少智能化的决策辅助

### 1.2 业务目标

**核心目标**: 通过 AI 能力提升用户目标管理效率 50%

**具体目标**:
1. **提升目标拆解效率**: KR 生成时间从 30 分钟降至 5 分钟
2. **提高任务规划质量**: 提供可执行的任务模板
3. **简化文档整理**: 自动摘要节省 70% 时间
4. **增强决策支持**: 提供上下文感知的智能建议

### 1.3 成功指标

| 指标 | 当前值 | 目标值 | 测量方式 |
|------|--------|--------|----------|
| KR 生成时间 | 30 分钟 | ≤ 5 分钟 | 用户行为分析 |
| 用户满意度 | - | ≥ 4.0/5.0 | 功能评分 |
| AI 采纳率 | 0% | ≥ 60% | 使用率统计 |
| 每日活跃度 | - | +20% | DAU 增长 |

---

## 2️⃣ 用户需求与场景

### 2.1 目标用户

**主要用户**: 个人效能提升者
- 需要管理多个目标和项目
- 希望提高目标达成率
- 愿意使用 AI 工具辅助决策

**次要用户**: 团队管理者
- 需要协调团队 OKR
- 需要快速制定行动计划

### 2.2 核心用户故事

#### US-1: 智能生成 Goal 的 Key Results

**作为** 目标管理用户  
**我希望** 输入一个 Goal 描述后，AI 自动生成 3-5 个可衡量的 Key Results  
**以便** 快速拆解目标，节省规划时间

**验收标准**:
- ✅ 用户输入 Goal 标题和描述
- ✅ 系统在 10 秒内生成 3-5 个 KR 建议
- ✅ 每个 KR 包含：标题、指标类型、目标值、当前值
- ✅ 用户可以编辑或采纳生成的 KR
- ✅ 生成过程可见（流式输出）

**业务规则**:
- KR 必须符合 SMART 原则（具体、可衡量、可达成、相关、有时限）
- 至少包含一个数量型指标
- 支持的指标类型：数量、百分比、时间、是否型

---

#### US-2: 智能生成任务模板

**作为** 项目执行者  
**我希望** 基于 Key Result 自动生成任务模板  
**以便** 快速制定详细的执行计划

**验收标准**:
- ✅ 用户选择一个 KR 请求生成任务
- ✅ 系统生成 5-10 个任务建议
- ✅ 每个任务包含：标题、描述、预估时间、优先级
- ✅ 任务按执行顺序排序
- ✅ 用户可批量导入或单独编辑

**业务规则**:
- 任务粒度适中（2-8 小时完成）
- 任务之间有明确的依赖关系
- 总时长不超过 KR 预期时间

---

#### US-3: 智能文档摘要

**作为** 信息整理者  
**我希望** 上传或粘贴长文档后自动生成摘要  
**以便** 快速了解文档核心内容

**验收标准**:
- ✅ 支持上传 Markdown/TXT 文档（≤10MB）
- ✅ 支持粘贴文本（≤50,000 字符）
- ✅ 生成 3 段摘要：核心观点、关键信息、行动建议
- ✅ 摘要长度 ≤ 原文 20%
- ✅ 15 秒内完成摘要生成

---

#### US-4: 智能对话助手

**作为** 目标管理用户  
**我希望** 通过对话获得目标管理相关建议  
**以便** 解决具体问题并获得最佳实践指导

**验收标准**:
- ✅ 支持多轮对话（上下文保持）
- ✅ 理解 DailyUse 专业术语（Goal, KR, Task）
- ✅ 提供可操作的建议
- ✅ 响应时间 ≤ 5 秒
- ✅ 支持流式输出（逐字显示）

**业务规则**:
- 单个对话最多 50 轮
- 对话保存 30 天
- 可手动关闭或归档对话

---

#### US-5: 智能生成知识文档

**作为** 目标管理用户  
**我希望** 基于目标主题一键生成系列知识文档  
**以便** 快速构建目标相关的知识库，辅助目标达成

**验收标准**:
- ✅ 用户输入目标主题（如"减肥计划"）
- ✅ 系统生成 3-5 篇相关知识文档
- ✅ 每篇文档包含：标题、结构化内容（Markdown 格式）、关键要点
- ✅ 文档自动保存到知识仓库模块
- ✅ 支持预览和编辑后再保存
- ✅ 生成过程可见（流式输出）

**业务规则**:
- 每篇文档长度 500-2000 字
- 文档内容结构化：包含标题、大纲、正文、总结
- 文档主题与目标高度相关
- 支持的主题领域：健康、学习、工作、财务、技能等
- 文档默认标签：AI 生成、{目标主题}

**文档模板类型**:
- 📚 **知识概述型**: 介绍主题的基础知识和核心概念
- 📋 **行动指南型**: 提供具体的步骤和实践方法
- 💡 **最佳实践型**: 总结成功经验和注意事项
- 📊 **数据分析型**: 提供相关数据、研究和案例分析
- ❓ **FAQ 型**: 常见问题和解答

---

### 2.3 使用场景

#### 场景 1: 新建季度 OKR
1. 用户创建 Goal: "Q1 提升产品竞争力"
2. 点击"AI 生成 KR"按钮
3. AI 流式生成 4 个 KR 建议
4. 用户修改第 2 个 KR，采纳其他 3 个
5. 保存 Goal 及其 KRs

**预期结果**: 3 分钟完成 OKR 初稿，而非 30 分钟

---

#### 场景 2: 制定详细任务计划
1. 用户选择 KR: "用户满意度提升至 4.5 分"
2. 点击"生成任务模板"
3. AI 生成 8 个任务（调研、设计、开发、测试...）
4. 用户调整任务优先级和时间
5. 批量导入任务到 Task 模块

**预期结果**: 10 分钟完成详细计划，任务可直接执行

---

#### 场景 3: 整理项目复盘文档
1. 用户粘贴 5000 字的会议记录
2. 点击"生成摘要"
3. AI 生成 3 段摘要（核心观点、关键决策、待办事项）
4. 用户复制摘要到项目文档

**预期结果**: 2 分钟完成摘要，节省 15 分钟阅读时间

---

#### 场景 4: 快速构建目标知识库
1. 用户创建 Goal: "3 个月减重 10 公斤"
2. 点击"生成知识文档"按钮
3. 输入主题关键词: "科学减肥"
4. AI 生成 5 篇文档：
   - 《减肥的科学原理：热量与代谢》（知识概述型）
   - 《12 周减肥行动计划》（行动指南型）
   - 《健康饮食的 10 个最佳实践》（最佳实践型）
   - 《运动减肥效果数据分析》（数据分析型）
   - 《减肥常见问题 FAQ》（FAQ 型）
5. 用户预览文档，调整标题和内容
6. 一键保存到知识仓库的"减肥专题"分类

**预期结果**: 5 分钟构建完整知识库，而非数小时搜索和整理

---

## 3️⃣ DDD 领域模型

### 3.1 领域概述

AI 功能模块是 DailyUse 的支撑域（Supporting Domain），为核心域（Goal/Task）提供智能化能力。

**限界上下文**: AI Context  
**依赖关系**: AI Context → Goal Context, Task Context, User Context, KnowledgeBase Context

### 3.2 聚合根（Aggregate Roots）

#### AR-1: AIConversation（AI 对话）

**职责**: 管理用户与 AI 的对话会话

**属性**:
```typescript
AIConversation {
  id: string                      // 对话 ID
  userId: string                  // 用户 ID
  title: string                   // 对话标题
  status: ConversationStatus      // 状态：ACTIVE | CLOSED | ARCHIVED
  createdAt: Date                 // 创建时间
  updatedAt: Date                 // 更新时间
  messages: Message[]             // 消息列表（实体）
}
```

**不变量（Invariants）**:
- 对话创建时必须有标题
- CLOSED/ARCHIVED 状态不可再添加消息
- 消息必须按时间顺序排列
- 单个对话最多 50 条消息

**实体**: Message
```typescript
Message {
  id: string                      // 消息 ID
  conversationId: string          // 所属对话
  role: MessageRole               // 角色：USER | ASSISTANT | SYSTEM
  content: string                 // 消息内容
  createdAt: Date                 // 创建时间
}
```

---

#### AR-2: AIGenerationTask（AI 生成任务）

**职责**: 管理 AI 生成任务的生命周期

**属性**:
```typescript
AIGenerationTask {
  id: string                      // 任务 ID
  userId: string                  // 用户 ID
  type: GenerationTaskType        // 类型：GOAL_KEY_RESULTS | TASK_TEMPLATES | DOCUMENT_SUMMARY | KNOWLEDGE_DOCUMENTS
  status: TaskStatus              // 状态：PENDING | PROCESSING | COMPLETED | FAILED
  input: GenerationInput          // 输入数据（值对象）
  result: GenerationResult?       // 生成结果（值对象）
  error: string?                  // 错误信息
  createdAt: Date                 // 创建时间
  completedAt: Date?              // 完成时间
}
```

**不变量**:
- 任务创建时状态必须为 PENDING
- COMPLETED 状态必须有 result
- FAILED 状态必须有 error
- 不可从 COMPLETED/FAILED 状态变更到其他状态

**值对象**: GenerationInput
```typescript
GenerationInput {
  goalId?: string                 // 关联的 Goal ID
  keyResultId?: string            // 关联的 KR ID
  content: string                 // 输入内容
  options: {
    model?: string                // AI 模型
    temperature?: number          // 温度参数
    maxTokens?: number            // 最大 Token 数
  }
}
```

**值对象**: GenerationResult
```typescript
GenerationResult {
  content: string                 // 生成内容（JSON 或文本）
  usage: TokenUsage               // Token 使用情况
  version: number                 // 版本号（当前固定为 1）
}
```

---

#### AR-3: AIUsageQuota（AI 使用配额）

**职责**: 管理用户的 AI 使用配额和限制

**属性**:
```typescript
AIUsageQuota {
  id: string                      // 配额 ID
  userId: string                  // 用户 ID
  period: QuotaResetPeriod        // 重置周期：DAILY | WEEKLY | MONTHLY
  limit: number                   // 配额上限
  used: number                    // 已使用次数
  resetAt: Date                   // 下次重置时间
  createdAt: Date                 // 创建时间
  updatedAt: Date                 // 更新时间
}
```

**不变量**:
- used 不能超过 limit
- resetAt 必须在未来
- used 在 resetAt 时归零

**业务规则**:
- 默认配额：每用户每日 50 次
- 超额后拒绝服务
- 管理员可手动调整配额

---

### 3.3 领域服务（Domain Services）

#### DS-1: AIGenerationService

**职责**: 协调 AI 生成任务的执行

**方法**:
```typescript
interface AIGenerationService {
  // 生成 Key Results
  generateKeyResults(input: GenerationInput): Promise<KeyResultPreview[]>
  
  // 生成任务模板
  generateTaskTemplates(input: GenerationInput): Promise<TaskTemplatePreview[]>
  
  // 生成文档摘要
  generateDocumentSummary(input: GenerationInput): Promise<DocumentSummary>
  
  // 生成知识文档
  generateKnowledgeDocuments(input: GenerationInput): Promise<KnowledgeDocumentPreview[]>
  
  // 流式对话
  streamChat(conversationId: string, message: string): AsyncIterator<string>
}
```

---

#### DS-2: ConversationManagementService

**职责**: 管理对话的创建、更新、关闭

**方法**:
```typescript
interface ConversationManagementService {
  // 创建对话
  createConversation(userId: string, title: string): Promise<AIConversation>
  
  // 添加消息
  addMessage(conversationId: string, message: Message): Promise<void>
  
  // 关闭对话
  closeConversation(conversationId: string): Promise<void>
  
  // 归档对话
  archiveConversation(conversationId: string): Promise<void>
}
```

---

#### DS-3: QuotaEnforcementService

**职责**: 强制执行配额限制

**方法**:
```typescript
interface QuotaEnforcementService {
  // 检查配额
  checkQuota(userId: string): Promise<boolean>
  
  // 消耗配额
  consumeQuota(userId: string): Promise<void>
  
  // 重置配额
  resetQuota(userId: string): Promise<void>
  
  // 获取配额状态
  getQuotaStatus(userId: string): Promise<QuotaStatus>
}
```

---

### 3.4 领域事件（Domain Events）

```typescript
// 对话创建事件
ConversationCreatedEvent {
  conversationId: string
  userId: string
  title: string
  createdAt: Date
}

// 消息添加事件
MessageAddedEvent {
  conversationId: string
  messageId: string
  role: MessageRole
  content: string
  createdAt: Date
}

// 生成完成事件
GenerationCompletedEvent {
  taskId: string
  userId: string
  type: GenerationTaskType
  result: GenerationResult
  completedAt: Date
}

// 配额超限事件
QuotaExceededEvent {
  userId: string
  limit: number
  used: number
  occurredAt: Date
}

// 知识文档生成完成事件
KnowledgeDocumentsGeneratedEvent {
  taskId: string
  userId: string
  goalId?: string
  documentIds: string[]
  documentCount: number
  completedAt: Date
}
```

**事件用途**:
- ✅ 模块解耦（通过事件总线）
- ✅ 审计日志
- ✅ 异步通知
- ✅ 数据同步

---

## 4️⃣ 功能需求清单

### 4.1 核心功能（MVP）

| ID | 功能 | 优先级 | 依赖 |
|----|------|--------|------|
| F-01 | 生成 Goal 的 Key Results | P0 | - |
| F-02 | 生成任务模板 | P0 | - |
| F-03 | 文档摘要 | P1 | - |
| F-04 | 智能对话助手 | P1 | F-01, F-02 |
| F-05 | 使用配额管理 | P0 | - |
| F-06 | 对话历史管理 | P1 | F-04 |
| F-07 | 生成知识文档系列 | P0 | - |

### 4.2 扩展功能（后续迭代）

| ID | 功能 | 优先级 | 计划版本 |
|----|------|--------|----------|
| F-08 | 多模型切换（GPT/Claude） | P2 | v1.1 |
| F-09 | 自定义 AI 提示词 | P3 | v1.2 |
| F-10 | 批量生成 | P2 | v1.2 |
| F-11 | 导出对话记录 | P3 | v1.3 |
| F-12 | 自定义文档模板 | P2 | v1.2 |
| F-13 | 文档标签和分类自动推荐 | P3 | v1.3 |

---

## 5️⃣ 非功能性需求

### 5.1 性能需求

| 指标 | 要求 | 测量方式 |
|------|------|----------|
| API 响应时间 | ≤ 10 秒（同步） | 服务端日志 |
| 流式首字节时间 | ≤ 2 秒 | 客户端监控 |
| 并发支持 | 100 用户同时请求 | 压力测试 |
| 数据库查询 | ≤ 100ms（单次） | APM 工具 |

### 5.2 可用性需求

- **系统可用性**: ≥ 99%
- **错误率**: ≤ 1%
- **降级策略**: AI 服务故障时显示友好提示

### 5.3 安全需求

| 需求 | 说明 |
|------|------|
| API Key 管理 | 仅后端存储，不暴露给前端 |
| 数据加密 | 敏感数据传输使用 HTTPS |
| 权限控制 | 用户只能访问自己的对话和任务 |
| 速率限制 | 单用户每分钟最多 10 次请求 |

### 5.4 数据需求

| 需求 | 说明 |
|------|------|
| 数据保留 | 对话保存 30 天，任务永久保存 |
| 数据备份 | 每日增量备份 |
| 数据删除 | 支持用户手动删除对话 |
| GDPR 合规 | 支持数据导出和完全删除 |

---

## 6️⃣ 业务规则与约束

### 6.1 核心业务规则（基于用户决策）

#### BR-1: 完整对话持久化
**规则**: 所有用户与 AI 的对话必须完整保存  
**原因**: 支持上下文追溯和审计  
**实现**: 每条消息立即写入数据库

#### BR-2: 同步生成模式
**规则**: AI 生成任务采用同步模式（等待响应）  
**原因**: 简化状态管理，提供即时反馈  
**实现**: 使用 SSE 流式输出，前端阻塞等待

#### BR-3: 单版本策略
**规则**: 每个生成任务仅保留最新版本  
**原因**: 简化存储，避免版本混乱  
**实现**: 覆盖式更新，不保留历史版本

#### BR-4: 每日配额限制
**规则**: 每用户每日 AI 请求限额 50 次  
**原因**: 控制成本，防止滥用  
**实现**: QuotaEnforcementService 强制校验

#### BR-5: 事件总线解耦
**规则**: AI 模块与其他模块通过领域事件通信  
**原因**: 降低耦合，提高可维护性  
**实现**: 发布 GenerationCompletedEvent 等事件

#### BR-6: 知识文档自动保存
**规则**: 生成的知识文档自动保存到知识仓库模块  
**原因**: 简化用户操作，确保数据不丢失  
**实现**: 通过 KnowledgeDocumentsGeneratedEvent 触发保存

#### BR-7: 文档模板多样性
**规则**: 同一主题生成的文档必须涵盖不同类型  
**原因**: 提供全面的知识视角  
**实现**: 至少包含 3 种不同的文档类型（知识概述、行动指南、最佳实践等）

---

### 6.2 数据验证规则

| 字段 | 规则 |
|------|------|
| Goal 描述 | 10-500 字符 |
| KR 标题 | 5-100 字符 |
| 文档内容 | ≤ 50,000 字符 |
| 对话消息 | ≤ 5,000 字符 |
| 对话轮次 | ≤ 50 轮 |
| 知识文档主题 | 2-50 字符 |
| 单次生成文档数 | 3-5 篇 |
| 单篇文档长度 | 500-2,000 字 |

---

### 6.3 错误处理规则

| 错误类型 | 处理方式 |
|----------|----------|
| 配额超限 | 返回 429 状态码 + 友好提示 |
| AI 服务超时 | 10 秒后返回超时错误 |
| 输入格式错误 | 返回 400 + 具体错误信息 |
| AI 返回空内容 | 重试 1 次，失败则提示用户 |

---

## 7️⃣ 验收标准

### 7.1 功能验收

**F-01: 生成 Key Results**
- [ ] 用户输入 Goal，点击"生成 KR"
- [ ] 10 秒内返回 3-5 个 KR
- [ ] 每个 KR 包含标题、指标类型、目标值
- [ ] 支持流式显示生成过程
- [ ] 用户可编辑和采纳 KR

**F-02: 生成任务模板**
- [ ] 用户选择 KR，点击"生成任务"
- [ ] 15 秒内返回 5-10 个任务
- [ ] 任务包含标题、描述、时长、优先级
- [ ] 支持批量导入到 Task 模块

**F-05: 配额管理**
- [ ] 新用户默认每日 50 次配额
- [ ] 超额请求返回 429 错误
- [ ] 每日 00:00 自动重置配额
- [ ] 管理员可手动调整配额

**F-07: 生成知识文档系列**
- [ ] 用户输入主题关键词，点击"生成知识文档"
- [ ] 30 秒内返回 3-5 篇文档预览
- [ ] 每篇文档包含标题、Markdown 内容、文档类型
- [ ] 支持预览、编辑和选择性保存
- [ ] 文档自动保存到知识仓库模块
- [ ] 自动添加标签：AI 生成、主题标签

---

### 7.2 性能验收

- [ ] API 响应时间 P95 ≤ 10 秒
- [ ] 流式首字节 P95 ≤ 2 秒
- [ ] 并发 100 用户无报错
- [ ] 数据库查询 P95 ≤ 100ms

---

### 7.3 安全验收

- [ ] API Key 不出现在前端代码
- [ ] 所有请求通过 HTTPS
- [ ] 用户只能访问自己的数据
- [ ] 速率限制生效（10 req/min）

---

## 8️⃣ 实施计划

### 8.1 里程碑

| 里程碑 | 交付内容 | 目标日期 |
|--------|----------|----------|
| M1: Contracts 完成 | 所有 DTO/Enum 定义 | Week 1 |
| M2: 后端 MVP | F-01, F-02, F-05 | Week 2-3 |
| M3: 前端集成 | UI + 状态管理 | Week 4 |
| M4: 测试与优化 | 性能测试 + Bug 修复 | Week 5 |
| M5: 上线准备 | 文档 + 部署 | Week 6 |

### 8.2 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| AI API 成本超预算 | 高 | 中 | 配额限制 + 成本监控 |
| AI 响应质量不稳定 | 中 | 高 | 提示词优化 + 多模型切换 |
| 并发性能瓶颈 | 中 | 低 | 负载测试 + 缓存优化 |
| 数据隐私合规风险 | 高 | 低 | 法律审查 + 隐私政策 |

---

## 9️⃣ 附录

### 9.1 术语表

| 术语 | 定义 |
|------|------|
| Goal | 用户设定的长期目标 |
| Key Result (KR) | 衡量 Goal 达成的具体指标 |
| Task | 执行 KR 的具体任务 |
| Aggregate Root | DDD 中的聚合根实体 |
| Domain Event | DDD 中的领域事件 |
| SSE | Server-Sent Events，服务端推送 |

### 9.2 参考资料

- DDD: Domain-Driven Design by Eric Evans
- Vercel AI SDK: https://sdk.vercel.ai/docs
- OpenAI API: https://platform.openai.com/docs

---

**文档结束**  
**下一步**: 评审本文档 → 实施 M1（完成 Contracts 包）
