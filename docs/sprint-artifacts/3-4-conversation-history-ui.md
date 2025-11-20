# Story 3.4: Conversation History UI

Status: drafted

## Story

As a User,
I want to switch between conversations,
So that I can manage different topics.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Sidebar displays list of past conversations
2. **AC-2**: Conversations grouped by date (Today, Yesterday, Previous 7 Days)
3. **AC-3**: Clicking a conversation loads its messages into the chat window
4. **AC-4**: "New Chat" button clears current context and starts fresh
5. **AC-5**: User can delete a conversation
6. **AC-6**: Active conversation is highlighted
7. **AC-7**: Conversation titles are displayed (or "New Chat" if empty)

### Technical Criteria

8. **AC-8**: Uses `useAIConversationStore` (Pinia)
9. **AC-9**: Fetches data from `GET /api/ai/conversations`
10. **AC-10**: Optimistic updates for deletion

## Tasks / Subtasks

- [ ] **Task 1**: Create `useAIConversationStore` (AC: 8, 9, 10)
  - [ ] State: `conversations`, `activeConversationId`, `loading`
  - [ ] Actions: `fetchConversations`, `deleteConversation`, `setActiveConversation`, `createConversation`
  - [ ] Getters: `groupedConversations` (by date)

- [ ] **Task 2**: Create `AIChatHistory` Component (AC: 1, 2, 6, 7)
  - [ ] Render list from store
  - [ ] Implement date grouping logic (or use store getter)
  - [ ] Handle click to select

- [ ] **Task 3**: Implement Delete Functionality (AC: 5)
  - [ ] Add delete icon/menu to list items
  - [ ] Confirm dialog
  - [ ] Call store action

- [ ] **Task 4**: Integrate with Chat Window (AC: 3, 4)
  - [ ] When selected, `AIChatWindow` should load messages for that ID
  - [ ] "New Chat" button resets `activeConversationId` to null

- [ ] **Task 5**: Unit Tests
  - [ ] Test store actions and getters
  - [ ] Test component interaction

## Dev Notes

### Technical Context

- **Location**: `apps/web/src/modules/ai-chat`
- **Store**: `apps/web/src/modules/ai-chat/stores/aiConversationStore.ts`

### Architecture Alignment

- **Pinia**: Standard store pattern.
- **API Client**: Create `AIConversationApiClient`.

### References

- [Tech Spec: Epic 3](./tech-spec-epic-3.md)
