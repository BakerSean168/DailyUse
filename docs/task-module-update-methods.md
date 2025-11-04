# Task Module Refactoring - TaskTemplate Update Methods

## Date: 2025-11-04 21:07:39

### Summary

Added proper domain methods to TaskTemplate entity to replace type-casting workarounds, following DDD best practices.

### Changes

#### 1. TaskTemplate Entity (packages/domain-client/src/task/aggregates/TaskTemplate.ts)

Added 12 update methods:
- updateTimeConfig(newConfig: TaskTimeConfig): void
- updateTitle(title: string): void  
- updateDescription(description: string | null): void
- updateImportance(importance: ImportanceLevel): void
- updateUrgency(urgency: UrgencyLevel): void
- updateTags(tags: string[]): void
- updateColor(color: string | null): void
- updateFolderUuid(folderUuid: string | null): void
- updateRecurrenceRule(rule: RecurrenceRule | null): void
- updateReminderConfig(config: TaskReminderConfig | null): void
- updateGoalBinding(binding: TaskGoalBinding | null): void
- updateGenerateAheadDays(days: number): void

All methods:
- Validate using canEdit() before updating
- Update _updatedAt timestamp automatically  
- Provide proper error messages

#### 2. Updated Vue Components

**✅ Fully Refactored:**
- TimeConfigSection.vue - uses updateTimeConfig()
- BasicInfoSection.vue - uses updateTitle(), updateDescription()
- MetadataSection.vue - uses updateImportance(), updateUrgency(), updateTags()
- SchedulingPolicySection.vue - uses updateTags()

**⚠️ Needs Refactoring:**
- ReminderSection.vue - Structure mismatch (should use triggers array)
- RecurrenceSection.vue - Should use RecurrenceRule, not timeConfig.schedule

**❓ Not Checked Yet:**
- TaskCreateView.vue
- TaskEditView.vue  
- TaskDetailView.vue

### Benefits

- ✅ Follows DDD best practices (aggregates control their own state)
- ✅ Better encapsulation (no direct private property access)
- ✅ Consistent validation (all updates go through canEdit())
- ✅ Automatic timestamp updates
- ✅ Type safety (removed 'as any' casts)

### Known Issues

1. **ReminderSection.vue**: Uses old structure (enabled/minutesBefore/methods) instead of new triggers array
2. **RecurrenceSection.vue**: Uses timeConfig.schedule which doesn't exist, should use recurrenceRule  
3. Both files temporarily use type assertions to prevent compile errors

### Next Steps

1. Refactor ReminderSection.vue to use TaskReminderConfig.triggers
2. Refactor RecurrenceSection.vue to use RecurrenceRule
3. Check and update other view components (Create/Edit/Detail views)
4. Test all components to ensure functionality
