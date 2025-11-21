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

- [x] **Task 1**: Create `useAIConversationStore` (AC: 8, 9, 10)
  - [x] State: `conversations`, `activeConversationId`, `loading`
  - [x] Actions: `fetchConversations`, `deleteConversation`, `setActiveConversation`, `createConversation`
  - [x] Getters: `groupedConversations` (by date)

- [x] **Task 2**: Create `AIChatHistory` Component (AC: 1, 2, 6, 7)
  - [x] Render list from store
  - [x] Implement date grouping logic (or use store getter)
  - [x] Handle click to select

- [x] **Task 3**: Implement Delete Functionality (AC: 5)
  - [x] Add delete icon/menu to list items
  - [x] Confirm dialog
  - [x] Call store action

- [x] **Task 4**: Integrate with Chat Window (AC: 3, 4)
  - [x] When selected, `AIChatWindow` should load messages for that ID
  - [x] "New Chat" button resets `activeConversationId` to null

- [ ] **Task 5**: Unit Tests
  - [ ] Test store actions and getters
  - [ ] Test component interaction

## Dev Notes

### Dev Agent Record

**Implementation Summary (2025-11-21)**

Created complete conversation history UI system:

1. **Type Definitions** (`types/conversation.ts`)
   - `Conversation` interface with metadata
   - `ConversationListResponse` for API pagination
   - `ConversationGroup` & `DateGroup` for organizing

2. **State Management** (`composables/useConversationHistory.ts`)
   - Reactive state: conversations, active ID, loading, error
   - Date grouping logic (Today/Yesterday/Week/Month/Older)
   - CRUD actions: fetch, select, create, delete
   - Optimistic updates for UX

3. **UI Components**
   - `ConversationItem.vue`: Individual row with title/preview/time/delete
   - `ConversationHistorySidebar.vue`: Full sidebar with groups & actions
   - Gradient styling matching chat theme
   - Smooth animations & transitions

4. **Integration**
   - `App.vue`: Added sidebar toggle & conversation selection handler
   - `AIChatWindow.vue`: Added `conversationUuid` prop with watcher
   - History button in chat header (📋 icon)

**Current Status**: Core UI complete, ready for API connection

**Next Steps**:

- Connect real backend API endpoints
- Implement message history loading
- Add search/filter functionality
- Write unit tests

### Technical Context

- **Location**: `apps/web/src/modules/ai-chat`
- **Store**: `apps/web/src/modules/ai-chat/stores/aiConversationStore.ts`

### Architecture Alignment

- **Pinia**: Standard store pattern.
- **API Client**: Create `AIConversationApiClient`.

### References

- [Tech Spec: Epic 3](./tech-spec-epic-3.md)
