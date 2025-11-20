# Epic Technical Specification: Intelligent Goal & Task Planning

Date: 2025-11-20
Author: Sean
Epic ID: 2
Status: Draft

---

## Overview

Epic 2实现DailyUse的核心AI辅助规划功能，使用户能够利用AI快速生成符合SMART原则的Key Results和可执行的Task Templates。该Epic基于Epic 1建立的AI基础设施，将AI能力应用于Goal管理的核心业务场景。

本Epic包含4个Story，分为后端生成引擎（Story 2-1, 2-3）和前端用户界面（Story 2-2, 2-4），涵盖Key Results生成和Task Templates生成两大核心功能。预期通过AI辅助将目标拆解时间从30分钟缩短至5分钟，任务规划时间从20分钟缩短至10分钟。

## Objectives and Scope

**In Scope:**

- ✅ Key Results智能生成后端API（Story 2-1）
- ✅ Key Results生成前端UI集成（Story 2-2）
- ✅ Task Templates智能生成后端API（Story 2-3）
- ✅ Task Templates生成前端UI集成（Story 2-4）
- ✅ AI Prompt模板优化（SMART原则、可执行性）
- ✅ 生成结果的用户编辑和选择性采纳
- ✅ 与现有Goal/Task模块的无缝集成
- ✅ 配额管理集成（复用Epic 1的QuotaEnforcementService）

**Out of Scope:**

- ❌ 批量生成功能（计划v1.2）
- ❌ 自定义Prompt模板（计划v1.2）
- ❌ 多模型切换（计划v1.1）
- ❌ 生成历史版本管理（采用单版本策略）
- ❌ Knowledge Base文档生成（属于Epic 4）
- ❌ 对话式交互（属于Epic 3）

**Success Criteria:**

- KR生成时间从30分钟降至≤5分钟
- Task生成时间从20分钟降至≤10分钟
- 生成结果采纳率≥60%
- AI生成错误率≤5%
- API响应时间P95≤10秒

## System Architecture Alignment

**Domain Layer Dependency:**

- 复用 `@dailyuse/domain-server/ai` 模块的 `AIGenerationService`
- 集成 `@dailyuse/domain-server/goal` 模块的 `Goal` 和 `KeyResult` 聚合
- 集成 `@dailyuse/domain-server/task` 模块的 `TaskTemplate` 聚合
- 使用 `QuotaEnforcementService` 进行配额校验

**Infrastructure:**

- API Layer: `apps/api/src/modules/ai` 新增生成端点
- Web Layer: `apps/web/src/modules/goal` 和 `apps/web/src/modules/task` 新增AI生成UI组件
- Event Bus: 发布 `GenerationCompletedEvent` 供其他模块订阅

**Architectural Constraints:**

- 严格遵守DDD分层架构（Controller不含业务逻辑）
- 使用SSE流式输出提升用户体验
- 采用同步生成模式（前端等待响应）
- 单版本策略（不保存生成历史）
- 通过事件总线实现模块解耦

**Integration Points:**

- OpenAI API (via `OpenAIAdapter` from Epic 1)
- Goal Domain Service (for KR creation and validation)
- Task Domain Service (for Task Template creation)
- Quota Service (for usage limits enforcement)

## Detailed Design

### Services and Modules

Epic 2基于Epic 1的AI基础设施，新增以下服务模块：

#### Backend Services (API Layer)

| Service                              | Location                                         | Responsibility          |
| ------------------------------------ | ------------------------------------------------ | ----------------------- |
| **AIGenerationController**           | `apps/api/src/modules/ai/interface/controllers`  | 处理KR/Task生成HTTP请求 |
| **GoalKeyResultApplicationService**  | `apps/api/src/modules/goal/application/services` | 编排KR生成和Goal集成    |
| **TaskTemplateApplicationService**   | `apps/api/src/modules/task/application/services` | 编排Task生成和保存      |
| **AIGenerationService** (Epic 1)     | `packages/domain-server/src/ai/services`         | 复用AI生成核心逻辑      |
| **QuotaEnforcementService** (Epic 1) | `packages/domain-server/src/ai/services`         | 复用配额校验            |
| **GoalDomainService**                | `packages/domain-server/src/goal/services`       | Goal业务规则验证        |

#### Frontend Components (Web Layer)

| Component                           | Location                                             | Responsibility           |
| ----------------------------------- | ---------------------------------------------------- | ------------------------ |
| **GoalFormWithAI.vue**              | `apps/web/src/modules/goal/presentation/components`  | Goal表单+AI生成KR按钮    |
| **KeyResultAIGenerationDialog.vue** | `apps/web/src/modules/goal/presentation/components`  | KR生成对话框（流式显示） |
| **TaskAIGenerationDialog.vue**      | `apps/web/src/modules/task/presentation/components`  | Task生成对话框           |
| **useAIGeneration**                 | `apps/web/src/modules/goal/presentation/composables` | AI生成UI逻辑复用         |
| **goalStore**                       | `apps/web/src/modules/goal/presentation/stores`      | Goal状态管理             |

#### Integration Points

- **Goal Aggregate**: 使用`Goal.createKeyResult()`和`Goal.addKeyResult()`集成AI生成的KR
- **TaskTemplate Aggregate**: 使用`TaskTemplate.create()`创建AI生成的任务
- **OpenAI Adapter**: 通过`AIGenerationService`调用，使用Epic 2 Prompt模板
- **Event Bus**: 发布`KeyResultsGeneratedEvent`和`TasksGeneratedEvent`

### Data Models and Contracts

#### Request DTOs (新增)

```typescript
// packages/contracts/src/modules/ai/requests/GenerateKeyResultsRequest.ts
export interface GenerateKeyResultsRequest {
  goalTitle: string;
  goalDescription?: string;
  goalContext?: string; // 可选上下文（类别、重要性等）
  startDate: number; // Goal起始时间
  endDate: number; // Goal结束时间
}

// packages/contracts/src/modules/ai/requests/GenerateTasksRequest.ts
export interface GenerateTasksRequest {
  keyResultTitle: string;
  keyResultDescription?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  timeRemaining: number; // 剩余天数
}
```

#### Response DTOs (新增)

```typescript
// packages/contracts/src/modules/ai/responses/GenerateKeyResultsResponse.ts
export interface GenerateKeyResultsResponse {
  keyResults: KeyResultPreview[];
  tokenUsage: TokenUsageServerDTO;
  generatedAt: number;
}

export interface KeyResultPreview {
  title: string;
  description?: string;
  valueType: KeyResultValueType; // NUMBER | PERCENTAGE | BOOLEAN | CURRENCY
  targetValue: number;
  currentValue?: number;
  unit?: string;
  weight: number; // 0-100
  aggregationMethod: AggregationMethod; // LAST | SUM | AVERAGE | MAX | MIN
}

// packages/contracts/src/modules/ai/responses/GenerateTasksResponse.ts
export interface GenerateTasksResponse {
  tasks: TaskTemplatePreview[];
  tokenUsage: TokenUsageServerDTO;
  generatedAt: number;
}

export interface TaskTemplatePreview {
  title: string;
  description?: string;
  estimatedHours: number; // 1-40小时
  priority: TaskPriority; // HIGH | MEDIUM | LOW
  dependencies: string[]; // 依赖的任务UUID（生成后才有）
  tags: string[];
}
```

#### Domain Models (复用Epic 1)

| Model            | Package                             | Usage                          |
| ---------------- | ----------------------------------- | ------------------------------ |
| **KeyResult**    | `domain-server/src/goal/entities`   | 通过Goal.createKeyResult()创建 |
| **Goal**         | `domain-server/src/goal/aggregates` | 验证和添加KR                   |
| **TaskTemplate** | `domain-server/src/task/aggregates` | 创建AI生成的任务               |
| **AIUsageQuota** | `domain-server/src/ai/aggregates`   | 配额校验                       |

### APIs and Interfaces

#### REST API Endpoints (新增)

**1. Generate Key Results**

```http
POST /api/ai/generate/key-results
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "goalTitle": "Improve Product Quality",
  "goalDescription": "Reduce bugs and improve user satisfaction",
  "goalContext": "SaaS product with 10k users",
  "startDate": 1704067200000,
  "endDate": 1711929599000
}

Response (200 OK):
{
  "keyResults": [
    {
      "title": "Reduce Critical Bugs",
      "description": "Decrease P0/P1 bugs from 15 to less than 3 per sprint",
      "valueType": "NUMBER",
      "targetValue": 3,
      "currentValue": 15,
      "unit": "bugs",
      "weight": 35,
      "aggregationMethod": "LAST"
    },
    // ... 2-4 more KRs
  ],
  "tokenUsage": {
    "promptTokens": 250,
    "completionTokens": 800,
    "totalTokens": 1050
  },
  "generatedAt": 1732089600000
}

Error (429 Too Many Requests):
{
  "error": "QUOTA_EXCEEDED",
  "message": "Daily quota exceeded (50/50 used)",
  "resetAt": 1732147200000
}
```

**2. Generate Task Templates**

```http
POST /api/ai/generate/tasks
Authorization: Bearer {accessToken}
Content-Type: application/json

Request Body:
{
  "keyResultTitle": "Reduce Critical Bugs",
  "keyResultDescription": "Decrease P0/P1 bugs from 15 to less than 3 per sprint",
  "targetValue": 3,
  "currentValue": 15,
  "unit": "bugs",
  "timeRemaining": 90
}

Response (200 OK):
{
  "tasks": [
    {
      "title": "Audit Current P0/P1 Bugs",
      "description": "Review and categorize all existing critical bugs by root cause",
      "estimatedHours": 8,
      "priority": "HIGH",
      "dependencies": [],
      "tags": ["analysis", "audit"]
    },
    // ... 4-9 more tasks
  ],
  "tokenUsage": {
    "promptTokens": 300,
    "completionTokens": 600,
    "totalTokens": 900
  },
  "generatedAt": 1732089650000
}
```

#### Frontend API Client Methods (新增)

```typescript
// apps/web/src/modules/goal/infrastructure/api/goalApiClient.ts
export class GoalApiClient {
  async generateKeyResults(
    request: GenerateKeyResultsRequest,
  ): Promise<GenerateKeyResultsResponse> {
    const response = await apiClient.post('/api/ai/generate/key-results', request);
    return response.data;
  }
}

// apps/web/src/modules/task/infrastructure/api/taskApiClient.ts
export class TaskApiClient {
  async generateTasks(request: GenerateTasksRequest): Promise<GenerateTasksResponse> {
    const response = await apiClient.post('/api/ai/generate/tasks', request);
    return response.data;
  }
}
```

### Workflows and Sequencing

#### Workflow 1: Generate Key Results

```
User Action: Click "AI Generate KR" in Goal Form
    ↓
1. Frontend: Open KeyResultAIGenerationDialog
    ↓
2. Frontend: Show loading indicator
    ↓
3. Frontend: POST /api/ai/generate/key-results {goalTitle, ...}
    ↓
4. Backend: AIGenerationController receives request
    ↓
5. Backend: QuotaEnforcementService.checkQuota(accountUuid)
    ├─ Quota OK → Continue
    └─ Quota Exceeded → Return 429 Error
    ↓
6. Backend: Load KR_GENERATION_PROMPT from config
    ↓
7. Backend: AIGenerationService.generateKeyResults(input, quota)
    ↓
8. Backend: OpenAIAdapter.generateText<KeyResultPreview[]>()
    ├─ Call OpenAI API with gpt-4-turbo-preview
    ├─ Temperature: 0.7, MaxTokens: 2000
    └─ Parse JSON response
    ↓
9. Backend: Validate output (3-5 items, weights sum to 100)
    ↓
10. Backend: QuotaEnforcementService.consumeQuota(accountUuid)
    ↓
11. Backend: Return GenerateKeyResultsResponse
    ↓
12. Frontend: Display 3-5 KRs in dialog
    ↓
13. User: Edit/Select KRs
    ↓
14. User: Click "Add Selected" (e.g., 3 KRs)
    ↓
15. Frontend: For each selected KR:
        goal.createKeyResult(krData)
        goal.addKeyResult(keyResult)
    ↓
16. Frontend: POST /api/goals/{goalUuid} (save Goal with new KRs)
    ↓
17. Backend: GoalRepository.save(goal)
    ↓
18. Backend: Publish KeyResult.added events
    ↓
19. Frontend: Close dialog, refresh Goal view
```

**Time Estimate**: 8-12 seconds total (2s API call + 6-10s OpenAI generation)

#### Workflow 2: Generate Task Templates

```
User Action: Click "Generate Tasks" for a KR
    ↓
1. Frontend: Open TaskAIGenerationDialog
    ↓
2. Frontend: POST /api/ai/generate/tasks {krTitle, ...}
    ↓
3. Backend: TaskController receives request
    ↓
4. Backend: QuotaEnforcementService.checkQuota(accountUuid)
    ↓
5. Backend: Load TASK_GENERATION_PROMPT
    ↓
6. Backend: AIGenerationService.generateTasks(input, quota)
    ↓
7. Backend: OpenAIAdapter.generateText<TaskTemplatePreview[]>()
    ↓
8. Backend: Validate output (5-10 items, hours 1-40 each)
    ↓
9. Backend: QuotaEnforcementService.consumeQuota(accountUuid)
    ↓
10. Backend: Return GenerateTasksResponse
    ↓
11. Frontend: Display 5-10 tasks in dialog
    ↓
12. User: Check/Uncheck tasks, edit details
    ↓
13. User: Click "Import Selected" (e.g., 7 tasks)
    ↓
14. Frontend: Batch create TaskTemplates
        For each task:
            TaskTemplate.createOneTimeTask(taskData)
            POST /api/tasks
    ↓
15. Backend: TaskTemplateRepository.save(template)
    ↓
16. Backend: Publish Task.created events
    ↓
17. Frontend: Close dialog, navigate to Task list
```

**Time Estimate**: 10-15 seconds total

#### Sequence Diagram: KR Generation (Key Path)

```
User          Frontend        API Controller      AIGenerationSvc     OpenAI
│                │                    │                    │              │
├─Click "AI"────>│                    │                    │              │
│                ├─Open Dialog───────>│                    │              │
│                ├─POST /api/ai/...───>│                   │              │
│                │                    ├─checkQuota()──────>│              │
│                │                    │<──OK───────────────┤              │
│                │                    ├─generateKRs()─────>│              │
│                │                    │                    ├─API Call────>│
│                │                    │                    │<─JSON────────┤
│                │<──KR Previews──────┤<──Response─────────┤              │
│<──Display KRs──┤                    │                    │              │
├─Select & Add───>│                    │                    │              │
│                ├─Save Goal─────────>│                    │              │
│<──Success──────┤<──200 OK───────────┤                    │              │
```

## Non-Functional Requirements

### Performance

**Target Metrics:**

- **API Response Time**: P95 ≤ 10 seconds (complete generation cycle)
- **OpenAI Call Time**: P95 ≤ 8 seconds (actual AI generation)
- **Database Query**: ≤ 100ms (single Goal/Task lookup)
- **Frontend Rendering**: ≤ 200ms (display generated results)
- **Concurrent Users**: Support 50 simultaneous generation requests

**Performance Optimizations:**

- Use streaming responses (SSE) for real-time feedback (planned for Epic 3)
- Implement request timeout (10 seconds hard limit)
- Cache prompt templates in memory
- Optimize JSON parsing with try-catch fallbacks
- Use database indexes on accountUuid and goalUuid

**Load Testing Requirements:**

- 50 concurrent users generating KRs
- 100 requests/minute sustained load
- Monitor OpenAI API rate limits (3500 RPM for GPT-4 Turbo)

### Security

**Authentication & Authorization:**

- ✅ All endpoints require valid JWT token
- ✅ User can only generate for their own Goals/KRs
- ✅ Rate limiting: 10 requests/minute per user (in addition to quota)
- ✅ Quota enforcement: 50 generations/day per user

**Data Protection:**

- ✅ OpenAI API key stored in server-side .env only (never exposed to frontend)
- ✅ User input sanitization (strip HTML, limit length)
- ✅ Validate all AI outputs before returning (prevent injection attacks)
- ✅ HTTPS required for all API calls
- ✅ Audit log for all AI generations (accountUuid, timestamp, tokenUsage)

**Input Validation:**

- Goal title: 5-200 characters
- Goal description: ≤ 5,000 characters
- KR title: 5-100 characters
- Reject requests with suspicious patterns (SQL injection attempts)

**API Key Rotation:**

- Support emergency API key rotation without downtime
- Environment variable refresh mechanism

### Reliability/Availability

**Error Handling:**

- **OpenAI Timeout**: Return 504 Gateway Timeout after 10 seconds
- **OpenAI API Error**: Return 502 Bad Gateway with retry suggestion
- **Quota Exceeded**: Return 429 with resetAt timestamp
- **Invalid JSON**: Retry once with prompt refinement, then fail gracefully
- **Network Error**: Automatic retry with exponential backoff (max 2 retries)

**Graceful Degradation:**

- If AI service fails, show manual KR/Task creation form
- Display friendly error messages (no stack traces to users)
- Preserve user input in forms when errors occur

**Availability Targets:**

- Overall system: 99% uptime
- AI generation feature: 95% success rate (accounting for OpenAI API variability)
- Database: 99.9% uptime

**Resilience Strategies:**

- Circuit breaker for OpenAI API (fail fast after 5 consecutive errors)
- Fallback to MockAIAdapter in development/test environments
- Health check endpoint: `GET /api/ai/health`

### Observability

**Logging:**

```typescript
logger.info('AI generation started', {
  accountUuid: user.accountUuid,
  taskType: 'KEY_RESULTS',
  goalTitle: input.goalTitle,
  timestamp: Date.now(),
});

logger.info('AI generation completed', {
  accountUuid: user.accountUuid,
  taskType: 'KEY_RESULTS',
  tokenUsage: result.tokenUsage,
  duration: Date.now() - startTime,
  itemsGenerated: result.keyResults.length,
});

logger.error('AI generation failed', {
  accountUuid: user.accountUuid,
  error: error.message,
  errorType: error.constructor.name,
});
```

**Metrics to Monitor:**

- Generation request count (per hour/day)
- Success vs failure rate
- Average response time
- Token usage (prompt + completion)
- Cost per request (tokens × pricing)
- Quota consumption rate
- Error types distribution

**Alerts:**

- Error rate > 10% in 5 minutes → Slack alert
- Average response time > 15 seconds → Warning
- Daily cost > $50 → Budget alert
- Quota reset failures → Critical alert

**Dashboards:**

- Real-time generation metrics (Grafana)
- Cost tracking dashboard (daily/monthly breakdown)
- User adoption metrics (generations per user)
- Quality metrics (user adoption rate of generated items)

## Dependencies and Integrations

### External Dependencies

| Dependency         | Version     | Purpose            | Criticality  |
| ------------------ | ----------- | ------------------ | ------------ |
| **OpenAI API**     | GPT-4 Turbo | AI text generation | **CRITICAL** |
| **Vercel AI SDK**  | 4.0+        | OpenAI integration | HIGH         |
| **@ai-sdk/openai** | Latest      | OpenAI provider    | HIGH         |

### Internal Package Dependencies

| Package                          | Purpose                           | Stories Using |
| -------------------------------- | --------------------------------- | ------------- |
| **@dailyuse/domain-server/ai**   | AIGenerationService, QuotaService | 2-1, 2-3      |
| **@dailyuse/domain-server/goal** | Goal aggregate, KeyResult entity  | 2-1, 2-2      |
| **@dailyuse/domain-server/task** | TaskTemplate aggregate            | 2-3, 2-4      |
| **@dailyuse/contracts**          | DTOs, Enums                       | All stories   |
| **@dailyuse/utils**              | EventBus, Logger                  | All stories   |

### API Integration Points

**1. OpenAI API**

- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Authentication**: Bearer token (API key from .env)
- **Model**: `gpt-4-turbo-preview` (configurable)
- **Rate Limits**:
  - 3,500 requests/minute
  - 90,000 tokens/minute
  - 10,000 requests/day (free tier)
- **Pricing**: $0.01/1K prompt tokens, $0.03/1K completion tokens
- **Timeout**: 10 seconds
- **Retry Strategy**: No automatic retry (fail fast)

**2. Database Integration**

- **Goal Table**: Read Goal data for context
- **KeyResult Table**: Insert AI-generated KRs (via Goal aggregate)
- **TaskTemplate Table**: Insert AI-generated tasks
- **AIUsageQuota Table**: Read/update quota usage (Epic 1)

### Event Bus Integrations

**Published Events:**

```typescript
// After KR generation
eventBus.emit('ai.key_results_generated', {
  accountUuid: string,
  goalUuid: string,
  keyResultCount: number,
  tokenUsage: TokenUsageServerDTO,
  timestamp: Date,
});

// After Task generation
eventBus.emit('ai.tasks_generated', {
  accountUuid: string,
  keyResultUuid: string,
  taskCount: number,
  tokenUsage: TokenUsageServerDTO,
  timestamp: Date,
});
```

**Subscribed Events:**

- (None - Epic 2 is a leaf consumer)

### Configuration Dependencies

**Environment Variables Required:**

```bash
# From Epic 1 (.env.example already updated)
OPENAI_API_KEY=sk-proj-...          # Required
AI_MODEL=gpt-4-turbo-preview        # Optional (default)
AI_TEMPERATURE=0.7                  # Optional (default)
AI_MAX_TOKENS=2000                  # Optional (default)
```

**Runtime Configuration:**

- Prompt templates loaded from `docs/sprint-artifacts/epic-2-ai-prompts.md`
- Default quota: 50 generations/day (from QuotaEnforcementService)

### Third-Party Service Risks

| Risk                 | Probability | Impact | Mitigation                       |
| -------------------- | ----------- | ------ | -------------------------------- |
| OpenAI API downtime  | Medium      | High   | Show manual creation UI          |
| Rate limit exceeded  | Low         | Medium | Implement circuit breaker        |
| Cost overrun         | Medium      | High   | Daily budget alerts + quota caps |
| Model deprecation    | Low         | High   | Support multiple model fallbacks |
| Breaking API changes | Low         | Medium | Pin SDK versions, test upgrades  |

## Acceptance Criteria (Authoritative)

### Story 2-1: Generate Key Results Backend

**Functional Criteria:**

- [ ] **AC-1**: Endpoint `POST /api/ai/generate/key-results` accepts valid request and returns 200 OK
- [ ] **AC-2**: Response contains 3-5 KeyResultPreview objects with all required fields
- [ ] **AC-3**: Each KR has title (5-100 chars), valueType (valid enum), targetValue (> 0), weight (0-100)
- [ ] **AC-4**: Total weights of all KRs sum to 100 (±5 tolerance)
- [ ] **AC-5**: KRs follow SMART principles (verified by manual inspection of 10 samples)
- [ ] **AC-6**: Quota check performed before generation, returns 429 if exceeded
- [ ] **AC-7**: Quota consumed (decremented by 1) after successful generation
- [ ] **AC-8**: TokenUsage accurately reported in response

**Technical Criteria:**

- [ ] **AC-9**: Uses OpenAIAdapter from Epic 1 (no new AI client code)
- [ ] **AC-10**: Implements 10-second timeout, returns 504 if exceeded
- [ ] **AC-11**: Prompt template loaded from `epic-2-ai-prompts.md` (KR section)
- [ ] **AC-12**: Invalid JSON response retried once, then returns 500 error
- [ ] **AC-13**: Logs generation start/complete/fail events with accountUuid and tokenUsage
- [ ] **AC-14**: No business logic in AIGenerationController (delegated to service)

**Quality Criteria:**

- [ ] **AC-15**: Unit tests for AIGenerationService.generateKeyResults() (mock OpenAI)
- [ ] **AC-16**: Integration test with MockAIAdapter (no real API calls)
- [ ] **AC-17**: Zero TypeScript compilation errors
- [ ] **AC-18**: API documented in Swagger/OpenAPI spec

---

### Story 2-2: Generate Key Results UI

**Functional Criteria:**

- [ ] **AC-1**: "AI Generate" button visible in Goal creation/edit form
- [ ] **AC-2**: Click button opens KeyResultAIGenerationDialog
- [ ] **AC-3**: Dialog shows loading indicator during API call (8-12 seconds)
- [ ] **AC-4**: Generated KRs displayed in list with title, target, weight
- [ ] **AC-5**: User can check/uncheck each KR for selection
- [ ] **AC-6**: User can edit KR fields (title, target, unit) before adding
- [ ] **AC-7**: "Add Selected" button creates KeyResult entities and adds to Goal
- [ ] **AC-8**: Dialog closes after successful addition, Goal form updated with new KRs
- [ ] **AC-9**: Error messages displayed for quota exceeded (429) or timeout (504)

**UX Criteria:**

- [ ] **AC-10**: Button icon is "✨ AI Magic" or similar
- [ ] **AC-11**: Loading state shows animated spinner + "Generating with AI..."
- [ ] **AC-12**: Success state shows checkmark + "3 Key Results generated"
- [ ] **AC-13**: KR list supports drag-to-reorder (optional, weight-based order default)
- [ ] **AC-14**: Inline editing uses Vuetify v-text-field components

**Technical Criteria:**

- [ ] **AC-15**: Uses `useAIGeneration` composable for API calls
- [ ] **AC-16**: Updates `goalStore` after adding KRs
- [ ] **AC-17**: Handles errors with `useMessage` composable (snackbar)
- [ ] **AC-18**: Zero console errors during happy path
- [ ] **AC-19**: Component passes Vue Test Utils unit tests

---

### Story 2-3: Generate Task Templates Backend

**Functional Criteria:**

- [ ] **AC-1**: Endpoint `POST /api/ai/generate/tasks` accepts valid request and returns 200 OK
- [ ] **AC-2**: Response contains 5-10 TaskTemplatePreview objects
- [ ] **AC-3**: Each task has title, description, estimatedHours (1-40), priority (HIGH/MEDIUM/LOW)
- [ ] **AC-4**: Tasks are actionable (verb-led titles like "Audit...", "Implement...")
- [ ] **AC-5**: Dependencies array present (empty or with task indices)
- [ ] **AC-6**: Quota check and consumption same as Story 2-1
- [ ] **AC-7**: Task descriptions include acceptance criteria or completion definition

**Technical Criteria:**

- [ ] **AC-8**: Uses same AIGenerationService and QuotaEnforcementService
- [ ] **AC-9**: Prompt template from `epic-2-ai-prompts.md` (Task section)
- [ ] **AC-10**: Validates estimatedHours range (1-40)
- [ ] **AC-11**: Validates priority enum (HIGH|MEDIUM|LOW)
- [ ] **AC-12**: Logs task generation events
- [ ] **AC-13**: No controller business logic

**Quality Criteria:**

- [ ] **AC-14**: Unit tests for AIGenerationService.generateTasks()
- [ ] **AC-15**: Integration test with MockAIAdapter
- [ ] **AC-16**: Zero TypeScript errors
- [ ] **AC-17**: Swagger/OpenAPI documented

---

### Story 2-4: Generate Task Templates UI

**Functional Criteria:**

- [ ] **AC-1**: "Generate Tasks" button visible in KeyResult detail view
- [ ] **AC-2**: Click button opens TaskAIGenerationDialog
- [ ] **AC-3**: Dialog shows loading indicator during generation
- [ ] **AC-4**: Generated tasks displayed in checklist with title, hours, priority
- [ ] **AC-5**: User can check/uncheck tasks for import
- [ ] **AC-6**: User can edit task fields (title, hours, priority, description)
- [ ] **AC-7**: "Import Selected" creates TaskTemplate entities (batch API call)
- [ ] **AC-8**: Success message shows "7 tasks imported" (count)
- [ ] **AC-9**: Dialog closes, navigates to Task list view

**UX Criteria:**

- [ ] **AC-10**: Tasks sorted by priority (HIGH → MEDIUM → LOW) by default
- [ ] **AC-11**: Estimated hours displayed with icon (🕒 8 hours)
- [ ] **AC-12**: Priority displayed with color badges (red/yellow/blue)
- [ ] **AC-13**: Batch import shows progress indicator if > 5 tasks

**Technical Criteria:**

- [ ] **AC-14**: Uses `useAIGeneration` composable
- [ ] **AC-15**: Batch create via `TaskTemplateApplicationService.createBatch()`
- [ ] **AC-16**: Updates `taskStore` after import
- [ ] **AC-17**: Error handling with snackbar
- [ ] **AC-18**: Component unit tests pass
- [ ] **AC-19**: Zero console errors

---

### Cross-Story Acceptance Criteria

**Integration:**

- [ ] **AC-I1**: Generated KRs can be saved to Goal and appear in Goal detail view
- [ ] **AC-I2**: Generated Tasks appear in Task list with correct Goal/KR binding
- [ ] **AC-I3**: Quota is shared between KR and Task generation (same daily limit)
- [ ] **AC-I4**: All generations logged to audit trail (accountUuid, timestamp, tokenUsage)

**Performance:**

- [ ] **AC-P1**: KR generation completes in ≤ 10 seconds P95
- [ ] **AC-P2**: Task generation completes in ≤ 15 seconds P95
- [ ] **AC-P3**: Frontend renders results in ≤ 200ms after API response

**Quality:**

- [ ] **AC-Q1**: No TypeScript errors in any module
- [ ] **AC-Q2**: Test coverage ≥ 70% for new code
- [ ] **AC-Q3**: All endpoints documented in Swagger
- [ ] **AC-Q4**: User adoption rate ≥ 60% (measured after 2 weeks)

## Traceability Mapping

| Acceptance Criterion                              | Spec Section       | Component/API                                    | Test Idea                                                |
| ------------------------------------------------- | ------------------ | ------------------------------------------------ | -------------------------------------------------------- |
| **Story 2-1 AC-1**: Endpoint accepts request      | APIs & Interfaces  | `POST /api/ai/generate/key-results`              | Integration test: POST valid request → 200 OK            |
| **Story 2-1 AC-2**: Returns 3-5 KRs               | Data Models        | `GenerateKeyResultsResponse`                     | Assert response.keyResults.length ∈ [3, 5]               |
| **Story 2-1 AC-3**: KR fields valid               | Data Models        | `KeyResultPreview`                               | Validate title length, valueType enum, targetValue > 0   |
| **Story 2-1 AC-4**: Weights sum to 100            | Services & Modules | `AIGenerationService.validateKeyResultsOutput()` | Unit test: Assert Σweights = 100 ± 5                     |
| **Story 2-1 AC-5**: SMART principles              | Workflows          | Prompt template (epic-2-ai-prompts.md)           | Manual review of 10 sample outputs                       |
| **Story 2-1 AC-6**: Quota check                   | Services & Modules | `QuotaEnforcementService.checkQuota()`           | Mock quota=0 → Assert 429 response                       |
| **Story 2-1 AC-7**: Quota consumed                | Services & Modules | `QuotaEnforcementService.consumeQuota()`         | Assert quota.used incremented after generation           |
| **Story 2-1 AC-8**: TokenUsage reported           | Data Models        | `TokenUsageServerDTO`                            | Assert response.tokenUsage.totalTokens > 0               |
| **Story 2-1 AC-9**: Uses OpenAIAdapter            | Services & Modules | `AIGenerationService` constructor                | Code review: No new OpenAI client                        |
| **Story 2-1 AC-10**: 10s timeout                  | NFR Performance    | `OpenAIAdapter.generateText()`                   | Mock slow API → Assert 504 after 10s                     |
| **Story 2-1 AC-11**: Prompt template loaded       | Workflows          | `KR_SYSTEM_PROMPT` constant                      | Assert prompt includes "SMART" keyword                   |
| **Story 2-1 AC-12**: JSON retry                   | Services & Modules | `OpenAIAdapter.tryParseJSON()`                   | Mock invalid JSON → Retry → Assert 500                   |
| **Story 2-1 AC-13**: Logging                      | NFR Observability  | `logger.info()` calls                            | Assert log contains accountUuid, tokenUsage              |
| **Story 2-1 AC-14**: No controller logic          | Detailed Design    | `AIGenerationController`                         | Code review: Max 20 lines, delegates to service          |
| **Story 2-1 AC-15**: Unit tests                   | Test Strategy      | `AIGenerationService.test.ts`                    | Mock OpenAI → Assert KRs generated                       |
| **Story 2-1 AC-16**: Integration test             | Test Strategy      | `generate-kr.integration.test.ts`                | Use MockAIAdapter → Assert 200 OK                        |
| **Story 2-1 AC-17**: Zero TS errors               | Quality            | TypeScript compiler                              | Run `tsc --noEmit` → Assert 0 errors                     |
| **Story 2-1 AC-18**: Swagger doc                  | APIs & Interfaces  | `swagger.json`                                   | Assert /api/ai/generate/key-results exists               |
|                                                   |                    |                                                  |                                                          |
| **Story 2-2 AC-1**: Button visible                | Detailed Design    | `GoalFormWithAI.vue`                             | E2E: Find button with text "AI Generate"                 |
| **Story 2-2 AC-2**: Opens dialog                  | Detailed Design    | `KeyResultAIGenerationDialog.vue`                | Unit test: Click button → Assert dialog.visible = true   |
| **Story 2-2 AC-3**: Loading indicator             | UX                 | `v-progress-circular`                            | Assert loading=true during API call                      |
| **Story 2-2 AC-4**: KRs displayed                 | Data Models        | `v-list` of KeyResultPreviews                    | Assert 3-5 list items rendered                           |
| **Story 2-2 AC-5**: Check/uncheck KRs             | UX                 | `v-checkbox`                                     | Click checkbox → Assert selected array updated           |
| **Story 2-2 AC-6**: Edit KR fields                | UX                 | `v-text-field` inline                            | Edit title → Assert updatedKR.title changed              |
| **Story 2-2 AC-7**: Add selected                  | Workflows          | `goal.addKeyResult()`                            | Click Add → Assert goalStore.keyResults.length increased |
| **Story 2-2 AC-8**: Dialog closes                 | UX                 | `dialog.visible = false`                         | After add → Assert dialog hidden                         |
| **Story 2-2 AC-9**: Error messages                | NFR Security       | `useMessage.showError()`                         | Mock 429 → Assert snackbar displays "Quota exceeded"     |
| **Story 2-2 AC-10**: Button icon                  | UX                 | `v-icon`                                         | Assert icon="mdi-magic-staff"                            |
| **Story 2-2 AC-11**: Loading state                | UX                 | Conditional rendering                            | Assert text="Generating with AI..."                      |
| **Story 2-2 AC-12**: Success state                | UX                 | `v-alert` success                                | Assert "3 Key Results generated"                         |
| **Story 2-2 AC-13**: Drag-to-reorder              | UX                 | `vuedraggable` (optional)                        | Drag KR → Assert order changed                           |
| **Story 2-2 AC-14**: Vuetify components           | Detailed Design    | `v-text-field`                                   | Code review: No raw `<input>` tags                       |
| **Story 2-2 AC-15**: useAIGeneration              | Detailed Design    | `useAIGeneration()` composable                   | Assert composable returns generateKR method              |
| **Story 2-2 AC-16**: Updates goalStore            | Detailed Design    | `goalStore.addKeyResult()`                       | Assert store state updated after add                     |
| **Story 2-2 AC-17**: Error handling               | NFR Reliability    | `try-catch` + snackbar                           | Mock error → Assert no console.error                     |
| **Story 2-2 AC-18**: Zero console errors          | Quality            | Browser DevTools                                 | E2E: Assert no errors in console log                     |
| **Story 2-2 AC-19**: Unit tests                   | Test Strategy      | `KeyResultAIGenerationDialog.test.ts`            | Mount component → Assert renders                         |
|                                                   |                    |                                                  |                                                          |
| **Story 2-3 AC-1**: Endpoint accepts              | APIs & Interfaces  | `POST /api/ai/generate/tasks`                    | Integration: POST valid request → 200 OK                 |
| **Story 2-3 AC-2**: Returns 5-10 tasks            | Data Models        | `GenerateTasksResponse`                          | Assert response.tasks.length ∈ [5, 10]                   |
| **Story 2-3 AC-3**: Task fields valid             | Data Models        | `TaskTemplatePreview`                            | Validate hours ∈ [1, 40], priority enum                  |
| **Story 2-3 AC-4**: Actionable titles             | Workflows          | Task prompt template                             | Assert title starts with verb (regex: ^[A-Z][a-z]+ )     |
| **Story 2-3 AC-5**: Dependencies array            | Data Models        | `TaskTemplatePreview.dependencies`               | Assert array type, contains valid UUIDs                  |
| **Story 2-3 AC-6**: Quota check/consume           | Services & Modules | `QuotaEnforcementService`                        | Same as Story 2-1 AC-6/7                                 |
| **Story 2-3 AC-7**: Descriptions include criteria | Workflows          | Task prompt template                             | Assert description length > 50 chars                     |
| **Story 2-3 AC-8**: Uses same services            | Services & Modules | `AIGenerationService`                            | Code review: No duplicate service code                   |
| **Story 2-3 AC-9**: Prompt template               | Workflows          | `TASK_SYSTEM_PROMPT`                             | Assert prompt includes "actionable"                      |
| **Story 2-3 AC-10**: Hours validation             | Services & Modules | `validateTasksOutput()`                          | Assert all tasks.estimatedHours ∈ [1, 40]                |
| **Story 2-3 AC-11**: Priority validation          | Services & Modules | `validateTasksOutput()`                          | Assert priority ∈ [HIGH, MEDIUM, LOW]                    |
| **Story 2-3 AC-12**: Logging                      | NFR Observability  | `logger.info()`                                  | Assert log contains taskCount                            |
| **Story 2-3 AC-13**: No controller logic          | Detailed Design    | `TaskController`                                 | Code review: Delegates to service                        |
| **Story 2-3 AC-14**: Unit tests                   | Test Strategy      | `AIGenerationService.test.ts`                    | Mock OpenAI → Assert tasks generated                     |
| **Story 2-3 AC-15**: Integration test             | Test Strategy      | `generate-tasks.integration.test.ts`             | MockAIAdapter → Assert 200 OK                            |
| **Story 2-3 AC-16**: Zero TS errors               | Quality            | TypeScript                                       | Run `tsc --noEmit`                                       |
| **Story 2-3 AC-17**: Swagger doc                  | APIs & Interfaces  | `swagger.json`                                   | Assert /api/ai/generate/tasks exists                     |
|                                                   |                    |                                                  |                                                          |
| **Story 2-4 AC-1**: Button visible                | Detailed Design    | `KeyResultDetailView.vue`                        | E2E: Find "Generate Tasks" button                        |
| **Story 2-4 AC-2**: Opens dialog                  | Detailed Design    | `TaskAIGenerationDialog.vue`                     | Click → Assert dialog.visible = true                     |
| **Story 2-4 AC-3**: Loading indicator             | UX                 | `v-progress-circular`                            | Assert loading state                                     |
| **Story 2-4 AC-4**: Tasks displayed               | Data Models        | `v-list` of TaskPreviews                         | Assert 5-10 items                                        |
| **Story 2-4 AC-5**: Check/uncheck                 | UX                 | `v-checkbox`                                     | Click → Assert selected array                            |
| **Story 2-4 AC-6**: Edit task fields              | UX                 | Inline editing                                   | Edit hours → Assert updated                              |
| **Story 2-4 AC-7**: Batch import                  | Workflows          | `createBatch()` API                              | Assert 7 POST requests or 1 batch POST                   |
| **Story 2-4 AC-8**: Success message               | UX                 | `useMessage.showSuccess()`                       | Assert "7 tasks imported"                                |
| **Story 2-4 AC-9**: Navigate to task list         | Workflows          | `router.push('/tasks')`                          | Assert navigation after import                           |
| **Story 2-4 AC-10**: Priority sorting             | UX                 | Sort algorithm                                   | Assert HIGH tasks appear first                           |
| **Story 2-4 AC-11**: Hours icon                   | UX                 | `v-icon`                                         | Assert "mdi-clock-outline"                               |
| **Story 2-4 AC-12**: Priority badges              | UX                 | `v-chip` with colors                             | Assert color=red for HIGH                                |
| **Story 2-4 AC-13**: Progress indicator           | UX                 | `v-progress-linear`                              | Import 10 tasks → Assert progress bar                    |
| **Story 2-4 AC-14**: useAIGeneration              | Detailed Design    | Composable                                       | Assert generateTasks method                              |
| **Story 2-4 AC-15**: Batch create API             | APIs & Interfaces  | `TaskTemplateApplicationService`                 | Assert createBatch method exists                         |
| **Story 2-4 AC-16**: Updates taskStore            | Detailed Design    | `taskStore.addTasks()`                           | Assert store updated                                     |
| **Story 2-4 AC-17**: Error handling               | NFR Reliability    | `try-catch`                                      | Mock error → Assert snackbar                             |
| **Story 2-4 AC-18**: Unit tests                   | Test Strategy      | `TaskAIGenerationDialog.test.ts`                 | Mount → Assert renders                                   |
| **Story 2-4 AC-19**: Zero console errors          | Quality            | DevTools                                         | E2E → No errors                                          |
|                                                   |                    |                                                  |                                                          |
| **AC-I1**: KRs save to Goal                       | Workflows          | Workflow 1 steps 14-17                           | E2E: Generate KRs → Add → Assert in Goal detail          |
| **AC-I2**: Tasks in list with binding             | Workflows          | Workflow 2 steps 14-17                           | E2E: Generate tasks → Assert goalUuid/krUuid set         |
| **AC-I3**: Shared quota                           | Services & Modules | `AIUsageQuota.used`                              | Generate KR → Generate Task → Assert used=2              |
| **AC-I4**: Audit trail                            | NFR Observability  | Logging                                          | Query logs → Assert all generations logged               |
| **AC-P1**: KR ≤ 10s P95                           | NFR Performance    | Load testing                                     | Run 100 requests → Assert P95 ≤ 10s                      |
| **AC-P2**: Task ≤ 15s P95                         | NFR Performance    | Load testing                                     | Run 100 requests → Assert P95 ≤ 15s                      |
| **AC-P3**: Frontend ≤ 200ms                       | NFR Performance    | Browser profiling                                | Lighthouse → Assert render time ≤ 200ms                  |
| **AC-Q1**: Zero TS errors                         | Quality            | TypeScript                                       | CI pipeline → Assert tsc exit code 0                     |
| **AC-Q2**: Test coverage ≥ 70%                    | Test Strategy      | Vitest coverage                                  | Assert lines covered ≥ 70%                               |
| **AC-Q3**: Swagger documented                     | APIs & Interfaces  | Swagger UI                                       | Visit /api-docs → Assert 2 endpoints                     |
| **AC-Q4**: Adoption ≥ 60%                         | Business Metric    | Analytics                                        | After 2 weeks → Assert 60% users tried AI                |

## Risks, Assumptions, Open Questions

### Risks

| Risk ID  | Risk                                       | Probability | Impact   | Mitigation Strategy                                                      | Owner         |
| -------- | ------------------------------------------ | ----------- | -------- | ------------------------------------------------------------------------ | ------------- |
| **R-1**  | OpenAI API quality varies (hallucinations) | **HIGH**    | Medium   | Manual review of 100 samples; prompt refinement; user edit capability    | Alice (PO)    |
| **R-2**  | Cost overrun ($100/day on OpenAI)          | Medium      | **HIGH** | Daily quota limit (50/user); budget alerts at $50; circuit breaker       | Charlie (Dev) |
| **R-3**  | OpenAI API rate limit hit during peak      | Medium      | Medium   | Implement queue system; stagger requests; upgrade to paid tier           | Charlie (Dev) |
| **R-4**  | Generated KRs not SMART enough             | Medium      | High     | Improve prompt with examples; add validation rules; A/B test prompts     | Alice (PO)    |
| **R-5**  | User adoption low (<40%)                   | Medium      | High     | User onboarding tutorial; prominent "AI" button; success stories         | Alice (PO)    |
| **R-6**  | Quota system too restrictive               | Low         | Medium   | Monitor usage patterns; adjust limit after 2 weeks; premium tiers        | Sean (PM)     |
| **R-7**  | JSON parsing failures (>5%)                | Low         | Medium   | Improve prompt with JSON examples; retry logic; fallback to text parsing | Charlie (Dev) |
| **R-8**  | Performance degrades under load            | Low         | Medium   | Load testing before launch; optimize database queries; caching           | Charlie (Dev) |
| **R-9**  | Security breach via prompt injection       | Low         | **HIGH** | Input sanitization; output validation; security audit                    | Charlie (Dev) |
| **R-10** | GPT-4 model deprecated by OpenAI           | Low         | Medium   | Support multiple models; version pinning; migration plan                 | Charlie (Dev) |

**Top 3 Critical Risks:**

1. **R-1 (Quality)**: Requires ongoing prompt optimization and user feedback loop
2. **R-2 (Cost)**: Need strict quota enforcement and real-time cost monitoring
3. **R-9 (Security)**: Implement before launch, requires penetration testing

### Assumptions

| Assumption ID | Assumption                                          | Validation Method               | Status         |
| ------------- | --------------------------------------------------- | ------------------------------- | -------------- |
| **A-1**       | OpenAI API will remain stable during development    | Monitor OpenAI status page      | ✅ VALID       |
| **A-2**       | Users will trust AI-generated suggestions           | User interviews (5 users)       | ⏳ TO VALIDATE |
| **A-3**       | 50 generations/day sufficient for 80% users         | Analytics from similar products | ⏳ TO VALIDATE |
| **A-4**       | gpt-4-turbo-preview quality good enough             | Test with 50 real prompts       | ✅ VALID       |
| **A-5**       | 10-second timeout acceptable to users               | UX testing                      | ⏳ TO VALIDATE |
| **A-6**       | Goal domain model supports AI-generated KRs         | Code review completed           | ✅ VALID       |
| **A-7**       | Task domain model supports batch creation           | Code review + prototype         | ✅ VALID       |
| **A-8**       | Event bus can handle 100 events/minute              | Load test in Epic 1             | ✅ VALID       |
| **A-9**       | Users want to edit AI suggestions (not just accept) | User story workshops            | ✅ VALID       |
| **A-10**      | Chinese prompts work as well as English             | Test bilingual prompts          | ⏳ TO VALIDATE |

**Action Items:**

- **A-2**: Conduct user interviews before Story 2-2 (Alice)
- **A-3**: Analyze Beta user data after 1 week (Sean)
- **A-5**: Run UX tests with loading states (Alice)
- **A-10**: Test Chinese prompt templates (Charlie)

### Open Questions

| Question ID | Question                                                  | Decision Needed By       | Responsible  | Status                             |
| ----------- | --------------------------------------------------------- | ------------------------ | ------------ | ---------------------------------- |
| **Q-1**     | Should we support prompt customization in v1.0?           | Story 2-1 start          | Sean + Alice | ❌ NO (defer to v1.2)              |
| **Q-2**     | How to handle multi-language prompts (EN/ZH)?             | Story 2-1 start          | Charlie      | ✅ Use user locale                 |
| **Q-3**     | Should KR weights be auto-adjusted if user unchecks some? | Story 2-2 design         | Alice        | ✅ YES, redistribute               |
| **Q-4**     | Should we show token usage to users?                      | Story 2-2 design         | Alice        | ❌ NO (internal only)              |
| **Q-5**     | How many generations to allow before forcing review?      | Sprint planning          | Sean         | ⏳ OPEN (default: no limit)        |
| **Q-6**     | Should we cache generation results to avoid duplicates?   | Story 2-3 start          | Charlie      | ❌ NO (each unique)                |
| **Q-7**     | Should tasks auto-link dependencies or let user edit?     | Story 2-3 design         | Alice        | ✅ Show suggestions, user confirms |
| **Q-8**     | What's the UX for quota exhausted mid-day?                | Story 2-2 design         | Alice        | ✅ Show upgrade prompt             |
| **Q-9**     | Should we provide a "Regenerate" button?                  | Story 2-2 design         | Alice        | ✅ YES (costs 1 quota)             |
| **Q-10**    | How to handle partial failures (3/5 KRs valid)?           | Story 2-1 implementation | Charlie      | ⏳ OPEN (all-or-nothing?)          |

**Decisions Required:**

- **Q-5**: Need Sean's decision before Sprint planning (impacts quota design)
- **Q-10**: Need Charlie's technical assessment (affects error handling complexity)

### Constraints

- **Budget**: $200/month OpenAI API spend limit
- **Timeline**: Epic 2 must complete in 2 weeks (4 stories)
- **Quality**: Must maintain 95%+ success rate (AI generations)
- **DDD**: Must follow established architectural patterns (no shortcuts)
- **Dependencies**: Cannot start Epic 2 development until Epic 1 fully tested
- **Resources**: 1 backend dev (Charlie), 1 frontend dev (Bob), 1 PO (Alice)

## Test Strategy Summary

### Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /----\
      /      \ Integration Tests (30%)
     /--------\
    /          \ Unit Tests (60%)
   /--------------\
```

### Unit Tests (60% of test effort)

**Backend Unit Tests:**

- `AIGenerationService.generateKeyResults()` - Mock OpenAIAdapter, assert KR structure
- `AIGenerationService.generateTasks()` - Mock OpenAIAdapter, assert task structure
- `AIGenerationService.validateKeyResultsOutput()` - Assert weight sum = 100, field validation
- `AIGenerationService.validateTasksOutput()` - Assert hours ∈ [1, 40], priority enum
- `OpenAIAdapter.tryParseJSON()` - Test valid/invalid JSON parsing, Markdown code blocks
- `QuotaEnforcementService.checkQuota()` - Mock quota entity, assert true/false
- `QuotaEnforcementService.consumeQuota()` - Assert used incremented
- `Goal.createKeyResult()` - Assert KeyResult entity created with correct params
- `Goal.addKeyResult()` - Assert keyResults array updated, progress recalculated

**Frontend Unit Tests:**

- `KeyResultAIGenerationDialog.vue` - Mount component, assert renders, test button clicks
- `TaskAIGenerationDialog.vue` - Mount component, test checkbox selections
- `useAIGeneration.ts` - Test composable methods return correct data structures
- `goalStore.addKeyResult()` - Assert state updated after adding KR
- `taskStore.addTasks()` - Assert state updated after batch import

**Tools:** Vitest, Vue Test Utils, Mock Service Worker (MSW)

**Coverage Target:** ≥ 70% line coverage for new code

### Integration Tests (30% of test effort)

**API Integration Tests:**

```typescript
// Test: POST /api/ai/generate/key-results with MockAIAdapter
describe('Generate Key Results API', () => {
  it('should return 3-5 KRs with valid structure', async () => {
    const response = await request(app)
      .post('/api/ai/generate/key-results')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        goalTitle: 'Improve Product Quality',
        goalDescription: 'Reduce bugs',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
      });

    expect(response.status).toBe(200);
    expect(response.body.keyResults).toHaveLength(greaterThanOrEqual(3));
    expect(response.body.keyResults).toHaveLength(lessThanOrEqual(5));
    expect(response.body.keyResults[0].title).toBeDefined();
    expect(response.body.tokenUsage.totalTokens).toBeGreaterThan(0);
  });

  it('should return 429 when quota exceeded', async () => {
    // Pre-condition: Set user quota to 0
    await setQuota(testUser.accountUuid, 0);

    const response = await request(app)
      .post('/api/ai/generate/key-results')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        /* ... */
      });

    expect(response.status).toBe(429);
    expect(response.body.error).toBe('QUOTA_EXCEEDED');
  });
});
```

**Database Integration Tests:**

- Test Goal creation with AI-generated KRs persists correctly
- Test batch TaskTemplate creation saves all tasks
- Test quota update commits to database
- Test transaction rollback on generation failure

**Event Integration Tests:**

- Test `KeyResultsGeneratedEvent` published after generation
- Test `TasksGeneratedEvent` published after task import

**Tools:** Supertest, Vitest, Testcontainers (PostgreSQL), MockAIAdapter

### E2E Tests (10% of test effort)

**Critical User Journeys:**

**E2E-1: Generate and Add KRs to Goal**

```gherkin
Given I am logged in
And I navigate to Create Goal page
When I enter goal title "Improve Sales"
And I click "AI Generate" button
And I wait for 10 seconds
Then I see 3-5 Key Results
And I check 3 Key Results
And I click "Add Selected"
Then I see 3 Key Results in the Goal form
And I click "Save Goal"
Then I see the Goal in my Goals list
```

**E2E-2: Generate Tasks for KR**

```gherkin
Given I have a Goal with 1 Key Result
And I navigate to Key Result detail page
When I click "Generate Tasks" button
And I wait for 15 seconds
Then I see 5-10 Tasks
And I check 7 Tasks
And I click "Import Selected"
Then I see "7 tasks imported" message
And I navigate to Task list
Then I see 7 new Tasks with my Key Result binding
```

**E2E-3: Quota Exhaustion Flow**

```gherkin
Given I have 0 quota remaining
And I navigate to Create Goal page
When I click "AI Generate" button
Then I see "Daily quota exceeded" error
And I see "Resets in 8 hours" message
And I cannot generate Key Results
```

**Tools:** Playwright, Chromium + Firefox

**Execution:** Run on every PR merge to main

### Performance Tests

**Load Test Scenarios:**

```javascript
// K6 Load Test Script
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% < 10s
    http_req_failed: ['rate<0.05'], // <5% errors
  },
};

export default function () {
  const payload = JSON.stringify({
    goalTitle: 'Test Goal',
    goalDescription: 'Test Description',
    startDate: Date.now(),
    endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
  });

  const res = http.post('http://localhost:3888/api/ai/generate/key-results', payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has key results': (r) => JSON.parse(r.body).keyResults.length >= 3,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  sleep(1);
}
```

**Performance Metrics:**

- P50: ≤ 6 seconds
- P95: ≤ 10 seconds
- P99: ≤ 15 seconds
- Error rate: < 5%
- Concurrent users: 50

**Tools:** K6, Grafana

### Manual Testing

**Exploratory Testing:**

- Test 20 different goal types (personal, work, health, financial, etc.)
- Verify KR quality (SMART criteria) for each domain
- Test edge cases: very short goals (10 chars), very long goals (500 chars)
- Test with Chinese language input
- Test with special characters, emojis

**Acceptance Testing:**

- PO (Alice) reviews 50 generated KRs for quality
- PO tests all UI flows on staging environment
- Security review of API endpoints (input validation)

### Test Data Strategy

**Test Users:**

- `test-user-quota-full` (quota: 50/50 used)
- `test-user-quota-low` (quota: 1/50 used)
- `test-user-quota-fresh` (quota: 0/50 used)

**Test Goals:**

- "Improve Product Quality" (tech goal)
- "Lose 10kg" (health goal)
- "Learn TypeScript" (learning goal)
- "很长的中文描述测试用例" (Chinese goal)

**Mock AI Responses:**

```json
{
  "keyResults": [
    { "title": "Mock KR 1", "targetValue": 100, "weight": 40, ... },
    { "title": "Mock KR 2", "targetValue": 50, "weight": 35, ... },
    { "title": "Mock KR 3", "targetValue": 5, "weight": 25, ... }
  ]
}
```

### CI/CD Integration

**Pipeline Steps:**

1. **Lint**: ESLint + Prettier
2. **Type Check**: `tsc --noEmit`
3. **Unit Tests**: `vitest run --coverage`
4. **Integration Tests**: `vitest run --config vitest.integration.config.ts`
5. **E2E Tests** (main branch only): `playwright test`
6. **Build**: `nx build api web`
7. **Deploy to Staging** (main branch): Auto-deploy
8. **Performance Test** (weekly): K6 load test on staging

**Quality Gates:**

- ✅ All tests pass
- ✅ Coverage ≥ 70%
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ No high-severity security vulnerabilities (npm audit)
