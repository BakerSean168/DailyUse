# Story 2.4: Generate Task Templates UI

Status: drafted

## Story

As a User,
I want to generate and import tasks into my plan,
So that I save time on planning.

## Acceptance Criteria

### Functional Criteria

1. **AC-1**: "Generate Tasks" button visible in KeyResult detail view
2. **AC-2**: Click button opens TaskAIGenerationDialog
3. **AC-3**: Dialog shows loading indicator during generation
4. **AC-4**: Generated tasks displayed in checklist with title, hours, priority
5. **AC-5**: User can check/uncheck tasks for import
6. **AC-6**: User can edit task fields (title, hours, priority, description)
7. **AC-7**: "Import Selected" creates TaskTemplate entities (batch API call)
8. **AC-8**: Success message shows "7 tasks imported" (count)
9. **AC-9**: Dialog closes, navigates to Task list view

### UX Criteria

10. **AC-10**: Tasks sorted by priority (HIGH → MEDIUM → LOW) by default
11. **AC-11**: Estimated hours displayed with icon (🕒 8 hours)
12. **AC-12**: Priority displayed with color badges (red/yellow/blue)
13. **AC-13**: Batch import shows progress indicator if > 5 tasks

### Technical Criteria

14. **AC-14**: Uses `useAIGeneration` composable
15. **AC-15**: Batch create via `TaskTemplateApplicationService.createBatch()`
16. **AC-16**: Updates `taskStore` after import
17. **AC-17**: Error handling with snackbar
18. **AC-18**: Component unit tests pass
19. **AC-19**: Zero console errors

## Tasks / Subtasks

- [x] **Task 1**: Extend useAIGeneration Composable (AC: 14, 17)
  - [x] Add `generateTasks()` method to `useAIGeneration.ts`
  - [x] Call TaskApiClient.generateTasks(request)
  - [x] Add loading state (ref: isGeneratingTasks)
  - [x] Add error handling with useMessage
  - [x] Return { generateTasks, isGeneratingTasks, tasksError }

- [x] **Task 2**: Create TaskApiClient Method (AC: 14)
  - [x] Add `generateTasks(request: GenerateTasksRequest)` to TaskApiClient
  - [x] POST to `/api/ai/generate/tasks`
  - [x] Parse response to `GenerateTasksResponse`
  - [x] Handle HTTP errors (429, 504, 400, 500)

- [x] **Task 3**: Create TaskAIGenerationDialog Component (AC: 2-9, 11-13)
  - [x] Create `TaskAIGenerationDialog.vue` in `apps/web/src/modules/task/presentation/components`
  - [x] Props:
    - `modelValue: boolean` (dialog visibility)
    - `keyResultTitle: string`
    - `keyResultDescription?: string`
    - `targetValue: number`
    - `currentValue: number`
    - `unit?: string`
    - `timeRemaining: number` (days until Goal end date)
  - [x] Emit: `update:modelValue`, `tasksImported: number`
  - [x] Use v-dialog for modal
  - [x] Loading state: v-progress-circular + "Generating tasks with AI..."
  - [x] Success state: v-alert with checkmark + "10 tasks generated"
  - [x] Task list: v-list with v-list-item for each task
  - [x] Each item: v-checkbox + task details (title, hours, priority, description)
  - [x] Inline editing: v-text-field for title, v-text-field type=number for hours, v-select for priority
  - [x] Priority badges: v-chip with color (red=HIGH, amber=MEDIUM, blue=LOW)
  - [x] Hours display: v-icon(mdi-clock-outline) + "8 hours"
  - [x] "Import Selected" button (disabled if none selected)
  - [x] Progress indicator: v-progress-linear if importing > 5 tasks

- [x] **Task 4**: Implement Priority Sorting (AC: 10)
  - [x] Sort tasks by priority on load: HIGH → MEDIUM → LOW
  - [x] Maintain sort order when user edits priority
  - [x] Use computed property for sorted tasks

- [x] **Task 5**: Integrate Button into KeyResult Detail View (AC: 1)
  - [x] Add "Generate Tasks" button in KeyResultDetailView.vue
  - [x] Icon: mdi-creation or mdi-plus-box-multiple
  - [x] Button text: "✨ Generate Tasks"
  - [x] Position: Below KR details, above task list
  - [x] Click handler: Open TaskAIGenerationDialog with KR data

- [x] **Task 6**: Implement Batch Task Import (AC: 7, 15, 16)
  - [x] On "Import Selected", collect selected TaskTemplatePreview[]
  - [x] Convert each TaskTemplatePreview to TaskTemplateClient DTO:
    - Add accountUuid, goalUuid, keyResultUuid
    - Generate temporary UUID (client-side)
    - Set status: PENDING
  - [x] Call TaskApiClient.createBatch(tasks) or individual creates in parallel
  - [x] Update taskStore with new tasks (taskStore.addTasks(tasks))
  - [x] Show progress: v-progress-linear with percentage (count/total \* 100)
  - [x] On success: Show snackbar "7 tasks imported", emit tasksImported event
  - [x] Close dialog

- [x] **Task 7**: Handle Import Errors (AC: 17)
  - [x] Partial failure handling:
    - If 5/7 tasks succeed, show: "5 tasks imported. 2 failed."
    - Option: Retry failed tasks
  - [x] Network error: "Import failed. Please check connection."
  - [x] Validation error: "Invalid task data. Please review and try again."
  - [x] Quota exceeded: "Daily quota exceeded. Resets in X hours."

- [x] **Task 8**: Navigate to Task List After Import (AC: 9)
  - [x] After successful import, router.push('/tasks') or router.push(`/goals/${goalUuid}/tasks`)
  - [x] Highlight newly imported tasks (temporary highlight class, fade after 2s)
  - [x] Auto-scroll to first imported task

- [x] **Task 9**: Error Handling UI (AC: 17)
  - [x] 429 Quota Exceeded: Show quota error snackbar with reset time
  - [x] 504 Timeout: Show timeout error with retry button
  - [x] 400 Bad Request: Show validation message
  - [x] 500 Server Error: Show generic error with support link

- [x] **Task 10**: Unit Tests (AC: 18, 19)
  - [x] Test TaskAIGenerationDialog.vue:
    - Renders with props
    - Opens/closes on modelValue
    - Shows loading state
    - Displays task list after generation
    - Priority sorting works (HIGH first)
    - Inline editing updates task data
    - Emits tasksImported on import
  - [x] Test useAIGeneration.generateTasks():
    - Mock API client
    - Happy path returns tasks
    - Error scenarios handled (429, 504, 500)

- [x] **Task 11**: E2E Test (AC: 1-9, 19)
  - [x] Test full flow:
    - Navigate to Goal detail page
    - Click on a Key Result
    - Click "Generate Tasks" button
    - Wait for dialog to show 5-10 tasks
    - Check 7 tasks
    - Edit 1 task title and hours
    - Click "Import Selected"
    - Wait for progress indicator
    - Verify "7 tasks imported" message
    - Verify navigation to task list
    - Verify 7 tasks visible with correct KR binding
  - [x] Assert zero console errors during flow

## Dev Notes

### Technical Context

- **Location**:
  - Component: `apps/web/src/modules/task/presentation/components/TaskAIGenerationDialog.vue`
  - Composable: `apps/web/src/modules/goal/presentation/composables/useAIGeneration.ts` (extend)
  - API Client: `apps/web/src/modules/task/infrastructure/api/TaskApiClient.ts`
  - Store: `apps/web/src/modules/task/presentation/stores/taskStore.ts`
  - View: `apps/web/src/modules/goal/presentation/views/KeyResultDetailView.vue` (add button)

- **Dependencies**:
  - Vuetify 3 components (v-dialog, v-list, v-checkbox, v-text-field, v-select, v-chip, v-progress-linear, v-progress-circular)
  - Vue 3 Composition API (ref, computed, watch)
  - Pinia stores (taskStore, goalStore)
  - useMessage composable
  - TaskApiClient

- **UI Framework**: Vuetify 3 Material Design

- **State Management**:
  - Local: Dialog visibility, selected tasks, edited tasks, import progress
  - Global (Pinia taskStore): TaskTemplate collection

### Architecture Alignment

- **DDD Frontend Layers**:
  - Presentation: Vue components (TaskAIGenerationDialog, KeyResultDetailView)
  - Application: Pinia stores (taskStore)
  - Infrastructure: API clients (TaskApiClient)
  - Domain: Client-side entities (TaskTemplateClient)

- **Component Communication**:
  - Parent (KeyResultDetailView) → Dialog (props: KR data)
  - Dialog → Parent (emit: tasksImported count)
  - Dialog → Store (taskStore.addTasks)
  - Dialog → Router (navigate to /tasks)

### UX Design Notes

**Dialog Layout:**

```
┌──────────────────────────────────────────────┐
│ Generate Tasks for Key Result            [X] │
├──────────────────────────────────────────────┤
│                                              │
│ [Spinner] Generating tasks with AI...       │  (Loading)
│                                              │
│ ✓ 8 tasks generated                          │  (Success)
│                                              │
│ ☑ [HIGH] Audit Current Bug Backlog          │
│   🕒 8 hours                                  │
│   [Edit title] [Edit hours] [Edit priority]  │
│                                              │
│ ☐ [MEDIUM] Implement Bug Categorization     │
│   🕒 12 hours                                 │
│                                              │
│ ... (6 more tasks)                           │
│                                              │
│ [Progress: ████████░░ 80%]                   │  (Importing)
│                                              │
├──────────────────────────────────────────────┤
│         [Cancel] [Import Selected (7)]       │
└──────────────────────────────────────────────┘
```

**Priority Colors:**

- HIGH: red (v-chip color="error")
- MEDIUM: amber (v-chip color="warning")
- LOW: blue (v-chip color="info")

**Error States:**

- Quota Exceeded: Orange snackbar with timer
- Timeout: Red snackbar with retry button
- Partial Import: Info snackbar with counts

### Batch Import Strategy

**Options:**

1. **Sequential Batch** (Recommended):
   - Single API call: `POST /api/tasks/batch` with array of tasks
   - Backend handles transaction
   - All-or-nothing or partial success with rollback

2. **Parallel Individual** (Fallback):
   - Multiple `POST /api/tasks` in parallel (Promise.all)
   - Handle partial failures individually
   - More resilient but slower

**Implementation Decision**:

- Check if backend supports `/api/tasks/batch` endpoint
- If yes, use batch (Task 6)
- If no, use parallel individual creates with progress tracking

### Learnings from Previous Stories

**From Story 2-2-generate-key-results-ui:**

- **Reusable Components**:
  - useAIGeneration composable pattern (extend for tasks)
  - Dialog layout structure (loading, success, error states)
  - Inline editing with Vuetify v-text-field
  - Error handling with snackbar
  - Progress indicators for async operations

- **API Integration Pattern**:
  - ApiClient method pattern (generateKeyResults → generateTasks)
  - Request/Response DTO handling
  - HTTP error mapping to user-friendly messages
  - Loading state management

- **Store Integration**:
  - goalStore.addKeyResult() pattern → taskStore.addTasks()
  - Batch operations handling
  - Optimistic UI updates

**From Story 2-3-generate-task-templates-backend:**

- **API Contract**:
  - Request: `GenerateTasksRequest` (krTitle, krDescription, targetValue, currentValue, unit, timeRemaining)
  - Response: `GenerateTasksResponse` (tasks: TaskTemplatePreview[], tokenUsage, generatedAt)
  - Endpoint: `POST /api/ai/generate/tasks`

- **TaskTemplatePreview Structure**:

  ```typescript
  {
    title: string,
    description?: string,
    estimatedHours: number, // 1-40
    priority: TaskPriority, // HIGH | MEDIUM | LOW
    dependencies: string[], // UUIDs or empty
    tags: string[]
  }
  ```

- **Error Responses**: Same as KR generation (429, 504, 400, 500)

- **Performance**: Typical response 10-15 seconds

**Integration Points:**

- Reuse useAIGeneration composable (add generateTasks method)
- Follow goalStore.addKeyResult pattern for taskStore.addTasks
- Reuse error handling and snackbar patterns from Story 2-2

[Sources: /docs/sprint-artifacts/2-2-generate-key-results-ui.md, /docs/sprint-artifacts/2-3-generate-task-templates-backend.md]

### References

- [Tech Spec: Epic 2](./tech-spec-epic-2.md) - UI workflows and design
- [Story 2.3](./2-3-generate-task-templates-backend.md) - Backend API contract
- [Story 2.2](./2-2-generate-key-results-ui.md) - Similar UI pattern
- [Epics: Story 2.4](../epics.md#story-24-generate-task-templates-ui)
- [Architecture: Web](../architecture-web.md) - Vue 3 and Pinia patterns

## Dev Agent Record

### Context Reference

- [2-4-generate-task-templates-ui.context.xml](./2-4-generate-task-templates-ui.context.xml)

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation_
