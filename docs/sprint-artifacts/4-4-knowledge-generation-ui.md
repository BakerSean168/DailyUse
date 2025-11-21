# Story 4.4: Knowledge Generation UI

Status: ready-for-dev

## Story

As a User,
I want to easily create a knowledge library,
So that I can support my goals.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: Wizard has 4 steps: Input, Generation, Review, Confirmation
2. **AC-2**: Step 1 - Topic input field (1-100 chars), document count selector (3-7), target audience dropdown
3. **AC-3**: Step 2 - Progress bar showing generation progress (0-100%)
4. **AC-4**: Step 2 - Estimated time remaining displayed (e.g., "~2 minutes remaining")
5. **AC-5**: Step 2 - List of documents with status badges (Generating/Completed/Failed)
6. **AC-6**: Step 3 - Preview cards for generated documents (title, excerpt, word count)
7. **AC-7**: Step 3 - User can discard individual documents before saving
8. **AC-8**: Step 4 - Confirmation message with link to folder in Knowledge Base
9. **AC-9**: "Cancel" button available at any time (cancels task, discards partial results)
10. **AC-10**: Error handling for API failures (quota exceeded, timeout, etc.)

### Technical Criteria

11. **AC-11**: Uses `useKnowledgeGeneration` composable for state management
12. **AC-12**: Calls backend APIs:
    - POST /api/ai/generate/knowledge-series (start task)
    - GET /api/ai/generate/knowledge-series/:taskId (poll status)
    - GET /api/ai/generate/knowledge-series/:taskId/documents (fetch docs)
13. **AC-13**: Polling interval: 2 seconds during generation
14. **AC-14**: Uses Vuetify stepper component (v-stepper)
15. **AC-15**: Responsive design (works on mobile and desktop)

### Quality Criteria

16. **AC-16**: Component tests for KnowledgeGenerationWizard.vue (steps, polling, error handling)
17. **AC-17**: Unit tests for useKnowledgeGeneration composable (state, API integration, polling)
18. **AC-18**: Zero TypeScript errors
19. **AC-19**: Accessibility: keyboard navigation, ARIA labels, progress announcements

## Tasks / Subtasks

- [ ] **Task 1**: Create Type Definitions (AC: 2, 5, 6)
  - [ ] Create `types/knowledgeGeneration.ts` in `apps/web/src/modules/ai-tools`
  - [ ] Define `KnowledgeGenerationTask` interface: taskUuid, topic, status, progress, generatedDocuments, estimatedTimeRemaining, error, createdAt, completedAt
  - [ ] Define `GeneratedDocumentPreview` interface: uuid, title, status (COMPLETED/FAILED), excerpt, wordCount
  - [ ] Define `KnowledgeGenerationRequest` interface: topic, documentCount, targetAudience, folderPath
  - [ ] Define TaskStatus enum: PENDING, GENERATING, COMPLETED, FAILED
  - [ ] Export types

- [ ] **Task 2**: Create useKnowledgeGeneration Composable (AC: 11, 12, 13)
  - [ ] File: `apps/web/src/modules/ai-tools/composables/useKnowledgeGeneration.ts`
  - [ ] Reactive state:
    - `task`: ref<KnowledgeGenerationTask | null>(null)
    - `documents`: ref<GeneratedDocumentPreview[]>([])
    - `isGenerating`: ref<boolean>(false)
    - `error`: ref<string | null>(null)
    - `currentStep`: ref<number>(1) // 1-4
  - [ ] Computed:
    - `progress`: computed(() => task.value?.progress || 0)
    - `isCompleted`: computed(() => task.value?.status === 'COMPLETED')
  - [ ] Methods:
    - `startGeneration(request: KnowledgeGenerationRequest)`: POST /api/ai/generate/knowledge-series, start polling
    - `pollProgress()`: Interval-based polling (GET /api/ai/generate/knowledge-series/:taskId every 2s)
    - `fetchDocuments()`: GET /api/ai/generate/knowledge-series/:taskId/documents when completed
    - `discardDocument(uuid)`: Remove document from local state (UI only, doc remains in backend)
    - `cancelTask()`: Stop polling, clear state, navigate away
    - `reset()`: Clear all state

- [ ] **Task 3**: Implement Polling Logic (AC: 3-5, 13)
  - [ ] In `startGeneration()`:
    - Call POST endpoint, get taskUuid
    - Set isGenerating = true
    - Start interval: setInterval(pollProgress, 2000)
  - [ ] In `pollProgress()`:
    - Call GET /api/ai/generate/knowledge-series/:taskId
    - Update task state (status, progress, generatedDocuments)
    - If status = COMPLETED or FAILED: stop polling, fetch documents
  - [ ] In `cancelTask()`:
    - clearInterval(pollingInterval)
    - Set isGenerating = false

- [ ] **Task 4**: Create Wizard Step 1 - Input (AC: 2)
  - [ ] Component: `KnowledgeGenerationWizard.vue` (step 1 content)
  - [ ] Form fields:
    - v-text-field: "Topic" (required, 1-100 chars, counter, autofocus)
    - v-select: "Document Count" (options: 3, 4, 5, 6, 7, default: 5)
    - v-select: "Target Audience" (options: Beginners, Intermediate, Advanced, default: Beginners)
  - [ ] Validation:
    - Topic required and 1-100 chars
    - Document count 3-7
  - [ ] "Next" button: Disabled if validation fails, calls startGeneration() on click

- [ ] **Task 5**: Create Wizard Step 2 - Generation Progress (AC: 3-5)
  - [ ] Component: `KnowledgeGenerationWizard.vue` (step 2 content)
  - [ ] Display:
    - v-progress-linear: progress (0-100%), indeterminate if progress = 0
    - Text: "Generating {progress}% complete"
    - Estimated time: "~{estimatedTimeRemaining} remaining" (if available)
    - v-list: Documents with status badges
      - v-list-item per document: title, v-chip (status: Generating/Completed/Failed)
  - [ ] Polling active during this step
  - [ ] Auto-advance to step 3 when status = COMPLETED

- [ ] **Task 6**: Create Wizard Step 3 - Review Documents (AC: 6, 7)
  - [ ] Component: `KnowledgeGenerationWizard.vue` (step 3 content)
  - [ ] Sub-component: `KnowledgeDocumentCard.vue`
    - Props: document (GeneratedDocumentPreview)
    - Display: title, excerpt (first 200 chars), word count, status badge
    - Actions: "Discard" button (emits discard event)
  - [ ] Grid layout: v-row with v-col (3 cards per row on desktop, 1 on mobile)
  - [ ] Discard button: Calls composable.discardDocument(uuid), card removed from view
  - [ ] "Next" button: Navigates to step 4 (documents already saved in backend)

- [ ] **Task 7**: Create Wizard Step 4 - Confirmation (AC: 8)
  - [ ] Component: `KnowledgeGenerationWizard.vue` (step 4 content)
  - [ ] Display:
    - Success icon and message: "Knowledge series created successfully!"
    - Topic and document count summary
    - Link to folder: "View in Knowledge Base" (router-link to /knowledge/{folderPath})
  - [ ] "Finish" button: Resets wizard, navigates to Knowledge Base

- [ ] **Task 8**: Implement Cancel Functionality (AC: 9)
  - [ ] "Cancel" button visible in wizard header (all steps)
  - [ ] On click: Show confirmation dialog ("Discard generation?")
  - [ ] If confirmed: Call composable.cancelTask(), navigate back to AI Tools home

- [ ] **Task 9**: Error Handling & User Feedback (AC: 10)
  - [ ] Map API errors to user-friendly messages:
    - 401: "Please log in to use this feature"
    - 429: "Daily quota exceeded. Please try again tomorrow."
    - 400: "Invalid input. Please check topic and try again."
    - 500: "Service unavailable. Please try again later."
  - [ ] Display error in v-alert (type="error", dismissible)
  - [ ] If error during generation: Stop polling, show error in step 2, allow retry or cancel
  - [ ] Partial success: If some docs FAILED, show warning but allow proceed to step 3

- [ ] **Task 10**: Integrate with Knowledge Base Module (AC: 8)
  - [ ] In step 4, link to Knowledge Base folder:
    - Get folderPath from task (e.g., "/AI Generated/Weight Loss")
    - Navigate to `/knowledge?folder={encodeURIComponent(folderPath)}`
  - [ ] Knowledge Base should highlight the folder and display new documents
  - [ ] (Future: Knowledge Base module implementation in separate epic)

- [ ] **Task 11**: Unit Tests for Composable (AC: 17, 18)
  - [ ] File: `apps/web/src/modules/ai-tools/composables/__tests__/useKnowledgeGeneration.test.ts`
  - [ ] Test cases:
    - Initial state (null task, empty documents, false isGenerating)
    - startGeneration(): mock POST, verify polling started, task set
    - pollProgress(): mock GET, verify task updated, interval continues
    - Polling stops when status = COMPLETED
    - fetchDocuments(): mock GET, verify documents set
    - discardDocument(): verify document removed from local state
    - cancelTask(): verify polling stopped, state cleared
    - Error handling: verify error set, polling stopped

- [ ] **Task 12**: Component Tests (AC: 16, 18)
  - [ ] File: `apps/web/src/modules/ai-tools/components/__tests__/KnowledgeGenerationWizard.test.ts`
  - [ ] Test cases:
    - Renders step 1 with input fields
    - "Next" button disabled when validation fails
    - Calls startGeneration() on "Next" click
    - Step 2 displays progress bar and document list
    - Auto-advances to step 3 when completed
    - Step 3 renders document cards
    - Discard button removes card
    - Step 4 displays confirmation and link
    - "Cancel" button shows dialog and cancels task
    - Error alert displayed on API failure

- [ ] **Task 13**: Accessibility & UX Polish (AC: 19)
  - [ ] Add ARIA labels to all interactive elements
  - [ ] Stepper navigation: aria-label for steps, aria-current for active step
  - [ ] Progress announcements: Use aria-live="polite" for progress updates
  - [ ] Keyboard navigation: Tab order, Enter to submit, Esc to cancel
  - [ ] Focus management: Focus first field on step mount, focus confirmation on completion
  - [ ] Test with screen reader (NVDA/VoiceOver)

- [ ] **Task 14**: Responsive Design (AC: 15)
  - [ ] Mobile (< 600px):
    - Stepper: Vertical layout
    - Document cards: Single column
    - Buttons: Full width
  - [ ] Tablet (600-960px):
    - Stepper: Horizontal layout
    - Document cards: Two columns
  - [ ] Desktop (> 960px):
    - Stepper: Horizontal layout
    - Document cards: Three columns
    - Max width: 1200px (centered)

## Dev Notes

### Technical Context

- **Location**:
  - Module: `apps/web/src/modules/ai-tools/`
  - Components: `components/KnowledgeGenerationWizard.vue`, `components/KnowledgeDocumentCard.vue`
  - Composable: `composables/useKnowledgeGeneration.ts`
  - Types: `types/knowledgeGeneration.ts`
  - Tests: `composables/__tests__/`, `components/__tests__/`

- **Dependencies**:
  - Backend APIs: POST /generate/knowledge-series, GET /:taskId, GET /:taskId/documents (Story 4.3)
  - Unified api client: `@/shared/api/instances`
  - Vuetify: v-stepper, v-text-field, v-select, v-progress-linear, v-card, v-chip, v-list, v-btn
  - Vue Router: Add route for /ai-tools/knowledge-generator
  - Knowledge Base module: Link to folder view (integration)

- **UI Framework**: Vuetify 3 (Material Design)

- **State Management**: Composable API (polling, task state)

### Architecture Alignment

- **Component Structure**:
  - Parent: `KnowledgeGenerationWizard.vue` (stepper orchestration)
  - Child: `KnowledgeDocumentCard.vue` (document preview, no polling logic)
  - Composable: `useKnowledgeGeneration.ts` (business logic, API calls, polling)

- **Data Flow**:
  1. User fills form (step 1) → startGeneration() called
  2. Backend returns taskUuid → polling starts
  3. Every 2s: pollProgress() → task state updated → UI reflects progress
  4. When completed: fetchDocuments() → documents array populated → step 3 displays cards
  5. User reviews/discards docs → navigates to step 4 → links to Knowledge Base

- **Polling Pattern**:
  - Start: setInterval in startGeneration()
  - Update: pollProgress() every 2 seconds
  - Stop: When status = COMPLETED or FAILED, or user cancels
  - Cleanup: clearInterval in cancelTask() and onUnmounted()

- **Error Handling**:
  - Try-catch in all API calls
  - Map HTTP status codes to user messages
  - Display error in v-alert (dismissible)
  - Allow retry or cancel after error

### UI/UX Design Notes

**Wizard Layout:**

- Stepper header: Horizontal on desktop, vertical on mobile
- Step content: Centered, max-width 800px (steps 1-2), 1200px (step 3)
- Navigation: "Back", "Next", "Cancel" buttons in footer

**Step 1 - Input:**

- Form centered, fields stacked vertically
- Focus on topic field on mount
- Character counter for topic (1/100)
- Document count: Visual selector (chips or slider alternative)
- Target audience: Dropdown with icons

**Step 2 - Progress:**

- Large progress bar (indeterminate → determinate)
- Document list below progress:
  - Icon + title + status chip
  - Status colors: Blue (Generating), Green (Completed), Red (Failed)
- Estimated time: Dynamic calculation based on progress

**Step 3 - Review:**

- Grid of document cards (3 columns desktop, 1 mobile)
- Card design:
  - Title (headline)
  - Excerpt (body text, 2-3 lines, ellipsis)
  - Word count badge (chip)
  - Status badge (if FAILED, show red with error icon)
  - Discard button (icon button, red on hover)
- Empty state: "No documents to review" (if all discarded)

**Step 4 - Confirmation:**

- Success icon (checkmark, large, animated)
- Message: "Knowledge series created successfully!"
- Summary: "{documentCount} documents on '{topic}' saved to Knowledge Base"
- Action: "View in Knowledge Base" button (primary, large)

**Color Scheme:**

- Primary: Blue (#1976D2)
- Success: Green (#4CAF50)
- Error: Red (#F44336)
- Progress: Linear gradient (blue → purple)
- Background: Light gray (#FAFAFA)

**Animations:**

- Step transitions: Slide left/right
- Progress bar: Smooth fill
- Document cards: Fade in sequentially (stagger 100ms)
- Success icon: Scale + bounce animation

### Polling Strategy

**Implementation:**

```typescript
let pollingInterval: NodeJS.Timer | null = null;

function startPolling(taskUuid: string) {
  pollingInterval = setInterval(async () => {
    await pollProgress(taskUuid);
  }, 2000); // 2 seconds
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

async function pollProgress(taskUuid: string) {
  const response = await api.get(`/api/ai/generate/knowledge-series/${taskUuid}`);
  task.value = response.data;

  if (task.value.status === 'COMPLETED' || task.value.status === 'FAILED') {
    stopPolling();
    if (task.value.status === 'COMPLETED') {
      await fetchDocuments(taskUuid);
      currentStep.value = 3; // Auto-advance
    }
  }
}
```

**Cleanup:**

- onUnmounted: Stop polling to prevent memory leaks
- onBeforeRouteLeave: Warn user if generation in progress

### Integration with Knowledge Base

**Folder Navigation:**

- Documents saved to `/AI Generated/{topic}` folder (backend creates folder)
- Step 4 link: `/knowledge?folder=/AI%20Generated/Weight%20Loss`
- Knowledge Base should:
  - Parse query param `folder`
  - Navigate to folder in tree
  - Highlight new documents (by createdAt or metadata flag)

**Future Enhancements (v1.2):**

- In-wizard editing: Edit title/content before save
- Custom folder path: User selects destination folder
- Auto-linking: Link generated docs to related goals/tasks

### Learnings from Previous Stories

**From Story 3-4 (Conversation History UI):**

- Composable API pattern for state management
- Unified api client usage
- Component test structure with Vuetify mocks

**From Story 2-4 (Generate Task Templates UI):**

- Two-component pattern: Wizard + Card child
- Loading state management
- Error handling and user messages

**From Story 4-2 (Document Summarization UI):**

- Copy to clipboard feature (reusable for document content)
- Character counter pattern
- Responsive layout with Vuetify grid

**New Patterns for Story 4-4:**

- Multi-step wizard with v-stepper
- Polling-based progress tracking (interval management)
- Partial success handling (some docs succeed, some fail)
- Auto-advance between steps (step 2 → 3 on completion)

**Testing Patterns:**

- Mock setInterval/clearInterval in composable tests
- Test polling lifecycle (start → update → stop)
- Test auto-advance logic (step transition)
- Integration test: Full wizard flow (step 1 → 4)

### References

- [Tech Spec: Epic 4](./tech-spec-epic-4.md) - Section 2.4 Frontend Architecture, 2.5 Data Flow
- [Story 4.3](./4-3-knowledge-generation-backend.md) - Backend API contract
- [Epics: Story 4.4](../epics.md#story-44-knowledge-generation-ui)
- [Architecture: Web](../architecture-web.md) - Component patterns
- [Story 3-4](./3-4-conversation-history-ui.md) - Composable pattern example
- [Story 2-4](./2-4-generate-task-templates-ui.md) - UI wizard patterns

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/4-4-knowledge-generation-ui.context.xml`

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled after implementation_

### File List

_To be filled after implementation_
