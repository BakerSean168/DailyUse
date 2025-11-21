# Story 4.2: Document Summarization UI

Status: ready-for-dev

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

- [ ] **Task 1**: Create Type Definitions (AC: 5, 12)
  - [ ] Create `types/summarization.ts` in `apps/web/src/modules/ai-tools`
  - [ ] Define `SummaryResult` interface: summary { core, keyPoints, actionItems }, metadata { tokensUsed, compressionRatio }
  - [ ] Define `SummarizationRequest` interface: text, language, includeActions
  - [ ] Export types

- [ ] **Task 2**: Create useDocumentSummarizer Composable (AC: 10, 11)
  - [ ] File: `apps/web/src/modules/ai-tools/composables/useDocumentSummarizer.ts`
  - [ ] Reactive state:
    - `inputText`: ref<string>('')
    - `summary`: ref<SummaryResult | null>(null)
    - `isLoading`: ref<boolean>(false)
    - `error`: ref<string | null>(null)
    - `includeActions`: ref<boolean>(true)
  - [ ] Computed:
    - `characterCount`: computed(() => inputText.value.length)
    - `isTextValid`: computed(() => characterCount >= 1 && characterCount <= 50000)
  - [ ] Methods:
    - `summarize()`: Call api.post('/api/ai/summarize', { text, includeActions }), handle response/errors
    - `copyToClipboard()`: Format summary as text, copy to clipboard
    - `reset()`: Clear inputText, summary, error

- [ ] **Task 3**: Create SummaryDisplay Component (AC: 5, 6, 12)
  - [ ] File: `apps/web/src/modules/ai-tools/components/SummaryDisplay.vue`
  - [ ] Props: `summary: SummaryResult`
  - [ ] Display sections:
    - Core Summary: v-card with headline text
    - Key Points: v-list with bullet items
    - Action Items: v-list (if present and not empty)
    - Metadata: Tokens used, compression ratio (chip badges)
  - [ ] "Copy to Clipboard" button: Call parent's copyToClipboard()
  - [ ] Styling: Use Vuetify theme colors, gradient backgrounds

- [ ] **Task 4**: Create DocumentSummarizer Component (AC: 1-4, 7-9, 13, 14)
  - [ ] File: `apps/web/src/modules/ai-tools/components/DocumentSummarizer.vue`
  - [ ] Use `useDocumentSummarizer` composable
  - [ ] Input section:
    - v-textarea: placeholder "Paste text to summarize...", auto-grow, counter (max 50000)
    - Character count indicator below textarea
    - v-switch: "Include Action Items" (v-model with includeActions)
  - [ ] Action buttons:
    - v-btn "Summarize": primary color, disabled when !isTextValid, loading state
    - v-btn "Clear": secondary color, clears input and output
  - [ ] Output section:
    - Show `<SummaryDisplay>` when summary is not null
    - Show v-alert error when error is not null (type="error", dismissible)
  - [ ] Responsive layout: v-container with grid (cols 12 on mobile, 8 on desktop)

- [ ] **Task 5**: Create AI Tools Module Structure (AC: 13, 14)
  - [ ] Create folder: `apps/web/src/modules/ai-tools/`
  - [ ] Add route to router:
    - Path: `/ai-tools/summarizer`
    - Component: DocumentSummarizer.vue
    - Meta: requiresAuth, icon, title "Document Summarizer"
  - [ ] Add navigation link in main menu (sidebar or app bar)

- [ ] **Task 6**: Implement Copy to Clipboard (AC: 6)
  - [ ] In `useDocumentSummarizer.copyToClipboard()`:
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

- [ ] **Task 7**: Error Handling & User Feedback (AC: 4, 7)
  - [ ] Map API errors to user-friendly messages:
    - 401: "Please log in to use this feature"
    - 429: "Daily quota exceeded. Please try again tomorrow."
    - 504: "Request timeout. Please try with shorter text."
    - 400: "Invalid input. Text must be 1-50,000 characters."
    - 500: "Service unavailable. Please try again later."
  - [ ] Display loading overlay with spinner during API call
  - [ ] Disable "Summarize" button during loading

- [ ] **Task 8**: Unit Tests for Composable (AC: 16, 17)
  - [ ] File: `apps/web/src/modules/ai-tools/composables/__tests__/useDocumentSummarizer.test.ts`
  - [ ] Test cases:
    - Initial state (empty inputText, null summary, false isLoading)
    - characterCount computed property
    - isTextValid computed (edge cases: 0, 1, 50000, 50001 chars)
    - summarize() success: mock api.post, verify summary set, isLoading false
    - summarize() error: verify error set, summary null
    - copyToClipboard(): mock navigator.clipboard, verify formatted text
    - reset(): verify all state cleared

- [ ] **Task 9**: Component Tests (AC: 15, 17)
  - [ ] File: `apps/web/src/modules/ai-tools/components/__tests__/DocumentSummarizer.test.ts`
  - [ ] Test cases:
    - Renders textarea and buttons
    - Character counter updates on input
    - "Summarize" button disabled when text invalid
    - Calls summarize() on button click
    - Displays loading spinner during API call
    - Displays SummaryDisplay when summary available
    - Displays error alert on API failure
    - "Clear" button resets state
    - "Include Action Items" toggle works

- [ ] **Task 10**: Accessibility & UX Polish (AC: 18)
  - [ ] Add ARIA labels to all interactive elements
  - [ ] Ensure keyboard navigation (tab order, enter to submit)
  - [ ] Focus management (focus textarea on mount, focus output on result)
  - [ ] Add loading announcements for screen readers
  - [ ] Test with keyboard only (no mouse)
  - [ ] Test with screen reader (NVDA/VoiceOver)

## Dev Notes

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
