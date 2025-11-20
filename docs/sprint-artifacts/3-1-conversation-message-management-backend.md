# Story 3.1: Conversation & Message Management Backend

Status: ready-for-dev

## Story

As a User,
I want my chat history to be saved,
So that I can review past advice.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Database schema supports `AIConversation` and `Message` entities
2. **AC-2**: `POST /api/ai/conversations` creates a new conversation
3. **AC-3**: `GET /api/ai/conversations` returns paginated list of conversations (summary)
4. **AC-4**: `GET /api/ai/conversations/:id` returns full conversation details with messages
5. **AC-5**: `DELETE /api/ai/conversations/:id` soft deletes conversation and messages
6. **AC-6**: Messages have roles: 'user', 'assistant', 'system'
7. **AC-7**: Conversations belong to a specific account (multi-tenancy)
8. **AC-8**: Conversation title is auto-generated or default "New Chat"

### Technical Criteria

9. **AC-9**: Implemented in `domain-server` (aggregates/repositories)
10. **AC-10**: Exposed via `apps/api` controllers
11. **AC-11**: Uses Prisma for persistence
12. **AC-12**: Unit tests for Domain Service
13. **AC-13**: Integration tests for API endpoints

## Tasks / Subtasks

- [ ] **Task 1**: Define Domain Entities & Value Objects (AC: 1, 6)
  - [ ] Create `AIConversation` aggregate in `packages/domain-server/src/ai/domain/aggregates`
  - [ ] Create `Message` entity in `packages/domain-server/src/ai/domain/entities`
  - [ ] Define `MessageRole` value object/enum ('user', 'assistant', 'system')
  - [ ] Update `packages/contracts` with DTOs (`AIConversationDto`, `MessageDto`, `CreateConversationDto`)

- [ ] **Task 2**: Update Prisma Schema (AC: 1, 7)
  - [ ] Add `AIConversation` model to `apps/api/prisma/schema.prisma`
  - [ ] Add `Message` model to `apps/api/prisma/schema.prisma`
  - [ ] Define relation: Account -> AIConversations -> Messages
  - [ ] Run migration `pnpm prisma migrate dev --name add_ai_conversation`

- [ ] **Task 3**: Implement Repositories (AC: 9, 11)
  - [ ] Create `IAIConversationRepository` interface in `domain-server`
  - [ ] Implement `PrismaAIConversationRepository` in `apps/api/src/modules/ai/infrastructure/repositories`
  - [ ] Implement methods: `save`, `findById`, `findAllByAccount`, `delete`

- [ ] **Task 4**: Implement Domain Service (AC: 9, 12)
  - [ ] Create `AIConversationService` in `domain-server`
  - [ ] Implement `createConversation(accountUuid, title?)`
  - [ ] Implement `getConversation(id)`
  - [ ] Implement `listConversations(accountUuid, page, limit)`
  - [ ] Implement `deleteConversation(id)`
  - [ ] Implement `addMessage(conversationId, role, content)`
  - [ ] Write unit tests for `AIConversationService`

- [ ] **Task 5**: Implement API Controller (AC: 2-5, 10)
  - [ ] Create `AIConversationController` in `apps/api/src/modules/ai/interface`
  - [ ] Map HTTP requests to Domain Service calls
  - [ ] Handle DTO mapping and validation
  - [ ] Register routes in `apps/api/src/modules/ai/ai.routes.ts`

- [ ] **Task 6**: Integration Tests (AC: 13)
  - [ ] Create `apps/api/test/integration/ai/conversation.test.ts`
  - [ ] Test full CRUD lifecycle via API
  - [ ] Verify account isolation (cannot access other's conversations)

## Dev Notes

### Technical Context

- **Location**:
  - Domain: `packages/domain-server/src/ai`
  - API: `apps/api/src/modules/ai`
  - Contracts: `packages/contracts/src/ai`

- **Dependencies**:
  - Prisma Client
  - Express
  - Zod (validation)

### Architecture Alignment

- **DDD Layers**:
  - Domain: `AIConversation`, `Message`, `AIConversationService`
  - Infrastructure: `PrismaAIConversationRepository`
  - Interface: `AIConversationController`

### Learnings from Previous Stories

**From Story 2.4 (Frontend) & 1.1 (Backend Foundation):**

- **Backend Pattern**: Follow the structure established in Story 1.1 (`AIUsageQuota`).
- **Repository Pattern**: Use the standard repository interface pattern used in `Goal` and `Task` modules.
- **DTOs**: Ensure DTOs in `contracts` match the frontend needs (Story 3.3/3.4 will use them).

### References

- [Tech Spec: Epic 3](./tech-spec-epic-3.md)
- [Architecture: API](../architecture-api.md)
