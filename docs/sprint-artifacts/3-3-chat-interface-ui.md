# Story 3.3: Chat Interface UI

Status: in-progress

## Story

As a User,
I want a chat interface to talk to the AI,
So that I can ask questions naturally.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Chat window accessible via floating button or sidebar
2. **AC-2**: User can type and send messages
3. **AC-3**: User message appears immediately (optimistic UI)
4. **AC-4**: AI response streams in real-time (typewriter effect)
5. **AC-5**: Markdown content renders correctly (bold, lists, code blocks)
6. **AC-6**: Auto-scroll to bottom as new content arrives
7. **AC-7**: "Stop Generating" button available during streaming
8. **AC-8**: Error states handled (network error, quota exceeded)

### UX Criteria

9. **AC-9**: Clean, modern chat UI (bubble style)
10. **AC-10**: Loading indicator ("AI is thinking...") before stream starts
11. **AC-11**: Input area auto-expands

### Technical Criteria

12. **AC-12**: Uses `useAIChat` composable for logic
13. **AC-13**: Uses `EventSource` or `fetch` with reader for SSE
14. **AC-14**: Uses `markdown-it` for rendering
15. **AC-15**: Zero console errors

## Tasks / Subtasks

- [x] **Task 1**: Create `useAIChat` Composable (AC: 12, 13)
  - [x] State: `messages`, `isStreaming`, `error`
  - [x] Method: `sendMessage(content)` - handles SSE connection (fetch streaming POST)
  - [x] Method: `abort()` - aborts fetch controller & marks truncated
  - [x] Logic: Append chunks to current assistant message

- [x] **Task 2**: Create `AIChatMessage` Component (AC: 5, 9)
  - [x] Props: `message` (role, content)
  - [x] Render Markdown using `markdown-it` + sanitization
  - [x] Style user vs assistant messages (alignment, color)
  - [x] Show thinking placeholder & truncated/error states

- [x] **Task 3**: Create `AIChatInput` Component (AC: 2, 11)
  - [x] Textarea with auto-grow
  - [x] Send button (disabled if empty or streaming)
  - [x] Enter to send, Shift+Enter for newline

- [x] **Task 4**: Create `AIChatWindow` Container (AC: 1, 6, 7, 10)
  - [x] Layout: Header, Message List, Input Area
  - [x] Auto-scroll logic with threshold to preserve user scroll
  - [x] "Stop Generating" button logic
  - [x] Integrate `useAIChat`
  - [x] Loading indicator (header & placeholder)

- [x] **Task 5**: Integrate with App Layout (AC: 1)
  - [x] Added floating action button + drawer in `App.vue`
  - [x] Overlay layering & transitions

- [x] **Task 6**: Error Handling (AC: 8)
  - [x] Error classification (quota/network/abort)
  - [x] Inline error display in message bubble
  - [ ] (Pending) Snackbar integration & retry UX

- [ ] **Task 7**: Unit Tests (AC: 15)
  - [x] Initial composable init test
  - [x] Stream parsing & abort tests (`useAIChat.stream.test.ts`)
  - [ ] Component rendering (markdown, thinking state)
  - [ ] No console errors check

## Progress Notes (Dev Agent)

Current Implementation covers AC-1..11 (visual/interaction) except advanced styling refinements. AC-12 & AC-13 partially done (logic + fetch streaming). AC-14: markdown-it integrated; potential code highlight not yet added. AC-15: partial tests added, needs expansion.

### Next Planned Enhancements

- Add code block highlighting (prismjs)
- Add retry & snackbar integration
- Add EventSource fallback (if GET variant becomes available)
- Add component tests and console error guard

## Dev Notes

### Technical Context

- **Location**: `apps/web/src/modules/ai-chat`
- **Dependencies**: `markdown-it`, `dompurify` (for security)

### Architecture Alignment

- **Composable Pattern**: Logic in `useAIChat`, UI in components.
- **Store**: May use `aiChatStore` if global state needed (e.g., open/close state).

### Learnings from Previous Stories

**From Story 2.4 (Task UI):**

- **Streaming**: We haven't done streaming in 2.4, but we did async loading.
- **Markdown**: We used Markdown in `TaskDescription`. Ensure consistent styling.

### References

- [Tech Spec: Epic 3](./tech-spec-epic-3.md)

---

## Dev Agent Record (Initial)

Started: Moved from drafted → in-progress after backend streaming (Story 3-2) completed.

### Context Bridging

- Backend SSE endpoint: `POST /api/ai/chat/stream` already stable (Story 3-2)
- Will consume SSE using `EventSource` (preferred for simplicity) with fallback to `fetch + ReadableStream` if needed.
- Markdown rendering will use `markdown-it` with `dompurify` sanitization wrapper.

### Initial Implementation Plan

1. `useAIChat` composable: handles message list, streaming state, abort controller, error.
2. Low-level SSE handler: `connectStream(message)` returns controller + stream events.
3. Components: `AIChatMessage`, `AIChatInput`, `AIChatWindow`.
4. Styling: Use existing design tokens (check `apps/web/src/styles`), bubble layout with assistant/user alignment.
5. Error UI: Snackbar (reuse global notification system if exists) + inline retry for failed user message.
6. Tests: Mock EventSource; validate chunk accumulation & abort logic.

### Risks / Considerations

- Auto-scroll: must not override user scroll if they scroll upward (apply threshold logic).
- Markdown security: Ensure sanitization; disable raw HTML.
- Abort semantics: When user clicks "Stop Generating", assistant partial message should remain and be marked truncated.
- Edge case: Rapid consecutive sends while previous stream active (queue vs reject). Will start with: block input while streaming.

### Next Actions

- Scaffold directory `apps/web/src/modules/ai-chat`.
- Implement composable with placeholder adapter.
- Add minimal UI shell before full styling.
