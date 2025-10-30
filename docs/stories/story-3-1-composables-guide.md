# Story 3.1 - ONE_TIME 任务 Composables 使用指南

## 📋 概述

为 ONE_TIME 任务功能创建了 3 个 Vue 3 Composables，遵循 Composition API 最佳实践，提供响应式的状态管理和操作接口。

## 📦 Composables 列表

### 1. useOneTimeTask - 任务管理
**文件**: `useOneTimeTask.ts`  
**职责**: 一次性任务的 CRUD 操作和状态管理  
**代码行数**: 460+ 行

### 2. useTaskDashboard - 仪表板
**文件**: `useTaskDashboard.ts`  
**职责**: 任务仪表板数据和统计  
**代码行数**: 200+ 行

### 3. useTaskBatchOperations - 批量操作
**文件**: `useTaskBatchOperations.ts`  
**职责**: 批量任务选择和批量操作  
**代码行数**: 280+ 行

---

## 🎯 1. useOneTimeTask - 任务管理

### 基本用法

```vue
<script setup lang="ts">
import { useOneTimeTask } from '@/modules/task';

const {
  // 计算属性
  oneTimeTasks,
  pendingTasks,
  inProgressTasks,
  completedTasks,
  
  // 状态
  isLoading,
  error,
  
  // 操作方法
  createOneTimeTask,
  startTask,
  completeTask,
  fetchTodayTasks,
} = useOneTimeTask();

// 创建任务
async function handleCreateTask() {
  await createOneTimeTask({
    accountUuid: user.value.uuid,
    title: '完成季度报告',
    startDate: Date.now(),
    dueDate: Date.now() + 7 * 86400000,
    importance: 4,
    urgency: 3,
    tags: ['报告', 'Q1'],
  });
}

// 加载今日任务
onMounted(() => {
  fetchTodayTasks();
});
</script>

<template>
  <div>
    <div v-if="isLoading">加载中...</div>
    <div v-if="error">{{ error }}</div>
    
    <div v-for="task in todayTasks" :key="task.uuid">
      <TaskCard :task="task" @complete="completeTask(task.uuid)" />
    </div>
  </div>
</template>
```

### API 详解

#### 计算属性（响应式）

```typescript
// 任务列表
oneTimeTasks        // 所有一次性任务
pendingTasks        // 待执行的任务
inProgressTasks     // 进行中的任务
completedTasks      // 已完成的任务
blockedTasks        // 被阻塞的任务
canceledTasks       // 已取消的任务

// 按维度分组
tasksByGoal(goalUuid)           // 按目标分组
tasksByKeyResult(keyResultUuid) // 按关键结果分组
tasksByPriority                 // 按优先级分组 {HIGH, MEDIUM, LOW}

// 状态
isLoading           // 是否加载中
error               // 错误信息
```

#### 生命周期操作

```typescript
// 创建
await createOneTimeTask(request: CreateOneTimeTaskRequest)
await createSubtask(parentUuid: string, request: CreateOneTimeTaskRequest)

// 状态转换
await startTask(uuid: string)
await completeTask(uuid: string)
await blockTask(uuid: string, reason?: string)
await unblockTask(uuid: string)
await cancelTask(uuid: string, reason?: string)
```

#### 查询操作

```typescript
// 场景查询
await fetchTodayTasks()                    // 今日任务
await fetchOverdueTasks()                  // 逾期任务
await fetchUpcomingTasks(days?: number)    // 即将到期（默认7天）
await fetchTasksByPriority(limit?: number) // 高优先级任务

// 条件查询
await fetchOneTimeTasks(filters?: TaskFiltersRequest)
await fetchBlockedTasks()
await fetchTasksByDateRange(startDate, endDate)
await fetchTasksByTags(tags: string[])
await fetchTasksByGoal(goalUuid: string)
await fetchTasksByKeyResult(keyResultUuid: string)
await fetchSubtasks(parentUuid: string)
```

#### 目标关联

```typescript
await linkToGoal(uuid, goalUuid, keyResultUuid?)
await unlinkFromGoal(uuid)
```

#### 辅助方法

```typescript
findTaskByUuid(uuid)           // 查找任务
canStartTask(task)             // 是否可开始
canCompleteTask(task)          // 是否可完成
canCancelTask(task)            // 是否可取消
isTaskOverdue(task)            // 是否逾期
getDaysUntilDue(task)          // 剩余天数
clearError()                   // 清除错误
```

### 完整示例：任务列表页

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useOneTimeTask } from '@/modules/task';

const {
  pendingTasks,
  inProgressTasks,
  completedTasks,
  isLoading,
  error,
  startTask,
  completeTask,
  fetchOneTimeTasks,
  isTaskOverdue,
  getDaysUntilDue,
} = useOneTimeTask();

const selectedFilter = ref<'all' | 'pending' | 'in-progress' | 'completed'>('all');

onMounted(async () => {
  await fetchOneTimeTasks();
});

async function handleStartTask(uuid: string) {
  try {
    await startTask(uuid);
  } catch (err) {
    console.error('开始任务失败:', err);
  }
}

async function handleCompleteTask(uuid: string) {
  try {
    await completeTask(uuid);
  } catch (err) {
    console.error('完成任务失败:', err);
  }
}
</script>

<template>
  <div class="task-list-page">
    <h1>我的任务</h1>
    
    <!-- 过滤器 -->
    <div class="filters">
      <button @click="selectedFilter = 'all'">全部</button>
      <button @click="selectedFilter = 'pending'">
        待执行 ({{ pendingTasks.length }})
      </button>
      <button @click="selectedFilter = 'in-progress'">
        进行中 ({{ inProgressTasks.length }})
      </button>
      <button @click="selectedFilter = 'completed'">
        已完成 ({{ completedTasks.length }})
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>
    
    <!-- 任务列表 -->
    <div v-if="selectedFilter === 'pending'" class="task-group">
      <h2>待执行任务</h2>
      <div v-for="task in pendingTasks" :key="task.uuid" class="task-card">
        <h3>{{ task.title }}</h3>
        <p>{{ task.description }}</p>
        <div class="task-meta">
          <span v-if="isTaskOverdue(task)" class="overdue">
            逾期 {{ Math.abs(getDaysUntilDue(task) || 0) }} 天
          </span>
          <span v-else-if="getDaysUntilDue(task) !== null">
            剩余 {{ getDaysUntilDue(task) }} 天
          </span>
          <span class="priority">优先级: {{ task.priority?.level }}</span>
        </div>
        <button @click="handleStartTask(task.uuid)">开始</button>
      </div>
    </div>
    
    <div v-if="selectedFilter === 'in-progress'" class="task-group">
      <h2>进行中任务</h2>
      <div v-for="task in inProgressTasks" :key="task.uuid" class="task-card">
        <h3>{{ task.title }}</h3>
        <button @click="handleCompleteTask(task.uuid)">完成</button>
      </div>
    </div>
  </div>
</template>
```

---

## 📊 2. useTaskDashboard - 仪表板

### 基本用法

```vue
<script setup lang="ts">
import { useTaskDashboard } from '@/modules/task';

const {
  // 统计数据
  todayTasksCount,
  overdueTasksCount,
  upcomingTasksCount,
  completionRate,
  statusSummary,
  
  // 状态标志
  hasOverdueTasks,
  needsAttention,
  
  // 操作
  refresh,
  startAutoRefresh,
} = useTaskDashboard();

// 启动自动刷新（每60秒）
onMounted(() => {
  startAutoRefresh(60);
});
</script>

<template>
  <div class="dashboard">
    <div class="stats-card">
      <h3>今日任务</h3>
      <div class="stat-value">{{ todayTasksCount }}</div>
    </div>
    
    <div class="stats-card" :class="{ warning: hasOverdueTasks }">
      <h3>逾期任务</h3>
      <div class="stat-value">{{ overdueTasksCount }}</div>
    </div>
    
    <div class="stats-card">
      <h3>完成率</h3>
      <div class="stat-value">{{ completionRate }}%</div>
    </div>
    
    <div v-if="needsAttention" class="alert">
      需要关注：有逾期或高优先级任务！
    </div>
  </div>
</template>
```

### API 详解

#### 统计数据（响应式）

```typescript
todayTasksCount           // 今日任务数
overdueTasksCount         // 逾期任务数
upcomingTasksCount        // 即将到期数
highPriorityTasksCount    // 高优先级数
totalTasksCount           // 总任务数
completedTodayCount       // 今日完成数
completionRate            // 完成率（百分比）
statusSummary             // 状态摘要对象
```

#### 状态标志

```typescript
hasOverdueTasks           // 是否有逾期
hasHighPriorityTasks      // 是否有高优先级
needsAttention            // 是否需要关注
isDataLoaded              // 数据是否已加载
secondsSinceUpdate        // 距上次更新秒数
```

#### 操作方法

```typescript
await loadDashboard()              // 加载数据
await refresh()                    // 刷新数据
startAutoRefresh(seconds)          // 启动自动刷新
stopAutoRefresh()                  // 停止自动刷新
clearError()                       // 清除错误
```

### 完整示例：仪表板页面

```vue
<script setup lang="ts">
import { useTaskDashboard } from '@/modules/task';

const {
  dashboardData,
  statusSummary,
  completionRate,
  hasOverdueTasks,
  hasHighPriorityTasks,
  needsAttention,
  isLoading,
  lastUpdated,
  refresh,
  startAutoRefresh,
  stopAutoRefresh,
} = useTaskDashboard();

onMounted(() => {
  startAutoRefresh(60); // 每分钟自动刷新
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div class="dashboard-page">
    <header>
      <h1>任务仪表板</h1>
      <button @click="refresh" :disabled="isLoading">
        <Icon name="refresh" />
        刷新
      </button>
    </header>
    
    <!-- 关键指标 -->
    <div class="key-metrics">
      <div class="metric-card">
        <div class="metric-label">今日任务</div>
        <div class="metric-value">{{ statusSummary.today }}</div>
      </div>
      
      <div class="metric-card" :class="{ alert: hasOverdueTasks }">
        <div class="metric-label">逾期任务</div>
        <div class="metric-value">{{ statusSummary.overdue }}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">即将到期</div>
        <div class="metric-value">{{ statusSummary.upcoming }}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">完成率</div>
        <div class="metric-value">{{ statusSummary.completionRate }}%</div>
        <progress :value="completionRate" max="100"></progress>
      </div>
    </div>
    
    <!-- 任务列表预览 -->
    <div class="task-previews">
      <div class="preview-section">
        <h2>今日任务</h2>
        <TaskList :tasks="dashboardData?.todayTasks || []" />
      </div>
      
      <div v-if="hasOverdueTasks" class="preview-section alert">
        <h2>逾期任务</h2>
        <TaskList :tasks="dashboardData?.overdueTasks || []" />
      </div>
      
      <div v-if="hasHighPriorityTasks" class="preview-section">
        <h2>高优先级任务</h2>
        <TaskList :tasks="dashboardData?.highPriorityTasks || []" />
      </div>
    </div>
    
    <footer>
      <small>最后更新: {{ new Date(lastUpdated).toLocaleString() }}</small>
    </footer>
  </div>
</template>
```

---

## 🔄 3. useTaskBatchOperations - 批量操作

### 基本用法

```vue
<script setup lang="ts">
import { useTaskBatchOperations, useOneTimeTask } from '@/modules/task';

const { pendingTasks } = useOneTimeTask();

const {
  selectedCount,
  hasSelection,
  toggleTaskSelection,
  isTaskSelected,
  batchUpdatePriority,
  batchCancelTasks,
  clearSelection,
} = useTaskBatchOperations();

async function handleBatchUpdatePriority() {
  const result = await batchUpdatePriority(4, 3);
  if (result.success) {
    alert(`成功更新 ${result.affectedCount} 个任务`);
  }
}
</script>

<template>
  <div>
    <!-- 批量操作栏 -->
    <div v-if="hasSelection" class="batch-toolbar">
      <span>已选择 {{ selectedCount }} 个任务</span>
      <button @click="handleBatchUpdatePriority">批量更新优先级</button>
      <button @click="batchCancelTasks('批量取消')">批量取消</button>
      <button @click="clearSelection">清除选择</button>
    </div>
    
    <!-- 任务列表 -->
    <div v-for="task in pendingTasks" :key="task.uuid">
      <input 
        type="checkbox"
        :checked="isTaskSelected(task.uuid)"
        @change="toggleTaskSelection(task.uuid)"
      />
      <span>{{ task.title }}</span>
    </div>
  </div>
</template>
```

### API 详解

#### 选择状态（响应式）

```typescript
selectedTaskUuids        // Set<string> 已选择的UUID集合
selectedCount            // 已选择数量
hasSelection             // 是否有选择
selectedUuids            // 已选择的UUID数组
```

#### 操作状态

```typescript
isOperating              // 是否操作中
isBusy                   // 是否繁忙
operationProgress        // 操作进度 0-100
operationError           // 操作错误
```

#### 选择管理

```typescript
selectTask(uuid)                      // 选择单个
deselectTask(uuid)                    // 取消选择单个
toggleTaskSelection(uuid)             // 切换选择
selectTasks(uuids: string[])          // 批量选择
selectAllTasks(tasks: TaskTemplate[]) // 全选
clearSelection()                      // 清除所有
isTaskSelected(uuid)                  // 检查是否选中
invertSelection(tasks)                // 反选
```

#### 条件选择

```typescript
selectTasksByCondition(tasks, predicate)  // 按条件选择
selectHighPriorityTasks(tasks)            // 选择高优先级
selectOverdueTasks(tasks)                 // 选择逾期任务
selectPendingTasks(tasks)                 // 选择待执行任务
```

#### 批量操作

```typescript
await batchUpdatePriority(importance?, urgency?)  // 批量更新优先级
await batchCancelTasks(reason?)                   // 批量取消
```

### 完整示例：带批量操作的任务列表

```vue
<script setup lang="ts">
import { useTaskBatchOperations, useOneTimeTask } from '@/modules/task';

const { pendingTasks, fetchOneTimeTasks } = useOneTimeTask();

const {
  selectedCount,
  hasSelection,
  selectedUuids,
  isOperating,
  selectTask,
  deselectTask,
  toggleTaskSelection,
  selectAllTasks,
  clearSelection,
  isTaskSelected,
  selectHighPriorityTasks,
  selectOverdueTasks,
  batchUpdatePriority,
  batchCancelTasks,
} = useTaskBatchOperations();

const showBatchMenu = ref(false);

onMounted(() => {
  fetchOneTimeTasks();
});

async function handleBatchUpdatePriority() {
  const importance = prompt('重要性 (1-5):');
  const urgency = prompt('紧急性 (1-5):');
  
  const result = await batchUpdatePriority(
    Number(importance),
    Number(urgency)
  );
  
  if (result.success) {
    alert(`成功更新 ${result.affectedCount} 个任务的优先级`);
  } else {
    alert(`更新失败: ${result.error}`);
  }
}

async function handleBatchCancel() {
  if (!confirm(`确定要取消 ${selectedCount.value} 个任务吗？`)) return;
  
  const reason = prompt('取消原因:');
  const result = await batchCancelTasks(reason || undefined);
  
  if (result.success) {
    alert(`成功取消 ${result.affectedCount} 个任务`);
  }
}
</script>

<template>
  <div class="batch-task-list">
    <!-- 批量操作工具栏 -->
    <div class="toolbar">
      <div class="selection-actions">
        <button @click="selectAllTasks(pendingTasks)">全选</button>
        <button @click="clearSelection" :disabled="!hasSelection">清除</button>
        <button @click="selectHighPriorityTasks(pendingTasks)">
          选择高优先级
        </button>
        <button @click="selectOverdueTasks(pendingTasks)">
          选择逾期任务
        </button>
      </div>
      
      <div v-if="hasSelection" class="batch-actions">
        <span class="selection-info">
          已选择 {{ selectedCount }} 个任务
        </span>
        <button 
          @click="handleBatchUpdatePriority"
          :disabled="isOperating"
        >
          批量更新优先级
        </button>
        <button 
          @click="handleBatchCancel"
          :disabled="isOperating"
          class="danger"
        >
          批量取消
        </button>
      </div>
    </div>
    
    <!-- 任务列表 -->
    <div class="task-list">
      <div
        v-for="task in pendingTasks"
        :key="task.uuid"
        class="task-item"
        :class="{ selected: isTaskSelected(task.uuid) }"
      >
        <input
          type="checkbox"
          :checked="isTaskSelected(task.uuid)"
          @change="toggleTaskSelection(task.uuid)"
        />
        
        <div class="task-content">
          <h3>{{ task.title }}</h3>
          <p>{{ task.description }}</p>
          <div class="task-meta">
            <span class="priority">{{ task.priority?.level }}</span>
            <span v-if="task.dueDate">
              截止: {{ new Date(task.dueDate).toLocaleDateString() }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载遮罩 -->
    <div v-if="isOperating" class="loading-overlay">
      <div class="spinner">处理中...</div>
    </div>
  </div>
</template>

<style scoped>
.batch-task-list {
  position: relative;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.batch-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.selection-info {
  font-weight: bold;
  margin-right: 1rem;
}

.task-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.task-item.selected {
  background-color: #e3f2fd;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

---

## 🎨 最佳实践

### 1. 组合多个 Composables

```vue
<script setup lang="ts">
import { 
  useOneTimeTask, 
  useTaskDashboard,
  useTaskBatchOperations 
} from '@/modules/task';

// 组合使用多个 composables
const taskManager = useOneTimeTask();
const dashboard = useTaskDashboard();
const batchOps = useTaskBatchOperations();

// 可以访问所有功能
const { createOneTimeTask, fetchTodayTasks } = taskManager;
const { todayTasksCount, completionRate } = dashboard;
const { selectedCount, batchUpdatePriority } = batchOps;
</script>
```

### 2. 错误处理

```typescript
const { createOneTimeTask, error, clearError } = useOneTimeTask();

async function handleCreate() {
  try {
    clearError(); // 清除之前的错误
    await createOneTimeTask(formData.value);
    showSuccess('任务创建成功');
  } catch (err) {
    // error 已经被 composable 设置了
    showError(error.value || '创建失败');
  }
}
```

### 3. 性能优化 - 按需加载

```typescript
// 只在需要时获取数据
const { fetchTodayTasks } = useOneTimeTask();

// 路由守卫中加载
onBeforeRouteEnter(async (to, from, next) => {
  await fetchTodayTasks();
  next();
});
```

### 4. 自动刷新仪表板

```typescript
const { startAutoRefresh, stopAutoRefresh } = useTaskDashboard();

// 页面激活时启动
onMounted(() => {
  startAutoRefresh(60); // 每60秒刷新
});

// 页面失活时停止
onUnmounted(() => {
  stopAutoRefresh();
});

// 或使用 vue-router 的钩子
onBeforeRouteLeave(() => {
  stopAutoRefresh();
});
```

---

## 📚 总结

### 创建的文件

1. ✅ `useOneTimeTask.ts` (460+ 行) - 任务管理
2. ✅ `useTaskDashboard.ts` (200+ 行) - 仪表板
3. ✅ `useTaskBatchOperations.ts` (280+ 行) - 批量操作
4. ✅ `index.ts` - 导出配置

### 特性

- ✅ **完全响应式** - 基于 Vue 3 Composition API
- ✅ **类型安全** - 完整的 TypeScript 类型
- ✅ **错误处理** - 统一的错误处理机制
- ✅ **状态管理** - 与 Pinia Store 自动同步
- ✅ **可组合** - 可以组合使用多个 composables
- ✅ **易于测试** - 纯函数，易于单元测试

### 下一步

现在可以基于这些 Composables 创建 UI 组件：

1. **TaskList.vue** - 使用 `useOneTimeTask`
2. **TaskDashboard.vue** - 使用 `useTaskDashboard`
3. **TaskBatchEditor.vue** - 使用 `useTaskBatchOperations`
4. **TaskCard.vue** - 任务卡片组件
5. **TaskForm.vue** - 任务表单组件

---

**文档版本**: v1.0  
**最后更新**: 2025-10-30  
**维护者**: DailyUse Team
