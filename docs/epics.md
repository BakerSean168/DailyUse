# DailyUse - Epic Breakdown

**Author:** Sean
**Date:** 2025-11-19
**Project Level:** Production
**Target Scale:** Personal/Small Team

---

## Overview

This document provides the complete epic and story breakdown for DailyUse, decomposing the requirements from the [PRD](./AI_FEATURE_REQUIREMENTS.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

Based on the functional requirements and domain model, the work is divided into 4 epics:

1.  **Epic 1: AI Foundation & Quota Management**
    - Establishes the core AI infrastructure and quota system.
2.  **Epic 2: Intelligent Goal & Task Planning**
    - Implements the core planning assistance features (KR & Task generation).
3.  **Epic 3: AI Conversation Assistant**
    - Builds the interactive chat system and history management.
4.  **Epic 4: Knowledge & Content Intelligence**
    - Handles document summarization and knowledge base generation.

---

## Functional Requirements Inventory

### 核心功能 (MVP)

- **F-01: 生成 Goal 的 Key Results**
  - 用户输入 Goal 描述，AI 自动生成 3-5 个符合 SMART 原则的 Key Results。
- **F-02: 生成任务模板**
  - 基于 Key Result 自动生成 5-10 个可执行的任务模板，包含时间预估和优先级。
- **F-03: 文档摘要**
  - 上传或粘贴长文档，自动生成核心观点、关键信息和行动建议的摘要。
- **F-04: 智能对话助手**
  - 提供上下文感知的多轮对话，解答目标管理相关问题。
- **F-05: 使用配额管理**
  - 限制用户每日 AI 请求次数（默认 50 次），支持重置和超额处理。
- **F-06: 对话历史管理**
  - 保存用户与 AI 的对话记录，支持查询和归档。
- **F-07: 生成知识文档系列**
  - 基于目标主题生成系列知识文档（概述、指南、最佳实践等），并保存到知识库。

### 扩展功能 (后续迭代)

- **F-08: 多模型切换** (v1.1) - 支持 GPT/Claude 等不同模型。
- **F-09: 自定义 AI 提示词** (v1.2) - 允许用户调整 Prompt。
- **F-10: 批量生成** (v1.2) - 批量处理多个 Goal 或 KR。
- **F-11: 导出对话记录** (v1.3) - 导出为 Markdown/PDF。
- **F-12: 自定义文档模板** (v1.2) - 用户定义生成文档的结构。
- **F-13: 文档标签和分类自动推荐** (v1.3) - 智能分类和打标签。

---

## FR Coverage Map

- **Epic 1: AI Foundation & Quota Management**
  - Covers: **F-05** (Quota Management)
  - Supports: All other FRs (Infrastructure)
- **Epic 2: Intelligent Goal & Task Planning**
  - Covers: **F-01** (KR Generation), **F-02** (Task Generation)
- **Epic 3: AI Conversation Assistant**
  - Covers: **F-04** (Chat Assistant), **F-06** (History Management)
- **Epic 4: Knowledge & Content Intelligence**
  - Covers: **F-03** (Summary), **F-07** (Knowledge Generation)

---

## Epic 1: AI Foundation & DDD Architecture

**Goal:** Establish the core AI infrastructure following strict DDD patterns, ensuring a clean separation between Contracts, Domain Server, and API layers.

### Story 1.1: AI Domain Server Implementation

As a Backend Developer,
I want to implement the AI domain layer in `domain-server`,
So that the core business logic and state management are isolated and testable.

**Acceptance Criteria:**

**Given** The `contracts` definitions for AI
**When** I implement the `domain-server/src/ai` module
**Then** It must strictly follow the `goal` module structure (`aggregates`, `entities`, `repositories`, `value-objects`)
**And** `AIConversation` and `AIUsageQuota` aggregates are implemented
**And** In-memory or Prisma repositories are set up

**Prerequisites:** None

**Technical Notes:**

- Reference `packages/domain-server/src/goal` for directory structure.
- Implement `AIConversationServer` and `AIUsageQuotaServer`.
- Define Repository interfaces in `domain-server/src/ai/repositories`.

### Story 1.2: AI Infrastructure & Adapters

As a Developer,
I want to implement the AI adapters and infrastructure layer,
So that the domain services can interact with LLM providers without coupling.

**Acceptance Criteria:**

**Given** The `BaseAIAdapter` abstract class
**When** I implement `OpenAIAdapter` and `MockAIAdapter`
**Then** They should reside in `domain-server/src/ai/infrastructure/adapters`
**And** They should implement the standard generation interface

**Prerequisites:** Story 1.1

**Technical Notes:**

- Use Vercel AI SDK for `OpenAIAdapter`.
- Ensure `MockAIAdapter` is available for dev/test.

### Story 1.3: AI Domain Services & Quota

As a Product Owner,
I want to enforce usage quotas and orchestrate generation tasks,
So that we control costs and manage the generation lifecycle.

**Acceptance Criteria:**

**Given** A user request for AI generation
**When** The `AIGenerationService` processes it
**Then** It must check quotas via `QuotaEnforcementService`
**And** It must use the `AIAdapter` to generate content
**And** It must publish `GenerationCompletedEvent`

**Prerequisites:** Story 1.2

**Technical Notes:**

- Implement `AIGenerationService` and `QuotaEnforcementService` in `domain-server/src/ai/services`.
- Implement Quota logic (check, consume, reset).

### Story 1.4: AI API Layer Integration

As a Frontend Developer,
I want a RESTful API to interact with the AI module,
So that I can build the UI.

**Acceptance Criteria:**

**Given** The Domain Services are ready
**When** I call `POST /api/ai/chat` or `POST /api/ai/generate`
**Then** The API Controller should delegate to the Domain Service
**And** Return the standard DTOs defined in `contracts`

**Prerequisites:** Story 1.3

**Technical Notes:**

- Create Controllers in `apps/api/src/modules/ai`.
- **NO business logic** in controllers.
- Map Domain DTOs to HTTP responses.

---

## Epic 2: Intelligent Goal & Task Planning

**Goal:** Assist users in breaking down goals and planning tasks using AI.

### Story 2.1: Generate Key Results Backend

As a User,
I want to get AI suggestions for Key Results,
So that I can define my goals more effectively.

**Acceptance Criteria:**

**Given** A Goal description
**When** I call the generation endpoint
**Then** The AI returns 3-5 SMART Key Results
**And** Each KR has a title, target value, and unit

**Prerequisites:** Epic 1

**Technical Notes:**

- Endpoint: `POST /api/ai/generate/key-results`
- Prompt should emphasize SMART criteria.
- Return JSON structure.

### Story 2.2: Generate Key Results UI

As a User,
I want to see and select generated Key Results in the Goal form,
So that I can quickly populate my goal.

**Acceptance Criteria:**

**Given** I am on the Goal creation page
**When** I click "AI Generate"
**Then** I see a loading indicator
**And** The generated KRs appear
**And** I can select which ones to add to my Goal

**Prerequisites:** Story 2.1

**Technical Notes:**

- Add "Magic" icon button next to KR section.
- Allow editing generated text before adding.

### Story 2.3: Generate Task Templates Backend

As a User,
I want to get task suggestions for a Key Result,
So that I can start executing immediately.

**Acceptance Criteria:**

**Given** A Key Result
**When** I request task generation
**Then** The AI returns 5-10 actionable tasks
**And** Tasks include title, estimated time, and priority

**Prerequisites:** Epic 1

**Technical Notes:**

- Endpoint: `POST /api/ai/generate/tasks`
- Input: KR title + Goal context.

### Story 2.4: Generate Task Templates UI

As a User,
I want to generate and import tasks into my plan,
So that I save time on planning.

**Acceptance Criteria:**

**Given** I am viewing a Key Result
**When** I choose "Generate Tasks"
**Then** A list of suggested tasks appears
**And** I can check/uncheck tasks
**And** Clicking "Import" adds them to the system

**Prerequisites:** Story 2.3

**Technical Notes:**

- Modal or drawer for the generation result.
- Bulk create operation for selected tasks.

---

## Epic 3: AI Conversation Assistant

**Goal:** Provide an interactive chat interface for goal management advice.

### Story 3.1: Conversation & Message Management Backend

As a User,
I want my chat history to be saved,
So that I can review past advice.

**Acceptance Criteria:**

**Given** A user starts a chat
**When** They send a message
**Then** A new `AIConversation` is created (if needed)
**And** The `Message` is saved to the database

**Prerequisites:** Epic 1

**Technical Notes:**

- Entities: `AIConversation`, `Message`.
- API: `GET /api/ai/conversations`, `GET /api/ai/conversations/:id`.

### Story 3.2: Chat Stream Backend

As a User,
I want to see the AI's response as it types,
So that I don't have to wait for the full answer.

**Acceptance Criteria:**

**Given** I send a message
**When** The server processes it
**Then** The response is streamed back via SSE
**And** The full response is saved to DB after completion

**Prerequisites:** Story 3.1

**Technical Notes:**

- Use Server-Sent Events (SSE).
- Endpoint: `POST /api/ai/chat/stream`.

### Story 3.3: Chat Interface UI

As a User,
I want a chat interface to talk to the AI,
So that I can ask questions naturally.

**Acceptance Criteria:**

**Given** I open the AI Assistant
**When** I type and send a message
**Then** It appears immediately in the list
**And** The AI response streams in real-time

**Prerequisites:** Story 3.2

**Technical Notes:**

- Floating action button or dedicated sidebar.
- Auto-scroll to bottom.
- Markdown rendering for AI response.

### Story 3.4: Conversation History UI

As a User,
I want to switch between conversations,
So that I can manage different topics.

**Acceptance Criteria:**

**Given** I have past conversations
**When** I view the history list
**Then** I can click one to load its messages
**And** I can start a new chat

**Prerequisites:** Story 3.1

**Technical Notes:**

- Sidebar list of conversations (Title + Date).

---

## Epic 4: Knowledge & Content Intelligence

**Goal:** Leverage AI to generate and summarize knowledge content.

### Story 4.1: Document Summarization Backend

As a User,
I want to summarize long texts,
So that I can get the key points quickly.

**Acceptance Criteria:**

**Given** A text block or document
**When** I request a summary
**Then** The AI returns a structured summary (Core, Key Points, Actions)

**Prerequisites:** Epic 1

**Technical Notes:**

- Endpoint: `POST /api/ai/summarize`.
- Handle input limits (chunking if necessary, but MVP can limit size).

### Story 4.2: Document Summarization UI

As a User,
I want to use the summarization tool,
So that I can process information faster.

**Acceptance Criteria:**

**Given** I have text in the clipboard or a file
**When** I paste it into the tool
**Then** I get a formatted summary
**And** I can copy it

**Prerequisites:** Story 4.1

**Technical Notes:**

- Simple input/output UI.
- "Copy to Clipboard" button.

### Story 4.3: Knowledge Generation Backend

As a User,
I want to generate a series of knowledge docs,
So that I can learn about a topic systematically.

**Acceptance Criteria:**

**Given** A topic (e.g., "Weight Loss")
**When** I trigger generation
**Then** The AI generates 3-5 distinct documents
**And** They are saved to the Knowledge Base

**Prerequisites:** Epic 1

**Technical Notes:**

- Complex prompt chain or single complex prompt.
- Integration with Knowledge Base module (create articles).

### Story 4.4: Knowledge Generation UI

As a User,
I want to easily create a knowledge library,
So that I can support my goals.

**Acceptance Criteria:**

**Given** I am in the Knowledge module
**When** I choose "AI Generate Series"
**Then** I enter a topic
**And** I see the progress of generation
**And** The new docs appear in my list

**Prerequisites:** Story 4.3

**Technical Notes:**

- Wizard UI.
- Progress bar (since it might take time).

---

---

## FR Coverage Matrix

| FR ID    | Requirement              | Epic   | Stories       |
| -------- | ------------------------ | ------ | ------------- |
| **F-01** | 生成 Goal 的 Key Results | Epic 2 | 2.1, 2.2      |
| **F-02** | 生成任务模板             | Epic 2 | 2.3, 2.4      |
| **F-03** | 文档摘要                 | Epic 4 | 4.1, 4.2      |
| **F-04** | 智能对话助手             | Epic 3 | 3.1, 3.2, 3.3 |
| **F-05** | 使用配额管理             | Epic 1 | 1.1, 1.2      |
| **F-06** | 对话历史管理             | Epic 3 | 3.1, 3.4      |
| **F-07** | 生成知识文档系列         | Epic 4 | 4.3, 4.4      |

---

## Summary

The breakdown consists of **4 Epics** and **15 Stories**.

- **Epic 1** lays the technical foundation and implements the quota system.
- **Epic 2** delivers the core planning value (KR and Task generation).
- **Epic 3** adds the conversational interface and history management.
- **Epic 4** adds content intelligence features (Summarization and Knowledge Generation).

All MVP functional requirements are covered by specific stories. The stories are vertically sliced where possible, but backend/frontend separation is used in some cases to allow parallel development or clearer separation of concerns.

**Next Steps:**

1.  **UX Design:** Add interaction details to UI stories.
2.  **Architecture:** Add technical implementation details to Backend stories.
3.  **Implementation:** Execute stories in order.

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after UX Design and Architecture workflows to incorporate interaction details and technical decisions._
