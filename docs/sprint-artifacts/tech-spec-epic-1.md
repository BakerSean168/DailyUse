# Epic Technical Specification: AI Foundation & Quota Management

Date: 2025-11-19
Author: Sean
Epic ID: 1
Status: Draft

---

## Overview

This epic establishes the foundational infrastructure for all AI features in DailyUse. It focuses on creating a robust, provider-agnostic AI service layer and a quota management system to control costs and usage. This foundation will support subsequent epics (Goal Planning, Chat, Knowledge) by providing a unified interface for LLM interactions and enforcing usage limits.

## Objectives and Scope

**In-Scope:**

- **AI Service Layer**: Implementation of `AIGenerationService` and `BaseAIAdapter` pattern.
- **Provider Integration**: Integration with OpenAI (via Vercel AI SDK) and a Mock provider for local development.
- **Quota Management**: Database schema for `AIUsageQuota`, `QuotaEnforcementService` logic, and daily reset mechanism.
- **Event System**: Publishing `QuotaExceededEvent` and `GenerationCompletedEvent`.
- **Configuration**: Environment variable management for API keys and feature flags.

**Out-of-Scope:**

- **User Interface**: No frontend UI components (Chat UI, Goal Generation UI) are included in this epic.
- **Specific Feature Logic**: Business logic for generating KRs, Tasks, or Summaries (belongs to Epics 2 & 4).
- **Billing/Payment**: Integration with payment gateways for quota upgrades.

## System Architecture Alignment

This epic aligns with the **Application Layer** and **Infrastructure Layer** of the API Backend architecture.

- **Infrastructure**: Adds `AIAdapter` implementations (OpenAI, Mock) in `apps/api/src/modules/ai/infrastructure/adapters`.
- **Domain**: Adds `AIUsageQuota` entity and `QuotaEnforcementService` domain service.
- **Shared**: Defines DTOs and Interfaces in `@dailyuse/contracts`.
- **Database**: Extends Prisma schema with `AIUsageQuota` and `user_settings` updates.

## Detailed Design

### Module Structure (DDD)

The AI module will strictly follow the `goal` module pattern in `packages/domain-server`:

```
packages/domain-server/src/modules/ai/
├── aggregates/          # Aggregate Roots (AIConversation, AIUsageQuota)
├── entities/            # Entities (Message, AIGenerationTask)
├── value-objects/       # Value Objects (GenerationInput, TokenUsage)
├── repositories/        # Repository Interfaces (IAIConversationRepository)
├── services/            # Domain Services (AIGenerationService, QuotaService)
├── infrastructure/      # Infrastructure Implementations
│   ├── adapters/        # AI Adapters (OpenAI, Mock)
│   └── repositories/    # Prisma Repository Implementations
└── events/              # Domain Events (GenerationCompleted, QuotaExceeded)
```

### Services and Modules

| Service/Module              | Responsibility                                      | Layer           |
| :-------------------------- | :-------------------------------------------------- | :-------------- |
| **AIGenerationService**     | Orchestrates AI requests, checks quota, logs usage. | Domain Service  |
| **QuotaEnforcementService** | Manages user quotas, checks limits, resets daily.   | Domain Service  |
| **OpenAIAdapter**           | Implements `BaseAIAdapter` for OpenAI API.          | Infrastructure  |
| **MockAIAdapter**           | Simulates AI responses for dev/test environments.   | Infrastructure  |
| **AIController**            | Handles HTTP requests and delegates to Services.    | API (Interface) |

### Data Models and Contracts

**Prisma Schema (`schema.prisma`):**

```prisma
model AIUsageQuota {
  id        String   @id @default(uuid())
  userId    String   @map("user_id") @db.Uuid
  limit     Int      @default(50)
  used      Int      @default(0)
  resetAt   DateTime @map("reset_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([userId])
  @@map("ai_usage_quotas")
}

// Extension to user_settings
model user_settings {
  // ... existing fields
  ai_provider String? @default("openai")
  ai_model    String? @default("gpt-4")
}
```

**DTOs (`@dailyuse/contracts`):**

Already defined in `packages/contracts/src/modules/ai`.

### APIs and Interfaces

**Internal Interface (`BaseAIAdapter`):**

```typescript
abstract class BaseAIAdapter {
  abstract generateText(prompt: string, options?: AIRequestOptions): Promise<AIResponseDTO>;
  abstract generateStream(prompt: string, callback: StreamCallback): Promise<void>;
}
```

**Internal Interface (`QuotaEnforcementService`):**

```typescript
interface IQuotaEnforcementService {
  checkQuota(userId: string): Promise<boolean>;
  consumeQuota(userId: string, count?: number): Promise<void>;
  resetQuota(userId: string): Promise<void>;
}
```

### Workflows and Sequencing

**AI Request Flow:**

1.  **API Layer**: `AIController` receives request -> calls `AIGenerationService`.
2.  **Domain Layer**: `AIGenerationService` calls `QuotaEnforcementService.checkQuota(userId)`.
3.  **Domain Layer**: If quota exceeded -> throw `QuotaExceededError`.
4.  **Domain Layer**: If valid -> `AIGenerationService` calls `AIAdapter.generateText()`.
5.  **Domain Layer**: On success -> `QuotaEnforcementService.consumeQuota(userId)`.
6.  **Domain Layer**: `AIGenerationService` emits `GenerationCompletedEvent`.
7.  **API Layer**: Return response.

## Non-Functional Requirements

### Performance

- **Latency**: AI Adapter timeout set to **10 seconds** for non-streaming requests.
- **Overhead**: Quota check overhead < **10ms**.

### Security

- **API Keys**: `OPENAI_API_KEY` stored in `.env` only, never committed.
- **Isolation**: Users can only consume their own quota.

### Reliability/Availability

- **Fallback**: If OpenAI fails, service should throw structured error (no silent failure).
- **Dev Mode**: Use `MockAIAdapter` when `NODE_ENV=development` to save costs and ensure offline capability.

### Observability

- **Logging**: Log every AI request (without sensitive content) with `userId`, `tokens`, `duration`.
- **Metrics**: Track `ai_requests_total`, `ai_quota_exceeded_total`.

## Dependencies and Integrations

- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`): For standardized LLM interaction.
- **Prisma**: For database persistence.
- **Node-Cron**: For daily quota reset scheduling.
- **Zod**: For DTO validation.

## Acceptance Criteria (Authoritative)

**Story 1.1: AI Service Infrastructure Setup**

1.  `AIGenerationService` class is defined and injectable.
2.  `AIUsageQuota` table exists in database with correct fields.
3.  Event Bus successfully publishes `GenerationCompletedEvent`.

**Story 1.2: Quota Enforcement Service**

1.  `checkQuota` returns `true` if `used < limit`.
2.  `checkQuota` returns `false` (or throws) if `used >= limit`.
3.  `consumeQuota` increments `used` count atomically.
4.  Cron job resets `used` to 0 for all users at 00:00 daily.

**Story 1.3: AI Provider Integration**

1.  Service can successfully call OpenAI API with valid key.
2.  Service uses `MockAIAdapter` when configured (or in test).
3.  Service handles API timeouts (10s) gracefully.
4.  Response format matches `AIResponseDTO`.

## Traceability Mapping

| Acceptance Criteria   | Spec Section    | Component                 | Test Idea                               |
| :-------------------- | :-------------- | :------------------------ | :-------------------------------------- |
| 1.1.1 Service Defined | Detailed Design | `AIGenerationService`     | Unit test service instantiation         |
| 1.1.2 DB Schema       | Data Models     | Prisma Schema             | Check DB migration file                 |
| 1.2.1 Quota Check     | Detailed Design | `QuotaEnforcementService` | Unit test with used=49, limit=50        |
| 1.2.4 Cron Reset      | Detailed Design | `QuotaScheduler`          | Integration test triggering cron job    |
| 1.3.1 OpenAI Call     | Detailed Design | `OpenAIAdapter`           | Integration test with live key (or VCR) |
| 1.3.2 Mock Adapter    | Detailed Design | `MockAIAdapter`           | Unit test verifying mock response       |

## Risks, Assumptions, Open Questions

- **Risk**: OpenAI API latency can be unpredictable. **Mitigation**: Implement client-side timeout and loading states (in future UI epics).
- **Assumption**: Daily quota reset at 00:00 server time is acceptable for all time zones initially.
- **Question**: Do we need per-model quotas (e.g., GPT-4 vs GPT-3.5)? **Decision**: MVP uses single request count for simplicity.

## Test Strategy Summary

- **Unit Tests**: Test `QuotaEnforcementService` logic (boundary values), `MockAIAdapter`.
- **Integration Tests**: Test `AIGenerationService` flow with database (Prisma) and Mock adapter.
- **Manual Verification**: Verify OpenAI connectivity with a script using the actual API key.
