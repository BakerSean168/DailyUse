# Story 4.1: Document Summarization Backend

Status: drafted

## Story

As a User,
I want to summarize long texts,
So that I can get the key points quickly.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Endpoint `POST /api/ai/summarize` accepts valid request and returns 200 OK
2. **AC-2**: Response contains structured summary with core, keyPoints, actionItems
3. **AC-3**: Core summary is 50-150 words capturing the essence
4. **AC-4**: Key points are 3-5 bullet items, each 15-30 words
5. **AC-5**: Action items are 0-3 practical suggestions (if applicable)
6. **AC-6**: Input text limited to 1-50,000 characters
7. **AC-7**: Quota check and consumption enforced (via QuotaEnforcementService)
8. **AC-8**: Returns metadata: tokensUsed, compressionRatio, inputLength

### Technical Criteria

9. **AC-9**: Uses AIGenerationService and QuotaEnforcementService (from Epic 1)
10. **AC-10**: Implements summarization prompt template with JSON output
11. **AC-11**: Validates response structure (core, keyPoints, actionItems)
12. **AC-12**: Logs summarization events with accountUuid and tokenUsage
13. **AC-13**: No controller business logic (delegate to service)
14. **AC-14**: Supports optional parameters: language (zh-CN/en), includeActions (boolean)

### Quality Criteria

15. **AC-15**: Unit tests for AIGenerationService.summarizeDocument()
16. **AC-16**: Integration test with MockAIAdapter
17. **AC-17**: Zero TypeScript errors
18. **AC-18**: Swagger/OpenAPI documented

## Tasks / Subtasks

- [ ] **Task 1**: Create Request/Response DTOs (AC: 1-5, 8, 14)
  - [ ] Create `SummarizationRequestDTO` in `packages/contracts/src/modules/ai/api-requests`
    - Fields: text (string, 1-50k chars), language (optional, default 'zh-CN'), includeActions (optional, default true)
  - [ ] Create `SummarizationResultDTO` in `packages/contracts/src/modules/ai/api-responses`
    - Fields: summary { core, keyPoints, actionItems }, metadata { tokensUsed, generatedAt, inputLength, compressionRatio }
  - [ ] Export new DTOs in contracts index

- [ ] **Task 2**: Implement Summarization Prompt Template (AC: 10)
  - [ ] Add `SUMMARIZATION_PROMPT` to `prompts/templates.ts`
  - [ ] System prompt: Expert summarizer, structured JSON output
  - [ ] User prompt template: Replace {{inputText}}, {{language}}, {{includeActions}}
  - [ ] Specify output format: { "core": "...", "keyPoints": [...], "actionItems": [...] }
  - [ ] Emphasize: factual content, professional language, clear bullet points

- [ ] **Task 3**: Extend AIGenerationService with Summarization (AC: 2-8, 9, 12)
  - [ ] Add `summarizeDocument()` method to AIGenerationService
  - [ ] Validate input text length (1-50,000 chars)
  - [ ] Implement quota check via QuotaEnforcementService.checkQuota()
  - [ ] Build prompt from template with user parameters
  - [ ] Call OpenAIAdapter.generateText() with prompt
  - [ ] Parse JSON response to summary structure
  - [ ] Validate output via validateSummaryOutput()
  - [ ] Calculate compressionRatio (outputLength / inputLength)
  - [ ] Consume quota after successful generation
  - [ ] Log event with accountUuid, tokenUsage, inputLength

- [ ] **Task 4**: Implement Validation Logic (AC: 3-5, 11)
  - [ ] Create `validateSummaryOutput()` helper in AIGenerationService
  - [ ] Validate core summary: 50-150 words
  - [ ] Validate keyPoints: 3-5 items, each 15-30 words
  - [ ] Validate actionItems: 0-3 items (if includeActions=true)
  - [ ] Validate JSON structure (all required fields present)
  - [ ] Throw AIValidationError if any check fails

- [ ] **Task 5**: Implement Application Service Layer (AC: 9, 13)
  - [ ] Add `summarizeDocument()` to AIGenerationApplicationService
  - [ ] Create GenerationTask entity with SUMMARIZATION type
  - [ ] Delegate to domain service AIGenerationService.summarizeDocument()
  - [ ] Map domain response to DTO
  - [ ] Handle domain errors (QuotaExceededError, ValidationError, TimeoutError)

- [ ] **Task 6**: Implement API Controller Handler (AC: 1, 13)
  - [ ] Add `summarizeDocument` handler to AIConversationController
  - [ ] Apply authMiddleware (extract accountUuid from JWT)
  - [ ] Validate request body with Zod schema (text length, optional params)
  - [ ] Delegate to AIGenerationApplicationService.summarizeDocument()
  - [ ] Map response to HTTP 200 with SummarizationResultDTO
  - [ ] Handle errors via handleError() (400, 401, 429, 504, 500)

- [ ] **Task 7**: Add Route Configuration (AC: 1, 18)
  - [ ] Add `POST /api/ai/summarize` route in aiConversationRoutes.ts
  - [ ] Add Swagger/OpenAPI documentation:
    - Request schema with text (1-50k chars), language, includeActions
    - Response schema with summary + metadata
    - Error schemas (400 invalid input, 401 unauthorized, 429 quota exceeded, 504 timeout)
  - [ ] Mount route at /api/ai

- [ ] **Task 8**: Unit Tests (AC: 15, 17)
  - [ ] Test AIGenerationService.summarizeDocument():
    - Mock OpenAIAdapter to return valid summary
    - Assert core summary 50-150 words
    - Assert keyPoints 3-5 items
    - Assert actionItems 0-3 items (when enabled)
    - Test validation failures (core too short/long, wrong keyPoints count)
    - Test quota consumption
    - Test compressionRatio calculation
  - [ ] Verify TypeScript compilation (no errors)

- [ ] **Task 9**: Integration Tests (AC: 16)
  - [ ] Test POST /api/ai/summarize with MockAIAdapter:
    - Happy path → 200 OK with structured summary
    - Authentication required → 401 without token
    - Input too short (<1 char) → 400
    - Input too long (>50k chars) → 400
    - Quota exceeded → 429
    - Timeout → 504
  - [ ] Verify quota consumption (quota.used incremented)
  - [ ] Test optional parameters (language, includeActions=false)

- [ ] **Task 10**: Manual Quality Verification (AC: 3-5)
  - [ ] Test with 10 different text types (news article, technical doc, meeting notes, etc.)
  - [ ] Verify core summaries capture main ideas
  - [ ] Verify key points are distinct and actionable
  - [ ] Assess action items relevance (when applicable)
  - [ ] Document quality assessment (accuracy ≥80%)
  - [ ] Refine prompt if quality insufficient

## Dev Notes

### Technical Context

- **Location**:
  - DTOs: `packages/contracts/src/modules/ai/api-requests/SummarizationRequestDTO.ts` and `api-responses/SummarizationResultDTO.ts`
  - Service: `packages/domain-server/src/modules/ai/services/AIGenerationService.ts` (extend existing)
  - Application Service: `apps/api/src/modules/ai/application/services/AIGenerationApplicationService.ts` (extend)
  - Controller: `apps/api/src/modules/ai/interface/http/AIConversationController.ts` (add handler)
  - Routes: `apps/api/src/modules/ai/interface/http/aiConversationRoutes.ts` (add route)

- **Dependencies**:
  - `OpenAIAdapter` (Epic 1) - Reuse for LLM calls
  - `QuotaEnforcementService` (Epic 1) - Reuse for quota management
  - `AIGenerationService` (Story 2-1, 2-3) - Extend with summarization method
  - Base error handling and logging (Epic 1)

- **Configuration**:

  ```typescript
  model: 'gpt-4-turbo-preview';
  temperature: 0.5; // Lower for more focused summaries
  maxTokens: 1500; // Sufficient for structured summary
  topP: 0.9;
  ```

- **Performance Targets** (from Tech Spec):
  - P50 response time: ≤5 seconds
  - P95 response time: ≤10 seconds (for 5000-word texts)
  - Success rate: ≥95%
  - Compression ratio: 0.1-0.2 (summary is 10-20% of input length)

### Architecture Alignment

- **DDD Layers**:
  - Domain: AIGenerationService.summarizeDocument() (business logic + validation)
  - Application: AIGenerationApplicationService.summarizeDocument() (orchestration)
  - Infrastructure: OpenAIAdapter (external API integration)
  - Interface: AIConversationController.summarizeDocument() (HTTP handler)
  - No controller business logic (thin controller pattern)

- **Validation Strategy**:
  - Request validation: Zod schema in controller (text length, optional params)
  - Output validation: validateSummaryOutput() in domain service
  - Business rules: QuotaEnforcementService (quota check before generation)

- **Error Handling**:
  - Domain errors: QuotaExceededError, AIValidationError, AITimeoutError
  - HTTP mapping: 429 (quota), 400 (validation), 504 (timeout), 500 (unexpected)
  - Logging: All errors logged with context (accountUuid, inputLength, tokenUsage)

### Prompt Engineering Notes

**System Prompt Key Points:**

- Role: Expert at analyzing and summarizing content
- Task: Create structured summary with 3 sections
- Output format: JSON only, no additional text
- Tone: Professional, clear, factual (avoid opinions)

**User Prompt Variables:**

- {{inputText}}: The text to summarize (1-50k chars)
- {{language}}: Target language (zh-CN or en)
- {{includeActions}}: Whether to generate action items

**Output Format:**

```json
{
  "core": "A concise 2-3 sentence summary capturing the main idea (50-150 words)",
  "keyPoints": [
    "Key point 1 (15-30 words)",
    "Key point 2 (15-30 words)",
    "Key point 3 (15-30 words)"
  ],
  "actionItems": ["Optional actionable suggestion 1", "Optional actionable suggestion 2"]
}
```

**Quality Guidelines:**

- Core summary: Essence in 2-3 sentences, 50-150 words
- Key points: 3-5 distinct items, each 15-30 words
- Action items: 0-3 practical suggestions (only if applicable to content)
- Language: Clear, professional, no jargon unless from source
- Focus: Factual content extraction, not interpretation

### Learnings from Previous Stories

**From Story 2-1 (Generate Key Results Backend):**

- Reusable AIGenerationService pattern
- Quota integration: check → generate → consume
- JSON parsing with Markdown fallback (OpenAIAdapter.tryParseJSON)
- Validation helper pattern (validateKeyResultsOutput → validateSummaryOutput)
- Error handling and logging structure

**From Story 2-3 (Generate Task Templates Backend):**

- Extending AIGenerationService without breaking existing methods
- Shared prompt template infrastructure
- Controller pattern: thin handler, delegate to service
- Swagger documentation best practices

**Service Extension Strategy:**

- Add new method `summarizeDocument()` alongside existing methods
- Share common helpers (tryParseJSON, buildPrompt, logGeneration)
- Reuse QuotaEnforcementService integration
- Follow same error handling patterns

**Files to Extend** (DO NOT recreate):

- `AIGenerationService.ts` - Add summarizeDocument() method
- `AIGenerationApplicationService.ts` - Add summarizeDocument() orchestration
- `AIConversationController.ts` - Add summarizeDocument handler
- `aiConversationRoutes.ts` - Add POST /api/ai/summarize route

### References

- [Tech Spec: Epic 4](./tech-spec-epic-4.md) - Section 2.2 API Design, 2.3 Prompt Design
- [Epics: Story 4.1](../epics.md#story-41-document-summarization-backend)
- [Architecture: API](../architecture-api.md) - DDD patterns
- [Story 2.1](./2-1-generate-key-results-backend.md) - Similar backend pattern
- [Story 2.3](./2-3-generate-task-templates-backend.md) - Service extension example

## Dev Agent Record

### Context Reference

_Context file to be generated when story marked ready-for-dev_

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled after implementation_
