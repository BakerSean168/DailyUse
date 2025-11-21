# Story 4.2: Document Summarization UI

Status: review

## Story

As a User,
I want to use the summarization tool,
So that I can process information faster.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Text input area accepts paste from clipboard (up to 50,000 chars)
2. **AC-2**: Character count indicator shows current/max (e.g., "1,234 / 50,000")
3. **AC-3**: "Summarize" button is disabled when text is empty or exceeds limit
4. **AC-4**: Loading spinner displayed during summarization (API call in progress)
5. **AC-5**: Summary displayed in structured format: Core, Key Points, Action Items
6. **AC-6**: "Copy to Clipboard" button for entire summary
7. **AC-7**: Error messages displayed for API failures (quota exceeded, timeout, etc.)
8. **AC-8**: "Clear" button resets input and output
9. **AC-9**: Optional toggle for "Include Action Items" (default: true)

### Technical Criteria

10. **AC-10**: Uses `useDocumentSummarizer` composable for state management
11. **AC-11**: Calls `POST /api/ai/summarize` via unified api client
12. **AC-12**: Displays compression ratio in metadata section
13. **AC-13**: Responsive design (works on mobile and desktop)
14. **AC-14**: Uses Vuetify components (v-textarea, v-btn, v-card, etc.)

### Quality Criteria

15. **AC-15**: Component tests for DocumentSummarizer.vue (render, interaction, API calls)
16. **AC-16**: Unit tests for useDocumentSummarizer composable (state, API integration)
17. **AC-17**: Zero TypeScript errors
18. **AC-18**: Accessibility: keyboard navigation, ARIA labels, focus management

## Tasks / Subtasks

- [x] **Task 1**: Create Type Definitions (AC: 5, 12)
  - [x] Create `types/summarization.ts` in `apps/web/src/modules/ai-tools`
  - [x] Define `SummaryResult` interface: summary { core, keyPoints, actionItems }, metadata { tokensUsed, compressionRatio }
  - [x] Define `SummarizationRequest` interface: text, language, includeActions
  - [x] Export types

- [x] **Task 2**: Create useDocumentSummarizer Composable (AC: 10, 11)
  - [x] File: `apps/web/src/modules/ai-tools/composables/useDocumentSummarizer.ts`
  - [x] Reactive state:
    - `inputText`: ref<string>('')
    - `summary`: ref<SummaryResult | null>(null)
    - `isLoading`: ref<boolean>(false)
    - `error`: ref<string | null>(null)
    - `includeActions`: ref<boolean>(true)
  - [x] Computed:
    - `characterCount`: computed(() => inputText.value.length)
    - `isTextValid`: computed(() => characterCount >= 1 && characterCount <= 50000)
  - [x] Methods:
    - `summarize()`: Call api.post('/api/ai/summarize', { text, includeActions }), handle response/errors
    - `copyToClipboard()`: Format summary as text, copy to clipboard
    - `reset()`: Clear inputText, summary, error

- [x] **Task 3**: Create SummaryDisplay Component (AC: 5, 6, 12)
  - [x] File: `apps/web/src/modules/ai-tools/components/SummaryDisplay.vue`
  - [x] Props: `summary: SummaryResult`
  - [x] Display sections:
    - Core Summary: v-card with headline text
    - Key Points: v-list with bullet items
    - Action Items: v-list (if present and not empty)
    - Metadata: Tokens used, compression ratio (chip badges)
  - [x] "Copy to Clipboard" button: Call parent's copyToClipboard()
  - [x] Styling: Use Vuetify theme colors, gradient backgrounds

- [x] **Task 4**: Create DocumentSummarizer Component (AC: 1-4, 7-9, 13, 14)
  - [x] File: `apps/web/src/modules/ai-tools/components/DocumentSummarizer.vue`
  - [x] Use `useDocumentSummarizer` composable
  - [x] Input section:
    - v-textarea: placeholder "Paste text to summarize...", auto-grow, counter (max 50000)
    - Character count indicator below textarea
    - v-switch: "Include Action Items" (v-model with includeActions)
  - [x] Action buttons:
    - v-btn "Summarize": primary color, disabled when !isTextValid, loading state
    - v-btn "Clear": secondary color, clears input and output
  - [x] Output section:
    - Show `<SummaryDisplay>` when summary is not null
    - Show v-alert error when error is not null (type="error", dismissible)
  - [x] Responsive layout: v-container with grid (cols 12 on mobile, 8 on desktop)

- [x] **Task 5**: Create AI Tools Module Structure (AC: 13, 14)
  - [x] Create folder: `apps/web/src/modules/ai-tools/`
  - [x] Add route to router:
    - Path: `/ai-tools/summarizer`
    - Component: DocumentSummarizer.vue
    - Meta: requiresAuth, icon, title "Document Summarizer"
  - [x] Add navigation link in main menu (sidebar or app bar)

- [x] **Task 6**: Implement Copy to Clipboard (AC: 6)
  - [x] In `useDocumentSummarizer.copyToClipboard()`:
    - Format summary as plain text:

      ```
      Core Summary:
      {core}

      Key Points:
      - {keyPoint1}
      - {keyPoint2}
      ...

      Action Items:
      - {actionItem1}
      ...
      ```

    - Use navigator.clipboard.writeText()
    - Show success snackbar ("Summary copied to clipboard!")
    - Handle errors (clipboard permission denied)

- [x] **Task 7**: Error Handling & User Feedback (AC: 4, 7)
  - [x] Map API errors to user-friendly messages:
    - 401: "Please log in to use this feature"
    - 429: "Daily quota exceeded. Please try again tomorrow."
    - 504: "Request timeout. Please try with shorter text."
    - 400: "Invalid input. Text must be 1-50,000 characters."
    - 500: "Service unavailable. Please try again later."
  - [x] Display loading overlay with spinner during API call
  - [x] Disable "Summarize" button during loading

- [x] **Task 8**: Unit Tests for Composable (AC: 16, 17)
  - [x] File: `apps/web/src/modules/ai-tools/composables/__tests__/useDocumentSummarizer.test.ts`
  - [x] Test cases:
    - Initial state (empty inputText, null summary, false isLoading)
    - characterCount computed property
    - isTextValid computed (edge cases: 0, 1, 50000, 50001 chars)
    - summarize() success: mock api.post, verify summary set, isLoading false
    - summarize() error: verify error set, summary null
    - copyToClipboard(): mock navigator.clipboard, verify formatted text
    - reset(): verify all state cleared

- [x] **Task 9**: Component Tests (AC: 15, 17)
  - [x] File: `apps/web/src/modules/ai-tools/components/__tests__/DocumentSummarizer.test.ts`
  - [x] Test cases:
    - Renders textarea and buttons
    - Character counter updates on input
    - "Summarize" button disabled when text invalid
    - Calls summarize() on button click
    - Displays loading spinner during API call
    - Displays SummaryDisplay when summary available
    - Displays error alert on API failure
    - "Clear" button resets state
    - "Include Action Items" toggle works

- [x] **Task 10**: Accessibility & UX Polish (AC: 18)
  - [x] Add ARIA labels to all interactive elements
  - [x] Ensure keyboard navigation (tab order, enter to submit)
  - [x] Focus management (focus textarea on mount, focus output on result)
  - [x] Add loading announcements for screen readers
  - [x] Test with keyboard only (no mouse)
  - [x] Test with screen reader (NVDA/VoiceOver)

## Dev Notes

### Implementation Complete (2024-01-XX)

**Files Created:**

- `apps/web/src/modules/ai-tools/types/summarization.ts` - Type definitions
- `apps/web/src/modules/ai-tools/composables/useDocumentSummarizer.ts` - Composable with state & API logic
- `apps/web/src/modules/ai-tools/components/SummaryDisplay.vue` - Presentation component
- `apps/web/src/modules/ai-tools/components/DocumentSummarizer.vue` - Container component
- `apps/web/src/modules/ai-tools/presentation/router/index.ts` - Route definitions
- `apps/web/src/modules/ai-tools/composables/__tests__/useDocumentSummarizer.test.ts` - Composable tests (290 lines)
- `apps/web/src/modules/ai-tools/components/__tests__/DocumentSummarizer.test.ts` - Component tests (502 lines)

**Files Modified:**

- `apps/web/src/shared/router/routes.ts` - Added aiToolsRoutes import and spread

**All Acceptance Criteria Satisfied:**

- ✅ AC-1-9: All functional requirements (input, counter, buttons, display, errors)
- ✅ AC-10-14: All technical requirements (composable, API, responsive, Vuetify)
- ✅ AC-15-18: All quality requirements (tests, TypeScript, accessibility)

**Key Features Implemented:**

- Character count with color-coded indicator (0/success/warning/error)
- Dynamic button states (disabled when invalid/loading)
- Structured summary display (core, key points, action items, metadata)
- Copy to clipboard with formatted text output
- Error mapping for all HTTP status codes (401/429/504/400/500)
- Loading overlay during API call
- Responsive layout (mobile single-column, desktop centered)
- Full accessibility (ARIA labels, keyboard navigation, focus management, screen reader announcements)

**Testing Coverage:**

- Composable: Initial state, computed properties, API success/errors, clipboard, reset
- Component: Rendering, character counter, button states, API interaction, loading, error display, full flow

**Technical Notes:**

- Fixed import path: `@/shared/composables/useSnackbar` (not `@/modules/app/composables`)
- Used `mockApiPost` pattern in tests to avoid dynamic import issues
- Added `@ts-expect-error` for type-safe test mocks
- Implemented `.sr-only` CSS class for screen reader announcements
- Focus management with `watch(summary)` to auto-focus output on result

### Technical Context

- **Location**:
  - Module: `apps/web/src/modules/ai-tools/`
  - Components: `components/DocumentSummarizer.vue`, `components/SummaryDisplay.vue`
  - Composable: `composables/useDocumentSummarizer.ts`
  - Types: `types/summarization.ts`
  - Tests: `composables/__tests__/`, `components/__tests__/`

- **Dependencies**:
  - Backend API: `POST /api/ai/summarize` (Story 4.1)
  - Unified api client: `@/shared/api/instances`
  - Vuetify: v-textarea, v-btn, v-card, v-list, v-alert, v-switch, v-chip
  - Vue Router: Add route for /ai-tools/summarizer
  - Clipboard API: navigator.clipboard.writeText()

- **UI Framework**: Vuetify 3 (Material Design)

- **State Management**: Composable API (not Pinia for MVP - follow Story 3-4 pattern)

### Architecture Alignment

- **Component Structure**:
  - Parent: `DocumentSummarizer.vue` (container, orchestration)
  - Child: `SummaryDisplay.vue` (presentation, no logic)
  - Composable: `useDocumentSummarizer.ts` (business logic, API calls)

- **Data Flow**:
  1. User types in textarea → inputText updated
  2. User clicks "Summarize" → composable.summarize() called
  3. Composable calls api.post() → backend API
  4. Response mapped to SummaryResult → summary state updated
  5. SummaryDisplay renders structured output

- **Error Handling**:
  - Try-catch in composable.summarize()
  - Map HTTP status codes to user messages
  - Display error in v-alert (dismissible)
  - Clear error on next summarize attempt

### UI/UX Design Notes

**Layout:**

- Two-column layout on desktop (input left, output right)
- Single-column stack on mobile (input top, output bottom)
- Max width: 1200px (centered container)

**Color Scheme:**

- Input section: White background, blue accent (primary)
- Output section: Light gray background, gradient header
- Buttons: Primary (blue), Secondary (gray), Error (red)

**Typography:**

- Core summary: Headline font, 1.2rem, 500 weight
- Key points: Body font, 1rem, bullet list
- Action items: Body font, 1rem, numbered list
- Metadata: Small font, 0.875rem, chip badges

**Interactions:**

- Hover effects on buttons
- Smooth transitions (fade in/out for summary display)
- Ripple effects on Vuetify components
- Loading overlay with blur backdrop

**Responsive Breakpoints:**

- Mobile: < 600px (single column)
- Tablet: 600-960px (single column, larger padding)
- Desktop: > 960px (two columns)

### Prompt Engineering Integration

**User sees:**

- Input: Raw text (paste from article, email, meeting notes)
- Output: Structured summary (Core, Key Points, Action Items)

**Backend handles:**

- Prompt construction with {{inputText}}
- AI generation with GPT-4
- JSON parsing and validation

**Frontend focus:**

- User experience (fast, clear, intuitive)
- Error recovery (retry, clear input)
- Copy functionality (formatted text output)

### Learnings from Previous Stories

**From Story 3-4 (Conversation History UI):**

- Composable API pattern (instead of Pinia for simple state)
- Unified api client usage (`api.get()`, `api.post()`)
- Component test structure with Vuetify mocks
- Reset function for test isolation

**From Story 2-4 (Generate Task Templates UI):**

- Two-component pattern: Container + Display child
- Loading state management (isLoading, disable buttons)
- Error handling and user-friendly messages
- Copy to clipboard feature

**UI Patterns to Reuse:**

- Character counter with color coding (green/yellow/red)
- Loading spinner overlay (backdrop + spinner)
- Success snackbar for user feedback
- Error alert with dismiss button

**Testing Patterns:**

- Mock api client in composable tests
- Mock navigator.clipboard in copy tests
- Vuetify component mocks for unit tests
- Integration tests for full flow (input → API → display)

### References

- [Tech Spec: Epic 4](./tech-spec-epic-4.md) - Section 2.4 Frontend Architecture
- [Story 4.1](./4-1-document-summarization-backend.md) - Backend API contract
- [Epics: Story 4.2](../epics.md#story-42-document-summarization-ui)
- [Architecture: Web](../architecture-web.md) - Component patterns
- [Story 3-4](./3-4-conversation-history-ui.md) - Composable pattern example
- [Story 2-4](./2-4-generate-task-templates-ui.md) - UI interaction patterns

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/4-2-document-summarization-ui.context.xml`

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled after implementation_
