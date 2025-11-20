# Story 3.3: Chat Interface UI

Status: drafted

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

- [ ] **Task 1**: Create `useAIChat` Composable (AC: 12, 13)
  - [ ] State: `messages`, `isStreaming`, `error`
  - [ ] Method: `sendMessage(content)` - handles SSE connection
  - [ ] Method: `abort()` - aborts fetch controller
  - [ ] Logic: Append chunks to current assistant message

- [ ] **Task 2**: Create `AIChatMessage` Component (AC: 5, 9)
  - [ ] Props: `message` (role, content)
  - [ ] Render Markdown using `markdown-it`
  - [ ] Style user vs assistant messages (alignment, color)

- [ ] **Task 3**: Create `AIChatInput` Component (AC: 2, 11)
  - [ ] Textarea with auto-grow
  - [ ] Send button (disabled if empty or streaming)
  - [ ] Enter to send, Shift+Enter for newline

- [ ] **Task 4**: Create `AIChatWindow` Container (AC: 1, 6, 7, 10)
  - [ ] Layout: Header, Message List, Input Area
  - [ ] Auto-scroll logic (watch messages array)
  - [ ] "Stop Generating" button logic
  - [ ] Integrate `useAIChat`

- [ ] **Task 5**: Integrate with App Layout (AC: 1)
  - [ ] Add global FAB or Sidebar toggle in `App.vue` or `MainLayout.vue`
  - [ ] Ensure it overlays correctly

- [ ] **Task 6**: Error Handling (AC: 8)
  - [ ] Show snackbar on error
  - [ ] Allow retry for failed messages

- [ ] **Task 7**: Unit Tests (AC: 15)
  - [ ] Test composable stream handling
  - [ ] Test component rendering

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
