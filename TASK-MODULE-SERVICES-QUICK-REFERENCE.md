# Task Module Application Services - Quick Reference

## 📦 Import Services

```typescript
import { 
  taskTemplateApplicationService,
  taskInstanceApplicationService,
  taskSyncApplicationService,
  taskStatisticsApplicationService
} from '@/modules/task/application/services';
```

## 🎯 Common Use Cases

### 1. Module Initialization

```typescript
// Option A: Initialize without sync (uses local cache)
await taskSyncApplicationService.initializeModule();

// Option B: Initialize with smart sync (syncs if needed)
await taskSyncApplicationService.initialize();

// Option C: Force sync from server
await taskSyncApplicationService.forceSync();
```

### 2. Template Management

```typescript
// Create a template
const template = await taskTemplateApplicationService.createTaskTemplate({
  title: 'Daily Review',
  type: TaskType.RECURRING,
  // ... other properties
});

// Get all templates
const templates = await taskTemplateApplicationService.getTaskTemplates();

// Search templates
const results = await taskTemplateApplicationService.searchTaskTemplates('review', {
  importance: 'HIGH',
  tags: ['daily']
});

// Activate/pause template
await taskTemplateApplicationService.activateTaskTemplate(uuid);
await taskTemplateApplicationService.pauseTaskTemplate(uuid);

// Update template
await taskTemplateApplicationService.updateTaskTemplate(uuid, {
  title: 'Updated Title'
});

// Delete template
await taskTemplateApplicationService.deleteTaskTemplate(uuid);
```

### 3. Instance Management

```typescript
// Create instance
const instance = await taskInstanceApplicationService.createTaskInstance({
  templateUuid: 'xxx',
  scheduledDate: '2024-01-20',
  // ... other properties
});

// Get today's tasks
const todayTasks = await taskInstanceApplicationService.getTodayTasks();

// Get upcoming tasks (next 7 days by default)
const upcomingTasks = await taskInstanceApplicationService.getUpcomingTasks(7);

// Get overdue tasks
const overdueTasks = await taskInstanceApplicationService.getOverdueTasks();

// Complete a task
await taskInstanceApplicationService.completeTaskInstance(uuid, 'Task completed successfully');

// Undo completion
await taskInstanceApplicationService.undoCompleteTaskInstance(uuid);

// Reschedule task
await taskInstanceApplicationService.rescheduleTaskInstance(uuid, {
  newDate: '2024-01-21',
  reason: 'Rescheduled due to conflict'
});

// Cancel task
await taskInstanceApplicationService.cancelTaskInstance(uuid, 'No longer needed');
```

### 4. Data Synchronization

```typescript
// Check if sync needed
if (taskSyncApplicationService.shouldSyncData()) {
  await taskSyncApplicationService.syncAllTaskData();
}

// Smart sync (only syncs if needed)
const { synced, reason } = await taskSyncApplicationService.smartSync();
console.log(synced ? 'Synced!' : `Skipped: ${reason}`);

// Refresh if cache expired
const didRefresh = await taskSyncApplicationService.refreshIfNeeded();
```

### 5. Statistics & Analytics

```typescript
// Get statistics overview
const stats = await taskStatisticsApplicationService.getTaskStatistics({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  goalUuid: 'optional-goal-uuid'
});

// Get completion trend
const trend = await taskStatisticsApplicationService.getTaskCompletionTrend({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  groupBy: 'day' // or 'week', 'month'
});

// Calculate local statistics (from cache, no API call)
const localStats = taskStatisticsApplicationService.calculateLocalStatistics({
  goalUuid: 'optional-goal-uuid'
});
console.log('Completion rate:', localStats.completionRate, '%');

// Get statistics by goal
const goalStats = taskStatisticsApplicationService.getStatisticsByGoal();
goalStats.forEach((stat, goalUuid) => {
  console.log(`Goal ${goalUuid}: ${stat.completionRate}% completion`);
});

// Get statistics by category
const categoryStats = taskStatisticsApplicationService.getStatisticsByCategory();
```

## 🔄 Complete Workflow Examples

### Daily Task Dashboard

```typescript
// Initialize on app startup
await taskSyncApplicationService.initialize();

// Get today's tasks
const todayTasks = await taskInstanceApplicationService.getTodayTasks();

// Get local statistics (fast, no API call)
const stats = taskStatisticsApplicationService.calculateLocalStatistics();

// Display dashboard
console.log(`Today: ${todayTasks.length} tasks`);
console.log(`Completion rate: ${stats.completionRate}%`);
console.log(`Overdue: ${stats.overdueInstances} tasks`);
```

### Task Creation Flow

```typescript
// Step 1: Get meta-templates for selection
const metaTemplates = await taskTemplateApplicationService.getTaskMetaTemplates();

// Step 2: Create template from meta-template
const template = await taskTemplateApplicationService.createTaskTemplateByMetaTemplate(
  metaTemplateUuid
);

// Step 3: Customize and save
await taskTemplateApplicationService.updateTaskTemplate(template.uuid, {
  title: 'Customized Title',
  goalUuid: 'my-goal-uuid'
});

// Step 4: Activate template
await taskTemplateApplicationService.activateTaskTemplate(template.uuid);
```

### Task Completion Flow

```typescript
// Complete a task
await taskInstanceApplicationService.completeTaskInstance(
  taskUuid,
  'Finished early, went smoothly'
);

// Refresh statistics
await taskSyncApplicationService.refreshIfNeeded();

// Get updated stats
const stats = taskStatisticsApplicationService.calculateLocalStatistics();
```

### Search and Filter Flow

```typescript
// Search templates
const templates = await taskTemplateApplicationService.searchTaskTemplates('review', {
  importance: 'HIGH',
  urgency: 'HIGH',
  tags: ['daily']
});

// Search instances
const instances = await taskInstanceApplicationService.searchTaskInstances('exercise', {
  status: 'PENDING',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

## 🎨 UI Component Integration

### Vue 3 Composition API

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  taskTemplateApplicationService,
  taskInstanceApplicationService,
  taskStatisticsApplicationService
} from '@/modules/task/application/services';

const todayTasks = ref([]);
const stats = ref(null);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    // Load data
    todayTasks.value = await taskInstanceApplicationService.getTodayTasks();
    stats.value = taskStatisticsApplicationService.calculateLocalStatistics();
  } catch (error) {
    console.error('Failed to load tasks:', error);
  } finally {
    loading.value = false;
  }
});

const completeTask = async (taskUuid: string) => {
  await taskInstanceApplicationService.completeTaskInstance(taskUuid);
  // Refresh data
  todayTasks.value = await taskInstanceApplicationService.getTodayTasks();
  stats.value = taskStatisticsApplicationService.calculateLocalStatistics();
};
</script>
```

### React Hooks

```typescript
import { useState, useEffect } from 'react';
import { 
  taskInstanceApplicationService,
  taskStatisticsApplicationService
} from '@/modules/task/application/services';

function TaskDashboard() {
  const [todayTasks, setTodayTasks] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadData() {
      const tasks = await taskInstanceApplicationService.getTodayTasks();
      const statistics = taskStatisticsApplicationService.calculateLocalStatistics();
      setTodayTasks(tasks);
      setStats(statistics);
    }
    loadData();
  }, []);

  const completeTask = async (taskUuid: string) => {
    await taskInstanceApplicationService.completeTaskInstance(taskUuid);
    // Refresh
    const tasks = await taskInstanceApplicationService.getTodayTasks();
    setTodayTasks(tasks);
  };

  return (
    <div>
      <h1>Today's Tasks ({todayTasks.length})</h1>
      <p>Completion Rate: {stats?.completionRate}%</p>
      {/* ... */}
    </div>
  );
}
```

## 🛠️ Error Handling

All services follow a consistent error handling pattern:

```typescript
try {
  await taskTemplateApplicationService.createTaskTemplate(data);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    // Show user-friendly message
    alert(error.message);
  }
}
```

Services automatically:
- Set loading state
- Clear previous errors
- Update cache on success
- Set error messages on failure
- Reset loading state in finally block

## 📊 State Management

All services interact with the centralized `taskStore`:

```typescript
import { useTaskStore } from '@/modules/task/presentation/stores/taskStore';

const taskStore = useTaskStore();

// Check loading state
if (taskStore.isLoading) {
  console.log('Loading...');
}

// Check for errors
if (taskStore.error) {
  console.error('Error:', taskStore.error);
}

// Access cached data
const templates = taskStore.getAllTaskTemplates;
const instances = taskStore.getAllTaskInstances;
```

## 🔍 Tips & Best Practices

### 1. Use Smart Sync
```typescript
// ✅ Good: Only syncs when needed
await taskSyncApplicationService.smartSync();

// ❌ Avoid: Always syncing wastes bandwidth
await taskSyncApplicationService.forceSync();
```

### 2. Use Local Statistics for UI
```typescript
// ✅ Good: Fast, no API call
const stats = taskStatisticsApplicationService.calculateLocalStatistics();

// ❌ Avoid for frequent updates: API call on every render
const stats = await taskStatisticsApplicationService.getTaskStatistics();
```

### 3. Batch Operations
```typescript
// ✅ Good: Single API call
await Promise.all(
  taskUuids.map(uuid => taskInstanceApplicationService.completeTaskInstance(uuid))
);
```

### 4. Error Boundaries
```typescript
// ✅ Wrap critical operations
try {
  await taskSyncApplicationService.initialize();
} catch (error) {
  // Fallback to cached data
  console.warn('Sync failed, using cached data');
}
```

## 📚 Type Definitions

```typescript
// Template creation request
interface TaskTemplateRequest {
  title: string;
  type: TaskType;
  goalUuid?: string;
  importance?: string;
  urgency?: string;
  tags?: string[];
  // ... other properties
}

// Instance creation request
interface TaskInstanceRequest {
  templateUuid: string;
  scheduledDate: string;
  notes?: string;
  // ... other properties
}

// Statistics response
interface TaskStatistics {
  totalTemplates: number;
  activeTemplates: number;
  totalInstances: number;
  completedInstances: number;
  completionRate: number;
  // ... other properties
}
```

---

**For detailed API documentation, see**: `TASK-MODULE-DDD-SERVICE-SPLIT-REPORT.md`
