# Story 1.1: AI Domain Server Implementation

Status: review

## Story

As a Backend Developer,
I want to implement the AI domain layer in `domain-server`,
so that the core business logic and state management are isolated and testable.

## Acceptance Criteria

1. `packages/domain-server/src/modules/ai` directory structure matches `goal` module.
2. `AIConversation` Aggregate Root is implemented in `aggregates/AIConversationServer.ts`.
3. `AIUsageQuota` Aggregate Root is implemented in `aggregates/AIUsageQuotaServer.ts`.
4. `Message` Entity is implemented in `entities/MessageServer.ts`.
5. Repository interfaces are defined in `repositories/`.
6. Value Objects are implemented in `value-objects/`.

## Tasks / Subtasks

- [x] Setup Directory Structure (AC: 1)
  - [x] Create `aggregates`, `entities`, `events`, `infrastructure`, `repositories`, `services`, `value-objects` folders in `packages/domain-server/src/modules/ai`.
- [x] Implement Aggregates (AC: 2, 3)
  - [x] Implement `AIConversationServer` class implementing `contracts` interface.
  - [x] Implement `AIUsageQuotaServer` class implementing `contracts` interface.
- [x] Implement Entities (AC: 4)
  - [x] Implement `MessageServer` class.
- [x] Define Repositories (AC: 5)
  - [x] Create `IAIConversationRepository` interface.
  - [x] Create `IAIUsageQuotaRepository` interface.
- [x] Implement Value Objects (AC: 6)
  - [x] Implement `GenerationInput` and `TokenUsage` if needed (or use contracts).

## Dev Notes

- **Strict DDD**: Do not put business logic in services if it belongs in the Aggregate.
- **Reference**: Use `packages/domain-server/src/modules/goal` as the gold standard.
- **Contracts**: All interfaces are already defined in `packages/contracts/src/modules/ai`.

### Project Structure Notes

- Target: `packages/domain-server/src/modules/ai`
- Source: `packages/contracts/src/modules/ai`

### References

- [Tech Spec: Epic 1](../tech-spec-epic-1.md)
- [Epics: Story 1.1](../epics.md#story-11-ai-domain-server-implementation)
- [Architecture: API Backend](../architecture-api.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Gemini 3 Pro (Preview)

### Debug Log References

- Implemented strict DDD structure in `packages/domain-server/src/modules/ai`.
- Created Aggregates: `AIConversationServer`, `AIUsageQuotaServer`.
- Created Entity: `MessageServer`.
- Created Value Objects: `GenerationInput`, `TokenUsage`.
- Defined Repository Interfaces.
- Added Unit Tests for Aggregates.

### Completion Notes List

- All ACs met.
- Unit tests passed.
- Directory structure matches `goal` module.

### File List

- packages/domain-server/src/modules/ai/aggregates/AIConversationServer.ts
- packages/domain-server/src/modules/ai/aggregates/AIUsageQuotaServer.ts
- packages/domain-server/src/modules/ai/entities/MessageServer.ts
- packages/domain-server/src/modules/ai/repositories/IAIConversationRepository.ts
- packages/domain-server/src/modules/ai/repositories/IAIUsageQuotaRepository.ts
- packages/domain-server/src/modules/ai/value-objects/GenerationInput.ts
- packages/domain-server/src/modules/ai/value-objects/TokenUsage.ts
- packages/domain-server/src/modules/ai/aggregates/**tests**/AIConversationServer.spec.ts
- packages/domain-server/src/modules/ai/aggregates/**tests**/AIUsageQuotaServer.spec.ts
