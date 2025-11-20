# Story 1.2: AI Infrastructure & Adapters

Status: done

## Story

As a Developer,
I want to implement the AI adapters and infrastructure layer,
so that the domain services can interact with LLM providers without coupling.

## Acceptance Criteria

1. `BaseAIAdapter` abstract class is defined in `infrastructure/adapters/BaseAIAdapter.ts`.
2. `OpenAIAdapter` is implemented using Vercel AI SDK in `infrastructure/adapters/OpenAIAdapter.ts`.
3. `MockAIAdapter` is implemented for local development in `infrastructure/adapters/MockAIAdapter.ts`.
4. Adapters implement the standard generation interface (text and stream).
5. `AIAdapterFactory` or similar mechanism exists to select adapter based on config.

## Tasks / Subtasks

- [x] Define Base Adapter (AC: 1)
  - [x] Create `BaseAIAdapter` abstract class with `generateText` and `generateStream` methods.
- [x] Implement OpenAI Adapter (AC: 2)
  - [x] Install `@ai-sdk/openai` and `ai` packages.
  - [x] Implement `OpenAIAdapter` class.
  - [x] Map Vercel AI SDK response to `AIResponseDTO`.
- [x] Implement Mock Adapter (AC: 3)
  - [x] Implement `MockAIAdapter` class.
  - [x] Return simulated responses for testing.
- [x] Implement Adapter Factory (AC: 5)
  - [x] Create `AIAdapterFactory` to instantiate the correct adapter based on `process.env.AI_PROVIDER`.
- [x] Testing (AC: 4)
  - [x] Unit tests for `MockAIAdapter`.
  - [x] Integration tests for `OpenAIAdapter` (mocked network calls).

## Dev Notes

- **Location**: `packages/domain-server/src/modules/ai/infrastructure/adapters`.
- **Dependencies**: `ai`, `@ai-sdk/openai`.
- **Configuration**: Use `process.env.AI_API_KEY` and `process.env.AI_PROVIDER`.

### Project Structure Notes

- Target: `packages/domain-server/src/modules/ai/infrastructure`

### References

- [Tech Spec: Epic 1](../tech-spec-epic-1.md)
- [Epics: Story 1.2](../epics.md#story-12-ai-infrastructure-adapters)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Gemini 3 Pro (Preview)

### Debug Log References

### Completion Notes List

### File List
