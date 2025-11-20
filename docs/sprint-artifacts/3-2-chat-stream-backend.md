# Story 3.2: Chat Stream Backend

Status: drafted

## Story

As a User,
I want to see the AI's response as it types,
So that I don't have to wait for the full answer.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: `POST /api/ai/chat/stream` accepts user message and conversation ID
2. **AC-2**: Response is streamed using Server-Sent Events (SSE)
3. **AC-3**: Stream events include `chunk` (content), `done`, and `error`
4. **AC-4**: User message is saved to DB immediately
5. **AC-5**: AI response is saved to DB after stream completes
6. **AC-6**: Quota is checked before generation starts
7. **AC-7**: Quota is consumed upon successful completion
8. **AC-8**: Context window (last N messages) is sent to LLM

### Technical Criteria

9. **AC-9**: Uses `SSEManager` or standard Express SSE pattern
10. **AC-10**: Integrates with `AIAdapter` (OpenAI/Mock)
11. **AC-11**: Handles stream interruptions gracefully
12. **AC-12**: Unit tests for streaming service logic

## Tasks / Subtasks

- [ ] **Task 1**: Implement Streaming Service Method (AC: 2, 3, 8, 10)
  - [ ] Add `generateStream(conversationId, message)` to `AIGenerationService`
  - [ ] Retrieve conversation history (last 10 messages)
  - [ ] Call `AIAdapter.generateStream(prompt, history)`
  - [ ] Return async iterator or event emitter

- [ ] **Task 2**: Implement SSE Controller Endpoint (AC: 1, 9)
  - [ ] Create `POST /api/ai/chat/stream` in `AIConversationController`
  - [ ] Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
  - [ ] Connect service stream to response
  - [ ] Format events: `data: { type: 'chunk', content: '...' }\n\n`

- [ ] **Task 3**: Integrate Persistence & Quota (AC: 4, 5, 6, 7)
  - [ ] In `generateStream`:
    - [ ] Check quota via `QuotaEnforcementService`
    - [ ] Save user message via `AIConversationService.addMessage`
  - [ ] On stream completion:
    - [ ] Save assistant message via `AIConversationService.addMessage`
    - [ ] Consume quota via `QuotaEnforcementService`

- [ ] **Task 4**: Handle Errors & Interruption (AC: 11)
  - [ ] Handle client disconnect (close stream)
  - [ ] Handle LLM errors (send error event to client)
  - [ ] Ensure partial response is saved if stream breaks (optional/nice-to-have)

- [ ] **Task 5**: Update Mock Adapter (AC: 10)
  - [ ] Ensure `MockAIAdapter` supports streaming (simulate typewriter effect)

- [ ] **Task 6**: Integration Tests (AC: 12)
  - [ ] Test SSE endpoint with `supertest` or custom client
  - [ ] Verify DB state after stream

## Dev Notes

### Technical Context

- **Location**: `apps/api/src/modules/ai`
- **Dependencies**: `vercel-ai-sdk` (optional, or direct OpenAI), `express`

### Architecture Alignment

- **SSE Pattern**: Use standard SSE format.
- **Quota**: Reuse `QuotaEnforcementService` from Epic 1.

### Learnings from Previous Stories

**From Story 1.3 (AI Domain Services):**

- **Quota**: Ensure quota check happens _before_ calling the expensive LLM API.
- **Adapter**: The `AIAdapter` interface should already support or be extended for streaming.

### References

- [Tech Spec: Epic 3](./tech-spec-epic-3.md)
- [Epic 1: AI Foundation](./1-3-ai-domain-services-quota.md)
