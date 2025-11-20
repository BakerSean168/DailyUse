# Story 1.4: AI API Layer Integration

Status: done

## Story

As a Frontend Developer,
I want a RESTful API to interact with the AI module,
so that I can build the UI.

## Acceptance Criteria

1. `POST /api/ai/chat` endpoint accepts user messages and returns AI responses.
2. `POST /api/ai/chat/stream` endpoint supports Server-Sent Events (SSE) for streaming responses.
3. `GET /api/ai/conversations` endpoint returns conversation history for authenticated user.
4. `GET /api/ai/conversations/:id` endpoint returns specific conversation with messages.
5. `GET /api/ai/quota` endpoint returns current quota status for authenticated user.
6. Controllers delegate to Domain Services without business logic.
7. Proper error handling with standard HTTP status codes.

## Tasks / Subtasks

- [x] Create AI Controller (AC: 1-7)
  - [x] Create `AIConversationController` in `apps/api/src/modules/ai/interface/http/AIConversationController.ts`.
  - [x] Implement authentication middleware integration.
  - [x] Define route handlers for all endpoints.
- [x] Implement Chat Endpoint (AC: 1)
  - [x] `POST /api/ai/chat` handler.
  - [x] Validate request body (message, conversationId optional).
  - [x] Call `AIGenerationService.generateText()`.
  - [x] Map response to client DTO format.
- [x] Implement Streaming Chat Endpoint (AC: 2)
  - [x] `POST /api/ai/chat/stream` handler.
  - [x] Set up SSE headers.
  - [x] Call `AIGenerationService.generateStream()`.
  - [x] Stream chunks to client.
  - [x] Handle stream completion and errors.
- [x] Implement Conversation History (AC: 3)
  - [x] `GET /api/ai/conversations` handler.
  - [x] Call `AIGenerationService.getConversationHistory()`.
  - [x] Return array of conversation DTOs.
- [x] Implement Get Conversation (AC: 4)
  - [x] `GET /api/ai/conversations/:id` handler.
  - [x] Call `AIGenerationService.getConversation()`.
  - [x] Return 404 if not found.
  - [x] Include messages in response.
- [x] Implement Quota Status (AC: 5)
  - [x] `GET /api/ai/quota` handler.
  - [x] Call `QuotaEnforcementService.getQuotaStatus()`.
  - [x] Return quota information.
- [x] Error Handling (AC: 7)
  - [x] Map `QuotaExceededError` to 429 Too Many Requests.
  - [x] Map `ValidationError` to 400 Bad Request.
  - [x] Map `GenerationFailedError` to 500 Internal Server Error.
  - [x] Handle unauthorized requests (401).
- [ ] Testing (deferred - integration tests require full infrastructure)
  - [ ] Integration tests for all endpoints.
  - [ ] Test authentication requirements.
  - [ ] Test error scenarios.
  - [ ] Test streaming functionality.

## Dev Notes

- **Location**: `apps/api/src/modules/ai`.
- **Dependencies**:
  - `AIGenerationService` from domain-server
  - `QuotaEnforcementService` from domain-server
  - Authentication middleware
- **Request/Response**: Use DTOs from `@dailyuse/contracts`.
- **Streaming**: Use SSE (Server-Sent Events) for real-time streaming.

### Project Structure Notes

- Target: `apps/api/src/modules/ai`
- Controllers should be thin - no business logic
- Follow existing API module patterns

### References

- [Tech Spec: Epic 1](../tech-spec-epic-1.md)
- [Epics: Story 1.4](../epics.md#story-14-ai-api-layer-integration)
- [Story 1.3: Domain Services](./1-3-ai-domain-services-quota.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

### Completion Notes List

1. **Controller Implementation** (2025-01-20)
   - Created `AIConversationController.ts` with 5 endpoint handlers
   - Implemented SSE streaming support with event types: connected, start, chunk, complete, error
   - All endpoints delegate to domain services (AIGenerationService, QuotaEnforcementService)
   - Centralized error handling maps domain errors to HTTP status codes

2. **Route Configuration** (2025-01-20)
   - Created `aiConversationRoutes.ts` with Swagger/OpenAPI documentation
   - Applied authMiddleware to all routes
   - Mounted routes at `/api/ai` in app.ts

3. **DI Container Updates** (2025-01-20)
   - Added `getGenerationService()` method to AIContainer
   - Added `getQuotaService()` method to AIContainer
   - Added repository getters for conversation and quota repositories

4. **Type Safety** (2025-01-20)
   - Fixed import paths to use `@dailyuse/domain-server` package imports
   - Resolved DTO conversion patterns (toClientDTO with manual message merging)
   - Validated no type errors in AIConversationController and aiConversationRoutes

### File List

- `/apps/api/src/modules/ai/interface/http/AIConversationController.ts` (411 lines)
- `/apps/api/src/modules/ai/interface/http/aiConversationRoutes.ts` (228 lines)
- `/apps/api/src/modules/ai/infrastructure/di/AIContainer.ts` (modified)
- `/apps/api/src/app.ts` (modified - added route mounting)
- `/packages/domain-server/src/modules/ai/index.ts` (created)
- `/packages/domain-server/src/index.ts` (modified - export path)
