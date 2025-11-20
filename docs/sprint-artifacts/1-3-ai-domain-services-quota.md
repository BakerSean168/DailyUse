# Story 1.3: AI Domain Services & Quota

Status: done

## Story

As a Product Owner,
I want to enforce usage quotas and orchestrate generation tasks,
so that we control costs and manage the generation lifecycle.

## Acceptance Criteria

1. `QuotaEnforcementService` checks quota availability before AI generation.
2. `AIGenerationService` orchestrates the complete generation workflow (check quota → call adapter → record usage → publish events).
3. Quota consumption is recorded when generation completes successfully.
4. `GenerationCompletedEvent` is published after successful generation.
5. Quota reset mechanism is implemented (manual or scheduled).

## Tasks / Subtasks

- [x] Implement QuotaEnforcementService (AC: 1)
  - [x] Create `QuotaEnforcementService` in `domain/services/QuotaEnforcementService.ts`.
  - [x] Implement `checkQuota(userId: string): Promise<boolean>` method.
  - [x] Implement `consumeQuota(userId: string, tokensUsed: number): Promise<void>` method.
  - [x] Integrate with `AIUsageQuotaRepository`.
- [x] Implement AIGenerationService (AC: 2)
  - [x] Create `AIGenerationService` in `domain/services/AIGenerationService.ts`.
  - [x] Implement generation workflow orchestration.
  - [x] Validate generation input before processing.
  - [x] Call `QuotaEnforcementService` before generation.
  - [x] Invoke `AIAdapter` via factory.
  - [x] Handle generation errors and quota rollback.
- [x] Implement Quota Recording (AC: 3)
  - [x] Call `consumeQuota` after successful generation.
  - [x] Update `AIUsageQuotaServer` aggregate with token counts.
  - [x] Persist quota changes via repository.
- [x] Implement Event Publishing (AC: 4)
  - [x] Define `GenerationCompletedEvent` in domain events.
  - [x] Publish event after successful generation.
  - [x] Include generation metadata (conversationId, tokensUsed, etc.).
- [x] Implement Quota Reset (AC: 5)
  - [x] Create reset mechanism in `QuotaEnforcementService`.
  - [x] Implement `resetQuota(userId: string): Promise<void>` method.
  - [x] Support manual reset (admin action).
  - [x] Design scheduled reset (daily/weekly/monthly).
- [x] Testing
  - [x] Unit tests for `QuotaEnforcementService`.
  - [x] Unit tests for `AIGenerationService`.
  - [x] Integration tests for quota workflow (check → consume → reset).
  - [x] Test error scenarios (quota exceeded, adapter failures).

## Dev Notes

- **Location**: `packages/domain-server/src/modules/ai/domain/services`.
- **Dependencies**:
  - `AIUsageQuotaRepository`
  - `AIConversationRepository`
  - `AIAdapterFactory`
  - Domain events from `@dailyuse/contracts`
- **Event Publishing**: Use domain event mechanism from `AggregateRoot` base class.
- **Error Handling**: Define custom errors (`QuotaExceededError`, `GenerationFailedError`).

### Project Structure Notes

- Target: `packages/domain-server/src/modules/ai/domain/services`
- Related: `packages/domain-server/src/modules/ai/domain/aggregates` (AIUsageQuotaServer)

### References

- [Tech Spec: Epic 1](../tech-spec-epic-1.md)
- [Epics: Story 1.3](../epics.md#story-13-ai-domain-services-quota)
- [Story 1.1: Domain Implementation](./1-1-ai-domain-server-implementation.md)
- [Story 1.2: Infrastructure Adapters](./1-2-ai-infrastructure-adapters.md)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

### Completion Notes List

### File List
