# AI 功能 - User Story 文档

**项目**: DailyUse AI 功能模块  
**Epic**: AI 辅助目标管理  
**版本**: 1.0  
**创建日期**: 2025-11-09  
**基于**: AI_FEATURE_REQUIREMENTS.md (PRD v1.0)

---

## 📋 Epic 分解

### Epic 1: AI 生成能力 (AI Generation Capabilities)
**业务价值**: 通过 AI 自动生成内容，提升用户效率 50%  
**优先级**: P0  
**预估周期**: 3 周

**包含 Stories**:
- Story 1.1: 生成 Goal 的 Key Results
- Story 1.2: 生成任务模板
- Story 1.3: 生成知识文档系列
- Story 1.4: 生成文档摘要

---

### Epic 2: AI 对话能力 (AI Conversation)
**业务价值**: 提供智能对话助手，辅助用户决策  
**优先级**: P1  
**预估周期**: 2 周

**包含 Stories**:
- Story 2.1: 多轮对话功能
- Story 2.2: 对话历史管理
- Story 2.3: 流式响应优化

---

### Epic 3: AI 配额与安全 (AI Quota & Security)
**业务价值**: 控制成本，保障系统安全  
**优先级**: P0  
**预估周期**: 1 周

**包含 Stories**:
- Story 3.1: 配额管理系统
- Story 3.2: API Key 安全管理
- Story 3.3: 速率限制与降级

---

## 📖 User Stories

---

### Story 1.1: 生成 Goal 的 Key Results

**Story ID**: AI-001  
**Epic**: Epic 1 - AI 生成能力  
**优先级**: P0  
**Story Points**: 8  
**Sprint**: Sprint 1

#### 用户故事
```
作为 目标管理用户
我希望 输入一个 Goal 描述后，AI 自动生成 3-5 个可衡量的 Key Results
以便 快速拆解目标，节省规划时间
```

#### 验收标准 (Acceptance Criteria)

**Given-When-Then 格式**:

```gherkin
Scenario 1: 成功生成 KRs
  Given 用户已登录系统
  And 用户创建了一个 Goal "提升产品竞争力"
  When 用户点击"AI 生成 KR"按钮
  Then 系统应在 10 秒内返回 3-5 个 KR 建议
  And 每个 KR 包含：标题、指标类型、目标值、当前值
  And 生成过程以流式方式显示
  And 用户可以编辑每个 KR
  And 用户可以选择采纳或拒绝每个 KR

Scenario 2: 配额不足
  Given 用户已用完今日配额
  When 用户点击"AI 生成 KR"按钮
  Then 系统应返回 429 错误
  And 显示提示："今日 AI 额度已用完，明日 00:00 重置"

Scenario 3: AI 服务超时
  Given AI 服务响应时间超过 10 秒
  When 用户等待生成结果
  Then 系统应显示超时错误
  And 提示用户重试

Scenario 4: 生成内容质量检查
  Given AI 成功生成 KRs
  When 系统验证生成内容
  Then 至少包含 1 个数量型指标
  And 每个 KR 符合 SMART 原则
  And KR 标题长度 5-100 字符
```

#### 技术任务 (Technical Tasks)

**后端任务**:
- [ ] Task 1.1.1: 创建 AI Contracts (DTO/Enum) - 2 SP
  - 定义 GenerateKeyResultsRequestDTO
  - 定义 KeyResultPreviewDTO
  - 定义相关枚举
  
- [ ] Task 1.1.2: 实现 OpenAI Adapter - 3 SP
  - 创建 BaseAIAdapter 抽象类
  - 实现 OpenAIAdapter
  - 实现流式响应支持
  
- [ ] Task 1.1.3: 实现 AIGenerationService - 3 SP
  - 实现 generateKeyResults() 方法
  - 集成 QuotaEnforcementService
  - 添加错误处理和重试逻辑
  
- [ ] Task 1.1.4: 创建 API 端点 - 2 SP
  - POST /api/ai/generate/key-results
  - 实现 SSE 流式响应
  - 添加速率限制中间件

**前端任务**:
- [ ] Task 1.1.5: 创建 AI Store (Pinia) - 2 SP
  - 状态管理：loading, result, error
  - Action: generateKeyResults()
  - 处理 SSE 流式更新
  
- [ ] Task 1.1.6: 实现 KR 生成 UI 组件 - 3 SP
  - AIGenerateKRButton.vue
  - KRPreviewList.vue
  - 流式显示动画
  - 编辑和采纳功能

**测试任务**:
- [ ] Task 1.1.7: 单元测试 - 2 SP
  - OpenAIAdapter 测试
  - AIGenerationService 测试
  - API 端点测试
  
- [ ] Task 1.1.8: E2E 测试 - 2 SP
  - 成功生成场景
  - 配额不足场景
  - 超时场景

**总计**: 19 Story Points (约 2-3 天)

#### 依赖关系
- 依赖：无
- 阻塞：Story 1.2, Story 2.1

#### 技术方案
- 使用 Vercel AI SDK + OpenAI API
- SSE (Server-Sent Events) 实现流式响应
- Prompt Engineering: 参考 `prompts/generate-key-results.md`

#### 风险与缓解
| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| AI 生成质量不稳定 | 高 | 中 | Prompt 优化 + 人工校验 |
| 响应时间过长 | 中 | 低 | 设置 10 秒超时 + 重试 |
| 成本超预算 | 高 | 中 | 每日配额限制 50 次 |

---

### Story 1.2: 生成任务模板

**Story ID**: AI-002  
**Epic**: Epic 1 - AI 生成能力  
**优先级**: P0  
**Story Points**: 8  
**Sprint**: Sprint 1

#### 用户故事
```
作为 项目执行者
我希望 基于 Key Result 自动生成任务模板
以便 快速制定详细的执行计划
```

#### 验收标准

```gherkin
Scenario 1: 成功生成任务模板
  Given 用户选择了一个 KR "用户满意度提升至 4.5 分"
  When 用户点击"生成任务模板"按钮
  Then 系统应在 15 秒内返回 5-10 个任务建议
  And 每个任务包含：标题、描述、预估时间、优先级
  And 任务按执行顺序排序
  And 用户可以批量导入或单独编辑

Scenario 2: 任务质量验证
  Given AI 成功生成任务模板
  When 系统验证任务内容
  Then 每个任务粒度为 2-8 小时
  And 任务之间有明确依赖关系
  And 总时长不超过 KR 预期时间

Scenario 3: 批量导入任务
  Given 用户查看生成的任务模板
  When 用户点击"批量导入"
  Then 所有任务应保存到 Task 模块
  And 保持任务的顺序和依赖关系
  And 任务状态为"未开始"
```

#### 技术任务

**后端**:
- [ ] Task 1.2.1: 扩展 AIGenerationService - 3 SP
- [ ] Task 1.2.2: 创建 API 端点 POST /api/ai/generate/tasks - 2 SP
- [ ] Task 1.2.3: 实现任务导入逻辑 - 2 SP

**前端**:
- [ ] Task 1.2.4: TaskTemplatePreview 组件 - 3 SP
- [ ] Task 1.2.5: 批量导入功能 - 2 SP

**测试**:
- [ ] Task 1.2.6: 单元 + E2E 测试 - 3 SP

**总计**: 15 Story Points

#### 依赖关系
- 依赖：Story 1.1 (共享 AI 基础设施)
- 阻塞：无

---

### Story 1.3: 生成知识文档系列

**Story ID**: AI-003  
**Epic**: Epic 1 - AI 生成能力  
**优先级**: P0  
**Story Points**: 13  
**Sprint**: Sprint 2

#### 用户故事
```
作为 目标管理用户
我希望 基于目标主题一键生成系列知识文档
以便 快速构建目标相关的知识库，辅助目标达成
```

#### 验收标准

```gherkin
Scenario 1: 成功生成知识文档系列
  Given 用户创建了 Goal "3 个月减重 10 公斤"
  When 用户点击"生成知识文档"并输入主题"科学减肥"
  Then 系统应在 30 秒内生成 3-5 篇文档预览
  And 文档类型包括：知识概述、行动指南、最佳实践、数据分析、FAQ
  And 每篇文档长度 500-2000 字
  And 文档为 Markdown 格式
  And 用户可以预览每篇文档
  And 用户可以编辑文档内容
  And 用户可以选择性保存

Scenario 2: 文档自动保存到知识仓库
  Given 用户确认保存生成的文档
  When 用户点击"保存到知识仓库"
  Then 所有选中的文档应保存到知识仓库模块
  And 文档自动添加标签："AI 生成"、"{主题名称}"
  And 文档分类为用户选择的分类
  And 触发 KnowledgeDocumentsGeneratedEvent 事件

Scenario 3: 文档模板多样性验证
  Given AI 生成多篇文档
  When 系统验证文档类型
  Then 至少包含 3 种不同的文档模板类型
  And 每种类型的内容结构符合模板要求

Scenario 4: 文档预览和编辑
  Given 用户查看生成的文档预览
  When 用户点击"编辑"某篇文档
  Then 系统应打开 Markdown 编辑器
  And 支持实时预览
  And 支持保存修改
```

#### 技术任务

**后端**:
- [ ] Task 1.3.1: 定义 KnowledgeDocument Contracts - 2 SP
  - KnowledgeDocumentPreviewDTO
  - KnowledgeDocumentTemplateType enum
  - GenerateKnowledgeDocumentsRequestDTO
  
- [ ] Task 1.3.2: 实现文档生成 Prompt 模板 - 3 SP
  - 5 种文档类型的 Prompt
  - Prompt 参数化配置
  
- [ ] Task 1.3.3: 实现 generateKnowledgeDocuments() - 4 SP
  - 并发生成多篇文档
  - 文档质量验证
  - 模板类型分配逻辑
  
- [ ] Task 1.3.4: 创建 API 端点 - 2 SP
  - POST /api/ai/generate/knowledge-documents
  
- [ ] Task 1.3.5: 实现与知识仓库模块集成 - 3 SP
  - 监听 KnowledgeDocumentsGeneratedEvent
  - 自动保存文档逻辑
  - 标签和分类处理

**前端**:
- [ ] Task 1.3.6: KnowledgeDocumentGenerator 组件 - 4 SP
  - 主题输入表单
  - 文档预览列表
  - Markdown 编辑器集成
  
- [ ] Task 1.3.7: 文档预览和编辑 UI - 3 SP
  - 实时 Markdown 预览
  - 文档类型标签显示
  - 选择性保存功能

**测试**:
- [ ] Task 1.3.8: 单元测试 - 3 SP
- [ ] Task 1.3.9: E2E 测试 - 3 SP

**总计**: 27 Story Points (约 4-5 天)

#### 依赖关系
- 依赖：Story 1.1 (AI 基础设施), 知识仓库模块 API
- 阻塞：无

#### 技术方案
- **文档生成策略**: 串行生成 (避免并发成本过高)
- **Markdown 编辑器**: 使用 vue-markdown-editor
- **事件总线**: 使用 EventEmitter 解耦模块

---

### Story 3.1: 配额管理系统

**Story ID**: AI-004  
**Epic**: Epic 3 - AI 配额与安全  
**优先级**: P0  
**Story Points**: 5  
**Sprint**: Sprint 1

#### 用户故事
```
作为 系统管理员
我希望 为每个用户设置 AI 使用配额
以便 控制成本，防止滥用
```

#### 验收标准

```gherkin
Scenario 1: 新用户默认配额
  Given 新用户注册系统
  When 系统创建用户账户
  Then 应自动创建配额记录
  And 默认每日限额为 50 次
  And 重置时间为次日 00:00

Scenario 2: 配额消耗
  Given 用户发起 AI 请求
  When QuotaEnforcementService 检查配额
  Then 如果配额充足，消耗 1 次配额
  And 返回剩余配额数
  And 如果配额不足，返回 429 错误

Scenario 3: 配额重置
  Given 当前时间到达重置时间
  When 配额重置任务执行
  Then 所有用户的 used 归零
  And resetAt 更新为次日 00:00

Scenario 4: 管理员手动调整
  Given 管理员登录系统
  When 管理员为特定用户调整配额
  Then 配额限额应立即生效
  And 记录配额变更日志
```

#### 技术任务

**后端**:
- [ ] Task 3.1.1: 创建 AIUsageQuota 实体和 Prisma Schema - 2 SP
- [ ] Task 3.1.2: 实现 QuotaEnforcementService - 3 SP
- [ ] Task 3.1.3: 创建配额管理 API - 2 SP
- [ ] Task 3.1.4: 实现配额重置定时任务 (Cron) - 2 SP
- [ ] Task 3.1.5: 添加配额中间件到所有 AI 端点 - 1 SP

**前端**:
- [ ] Task 3.1.6: 配额显示组件 - 2 SP
- [ ] Task 3.1.7: 管理员配额管理界面 - 3 SP

**测试**:
- [ ] Task 3.1.8: 单元 + E2E 测试 - 2 SP

**总计**: 17 Story Points

---

## 🏃 Sprint 计划

### Sprint 1 (Week 1-2)

**Sprint 目标**: 完成 AI 生成核心功能和配额系统

**包含 Stories**:
- ✅ Story 1.1: 生成 Key Results (8 SP)
- ✅ Story 1.2: 生成任务模板 (8 SP)
- ✅ Story 3.1: 配额管理系统 (5 SP)

**总计**: 21 Story Points  
**团队速度**: 预估 20-25 SP/Sprint

**每日站会重点**:
- AI Adapter 实现进度
- Prompt 调优效果
- 配额系统集成

**Sprint Review**:
- Demo: 端到端生成 KR 和任务
- Demo: 配额限制和重置

---

### Sprint 2 (Week 3-4)

**Sprint 目标**: 完成知识文档生成和对话功能

**包含 Stories**:
- ✅ Story 1.3: 生成知识文档系列 (13 SP)
- ✅ Story 1.4: 生成文档摘要 (5 SP)
- ✅ Story 2.1: 多轮对话功能 (8 SP)

**总计**: 26 Story Points

---

## 📊 Definition of Done (DoD)

每个 Story 必须满足以下条件才能标记为"完成"：

### 代码质量
- [ ] 代码通过 ESLint 检查（0 error）
- [ ] 代码通过 TypeScript 类型检查
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 所有测试通过（包括 E2E）

### 功能完整性
- [ ] 所有验收标准通过
- [ ] UI/UX 与设计稿一致
- [ ] 错误处理完整（网络错误、超时、配额不足等）
- [ ] 国际化文案完成（中英文）

### 文档
- [ ] API 文档更新（Swagger）
- [ ] 代码注释完整（JSDoc）
- [ ] README 更新（如有新依赖）

### 评审
- [ ] Code Review 通过（至少 1 人 Approve）
- [ ] Product Owner 验收通过
- [ ] QA 测试通过

### 部署
- [ ] 合并到 main 分支
- [ ] CI/CD 流水线通过
- [ ] 部署到 Staging 环境

---

## 🔄 敏捷仪式 (Agile Ceremonies)

### 1. Sprint Planning (每 2 周一次)
- **时长**: 2 小时
- **参与者**: 全团队
- **产出**: Sprint Backlog, Sprint Goal

### 2. Daily Standup (每日)
- **时长**: 15 分钟
- **格式**:
  - 昨天完成了什么？
  - 今天计划做什么？
  - 有什么阻塞？

### 3. Sprint Review (每 2 周一次)
- **时长**: 1 小时
- **参与者**: 全团队 + Stakeholders
- **产出**: Demo, Feedback

### 4. Sprint Retrospective (每 2 周一次)
- **时长**: 1 小时
- **参与者**: 全团队
- **产出**: 改进行动项

---

## 📈 故事点估算参考

| Story Points | 复杂度 | 预估时间 | 示例 |
|--------------|--------|----------|------|
| 1 | 极简单 | 0.5-1 小时 | 修改文案 |
| 2 | 简单 | 2-4 小时 | 简单 CRUD |
| 3 | 中等 | 4-8 小时 | 新增组件 |
| 5 | 复杂 | 1-2 天 | 新增功能模块 |
| 8 | 很复杂 | 2-3 天 | 复杂功能集成 |
| 13 | 极复杂 | 3-5 天 | 大型功能 |

---

**文档版本**: v1.0  
**最后更新**: 2025-11-09  
**下一步**: Sprint Planning → 启动 Sprint 1
