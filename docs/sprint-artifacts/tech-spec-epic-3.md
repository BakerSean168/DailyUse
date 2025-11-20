# Technical Specification: Epic 3 - AI Conversation Assistant

> **Epic**: Epic 3 - AI Conversation Assistant  
> **Author**: GitHub Copilot (Agent)  
> **Date**: 2025-11-20  
> **Status**: Draft  
> **Version**: 1.0

---

## 1. Overview

### 1.1 Scope

This epic focuses on implementing an interactive AI chat assistant within the DailyUse platform. It enables users to have natural language conversations with an AI to get advice on goal management, task planning, and productivity. The system includes real-time message streaming, conversation history management, and a dedicated UI for the chat experience.

**In Scope:**

- Backend API for managing conversation history (Create, Read, Delete).
- Backend API for streaming AI responses using Server-Sent Events (SSE).
- Domain entities for `AIConversation` and `Message`.
- Frontend UI for the chat interface (floating window or sidebar).
- Frontend UI for conversation history list.
- Real-time Markdown rendering of AI responses.
- Integration with the existing AI Quota system (from Epic 1).

**Out of Scope:**

- Multi-model switching (deferred to v1.1).
- Custom system prompts (deferred to v1.2).
- Voice interaction.
- Image generation or analysis.

### 1.2 Goals

- Provide immediate, context-aware assistance to users.
- Ensure a smooth, low-latency chat experience via streaming.
- Persist chat history for future reference.

---

## 2. Detailed Design

### 2.1 Domain Model (Server & Client)

The domain model will be implemented in `@dailyuse/domain-server` (for persistence) and `@dailyuse/domain-client` (for client-side logic).

#### Aggregates & Entities

**Aggregate Root: `AIConversation`**

- `uuid`: string (UUID)
- `accountUuid`: string (UUID)
- `title`: string (Auto-generated or user-defined)
- `createdAt`: Date
- `updatedAt`: Date
- `messages`: List<Message>

**Entity: `Message`**

- `uuid`: string (UUID)
- `conversationUuid`: string (UUID)
- `role`: 'user' | 'assistant' | 'system'
- `content`: string (Markdown supported)
- `createdAt`: Date
- `tokens`: number (approximate token count)

### 2.2 API Design (Backend)

**Base Path**: `/api/ai/conversations`

| Method   | Endpoint        | Description              | Request Body                  | Response                              |
| :------- | :-------------- | :----------------------- | :---------------------------- | :------------------------------------ |
| `GET`    | `/`             | List conversations       | -                             | `Paginated<AIConversationSummaryDto>` |
| `GET`    | `/:id`          | Get conversation details | -                             | `AIConversationDetailDto`             |
| `POST`   | `/`             | Start new conversation   | `{ initialMessage?: string }` | `AIConversationDetailDto`             |
| `DELETE` | `/:id`          | Delete conversation      | -                             | `{ success: true }`                   |
| `POST`   | `/:id/messages` | Send message (Stream)    | `{ content: string }`         | `SSE Stream`                          |

**Streaming Endpoint (`POST /api/ai/chat/stream`)**

- **Input**: `{ conversationId?: string, message: string, context?: any }`
- **Output**: Server-Sent Events (SSE)
  - Event: `chunk` -> `{ content: string }`
  - Event: `done` -> `{ conversationId: string, messageId: string }`
  - Event: `error` -> `{ code: string, message: string }`

### 2.3 Frontend Architecture (Web)

**Module**: `apps/web/src/modules/ai-chat`

#### Components

1.  **`AIChatWindow.vue`**: The main container. Handles the message list and input area.
2.  **`AIChatMessage.vue`**: Renders a single message. Uses `markdown-it` or similar for Markdown rendering.
3.  **`AIChatHistory.vue`**: Sidebar component listing past conversations.
4.  **`AIChatInput.vue`**: Text area with auto-resize and send button.

#### Composables

- **`useAIChat`**:
  - State: `messages`, `isStreaming`, `currentConversationId`.
  - Methods: `sendMessage(content)`, `abortGeneration()`, `loadConversation(id)`.
  - Logic: Handles the SSE connection and appends chunks to the current assistant message in real-time.

#### Store

- **`useAIConversationStore`**:
  - State: `conversations` (list), `activeConversation`.
  - Actions: `fetchConversations`, `deleteConversation`, `createConversation`.

### 2.4 Data Flow

1.  **User sends message**:
    - UI calls `useAIChat.sendMessage`.
    - Optimistically adds user message to UI.
    - Adds a placeholder "Assistant is typing..." message.
2.  **API Request**:
    - `POST /api/ai/chat/stream` is called.
3.  **Backend Processing**:
    - `AIGenerationService` validates quota.
    - Calls `AIAdapter` (OpenAI/Mock) with conversation history.
4.  **Streaming Response**:
    - Backend receives chunks from LLM.
    - Backend forwards chunks to Frontend via SSE.
    - Frontend `useAIChat` appends chunks to the placeholder message.
5.  **Completion**:
    - Stream ends.
    - Backend saves the full message to the database.
    - Frontend updates the message state to "completed".

---

## 3. Non-Functional Requirements (NFRs)

### 3.1 Performance

- **Time to First Token (TTFT)**: < 2 seconds (dependent on LLM provider).
- **Streaming Latency**: Updates should appear smooth (chunk interval < 200ms).
- **History Loading**: < 500ms for conversation list.

### 3.2 Security

- **Authentication**: All endpoints require valid JWT.
- **Authorization**: Users can only access their own conversations.
- **Input Sanitization**: Although Markdown is rendered, HTML injection must be prevented (sanitize-html).

### 3.3 Reliability

- **Network Interruption**: If the stream is cut, the partial response should be saved or the user notified to retry.
- **Quota Limits**: Graceful handling of "Quota Exceeded" errors (429).

---

## 4. Dependencies

- **Internal Packages**:
  - `@dailyuse/domain-server`: For `AIGenerationService` and repositories.
  - `@dailyuse/domain-client`: For client-side entities.
  - `@dailyuse/utils`: For `SSEManager` (if available) or standard `EventSource`.
- **External Libraries**:
  - `markdown-it` (or similar): For frontend Markdown rendering.
  - `highlight.js`: For code block syntax highlighting.
  - `vercel-ai-sdk` (or direct OpenAI SDK): For backend LLM integration.

---

## 5. Acceptance Criteria

### 5.1 Chat Interface

- [ ] User can open the chat window from anywhere in the app (e.g., global FAB).
- [ ] User can type a message and send it.
- [ ] User sees their message immediately.
- [ ] AI response streams in real-time (typewriter effect).
- [ ] Markdown content (lists, bold, code blocks) renders correctly.

### 5.2 Conversation Management

- [ ] User can see a list of past conversations.
- [ ] User can switch between conversations.
- [ ] User can delete a conversation.
- [ ] New conversation starts with an empty state (or a welcome message).

### 5.3 Context & History

- [ ] AI remembers previous messages in the _current_ conversation.
- [ ] Context window is managed (e.g., last 10 messages sent to LLM).

### 5.4 Error Handling

- [ ] Network errors during streaming show a "Retry" option.
- [ ] Quota exceeded errors show a friendly message and upgrade/wait prompt.

---

## 6. Risks & Mitigation

| Risk                   | Impact                | Mitigation                                                       |
| :--------------------- | :-------------------- | :--------------------------------------------------------------- |
| **Token Cost Spikes**  | High operational cost | Strict quota enforcement (Epic 1); Limit context window size.    |
| **Stream Instability** | Poor UX               | Implement robust client-side reconnection or simple retry logic. |
| **Prompt Injection**   | Security/Reputation   | Use system prompts to restrict AI behavior; Output sanitization. |

---

## 7. Validation Strategy

### 7.1 Unit Tests

- **Backend**: Test `AIConversationService` for CRUD operations. Test `QuotaEnforcement` integration.
- **Frontend**: Test `useAIChat` composable for stream handling and state updates.

### 7.2 Integration Tests

- Test the full flow from API call to DB persistence.
- Test SSE endpoint connectivity.

### 7.3 Manual Verification

- Verify streaming smoothness on slow networks (browser throttling).
- Verify Markdown rendering for complex responses.
