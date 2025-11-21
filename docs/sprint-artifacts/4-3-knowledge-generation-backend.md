# Story 4.3: Knowledge Generation Backend

Status: ready-for-dev

## Story

As a User,
I want to generate a series of knowledge docs,
So that I can learn about a topic systematically.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Endpoint `POST /api/ai/generate/knowledge-series` accepts valid request and returns 202 Accepted
2. **AC-2**: Response contains taskUuid for tracking asynchronous generation
3. **AC-3**: Generates 3-7 distinct documents based on requested count (default: 5)
4. **AC-4**: Each document has title (max 60 chars), content (1000-1500 words Markdown), order
5. **AC-5**: Documents saved to `/AI Generated/{topic}` folder in Document module
6. **AC-6**: Endpoint `GET /api/ai/generate/knowledge-series/:taskId` returns task status
7. **AC-7**: Task status includes: PENDING, GENERATING, COMPLETED, FAILED
8. **AC-8**: Progress tracking: 0-100% based on documents completed
9. **AC-9**: Endpoint `GET /api/ai/generate/knowledge-series/:taskId/documents` returns generated documents
10. **AC-10**: Partial success: If some docs fail, mark them FAILED but continue with others

### Technical Criteria

11. **AC-11**: Uses AIGenerationService and QuotaEnforcementService (from Epic 1)
12. **AC-12**: Implements knowledge series prompt template with progressive structure
13. **AC-13**: Integrates with DocumentApplicationService to create documents
14. **AC-14**: Persists KnowledgeGenerationTask entity in database (PostgreSQL)
15. **AC-15**: Asynchronous background processing (does not block HTTP response)
16. **AC-16**: Quota checked before starting, consumed incrementally per document
17. **AC-17**: Logs generation events with accountUuid, topic, documentCount, tokenUsage
18. **AC-18**: No controller business logic (delegate to application service)

### Quality Criteria

19. **AC-19**: Unit tests for AIGenerationService.generateKnowledgeSeries()
20. **AC-20**: Integration test for full async flow (create task → poll → fetch documents)
21. **AC-21**: Zero TypeScript errors
22. **AC-22**: Swagger/OpenAPI documented for all 3 endpoints

## Tasks / Subtasks

- [ ] **Task 1**: Create Database Schema & Entity (AC: 14)
  - [ ] Add `knowledge_generation_task` table to Prisma schema:
    - Fields: uuid, accountUuid, topic, documentCount, status, progress, generatedDocumentUuids, error, createdAt, completedAt
    - Indexes: accountUuid, status, createdAt
  - [ ] Run migration: `npx prisma migrate dev --name add-knowledge-generation-task`
  - [ ] Create `KnowledgeGenerationTask` domain entity in `packages/domain-server/src/ai/entities`
  - [ ] Create repository: `KnowledgeGenerationTaskRepository` with methods: create, findById, update

- [ ] **Task 2**: Create Request/Response DTOs (AC: 1-3, 6-9)
  - [ ] Create `KnowledgeGenerationRequestDTO` in `packages/contracts/src/modules/ai/api-requests`
    - Fields: topic (string, 1-100 chars), documentCount (optional, 3-7, default 5), targetAudience (optional), folderPath (optional)
  - [ ] Create `KnowledgeGenerationTaskDTO` in `packages/contracts/src/modules/ai/api-responses`
    - Fields: taskUuid, topic, status, progress, generatedDocuments { uuid, title, status }, estimatedTimeRemaining, error, createdAt, completedAt
  - [ ] Create `GeneratedDocumentPreview` interface: uuid, title, status (COMPLETED/FAILED)
  - [ ] Export new DTOs in contracts index

- [ ] **Task 3**: Implement Knowledge Series Prompt Template (AC: 12)
  - [ ] Add `KNOWLEDGE_SERIES_PROMPT` to `prompts/templates.ts`
  - [ ] System prompt: Professional content creator, educational materials expert
  - [ ] User prompt template: Replace {{topic}}, {{documentCount}}, {{targetAudience}}
  - [ ] Specify progressive structure: 1. Fundamentals, 2. Core Concepts, 3. Practical Applications, 4. Advanced Topics, 5. Challenges
  - [ ] Output format: JSON array with { title, content (Markdown), order }
  - [ ] Emphasize: 1000-1500 words per doc, ## and ### headings, practical examples, cross-references

- [ ] **Task 4**: Extend AIGenerationService with Knowledge Series (AC: 3-5, 11, 12, 16, 17)
  - [ ] Add `generateKnowledgeSeries()` method to AIGenerationService
  - [ ] Validate input: topic (1-100 chars), documentCount (3-7)
  - [ ] Check quota for estimated token usage (documentCount \* 2000 tokens)
  - [ ] Build prompt from template with topic, documentCount, targetAudience
  - [ ] Call OpenAIAdapter.generateText() with prompt
  - [ ] Parse JSON response to array of { title, content, order }
  - [ ] Validate output: correct count, title max 60 chars, content 1000-1500 words
  - [ ] Return array of GeneratedKnowledgeDocument
  - [ ] Log event with accountUuid, topic, documentCount, totalTokens

- [ ] **Task 5**: Implement Asynchronous Task Management (AC: 2, 6-8, 15)
  - [ ] Add `createKnowledgeGenerationTask()` to AIGenerationApplicationService
    - Create task entity with status PENDING
    - Persist to database via repository
    - Return taskUuid immediately (HTTP 202 Accepted)
    - Start background process (do not await)
  - [ ] Add `processKnowledgeGeneration()` background method:
    - Update task status to GENERATING
    - For each document (1 to N):
      - Generate content via AIGenerationService
      - Create Document via DocumentApplicationService
      - Update progress = (i / N) \* 100
      - Add documentUuid to generatedDocumentUuids array
      - Save task state after each doc
      - Consume quota incrementally
      - Handle errors: mark doc as FAILED, log error, continue
    - Update task status to COMPLETED (or FAILED if all docs failed)
    - Set completedAt timestamp

- [ ] **Task 6**: Integrate with Document Module (AC: 5, 13)
  - [ ] In `processKnowledgeGeneration()`, for each generated doc:
    - Call `DocumentApplicationService.create()`:
      - title: from AI output
      - content: Markdown string
      - folderPath: `/AI Generated/{topic}` (auto-create folder if not exists)
      - tags: ["AI Generated", topic]
      - metadata: { generatedBy: "AI", generationTaskUuid, order }
    - Store returned documentUuid in task.generatedDocumentUuids
  - [ ] Handle Document module errors (save failed, quota exceeded, etc.)

- [ ] **Task 7**: Implement Task Status Endpoints (AC: 6-9)
  - [ ] Add `getKnowledgeGenerationTask` handler to AIConversationController
    - GET /api/ai/generate/knowledge-series/:taskId
    - Find task by taskUuid via repository
    - Verify accountUuid matches (authorization)
    - Map task entity to KnowledgeGenerationTaskDTO
    - Return 200 OK with task status
  - [ ] Add `getGeneratedDocuments` handler:
    - GET /api/ai/generate/knowledge-series/:taskId/documents
    - Find task, verify ownership
    - Fetch documents by UUIDs via DocumentApplicationService
    - Return 200 OK with Document[] array

- [ ] **Task 8**: Implement API Controller for Task Creation (AC: 1, 18)
  - [ ] Add `createKnowledgeGenerationTask` handler to AIConversationController
  - [ ] Apply authMiddleware (extract accountUuid from JWT)
  - [ ] Validate request body with Zod schema (topic 1-100 chars, documentCount 3-7)
  - [ ] Delegate to AIGenerationApplicationService.createKnowledgeGenerationTask()
  - [ ] Return 202 Accepted with { taskUuid } (asynchronous response)
  - [ ] Handle errors via handleError() (400, 401, 429, 500)

- [ ] **Task 9**: Add Route Configuration (AC: 1, 6, 9, 22)
  - [ ] Add routes to `aiConversationRoutes.ts`:
    - POST /api/ai/generate/knowledge-series
    - GET /api/ai/generate/knowledge-series/:taskId
    - GET /api/ai/generate/knowledge-series/:taskId/documents
  - [ ] Add Swagger/OpenAPI documentation for all 3 endpoints:
    - Request schemas, response schemas, error codes
    - Example request/response bodies
    - 202 Accepted explanation for async operation

- [ ] **Task 10**: Implement Partial Success Handling (AC: 10, 17)
  - [ ] In `processKnowledgeGeneration()` background method:
    - Wrap each document generation in try-catch
    - If document fails: log error, mark status FAILED in generatedDocuments array, continue to next
    - If all documents fail: set task status to FAILED, set error message
    - If some succeed: set task status to COMPLETED (partial success is success)
  - [ ] Log all failures with context (documentIndex, topic, error message)

- [ ] **Task 11**: Unit Tests (AC: 19, 21)
  - [ ] Test AIGenerationService.generateKnowledgeSeries():
    - Mock OpenAIAdapter to return valid document array
    - Assert documentCount matches request
    - Assert each doc has title (max 60 chars), content (1000-1500 words), order
    - Test validation failures (wrong count, title too long, content too short)
    - Test quota check (sufficient vs insufficient)
  - [ ] Test KnowledgeGenerationTaskRepository CRUD operations
  - [ ] Verify TypeScript compilation (no errors)

- [ ] **Task 12**: Integration Tests (AC: 20)
  - [ ] Test full async flow:
    - POST /api/ai/generate/knowledge-series → 202 with taskUuid
    - Poll GET /api/ai/generate/knowledge-series/:taskId → status changes PENDING → GENERATING → COMPLETED
    - GET /api/ai/generate/knowledge-series/:taskId/documents → returns N documents
    - Verify documents created in Document module
  - [ ] Test error scenarios:
    - Authentication required → 401
    - Quota exceeded before starting → 429
    - Partial failure (some docs succeed, some fail) → task COMPLETED with mixed statuses
    - All docs fail → task status FAILED
  - [ ] Test authorization (user can only access own tasks)

- [ ] **Task 13**: Manual Quality Verification (AC: 4, 12)
  - [ ] Test with 5 different topics (e.g., "Weight Loss", "Python Programming", "Time Management")
  - [ ] Verify document quality:
    - Titles are distinct and descriptive (max 60 chars)
    - Content is 1000-1500 words in Markdown format
    - Progressive structure (fundamentals → advanced)
    - Practical examples and actionable insights
    - Cross-references between documents (where applicable)
  - [ ] Assess document adoption rate (do users keep generated docs? Target: ≥70%)
  - [ ] Refine prompt if quality insufficient

## Dev Notes

### Technical Context

- **Location**:
  - Database: Add `knowledge_generation_task` table to Prisma schema
  - Entity: `packages/domain-server/src/ai/entities/KnowledgeGenerationTask.ts`
  - Repository: `packages/domain-server/src/ai/repositories/KnowledgeGenerationTaskRepository.ts`
  - DTOs: `packages/contracts/src/modules/ai/api-requests/KnowledgeGenerationRequestDTO.ts` and `api-responses/KnowledgeGenerationTaskDTO.ts`
  - Service: `packages/domain-server/src/modules/ai/services/AIGenerationService.ts` (extend)
  - Application Service: `apps/api/src/modules/ai/application/services/AIGenerationApplicationService.ts` (extend)
  - Controller: `apps/api/src/modules/ai/interface/http/AIConversationController.ts` (add handlers)
  - Routes: `apps/api/src/modules/ai/interface/http/aiConversationRoutes.ts` (add routes)

- **Dependencies**:
  - `OpenAIAdapter` (Epic 1) - Reuse for LLM calls
  - `QuotaEnforcementService` (Epic 1) - Reuse for quota management
  - `DocumentApplicationService` (Story 7-1) - Create and store documents
  - `AIGenerationService` (Story 2-1, 2-3, 4-1) - Extend with knowledge series method
  - Prisma (PostgreSQL) - Task persistence

- **Configuration**:

  ```typescript
  model: 'gpt-4-turbo-preview';
  temperature: 0.7; // Higher for creative content
  maxTokens: 12000; // Large for multiple documents (5 docs * ~2000 tokens)
  topP: 0.9;
  ```

- **Performance Targets** (from Tech Spec):
  - Generation time: P95 < 4 minutes for 5 documents (avg 48s per doc)
  - Success rate: ≥85% (tasks complete successfully)
  - Partial success rate: ≥95% (at least 1 doc generated)
  - Token efficiency: < 10,000 tokens per series (avg 2,000 per doc)

### Architecture Alignment

- **DDD Layers**:
  - Domain: AIGenerationService.generateKnowledgeSeries(), KnowledgeGenerationTask entity
  - Application: AIGenerationApplicationService.createKnowledgeGenerationTask(), processKnowledgeGeneration() (orchestration)
  - Infrastructure: OpenAIAdapter (AI API), KnowledgeGenerationTaskRepository (persistence), DocumentApplicationService (integration)
  - Interface: AIConversationController (HTTP handlers)

- **Asynchronous Pattern**:
  - HTTP 202 Accepted: Immediate response with taskUuid (non-blocking)
  - Background processing: Fire-and-forget async function
  - Polling: Client polls GET /knowledge-series/:taskId every 2 seconds
  - Completion: Client fetches documents when status = COMPLETED

- **State Machine** (Task Status):

  ```
  PENDING (created)
     ↓
  GENERATING (processing documents)
     ↓
  COMPLETED (all docs or partial success)
  FAILED (all docs failed or critical error)
  ```

- **Error Handling**:
  - Quota exceeded before start → 429, task not created
  - Document generation fails → log error, mark doc FAILED, continue
  - All documents fail → task status FAILED, error message set
  - Partial success → task status COMPLETED (success if ≥1 doc generated)

### Database Schema

**knowledge_generation_task Table:**

```prisma
model KnowledgeGenerationTask {
  uuid                    String   @id @default(uuid())
  accountUuid             String
  topic                   String
  documentCount           Int      @default(5)
  targetAudience          String?
  folderPath              String
  status                  String   // PENDING, GENERATING, COMPLETED, FAILED
  progress                Int      @default(0) // 0-100
  generatedDocumentUuids  String[] // Array of Document UUIDs
  error                   String?
  createdAt               DateTime @default(now())
  completedAt             DateTime?

  @@index([accountUuid])
  @@index([status])
  @@index([createdAt])
  @@map("knowledge_generation_task")
}
```

### Prompt Engineering Notes

**System Prompt Key Points:**

- Role: Professional content creator specializing in educational materials
- Task: Generate N distinct, interconnected documents on a topic
- Structure: Progressive (fundamentals → advanced)
- Format: Markdown with ## and ### headings
- Tone: Educational, practical, actionable

**User Prompt Variables:**

- {{topic}}: The subject to cover (e.g., "Weight Loss")
- {{documentCount}}: Number of documents (3-7)
- {{targetAudience}}: Skill level (beginners, intermediate, advanced)

**Document Structure Template:**

1. Document 1: Fundamentals and Overview (introduction, basic concepts)
2. Document 2: Core Concepts and Principles (theory, frameworks)
3. Document 3: Practical Applications (how-to, examples, case studies)
4. Document 4: Advanced Topics (optimization, edge cases, best practices)
5. Document 5: Common Challenges and Solutions (FAQ, troubleshooting, mistakes)

**Output Format:**

```json
[
  {
    "title": "Weight Loss: Fundamentals and Overview",
    "content": "# Weight Loss: Fundamentals and Overview\n\n## Introduction\n\n...",
    "order": 1
  },
  ...
]
```

**Quality Guidelines:**

- Title: Max 60 chars, descriptive, includes topic
- Content: 1000-1500 words, Markdown with headings, practical examples
- Cross-references: Link to other docs in series (e.g., "See Document 3 for implementation details")
- Actionable: Each doc should have takeaways or action items

### Integration with Document Module

**Document Creation:**

- Service: `DocumentApplicationService.create()`
- Parameters:
  - accountUuid: from task
  - title: from AI output
  - content: Markdown string
  - folderPath: `/AI Generated/{topic}` (auto-create if missing)
  - tags: ["AI Generated", topic]
  - metadata: { generatedBy: "AI", generationTaskUuid, order }

**Folder Management:**

- Check if folder exists: `DocumentApplicationService.getFolderByPath()`
- If not exists, create: `DocumentApplicationService.createFolder()`
- All generated docs go into same folder

**Error Handling:**

- Document creation fails → log error, mark doc FAILED, continue
- Quota exceeded during document creation → stop generation, set task status FAILED
- Invalid folderPath → use default `/AI Generated/{topic}`

### Learnings from Previous Stories

**From Story 2-1, 2-3, 4-1 (Backend Generation):**

- AIGenerationService extension pattern
- Quota integration: check → generate → consume
- JSON parsing and validation
- Error handling and logging

**Async Pattern (New for Epic 4):**

- HTTP 202 Accepted for long-running operations
- Background processing with task persistence
- Polling-based progress tracking (no WebSocket complexity)
- Partial success handling (continue on errors)

**Key Architectural Decisions:**

- Store tasks in database (survive server restart)
- Polling interval: 2 seconds (frontend decides)
- Background processing: Fire-and-forget async function
- Partial success = success (task COMPLETED if ≥1 doc generated)

**Files to Extend** (DO NOT recreate):

- `AIGenerationService.ts` - Add generateKnowledgeSeries() method
- `AIGenerationApplicationService.ts` - Add async task management
- `AIConversationController.ts` - Add 3 new handlers
- `aiConversationRoutes.ts` - Add 3 new routes

**Files to Create:**

- `KnowledgeGenerationTask.ts` entity
- `KnowledgeGenerationTaskRepository.ts` repository
- Prisma migration for new table
- New DTOs (request, response, task)

### References

- [Tech Spec: Epic 4](./tech-spec-epic-4.md) - Section 2.2 API Design, 2.3 Prompt Design, 2.5 Data Flow
- [Story 4.1](./4-1-document-summarization-backend.md) - Similar backend pattern (synchronous)
- [Epics: Story 4.3](../epics.md#story-43-knowledge-generation-backend)
- [Architecture: API](../architecture-api.md) - DDD patterns, async processing
- [Document Module README](../../apps/api/src/modules/document/README.md) - Integration points

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/4-3-knowledge-generation-backend.context.xml`

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled after implementation_
