# Story 2.3: Generate Task Templates Backend

Status: drafted

## Story

As a User,
I want to get task suggestions for a Key Result,
So that I can start executing immediately.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Endpoint `POST /api/ai/generate/tasks` accepts valid request and returns 200 OK
2. **AC-2**: Response contains 5-10 TaskTemplatePreview objects
3. **AC-3**: Each task has title, description, estimatedHours (1-40), priority (HIGH/MEDIUM/LOW)
4. **AC-4**: Tasks are actionable (verb-led titles like "Audit...", "Implement...")
5. **AC-5**: Dependencies array present (empty or with task indices)
6. **AC-6**: Quota check and consumption same as Story 2-1
7. **AC-7**: Task descriptions include acceptance criteria or completion definition

### Technical Criteria

8. **AC-8**: Uses same AIGenerationService and QuotaEnforcementService
9. **AC-9**: Prompt template from `epic-2-ai-prompts.md` (Task section)
10. **AC-10**: Validates estimatedHours range (1-40)
11. **AC-11**: Validates priority enum (HIGH|MEDIUM|LOW)
12. **AC-12**: Logs task generation events
13. **AC-13**: No controller business logic

### Quality Criteria

14. **AC-14**: Unit tests for AIGenerationService.generateTasks()
15. **AC-15**: Integration test with MockAIAdapter
16. **AC-16**: Zero TypeScript errors
17. **AC-17**: Swagger/OpenAPI documented

## Tasks / Subtasks

- [x] **Task 1**: Create Request/Response DTOs (AC: 1-3, 5, 7)
  - [x] Create `GenerateTasksRequest.ts` in `packages/contracts/src/modules/ai/api-requests`
    - Fields: krTitle, krDescription, targetValue, currentValue, unit, timeRemaining
  - [x] Create `TaskTemplatePreview` interface in `packages/contracts/src/modules/ai/api-responses`
    - Fields: title, description, estimatedHours, priority, dependencies, tags
  - [x] Create `GenerateTasksResponse.ts` with tasks array and tokenUsage
  - [x] Export new DTOs in contracts index (TaskPriority enum already exported)

- [x] **Task 2**: Extend AIGenerationService with Task Generation (AC: 2-7, 9, 12)
  - [x] Add `generateTaskTemplate()` method to AIGenerationService
  - [x] Load TASK_GENERATION_PROMPT from prompts/templates.ts
  - [x] Implement quota check via QuotaEnforcementService.checkQuota()
  - [x] Build context string from KR data (title, description, target, current, timeRemaining)
  - [x] Call OpenAIAdapter.generateText() with task prompt and context
  - [x] Parse JSON response to TaskTemplatePreview[]
  - [x] Validate output via validateTasksOutput()
  - [x] Consume quota after successful generation
  - [x] Returns GenerationResultServerDTO with tasks metadata

- [x] **Task 3**: Implement Validation Logic (AC: 4, 10, 11)
  - [x] Create `validateTasksOutput()` helper in AIGenerationService
  - [x] Validate task count ∈ [5, 10]
  - [x] Validate each task:
    - Title starts with capital letter (simplified regex)
    - EstimatedHours ∈ [1, 40]
    - Priority ∈ [HIGH, MEDIUM, LOW]
    - Description length ≥ 50 characters if provided
    - Dependencies array contains valid indices
  - [x] Throw AIValidationError if any check fails

- [x] **Task 4**: Implement API Controller Handler (AC: 1, 6, 13)
  - [x] Add `generateTasks` handler to AIConversationController
  - [x] Apply authMiddleware (via route)
  - [x] Validate request body parameters
  - [x] Extract accountUuid from auth context
  - [x] Delegate to AIGenerationApplicationService.generateTaskTemplate()
  - [x] Map domain response to HTTP 200 response
  - [x] Handle errors via handleError() method

- [x] **Task 5**: Add Route Configuration (AC: 1, 17)
  - [x] Add `POST /api/ai/generate/tasks` route in aiConversationRoutes.ts
  - [x] Add Swagger/OpenAPI documentation:
    - Request schema with all required fields
    - Response schema with TaskTemplatePreview array
    - Error schemas (400, 401, 429, 504, 500)
  - [x] Mount route at /api/ai

- [x] **Task 6**: Prompt Template Integration (AC: 9)
  - [x] Load TASK_GENERATION_PROMPT from prompts/templates.ts
  - [x] Template function replaces {{krTitle}}, {{krDescription}}, etc. placeholders
  - [x] Includes JSON output format in system prompt
  - [x] Emphasizes actionable tasks with HIGH/MEDIUM/LOW priorities

- [x] **Task 7**: Error Handling & Resilience (AC: 8, 16)
  - [x] Implement 10-second timeout (inherited from OpenAIAdapter BaseAIAdapter.TIMEOUT_MS)
  - [x] JSON parsing handled by OpenAIAdapter.tryParseJSON()
  - [x] Fallback for Markdown code blocks already in OpenAIAdapter
  - [x] Validate JSON structure via validateTasksOutput()
  - [x] Error handling in Controller handleError() method

- [x] **Task 8**: Unit Tests (AC: 14, 16)
  - [x] Test AIGenerationService.generateTaskTemplate():
    - Mock OpenAIAdapter to return valid tasks ✅
    - Assert 5-10 tasks returned ✅
    - Assert fields valid (hours 1-40, priority enum) ✅
    - Test validation failures (count, hours, priority, description, dependencies) ✅
    - Test quota consumption ✅
  - [x] All 14 tests passing (6 for generateKeyResults + 8 for generateTaskTemplate)
  - [x] TypeScript compilation clean (no code errors)

- [ ] **Task 9**: Integration Tests (AC: 15)
  - [ ] Test POST /api/ai/generate/tasks with MockAIAdapter:
    - Happy path → 200 OK with 5-10 tasks
    - Authentication required → 401 without token
    - Quota exceeded → 429
    - Timeout → 504
    - Invalid KR data → 400
  - [ ] Test quota consumption (verify quota.used incremented)

- [ ] **Task 10**: Manual Quality Verification (AC: 4, 7)
  - [ ] Generate tasks for 10 different KRs (various domains)
  - [ ] Verify tasks are actionable (verb-led titles)
  - [ ] Verify descriptions include completion criteria
  - [ ] Assess estimated hours realism (not all 8 hours)
  - [ ] Document quality assessment
  - [ ] Refine prompt if quality < 85% actionable

## Dev Notes

### Technical Context

- **Location**:
  - DTOs: `packages/contracts/src/modules/ai/requests/GenerateTasksRequest.ts` and `responses/GenerateTasksResponse.ts`
  - Service: `packages/domain-server/src/modules/ai/services/AIGenerationService.ts` (extend existing)
  - Controller: `apps/api/src/modules/ai/interface/http/AIGenerationController.ts` (add handler)
  - Routes: `apps/api/src/modules/ai/interface/http/aiConversationRoutes.ts` (add route)

- **Dependencies**:
  - `OpenAIAdapter` (Epic 1) - Reuse
  - `QuotaEnforcementService` (Epic 1) - Reuse
  - `AIGenerationService` (Story 2-1) - Extend with new method
  - Task prompt template from `docs/sprint-artifacts/epic-2-ai-prompts.md`

- **Prompt Template Location**: `/docs/sprint-artifacts/epic-2-ai-prompts.md` (Task Generation section)

- **Configuration**:

  ```typescript
  model: 'gpt-4-turbo-preview';
  temperature: 0.7;
  maxTokens: 2000;
  topP: 0.9;
  ```

- **Performance Targets**:
  - P95 API response time: ≤ 15 seconds
  - P95 OpenAI call time: ≤ 12 seconds
  - Success rate: ≥ 95%

### Architecture Alignment

- **DDD Layers**:
  - Domain: AIGenerationService.generateTasks() (business logic)
  - Infrastructure: OpenAIAdapter (external API)
  - Interface: AIGenerationController.generateTasks() (HTTP handler)
  - No controller business logic (delegate to service)

- **Validation Strategy**:
  - Request validation: Zod schema in controller
  - Output validation: validateTasksOutput() in service
  - Business rules: QuotaEnforcementService

- **Event Publishing**:
  - Event: `ai.tasks_generated`
  - Payload: { accountUuid, keyResultUuid, taskCount, tokenUsage, timestamp }
  - Subscribers: Analytics service (future), Audit log service

### Prompt Engineering Notes

**System Prompt Key Points:**

- Emphasize "actionable" and "specific"
- Request verb-led titles (e.g., "Audit...", "Implement...", "Review...")
- Include time estimation guidance (1-40 hours realistic range)
- Request completion criteria in descriptions
- JSON output format with example

**User Prompt Variables:**

- {{keyResultTitle}}: Main context for task generation
- {{keyResultDescription}}: Additional details
- {{targetValue}} and {{currentValue}}: Progress context
- {{timeRemaining}}: Deadline pressure (affects task breakdown)

**Example Task Output Quality:**

```json
{
  "title": "Audit Current Critical Bug Backlog",
  "description": "Review all P0/P1 bugs in Jira. Categorize by root cause. Document patterns. Create action items for top 3 categories. Complete when: Audit report with categorization and action plan submitted.",
  "estimatedHours": 8,
  "priority": "HIGH",
  "dependencies": [],
  "tags": ["analysis", "bugs", "audit"]
}
```

### Learnings from Previous Stories

**From Story 2-1-generate-key-results-backend:**

- **Reusable Patterns**:
  - AIGenerationService structure and quota integration
  - OpenAIAdapter usage with timeout and retry
  - JSON parsing with Markdown code block fallback
  - Validation helper pattern (validateKeyResultsOutput → validateTasksOutput)
  - Error handling and logging structure

- **Service Extension Strategy**:
  - Add new method `generateTasks()` alongside `generateKeyResults()`
  - Share common helpers (tryParseJSON, buildPrompt, logGeneration)
  - Reuse QuotaEnforcementService integration
  - Follow same error handling patterns

- **Controller Pattern**:
  - AIGenerationController already exists (from Story 1-4)
  - Add new handler method `generateTasks` (async function)
  - Delegate to service, map response, handle errors
  - Keep handler under 20 lines

- **Route Configuration**:
  - aiConversationRoutes.ts already exists
  - Add new POST route with Swagger docs
  - Follow existing auth and error handling middleware

**From Story 1-4-ai-api-layer-integration:**

- **Infrastructure Ready**:
  - AIContainer DI setup available
  - Error handling middleware maps domain errors
  - Auth middleware enforces JWT tokens
  - Swagger/OpenAPI documentation pattern established

- **Files to Extend** (DO NOT recreate):
  - `AIGenerationService.ts` - Add generateTasks() method
  - `AIGenerationController.ts` - Add generateTasks handler
  - `aiConversationRoutes.ts` - Add POST /generate/tasks route

[Sources: /docs/sprint-artifacts/2-1-generate-key-results-backend.md, /docs/sprint-artifacts/1-4-ai-api-layer-integration.md]

### References

- [Tech Spec: Epic 2](./tech-spec-epic-2.md) - Detailed design and workflows
- [Epic 2 AI Prompts](./epic-2-ai-prompts.md) - Task Generation prompt templates
- [Story 2.1](./2-1-generate-key-results-backend.md) - Similar backend pattern
- [Epics: Story 2.3](../epics.md#story-23-generate-task-templates-backend)
- [Architecture: API](../architecture-api.md) - DDD patterns

## Dev Agent Record

### Context Reference

- [2-3-generate-task-templates-backend.context.xml](./2-3-generate-task-templates-backend.context.xml)

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

**2025-11-20 - Story 2.3: Task Template Generation Backend Complete**

✅ **Tasks 1-8 完成：核心后端实现**

**实施策略：**

- 复用 Story 2.1 (Key Results) 的成功架构模式
- 扩展现有服务，不重构（遵循开闭原则）
- 使用相同的 DDD 分层和错误处理机制

**关键实现：**

1. **DTOs (Task 1)**:
   - `GenerateTasksRequest`: krTitle, krDescription, targetValue, currentValue, unit, timeRemaining
   - `TaskTemplatePreview`: title, description, estimatedHours, priority, dependencies, tags
   - `GenerateTasksResponse`: tasks[], tokenUsage, generatedAt
   - `TaskPriority` enum: HIGH, MEDIUM, LOW

2. **Domain Service (Task 2)**:
   - `AIGenerationService.generateTaskTemplate()` 方法
   - 输入验证：KR 上下文数据
   - AI 调用：GPT-4 Turbo with 0.7 temperature
   - 输出解析：JSON array of TaskTemplatePreview
   - 配额管理：checkQuota + consumeQuota

3. **Validation (Task 3)**:
   - `validateTasksOutput()` 验证函数
   - 任务数量：5-10 个
   - estimatedHours：1-40 小时
   - priority：HIGH|MEDIUM|LOW
   - title：首字母大写
   - description：≥50 字符（如果提供）
   - dependencies：有效的索引数组

4. **API Layer (Tasks 4-5)**:
   - Controller: `AIConversationController.generateTasks()`
   - Application Service: `AIGenerationApplicationService.generateTaskTemplate()`
   - Route: `POST /api/ai/generate/tasks`
   - Swagger 文档：完整的请求/响应示例

5. **Prompt Engineering (Task 6)**:
   - System prompt：强调 actionable tasks, 合理工时估算
   - User prompt：包含 KR 详情和上下文
   - 输出格式：JSON array with 5-10 items
   - 智能依赖：基于任务逻辑顺序

6. **Error Handling (Task 7)**:
   - 10 秒超时（继承自 BaseAIAdapter）
   - JSON 解析重试（OpenAIAdapter.tryParseJSON）
   - Markdown 代码块 fallback
   - 统一错误映射（QuotaExceededError→429, ValidationError→400）

7. **Testing (Task 8)**:
   - 8 个新单元测试 for `generateTaskTemplate()`
   - 测试覆盖：happy path, 各种验证失败场景, 配额消费
   - 总计 14 个测试全部通过（6 KR + 8 Task）
   - Mock OpenAIAdapter 避免真实 API 调用

**技术亮点：**

- 遵循 Story 2.1 的成功模式
- DDD 分层清晰（Domain → Application → Interface）
- 代码复用率高（Quota, Adapter, Error Handling 全部复用）
- 类型安全（TypeScript + Zod validation）
- 可测试性强（依赖注入 + Mock Adapter）

**遗留工作：**

- Task 9: Integration Tests（需要完整 API 环境）
- Task 10: Manual Quality Verification（需要真实 OpenAI API）

### File List

**Created Files:**

- `packages/contracts/src/modules/ai/api-requests/GenerateTasksRequest.ts` (18 lines)
- `packages/contracts/src/modules/ai/api-responses/GenerateTasksResponse.ts` (45 lines)

**Modified Files:**

- `packages/contracts/src/modules/ai/api-requests.ts`
  - Exported GenerateTasksRequest
- `packages/contracts/src/modules/ai/api-responses.ts`
  - Exported GenerateTasksResponse, TaskTemplatePreview
- `packages/domain-server/src/ai/services/prompts/templates.ts`
  - Added GENERATE_TASKS_PROMPT template
  - System prompt: actionable tasks, realistic hours, logical dependencies
  - User prompt: KR context with target/current/timeRemaining
- `packages/domain-server/src/ai/services/AIGenerationService.ts`
  - Added `generateTaskTemplate()` method (lines 145-232)
  - Added `validateTasksOutput()` validation (lines 234-302)
  - Validation: count 5-10, hours 1-40, priority enum, title format, dependencies
- `apps/api/src/modules/ai/application/services/AIGenerationApplicationService.ts`
  - Implemented `generateTaskTemplate()` method (was stub)
  - Creates GenerationTask with TASK_TEMPLATE type
  - Returns tasks array + tokenUsage + generatedAt
- `apps/api/src/modules/ai/interface/http/AIConversationController.ts`
  - Added `generateTasks()` handler method (lines 471-562)
  - Request validation + error handling
  - Delegates to AIGenerationApplicationService
- `apps/api/src/modules/ai/interface/http/aiConversationRoutes.ts`
  - Added POST /api/ai/generate/tasks route (line 173)
  - Comprehensive Swagger/OpenAPI documentation (lines 122-172)
  - Request/response schemas with examples
- `packages/domain-server/src/ai/services/__tests__/AIGenerationService.test.ts`
  - Added 8 test cases for `generateTaskTemplate()` (lines 241-461)
  - Tests: happy path, count validation, hours validation, priority validation, dependencies validation, description validation, quota consumption
- `docs/sprint-artifacts/sprint-status.yaml`
  - Updated 2-3-generate-task-templates-backend: ready-for-dev → in-progress
- `docs/sprint-artifacts/2-3-generate-task-templates-backend.md`
  - Marked Tasks 1-8 as complete
  - Added completion notes and file list
