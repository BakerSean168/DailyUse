# Technical Specification: Epic 4 - Knowledge & Content Intelligence

> **Epic**: Epic 4 - Knowledge & Content Intelligence  
> **Author**: Spec Agent (AI)  
> **Date**: 2025-11-21  
> **Status**: Draft  
> **Version**: 1.0

---

## 1. Overview

### 1.1 Scope

This epic implements AI-powered content intelligence features for the DailyUse platform, focusing on document summarization and systematic knowledge generation. It enables users to quickly extract insights from long texts and generate comprehensive knowledge libraries on specific topics, enhancing learning efficiency and knowledge management capabilities.

**In Scope:**

- Backend API for document summarization with structured output (Core, Key Points, Actions).
- Backend API for generating knowledge document series (3-5 docs) on a given topic.
- Frontend UI for document summarization tool (input, copy to clipboard).
- Frontend UI for knowledge generation wizard (topic input, progress tracking).
- Integration with AI Quota system (from Epic 1).
- Integration with Document/Repository module for storing generated knowledge.
- Structured prompt templates for high-quality content generation.

**Out of Scope:**

- Multi-format document parsing (PDF, DOCX) - deferred to v1.2.
- Real-time collaborative editing of generated content.
- Knowledge graph visualization (handled by Repository module).
- Custom summarization styles (bullet points, paragraph, etc.) - MVP uses fixed format.
- Batch processing of multiple documents.
- Integration with external knowledge bases (Wikipedia, etc.).

### 1.2 Goals

- Reduce information processing time by 70% (from reading full docs to reading summaries).
- Generate 3-5 high-quality knowledge documents in < 5 minutes.
- Enable systematic learning through AI-generated knowledge series.
- Seamlessly integrate generated content into the Knowledge Base.

### 1.3 Success Criteria

- Summarization response time P95 < 10 seconds (for texts up to 5000 words).
- Knowledge generation completion time < 3 minutes for 5 documents.
- Generated content adoption rate ≥ 70% (users keep at least 70% of generated docs).
- Summary accuracy (user satisfaction) ≥ 80%.
- API error rate < 3%.

---

## 2. Detailed Design

### 2.1 Domain Model

#### Entities

**For Summarization (Transient - Not Persisted):**

- **SummarizationRequest**
  - `uuid`: string (UUID)
  - `accountUuid`: string
  - `inputText`: string (max 50,000 chars for MVP)
  - `requestedAt`: Date

- **SummarizationResult**
  - `uuid`: string
  - `coreSummary`: string (1-2 paragraphs)
  - `keyPoints`: string[] (3-5 bullet points)
  - `actionItems`: string[] (optional, 0-3 items)
  - `tokensUsed`: number
  - `generatedAt`: Date

**For Knowledge Generation (Persisted via Document/Repository Module):**

- **KnowledgeGenerationTask**
  - `uuid`: string (UUID)
  - `accountUuid`: string
  - `topic`: string
  - `targetDocumentCount`: number (default 5)
  - `status`: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED'
  - `progress`: number (0-100)
  - `generatedDocumentUuids`: string[]
  - `createdAt`: Date
  - `completedAt`: Date | null

- **GeneratedKnowledgeDocument** (uses existing Document entity)
  - `uuid`: string
  - `title`: string (e.g., "Weight Loss: Nutrition Basics")
  - `content`: string (Markdown format, 1000-2000 words)
  - `folderPath`: string (e.g., "/AI Generated/Weight Loss")
  - `tags`: string[] (e.g., ["AI Generated", "Weight Loss", "Nutrition"])
  - `metadata`: JSON (includes `generatedBy: "AI"`, `generationTaskUuid`)

### 2.2 API Design (Backend)

#### Base Path: `/api/ai`

| Method | Endpoint                                       | Description                | Request Body                    | Response                     |
| :----- | :--------------------------------------------- | :------------------------- | :------------------------------ | :--------------------------- |
| `POST` | `/summarize`                                   | Generate document summary  | `SummarizationRequestDTO`       | `SummarizationResultDTO`     |
| `POST` | `/generate/knowledge-series`                   | Generate knowledge series  | `KnowledgeGenerationRequestDTO` | `KnowledgeGenerationTaskDTO` |
| `GET`  | `/generate/knowledge-series/:taskId`           | Get generation task status | -                               | `KnowledgeGenerationTaskDTO` |
| `GET`  | `/generate/knowledge-series/:taskId/documents` | Get generated documents    | -                               | `Document[]`                 |

#### Request/Response DTOs

**SummarizationRequestDTO:**

```typescript
{
  text: string;           // 1-50,000 characters
  language?: string;      // default: 'zh-CN'
  includeActions?: boolean; // default: true
}
```

**SummarizationResultDTO:**

```typescript
{
  summary: {
    core: string;         // 主要摘要 (100-200 words)
    keyPoints: string[];  // 关键要点 (3-5 items)
    actionItems?: string[]; // 行动建议 (0-3 items)
  };
  metadata: {
    tokensUsed: number;
    generatedAt: number;
    inputLength: number;
    compressionRatio: number; // outputLength / inputLength
  };
}
```

**KnowledgeGenerationRequestDTO:**

```typescript
{
  topic: string;             // e.g., "Weight Loss"
  documentCount?: number;    // 3-7, default: 5
  targetAudience?: string;   // e.g., "beginners", "intermediate"
  folderPath?: string;       // default: "/AI Generated/{topic}"
}
```

**KnowledgeGenerationTaskDTO:**

```typescript
{
  taskUuid: string;
  topic: string;
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  progress: number;          // 0-100
  generatedDocuments: {
    uuid: string;
    title: string;
    status: 'COMPLETED' | 'FAILED';
  }[];
  estimatedTimeRemaining?: number; // seconds
  error?: string;
  createdAt: number;
  completedAt?: number;
}
```

### 2.3 AI Prompt Design

#### Summarization Prompt Template

```
You are an expert at analyzing and summarizing content. Your task is to create a structured summary of the following text.

OUTPUT FORMAT (JSON):
{
  "core": "A concise 2-3 sentence summary capturing the main idea",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "actionItems": [
    "Optional actionable suggestion 1",
    "Optional actionable suggestion 2"
  ]
}

REQUIREMENTS:
- Core summary: 50-150 words, capture the essence
- Key points: 3-5 items, each 15-30 words
- Action items: 0-3 practical suggestions (if applicable)
- Use clear, professional language
- Focus on factual content, avoid opinions

TEXT TO SUMMARIZE:
{inputText}

Output only valid JSON, no additional text.
```

#### Knowledge Series Generation Prompt Template

```
You are a professional content creator specializing in educational materials. Generate a comprehensive knowledge series on the topic: "{topic}".

REQUIREMENTS:
- Create {documentCount} distinct, interconnected documents
- Each document: 1000-1500 words in Markdown format
- Target audience: {targetAudience}
- Progressive structure: Start with basics, advance to complex topics
- Include: Introduction, Main Content (with subheadings), Key Takeaways, References

DOCUMENT STRUCTURE:
1. Document 1: Fundamentals and Overview
2. Document 2: Core Concepts and Principles
3. Document 3: Practical Applications
4. Document 4: Advanced Topics
5. Document 5: Common Challenges and Solutions

For each document, provide:
- A compelling title (max 60 chars)
- Well-structured Markdown content with ## and ### headings
- Practical examples and actionable insights
- Cross-references to other documents in the series

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Document title",
    "content": "Full Markdown content...",
    "order": 1
  },
  ...
]

Output only valid JSON, no additional text.
```

### 2.4 Frontend Architecture (Web)

#### Module: `apps/web/src/modules/ai-tools`

**Components:**

1. **`DocumentSummarizer.vue`**: Main summarization interface
   - Text input area (or file upload for future)
   - "Summarize" button with loading state
   - Result display panel with copy button
   - Character count indicator

2. **`SummaryDisplay.vue`**: Structured summary viewer
   - Core summary section
   - Key points list
   - Action items list (if present)
   - Copy to clipboard functionality

3. **`KnowledgeGenerationWizard.vue`**: Multi-step wizard
   - Step 1: Topic input and configuration
   - Step 2: Generation in progress (with progress bar)
   - Step 3: Review generated documents
   - Step 4: Save to Knowledge Base

4. **`KnowledgeDocumentCard.vue`**: Preview card for generated docs
   - Title and excerpt
   - Word count
   - Edit/Delete actions
   - Link to full document view

**Composables:**

- **`useDocumentSummarizer`**:
  - State: `inputText`, `summary`, `isLoading`, `error`.
  - Methods: `summarize()`, `copyToClipboard()`, `reset()`.

- **`useKnowledgeGeneration`**:
  - State: `task`, `documents`, `isGenerating`, `progress`, `error`.
  - Methods: `startGeneration(topic)`, `pollProgress()`, `saveDocuments()`, `discardTask()`.

**Store:**

- **`useAIToolsStore`** (Pinia):
  - State: `recentSummaries`, `generationHistory`.
  - Actions: `saveRecentSummary`, `getGenerationHistory`, `clearHistory`.

### 2.5 Data Flow

#### Summarization Flow

1. **User Input**:
   - User pastes text into `DocumentSummarizer.vue` (or uploads file in v1.2).
   - Character count is validated (1-50,000 chars).

2. **API Request**:
   - Frontend calls `POST /api/ai/summarize` with `{ text, language, includeActions }`.
   - Loading state displayed.

3. **Backend Processing**:
   - `AIGenerationController` receives request.
   - `AIApplicationService` validates quota.
   - Prompt is constructed and sent to `AIAdapter` (OpenAI/Mock).
   - AI response is parsed and validated.

4. **Response**:
   - Structured summary is returned to frontend.
   - `SummaryDisplay` component renders the result.
   - User can copy summary to clipboard.

#### Knowledge Generation Flow

1. **Wizard Step 1**:
   - User enters topic, selects document count (3-7).
   - Frontend validates input and calls `POST /api/ai/generate/knowledge-series`.

2. **Backend Task Creation**:
   - `AIApplicationService` creates a `KnowledgeGenerationTask` (status: PENDING).
   - Task UUID is returned to frontend.
   - Asynchronous generation process starts.

3. **Document Generation (Backend Background)**:
   - For each document (1 to N):
     - Generate content using AI prompt template.
     - Create `Document` entity via `DocumentApplicationService`.
     - Update task progress (progress = i / N \* 100).
     - Handle errors gracefully (mark doc as FAILED, continue).

4. **Progress Polling (Frontend)**:
   - Frontend polls `GET /api/ai/generate/knowledge-series/:taskId` every 2 seconds.
   - Progress bar updates in `KnowledgeGenerationWizard.vue`.

5. **Completion**:
   - When status = COMPLETED, frontend fetches generated documents.
   - User reviews documents in wizard step 3.
   - User can edit titles, discard unwanted docs, or save all to Knowledge Base.

6. **Save to Knowledge Base**:
   - Documents are already created during generation (in `/AI Generated/{topic}` folder).
   - User confirms and navigates to the folder to view results.

---

## 3. Integration Points

### 3.1 Epic 1 (AI Foundation)

- **AIGenerationService**: Reuse core AI generation logic and quota enforcement.
- **AIAdapter (OpenAI/Mock)**: Use existing adapters for LLM communication.
- **QuotaEnforcementService**: Enforce token limits for both summarization and knowledge generation.

### 3.2 Document/Repository Module

- **DocumentApplicationService**: Create and store generated knowledge documents.
- **Document Entity**: Store content, metadata, and folder structure.
- **Folder Structure**: Auto-create `/AI Generated/{topic}` folders if they don't exist.

### 3.3 Frontend Modules

- **`ai-chat` Module**: Potential future integration (e.g., "Summarize this conversation").
- **`document` Module**: Link to generated documents from Knowledge Base UI.
- **`goal` Module**: Potential integration (e.g., "Generate learning plan for goal X").

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Performance

- **Summarization Response Time**: P50 < 5s, P95 < 10s (for 5000-word texts).
- **Knowledge Generation**: Complete 5 documents in < 3 minutes (average 36s per doc).
- **Polling Interval**: 2-second interval for task status updates (balance between UX and server load).
- **Token Efficiency**: Aim for < 10,000 tokens per knowledge series (avg 2,000 tokens/doc).

### 4.2 Security

- **Authentication**: All endpoints require valid JWT.
- **Authorization**: Users can only access their own summarization/generation tasks.
- **Input Sanitization**: Validate text input length, prevent malicious prompts.
- **Rate Limiting**: Max 10 summarization requests/hour, 3 knowledge generation tasks/day per user.

### 4.3 Reliability

- **Quota Management**: Graceful handling of "Quota Exceeded" errors (429).
- **Partial Success**: If some documents fail in knowledge generation, mark them as FAILED but continue with others.
- **Task Persistence**: Store generation tasks in database to allow resumption after server restart (future enhancement).
- **Error Recovery**: Retry logic for transient AI API errors (max 3 retries with exponential backoff).

### 4.4 Usability

- **Progress Feedback**: Clear progress indicators for long-running operations.
- **Preview Before Save**: Users can review and edit generated content before final save.
- **Copy Functionality**: One-click copy for summaries and generated content.
- **Responsive Design**: Mobile-friendly UI for document summarization.

---

## 5. Technical Decisions & Tradeoffs

### 5.1 Synchronous vs Asynchronous Generation

**Decision**: Use **asynchronous background processing** for knowledge generation, **synchronous** for summarization.

**Rationale**:

- Summarization is quick (< 10s), users expect immediate results.
- Knowledge generation takes longer (2-3 minutes), asynchronous avoids timeout issues.
- Polling-based progress tracking provides good UX without WebSocket complexity.

**Tradeoffs**:

- Asynchronous requires task persistence and polling mechanism (added complexity).
- Synchronous is simpler but not suitable for long operations.

### 5.2 Storage Strategy for Generated Content

**Decision**: Store generated knowledge documents immediately in the Document module during generation, not after user confirmation.

**Rationale**:

- Simplifies backend logic (no need to buffer content in memory).
- Users can preview documents from the Knowledge Base directly.
- If user discards task, documents can be soft-deleted (standard Document deletion flow).

**Tradeoffs**:

- May create "orphaned" documents if user abandons wizard mid-way (mitigated by cleanup job).
- Users might find incomplete series in their folders during generation (acceptable UX).

### 5.3 Prompt Engineering Strategy

**Decision**: Use **fixed, well-tested prompt templates** for MVP, defer custom prompts to v1.2.

**Rationale**:

- Ensures consistent, high-quality output.
- Reduces complexity and testing burden.
- Custom prompts require advanced validation to prevent misuse.

**Tradeoffs**:

- Less flexibility for users with specific formatting needs.
- Template updates require code deployment (not configurable at runtime).

### 5.4 Input Length Limits

**Decision**: MVP limits summarization input to **50,000 characters** (~10,000 words), knowledge generation topics to **100 characters**.

**Rationale**:

- Balances token costs and response time.
- Most use cases (blog posts, articles) fit within this limit.
- Chunking for longer documents deferred to v1.2.

**Tradeoffs**:

- Cannot handle book-length texts or PDFs (future enhancement).
- Users must manually split very long documents.

---

## 6. Testing Strategy

### 6.1 Unit Tests

- **AIApplicationService**: Test quota validation, prompt construction, response parsing.
- **Composables** (`useDocumentSummarizer`, `useKnowledgeGeneration`): Test state management, error handling.
- **Prompt Templates**: Validate JSON parsing, edge cases (empty input, special chars).

### 6.2 Integration Tests

- **API Endpoints**: Test full request/response cycle with mock AI adapter.
- **Document Creation**: Verify integration with DocumentApplicationService.
- **Quota Enforcement**: Test quota exceeded scenarios.

### 6.3 E2E Tests

- **Summarization Flow**: Input text → Summarize → Copy result.
- **Knowledge Generation Flow**: Enter topic → Monitor progress → Review docs → Save.
- **Error Scenarios**: Network errors, quota exceeded, invalid input.

### 6.4 Performance Tests

- **Load Testing**: 100 concurrent summarization requests, measure P95 latency.
- **Token Usage**: Monitor average tokens per request, optimize prompts if needed.

---

## 7. Implementation Plan

### Phase 1: Story 4.1 - Document Summarization Backend (3 days)

**Tasks**:

1. Create `SummarizationRequestDTO` and `SummarizationResultDTO` in `@dailyuse/contracts`.
2. Implement `AIApplicationService.summarizeDocument()` method.
3. Design and test summarization prompt template.
4. Add `POST /api/ai/summarize` endpoint in `AIGenerationController`.
5. Write unit tests for prompt parsing and response validation.
6. Write integration tests with mock AI adapter.

**Deliverables**:

- Working API endpoint for summarization.
- 90% test coverage for backend logic.

### Phase 2: Story 4.2 - Document Summarization UI (2 days)

**Tasks**:

1. Create `DocumentSummarizer.vue` component with text input.
2. Implement `useDocumentSummarizer` composable.
3. Create `SummaryDisplay.vue` for structured output.
4. Add copy-to-clipboard functionality.
5. Integrate with backend API.
6. Write component tests.

**Deliverables**:

- Functional summarization tool in web app.
- User can paste text and get structured summary.

### Phase 3: Story 4.3 - Knowledge Generation Backend (5 days)

**Tasks**:

1. Create `KnowledgeGenerationTask` entity and repository.
2. Implement `AIApplicationService.generateKnowledgeSeries()` with async processing.
3. Design knowledge series prompt template.
4. Integrate with `DocumentApplicationService` for doc creation.
5. Add `POST /api/ai/generate/knowledge-series` and `GET /:taskId` endpoints.
6. Implement progress tracking and error handling.
7. Write unit and integration tests.

**Deliverables**:

- Working API for knowledge series generation.
- Documents auto-saved to Knowledge Base during generation.

### Phase 4: Story 4.4 - Knowledge Generation UI (4 days)

**Tasks**:

1. Create `KnowledgeGenerationWizard.vue` multi-step component.
2. Implement `useKnowledgeGeneration` composable with polling.
3. Create `KnowledgeDocumentCard.vue` for document preview.
4. Add progress bar and status indicators.
5. Integrate with backend API.
6. Write component and E2E tests.

**Deliverables**:

- Functional knowledge generation wizard.
- Users can create knowledge series and save to Knowledge Base.

---

## 8. Dependencies

| Dependency                    | Type         | Required For   | Notes                                        |
| :---------------------------- | :----------- | :------------- | :------------------------------------------- |
| Epic 1 (AI Foundation)        | **Critical** | Both Stories   | AIGenerationService, QuotaEnforcementService |
| Document/Repository Module    | **Critical** | Story 4.3, 4.4 | Document creation and storage                |
| OpenAI API                    | **Critical** | All Stories    | LLM for content generation                   |
| Pinia Store                   | **High**     | Story 4.2, 4.4 | State management for UI                      |
| Markdown Parser (markdown-it) | **Medium**   | Story 4.4      | Preview generated content                    |
| clipboard.js                  | **Low**      | Story 4.2      | Copy-to-clipboard feature                    |

---

## 9. Risks & Mitigation

| Risk                                 | Impact | Probability | Mitigation                                                                         |
| :----------------------------------- | :----- | :---------- | :--------------------------------------------------------------------------------- |
| **AI API Downtime**                  | High   | Medium      | Implement mock adapter for development, retry logic, graceful error messages       |
| **Quota Exceeded During Generation** | Medium | High        | Check quota before starting, provide clear error message, allow partial completion |
| **Generated Content Quality**        | High   | Medium      | Extensive prompt testing, user feedback loop, manual review option                 |
| **Long Generation Time**             | Medium | High        | Optimize prompts for efficiency, set realistic user expectations (progress bar)    |
| **User Abandons Wizard**             | Low    | High        | Cleanup job for orphaned documents (deletedAt timestamp), clear wizard timeout     |
| **Document Module Not Ready**        | High   | Low         | Document module already implemented (Story 7-1), low risk                          |

---

## 10. Success Metrics

### Functional Metrics

- **Summarization Accuracy**: User satisfaction score ≥ 80% (via in-app feedback).
- **Knowledge Series Completion Rate**: ≥ 85% of started tasks complete successfully.
- **Content Adoption Rate**: ≥ 70% of generated documents retained by users.

### Performance Metrics

- **Summarization Response Time**: P95 < 10 seconds.
- **Knowledge Generation Time**: P95 < 4 minutes for 5 documents.
- **API Availability**: 99.5% uptime (excluding AI API outages).

### Business Metrics

- **Daily Active Users**: 20% of DAU use summarization tool weekly.
- **Knowledge Series Created**: Average 2 series per active user per month.
- **Quota Utilization**: Average 30% of daily quota used for Epic 4 features.

---

## 11. Future Enhancements (Post-MVP)

### v1.1 (Q1 2026)

- **Multi-format Document Parsing**: Support PDF, DOCX, PPTX uploads.
- **Custom Summarization Styles**: Bullet points, paragraph, abstract, executive summary.
- **Batch Processing**: Summarize multiple documents in one request.

### v1.2 (Q2 2026)

- **Custom Prompt Templates**: Allow users to define their own summarization/generation prompts.
- **Knowledge Series Editing**: In-wizard editing of generated content before save.
- **AI-Assisted Expansion**: Users can ask AI to expand specific sections of generated docs.

### v1.3 (Q3 2026)

- **Multi-language Support**: Generate content in English, Chinese, Japanese, etc.
- **Integration with External Sources**: Pull data from Wikipedia, academic papers, etc.
- **Knowledge Graph Auto-linking**: Automatically create links between generated docs and existing content.

---

## 12. Glossary

| Term                  | Definition                                                                |
| :-------------------- | :------------------------------------------------------------------------ |
| **Core Summary**      | A concise 50-150 word paragraph capturing the main idea of the input text |
| **Key Points**        | 3-5 bullet points highlighting the most important information             |
| **Action Items**      | Practical, actionable suggestions derived from the content (0-3 items)    |
| **Knowledge Series**  | A collection of 3-7 interconnected documents on a single topic            |
| **Generation Task**   | An asynchronous background job for creating knowledge series              |
| **Compression Ratio** | Output length / Input length (measures summarization efficiency)          |
| **Orphaned Document** | A generated document not confirmed by the user (deleted via cleanup job)  |

---

## 13. References

- **Epic 1 Tech Spec**: `docs/sprint-artifacts/tech-spec-epic-1.md`
- **Epic 2 Tech Spec**: `docs/sprint-artifacts/tech-spec-epic-2.md`
- **Epic 3 Tech Spec**: `docs/sprint-artifacts/tech-spec-epic-3.md`
- **Document Module README**: `apps/api/src/modules/document/README.md`
- **Repository Module Design**: `docs/modules/repository/requirements/`
- **AI Domain Model**: `packages/domain-server/src/ai/`
- **OpenAI API Docs**: https://platform.openai.com/docs/guides/text-generation

---

**Document Status**: ✅ Draft Complete  
**Next Steps**:

1. Review with PM and Dev team
2. Update sprint-status.yaml: `epic-4: contexted`
3. Begin Story 4.1 drafting

**Created**: 2025-11-21  
**Author**: Spec Agent (AI Assistant)  
**Epic**: Epic 4 - Knowledge & Content Intelligence
